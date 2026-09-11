import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Cloud, CloudOff, RefreshCw, AlertTriangle, CheckCircle2, WifiOff, Database, X, Globe, ArrowLeft, ArrowRight, Award, ShieldCheck
} from 'lucide-react';
import { 
  User, Department, Course, Classroom, Unit, TimetableEntry, AcademicSetting, TrainerSlotPreference, CourseGroup,
  Student, FeeStructure, Invoice, PaymentTransaction, InstallmentPlan, FeeAuditLog, AdmissionApplication, ExamMark,
  WebsiteConfig, PoeDocument, PoeNotification, PoeRubric
} from './types';
import { 
  INITIAL_USERS, INITIAL_DEPARTMENTS, INITIAL_COURSES, INITIAL_CLASSROOMS, 
  INITIAL_UNITS, INITIAL_TIMETABLE_ENTRIES, INITIAL_TRAINER_PREFERENCES, DEFAULT_ACADEMIC_SETTING,
  isDemoAccount 
} from './data/seedData';
import {
  INITIAL_STUDENTS, INITIAL_FEE_STRUCTURES, INITIAL_INVOICES, INITIAL_PAYMENTS,
  INITIAL_INSTALLMENT_PLANS, INITIAL_FEE_AUDIT_LOGS, INITIAL_ADMISSION_APPLICATIONS, INITIAL_EXAM_MARKS
} from './data/feeSeedData';
import { DEFAULT_WEBSITE_CONFIG } from './data/websiteData';
import { 
  INITIAL_POE_DOCUMENTS, INITIAL_POE_NOTIFICATIONS, INITIAL_POE_RUBRICS 
} from './data/poeSeedData';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import HodDashboard from './components/HodDashboard';
import TrainerDashboard from './components/TrainerDashboard';
import ReviewerDashboard from './components/ReviewerDashboard';
import FeeDashboard from './components/FeeDashboard';
import WebsiteFrontPage from './components/WebsiteFrontPage';
import PoeDashboard from './components/PoeDashboard';
import { 
  loadApplicationState, 
  saveApplicationState, 
  saveTimetableDirectly, 
  deduplicateTimetableEntries,
  deleteSlotDirectly,
  saveSlotDirectly,
  saveWebsiteConfigDirectly, 
  savePoeDirectly,
  purgeDemoAccountsDirectly,
  restoreInstitutionalDataDirectly,
  testConnection, 
  subscribeToRealtimeUpdates, 
  broadcastLocalUpdate 
} from './lib/firebase';

// LocalStorage Cache Keys
const STORAGE_PREFIX = 'kitcha_timetable_';
const LAST_UPDATED_KEY = `${STORAGE_PREFIX}last_updated`;
const KEYS = {
  USERS: `${STORAGE_PREFIX}users`,
  DEMO_ACCOUNTS_PURGED: `${STORAGE_PREFIX}demo_accounts_purged`,
  DEPARTMENTS: `${STORAGE_PREFIX}departments`,
  COURSES: `${STORAGE_PREFIX}courses`,
  CLASSROOMS: `${STORAGE_PREFIX}classrooms`,
  UNITS: `${STORAGE_PREFIX}units`,
  COURSE_GROUPS: `${STORAGE_PREFIX}course_groups`,
  TIMETABLE: `${STORAGE_PREFIX}entries`,
  PREFERENCES: `${STORAGE_PREFIX}preferences`,
  ACADEMIC: `${STORAGE_PREFIX}academic_setting`,
  CURRENT_USER: `${STORAGE_PREFIX}current_user`,
  STUDENTS: `${STORAGE_PREFIX}students`,
  FEE_STRUCTURES: `${STORAGE_PREFIX}fee_structures`,
  INVOICES: `${STORAGE_PREFIX}invoices`,
  PAYMENTS: `${STORAGE_PREFIX}payments`,
  INSTALLMENT_PLANS: `${STORAGE_PREFIX}installment_plans`,
  FEE_AUDIT_LOGS: `${STORAGE_PREFIX}fee_audit_logs`,
  ADMISSION_APPLICATIONS: `${STORAGE_PREFIX}admission_applications`,
  EXAM_MARKS: `${STORAGE_PREFIX}exam_marks`,
  WEBSITE_CONFIG: `${STORAGE_PREFIX}website_config`,
  POE_DOCUMENTS: `${STORAGE_PREFIX}poe_documents`,
  POE_NOTIFICATIONS: `${STORAGE_PREFIX}poe_notifications`,
  POE_RUBRICS: `${STORAGE_PREFIX}poe_rubrics`
};

// Resilient localStorage write wrapper
function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[Storage Cache] Notice saving ${key}:`, err);
  }
}

export default function App() {
  // Core database states
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classrooms, setClassroom] = useState<Classroom[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [courseGroups, setCourseGroups] = useState<CourseGroup[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [trainerPreferences, setTrainerPreferences] = useState<TrainerSlotPreference[]>([]);
  const [academicSetting, setAcademicSetting] = useState<AcademicSetting>(DEFAULT_ACADEMIC_SETTING);
  
  // Dynamic Website CMS State
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteConfig>(DEFAULT_WEBSITE_CONFIG);
  
  // Fee Management database states
  const [students, setStudents] = useState<Student[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>([]);
  const [feeAuditLogs, setFeeAuditLogs] = useState<FeeAuditLog[]>([]);

  // ERP Integrated Module states
  const [admissionApplications, setAdmissionApplications] = useState<AdmissionApplication[]>([]);
  const [examMarks, setExamMarks] = useState<ExamMark[]>([]);

  // TVET Portfolio of Evidence (PoE) states
  const [poeDocuments, setPoeDocuments] = useState<PoeDocument[]>(INITIAL_POE_DOCUMENTS);
  const [poeNotifications, setPoeNotifications] = useState<PoeNotification[]>(INITIAL_POE_NOTIFICATIONS);
  const [poeRubrics, setPoeRubrics] = useState<PoeRubric[]>(INITIAL_POE_RUBRICS);

  // Workspace and public website state
  const [activeWorkspace, setActiveWorkspace] = useState<'timetable' | 'finance' | 'portfolio'>('timetable');
  const [currentView, setCurrentView] = useState<'website' | 'portal'>('website');

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Real-time Database Synchronization & Connection Status State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'synced' | 'error'>('idle');
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isErrorBannerDismissed, setIsErrorBannerDismissed] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? (navigator.onLine ?? true) : true);

  // Debounce timer ref for non-blocking seamless auto-saving
  const autoSaveTimerRef = useRef<any>(null);

  // Synchronous ref to hold the absolute latest complete system state
  const stateRef = useRef<any>({
    users: [],
    departments: [],
    courses: [],
    classrooms: [],
    units: [],
    courseGroups: [],
    timetableEntries: [],
    trainerPreferences: [],
    academicSetting: DEFAULT_ACADEMIC_SETTING,
    websiteConfig: DEFAULT_WEBSITE_CONFIG,
    students: [],
    feeStructures: [],
    invoices: [],
    payments: [],
    installmentPlans: [],
    feeAuditLogs: [],
    admissionApplications: [],
    examMarks: [],
    poeDocuments: INITIAL_POE_DOCUMENTS,
    poeNotifications: INITIAL_POE_NOTIFICATIONS,
    poeRubrics: INITIAL_POE_RUBRICS
  });

  // Keep stateRef in sync with React state updates
  useEffect(() => {
    stateRef.current = {
      users,
      departments,
      courses,
      classrooms,
      units,
      courseGroups,
      timetableEntries,
      trainerPreferences,
      academicSetting,
      websiteConfig,
      students,
      feeStructures,
      invoices,
      payments,
      installmentPlans,
      feeAuditLogs,
      admissionApplications,
      examMarks,
      poeDocuments,
      poeNotifications,
      poeRubrics
    };
  }, [
    users, departments, courses, classrooms, units, courseGroups,
    timetableEntries, trainerPreferences, academicSetting, websiteConfig,
    students, feeStructures, invoices, payments, installmentPlans, feeAuditLogs,
    admissionApplications, examMarks, poeDocuments, poeNotifications, poeRubrics
  ]);

  // IMMEDIATE DATABASE SAVING FUNCTION (Synchronous local write + Thread-safe background cloud/server write)
  const saveStateToDatabaseImmediately = useCallback(async (stateOverride?: any) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    const currentRef = stateRef.current || {};
    const fullPayload = {
      users: (stateOverride?.users ?? currentRef.users ?? users)?.length ? (stateOverride?.users ?? currentRef.users ?? users) : users,
      departments: (stateOverride?.departments ?? currentRef.departments ?? departments)?.length ? (stateOverride?.departments ?? currentRef.departments ?? departments) : departments,
      courses: (stateOverride?.courses ?? currentRef.courses ?? courses)?.length ? (stateOverride?.courses ?? currentRef.courses ?? courses) : courses,
      classrooms: (stateOverride?.classrooms ?? currentRef.classrooms ?? classrooms)?.length ? (stateOverride?.classrooms ?? currentRef.classrooms ?? classrooms) : classrooms,
      units: (stateOverride?.units ?? currentRef.units ?? units)?.length ? (stateOverride?.units ?? currentRef.units ?? units) : units,
      courseGroups: stateOverride?.courseGroups ?? currentRef.courseGroups ?? courseGroups ?? [],
      timetableEntries: stateOverride?.timetableEntries ?? currentRef.timetableEntries ?? timetableEntries ?? [],
      trainerPreferences: stateOverride?.trainerPreferences ?? currentRef.trainerPreferences ?? trainerPreferences ?? [],
      academicSetting: stateOverride?.academicSetting ?? currentRef.academicSetting ?? academicSetting ?? DEFAULT_ACADEMIC_SETTING,
      websiteConfig: stateOverride?.websiteConfig ?? currentRef.websiteConfig ?? websiteConfig ?? DEFAULT_WEBSITE_CONFIG,
      students: (stateOverride?.students ?? currentRef.students ?? students)?.length ? (stateOverride?.students ?? currentRef.students ?? students) : students,
      feeStructures: (stateOverride?.feeStructures ?? currentRef.feeStructures ?? feeStructures)?.length ? (stateOverride?.feeStructures ?? currentRef.feeStructures ?? feeStructures) : feeStructures,
      invoices: stateOverride?.invoices ?? currentRef.invoices ?? invoices ?? [],
      payments: stateOverride?.payments ?? currentRef.payments ?? payments ?? [],
      installmentPlans: stateOverride?.installmentPlans ?? currentRef.installmentPlans ?? installmentPlans ?? [],
      feeAuditLogs: stateOverride?.feeAuditLogs ?? currentRef.feeAuditLogs ?? feeAuditLogs ?? [],
      admissionApplications: stateOverride?.admissionApplications ?? currentRef.admissionApplications ?? admissionApplications ?? [],
      examMarks: stateOverride?.examMarks ?? currentRef.examMarks ?? examMarks ?? [],
      poeDocuments: stateOverride?.poeDocuments ?? currentRef.poeDocuments ?? poeDocuments ?? [],
      poeNotifications: stateOverride?.poeNotifications ?? currentRef.poeNotifications ?? poeNotifications ?? [],
      poeRubrics: stateOverride?.poeRubrics ?? currentRef.poeRubrics ?? poeRubrics ?? []
    };

    stateRef.current = fullPayload;

    setSyncStatus('saving');
    setIsErrorBannerDismissed(false);

    // 1. Immediately cache all updated entities to localStorage synchronously
    const nowIso = new Date().toISOString();
    safeSetItem(LAST_UPDATED_KEY, nowIso);
    if (fullPayload.users) safeSetItem(KEYS.USERS, JSON.stringify(fullPayload.users));
    if (fullPayload.departments) safeSetItem(KEYS.DEPARTMENTS, JSON.stringify(fullPayload.departments));
    if (fullPayload.courses) safeSetItem(KEYS.COURSES, JSON.stringify(fullPayload.courses));
    if (fullPayload.classrooms) safeSetItem(KEYS.CLASSROOMS, JSON.stringify(fullPayload.classrooms));
    if (fullPayload.units) safeSetItem(KEYS.UNITS, JSON.stringify(fullPayload.units));
    if (fullPayload.courseGroups) safeSetItem(KEYS.COURSE_GROUPS, JSON.stringify(fullPayload.courseGroups));
    if (fullPayload.timetableEntries) safeSetItem(KEYS.TIMETABLE, JSON.stringify(fullPayload.timetableEntries));
    if (fullPayload.trainerPreferences) safeSetItem(KEYS.PREFERENCES, JSON.stringify(fullPayload.trainerPreferences));
    if (fullPayload.academicSetting) safeSetItem(KEYS.ACADEMIC, JSON.stringify(fullPayload.academicSetting));
    if (fullPayload.websiteConfig) safeSetItem(KEYS.WEBSITE_CONFIG, JSON.stringify(fullPayload.websiteConfig));
    if (fullPayload.students) safeSetItem(KEYS.STUDENTS, JSON.stringify(fullPayload.students));
    if (fullPayload.feeStructures) safeSetItem(KEYS.FEE_STRUCTURES, JSON.stringify(fullPayload.feeStructures));
    if (fullPayload.invoices) safeSetItem(KEYS.INVOICES, JSON.stringify(fullPayload.invoices));
    if (fullPayload.payments) safeSetItem(KEYS.PAYMENTS, JSON.stringify(fullPayload.payments));
    if (fullPayload.installmentPlans) safeSetItem(KEYS.INSTALLMENT_PLANS, JSON.stringify(fullPayload.installmentPlans));
    if (fullPayload.feeAuditLogs) safeSetItem(KEYS.FEE_AUDIT_LOGS, JSON.stringify(fullPayload.feeAuditLogs));
    if (fullPayload.admissionApplications) safeSetItem(KEYS.ADMISSION_APPLICATIONS, JSON.stringify(fullPayload.admissionApplications));
    if (fullPayload.examMarks) safeSetItem(KEYS.EXAM_MARKS, JSON.stringify(fullPayload.examMarks));
    if (fullPayload.poeDocuments) safeSetItem(KEYS.POE_DOCUMENTS, JSON.stringify(fullPayload.poeDocuments));
    if (fullPayload.poeNotifications) safeSetItem(KEYS.POE_NOTIFICATIONS, JSON.stringify(fullPayload.poeNotifications));
    if (fullPayload.poeRubrics) safeSetItem(KEYS.POE_RUBRICS, JSON.stringify(fullPayload.poeRubrics));

    // 2. Check network connectivity
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('error');
      setSyncErrorMessage("Offline Mode: You are currently offline. Changes are saved locally on this computer and will automatically sync when reconnected.");
      return true;
    }

    // 3. Save to Firebase Cloud Firestore and local server
    try {
      const result = await saveApplicationState(fullPayload);
      if (result.firestoreSaved || result.isCloudSynced) {
        setSyncStatus('synced');
        setSyncErrorMessage(null);
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (Cloud Synced)');
      } else {
        setSyncStatus('error');
        setSyncErrorMessage(result.error || "Could not reach Cloud Firestore. Saved locally on this device.");
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' (Local Only)');
      }
      return true;
    } catch (err: any) {
      console.warn('[Database Sync] Cloud write notice:', err);
      setSyncStatus('error');
      setSyncErrorMessage("Could not reach Cloud Firestore. Changes are safely saved locally on this computer.");
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " (Local Only)");
      return true;
    }
  }, [
    users, departments, courses, classrooms, units, courseGroups,
    timetableEntries, trainerPreferences, academicSetting, websiteConfig,
    students, feeStructures, invoices, payments, installmentPlans,
    feeAuditLogs, admissionApplications, examMarks, poeDocuments, poeNotifications, poeRubrics
  ]);

  // AUTOMATIC REAL-TIME SAVER (Instant when immediate=true, otherwise debounced)
  const triggerAutoSave = useCallback((stateOverride?: any, immediate: boolean = false) => {
    if (stateOverride) {
      stateRef.current = {
        ...stateRef.current,
        ...stateOverride
      };
      safeSetItem(LAST_UPDATED_KEY, new Date().toISOString());
      if (stateOverride.users) safeSetItem(KEYS.USERS, JSON.stringify(stateOverride.users));
      if (stateOverride.departments) safeSetItem(KEYS.DEPARTMENTS, JSON.stringify(stateOverride.departments));
      if (stateOverride.courses) safeSetItem(KEYS.COURSES, JSON.stringify(stateOverride.courses));
      if (stateOverride.classrooms) safeSetItem(KEYS.CLASSROOMS, JSON.stringify(stateOverride.classrooms));
      if (stateOverride.units) safeSetItem(KEYS.UNITS, JSON.stringify(stateOverride.units));
      if (stateOverride.courseGroups) safeSetItem(KEYS.COURSE_GROUPS, JSON.stringify(stateOverride.courseGroups));
      if (stateOverride.timetableEntries) safeSetItem(KEYS.TIMETABLE, JSON.stringify(stateOverride.timetableEntries));
      if (stateOverride.trainerPreferences) safeSetItem(KEYS.PREFERENCES, JSON.stringify(stateOverride.trainerPreferences));
      if (stateOverride.academicSetting) safeSetItem(KEYS.ACADEMIC, JSON.stringify(stateOverride.academicSetting));
      if (stateOverride.websiteConfig) safeSetItem(KEYS.WEBSITE_CONFIG, JSON.stringify(stateOverride.websiteConfig));
      if (stateOverride.students) safeSetItem(KEYS.STUDENTS, JSON.stringify(stateOverride.students));
      if (stateOverride.feeStructures) safeSetItem(KEYS.FEE_STRUCTURES, JSON.stringify(stateOverride.feeStructures));
      if (stateOverride.invoices) safeSetItem(KEYS.INVOICES, JSON.stringify(stateOverride.invoices));
      if (stateOverride.payments) safeSetItem(KEYS.PAYMENTS, JSON.stringify(stateOverride.payments));
      if (stateOverride.installmentPlans) safeSetItem(KEYS.INSTALLMENT_PLANS, JSON.stringify(stateOverride.installmentPlans));
      if (stateOverride.feeAuditLogs) safeSetItem(KEYS.FEE_AUDIT_LOGS, JSON.stringify(stateOverride.feeAuditLogs));
      if (stateOverride.admissionApplications) safeSetItem(KEYS.ADMISSION_APPLICATIONS, JSON.stringify(stateOverride.admissionApplications));
      if (stateOverride.examMarks) safeSetItem(KEYS.EXAM_MARKS, JSON.stringify(stateOverride.examMarks));
      if (stateOverride.poeDocuments) safeSetItem(KEYS.POE_DOCUMENTS, JSON.stringify(stateOverride.poeDocuments));
      if (stateOverride.poeNotifications) safeSetItem(KEYS.POE_NOTIFICATIONS, JSON.stringify(stateOverride.poeNotifications));
      if (stateOverride.poeRubrics) safeSetItem(KEYS.POE_RUBRICS, JSON.stringify(stateOverride.poeRubrics));
    }

    setSyncStatus('saving');
    if (immediate) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      saveStateToDatabaseImmediately(stateOverride);
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      saveStateToDatabaseImmediately();
    }, 250);
  }, [saveStateToDatabaseImmediately]);

  // Ensure state is flushed on page unload/navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      try {
        const payload = stateRef.current;
        safeSetItem(LAST_UPDATED_KEY, new Date().toISOString());
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/state', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
        }
      } catch (e) {}
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Monitor network connection status automatically
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("[Network] Online event detected. Immediately syncing changes to database...");
      saveStateToDatabaseImmediately();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('error');
      setSyncErrorMessage("Network Disconnected: You are currently offline. Changes are saved locally but cannot reach the database.");
      setIsErrorBannerDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [saveStateToDatabaseImmediately]);

  // Backward-compatible syncStateToServer alias pointing to immediate save
  const syncStateToServer = async (customState?: any) => {
    await saveStateToDatabaseImmediately(customState);
  };


  // Initialize and load state from Server or Fallback LocalStorage on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        const localLastUpdated = localStorage.getItem(LAST_UPDATED_KEY);
        const loadedState = await loadApplicationState(localLastUpdated);

        if (loadedState) {
          // Loaded successfully from Cloud Firestore or Server!
          const { 
            users: sUsers, 
            departments: sDepts, 
            courses: sCourses, 
            classrooms: sClassrooms, 
            units: sUnits, 
            courseGroups: sCourseGroups,
            timetableEntries: sEntries, 
            trainerPreferences: sPrefs, 
            academicSetting: sAcademic,
            students: sStudents,
            feeStructures: sFeeStructures,
            invoices: sInvoices,
            payments: sPayments,
            installmentPlans: sInstallmentPlans,
            feeAuditLogs: sFeeAuditLogs,
            admissionApplications: sAdmissions,
            examMarks: sExams,
            websiteConfig: sWebsiteConfig,
            poeDocuments: sPoeDocuments,
            poeNotifications: sPoeNotifications,
            poeRubrics: sPoeRubrics
          } = loadedState;
          
          let resolvedUsers: User[] = users;
          const rawServerUsers = Array.isArray(sUsers) && sUsers.length > 1 ? sUsers : INITIAL_USERS;
          let mappedUsers = rawServerUsers.map((u: any) => u.username?.toLowerCase() === 'admin' ? { ...u, password: 'admin123', isActive: true, isDefault: true, isDemo: false } : { ...u, isActive: true });
          if (!mappedUsers.some((u: any) => u.username?.toLowerCase() === 'admin' || u.role === 'admin')) {
            mappedUsers.unshift(INITIAL_USERS[0]);
          }
          for (const initU of INITIAL_USERS) {
            if (!mappedUsers.some((u: any) => u.id === initU.id || u.username?.toLowerCase() === initU.username.toLowerCase())) {
              mappedUsers.push(initU);
            }
          }
          resolvedUsers = mappedUsers;
          setUsers(mappedUsers);
          safeSetItem(KEYS.USERS, JSON.stringify(mappedUsers));
          localStorage.removeItem(KEYS.DEMO_ACCOUNTS_PURGED);

          const resolvedDepts = (Array.isArray(sDepts) && sDepts.length > 0) ? sDepts : INITIAL_DEPARTMENTS;
          setDepartments(resolvedDepts);
          localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(resolvedDepts));

          const resolvedCourses = (Array.isArray(sCourses) && sCourses.length > 0) ? sCourses : INITIAL_COURSES;
          setCourses(resolvedCourses);
          localStorage.setItem(KEYS.COURSES, JSON.stringify(resolvedCourses));

          const resolvedClassrooms = (Array.isArray(sClassrooms) && sClassrooms.length > 0) ? sClassrooms : INITIAL_CLASSROOMS;
          setClassroom(resolvedClassrooms);
          localStorage.setItem(KEYS.CLASSROOMS, JSON.stringify(resolvedClassrooms));

          const resolvedUnits = (Array.isArray(sUnits) && sUnits.length > 0) ? sUnits : INITIAL_UNITS;
          setUnits(resolvedUnits);
          localStorage.setItem(KEYS.UNITS, JSON.stringify(resolvedUnits));

          const resolvedCourseGroups = sCourseGroups || [];
          setCourseGroups(resolvedCourseGroups);
          localStorage.setItem(KEYS.COURSE_GROUPS, JSON.stringify(resolvedCourseGroups));

          const resolvedEntries = (Array.isArray(sEntries) && sEntries.length > 0) ? sEntries : INITIAL_TIMETABLE_ENTRIES;
          setTimetableEntries(resolvedEntries);
          localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(resolvedEntries));

          const resolvedPrefs = (Array.isArray(sPrefs) && sPrefs.length > 0) ? sPrefs : INITIAL_TRAINER_PREFERENCES;
          setTrainerPreferences(resolvedPrefs);
          localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(resolvedPrefs));

          const resolvedAcademic = sAcademic || DEFAULT_ACADEMIC_SETTING;
          setAcademicSetting(resolvedAcademic);
          localStorage.setItem(KEYS.ACADEMIC, JSON.stringify(resolvedAcademic));
          
          // Dynamic website CMS config
          if (sWebsiteConfig) {
            setWebsiteConfig(sWebsiteConfig);
            localStorage.setItem(KEYS.WEBSITE_CONFIG, JSON.stringify(sWebsiteConfig));
          } else {
            const cachedWebsite = localStorage.getItem(KEYS.WEBSITE_CONFIG);
            const loadedWebsite = cachedWebsite ? JSON.parse(cachedWebsite) : DEFAULT_WEBSITE_CONFIG;
            setWebsiteConfig(loadedWebsite);
            localStorage.setItem(KEYS.WEBSITE_CONFIG, JSON.stringify(loadedWebsite));
          }

          // Set fee variables
          const loadedStudents = sStudents || INITIAL_STUDENTS;
          setStudents(loadedStudents);
          localStorage.setItem(KEYS.STUDENTS, JSON.stringify(loadedStudents));

          const loadedFeeStructures = sFeeStructures || INITIAL_FEE_STRUCTURES;
          setFeeStructures(loadedFeeStructures);
          localStorage.setItem(KEYS.FEE_STRUCTURES, JSON.stringify(loadedFeeStructures));

          const loadedInvoices = sInvoices || INITIAL_INVOICES;
          setInvoices(loadedInvoices);
          localStorage.setItem(KEYS.INVOICES, JSON.stringify(loadedInvoices));

          const loadedPayments = sPayments || INITIAL_PAYMENTS;
          setPayments(loadedPayments);
          localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(loadedPayments));

          const loadedInstallments = sInstallmentPlans || INITIAL_INSTALLMENT_PLANS;
          setInstallmentPlans(loadedInstallments);
          localStorage.setItem(KEYS.INSTALLMENT_PLANS, JSON.stringify(loadedInstallments));

          const loadedFeeLogs = sFeeAuditLogs || INITIAL_FEE_AUDIT_LOGS;
          setFeeAuditLogs(loadedFeeLogs);
          localStorage.setItem(KEYS.FEE_AUDIT_LOGS, JSON.stringify(loadedFeeLogs));

          // Set ERP variables
          const loadedAdmissions = sAdmissions || INITIAL_ADMISSION_APPLICATIONS;
          setAdmissionApplications(loadedAdmissions);
          localStorage.setItem(KEYS.ADMISSION_APPLICATIONS, JSON.stringify(loadedAdmissions));

          const loadedExams = sExams || INITIAL_EXAM_MARKS;
          setExamMarks(loadedExams);
          localStorage.setItem(KEYS.EXAM_MARKS, JSON.stringify(loadedExams));

          // Set PoE variables
          const loadedPoeDocs = sPoeDocuments || INITIAL_POE_DOCUMENTS;
          setPoeDocuments(loadedPoeDocs);
          localStorage.setItem(KEYS.POE_DOCUMENTS, JSON.stringify(loadedPoeDocs));

          const loadedPoeNotifs = sPoeNotifications || INITIAL_POE_NOTIFICATIONS;
          setPoeNotifications(loadedPoeNotifs);
          localStorage.setItem(KEYS.POE_NOTIFICATIONS, JSON.stringify(loadedPoeNotifs));

          const loadedPoeRubrics = sPoeRubrics || INITIAL_POE_RUBRICS;
          setPoeRubrics(loadedPoeRubrics);
          localStorage.setItem(KEYS.POE_RUBRICS, JSON.stringify(loadedPoeRubrics));

          // Set complete state in stateRef for immediate availability
          stateRef.current = {
            users: resolvedUsers,
            departments: sDepts || INITIAL_DEPARTMENTS,
            courses: sCourses || INITIAL_COURSES,
            classrooms: sClassrooms || INITIAL_CLASSROOMS,
            units: sUnits || INITIAL_UNITS,
            courseGroups: sCourseGroups || [],
            timetableEntries: sEntries || INITIAL_TIMETABLE_ENTRIES,
            trainerPreferences: sPrefs || INITIAL_TRAINER_PREFERENCES,
            academicSetting: sAcademic || DEFAULT_ACADEMIC_SETTING,
            websiteConfig: sWebsiteConfig || DEFAULT_WEBSITE_CONFIG,
            students: loadedStudents,
            feeStructures: loadedFeeStructures,
            invoices: loadedInvoices,
            payments: loadedPayments,
            installmentPlans: loadedInstallments,
            feeAuditLogs: loadedFeeLogs,
            admissionApplications: loadedAdmissions,
            examMarks: loadedExams,
            poeDocuments: loadedPoeDocs,
            poeNotifications: loadedPoeNotifs,
            poeRubrics: loadedPoeRubrics
          };
        } else {
          // No state on server yet! Load local storage fallback or initial seed data, and save to server.
          const storedUsers = localStorage.getItem(KEYS.USERS);
          const storedDepts = localStorage.getItem(KEYS.DEPARTMENTS);
          const storedCourses = localStorage.getItem(KEYS.COURSES);
          const storedRooms = localStorage.getItem(KEYS.CLASSROOMS);
          const storedUnits = localStorage.getItem(KEYS.UNITS);
          const storedCourseGroups = localStorage.getItem(KEYS.COURSE_GROUPS);
          const storedEntries = localStorage.getItem(KEYS.TIMETABLE);
          const storedPrefs = localStorage.getItem(KEYS.PREFERENCES);
          const storedAcademic = localStorage.getItem(KEYS.ACADEMIC);
          const storedWebsite = localStorage.getItem(KEYS.WEBSITE_CONFIG);
          const storedStudents = localStorage.getItem(KEYS.STUDENTS);
          const storedFeeStructures = localStorage.getItem(KEYS.FEE_STRUCTURES);
          const storedInvoices = localStorage.getItem(KEYS.INVOICES);
          const storedPayments = localStorage.getItem(KEYS.PAYMENTS);
          const storedInstallments = localStorage.getItem(KEYS.INSTALLMENT_PLANS);
          const storedFeeLogs = localStorage.getItem(KEYS.FEE_AUDIT_LOGS);
          const storedAdmissions = localStorage.getItem(KEYS.ADMISSION_APPLICATIONS);
          const storedExams = localStorage.getItem(KEYS.EXAM_MARKS);
          const storedPoeDocs = localStorage.getItem(KEYS.POE_DOCUMENTS);
          const storedPoeNotifs = localStorage.getItem(KEYS.POE_NOTIFICATIONS);
          const storedPoeRubrics = localStorage.getItem(KEYS.POE_RUBRICS);

          localStorage.removeItem(KEYS.DEMO_ACCOUNTS_PURGED);
          const parsedUsers = storedUsers ? JSON.parse(storedUsers) : null;
          const rawLoadedUsers = (Array.isArray(parsedUsers) && parsedUsers.length > 1) ? parsedUsers : INITIAL_USERS;
          let loadedUsers = rawLoadedUsers.map((u: any) => u.username.toLowerCase() === 'admin' ? { ...u, password: 'admin123', isActive: true, isDefault: true, isDemo: false } : { ...u, isActive: true });
          if (!loadedUsers.some((u: any) => u.username?.toLowerCase() === 'admin' || u.role === 'admin')) {
            loadedUsers.unshift(INITIAL_USERS[0]);
          }
          for (const initU of INITIAL_USERS) {
            if (!loadedUsers.some((u: any) => u.id === initU.id || u.username?.toLowerCase() === initU.username.toLowerCase())) {
              loadedUsers.push(initU);
            }
          }
          const loadedDepts = (storedDepts && JSON.parse(storedDepts).length > 0) ? JSON.parse(storedDepts) : INITIAL_DEPARTMENTS;
          const loadedCourses = (storedCourses && JSON.parse(storedCourses).length > 0) ? JSON.parse(storedCourses) : INITIAL_COURSES;
          const loadedRooms = (storedRooms && JSON.parse(storedRooms).length > 0) ? JSON.parse(storedRooms) : INITIAL_CLASSROOMS;
          const loadedUnits = (storedUnits && JSON.parse(storedUnits).length > 0) ? JSON.parse(storedUnits) : INITIAL_UNITS;
          const loadedCourseGroups = storedCourseGroups ? JSON.parse(storedCourseGroups) : [];
          const loadedEntries = (storedEntries && JSON.parse(storedEntries).length > 0) ? JSON.parse(storedEntries) : INITIAL_TIMETABLE_ENTRIES;
          const loadedPrefs = storedPrefs ? JSON.parse(storedPrefs) : INITIAL_TRAINER_PREFERENCES;
          const loadedAcademic = storedAcademic ? JSON.parse(storedAcademic) : DEFAULT_ACADEMIC_SETTING;
          const loadedWebsite = storedWebsite ? JSON.parse(storedWebsite) : DEFAULT_WEBSITE_CONFIG;
          const loadedStudents = storedStudents ? JSON.parse(storedStudents) : INITIAL_STUDENTS;
          const loadedFeeStructures = storedFeeStructures ? JSON.parse(storedFeeStructures) : INITIAL_FEE_STRUCTURES;
          const loadedInvoices = storedInvoices ? JSON.parse(storedInvoices) : INITIAL_INVOICES;
          const loadedPayments = storedPayments ? JSON.parse(storedPayments) : INITIAL_PAYMENTS;
          const loadedInstallments = storedInstallments ? JSON.parse(storedInstallments) : INITIAL_INSTALLMENT_PLANS;
          const loadedFeeLogs = storedFeeLogs ? JSON.parse(storedFeeLogs) : INITIAL_FEE_AUDIT_LOGS;
          const loadedAdmissions = storedAdmissions ? JSON.parse(storedAdmissions) : INITIAL_ADMISSION_APPLICATIONS;
          const loadedExams = storedExams ? JSON.parse(storedExams) : INITIAL_EXAM_MARKS;
          const loadedPoeDocs = storedPoeDocs ? JSON.parse(storedPoeDocs) : INITIAL_POE_DOCUMENTS;
          const loadedPoeNotifs = storedPoeNotifs ? JSON.parse(storedPoeNotifs) : INITIAL_POE_NOTIFICATIONS;
          const loadedPoeRubrics = storedPoeRubrics ? JSON.parse(storedPoeRubrics) : INITIAL_POE_RUBRICS;

          setUsers(loadedUsers);
          setDepartments(loadedDepts);
          setCourses(loadedCourses);
          setClassroom(loadedRooms);
          setUnits(loadedUnits);
          setCourseGroups(loadedCourseGroups);
          setTimetableEntries(loadedEntries);
          setTrainerPreferences(loadedPrefs);
          setAcademicSetting(loadedAcademic);
          setWebsiteConfig(loadedWebsite);
          setStudents(loadedStudents);
          setFeeStructures(loadedFeeStructures);
          setInvoices(loadedInvoices);
          setPayments(loadedPayments);
          setInstallmentPlans(loadedInstallments);
          setFeeAuditLogs(loadedFeeLogs);
          setAdmissionApplications(loadedAdmissions);
          setExamMarks(loadedExams);
          setPoeDocuments(loadedPoeDocs);
          setPoeNotifications(loadedPoeNotifs);
          setPoeRubrics(loadedPoeRubrics);

          // Save fallback/seeded to localStorage
          localStorage.setItem(KEYS.USERS, JSON.stringify(loadedUsers));
          localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(loadedDepts));
          localStorage.setItem(KEYS.COURSES, JSON.stringify(loadedCourses));
          localStorage.setItem(KEYS.CLASSROOMS, JSON.stringify(loadedRooms));
          localStorage.setItem(KEYS.UNITS, JSON.stringify(loadedUnits));
          localStorage.setItem(KEYS.COURSE_GROUPS, JSON.stringify(loadedCourseGroups));
          localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(loadedEntries));
          localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(loadedPrefs));
          localStorage.setItem(KEYS.ACADEMIC, JSON.stringify(loadedAcademic));
          localStorage.setItem(KEYS.WEBSITE_CONFIG, JSON.stringify(loadedWebsite));
          localStorage.setItem(KEYS.STUDENTS, JSON.stringify(loadedStudents));
          localStorage.setItem(KEYS.FEE_STRUCTURES, JSON.stringify(loadedFeeStructures));
          localStorage.setItem(KEYS.INVOICES, JSON.stringify(loadedInvoices));
          localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(loadedPayments));
          localStorage.setItem(KEYS.INSTALLMENT_PLANS, JSON.stringify(loadedInstallments));
          localStorage.setItem(KEYS.FEE_AUDIT_LOGS, JSON.stringify(loadedFeeLogs));
          localStorage.setItem(KEYS.ADMISSION_APPLICATIONS, JSON.stringify(loadedAdmissions));
          localStorage.setItem(KEYS.EXAM_MARKS, JSON.stringify(loadedExams));
          localStorage.setItem(KEYS.POE_DOCUMENTS, JSON.stringify(loadedPoeDocs));
          localStorage.setItem(KEYS.POE_NOTIFICATIONS, JSON.stringify(loadedPoeNotifs));
          localStorage.setItem(KEYS.POE_RUBRICS, JSON.stringify(loadedPoeRubrics));

          // Initialize local stateRef for immediate availability
          const initialState = {
            users: loadedUsers,
            departments: loadedDepts,
            courses: loadedCourses,
            classrooms: loadedRooms,
            units: loadedUnits,
            courseGroups: loadedCourseGroups,
            timetableEntries: loadedEntries,
            trainerPreferences: loadedPrefs,
            academicSetting: loadedAcademic,
            websiteConfig: loadedWebsite,
            students: loadedStudents,
            feeStructures: loadedFeeStructures,
            invoices: loadedInvoices,
            payments: loadedPayments,
            installmentPlans: loadedInstallments,
            feeAuditLogs: loadedFeeLogs,
            admissionApplications: loadedAdmissions,
            examMarks: loadedExams,
            poeDocuments: loadedPoeDocs,
            poeNotifications: loadedPoeNotifs,
            poeRubrics: loadedPoeRubrics
          };
          stateRef.current = initialState;
          // CRITICAL: NEVER push initialState to the database on boot!
          // This guarantees that initial fallback seeds NEVER overwrite existing cloud timetables when published or opening new tabs.
        }

        setSyncStatus('synced');
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

        // Validate Firestore connectivity in background (Firebase skill constraint)
        testConnection().catch(() => {});

        // Auto-restore logged in user session if active
        const storedCurrentUser = localStorage.getItem(KEYS.CURRENT_USER);
        if (storedCurrentUser) {
          const parsedUser = JSON.parse(storedCurrentUser);
          // Latest users list
          const latestUsersStr = localStorage.getItem(KEYS.USERS);
          const latestUsers = latestUsersStr ? JSON.parse(latestUsersStr) : INITIAL_USERS;
          const verifiedUser = latestUsers.find((u: any) => u.id === parsedUser.id);
          if (verifiedUser && verifiedUser.isActive) {
            setCurrentUser(verifiedUser);
          } else {
            localStorage.removeItem(KEYS.CURRENT_USER);
          }
        }
      } catch (e) {
        console.error("Server synchronization initialization failed, fallback to local:", e);
        // Fallback completely to local storage
        try {
          const storedUsers = localStorage.getItem(KEYS.USERS);
          const storedDepts = localStorage.getItem(KEYS.DEPARTMENTS);
          const storedCourses = localStorage.getItem(KEYS.COURSES);
          const storedRooms = localStorage.getItem(KEYS.CLASSROOMS);
          const storedUnits = localStorage.getItem(KEYS.UNITS);
          const storedEntries = localStorage.getItem(KEYS.TIMETABLE);
          const storedPrefs = localStorage.getItem(KEYS.PREFERENCES);
          const storedAcademic = localStorage.getItem(KEYS.ACADEMIC);
          const storedStudents = localStorage.getItem(KEYS.STUDENTS);
          const storedFeeStructures = localStorage.getItem(KEYS.FEE_STRUCTURES);
          const storedInvoices = localStorage.getItem(KEYS.INVOICES);
          const storedPayments = localStorage.getItem(KEYS.PAYMENTS);
          const storedInstallments = localStorage.getItem(KEYS.INSTALLMENT_PLANS);
          const storedFeeLogs = localStorage.getItem(KEYS.FEE_AUDIT_LOGS);
          const storedAdmissions = localStorage.getItem(KEYS.ADMISSION_APPLICATIONS);
          const storedExams = localStorage.getItem(KEYS.EXAM_MARKS);
          const storedCurrentUser = localStorage.getItem(KEYS.CURRENT_USER);

          const isPurged = localStorage.getItem(KEYS.DEMO_ACCOUNTS_PURGED) === 'true';
          let fallbackUsers = (storedUsers ? JSON.parse(storedUsers) : (isPurged ? [INITIAL_USERS[0]] : INITIAL_USERS)).map((u: any) => u.username.toLowerCase() === 'admin' ? { ...u, password: 'admin123', isActive: true, isDefault: true, isDemo: false } : u);
          if (isPurged) {
            fallbackUsers = fallbackUsers.filter((u: any) => !isDemoAccount(u));
          }
          setUsers(fallbackUsers);
          setDepartments(storedDepts ? JSON.parse(storedDepts) : INITIAL_DEPARTMENTS);
          setCourses(storedCourses ? JSON.parse(storedCourses) : INITIAL_COURSES);
          setClassroom(storedRooms ? JSON.parse(storedRooms) : INITIAL_CLASSROOMS);
          setUnits(storedUnits ? JSON.parse(storedUnits) : INITIAL_UNITS);
          setTimetableEntries(storedEntries ? JSON.parse(storedEntries) : INITIAL_TIMETABLE_ENTRIES);
          setTrainerPreferences(storedPrefs ? JSON.parse(storedPrefs) : INITIAL_TRAINER_PREFERENCES);
          setAcademicSetting(storedAcademic ? JSON.parse(storedAcademic) : DEFAULT_ACADEMIC_SETTING);
          setStudents(storedStudents ? JSON.parse(storedStudents) : INITIAL_STUDENTS);
          setFeeStructures(storedFeeStructures ? JSON.parse(storedFeeStructures) : INITIAL_FEE_STRUCTURES);
          setInvoices(storedInvoices ? JSON.parse(storedInvoices) : INITIAL_INVOICES);
          setPayments(storedPayments ? JSON.parse(storedPayments) : INITIAL_PAYMENTS);
          setInstallmentPlans(storedInstallments ? JSON.parse(storedInstallments) : INITIAL_INSTALLMENT_PLANS);
          setFeeAuditLogs(storedFeeLogs ? JSON.parse(storedFeeLogs) : INITIAL_FEE_AUDIT_LOGS);
          setAdmissionApplications(storedAdmissions ? JSON.parse(storedAdmissions) : INITIAL_ADMISSION_APPLICATIONS);
          setExamMarks(storedExams ? JSON.parse(storedExams) : INITIAL_EXAM_MARKS);

          if (storedCurrentUser) {
            const parsedUser = JSON.parse(storedCurrentUser);
            const verifiedUser = fallbackUsers.find((u: any) => u.id === parsedUser.id);
            if (verifiedUser && verifiedUser.isActive) {
              setCurrentUser(verifiedUser);
            } else {
              localStorage.removeItem(KEYS.CURRENT_USER);
            }
          }
        } catch (innerError) {
          console.error("Local storage fallback also failed:", innerError);
        }
      } finally {
        setIsInitialized(true);
      }
    };

    initializeData();
  }, []);

  // REAL-TIME MULTI-TAB & MULTI-MACHINE SYNCHRONIZATION
  useEffect(() => {
    // Listen to real-time events from Cloud Firestore (cross-machine) and BroadcastChannel (cross-tab)
    const unsubscribe = subscribeToRealtimeUpdates((update) => {
      if (!update) return;

      // 1. Timetable entries update (instant sync without refresh)
      if (update.timetableEntries && Array.isArray(update.timetableEntries)) {
        const incomingJson = JSON.stringify(update.timetableEntries);
        const currentJson = JSON.stringify(stateRef.current.timetableEntries);
        if (incomingJson !== currentJson) {
          console.log(`[Realtime Sync] Timetable updated from ${update.source}: ${update.timetableEntries.length} entries.`);
          setTimetableEntries(update.timetableEntries);
          stateRef.current.timetableEntries = update.timetableEntries;
          safeSetItem(KEYS.TIMETABLE, incomingJson);
          setLastSavedTime(
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
            (update.source === 'cross_tab_broadcast' ? ' (Tab Live)' : ' (Cloud Live)')
          );
          setSyncStatus('synced');
        }
      }

      // 2. Units update
      if (update.units && Array.isArray(update.units)) {
        const incomingJson = JSON.stringify(update.units);
        const currentJson = JSON.stringify(stateRef.current.units);
        if (incomingJson !== currentJson) {
          setUnits(update.units);
          stateRef.current.units = update.units;
          safeSetItem(KEYS.UNITS, incomingJson);
        }
      }

      // 3. Course Groups update
      if (update.courseGroups && Array.isArray(update.courseGroups)) {
        const incomingJson = JSON.stringify(update.courseGroups);
        const currentJson = JSON.stringify(stateRef.current.courseGroups);
        if (incomingJson !== currentJson) {
          setCourseGroups(update.courseGroups);
          stateRef.current.courseGroups = update.courseGroups;
          safeSetItem(KEYS.COURSE_GROUPS, incomingJson);
        }
      }

      // 4. Website config update (Front Page CMS)
      if (update.websiteConfig) {
        const incomingJson = JSON.stringify(update.websiteConfig);
        const currentJson = JSON.stringify(stateRef.current.websiteConfig);
        if (incomingJson !== currentJson) {
          setWebsiteConfig(update.websiteConfig);
          stateRef.current.websiteConfig = update.websiteConfig;
          safeSetItem(KEYS.WEBSITE_CONFIG, incomingJson);
        }
      }

      // 5. Academic settings update
      if (update.academicSetting) {
        const incomingJson = JSON.stringify(update.academicSetting);
        const currentJson = JSON.stringify(stateRef.current.academicSetting);
        if (incomingJson !== currentJson) {
          setAcademicSetting(update.academicSetting);
          stateRef.current.academicSetting = update.academicSetting;
          safeSetItem(KEYS.ACADEMIC, incomingJson);
        }
      }

      // 6. TVET Portfolio of Evidence (PoE) real-time cross-tab & cross-machine sync
      if (update.poeDocuments && Array.isArray(update.poeDocuments)) {
        const incomingJson = JSON.stringify(update.poeDocuments);
        const currentJson = JSON.stringify(stateRef.current.poeDocuments);
        if (incomingJson !== currentJson) {
          console.log(`[Realtime Sync] PoE Documents updated from ${update.source}: ${update.poeDocuments.length} files.`);
          setPoeDocuments(update.poeDocuments);
          stateRef.current.poeDocuments = update.poeDocuments;
          safeSetItem(KEYS.POE_DOCUMENTS, incomingJson);
        }
      }

      if (update.poeNotifications && Array.isArray(update.poeNotifications)) {
        const incomingJson = JSON.stringify(update.poeNotifications);
        const currentJson = JSON.stringify(stateRef.current.poeNotifications);
        if (incomingJson !== currentJson) {
          setPoeNotifications(update.poeNotifications);
          stateRef.current.poeNotifications = update.poeNotifications;
          safeSetItem(KEYS.POE_NOTIFICATIONS, incomingJson);
        }
      }

      // 7. Users directory & demo accounts purge real-time synchronization
      if (update.users && Array.isArray(update.users)) {
        const incomingJson = JSON.stringify(update.users);
        const currentJson = JSON.stringify(stateRef.current.users);
        if (incomingJson !== currentJson) {
          setUsers(update.users);
          stateRef.current.users = update.users;
          safeSetItem(KEYS.USERS, incomingJson);
          if (update.demoAccountsPurged) {
            safeSetItem(KEYS.DEMO_ACCOUNTS_PURGED, 'true');
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-route users to correct workspace based on roles
  useEffect(() => {
    if (currentUser) {
      if (['quality_assurance', 'assessor', 'deputy_academics', 'trainee'].includes(currentUser.role)) {
        setActiveWorkspace('portfolio');
      } else if (['registrar', 'finance_officer', 'auditor', 'principal', 'examinations_officer', 'student'].includes(currentUser.role)) {
        setActiveWorkspace('finance');
      } else if (['hod', 'trainer', 'manager', 'review', 'reviewer'].includes(currentUser.role as string)) {
        setActiveWorkspace('timetable');
      }
    }
  }, [currentUser]);

  // SYNCHRONIZED WRITING HELPERS (Instant local update + Immediate debounced database persistence)
  const updateUsersState = (updated: User[]) => {
    setUsers(updated);
    stateRef.current.users = updated;
    safeSetItem(KEYS.USERS, JSON.stringify(updated));
    // If current logged-in user details changed, update them
    if (currentUser) {
      const match = updated.find(u => u.id === currentUser.id);
      if (match) {
        if (!match.isActive) {
          handleLogout(); // Force logout if administrator deactivated account
        } else {
          setCurrentUser(match);
          safeSetItem(KEYS.CURRENT_USER, JSON.stringify(match));
        }
      }
    }
    triggerAutoSave({ users: updated });
  };

  const handlePurgeDemoAccounts = async () => {
    const demoAccounts = users.filter(u => isDemoAccount(u));
    const demoCount = demoAccounts.length;
    if (demoCount === 0) return 0;

    const remainingUsers = users.filter(u => !isDemoAccount(u));
    if (!remainingUsers.some(u => u.role === 'admin' || u.username.toLowerCase() === 'admin')) {
      const adminAcc = users.find(u => u.role === 'admin') || INITIAL_USERS[0];
      remainingUsers.unshift(adminAcc);
    }

    safeSetItem(KEYS.DEMO_ACCOUNTS_PURGED, 'true');
    safeSetItem(KEYS.USERS, JSON.stringify(remainingUsers));

    setUsers(remainingUsers);
    stateRef.current.users = remainingUsers;
    stateRef.current.demoAccountsPurged = true;

    // Call server purge endpoint & immediate DB sync
    try {
      await purgeDemoAccountsDirectly();
    } catch (e) {
      console.warn('Purge demo accounts endpoint notice:', e);
    }

    await saveStateToDatabaseImmediately({
      users: remainingUsers,
      demoAccountsPurged: true,
      allowOverwrite: true
    });

    return demoCount;
  };

  const handleRestoreInstitutionalData = async () => {
    localStorage.removeItem(KEYS.DEMO_ACCOUNTS_PURGED);
    const restoredUsers = [...INITIAL_USERS];
    const restoredDepts = [...INITIAL_DEPARTMENTS];
    const restoredCourses = [...INITIAL_COURSES];
    const restoredRooms = [...INITIAL_CLASSROOMS];
    const restoredUnits = [...INITIAL_UNITS];
    const restoredEntries = [...INITIAL_TIMETABLE_ENTRIES];

    setUsers(restoredUsers);
    setDepartments(restoredDepts);
    setCourses(restoredCourses);
    setClassroom(restoredRooms);
    setUnits(restoredUnits);
    setTimetableEntries(restoredEntries);

    stateRef.current.users = restoredUsers;
    stateRef.current.departments = restoredDepts;
    stateRef.current.courses = restoredCourses;
    stateRef.current.classrooms = restoredRooms;
    stateRef.current.units = restoredUnits;
    stateRef.current.timetableEntries = restoredEntries;
    stateRef.current.demoAccountsPurged = false;

    safeSetItem(KEYS.USERS, JSON.stringify(restoredUsers));
    safeSetItem(KEYS.DEPARTMENTS, JSON.stringify(restoredDepts));
    safeSetItem(KEYS.COURSES, JSON.stringify(restoredCourses));
    safeSetItem(KEYS.CLASSROOMS, JSON.stringify(restoredRooms));
    safeSetItem(KEYS.UNITS, JSON.stringify(restoredUnits));
    safeSetItem(KEYS.TIMETABLE, JSON.stringify(restoredEntries));

    try {
      await restoreInstitutionalDataDirectly();
    } catch (e) {
      console.warn('Restore institutional data endpoint notice:', e);
    }

    await saveStateToDatabaseImmediately({
      users: restoredUsers,
      departments: restoredDepts,
      courses: restoredCourses,
      classrooms: restoredRooms,
      units: restoredUnits,
      timetableEntries: restoredEntries,
      demoAccountsPurged: false,
      allowOverwrite: true
    });

    return { usersCount: restoredUsers.length, entriesCount: restoredEntries.length };
  };

  const updateDepartmentsState = (updated: Department[]) => {
    setDepartments(updated);
    stateRef.current.departments = updated;
    safeSetItem(KEYS.DEPARTMENTS, JSON.stringify(updated));
    triggerAutoSave({ departments: updated });
  };

  const updateCoursesState = (updated: Course[]) => {
    setCourses(updated);
    stateRef.current.courses = updated;
    safeSetItem(KEYS.COURSES, JSON.stringify(updated));
    triggerAutoSave({ courses: updated });
  };

  const updateClassroomsState = (updated: Classroom[]) => {
    setClassroom(updated);
    stateRef.current.classrooms = updated;
    safeSetItem(KEYS.CLASSROOMS, JSON.stringify(updated));
    triggerAutoSave({ classrooms: updated });
  };

  const updateUnitsState = (updated: Unit[]) => {
    setUnits(updated);
    stateRef.current.units = updated;
    safeSetItem(KEYS.UNITS, JSON.stringify(updated));
    broadcastLocalUpdate('units', { units: updated });

    // Cascade delete safety: ensure any scheduled timetable entries for deleted units are purged immediately
    // even if they were already published, keeping identical data all round.
    const validUnitIds = new Set(updated.map(u => u.id));
    const cleanedEntries = timetableEntries.filter(e => validUnitIds.has(e.unitId));
    if (cleanedEntries.length !== timetableEntries.length) {
      setTimetableEntries(cleanedEntries);
      stateRef.current.timetableEntries = cleanedEntries;
      safeSetItem(KEYS.TIMETABLE, JSON.stringify(cleanedEntries));
      broadcastLocalUpdate('timetable', { timetableEntries: cleanedEntries, units: updated });
      triggerAutoSave({ units: updated, timetableEntries: cleanedEntries }, true);
      return;
    }

    triggerAutoSave({ units: updated }, true);
  };

  const updateCourseGroupsState = (updated: CourseGroup[]) => {
    setCourseGroups(updated);
    stateRef.current.courseGroups = updated;
    safeSetItem(KEYS.COURSE_GROUPS, JSON.stringify(updated));
    broadcastLocalUpdate('courseGroups', { courseGroups: updated });
    triggerAutoSave({ courseGroups: updated }, true);
  };

  const updateTimetableEntriesState = (updated: TimetableEntry[]) => {
    const deduplicated = deduplicateTimetableEntries(updated);
    setTimetableEntries(deduplicated);
    stateRef.current.timetableEntries = deduplicated;
    safeSetItem(KEYS.TIMETABLE, JSON.stringify(deduplicated));
    // Immediately broadcast to other open tabs on this machine (<1ms)
    broadcastLocalUpdate('timetable', {
      timetableEntries: deduplicated,
      units: stateRef.current.units,
      courseGroups: stateRef.current.courseGroups
    });
    // Dedicated instant save for timetable to ensure zero latency in cloud
    saveTimetableDirectly(deduplicated, stateRef.current.units, stateRef.current.courseGroups, true).catch(() => {});
  };

  // Dedicated atomic slot deletion with instant optimistic state update and reliable persistence
  const handleDeleteTimetableSlot = async (idOrIds: string | string[]): Promise<boolean> => {
    const idArray = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
    const ids = new Set(idArray);
    const current = stateRef.current.timetableEntries || timetableEntries;
    const remaining = current.filter(e => !ids.has(e.id));
    
    // 1. Instant local UI update
    setTimetableEntries(remaining);
    stateRef.current.timetableEntries = remaining;
    safeSetItem(KEYS.TIMETABLE, JSON.stringify(remaining));

    // 2. Broadcast to other tabs
    broadcastLocalUpdate('timetable', {
      timetableEntries: remaining,
      units: stateRef.current.units,
      courseGroups: stateRef.current.courseGroups
    });

    // 3. Authoritative server delete
    try {
      const res = await deleteSlotDirectly(idArray);
      if (res.success && Array.isArray(res.timetableEntries)) {
        setTimetableEntries(res.timetableEntries);
        stateRef.current.timetableEntries = res.timetableEntries;
        safeSetItem(KEYS.TIMETABLE, JSON.stringify(res.timetableEntries));
      }
      return true;
    } catch (e) {
      console.warn('[Slot Delete] Error in cloud sync:', e);
      return false;
    }
  };

  // Dedicated atomic slot saving with instant optimistic state update and reliable persistence
  const handleSaveTimetableSlot = async (
    entryOrEntries: TimetableEntry | TimetableEntry[],
    nextUnits?: Unit[],
    nextGroups?: CourseGroup[]
  ): Promise<boolean> => {
    const entriesToSave = Array.isArray(entryOrEntries) ? entryOrEntries : [entryOrEntries];
    let current = [...(stateRef.current.timetableEntries || timetableEntries)];

    for (const item of entriesToSave) {
      current = current.filter(e => {
        if (e.id === item.id) return false;
        const sameSlot = e.courseId === item.courseId &&
                         e.semesterName === item.semesterName &&
                         e.day === item.day &&
                         e.slotId === item.slotId;
        if (!sameSlot) return true;
        if (!item.groupId && !item.groupName) return false;
        const itemGrp = (item.groupId || item.groupName || '').toLowerCase().trim();
        const eGrp = (e.groupId || e.groupName || '').toLowerCase().trim();
        if (!eGrp || eGrp === itemGrp) return false;
        return true;
      });
      current.push(item);
    }

    const cleanEntries = deduplicateTimetableEntries(current);

    // 1. Instant local UI update
    setTimetableEntries(cleanEntries);
    stateRef.current.timetableEntries = cleanEntries;
    safeSetItem(KEYS.TIMETABLE, JSON.stringify(cleanEntries));

    if (nextUnits && nextUnits.length > 0) {
      setUnits(nextUnits);
      stateRef.current.units = nextUnits;
      safeSetItem(KEYS.UNITS, JSON.stringify(nextUnits));
    }
    if (nextGroups && nextGroups.length > 0) {
      setCourseGroups(nextGroups);
      stateRef.current.courseGroups = nextGroups;
      safeSetItem(KEYS.COURSE_GROUPS, JSON.stringify(nextGroups));
    }

    // 2. Broadcast to other tabs
    broadcastLocalUpdate('timetable', {
      timetableEntries: cleanEntries,
      units: stateRef.current.units,
      courseGroups: stateRef.current.courseGroups
    });

    // 3. Authoritative server save
    try {
      const res = await saveSlotDirectly(entriesToSave, nextUnits, nextGroups);
      if (res.success && Array.isArray(res.timetableEntries)) {
        setTimetableEntries(res.timetableEntries);
        stateRef.current.timetableEntries = res.timetableEntries;
        safeSetItem(KEYS.TIMETABLE, JSON.stringify(res.timetableEntries));
      }
      return true;
    } catch (e) {
      console.warn('[Slot Save] Error in cloud sync:', e);
      return false;
    }
  };

  const updateTrainerPreferencesState = (updated: TrainerSlotPreference[]) => {
    setTrainerPreferences(updated);
    stateRef.current.trainerPreferences = updated;
    safeSetItem(KEYS.PREFERENCES, JSON.stringify(updated));
    triggerAutoSave({ trainerPreferences: updated }, true);
  };

  const updateAcademicSettingState = (updated: AcademicSetting) => {
    setAcademicSetting(updated);
    stateRef.current.academicSetting = updated;
    safeSetItem(KEYS.ACADEMIC, JSON.stringify(updated));
    triggerAutoSave({ academicSetting: updated }, true);
  };

  const updateStudentsState = (updated: Student[]) => {
    setStudents(updated);
    stateRef.current.students = updated;
    safeSetItem(KEYS.STUDENTS, JSON.stringify(updated));
    triggerAutoSave({ students: updated });
  };

  const updateFeeStructuresState = (updated: FeeStructure[]) => {
    setFeeStructures(updated);
    stateRef.current.feeStructures = updated;
    safeSetItem(KEYS.FEE_STRUCTURES, JSON.stringify(updated));
    triggerAutoSave({ feeStructures: updated });
  };

  const updateInvoicesState = (updated: Invoice[]) => {
    setInvoices(updated);
    stateRef.current.invoices = updated;
    safeSetItem(KEYS.INVOICES, JSON.stringify(updated));
    triggerAutoSave({ invoices: updated });
  };

  const updatePaymentsState = (updated: PaymentTransaction[]) => {
    setPayments(updated);
    stateRef.current.payments = updated;
    safeSetItem(KEYS.PAYMENTS, JSON.stringify(updated));
    triggerAutoSave({ payments: updated });
  };

  const updateInstallmentPlansState = (updated: InstallmentPlan[]) => {
    setInstallmentPlans(updated);
    stateRef.current.installmentPlans = updated;
    safeSetItem(KEYS.INSTALLMENT_PLANS, JSON.stringify(updated));
    triggerAutoSave({ installmentPlans: updated });
  };

  const updateFeeAuditLogsState = (updated: FeeAuditLog[]) => {
    setFeeAuditLogs(updated);
    stateRef.current.feeAuditLogs = updated;
    safeSetItem(KEYS.FEE_AUDIT_LOGS, JSON.stringify(updated));
    triggerAutoSave({ feeAuditLogs: updated });
  };

  const updateAdmissionApplicationsState = (updated: AdmissionApplication[]) => {
    setAdmissionApplications(updated);
    stateRef.current.admissionApplications = updated;
    safeSetItem(KEYS.ADMISSION_APPLICATIONS, JSON.stringify(updated));
    triggerAutoSave({ admissionApplications: updated });
  };

  const updateExamMarksState = (updated: ExamMark[]) => {
    setExamMarks(updated);
    stateRef.current.examMarks = updated;
    safeSetItem(KEYS.EXAM_MARKS, JSON.stringify(updated));
    triggerAutoSave({ examMarks: updated });
  };

  const updateWebsiteConfigState = (updated: WebsiteConfig) => {
    setWebsiteConfig(updated);
    stateRef.current.websiteConfig = updated;
    safeSetItem(KEYS.WEBSITE_CONFIG, JSON.stringify(updated));
    broadcastLocalUpdate('website', { websiteConfig: updated });
    saveWebsiteConfigDirectly(updated).catch(() => {});
    // Immediately synchronize any front page / website change to Cloud Firestore & server
    triggerAutoSave({ websiteConfig: updated }, true);
  };

  // TVET Portfolio of Evidence (PoE) State Handlers & Cloud Sync
  const updatePoeDocumentsState = (updated: PoeDocument[]) => {
    setPoeDocuments(updated);
    stateRef.current.poeDocuments = updated;
    safeSetItem(KEYS.POE_DOCUMENTS, JSON.stringify(updated));
    broadcastLocalUpdate('poe', { poeDocuments: updated });
    savePoeDirectly(updated, poeNotifications).catch(() => {});
    triggerAutoSave({ poeDocuments: updated }, true);
  };

  const updatePoeNotificationsState = (updated: PoeNotification[]) => {
    setPoeNotifications(updated);
    stateRef.current.poeNotifications = updated;
    safeSetItem(KEYS.POE_NOTIFICATIONS, JSON.stringify(updated));
    broadcastLocalUpdate('poe', { poeNotifications: updated });
    savePoeDirectly(poeDocuments, updated).catch(() => {});
    triggerAutoSave({ poeNotifications: updated }, true);
  };

  const updatePoeRubricsState = (updated: PoeRubric[]) => {
    setPoeRubrics(updated);
    stateRef.current.poeRubrics = updated;
    safeSetItem(KEYS.POE_RUBRICS, JSON.stringify(updated));
    triggerAutoSave({ poeRubrics: updated }, true);
  };

  const handleSavePoeDocument = (newDoc: PoeDocument) => {
    const updated = [newDoc, ...poeDocuments.filter(d => d.id !== newDoc.id)];
    updatePoeDocumentsState(updated);
  };

  const handleUpdatePoeDocument = (updatedDoc: PoeDocument) => {
    const updated = poeDocuments.map(d => d.id === updatedDoc.id ? updatedDoc : d);
    updatePoeDocumentsState(updated);
  };

  const handleDeletePoeDocument = (docId: string) => {
    const updated = poeDocuments.filter(d => d.id !== docId);
    updatePoeDocumentsState(updated);
  };

  const handleMarkPoeNotificationRead = (id: string) => {
    const updated = poeNotifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    updatePoeNotificationsState(updated);
  };

  const handleMarkAllPoeNotificationsRead = () => {
    const updated = poeNotifications.map(n => ({ ...n, isRead: true }));
    updatePoeNotificationsState(updated);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    if (['quality_assurance', 'assessor', 'trainee', 'student'].includes(user.role)) {
      setActiveWorkspace('portfolio');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(KEYS.CURRENT_USER);
  };

  // FULL BACKUP IMPORT STATE
  const handleImportState = (fullState: any) => {
    const updatedUsers = fullState.users || users;
    const updatedDepartments = fullState.departments || departments;
    const updatedCourses = fullState.courses || courses;
    const updatedClassrooms = fullState.classrooms || classrooms;
    const updatedUnits = fullState.units || units;
    const updatedCourseGroups = fullState.courseGroups || courseGroups;
    const updatedTimetableEntries = fullState.timetableEntries || timetableEntries;
    const updatedTrainerPreferences = fullState.trainerPreferences || trainerPreferences;
    const updatedAcademicSetting = fullState.academicSetting || academicSetting;
    const updatedWebsiteConfig = fullState.websiteConfig || websiteConfig;

    setUsers(updatedUsers);
    setDepartments(updatedDepartments);
    setCourses(updatedCourses);
    setClassroom(updatedClassrooms);
    setUnits(updatedUnits);
    setCourseGroups(updatedCourseGroups);
    setTimetableEntries(updatedTimetableEntries);
    setTrainerPreferences(updatedTrainerPreferences);
    setAcademicSetting(updatedAcademicSetting);
    setWebsiteConfig(updatedWebsiteConfig);

    localStorage.setItem(KEYS.USERS, JSON.stringify(updatedUsers));
    localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(updatedDepartments));
    localStorage.setItem(KEYS.COURSES, JSON.stringify(updatedCourses));
    localStorage.setItem(KEYS.CLASSROOMS, JSON.stringify(updatedClassrooms));
    localStorage.setItem(KEYS.UNITS, JSON.stringify(updatedUnits));
    localStorage.setItem(KEYS.COURSE_GROUPS, JSON.stringify(updatedCourseGroups));
    localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(updatedTimetableEntries));
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(updatedTrainerPreferences));
    localStorage.setItem(KEYS.ACADEMIC, JSON.stringify(updatedAcademicSetting));
    localStorage.setItem(KEYS.WEBSITE_CONFIG, JSON.stringify(updatedWebsiteConfig));

    // Also update logged-in user if changed
    if (currentUser) {
      const match = updatedUsers.find(u => u.id === currentUser.id);
      if (match) {
        if (!match.isActive) {
          handleLogout();
        } else {
          setCurrentUser(match);
          localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(match));
        }
      }
    }

    // Save the entire state immediately to database
    const combinedState = {
      users: updatedUsers,
      departments: updatedDepartments,
      courses: updatedCourses,
      classrooms: updatedClassrooms,
      units: updatedUnits,
      courseGroups: updatedCourseGroups,
      timetableEntries: updatedTimetableEntries,
      trainerPreferences: updatedTrainerPreferences,
      academicSetting: updatedAcademicSetting,
      websiteConfig: updatedWebsiteConfig,
      students,
      feeStructures,
      invoices,
      payments,
      installmentPlans,
      feeAuditLogs,
      admissionApplications,
      examMarks
    };
    
    saveStateToDatabaseImmediately(combinedState);
  };

  // Bundle the complete state for Admin backup
  const getFullSystemStateBundle = () => {
    return {
      users,
      departments,
      courses,
      classrooms,
      units,
      courseGroups,
      timetableEntries,
      trainerPreferences,
      academicSetting,
      websiteConfig
    };
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <span className="text-sm font-semibold text-slate-500 font-mono">Initializing Kitutu Chache TVC Timetable & Database...</span>
        </div>
      </div>
    );
  }

  // Public Website Front Page View
  if (currentView === 'website') {
    return (
      <div className="flex flex-col min-h-screen">
        {currentUser && (
          <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs sticky top-0 z-50 border-b border-slate-800 shadow-md">
            <div className="flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Signed in as <strong className="text-white">{currentUser.name}</strong> ({currentUser.role.toUpperCase()})</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('portal')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Back to ERP Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
        <WebsiteFrontPage 
          onNavigateToPortal={() => setCurrentView('portal')}
          onNavigateToPoe={() => {
            setCurrentView('portal');
            setActiveWorkspace('portfolio');
          }}
          applications={admissionApplications}
          onAddApplication={(newApp) => updateAdmissionApplicationsState([newApp, ...admissionApplications])}
          erpUsers={users}
          erpDepartments={departments}
          websiteConfig={websiteConfig}
          onUpdateWebsiteConfig={updateWebsiteConfigState}
          currentUser={currentUser}
        />
      </div>
    );
  }

  // Not Logged In (Portal Login Screen)
  if (!currentUser) {
    return (
      <Login 
        onLogin={(user) => {
          handleLogin(user);
          setCurrentView('portal');
        }} 
        users={users} 
        departments={departments} 
        onBackToWebsite={() => setCurrentView('website')}
      />
    );
  }

  // Helper to render the active workspace content
  const renderWorkspaceContent = () => {
    // TVET Portfolio of Evidence (PoE) & CDACC Assessment Workspace
    if (activeWorkspace === 'portfolio') {
      return (
        <PoeDashboard
          currentUser={currentUser}
          allUsers={users}
          onSwitchUser={(user) => setCurrentUser(user)}
          departments={departments}
          courses={courses}
          units={units}
          academicSetting={academicSetting}
          documents={poeDocuments}
          onSaveDocument={(doc) => {
            const updated = [doc, ...poeDocuments.filter(d => d.id !== doc.id)];
            updatePoeDocumentsState(updated);
          }}
          onUpdateDocument={(doc) => {
            const updated = poeDocuments.map(d => d.id === doc.id ? doc : d);
            updatePoeDocumentsState(updated);
          }}
          onDeleteDocument={(docId) => {
            const updated = poeDocuments.filter(d => d.id !== docId);
            updatePoeDocumentsState(updated);
          }}
          notifications={poeNotifications}
          onMarkNotificationRead={(id) => {
            const updated = poeNotifications.map(n => n.id === id ? { ...n, isRead: true } : n);
            updatePoeNotificationsState(updated);
          }}
          onMarkAllNotificationsRead={() => {
            const updated = poeNotifications.map(n => ({ ...n, isRead: true }));
            updatePoeNotificationsState(updated);
          }}
          rubrics={poeRubrics}
          onBackToMain={() => setActiveWorkspace('timetable')}
        />
      );
    }

    if (activeWorkspace === 'finance') {
      return (
        <FeeDashboard
          currentUser={currentUser}
          users={users}
          departments={departments}
          courses={courses}
          units={units}
          courseGroups={courseGroups}
          students={students}
          feeStructures={feeStructures}
          invoices={invoices}
          payments={payments}
          installmentPlans={installmentPlans}
          feeAuditLogs={feeAuditLogs}
          admissionApplications={admissionApplications}
          examMarks={examMarks}
          onUpdateStudents={updateStudentsState}
          onUpdateFeeStructures={updateFeeStructuresState}
          onUpdateInvoices={updateInvoicesState}
          onUpdatePayments={updatePaymentsState}
          onUpdateInstallmentPlans={updateInstallmentPlansState}
          onUpdateFeeAuditLogs={updateFeeAuditLogsState}
          onUpdateAdmissionApplications={updateAdmissionApplicationsState}
          onUpdateExamMarks={updateExamMarksState}
          onUpdateUsers={updateUsersState}
          onBackToTimetable={() => setActiveWorkspace('timetable')}
          onLogout={handleLogout}
        />
      );
    }

    // Timetable Workspace (Role-based dashboards)
    if (currentUser.role === 'admin') {
      return (
        <AdminDashboard
          currentUser={currentUser}
          users={users}
          departments={departments}
          courses={courses}
          classrooms={classrooms}
          units={units}
          courseGroups={courseGroups}
          timetableEntries={timetableEntries}
          trainerPreferences={trainerPreferences}
          academicSetting={academicSetting}
          onUpdateUsers={updateUsersState}
          onUpdateDepartments={updateDepartmentsState}
          onUpdateCourses={updateCoursesState}
          onUpdateClassrooms={updateClassroomsState}
          onUpdateAcademicSetting={updateAcademicSettingState}
          onUpdateCourseGroups={updateCourseGroupsState}
          onUpdateTimetableEntries={updateTimetableEntriesState}
          onDeleteTimetableSlot={handleDeleteTimetableSlot}
          onSaveTimetableSlot={handleSaveTimetableSlot}
          onUpdateUnits={updateUnitsState}
          onImportState={handleImportState}
          onLogout={handleLogout}
          fullState={getFullSystemStateBundle()}
          websiteConfig={websiteConfig}
          onUpdateWebsiteConfig={updateWebsiteConfigState}
          onNavigateToPoe={() => setActiveWorkspace('portfolio')}
          onPurgeDemoAccounts={handlePurgeDemoAccounts}
          onRestoreInstitutionalData={handleRestoreInstitutionalData}
        />
      );
    }

    if (currentUser.role === 'hod') {
      return (
        <HodDashboard
          currentUser={currentUser}
          users={users}
          departments={departments}
          courses={courses}
          classrooms={classrooms}
          units={units}
          courseGroups={courseGroups}
          timetableEntries={timetableEntries}
          trainerPreferences={trainerPreferences}
          academicSetting={academicSetting}
          onUpdateCourseGroups={updateCourseGroupsState}
          onUpdateTimetableEntries={updateTimetableEntriesState}
          onDeleteTimetableSlot={handleDeleteTimetableSlot}
          onSaveTimetableSlot={handleSaveTimetableSlot}
          onUpdateUnits={updateUnitsState}
          onUpdateTrainerPreferences={updateTrainerPreferencesState}
          onUpdateCourses={updateCoursesState}
          onUpdateUsers={updateUsersState}
          onLogout={handleLogout}
          onNavigateToPoe={() => setActiveWorkspace('portfolio')}
        />
      );
    }

    if (currentUser.role === 'trainer') {
      return (
        <TrainerDashboard
          currentUser={currentUser}
          users={users}
          departments={departments}
          courses={courses}
          classrooms={classrooms}
          units={units}
          courseGroups={courseGroups}
          timetableEntries={timetableEntries}
          trainerPreferences={trainerPreferences}
          academicSetting={academicSetting}
          onUpdateTrainerPreferences={updateTrainerPreferencesState}
          onUpdateUsers={updateUsersState}
          onLogout={handleLogout}
          onNavigateToPoe={() => setActiveWorkspace('portfolio')}
        />
      );
    }

    if (currentUser.role === 'manager' || currentUser.role === 'review' || (currentUser.role as string) === 'reviewer' || currentUser.role === 'quality_assurance' || currentUser.role === 'assessor') {
      return (
        <ReviewerDashboard
          currentUser={currentUser}
          users={users}
          departments={departments}
          courses={courses}
          classrooms={classrooms}
          units={units}
          courseGroups={courseGroups}
          timetableEntries={timetableEntries}
          trainerPreferences={trainerPreferences}
          academicSetting={academicSetting}
          onUpdateUsers={updateUsersState}
          onLogout={handleLogout}
          onNavigateToPoe={() => setActiveWorkspace('portfolio')}
        />
      );
    }

    if (currentUser.role === 'student' || currentUser.role === 'trainee') {
      return (
        <FeeDashboard
          currentUser={currentUser}
          users={users}
          departments={departments}
          courses={courses}
          units={units}
          courseGroups={courseGroups}
          students={students}
          feeStructures={feeStructures}
          invoices={invoices}
          payments={payments}
          installmentPlans={installmentPlans}
          feeAuditLogs={feeAuditLogs}
          admissionApplications={admissionApplications}
          examMarks={examMarks}
          onUpdateStudents={updateStudentsState}
          onUpdateFeeStructures={updateFeeStructuresState}
          onUpdateInvoices={updateInvoicesState}
          onUpdatePayments={updatePaymentsState}
          onUpdateInstallmentPlans={updateInstallmentPlansState}
          onUpdateFeeAuditLogs={updateFeeAuditLogsState}
          onUpdateAdmissionApplications={updateAdmissionApplicationsState}
          onUpdateExamMarks={updateExamMarksState}
          onUpdateUsers={updateUsersState}
          onBackToTimetable={() => setActiveWorkspace('portfolio')}
          onLogout={handleLogout}
        />
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-red-50 text-red-700 font-semibold border border-red-150">
        Error: Unauthorized User Session State. Role '{currentUser.role}' is not supported. Please sign out and re-authenticate.
        <button onClick={handleLogout} className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors">Logout</button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Global Immediate Database Connection / Offline Banner */}
      {syncStatus === 'error' && !isErrorBannerDismissed && (
        <div className="bg-amber-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs font-semibold z-50 print:hidden sticky top-0 border-b border-amber-700">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="p-1.5 bg-amber-700/90 rounded-lg shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-200 animate-pulse" />
            </div>
            <div className="truncate">
              <span className="font-bold uppercase tracking-wider bg-amber-800/90 text-white px-2 py-0.5 rounded text-[10px] mr-2">
                Offline Mode
              </span>
              <span className="text-amber-50">
                {syncErrorMessage || 'Working in offline mode. Changes are safely saved locally on this computer and will sync to the cloud database when online.'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => saveStateToDatabaseImmediately()}
              className="px-3 py-1 bg-white text-amber-800 hover:bg-amber-50 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'saving' ? 'animate-spin' : ''}`} />
              Retry Cloud Sync
            </button>
            <button
              onClick={() => setIsErrorBannerDismissed(true)}
              className="p-1 hover:bg-amber-700 rounded-lg text-amber-200 hover:text-white transition-colors cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Top Banner Workspace Switcher */}
      {currentUser.role !== 'student' ? (
        <div className="bg-slate-100 text-slate-700 py-1.5 px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 z-40 print:hidden shrink-0 border-b border-slate-200 shadow-3xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9.5px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-wide">
                Active User
              </span>
              <span className="text-slate-800 text-xs font-semibold">
                {currentUser.name} <span className="text-slate-500 font-medium">({currentUser.role.toUpperCase()})</span>
              </span>
            </div>

            {/* Real-time Database Sync Indicator Badge */}
            <div className="hidden md:flex items-center">
              {syncStatus === 'saving' ? (
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] font-semibold animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                  <span>Saving to Cloud...</span>
                </div>
              ) : syncStatus === 'error' ? (
                <button
                  onClick={() => {
                    setIsErrorBannerDismissed(false);
                    saveStateToDatabaseImmediately();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900 text-[10.5px] font-bold transition-all cursor-pointer shadow-3xs"
                  title="Cloud Sync Pending / Saved Locally. Click to retry syncing directly to Cloud Firestore."
                >
                  <CloudOff className="w-3 h-3 text-amber-600" />
                  <span>Cloud Offline • Saved Locally (Click to sync)</span>
                </button>
              ) : (
                <button 
                  onClick={async () => {
                    await saveStateToDatabaseImmediately();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 text-[10.5px] font-semibold shadow-3xs cursor-pointer transition-all"
                  title={lastSavedTime ? `Synchronized to Cloud Firestore & Server at ${lastSavedTime}. Click to re-sync now.` : "Cloud Database Connected & Synced. Click to save now."}
                >
                  <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                  <span>Cloud Synced</span>
                  {lastSavedTime && <span className="text-emerald-700/80 text-[9.5px]">({lastSavedTime.replace(' (Cloud Synced)', '')})</span>}
                </button>
              )}
            </div>
          </div>

          {/* Workspace Quick Toggles */}
          <div className="flex items-center gap-1.5 text-xs font-black">
            <button
              onClick={() => setCurrentView('website')}
              className="px-2.5 py-1 rounded-xl transition-all cursor-pointer text-xs font-semibold text-slate-700 hover:text-blue-800 hover:bg-slate-200/80 flex items-center gap-1"
              title="Return to Public College Website"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>College Website</span>
            </button>

            <span className="text-slate-300 px-0.5">|</span>

            <button
              onClick={() => setActiveWorkspace('timetable')}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer text-xs font-semibold ${
                activeWorkspace === 'timetable'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              📅 Academic Scheduling Workspace
            </button>
            
            <button
              onClick={() => setActiveWorkspace('finance')}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer text-xs font-semibold flex items-center gap-1.5 ${
                activeWorkspace === 'finance'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
            >
              {['finance_officer', 'principal'].includes(currentUser.role)
                ? '💳 Fee & Finance System'
                : '🎓 Academic Registry & Examinations'}
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            <button
              onClick={() => setActiveWorkspace('portfolio')}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer text-xs font-semibold flex items-center gap-1.5 ${
                activeWorkspace === 'portfolio'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-amber-800 hover:text-amber-950 hover:bg-amber-100/90 bg-amber-50/70 border border-amber-200'
              }`}
              title="Open TVET Portfolio of Evidence (PoE) & CDACC Assessment System"
            >
              <Award className="w-3.5 h-3.5" />
              <span>TVET PoE &amp; CDACC</span>
              <span className="text-[9px] bg-amber-200 text-amber-900 px-1 py-0.2 rounded font-extrabold">PoE</span>
            </button>

            <span className="text-slate-300 px-1">|</span>

            <button
              onClick={handleLogout}
              className="px-2.5 py-1 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all cursor-pointer text-xs font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 text-slate-700 py-1.5 px-4 sm:px-6 flex items-center justify-between z-40 print:hidden shrink-0 border-b border-slate-200 shadow-3xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9.5px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-wide">
                Student Portal
              </span>
              <span className="text-slate-800 text-xs font-semibold">
                {currentUser.name} <span className="text-slate-500 font-normal">({currentUser.username})</span>
              </span>
            </div>

            {/* Sync status for student */}
            <div className="hidden sm:flex items-center">
              {syncStatus === 'saving' ? (
                <span className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Saving...
                </span>
              ) : syncStatus === 'error' ? (
                <span className="text-[10.5px] text-amber-700 font-semibold flex items-center gap-1">
                  <CloudOff className="w-2.5 h-2.5" /> Saved Locally
                </span>
              ) : (
                <span className="text-[10.5px] text-emerald-700 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Saved Automatically
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveWorkspace(activeWorkspace === 'portfolio' ? 'finance' : 'portfolio')}
              className={`px-3 py-1 rounded-xl transition-all cursor-pointer text-xs font-semibold flex items-center gap-1.5 ${
                activeWorkspace === 'portfolio'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-amber-900 hover:text-amber-950 hover:bg-amber-100 bg-amber-50 border border-amber-200'
              }`}
              title="Switch to TVET Portfolio of Evidence (PoE)"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>{activeWorkspace === 'portfolio' ? 'My Fees & Exams' : 'My TVET PoE'}</span>
            </button>
            <button
              onClick={() => setCurrentView('website')}
              className="px-2.5 py-1 rounded-xl transition-all cursor-pointer text-xs font-semibold text-slate-700 hover:text-blue-800 hover:bg-slate-200/80 flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>College Website</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main viewport area */}
      <div className="flex-1 min-h-0 flex flex-col">
        {renderWorkspaceContent()}
      </div>
    </div>
  );
}

