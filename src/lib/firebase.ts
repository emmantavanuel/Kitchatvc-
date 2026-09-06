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
    return false;
  }
}

// Client-side Firestore backoff tracking to prevent freezes on quota exhaustion
let clientFirestoreBackoffUntil = 0;

/**
 * Load consolidated application state from Firestore or local server API,
 * safely respecting device-local timestamps so newer local edits are never overwritten.
 */
export async function loadApplicationState(localLastUpdated?: string | null): Promise<any | null> {
  let cloudState: any = null;
  let cloudTimestamp: string | null = null;

  // 1. Direct Cloud Firestore load (Fast, secure Google Cloud direct connection)
  try {
    const docRef = doc(db, 'app_state', 'timetable_state');
    const docSnap: any = await Promise.race([
      getDoc(docRef),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Firestore read timeout')), 3000))
    ]);

    if (docSnap && docSnap.exists()) {
      const docData = docSnap.data();
      if (docData && docData.data) {
        cloudState = docData.data;
        cloudTimestamp = docData.updatedAt || null;
        console.log('[Database] Firestore snapshot found. Timestamp:', cloudTimestamp);
      }
    }
  } catch (firestoreErr: any) {
    console.warn('[Database] Direct Firestore read skipped or unavailable:', firestoreErr?.message || firestoreErr);
  }

  // 2. Local Express /api/state fallback if running on Node.js server
  let serverState: any = null;
  let serverTimestamp: string | null = null;
  try {
    const res = await Promise.race([
      fetch('/api/state'),
      new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('API read timeout')), 2000))
    ]);
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        if (json && json.success && json.state) {
          serverState = json.state;
          serverTimestamp = json.updatedAt || null;
          console.log('[Database] Express API snapshot found. Timestamp:', serverTimestamp);
        }
      }
    }
  } catch (apiErr) {
    // Expected on static cPanel hosting
  }

  // Select the freshest between cloud and server
  let bestRemoteState = cloudState;
  let bestRemoteTimestamp = cloudTimestamp;

  if (serverState) {
    if (!bestRemoteState) {
      bestRemoteState = serverState;
      bestRemoteTimestamp = serverTimestamp;
    } else if (serverTimestamp && bestRemoteTimestamp) {
      if (new Date(serverTimestamp).getTime() > new Date(bestRemoteTimestamp).getTime()) {
        bestRemoteState = serverState;
        bestRemoteTimestamp = serverTimestamp;
      }
    }
  }

  // If local device storage has a newer timestamp than the remote database,
  // DO NOT overwrite the user's latest updates with an older snapshot!
  if (localLastUpdated && bestRemoteTimestamp) {
    const localTime = new Date(localLastUpdated).getTime();
    const remoteTime = new Date(bestRemoteTimestamp).getTime();
    if (localTime > remoteTime) {
      console.log(`[Database] Local device data (${localLastUpdated}) is newer than remote database (${bestRemoteTimestamp}). Preserving latest local updates.`);
      return null;
    }
  }

  return bestRemoteState;
}

// Queue for sequential, thread-safe background sync
let isSaveInProgress = false;
let pendingSavePayload: any = null;

/**
 * Persist application state directly to Cloud Firestore & Express API if present.
 * Thread-safe with automatic queueing so rapid successive updates are never lost or corrupted.
 */
export async function saveApplicationState(payload: any): Promise<{
  success: boolean;
  firestoreSaved: boolean;
  serverSaved: boolean;
  isCloudSynced: boolean;
  error?: string;
}> {
  // If a save is already in flight, queue this newest payload and return optimistic success
  if (isSaveInProgress) {
    pendingSavePayload = payload;
    return {
      success: true,
      firestoreSaved: false,
      serverSaved: false,
      isCloudSynced: true
    };
  }

  isSaveInProgress = true;
  try {
    const result = await executeSave(payload);

    // If another update arrived while this save was executing, immediately drain the queue
    if (pendingSavePayload) {
      const nextPayload = pendingSavePayload;
      pendingSavePayload = null;
      // Drain in next microtask without blocking
      setTimeout(() => {
        saveApplicationState(nextPayload);
      }, 50);
    }

    return result;
  } finally {
    isSaveInProgress = false;
  }
}

async function executeSave(payload: any) {
  // Deep clone and clean all undefined properties so Firestore/JSON never reject
  const cleanPayload = JSON.parse(JSON.stringify(payload));
  const nowIso = new Date().toISOString();

  let firestoreSaved = false;
  let serverSaved = false;
  let firestoreError: string | undefined;

  // 1. Attempt Node.js Server API write if running
  try {
    const res = await Promise.race([
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanPayload)
      }),
      new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Server write timeout')), 2500))
    ]);

    if (res.ok) {
      const json = await res.json();
      if (json && json.success) {
        serverSaved = true;
        if (json.firestoreSaved) firestoreSaved = true;
      }
    }
  } catch (apiErr) {
    // Normal on static cPanel hosting where /api/state is not hosted
  }

  // 2. Direct Cloud Firestore write (if not already handled by server and not in backoff)
  if (!firestoreSaved && Date.now() >= clientFirestoreBackoffUntil) {
    try {
      const docRef = doc(db, 'app_state', 'timetable_state');
      await Promise.race([
        setDoc(docRef, { data: cleanPayload, updatedAt: nowIso }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 2500))
      ]);
      firestoreSaved = true;
    } catch (err: any) {
      firestoreError = err?.message || String(err);
      console.warn('[Database] Direct Firestore write notice:', firestoreError);
      
      // If daily quota exhausted or timed out, backoff for 5 minutes to avoid freezing UI
      if (
        firestoreError.includes('resource-exhausted') ||
        firestoreError.includes('RESOURCE_EXHAUSTED') ||
        firestoreError.includes('timeout') ||
        firestoreError.includes('Quota')
      ) {
        clientFirestoreBackoffUntil = Date.now() + 5 * 60 * 1000;
      }
    }
  }

  return {
    success: true, // Always true because local storage cache was already saved synchronously
    firestoreSaved,
    serverSaved,
    isCloudSynced: firestoreSaved || serverSaved,
    error: firestoreError
  };
}
