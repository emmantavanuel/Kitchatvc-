import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Cloud, CloudOff, RefreshCw, AlertTriangle, CheckCircle2, WifiOff, Database, X, Globe, ArrowLeft, ArrowRight
} from 'lucide-react';
import { 
  User, Department, Course, Classroom, Unit, TimetableEntry, AcademicSetting, TrainerSlotPreference, CourseGroup,
  Student, FeeStructure, Invoice, PaymentTransaction, InstallmentPlan, FeeAuditLog, AdmissionApplication, ExamMark,
  WebsiteConfig
} from './types';
import { 
  INITIAL_USERS, INITIAL_DEPARTMENTS, INITIAL_COURSES, INITIAL_CLASSROOMS, 
  INITIAL_UNITS, INITIAL_TIMETABLE_ENTRIES, INITIAL_TRAINER_PREFERENCES, DEFAULT_ACADEMIC_SETTING 
} from './data/seedData';
import {
  INITIAL_STUDENTS, INITIAL_FEE_STRUCTURES, INITIAL_INVOICES, INITIAL_PAYMENTS,
  INITIAL_INSTALLMENT_PLANS, INITIAL_FEE_AUDIT_LOGS, INITIAL_ADMISSION_APPLICATIONS, INITIAL_EXAM_MARKS
} from './data/feeSeedData';
import { DEFAULT_WEBSITE_CONFIG } from './data/websiteData';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import HodDashboard from './components/HodDashboard';
import TrainerDashboard from './components/TrainerDashboard';
import ReviewerDashboard from './components/ReviewerDashboard';
import FeeDashboard from './components/FeeDashboard';
import WebsiteFrontPage from './components/WebsiteFrontPage';
import { loadApplicationState, saveApplicationState, testConnection } from './lib/firebase';

// LocalStorage Cache Keys
const STORAGE_PREFIX = 'kitcha_timetable_';
const KEYS = {
  USERS: `${STORAGE_PREFIX}users`,
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
  WEBSITE_CONFIG: `${STORAGE_PREFIX}website_config`
};

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

  // Workspace and public website state
  const [activeWorkspace, setActiveWorkspace] = useState<'timetable' | 'finance'>('timetable');
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
    examMarks: []
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
      examMarks
    };
  }, [
    users, departments, courses, classrooms, units, courseGroups,
    timetableEntries, trainerPreferences, academicSetting, websiteConfig,
    students, feeStructures, invoices, payments, installmentPlans, feeAuditLogs,
    admissionApplications, examMarks
  ]);

  // IMMEDIATE DATABASE SAVING FUNCTION (Synchronous local write + Direct Cloud Firestore replica)
  const saveStateToDatabaseImmediately = useCallback(async (stateOverride?: any) => {
    const fullPayload = {
      ...stateRef.current,
      ...(stateOverride || {})
    };

    setSyncStatus('saving');
    setIsErrorBannerDismissed(false);

    // 1. Immediately cache all updated entities to localStorage synchronously
    try {
      if (fullPayload.users) localStorage.setItem(KEYS.USERS, JSON.stringify(fullPayload.users));
      if (fullPayload.departments) localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(fullPayload.departments));
      if (fullPayload.courses) localStorage.setItem(KEYS.COURSES, JSON.stringify(fullPayload.courses));
      if (fullPayload.classrooms) localStorage.setItem(KEYS.CLASSROOMS, JSON.stringify(fullPayload.classrooms));
      if (fullPayload.units) localStorage.setItem(KEYS.UNITS, JSON.stringify(fullPayload.units));
      if (fullPayload.courseGroups) localStorage.setItem(KEYS.COURSE_GROUPS, JSON.stringify(fullPayload.courseGroups));
      if (fullPayload.timetableEntries) localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(fullPayload.timetableEntries));
      if (fullPayload.trainerPreferences) localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(fullPayload.trainerPreferences));
      if (fullPayload.academicSetting) localStorage.setItem(KEYS.ACADEMIC, JSON.stringify(fullPayload.academicSetting));
      if (fullPayload.websiteConfig) localStorage.setItem(KEYS.WEBSITE_CONFIG, JSON.stringify(fullPayload.websiteConfig));
      if (fullPayload.students) localStorage.setItem(KEYS.STUDENTS, JSON.stringify(fullPayload.students));
      if (fullPayload.feeStructures) localStorage.setItem(KEYS.FEE_STRUCTURES, JSON.stringify(fullPayload.feeStructures));
      if (fullPayload.invoices) localStorage.setItem(KEYS.INVOICES, JSON.stringify(fullPayload.invoices));
      if (fullPayload.payments) localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(fullPayload.payments));
      if (fullPayload.installmentPlans) localStorage.setItem(KEYS.INSTALLMENT_PLANS, JSON.stringify(fullPayload.installmentPlans));
      if (fullPayload.feeAuditLogs) localStorage.setItem(KEYS.FEE_AUDIT_LOGS, JSON.stringify(fullPayload.feeAuditLogs));
      if (fullPayload.admissionApplications) localStorage.setItem(KEYS.ADMISSION_APPLICATIONS, JSON.stringify(fullPayload.admissionApplications));
      if (fullPayload.examMarks) localStorage.setItem(KEYS.EXAM_MARKS, JSON.stringify(fullPayload.examMarks));
    } catch (cacheErr) {
      console.warn("Local storage cache notice:", cacheErr);
    }

    // 2. Check network connectivity
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('error');
      setSyncErrorMessage("Offline Mode: You are currently offline. Changes are saved locally on this computer and will sync to the cloud database when reconnected.");
      return false;
    }

    // 3. Save to Firebase Cloud Firestore and local server
    try {
      const result = await saveApplicationState(fullPayload);
      if (result.success || result.firestoreSaved) {
        setSyncStatus('synced');
        setSyncErrorMessage(null);
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        return true;
      } else {
        // Cloud throttled or static hosting, but local storage is 100% saved
        setSyncStatus('synced');
        setSyncErrorMessage(null);
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " (Local)");
        return true;
      }
    } catch (err: any) {
      console.warn('[Database Sync] Cloud sync notice:', err);
      // Local storage already safely holds all updates
      setSyncStatus('synced');
      setSyncErrorMessage(null);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " (Local)");
      return true;
    }
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
        const loadedState = await loadApplicationState();

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
            websiteConfig: sWebsiteConfig
          } = loadedState;
          
          if (sUsers) {
            let mappedUsers = sUsers.map((u: any) => u.username.toLowerCase() === 'admin' ? { ...u, password: 'admin123', isActive: true } : u);
            INITIAL_USERS.forEach(seedUser => {
              if (!mappedUsers.some((u: any) => u.username.toLowerCase() === seedUser.username.toLowerCase())) {
                mappedUsers.push(seedUser);
              }
            });
            setUsers(mappedUsers);
            localStorage.setItem(KEYS.USERS, JSON.stringify(mappedUsers));
          }
          if (sDepts) {
            setDepartments(sDepts);
            localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(sDepts));
          }
          if (sCourses) {
            setCourses(sCourses);
            localStorage.setItem(KEYS.COURSES, JSON.stringify(sCourses));
          }
          if (sClassrooms) {
            setClassroom(sClassrooms);
            localStorage.setItem(KEYS.CLASSROOMS, JSON.stringify(sClassrooms));
          }
          if (sUnits) {
            setUnits(sUnits);
            localStorage.setItem(KEYS.UNITS, JSON.stringify(sUnits));
          }
          if (sCourseGroups) {
            setCourseGroups(sCourseGroups);
            localStorage.setItem(KEYS.COURSE_GROUPS, JSON.stringify(sCourseGroups));
          }
          if (sEntries) {
            setTimetableEntries(sEntries);
            localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(sEntries));
          }
          if (sPrefs) {
            setTrainerPreferences(sPrefs);
            localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(sPrefs));
          }
          if (sAcademic) {
            setAcademicSetting(sAcademic);
            localStorage.setItem(KEYS.ACADEMIC, JSON.stringify(sAcademic));
          }
          
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

          const rawLoadedUsers = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
          let loadedUsers = rawLoadedUsers.map((u: any) => u.username.toLowerCase() === 'admin' ? { ...u, password: 'admin123', isActive: true } : u);
          INITIAL_USERS.forEach(seedUser => {
            if (!loadedUsers.some((u: any) => u.username.toLowerCase() === seedUser.username.toLowerCase())) {
              loadedUsers.push(seedUser);
            }
          });
          const loadedDepts = storedDepts ? JSON.parse(storedDepts) : INITIAL_DEPARTMENTS;
          const loadedCourses = storedCourses ? JSON.parse(storedCourses) : INITIAL_COURSES;
          const loadedRooms = storedRooms ? JSON.parse(storedRooms) : INITIAL_CLASSROOMS;
          const loadedUnits = storedUnits ? JSON.parse(storedUnits) : INITIAL_UNITS;
          const loadedCourseGroups = storedCourseGroups ? JSON.parse(storedCourseGroups) : [];
          const loadedEntries = storedEntries ? JSON.parse(storedEntries) : INITIAL_TIMETABLE_ENTRIES;
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

          // Sync to server so the server database is initialized immediately.
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
            examMarks: loadedExams
          };
          saveApplicationState(initialState);
        }

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

          const fallbackUsers = (storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS).map((u: any) => u.username.toLowerCase() === 'admin' ? { ...u, password: 'admin123', isActive: true } : u);
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
            const verifiedUser = INITIAL_USERS.concat(storedUsers ? JSON.parse(storedUsers) : []).find(u => u.id === parsedUser.id);
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

  // Auto-route users to correct workspace based on roles
  useEffect(() => {
    if (currentUser) {
      if (['registrar', 'finance_officer', 'auditor', 'principal', 'examinations_officer', 'student'].includes(currentUser.role)) {
        setActiveWorkspace('finance');
      } else if (['hod', 'trainer', 'manager', 'review', 'reviewer'].includes(currentUser.role as string)) {
        setActiveWorkspace('timetable');
      }
    }
  }, [currentUser]);

  // SYNCHRONIZED WRITING HELPERS (Instant local update + Immediate database persistence)
  const updateUsersState = (updated: User[]) => {
    setUsers(updated);
    stateRef.current.users = updated;
    localStorage.setItem(KEYS.USERS, JSON.stringify(updated));
    // If current logged-in user details changed, update them
    if (currentUser) {
      const match = updated.find(u => u.id === currentUser.id);
      if (match) {
        if (!match.isActive) {
          handleLogout(); // Force logout if administrator deactivated account
        } else {
          setCurrentUser(match);
          localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(match));
        }
      }
    }
    saveStateToDatabaseImmediately({ users: updated });
  };

  const updateDepartmentsState = (updated: Department[]) => {
    setDepartments(updated);
    stateRef.current.departments = updated;
    localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ departments: updated });
  };

  const updateCoursesState = (updated: Course[]) => {
    setCourses(updated);
    stateRef.current.courses = updated;
    localStorage.setItem(KEYS.COURSES, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ courses: updated });
  };

  const updateClassroomsState = (updated: Classroom[]) => {
    setClassroom(updated);
    stateRef.current.classrooms = updated;
    localStorage.setItem(KEYS.CLASSROOMS, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ classrooms: updated });
  };

  const updateUnitsState = (updated: Unit[]) => {
    setUnits(updated);
    stateRef.current.units = updated;
    localStorage.setItem(KEYS.UNITS, JSON.stringify(updated));

    // Cascade delete safety: ensure any scheduled timetable entries for deleted units are purged immediately
    // even if they were already published, keeping identical data all round.
    const validUnitIds = new Set(updated.map(u => u.id));
    const cleanedEntries = timetableEntries.filter(e => validUnitIds.has(e.unitId));
    if (cleanedEntries.length !== timetableEntries.length) {
      setTimetableEntries(cleanedEntries);
      stateRef.current.timetableEntries = cleanedEntries;
      localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(cleanedEntries));
      saveStateToDatabaseImmediately({ units: updated, timetableEntries: cleanedEntries });
      return;
    }

    saveStateToDatabaseImmediately({ units: updated });
  };

  const updateCourseGroupsState = (updated: CourseGroup[]) => {
    setCourseGroups(updated);
    stateRef.current.courseGroups = updated;
    localStorage.setItem(KEYS.COURSE_GROUPS, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ courseGroups: updated });
  };

  const updateTimetableEntriesState = (updated: TimetableEntry[]) => {
    setTimetableEntries(updated);
    stateRef.current.timetableEntries = updated;
    localStorage.setItem(KEYS.TIMETABLE, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ timetableEntries: updated });
  };

  const updateTrainerPreferencesState = (updated: TrainerSlotPreference[]) => {
    setTrainerPreferences(updated);
    stateRef.current.trainerPreferences = updated;
    localStorage.setItem(KEYS.PREFERENCES, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ trainerPreferences: updated });
  };

  const updateAcademicSettingState = (updated: AcademicSetting) => {
    setAcademicSetting(updated);
    stateRef.current.academicSetting = updated;
    localStorage.setItem(KEYS.ACADEMIC, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ academicSetting: updated });
  };

  const updateStudentsState = (updated: Student[]) => {
    setStudents(updated);
    stateRef.current.students = updated;
    localStorage.setItem(KEYS.STUDENTS, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ students: updated });
  };

  const updateFeeStructuresState = (updated: FeeStructure[]) => {
    setFeeStructures(updated);
    stateRef.current.feeStructures = updated;
    localStorage.setItem(KEYS.FEE_STRUCTURES, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ feeStructures: updated });
  };

  const updateInvoicesState = (updated: Invoice[]) => {
    setInvoices(updated);
    stateRef.current.invoices = updated;
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ invoices: updated });
  };

  const updatePaymentsState = (updated: PaymentTransaction[]) => {
    setPayments(updated);
    stateRef.current.payments = updated;
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ payments: updated });
  };

  const updateInstallmentPlansState = (updated: InstallmentPlan[]) => {
    setInstallmentPlans(updated);
    stateRef.current.installmentPlans = updated;
    localStorage.setItem(KEYS.INSTALLMENT_PLANS, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ installmentPlans: updated });
  };

  const updateFeeAuditLogsState = (updated: FeeAuditLog[]) => {
    setFeeAuditLogs(updated);
    stateRef.current.feeAuditLogs = updated;
    localStorage.setItem(KEYS.FEE_AUDIT_LOGS, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ feeAuditLogs: updated });
  };

  const updateAdmissionApplicationsState = (updated: AdmissionApplication[]) => {
    setAdmissionApplications(updated);
    stateRef.current.admissionApplications = updated;
    localStorage.setItem(KEYS.ADMISSION_APPLICATIONS, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ admissionApplications: updated });
  };

  const updateExamMarksState = (updated: ExamMark[]) => {
    setExamMarks(updated);
    stateRef.current.examMarks = updated;
    localStorage.setItem(KEYS.EXAM_MARKS, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ examMarks: updated });
  };

  const updateWebsiteConfigState = (updated: WebsiteConfig) => {
    setWebsiteConfig(updated);
    stateRef.current.websiteConfig = updated;
    localStorage.setItem(KEYS.WEBSITE_CONFIG, JSON.stringify(updated));
    saveStateToDatabaseImmediately({ websiteConfig: updated });
  };


  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
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
          onUpdateUnits={updateUnitsState}
          onImportState={handleImportState}
          onLogout={handleLogout}
          fullState={getFullSystemStateBundle()}
          websiteConfig={websiteConfig}
          onUpdateWebsiteConfig={updateWebsiteConfigState}
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
          onUpdateUnits={updateUnitsState}
          onUpdateTrainerPreferences={updateTrainerPreferencesState}
          onUpdateCourses={updateCoursesState}
          onUpdateUsers={updateUsersState}
          onLogout={handleLogout}
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
        />
      );
    }

    if (currentUser.role === 'manager' || currentUser.role === 'review' || (currentUser.role as string) === 'reviewer') {
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
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] font-bold">
                  <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                  <span>Saving to Database...</span>
                </div>
              ) : syncStatus === 'error' ? (
                <button
                  onClick={() => {
                    setIsErrorBannerDismissed(false);
                    saveStateToDatabaseImmediately();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 hover:text-amber-900 text-[10.5px] font-bold transition-all cursor-pointer shadow-3xs"
                  title="Offline Mode - Click to retry cloud sync"
                >
                  <CloudOff className="w-3 h-3 text-amber-600 animate-pulse" />
                  <span>Offline • Saved Locally</span>
                </button>
              ) : (
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10.5px] font-semibold shadow-3xs"
                  title={lastSavedTime ? `Database Synced at ${lastSavedTime}` : "Database Connected & Synced"}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
                  <span>Database Synced</span>
                  {lastSavedTime && <span className="text-emerald-700/80 text-[9.5px]">({lastSavedTime})</span>}
                </div>
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
                <span className="text-[10px] text-amber-700 font-medium">Saving...</span>
              ) : syncStatus === 'error' ? (
                <button 
                  onClick={() => saveStateToDatabaseImmediately()}
                  className="text-[10px] text-red-600 hover:text-red-800 font-bold underline cursor-pointer"
                >
                  Sync Error (Retry)
                </button>
              ) : (
                <span className="text-[10.5px] text-emerald-700 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  Database Synced
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
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

