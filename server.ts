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

  // DB Connection Status Check
  app.get("/api/db-status", async (req, res) => {
    if (!db) {
      return res.json({ connected: false, message: "Firestore database not configured" });
    }
    try {
      const docRef = doc(db, "app_state", "timetable_state");
      await Promise.race([
        getDoc(docRef),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Database connection ping timed out")), 5000))
      ]);
      res.json({ connected: true, message: "Database connection active" });
    } catch (error: any) {
      res.status(503).json({ connected: false, error: error?.message || "Database connection unavailable" });
    }
  });

  // GET State
  app.get("/api/state", async (req, res) => {
    try {
      let state = null;

      // 1. Try fetching from Firestore first with 6s timeout
      if (db) {
        try {
          const docRef = doc(db, "app_state", "timetable_state");
          const docSnap: any = await Promise.race([
            getDoc(docRef),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore read timed out")), 6000))
          ]);
          if (docSnap && docSnap.exists()) {
            const docData = docSnap.data();
            if (docData && docData.data) {
              state = docData.data;
              console.log("[Firebase] Loaded state from Firestore successfully.");
            }
          }
        } catch (firestoreError) {
          console.error("[Firebase] Failed to read from Firestore, falling back to local file:", firestoreError);
        }
      }

      // 2. Fallback to local file if Firestore failed, is empty, or isn't configured
      if (!state && fs.existsSync(stateFilePath)) {
        try {
          const fileContent = fs.readFileSync(stateFilePath, 'utf-8');
          state = JSON.parse(fileContent);
          console.log("[Local] Loaded state from local file fallback.");

          // If Firestore is available but empty, seed it with the local data!
          if (db && state) {
            try {
              const docRef = doc(db, "app_state", "timetable_state");
              await setDoc(docRef, { data: state, updatedAt: new Date().toISOString() });
              console.log("[Firebase] Seeded Firestore with initial local data.");
            } catch (seedError) {
              console.error("[Firebase] Failed to seed Firestore with initial state:", seedError);
            }
          }
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

  // POST State (Instant saving with strict error detection)
  app.post("/api/state", async (req, res) => {
    try {
      const state = req.body;

      // 1. Always write to local file as backup
      try {
        fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
      } catch (localWriteError) {
        console.error("[Local] Failed to write local state backup:", localWriteError);
      }

      // 2. Write to Firestore with immediate 6-second timeout
      if (db) {
        try {
          const docRef = doc(db, "app_state", "timetable_state");
          await Promise.race([
            setDoc(docRef, { data: state, updatedAt: new Date().toISOString() }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore database connection timed out")), 6000))
          ]);
          console.log("[Firebase] Saved state to Firestore database successfully.");
          return res.json({ success: true, firestoreSaved: true, savedAt: new Date().toISOString() });
        } catch (firestoreWriteError: any) {
          console.error("[Firebase] Immediate write to Firestore failed:", firestoreWriteError);
          // Return an immediate 503 so client gets instant notification of database connection error
          return res.status(503).json({ 
            success: false, 
            firestoreSaved: false, 
            error: `Database connection error: ${firestoreWriteError?.message || 'Failed to reach Firestore database'}`
          });
        }
      }

      // If no Firestore db configured, succeed in local mode
      res.json({ success: true, firestoreSaved: false, localSaved: true });
    } catch (error: any) {
      console.error("Failed to save state:", error);
      res.status(500).json({ success: false, error: error?.message || "Failed to save state to database" });
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
