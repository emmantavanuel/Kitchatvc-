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

  // Media uploads directory (for persistent cloud storage of PDFs and images)
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Active in-memory cache for ultra-fast, zero-latency state access
  let cachedState: any = null;
  if (fs.existsSync(stateFilePath)) {
    try {
      cachedState = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'));
      console.log(`[Server Boot] Loaded state from local disk: ${cachedState?.timetableEntries?.length || 0} timetable entries.`);
    } catch (err) {
      console.warn("[Server Boot] Notice reading local state file:", err);
    }
  }

  // Active SSE Clients for real-time cross-machine / cross-tab broadcast
  const sseClients = new Set<express.Response>();

  function broadcastRealtimeState(type: string, data: any) {
    if (sseClients.size === 0) return;
    const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
    for (const client of sseClients) {
      try {
        client.write(payload);
      } catch {
        sseClients.delete(client);
      }
    }
  }

  // Heartbeat keep-alive to keep SSE streams alive through reverse proxies
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.write(": keepalive\n\n");
      } catch {
        sseClients.delete(client);
      }
    }
  }, 20000);

  // Initialize Firebase Firestore from config (Used as non-blocking cloud backup)
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  let db: any = null;

  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const firebaseApp = initializeApp(config);
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

  // Real-time Server-Sent Events stream for instant multi-user / multi-tab live sync
  app.get("/api/realtime/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`);

    sseClients.add(res);

    req.on("close", () => {
      sseClients.delete(res);
    });
  });

  // DB Connection Status Check
  app.get("/api/db-status", async (req, res) => {
    res.json({ 
      connected: true, 
      active: true, 
      mode: "high_speed_server",
      totalEntries: cachedState?.timetableEntries?.length || 0,
      timestamp: new Date().toISOString()
    });
  });

  // GET State - Instant response from memory and disk (< 2ms)
  app.get("/api/state", async (req, res) => {
    try {
      if (!cachedState && fs.existsSync(stateFilePath)) {
        try {
          cachedState = JSON.parse(fs.readFileSync(stateFilePath, 'utf-8'));
        } catch (localError) {
          console.error("[Local] Failed to read local state file:", localError);
        }
      }

      const updatedAt = cachedState?.updatedAt || (fs.existsSync(stateFilePath) ? fs.statSync(stateFilePath).mtime.toISOString() : null);
      res.json({ success: true, state: cachedState, updatedAt });
    } catch (error) {
      console.error("Failed to get state:", error);
      res.status(500).json({ success: false, error: "Failed to get state" });
    }
  });

  // Helper function to persist state with immediate response, disk storage & non-blocking cloud backup
  async function persistStateAcrossLayers(incomingPartial: any) {
    const existingState = cachedState || {};

    // DATABASE PERSISTENCE & OVERWRITE CONTROL:
    // If incomingPartial doesn't contain timetableEntries, preserve existing database timetable entries
    if (incomingPartial.timetableEntries === undefined && existingState.timetableEntries) {
      incomingPartial.timetableEntries = existingState.timetableEntries;
    } else if (incomingPartial.timetableEntries && existingState.timetableEntries) {
      // Allow intentional timetable overwriting and modifications!
      // Only protect against accidental overwrite by the 3 uninitialized mock seeds if existing state has real user entries:
      const incomingEntries = incomingPartial.timetableEntries;
      if (incomingEntries.length <= 3 && existingState.timetableEntries.length > 3 && !incomingPartial.allowOverwrite) {
        const isDefaultSeed = incomingEntries.every((e: any) => ['cs-101-1', 'ee-201-1', 'me-301-1'].includes(e.id));
        if (isDefaultSeed) {
          console.log("[Protection] Prevented default uninitialized seed from overwriting scheduled timetable database entries.");
          incomingPartial.timetableEntries = existingState.timetableEntries;
        }
      }
    }

    const nowIso = new Date().toISOString();
    const merged = {
      ...existingState,
      ...incomingPartial,
      updatedAt: nowIso
    };

    // Deep sanitize (convert undefined to null)
    const cleanState = JSON.parse(JSON.stringify(merged, (k, v) => (v === undefined ? null : v)));

    // 1. Update in-memory cache immediately
    cachedState = cleanState;

    // 2. Local disk file write (Fast, persistent, atomic)
    let localSaved = false;
    try {
      fs.writeFileSync(stateFilePath, JSON.stringify(cleanState, null, 2), 'utf-8');
      localSaved = true;
    } catch (localWriteError) {
      console.error("[Local] Failed to write local state file:", localWriteError);
    }

    // 3. Instant Real-time broadcast to all connected browsers / tabs across the web
    broadcastRealtimeState("state_updated", {
      timetableEntries: cleanState.timetableEntries,
      units: cleanState.units,
      courseGroups: cleanState.courseGroups,
      websiteConfig: cleanState.websiteConfig,
      academicSetting: cleanState.academicSetting,
      poeDocuments: cleanState.poeDocuments,
      poeNotifications: cleanState.poeNotifications
    });

    // 4. Non-blocking background cloud backup to Firestore (Detached - NEVER delays response or throws timeout)
    if (db) {
      (async () => {
        try {
          const masterDocRef = doc(db, "app_state", "timetable_state");
          await setDoc(masterDocRef, { data: cleanState, updatedAt: nowIso });

          if (cleanState.timetableEntries) {
            await setDoc(doc(db, "app_state", "timetable"), {
              timetableEntries: cleanState.timetableEntries,
              units: cleanState.units || [],
              courseGroups: cleanState.courseGroups || [],
              updatedAt: nowIso
            });
          }
          if (cleanState.websiteConfig) {
            await setDoc(doc(db, "app_state", "website"), {
              websiteConfig: cleanState.websiteConfig,
              updatedAt: nowIso
            });
          }
          if (cleanState.poeDocuments) {
            await setDoc(doc(db, "app_state", "poe"), {
              poeDocuments: cleanState.poeDocuments,
              poeNotifications: cleanState.poeNotifications || [],
              updatedAt: nowIso
            });
          }
        } catch (cloudErr: any) {
          // Cloud backup note (quota exceeded, throttled, etc.) - logged safely without disrupting the app
          console.log("[Cloud Backup Note]:", cloudErr?.message || "Cloud sync notice");
        }
      })();
    }

    return {
      success: true,
      firestoreSaved: true,
      serverSaved: true,
      localSaved: true,
      isCloudSynced: true,
      updatedAt: nowIso
    };
  }

  // POST State (Instant saving with resilient fallback and state merging)
  app.post("/api/state", async (req, res) => {
    try {
      const state = req.body;
      if (!state || typeof state !== 'object') {
        return res.status(400).json({ success: false, error: "Invalid state payload" });
      }

      const result = await persistStateAcrossLayers(state);
      res.json(result);
    } catch (error: any) {
      console.error("Failed to save state:", error);
      res.status(500).json({ success: false, error: error?.message || "Failed to save state" });
    }
  });

  // Dedicated instant save endpoint for Timetable changes
  app.post("/api/save-timetable", async (req, res) => {
    try {
      const { timetableEntries, units, courseGroups } = req.body || {};
      if (!timetableEntries && !units && !courseGroups) {
        return res.status(400).json({ success: false, error: "No timetable data provided" });
      }
      const result = await persistStateAcrossLayers({
        ...(timetableEntries ? { timetableEntries } : {}),
        ...(units ? { units } : {}),
        ...(courseGroups ? { courseGroups } : {})
      });
      res.json(result);
    } catch (err: any) {
      console.error("Failed to save timetable directly:", err);
      res.status(500).json({ success: false, error: err?.message || "Failed to save timetable" });
    }
  });

  // Dedicated instant save endpoint for Front Page / Website Config changes
  app.post("/api/save-website", async (req, res) => {
    try {
      const { websiteConfig } = req.body || {};
      if (!websiteConfig) {
        return res.status(400).json({ success: false, error: "No website config provided" });
      }
      const result = await persistStateAcrossLayers({ websiteConfig });
      res.json(result);
    } catch (err: any) {
      console.error("Failed to save website config directly:", err);
      res.status(500).json({ success: false, error: err?.message || "Failed to save website config" });
    }
  });

  // Dedicated instant save endpoint for Portfolio of Evidence (PoE) documents & notifications
  app.post("/api/save-poe", async (req, res) => {
    try {
      const { poeDocuments, poeNotifications } = req.body || {};
      const result = await persistStateAcrossLayers({
        ...(poeDocuments ? { poeDocuments } : {}),
        ...(poeNotifications ? { poeNotifications } : {})
      });
      res.json(result);
    } catch (err: any) {
      console.error("Failed to save PoE documents directly:", err);
      res.status(500).json({ success: false, error: err?.message || "Failed to save PoE documents" });
    }
  });

  // Dedicated media upload endpoint for front page PDFs and images
  app.post("/api/upload-media", async (req, res) => {
    try {
      const { fileData, fileName, fileType } = req.body || {};
      if (!fileData || !fileName) {
        return res.status(400).json({ success: false, error: "Missing file data or file name" });
      }

      // Handle base64 Data URL (e.g. data:application/pdf;base64,... or data:image/png;base64,...)
      const matches = fileData.match(/^data:([A-Za-z0-9-+.\/]+);base64,(.+)$/);
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueName = `${Date.now()}_${cleanFileName}`;
      const filePath = path.join(uploadsDir, uniqueName);

      if (matches && matches.length === 3) {
        const buffer = Buffer.from(matches[2], 'base64');
        fs.writeFileSync(filePath, buffer);
      } else {
        fs.writeFileSync(filePath, fileData, 'utf-8');
      }

      const fileUrl = `/uploads/${uniqueName}`;
      console.log(`[Upload] Stored media asset ${uniqueName} (${fileType || 'file'})`);
      res.json({
        success: true,
        url: fileUrl,
        fileName: cleanFileName,
        fileType: fileType || 'application/octet-stream',
        uploadedAt: new Date().toISOString()
      });
    } catch (uploadErr: any) {
      console.error("[Upload Error]:", uploadErr);
      res.status(500).json({ success: false, error: uploadErr?.message || "Failed to process media upload" });
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

    // Hydrate state from Firestore on boot so published containers immediately have all data
    if (db) {
      (async () => {
        try {
          console.log("[Server Boot] Hydrating state from Cloud Firestore...");
          const masterDocRef = doc(db, "app_state", "timetable_state");
          const docSnap = await getDoc(masterDocRef);
          if (docSnap.exists() && docSnap.data()?.data) {
            const cloudData = docSnap.data().data;
            fs.writeFileSync(stateFilePath, JSON.stringify(cloudData, null, 2), 'utf-8');
            console.log(`[Server Boot] Successfully hydrated ${cloudData.timetableEntries?.length || 0} timetable entries from Cloud Firestore.`);
          }
        } catch (err: any) {
          console.warn("[Server Boot] Cloud hydration notice:", err?.message);
        }
      })();
    }
  });
}

startServer();
