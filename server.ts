import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON body parser with generous limit
  app.use(express.json({ limit: '50mb' }));

  const dataDir = path.join(process.cwd(), 'data');
  const stateFilePath = path.join(dataDir, 'timetable_state.json');

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Initialize Firebase Firestore from config
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let db: any = null;

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const firebaseApp = initializeApp(config);
      // Pass config.firestoreDatabaseId if specified, else use default database
      db = getFirestore(firebaseApp, config.firestoreDatabaseId || "(default)");
      console.log(`[Firebase] Firestore initialized successfully with Database ID: ${config.firestoreDatabaseId || "(default)"}`);
    } catch (error) {
      console.error("[Firebase] Failed to initialize Firebase app:", error);
    }
  } else {
    console.log("[Firebase] No firebase-applet-config.json found. Running in local fallback mode.");
  }

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Firestore backoff tracking to prevent request hangs when daily write quota is reached
  let firestoreBackoffUntil = 0;

  // DB Connection Status Check
  app.get("/api/db-status", async (req, res) => {
    if (!db) {
      return res.json({ connected: true, localOnly: true, message: "Server storage active (Local file mode)" });
    }
    if (Date.now() < firestoreBackoffUntil) {
      return res.json({ 
        connected: true, 
        quotaExceeded: true, 
        message: "Server storage active (Cloud Firestore quota exceeded - using local storage)" 
      });
    }
    try {
      const docRef = doc(db, "app_state", "timetable_state");
      await Promise.race([
        getDoc(docRef),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Database connection ping timed out")), 3000))
      ]);
      res.json({ connected: true, message: "Database connection active" });
    } catch (error: any) {
      res.json({ connected: true, localOnly: true, warning: error?.message || "Cloud connection throttled" });
    }
  });

  // GET State
  app.get("/api/state", async (req, res) => {
    try {
      let state = null;

      // 1. Try fetching from Firestore first if not in backoff
      if (db && Date.now() >= firestoreBackoffUntil) {
        try {
          const docRef = doc(db, "app_state", "timetable_state");
          const docSnap: any = await Promise.race([
            getDoc(docRef),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore read timed out")), 3000))
          ]);
          if (docSnap && docSnap.exists()) {
            const docData = docSnap.data();
            if (docData && docData.data) {
              state = docData.data;
              console.log("[Firebase] Loaded state from Firestore successfully.");
            }
          }
        } catch (firestoreError: any) {
          console.warn("[Firebase] Failed to read from Firestore, falling back to local file:", firestoreError?.message);
        }
      }

      // 2. Fallback to local file if Firestore failed, is empty, or isn't configured
      if (!state && fs.existsSync(stateFilePath)) {
        try {
          const fileContent = fs.readFileSync(stateFilePath, 'utf-8');
          state = JSON.parse(fileContent);
          console.log("[Local] Loaded state from local file fallback.");
        } catch (localError) {
          console.error("[Local] Failed to read local state file:", localError);
        }
      }

      res.json({ success: true, state });
    } catch (error) {
      console.error("Failed to get state:", error);
      res.status(500).json({ success: false, error: "Failed to get state" });
    }
  });

  // POST State (Instant saving with resilient fallback)
  app.post("/api/state", async (req, res) => {
    try {
      const state = req.body;

      // 1. Always write to local file as primary durable storage
      let localSaved = false;
      try {
        fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
        localSaved = true;
      } catch (localWriteError) {
        console.error("[Local] Failed to write local state file:", localWriteError);
      }

      // 2. If Firestore is configured and not in backoff, attempt cloud replica write
      if (db && Date.now() >= firestoreBackoffUntil) {
        try {
          const docRef = doc(db, "app_state", "timetable_state");
          await Promise.race([
            setDoc(docRef, { data: state, updatedAt: new Date().toISOString() }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore write timed out")), 2000))
          ]);
          console.log("[Firebase] Saved state to Firestore database successfully.");
          return res.json({ success: true, firestoreSaved: true, localSaved, savedAt: new Date().toISOString() });
        } catch (firestoreWriteError: any) {
          const errMsg = firestoreWriteError?.message || String(firestoreWriteError);
          console.warn("[Firebase] Write to Firestore failed, backing off:", errMsg);
          
          // If quota is exhausted or request timed out, enter 5-minute backoff so subsequent requests are instantaneous
          firestoreBackoffUntil = Date.now() + 5 * 60 * 1000;

          // If local save succeeded, report SUCCESS to client so user is never interrupted
          if (localSaved) {
            return res.json({ 
              success: true, 
              firestoreSaved: false, 
              localSaved: true, 
              warning: "Saved to local server storage (Cloud Firestore daily quota limit reached; local database is fully up-to-date)." 
            });
          }
        }
      }

      // If in backoff or no Firestore, but local save succeeded, return success
      if (localSaved) {
        return res.json({ success: true, firestoreSaved: false, localSaved: true });
      }

      res.status(500).json({ success: false, error: "Failed to save state to storage" });
    } catch (error: any) {
      console.error("Failed to save state:", error);
      res.status(500).json({ success: false, error: error?.message || "Failed to save state" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
