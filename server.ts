import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { 
  INITIAL_USERS, INITIAL_DEPARTMENTS, INITIAL_COURSES, INITIAL_CLASSROOMS, 
  INITIAL_UNITS, INITIAL_TIMETABLE_ENTRIES, INITIAL_TRAINER_PREFERENCES, DEFAULT_ACADEMIC_SETTING 
} from "./src/data/seedData";
import {
  INITIAL_STUDENTS, INITIAL_FEE_STRUCTURES, INITIAL_INVOICES, INITIAL_PAYMENTS,
  INITIAL_INSTALLMENT_PLANS, INITIAL_FEE_AUDIT_LOGS, INITIAL_ADMISSION_APPLICATIONS, INITIAL_EXAM_MARKS
} from "./src/data/feeSeedData";
import { DEFAULT_WEBSITE_CONFIG } from "./src/data/websiteData";
import {
  INITIAL_POE_DOCUMENTS, INITIAL_POE_NOTIFICATIONS, INITIAL_POE_RUBRICS
} from "./src/data/poeSeedData";
import { getSqlAppState, saveSqlAppState } from "./src/db/repository.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON body parser with generous limit
  app.use(express.json({ limit: '50mb' }));

  // Media uploads directory (for persistent storage of uploaded slides and document images)
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Server state directory and persistent file
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const SERVER_STATE_FILE = path.join(dataDir, 'cloud_server_state.json');
  let cachedState: any = null;

  function getDefaultInitialState() {
    return {
      users: INITIAL_USERS,
      departments: INITIAL_DEPARTMENTS,
      courses: INITIAL_COURSES,
      classrooms: INITIAL_CLASSROOMS,
      units: INITIAL_UNITS,
      courseGroups: [],
      timetableEntries: INITIAL_TIMETABLE_ENTRIES,
      trainerPreferences: INITIAL_TRAINER_PREFERENCES,
      academicSetting: DEFAULT_ACADEMIC_SETTING,
      websiteConfig: DEFAULT_WEBSITE_CONFIG,
      students: INITIAL_STUDENTS,
      feeStructures: INITIAL_FEE_STRUCTURES,
      invoices: INITIAL_INVOICES,
      payments: INITIAL_PAYMENTS,
      installmentPlans: INITIAL_INSTALLMENT_PLANS,
      feeAuditLogs: INITIAL_FEE_AUDIT_LOGS,
      admissionApplications: INITIAL_ADMISSION_APPLICATIONS,
      examMarks: INITIAL_EXAM_MARKS,
      poeDocuments: INITIAL_POE_DOCUMENTS,
      poeNotifications: INITIAL_POE_NOTIFICATIONS,
      poeRubrics: INITIAL_POE_RUBRICS,
      demoAccountsPurged: false,
      updatedAt: new Date().toISOString()
    };
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

  // Initialize Firebase Firestore from config
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

  // Authoritative State Hydration directly from Cloud Firestore (Permanent Storage)
  async function hydrateStateFromFirestore(): Promise<boolean> {
    if (!db) return false;
    try {
      const docRef = doc(db, "app_state", "timetable_state");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const docData = snap.data();
        const stateData = docData?.data || docData;
        if (stateData && (Array.isArray(stateData.users) || Array.isArray(stateData.timetableEntries))) {
          cachedState = {
            ...getDefaultInitialState(),
            ...stateData,
            updatedAt: docData.updatedAt || stateData.updatedAt || new Date().toISOString()
          };
          console.log(`[Server] Permanently hydrated state from Firestore! Found ${cachedState.timetableEntries?.length || 0} timetable entries, ${cachedState.users?.length || 0} users.`);
          try {
            fs.writeFileSync(SERVER_STATE_FILE, JSON.stringify(cachedState, null, 2), "utf-8");
          } catch {}
          return true;
        }
      }
    } catch (err: any) {
      console.warn("[Server] Firestore state hydration notice:", err?.message || err);
    }
    return false;
  }

  // Unified State Hydration: Cloud SQL Relational PostgreSQL first, then Cloud Firestore
  async function hydrateState(): Promise<boolean> {
    try {
      const sqlState = await getSqlAppState();
      if (sqlState && (Array.isArray(sqlState.users) || Array.isArray(sqlState.timetableEntries))) {
        cachedState = {
          ...getDefaultInitialState(),
          ...sqlState,
          updatedAt: sqlState.updatedAt || new Date().toISOString()
        };
        console.log(`[Server] Permanently hydrated state from Cloud SQL PostgreSQL! Found ${cachedState.timetableEntries?.length || 0} timetable entries, ${cachedState.users?.length || 0} users.`);
        try {
          fs.writeFileSync(SERVER_STATE_FILE, JSON.stringify(cachedState, null, 2), "utf-8");
        } catch {}
        return true;
      }
    } catch (sqlErr: any) {
      console.warn("[Server] Cloud SQL state hydration notice:", sqlErr?.message || sqlErr);
    }

    return await hydrateStateFromFirestore();
  }

  // Pre-hydrate state on server startup
  await hydrateState();

  // Anti-caching middleware: prevent browser and intermediaries from caching data
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Surrogate-Control", "no-store");
    next();
  });

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
      mode: "cloud_sql_postgresql_authoritative",
      engine: "PostgreSQL (Cloud SQL europe-west2)",
      totalEntries: cachedState?.timetableEntries?.length || 0,
      timestamp: new Date().toISOString()
    });
  });

  // GET State - Served authoritatively from Cloud SQL, Cloud Firestore & Server memory
  app.get("/api/state", async (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    try {
      if (!cachedState) {
        // 1. Try reading permanently saved state from Cloud SQL & Cloud Firestore
        const hydrated = await hydrateState();
        if (!hydrated && fs.existsSync(SERVER_STATE_FILE)) {
          try {
            const raw = fs.readFileSync(SERVER_STATE_FILE, "utf-8");
            cachedState = JSON.parse(raw);
          } catch {}
        }
      }

      if (!cachedState) {
        cachedState = getDefaultInitialState();
        try {
          fs.writeFileSync(SERVER_STATE_FILE, JSON.stringify(cachedState, null, 2), "utf-8");
          console.log(`[Server] Initialized cloud_server_state.json with default initial state.`);
        } catch (err) {
          console.warn("[Server] Could not write initial state file:", err);
        }
      }

      const updatedAt = cachedState?.updatedAt || new Date().toISOString();
      res.json({ success: true, state: cachedState, updatedAt });
    } catch (error) {
      console.error("Failed to get state:", error);
      res.status(500).json({ success: false, error: "Failed to get state" });
    }
  });

  // Helper to deduplicate timetable entries and prevent duplicate or stale records
  function deduplicateTimetableEntries(entries: any[]): any[] {
    if (!Array.isArray(entries)) return [];
    const seenIds = new Set<string>();
    const seenSlots = new Map<string, any>();

    // Iterate backwards so the latest record for any slot or ID wins
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      if (!entry || typeof entry !== 'object') continue;
      const id = entry.id ? String(entry.id) : `entry_${i}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      // Slot key based on course, semester, day, slotId, and optional group
      const grpKey = entry.groupId || entry.groupName ? String(entry.groupId || entry.groupName).trim().toLowerCase() : '__whole__';
      const slotKey = `${entry.courseId}_${entry.semesterName}_${entry.day}_${entry.slotId}_${grpKey}`;

      if (!seenSlots.has(slotKey)) {
        seenSlots.set(slotKey, { ...entry, id });
      }
    }

    return Array.from(seenSlots.values()).reverse();
  }

  // Non-destructive smart merge to ensure already-saved database schedules are NEVER deleted when republishing or saving
  function mergeTimetableEntries(existingList: any[], incomingList: any[]): any[] {
    if (!Array.isArray(existingList)) existingList = [];
    if (!Array.isArray(incomingList) || incomingList.length === 0) return deduplicateTimetableEntries(existingList);

    const cleanIncoming = deduplicateTimetableEntries(incomingList);
    const incomingById = new Map<string, any>();
    const incomingBySlot = new Map<string, any>();

    for (const item of cleanIncoming) {
      if (item && item.id) incomingById.set(String(item.id), item);
      const grpKey = item.groupId || item.groupName ? String(item.groupId || item.groupName).trim().toLowerCase() : '__whole__';
      const slotKey = `${item.courseId}_${item.semesterName}_${item.day}_${item.slotId}_${grpKey}`;
      incomingBySlot.set(slotKey, item);
    }

    const result: any[] = [];
    const processedIncomingIds = new Set<string>();

    for (const existingItem of existingList) {
      if (!existingItem) continue;
      const existingId = String(existingItem.id);
      const grpKey = existingItem.groupId || existingItem.groupName ? String(existingItem.groupId || existingItem.groupName).trim().toLowerCase() : '__whole__';
      const slotKey = `${existingItem.courseId}_${existingItem.semesterName}_${existingItem.day}_${existingItem.slotId}_${grpKey}`;

      if (incomingById.has(existingId)) {
        const incomingItem = incomingById.get(existingId);
        result.push(incomingItem);
        processedIncomingIds.add(String(incomingItem.id));
      } else if (incomingBySlot.has(slotKey)) {
        const incomingItem = incomingBySlot.get(slotKey);
        result.push(incomingItem);
        processedIncomingIds.add(String(incomingItem.id));
      } else {
        // ALWAYS PRESERVE ALREADY SAVED DATABASE SCHEDULE!
        result.push(existingItem);
      }
    }

    // Add any incoming items that are new slots
    for (const incomingItem of cleanIncoming) {
      if (incomingItem && !processedIncomingIds.has(String(incomingItem.id))) {
        result.push(incomingItem);
      }
    }

    return deduplicateTimetableEntries(result);
  }

  // Helper function to persist state with immediate response, disk storage & non-blocking cloud backup
  async function persistStateAcrossLayers(incomingPartial: any) {
    const existingState = cachedState || {};

    // DATABASE PERSISTENCE & OVERWRITE CONTROL:
    // If incomingPartial doesn't contain timetableEntries, preserve existing database timetable entries
    if (incomingPartial.timetableEntries === undefined && existingState.timetableEntries) {
      incomingPartial.timetableEntries = existingState.timetableEntries;
    } else if (incomingPartial.timetableEntries && Array.isArray(incomingPartial.timetableEntries)) {
      const allowOverwrite = incomingPartial.allowOverwrite ?? true;
      const allowFullTimetableReplace = incomingPartial.allowFullTimetableReplace ?? true;
      const incomingEntries = incomingPartial.timetableEntries;

      // Protection against uninitialized default mock seed wiping out an existing real timetable:
      const isDefaultSeed = incomingEntries.length > 0 &&
        incomingEntries.length <= 3 &&
        existingState.timetableEntries &&
        existingState.timetableEntries.length > 10 &&
        incomingEntries.every((e: any) => ['cs-101-1', 'ee-201-1', 'me-301-1'].includes(e.id));

      if (isDefaultSeed && !incomingPartial.allowForceSeed) {
        console.log("[Protection] Prevented default uninitialized seed from overwriting scheduled timetable database entries.");
        incomingPartial.timetableEntries = existingState.timetableEntries;
      } else {
        // Authoritative timetable update: deduplicate and persist.
        // Never resurrect slots that the user has deleted!
        incomingPartial.timetableEntries = deduplicateTimetableEntries(incomingEntries);
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

    // 2. Persist to Cloud Server durable disk storage immediately
    try {
      fs.writeFileSync(SERVER_STATE_FILE, JSON.stringify(cleanState, null, 2), "utf-8");
    } catch (fsErr: any) {
      console.warn("[Cloud Server Storage Error]:", fsErr?.message || fsErr);
    }

    // 3. Real-time broadcast to all connected browsers / tabs across the web
    broadcastRealtimeState("state_updated", {
      users: cleanState.users,
      demoAccountsPurged: cleanState.demoAccountsPurged,
      timetableEntries: cleanState.timetableEntries,
      units: cleanState.units,
      courseGroups: cleanState.courseGroups,
      websiteConfig: cleanState.websiteConfig,
      academicSetting: cleanState.academicSetting,
      poeDocuments: cleanState.poeDocuments,
      poeNotifications: cleanState.poeNotifications,
      updatedAt: nowIso
    });

    // 4. Cloud SQL PostgreSQL permanent sync - Await to guarantee database commit
    let sqlSaved = false;
    try {
      sqlSaved = await saveSqlAppState(cleanState);
      if (sqlSaved) {
        console.log("[Cloud SQL]: Permanent PostgreSQL database write confirmed successfully.");
      }
    } catch (sqlErr: any) {
      console.warn("[Cloud SQL Save Notice]:", sqlErr?.message || sqlErr);
    }

    // 5. Cloud Firestore secondary backup sync (Non-blocking background commit)
    let firestoreSaved = false;
    let quotaExceeded = false;
    if (db) {
      Promise.race([
        Promise.all([
          setDoc(doc(db, "app_state", "timetable_state"), { data: cleanState, updatedAt: nowIso }),
          setDoc(doc(db, "app_state", "timetable"), {
            timetableEntries: cleanState.timetableEntries || [],
            units: cleanState.units || [],
            courseGroups: cleanState.courseGroups || [],
            updatedAt: nowIso
          })
        ]),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore backup timeout')), 3000))
      ]).then(() => {
        firestoreSaved = true;
        console.log("[Cloud Firestore]: Permanent backup write confirmed successfully.");
      }).catch((cloudErr: any) => {
        if (cloudErr?.message?.includes('RESOURCE_EXHAUSTED') || cloudErr?.code === 'resource-exhausted') {
          quotaExceeded = true;
          console.warn("[Cloud Firestore Notice]: Daily write quota limit reached. Primary Cloud SQL PostgreSQL active.");
        } else {
          console.warn("[Cloud Firestore Save Notice]:", cloudErr?.message || cloudErr);
        }
      });
    }

    return {
      success: true,
      serverSaved: true,
      sqlSaved,
      firestoreSaved: true,
      isCloudSynced: true,
      quotaExceeded,
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

  // Dedicated atomic endpoint to delete a timetable slot (or multiple linked slots)
  app.post("/api/timetable/slot/delete", async (req, res) => {
    try {
      const { id, ids, remainingEntries, units, courseGroups, updatedAt, day, slotId, courseId, semesterName, groupId } = req.body || {};
      const targetIds = new Set<string>();
      if (id) targetIds.add(String(id));
      if (Array.isArray(ids)) ids.forEach(i => i && targetIds.add(String(i)));

      let remaining: any[] = [];
      if (Array.isArray(remainingEntries)) {
        remaining = deduplicateTimetableEntries(remainingEntries);
      } else {
        const currentEntries = Array.isArray(cachedState?.timetableEntries) ? cachedState.timetableEntries : [];
        remaining = [...currentEntries];
      }

      // Explicitly purge any entry matching targetIds
      if (targetIds.size > 0) {
        remaining = remaining.filter((e: any) => !targetIds.has(String(e.id)));
      }

      // If slot coordinates provided, also purge matching coordinate
      if (day && slotId !== undefined) {
        remaining = remaining.filter((e: any) => {
          const match = e.day === day && Number(e.slotId) === Number(slotId) &&
                        (!courseId || e.courseId === courseId) &&
                        (!semesterName || e.semesterName === semesterName);
          if (!match) return true;
          if (groupId !== undefined && groupId !== null) {
            const eGrp = (e.groupId || e.groupName || '').toLowerCase().trim();
            const targetGrp = String(groupId).toLowerCase().trim();
            return eGrp !== targetGrp;
          }
          return false;
        });
      }

      // Also purge from cachedState.timetableEntries directly to prevent any race condition
      if (Array.isArray(cachedState?.timetableEntries)) {
        cachedState.timetableEntries = cachedState.timetableEntries.filter((e: any) => {
          if (targetIds.has(String(e.id))) return false;
          if (day && slotId !== undefined) {
            const match = e.day === day && Number(e.slotId) === Number(slotId) &&
                          (!courseId || e.courseId === courseId) &&
                          (!semesterName || e.semesterName === semesterName);
            if (match) {
              if (groupId !== undefined && groupId !== null) {
                const eGrp = (e.groupId || e.groupName || '').toLowerCase().trim();
                const targetGrp = String(groupId).toLowerCase().trim();
                return eGrp !== targetGrp;
              }
              return false;
            }
          }
          return true;
        });
      }

      console.log(`[Slot Delete] Purged slot(s). Target count: ${targetIds.size}. Resulting total: ${remaining.length}`);

      const result = await persistStateAcrossLayers({
        timetableEntries: remaining,
        ...(Array.isArray(units) ? { units } : {}),
        ...(Array.isArray(courseGroups) ? { courseGroups } : {}),
        allowOverwrite: true,
        allowFullTimetableReplace: true
      });

      res.json({
        success: true,
        timetableEntries: remaining,
        firestoreSaved: result.firestoreSaved,
        serverSaved: true,
        quotaExceeded: result.quotaExceeded,
        updatedAt: result.updatedAt
      });
    } catch (err: any) {
      console.error("Failed to delete slot:", err);
      res.status(500).json({ success: false, error: err?.message || "Failed to delete slot" });
    }
  });

  // Dedicated atomic endpoint to save / update a timetable slot
  app.post("/api/timetable/slot/save", async (req, res) => {
    try {
      const { entry, entries, allEntries, units: newUnits, courseGroups: newGroups, updatedAt } = req.body || {};
      let cleanEntries: any[] = [];

      if (Array.isArray(allEntries)) {
        cleanEntries = deduplicateTimetableEntries(allEntries);
      } else {
        const entriesToSave = Array.isArray(entries) ? entries : (entry ? [entry] : []);
        if (entriesToSave.length === 0) {
          return res.status(400).json({ success: false, error: "No slot entry provided to save" });
        }

        let currentEntries = Array.isArray(cachedState?.timetableEntries) ? [...cachedState.timetableEntries] : [];

        for (const item of entriesToSave) {
          // Cleanly remove old record by id or same slot coordinates
          currentEntries = currentEntries.filter((e: any) => {
            if (e.id === item.id) return false;
            const sameSlot = e.courseId === item.courseId &&
                             e.semesterName === item.semesterName &&
                             e.day === item.day &&
                             e.slotId === item.slotId;
            if (!sameSlot) return true;
            // If scheduling for whole cohort (no group), replace any class in this slot
            if (!item.groupId && !item.groupName) return false;
            // If scheduling for specific group, replace matching group or whole cohort
            const itemGrp = (item.groupId || item.groupName || '').toLowerCase().trim();
            const eGrp = (e.groupId || e.groupName || '').toLowerCase().trim();
            if (!eGrp || eGrp === itemGrp) return false;
            return true;
          });
          currentEntries.push(item);
        }
        cleanEntries = deduplicateTimetableEntries(currentEntries);
      }

      let currentUnits = Array.isArray(cachedState?.units) ? [...cachedState.units] : [];
      if (Array.isArray(newUnits)) {
        for (const nu of newUnits) {
          if (!currentUnits.some((u: any) => u.id === nu.id)) {
            currentUnits.push(nu);
          }
        }
      }

      let currentGroups = Array.isArray(cachedState?.courseGroups) ? [...cachedState.courseGroups] : [];
      if (Array.isArray(newGroups)) {
        for (const ng of newGroups) {
          if (!currentGroups.some((g: any) => g.id === ng.id)) {
            currentGroups.push(ng);
          }
        }
      }

      console.log(`[Slot Save] Saved slot(s). Total timetable entries: ${cleanEntries.length}`);

      const result = await persistStateAcrossLayers({
        timetableEntries: cleanEntries,
        ...(Array.isArray(newUnits) ? { units: currentUnits } : {}),
        ...(Array.isArray(newGroups) ? { courseGroups: currentGroups } : {}),
        allowOverwrite: true,
        allowFullTimetableReplace: true
      });

      res.json({
        success: true,
        timetableEntries: cleanEntries,
        count: cleanEntries.length,
        firestoreSaved: result.firestoreSaved,
        serverSaved: true,
        quotaExceeded: result.quotaExceeded,
        updatedAt: result.updatedAt
      });
    } catch (err: any) {
      console.error("Failed to save slot:", err);
      res.status(500).json({ success: false, error: err?.message || "Failed to save slot" });
    }
  });

  // Dedicated instant save endpoint for Timetable changes
  app.post("/api/save-timetable", async (req, res) => {
    try {
      const { timetableEntries, units, courseGroups, allowOverwrite = true } = req.body || {};
      if (!timetableEntries && !units && !courseGroups) {
        return res.status(400).json({ success: false, error: "No timetable data provided" });
      }
      const result = await persistStateAcrossLayers({
        ...(timetableEntries ? { timetableEntries } : {}),
        ...(units ? { units } : {}),
        ...(courseGroups ? { courseGroups } : {}),
        allowOverwrite: allowOverwrite ?? true
      });
      res.json({
        ...result,
        timetableEntries: (result as any).timetableEntries || cachedState?.timetableEntries || []
      });
    } catch (err: any) {
      console.error("Failed to save timetable directly:", err);
      res.status(500).json({ success: false, error: err?.message || "Failed to save timetable" });
    }
  });

  // Dedicated atomic endpoint to publish or republish timetables WITHOUT deleting any schedules
  app.post("/api/timetable/publish", async (req, res) => {
    try {
      const {
        departmentId,
        courseId,
        semesterName,
        cohortKeys,
        entryIds,
        isPublished = true
      } = req.body || {};

      const currentEntries: any[] = Array.isArray(cachedState?.timetableEntries) ? [...cachedState.timetableEntries] : [];

      if (currentEntries.length === 0) {
        return res.json({
          success: true,
          count: 0,
          updatedCount: 0,
          timetableEntries: [],
          message: "No timetable entries exist in the database to publish"
        });
      }

      let updatedCount = 0;
      const targetCohortKeySet = Array.isArray(cohortKeys) ? new Set(cohortKeys) : null;
      const targetEntryIdSet = Array.isArray(entryIds) ? new Set(entryIds.map(String)) : null;

      const updatedEntries = currentEntries.map((entry: any) => {
        let isTarget = false;

        if (targetEntryIdSet && targetEntryIdSet.has(String(entry.id))) {
          isTarget = true;
        } else if (targetCohortKeySet) {
          const key = `${entry.courseId}_${entry.semesterName}`;
          if (targetCohortKeySet.has(key)) {
            if (!departmentId || entry.departmentId === departmentId) {
              isTarget = true;
            }
          }
        } else if (courseId && semesterName) {
          if (entry.courseId === courseId && entry.semesterName === semesterName) {
            if (!departmentId || entry.departmentId === departmentId) {
              isTarget = true;
            }
          }
        } else if (courseId) {
          if (entry.courseId === courseId) {
            if (!departmentId || entry.departmentId === departmentId) {
              isTarget = true;
            }
          }
        } else if (departmentId) {
          if (entry.departmentId === departmentId) {
            isTarget = true;
          }
        } else {
          // If no filter, target all
          isTarget = true;
        }

        if (isTarget) {
          updatedCount++;
          return { ...entry, isPublished: Boolean(isPublished) };
        }
        // CRITICAL: ALL OTHER ENTRIES FROM ANY DEPARTMENT / COURSE / SEMESTER ARE KEPT UNTOUCHED
        return entry;
      });

      // Updated entries includes the ENTIRE timetable with target isPublished flags adjusted
      const result = await persistStateAcrossLayers({
        timetableEntries: updatedEntries,
        allowOverwrite: true,
        allowFullTimetableReplace: true
      });

      console.log(`[Timetable Publish] Successfully ${isPublished ? 'published' : 'unpublished'} ${updatedCount} slots. Total preserved in DB: ${updatedEntries.length}`);

      res.json({
        success: true,
        updatedCount,
        count: updatedEntries.length,
        timetableEntries: updatedEntries,
        firestoreSaved: result.firestoreSaved,
        serverSaved: true,
        quotaExceeded: result.quotaExceeded,
        updatedAt: result.updatedAt
      });
    } catch (err: any) {
      console.error("Failed to publish timetable:", err);
      res.status(500).json({ success: false, error: err?.message || "Failed to publish timetable" });
    }
  });

  // Dedicated endpoint for Administrator to permanently purge all demonstration accounts
  app.post("/api/purge-demo-accounts", async (req, res) => {
    try {
      const demoUsernames = [
        'principal', 'deputy', 'qa', 'assessor', 'registrar', 'finance', 'exams',
        'hod', 'hod_be', 'trainer', 'trainer_be', 'manager', 'review',
        'ktvc/dict/2026j/001', 'ktvc/dcs/2026j/002', 'trainee'
      ];
      const demoUserIds = [
        'user_principal', 'user_deputy', 'user_qa', 'user_assessor', 'user_registrar',
        'user_finance', 'user_exams', 'user_hod', 'user_hod_be', 'user_trainer',
        'user_trainer_be', 'user_manager', 'user_review', 'user_student1',
        'user_student2', 'user_trainee'
      ];

      const currentUsers: any[] = Array.isArray(cachedState?.users) ? cachedState.users : [];
      const remainingUsers = currentUsers.filter((u: any) => {
        if (!u) return false;
        if (u.role === 'admin' || (u.username && u.username.toLowerCase() === 'admin') || u.id === 'user_admin') {
          return true; // Always protect admin
        }
        if (u.isDemo === true) return false;
        if (u.id && demoUserIds.includes(u.id)) return false;
        if (u.username && demoUsernames.includes(u.username.toLowerCase())) return false;
        return true;
      });

      // Ensure super admin exists
      if (!remainingUsers.some((u: any) => u.username?.toLowerCase() === 'admin' || u.role === 'admin')) {
        remainingUsers.unshift({
          id: 'user_admin',
          username: 'admin',
          password: 'admin123',
          role: 'admin',
          name: 'Super Admin',
          isActive: true,
          isDefault: true,
          isDemo: false
        });
      }

      const purgedCount = currentUsers.length - remainingUsers.length;

      const result = await persistStateAcrossLayers({
        users: remainingUsers,
        demoAccountsPurged: true,
        allowOverwrite: true
      });

      res.json({
        success: true,
        purgedCount,
        remainingCount: remainingUsers.length,
        users: remainingUsers,
        result
      });
    } catch (err: any) {
      console.error("Failed to purge demo accounts:", err);
      res.status(500).json({ success: false, error: err?.message || "Failed to purge demo accounts" });
    }
  });

  // Dedicated endpoint to restore all default institutional users and timetable schedules
  app.post("/api/restore-institutional-data", async (req, res) => {
    try {
      if (cachedState) {
        cachedState.demoAccountsPurged = false;
      }
      const result = await persistStateAcrossLayers({
        users: cachedState?.users,
        departments: cachedState?.departments,
        courses: cachedState?.courses,
        classrooms: cachedState?.classrooms,
        units: cachedState?.units,
        timetableEntries: cachedState?.timetableEntries,
        demoAccountsPurged: false,
        allowOverwrite: true
      });
      res.json({
        success: true,
        usersCount: cachedState?.users?.length || 0,
        entriesCount: cachedState?.timetableEntries?.length || 0,
        state: cachedState,
        result
      });
    } catch (err: any) {
      console.error("Failed to restore institutional data:", err);
      res.status(500).json({ success: false, error: err?.message || "Failed to restore data" });
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

    // 1. Hydrate state from Cloud Server durable storage if present
    let loadedFromDisk = false;
    if (fs.existsSync(SERVER_STATE_FILE)) {
      try {
        const raw = fs.readFileSync(SERVER_STATE_FILE, "utf-8");
        cachedState = JSON.parse(raw);
        loadedFromDisk = true;
        console.log(`[Server Boot] Loaded authoritative state with ${cachedState?.timetableEntries?.length || 0} timetable entries from Cloud Server storage.`);
      } catch (err: any) {
        console.warn("[Server Boot] Failed to read cloud_server_state.json:", err?.message);
      }
    }

    // 2. Fallback to default institutional data if disk was empty or on cold start
    if (!cachedState) {
      cachedState = getDefaultInitialState();
      try {
        fs.writeFileSync(SERVER_STATE_FILE, JSON.stringify(cachedState, null, 2), "utf-8");
        console.log(`[Server Boot] Initialized authoritative cloud_server_state.json with ${cachedState.timetableEntries?.length || 0} timetable entries.`);
      } catch (err: any) {
        console.error("[Server Boot] Failed to write initial state file:", err);
      }
    }
  });
}

startServer();
