var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  const dataDir = import_path.default.join(process.cwd(), "data");
  const stateFilePath = import_path.default.join(dataDir, "timetable_state.json");
  if (!import_fs.default.existsSync(dataDir)) {
    import_fs.default.mkdirSync(dataDir, { recursive: true });
  }
  const configPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
  let db = null;
  if (import_fs.default.existsSync(configPath)) {
    try {
      const config = JSON.parse(import_fs.default.readFileSync(configPath, "utf-8"));
      const firebaseApp = (0, import_app.initializeApp)(config);
      db = (0, import_firestore.getFirestore)(firebaseApp, config.firestoreDatabaseId || "(default)");
      console.log(`[Firebase] Firestore initialized successfully with Database ID: ${config.firestoreDatabaseId || "(default)"}`);
    } catch (error) {
      console.error("[Firebase] Failed to initialize Firebase app:", error);
    }
  } else {
    console.log("[Firebase] No firebase-applet-config.json found. Running in local fallback mode.");
  }
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  let firestoreBackoffUntil = 0;
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
      const docRef = (0, import_firestore.doc)(db, "app_state", "timetable_state");
      await Promise.race([
        (0, import_firestore.getDoc)(docRef),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Database connection ping timed out")), 3e3))
      ]);
      res.json({ connected: true, message: "Database connection active" });
    } catch (error) {
      res.json({ connected: true, localOnly: true, warning: error?.message || "Cloud connection throttled" });
    }
  });
  app.get("/api/state", async (req, res) => {
    try {
      let state = null;
      if (db && Date.now() >= firestoreBackoffUntil) {
        try {
          const docRef = (0, import_firestore.doc)(db, "app_state", "timetable_state");
          const docSnap = await Promise.race([
            (0, import_firestore.getDoc)(docRef),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore read timed out")), 3e3))
          ]);
          if (docSnap && docSnap.exists()) {
            const docData = docSnap.data();
            if (docData && docData.data) {
              state = docData.data;
              console.log("[Firebase] Loaded state from Firestore successfully.");
            }
          }
        } catch (firestoreError) {
          console.warn("[Firebase] Failed to read from Firestore, falling back to local file:", firestoreError?.message);
        }
      }
      if (!state && import_fs.default.existsSync(stateFilePath)) {
        try {
          const fileContent = import_fs.default.readFileSync(stateFilePath, "utf-8");
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
  app.post("/api/state", async (req, res) => {
    try {
      const state = req.body;
      let localSaved = false;
      try {
        import_fs.default.writeFileSync(stateFilePath, JSON.stringify(state, null, 2), "utf-8");
        localSaved = true;
      } catch (localWriteError) {
        console.error("[Local] Failed to write local state file:", localWriteError);
      }
      if (db && Date.now() >= firestoreBackoffUntil) {
        try {
          const docRef = (0, import_firestore.doc)(db, "app_state", "timetable_state");
          await Promise.race([
            (0, import_firestore.setDoc)(docRef, { data: state, updatedAt: (/* @__PURE__ */ new Date()).toISOString() }),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore write timed out")), 2e3))
          ]);
          console.log("[Firebase] Saved state to Firestore database successfully.");
          return res.json({ success: true, firestoreSaved: true, localSaved, savedAt: (/* @__PURE__ */ new Date()).toISOString() });
        } catch (firestoreWriteError) {
          const errMsg = firestoreWriteError?.message || String(firestoreWriteError);
          console.warn("[Firebase] Write to Firestore failed, backing off:", errMsg);
          firestoreBackoffUntil = Date.now() + 5 * 60 * 1e3;
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
      if (localSaved) {
        return res.json({ success: true, firestoreSaved: false, localSaved: true });
      }
      res.status(500).json({ success: false, error: "Failed to save state to storage" });
    } catch (error) {
      console.error("Failed to save state:", error);
      res.status(500).json({ success: false, error: error?.message || "Failed to save state" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
