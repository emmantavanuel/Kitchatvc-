import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
// Pass config.firestoreDatabaseId as required for this project
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.warn('[Firestore] Database operation notice:', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Validate connection to Firestore
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'app_state', 'timetable_state'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network connection is limited.');
    }
    return false;
  }
}

/**
 * Load consolidated application state from Firestore or local storage
 */
export async function loadApplicationState(): Promise<any | null> {
  // 1. Direct Cloud Firestore load (Fast, secure Google Cloud direct connection)
  try {
    const docRef = doc(db, 'app_state', 'timetable_state');
    const docSnap: any = await Promise.race([
      getDoc(docRef),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Firestore read timeout')), 4000))
    ]);

    if (docSnap && docSnap.exists()) {
      const docData = docSnap.data();
      if (docData && docData.data) {
        console.log('[Database] Loaded state directly from Firebase Firestore.');
        return docData.data;
      }
    }
  } catch (firestoreErr: any) {
    console.warn('[Database] Direct Firestore read skipped or timed out:', firestoreErr?.message || firestoreErr);
  }

  // 2. Secondary fallback: Check /api/state only if it returns JSON (e.g. when run with Node server)
  try {
    const res = await Promise.race([
      fetch('/api/state'),
      new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('API read timeout')), 2500))
    ]);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (json && json.success && json.state) {
          console.log('[Database] Loaded state from local Express API.');
          return json.state;
        }
      }
    }
  } catch (apiErr) {
    // Expected on static hosting like cPanel
  }

  return null;
}

/**
 * Persist application state directly to Cloud Firestore & Express API if present
 */
export async function saveApplicationState(payload: any): Promise<{ success: boolean; firestoreSaved: boolean; error?: string }> {
  let firestoreSaved = false;
  let firestoreError: string | undefined;

  // 1. Direct Cloud Firestore write
  try {
    const docRef = doc(db, 'app_state', 'timetable_state');
    await Promise.race([
      setDoc(docRef, { data: payload, updatedAt: new Date().toISOString() }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 5000))
    ]);
    firestoreSaved = true;
    console.log('[Database] State saved directly to Firebase Firestore successfully.');
  } catch (err: any) {
    firestoreError = err?.message || String(err);
    console.warn('[Database] Direct Firestore write failed or timed out:', firestoreError);
  }

  // 2. Optional Express /api/state replica if server is running (non-blocking, ignore failure on static hosts)
  fetch('/api/state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {
    // Silent fail on static hosts
  });

  return {
    success: firestoreSaved,
    firestoreSaved,
    error: firestoreError
  };
}
