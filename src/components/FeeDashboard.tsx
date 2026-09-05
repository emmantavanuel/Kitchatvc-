import React, { useState, useEffect } from 'react';
import { 
  Student, FeeStructure, Invoice, PaymentTransaction, InstallmentPlan, FeeAuditLog, 
  Department, Course, User, AdmissionApplication, ExamMark, Unit, CourseGroup 
} from '../types';
import { 
  DollarSign, CreditCard, TrendingUp, Percent, ShieldCheck, Users, BookOpen, 
  Receipt, Calendar, Clock, Plus, Trash2, Search, Building, Filter, Download, 
  AlertCircle, ArrowRightLeft, Award, FileSpreadsheet, Database, RefreshCw, 
  CheckCircle2, XCircle, Printer, Sparkles, Send, ShieldAlert, ArrowUpRight, 
  Coins, FileText, ChevronRight, UserCheck, UserPlus, GraduationCap, FileCheck, BarChart3, Bell,
  Copy, Key, Check, Edit3, ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal, Layers, Eye, CheckSquare, FileBadge,
  X, Save
} from 'lucide-react';
import kitchaLogo from '../assets/images/kitcha_tvc_logo.jpg';
import UserProfileModal from './UserProfileModal';

interface FeeDashboardProps {
  currentUser: User;
  users: User[];
  departments: Department[];
  courses: Course[];
  units: Unit[];
  courseGroups?: CourseGroup[];
  students: Student[];
  feeStructures: FeeStructure[];
  invoices: Invoice[];
  payments: PaymentTransaction[];
  installmentPlans: InstallmentPlan[];
  feeAuditLogs: FeeAuditLog[];
  admissionApplications: AdmissionApplication[];
  examMarks: ExamMark[];
  onUpdateStudents: (updated: Student[]) => void;
  onUpdateFeeStructures: (updated: FeeStructure[]) => void;
  onUpdateInvoices: (updated: Invoice[]) => void;
  onUpdatePayments: (updated: PaymentTransaction[]) => void;
  onUpdateInstallmentPlans: (updated: InstallmentPlan[]) => void;
  onUpdateFeeAuditLogs: (updated: FeeAuditLog[]) => void;
  onUpdateAdmissionApplications: (updated: AdmissionApplication[]) => void;
  onUpdateExamMarks: (updated: ExamMark[]) => void;
  onUpdateUsers: (updated: User[]) => void;
  onBackToTimetable: () => void;
  onLogout: () => void;
}

type FinanceRole = 'admin' | 'principal' | 'registrar' | 'finance_officer' | 'auditor' | 'trainer' | 'hod' | 'examinations_officer' | 'student' | 'review' | 'reviewer';

export default function FeeDashboard({
  currentUser,
  users,
  departments,
  courses,
  units,
  courseGroups = [],
  students,
  feeStructures,
  invoices,
  payments,
  installmentPlans,
  feeAuditLogs,
  admissionApplications,
  examMarks,
  onUpdateStudents,
  onUpdateFeeStructures,
  onUpdateInvoices,
  onUpdatePayments,
  onUpdateInstallmentPlans,
  onUpdateFeeAuditLogs,
  onUpdateAdmissionApplications,
  onUpdateExamMarks,
  onUpdateUsers,
  onBackToTimetable,
  onLogout
}: FeeDashboardProps) {

  // Role switching state (To allow easy full-stack preview)
  const [activeRole, setActiveRole] = useState<FinanceRole>(() => {
    return currentUser.role as FinanceRole;
  });
  
  // Tab states for Integrated ERP Modules
  const [activeModule, setActiveModule] = useState<'fees' | 'admissions' | 'records' | 'examinations' | 'users' | 'student_portal'>('fees');

  // Tab states for Finance Officer
  const [financeTab, setFinanceTab] = useState<'overview' | 'structures' | 'payments' | 'installments'>('overview');

  useEffect(() => {
    const roleModuleMap: Record<FinanceRole, { default: typeof activeModule; allowed: (typeof activeModule)[] }> = {
      student: { default: 'student_portal', allowed: ['student_portal'] },
      registrar: { default: 'admissions', allowed: ['admissions', 'records', 'examinations'] },
      finance_officer: { default: 'fees', allowed: ['fees'] },
      trainer: { default: 'examinations', allowed: ['examinations'] },
      hod: { default: 'examinations', allowed: ['examinations'] },
      examinations_officer: { default: 'examinations', allowed: ['examinations', 'records'] },
      principal: { default: 'fees', allowed: ['fees', 'admissions', 'records', 'examinations', 'users'] },
      admin: { default: 'admissions', allowed: ['fees', 'admissions', 'records', 'examinations', 'users'] },
      auditor: { default: 'admissions', allowed: ['admissions', 'records'] },
      review: { default: 'records', allowed: ['fees', 'admissions', 'records', 'examinations'] },
      reviewer: { default: 'records', allowed: ['fees', 'admissions', 'records', 'examinations'] },
    };

    const roleConfig = roleModuleMap[activeRole] || roleModuleMap.admin;
    if (!roleConfig.allowed.includes(activeModule)) {
      setActiveModule(roleConfig.default);
    }

    if (['registrar', 'principal', 'admin', 'auditor'].includes(activeRole) && !examSubTab) {
      setExamSubTab('transcript_print');
    } else if (activeRole === 'trainer') {
      setExamSubTab('trainer_entry');
    } else if (activeRole === 'hod') {
      setExamSubTab('hod_verify');
    } else if (activeRole === 'examinations_officer') {
      setExamSubTab('exams_approve');
    }

    // Ensure financeTab is valid for the active role
    const allowedFinanceTabs: Record<string, string[]> = {
      admin: ['overview', 'structures', 'payments', 'installments'],
      principal: ['overview', 'structures', 'payments', 'installments'],
      finance_officer: ['overview', 'structures', 'payments', 'installments'],
      auditor: ['overview', 'structures'],
    };
    const allowed = allowedFinanceTabs[activeRole];
    if (allowed && !allowed.includes(financeTab)) {
      setFinanceTab(allowed[0] as any);
    }
  }, [activeRole]);

  // Report Export Utility Functions
  const exportAdmissionsCSV = () => {
    const headers = ["Applicant Name", "Gender", "Intake", "KCSE/KCPE Index No", "Email", "Phone", "National ID", "Course Code", "Auto Reg Number", "Sponsor Type", "Applied Date", "Status"];
    const rows = admissionApplications.map(a => {
      const c = courses.find(course => course.id === a.courseId);
      const intakeName = a.intake === 'M' ? 'May (M)' : a.intake === 'S' ? 'September (S)' : 'January (J)';
      return [
        `"${a.applicantName}"`,
        `"${a.gender || 'Male'}"`,
        `"${intakeName}"`,
        `"${a.indexNumber || ''}"`,
        `"${a.email}"`,
        `"${a.phone}"`,
        `"${a.nationalId || ''}"`,
        `"${c?.code || a.courseId}"`,
        `"${a.autoRegNumber || ''}"`,
        `"${a.sponsorType}"`,
        `"${a.dateApplied}"`,
        `"${a.status}"`
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Admissions_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStudentsCSV = () => {
    const headers = ["Reg Number", "Student Name", "Gender", "KCSE/KCPE Index No", "Email", "Phone", "National ID", "Course Code", "Year/Module", "Semester", "Sponsor Type", "Academic Status"];
    const rows = filteredStudents.map(s => {
      const c = courses.find(course => course.id === s.courseId);
      return [
        `"${s.regNumber}"`,
        `"${s.name}"`,
        `"${s.gender || 'Male'}"`,
        `"${s.indexNumber || ''}"`,
        `"${s.email}"`,
        `"${s.phone}"`,
        `"${s.nationalId || ''}"`,
        `"${c?.code || s.courseId}"`,
        `"Module ${s.yearOfStudy}"`,
        `"${s.semester}"`,
        `"${s.sponsorType}"`,
        `"${s.status}"`
      ];
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Student_Registry_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDepartmentGenderCSV = () => {
    const matchingStudents = students.filter(s => {
      const c = courses.find(course => course.id === s.courseId);
      if (genderReportDepartment && c?.departmentId !== genderReportDepartment && s.departmentId !== genderReportDepartment) return false;
      if (genderReportCourse && s.courseId !== genderReportCourse) return false;
      if (genderReportModule && String(s.yearOfStudy) !== genderReportModule) return false;
      if (genderReportGender && genderReportGender !== 'all' && (s.gender || 'Male') !== genderReportGender) return false;
      return true;
    });

    const headers = ["Reg Number", "Student Name", "Gender", "KCSE/KCPE Index No", "Department Name", "Course Code", "Course Name", "Study Module/Year", "Semester", "Sponsor Type", "Academic Status"];
    const rows = matchingStudents.map(s => {
      const c = courses.find(course => course.id === s.courseId);
      const d = departments.find(dept => dept.id === (c?.departmentId || s.departmentId));
      return [
        `"${s.regNumber}"`,
        `"${s.name}"`,
        `"${s.gender || 'Male'}"`,
        `"${s.indexNumber || ''}"`,
        `"${d?.name || ''}"`,
        `"${c?.code || s.courseId}"`,
        `"${c?.name || ''}"`,
        `"Module ${s.yearOfStudy}"`,
        `"${s.semester}"`,
        `"${s.sponsorType}"`,
        `"${s.status}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Registrar_Department_Gender_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [createdStudentAccountModal, setCreatedStudentAccountModal] = useState<{
    isOpen: boolean;
    studentName: string;
    regNumber: string;
    username: string;
    password: string;
    courseName: string;
  } | null>(null);

  // Automatically select matching student profile when logged in as student
  useEffect(() => {
    if (currentUser && currentUser.role === 'student' && students.length > 0) {
      const match = students.find(s => 
        s.regNumber.toUpperCase() === currentUser.username.toUpperCase() ||
        (currentUser.code && s.regNumber.toUpperCase() === currentUser.code.toUpperCase()) ||
        s.email.toLowerCase() === currentUser.username.toLowerCase() ||
        s.name.toLowerCase() === currentUser.name.toLowerCase()
      );
      if (match) {
        setSelectedStudentId(match.id);
      }
    }
  }, [currentUser, students]);
  
  // Integrated Admission States
  const [showAddApplicationModal, setShowAddApplicationModal] = useState(false);
  const [selectedAdmissionLetter, setSelectedAdmissionLetter] = useState<AdmissionApplication | null>(null);
  const [newApplication, setNewApplication] = useState({
    applicantName: '',
    email: '',
    phone: '',
    courseId: courses[0]?.id || '',
    gender: 'Male' as 'Male' | 'Female',
    intake: 'J' as 'J' | 'M' | 'S', // J = January, M = May, S = September
    indexNumber: '',
    nationalId: '',
    sponsorType: 'self' as 'self' | 'government'
  });

  // Integrated Exam States
  const [recordsSubTab, setRecordsSubTab] = useState<'directory' | 'gender_reports'>('directory');
  const [genderReportDepartment, setGenderReportDepartment] = useState<string>('');
  const [genderReportCourse, setGenderReportCourse] = useState<string>('');
  const [genderReportModule, setGenderReportModule] = useState<string>('');
  const [genderReportGender, setGenderReportGender] = useState<'all' | 'Male' | 'Female'>('all');

  const [showAddMarkModal, setShowAddMarkModal] = useState(false);
  const [newExamMark, setNewExamMark] = useState({
    studentId: students[0]?.id || '',
    courseId: courses[0]?.id || '',
    unitId: '',
    marksObtained: '75',
    grade: 'A',
    examTerm: 'Term 1 2025'
  });

  // Integrated User Creator States (Super Admin)
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newErpUser, setNewErpUser] = useState({
    username: '',
    password: '',
    role: 'finance_officer' as any,
    name: '',
    departmentId: departments[0]?.id || '',
    code: ''
  });
  
  // Search and filter states
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Helper to extract clean modules from the academic scheduling database for a course
  const getModulesForCourse = (courseId: string): string[] => {
    if (!courseId) return [];
    const moduleSet = new Set<string>();

    // 1. Gather all modules defined on units for this course in the scheduling database
    units.filter(u => u.courseId === courseId).forEach(u => {
      if (u.module && u.module.trim()) {
        moduleSet.add(u.module.trim());
      }
    });

    // 2. Also gather from courseGroups if provided
    if (courseGroups && courseGroups.length > 0) {
      courseGroups.filter(cg => cg.courseId === courseId).forEach(cg => {
        if (cg.module && cg.module.trim()) {
          moduleSet.add(cg.module.trim());
        }
      });
    }

    // 3. Fallback to standard curriculum modules if none explicitly registered yet
    if (moduleSet.size === 0) {
      return ['Module 1', 'Module 2', 'Module 3'];
    }

    return Array.from(moduleSet).sort((a, b) => {
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  };

  // Helper to match a unit against a selected module string flexibly
  const isUnitInModule = (unit: Unit, targetModule: string): boolean => {
    if (!targetModule) return true;
    const uMod = (unit.module || '').trim();
    const tMod = targetModule.trim();
    if (!uMod) return false;
    if (uMod === tMod) return true;

    const normU = uMod.toLowerCase().replace(/^module\s*/i, '').replace(/^mod\s*/i, '').trim();
    const normT = tMod.toLowerCase().replace(/^module\s*/i, '').replace(/^mod\s*/i, '').trim();

    const mapRoman = (v: string) => {
      if (v === '1' || v === 'i') return '1';
      if (v === '2' || v === 'ii') return '2';
      if (v === '3' || v === 'iii') return '3';
      if (v === '4' || v === 'iv') return '4';
      return v;
    };

    return mapRoman(normU) === mapRoman(normT);
  };

  // Helper to calculate TVET classification and grades accurately
  const getTvetClassification = (score: number) => {
    if (isNaN(score) || score === null || score === undefined) return { grade: '-', label: 'Unassessed', color: 'text-slate-400 bg-slate-100 border-slate-200' };
    if (score >= 80) return { grade: 'A', label: 'Distinction 1', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
    if (score >= 70) return { grade: 'A-', label: 'Distinction 2', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 65) return { grade: 'B+', label: 'Credit 3', color: 'text-blue-700 bg-blue-100 border-blue-300' };
    if (score >= 60) return { grade: 'B', label: 'Credit 4', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (score >= 55) return { grade: 'C+', label: 'Pass 5', color: 'text-indigo-700 bg-indigo-100 border-indigo-300' };
    if (score >= 50) return { grade: 'C', label: 'Pass 6', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    if (score >= 40) return { grade: 'D', label: 'Pass 7', color: 'text-amber-700 bg-amber-100 border-amber-300' };
    return { grade: 'F', label: 'Referral 8 (Fail)', color: 'text-rose-700 bg-rose-100 border-rose-300' };
  };

  // Advanced Examinations Sub-tabs and selectors
  const [examSubTab, setExamSubTab] = useState<'trainer_entry' | 'hod_verify' | 'exams_approve' | 'transcript_print'>('transcript_print');
  const [selectedExamCourseId, setSelectedExamCourseId] = useState<string>('');
  const [selectedExamModule, setSelectedExamModule] = useState<string>('');
  const [selectedExamUnitId, setSelectedExamUnitId] = useState<string>('');
  const [examStudentSearch, setExamStudentSearch] = useState<string>('');
  const [localScores, setLocalScores] = useState<Record<string, string>>({});
  const [localCat1, setLocalCat1] = useState<Record<string, string>>({});
  const [localCat2, setLocalCat2] = useState<Record<string, string>>({});
  const [localEndTerm, setLocalEndTerm] = useState<Record<string, string>>({});
  const [studentActiveTab, setStudentActiveTab] = useState<'fees' | 'results'>('fees');

  // Exams Officer Comprehensive Multi-Filter States
  const [examsFilterDept, setExamsFilterDept] = useState<string>('');
  const [examsFilterCourse, setExamsFilterCourse] = useState<string>('');
  const [examsFilterModule, setExamsFilterModule] = useState<string>('');
  const [examsFilterUnitId, setExamsFilterUnitId] = useState<string>('');
  const [examsFilterStatus, setExamsFilterStatus] = useState<'all' | 'pending_release' | 'released' | 'pending_hod' | 'amended'>('all');
  const [examsViewMode, setExamsViewMode] = useState<'master_students' | 'units_clearance'>('master_students');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);

  // Amendment Modal State (Exams Officer Result Modification)
  const [amendingMark, setAmendingMark] = useState<{
    student: Student;
    unit: Unit;
    mark?: ExamMark;
  } | null>(null);
  const [amendCat1, setAmendCat1] = useState<string>('');
  const [amendCat2, setAmendCat2] = useState<string>('');
  const [amendEndTerm, setAmendEndTerm] = useState<string>('');
  const [amendScore, setAmendScore] = useState<string>('');
  const [amendReason, setAmendReason] = useState<string>('Script Re-marking / Verification Request');
  const [amendRemarks, setAmendRemarks] = useState<string>('');
  const [amendReleaseImmediately, setAmendReleaseImmediately] = useState<boolean>(true);
  const [amendSuccessMsg, setAmendSuccessMsg] = useState<string>('');

  // Academic Registrar Transcript Terminal Multi-Filter & View States
  const [transcriptFilterDept, setTranscriptFilterDept] = useState<string>('');
  const [transcriptFilterCourse, setTranscriptFilterCourse] = useState<string>('');
  const [transcriptFilterModule, setTranscriptFilterModule] = useState<string>('');
  const [transcriptSearch, setTranscriptSearch] = useState<string>('');
  const [transcriptViewModule, setTranscriptViewModule] = useState<string>('all'); // 'all' = full final transcript, or specific module like 'Module 1'

  // Compute pending verifications for HOD and pending approvals for Academic / Exams Officer
  const pendingHodUnits = units.filter(unit => {
    const unitMarks = examMarks.filter(m => m.unitId === unit.id);
    return unitMarks.length > 0 && !unitMarks.every(m => m.verifiedByHod);
  });

  const pendingExamsUnits = units.filter(unit => {
    const unitMarks = examMarks.filter(m => m.unitId === unit.id);
    return unitMarks.length > 0 && unitMarks.every(m => m.verifiedByHod) && !unitMarks.every(m => m.approvedByExamsOfficer);
  });

  useEffect(() => {
    if (selectedExamCourseId && selectedExamUnitId) {
      const scores: Record<string, string> = {};
      const cat1s: Record<string, string> = {};
      const cat2s: Record<string, string> = {};
      const endTerms: Record<string, string> = {};

      students.filter(s => s.courseId === selectedExamCourseId).forEach(student => {
        const mark = examMarks.find(m => m.studentId === student.id && m.unitId === selectedExamUnitId);
        if (mark) {
          scores[student.id] = (mark.score !== undefined ? mark.score : mark.marksObtained || 0).toString();
          cat1s[student.id] = mark.cat1 !== undefined ? mark.cat1.toString() : '';
          cat2s[student.id] = mark.cat2 !== undefined ? mark.cat2.toString() : '';
          endTerms[student.id] = mark.endTerm !== undefined ? mark.endTerm.toString() : '';
        } else {
          scores[student.id] = '';
          cat1s[student.id] = '';
          cat2s[student.id] = '';
          endTerms[student.id] = '';
        }
      });
      setLocalScores(scores);
      setLocalCat1(cat1s);
      setLocalCat2(cat2s);
      setLocalEndTerm(endTerms);
    }
  }, [selectedExamCourseId, selectedExamUnitId, examMarks, students]);

  // Modals / Form states
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddStructureModal, setShowAddStructureModal] = useState(false);
  const [showPostPaymentModal, setShowPostPaymentModal] = useState(false);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [showInvoiceStudentModal, setShowInvoiceStudentModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);

  // M-Pesa STK Simulator state
  const [stkAmount, setStkAmount] = useState('5000');
  const [stkPhone, setStkPhone] = useState('+254712345678');
  const [stkInvoiceId, setStkInvoiceId] = useState('');
  const [stkStatus, setStkStatus] = useState<'idle' | 'sending' | 'pending_pin' | 'verifying' | 'success' | 'failed'>('idle');
  const [stkTimer, setStkTimer] = useState(10);

  // New Student Form
  const [newStudent, setNewStudent] = useState({
    regNumber: '',
    name: '',
    email: '',
    phone: '',
    gender: 'Male' as 'Male' | 'Female',
    intake: 'J' as 'J' | 'M' | 'S',
    indexNumber: '',
    nationalId: '',
    courseId: courses[0]?.id || '',
    yearOfStudy: '1',
    semester: '1',
    sponsorType: 'self' as 'self' | 'government'
  });

  // New Structure Form
  const [newStructure, setNewStructure] = useState({
    courseId: courses[0]?.id || '',
    academicYear: '2025/2026',
    semester: '1',
    items: [
      { name: 'Tuition Fee', amount: 15000 },
      { name: 'Examination Fee', amount: 4000 },
      { name: 'Library & ICT Fee', amount: 2500 },
      { name: 'Student Activity Fee', amount: 1500 }
    ]
  });

  // New Manual Payment Form
  const [newPayment, setNewPayment] = useState({
    studentId: students[0]?.id || '',
    invoiceId: '',
    amount: '',
    method: 'bank' as any,
    referenceNumber: '',
    transactionType: 'fee_payment' as any,
    remarks: ''
  });

  // New Installment Form
  const [newInstallment, setNewInstallment] = useState({
    studentId: students[0]?.id || '',
    invoiceId: '',
    stages: '3' as '2' | '3' | '4'
  });

  // Helper: Format KES Currency
  const formatKES = (amount: number) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount);
  };

  // Helper: Format Dates cleanly
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Log audit actions to database state
  const logAuditAction = (action: string, details: string) => {
    const newLog: FeeAuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userRole: activeRole,
      action,
      details
    };
    onUpdateFeeAuditLogs([newLog, ...feeAuditLogs]);
  };

  // Automatically approve a candidate and provision student profile + fee invoice
  const handleApproveApplication = (appId: string) => {
    const application = admissionApplications.find(a => a.id === appId);
    if (!application) return;

    // Check if student with this email already exists to prevent duplicate enrollment
    const exists = students.some(s => s.email === application.email);
    if (exists) {
      alert(`A student profile with email ${application.email} already exists!`);
      return;
    }

    // 1. Generate or use auto-generated student reg number
    const courseObj = courses.find(c => c.id === application.courseId);
    const courseCode = courseObj ? courseObj.code.toUpperCase() : 'DICT';
    const nextRegNumber = application.autoRegNumber || `KTVC/${courseCode}/2026/00${students.length + 1}`;
    
    const newStudentProfile: Student = {
      id: `stud_${Date.now()}`,
      regNumber: nextRegNumber,
      name: application.applicantName,
      email: application.email,
      phone: application.phone,
      gender: application.gender || 'Male',
      indexNumber: application.indexNumber,
      nationalId: application.nationalId || `ID-${Math.floor(100000 + Math.random() * 900000)}`,
      courseId: application.courseId,
      departmentId: courseObj?.departmentId || 'dept_cs',
      yearOfStudy: 1,
      semester: 1,
      status: 'active',
      sponsorType: application.sponsorType || 'self'
    };

    // 2. Mark the application as approved (which maps to 'admitted' status in type system)
    const updatedApplications = admissionApplications.map(app => 
      app.id === appId ? { ...app, status: 'admitted' as const } : app
    );

    // 4. Update the parent/local state
    onUpdateAdmissionApplications(updatedApplications);
    onUpdateStudents([...students, newStudentProfile]);

    // Auto-provision corresponding user account so student can log in
    const newUserAccount: User = {
      id: `user_stud_${Date.now()}`,
      username: nextRegNumber.toUpperCase(), // Can log in with their Reg Number!
      password: 'student123', // Default easy password
      role: 'student',
      name: application.applicantName,
      isActive: true,
      isDefault: false,
      code: nextRegNumber
    };
    onUpdateUsers([...users, newUserAccount]);

    // Display student credentials modal so registrar can copy/print credentials
    setCreatedStudentAccountModal({
      isOpen: true,
      studentName: application.applicantName,
      regNumber: nextRegNumber,
      username: nextRegNumber.toUpperCase(),
      password: 'student123',
      courseName: courseObj?.name || 'Technical Course'
    });

    // 5. Generate and post a Fee Invoice automatically for the new student based on the course structure
    const targetFeeStructure = feeStructures.find(f => f.courseId === application.courseId && f.semester === 1);
    if (targetFeeStructure) {
      const newInvoice: Invoice = {
        id: `inv_${Date.now()}`,
        studentId: newStudentProfile.id,
        feeStructureId: targetFeeStructure.id,
        description: `Admission Fee Invoice - Year 1 Semester 1`,
        academicYear: '2025/2026',
        semester: 1,
        amount: targetFeeStructure.totalAmount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days due
        balance: targetFeeStructure.totalAmount,
        status: 'unpaid'
      };
      onUpdateInvoices([...invoices, newInvoice]);
      logAuditAction('AUTO_INVOICE_PROVISIONED', `Auto-provisioned Fee Invoice of ${formatKES(targetFeeStructure.totalAmount)} for newly enrolled student ${newStudentProfile.name}`);
    }

    logAuditAction('APPROVE_ADMISSION', `Approved and enrolled candidate ${application.applicantName} as ${nextRegNumber}`);
    alert(`Candidate ${application.applicantName} approved! Auto-provisioned registry profile with Reg No: ${nextRegNumber} and generated Term 1 fee invoice.`);
  };

  // Trigger automated simulation of Government/HELB allocations
  const handleTriggerHelbSimulation = (studentId: string, invoiceId: string) => {
    const targetStudent = students.find(s => s.id === studentId);
    if (!targetStudent) return;

    const targetInvoice = invoices.find(i => i.id === invoiceId);
    if (!targetInvoice) return;

    const helbAmount = 15000; // Standard allocation
    if (targetInvoice.balance < helbAmount) {
      alert("Invoice outstanding balance is less than standard HELB capitation!");
      return;
    }

    const refNo = `HELB-DISB-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const newTx: PaymentTransaction = {
      id: `tx_${Date.now()}`,
      studentId: targetStudent.id,
      invoiceId: targetInvoice.id,
      amount: helbAmount,
      date: new Date().toISOString(),
      method: 'bank',
      referenceNumber: refNo,
      reconciled: true,
      remarks: 'Simulated HELB Bursary Allocation',
      transactionType: 'helb_funding',
      academicYear: targetInvoice.academicYear,
      semester: targetInvoice.semester,
      receiptNumber: `RCP-HELB-${Math.floor(1000 + Math.random() * 9000)}`,
      recordedBy: currentUser.id
    };

    // Update balances
    const updatedInvoices = invoices.map(inv => {
      if (inv.id === invoiceId) {
        const nextBalance = inv.balance - helbAmount;
        return {
          ...inv,
          balance: nextBalance,
          status: nextBalance <= 0 ? 'paid' : 'partially_paid' as any
        };
      }
      return inv;
    });

    onUpdateInvoices(updatedInvoices);
    onUpdatePayments([newTx, ...payments]);
    logAuditAction('HELB_DISBURSEMENT', `HELB Allocation of ${formatKES(helbAmount)} disbursed to student ${targetStudent.name} (${targetStudent.regNumber})`);
    alert(`Successfully credited KES 15,000 HELB Loan (Ref: ${refNo}) to ${targetStudent.name}'s account.`);
  };

  // M-Pesa STK push simulation workflow
  const handleStkPush = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(stkAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    const targetInvoice = invoices.find(i => i.id === stkInvoiceId);
    if (!targetInvoice) {
      alert("Please select an invoice to settle.");
      return;
    }

    if (amountNum > targetInvoice.balance) {
      alert("Payment amount exceeds outstanding invoice balance.");
      return;
    }

    setStkStatus('sending');
    setStkTimer(4);

    logAuditAction('INITIATED_STK_PUSH', `Initiated M-Pesa STK push of ${formatKES(amountNum)} to ${stkPhone}`);
  };

  useEffect(() => {
    let interval: any;
    if (stkStatus === 'sending') {
      interval = setInterval(() => {
        setStkTimer((prev) => {
          if (prev <= 1) {
            setStkStatus('pending_pin');
            return 8; // PIN validation window
          }
          return prev - 1;
        });
      }, 1000);
    } else if (stkStatus === 'pending_pin') {
      interval = setInterval(() => {
        setStkTimer((prev) => {
          if (prev <= 1) {
            setStkStatus('verifying');
            return 3; // Bank verification window
          }
          return prev - 1;
        });
      }, 1000);
    } else if (stkStatus === 'verifying') {
      interval = setInterval(() => {
        setStkTimer((prev) => {
          if (prev <= 1) {
            // Process real payment on success
            const amountNum = parseFloat(stkAmount);
            const refNo = `MPESA${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
            
            const newTx: PaymentTransaction = {
              id: `tx_${Date.now()}`,
              studentId: selectedStudentId,
              invoiceId: stkInvoiceId,
              amount: amountNum,
              date: new Date().toISOString(),
              method: 'mpesa_stk',
              referenceNumber: refNo,
              reconciled: true,
              remarks: 'Interactive M-Pesa STK Push Payment',
              transactionType: 'fee_payment',
              academicYear: '2025/2026',
              semester: 1,
              receiptNumber: `RCP-STK-${Math.floor(1000 + Math.random() * 9000)}`,
              recordedBy: 'system_mpesa'
            };

            const updatedInvoices = invoices.map(inv => {
              if (inv.id === stkInvoiceId) {
                const nextBal = inv.balance - amountNum;
                return {
                  ...inv,
                  balance: nextBal,
                  status: nextBal <= 0 ? 'paid' : nextBal < inv.amount ? 'partially_paid' : 'unpaid' as any
                };
              }
              return inv;
            });

            onUpdateInvoices(updatedInvoices);
            onUpdatePayments([newTx, ...payments]);
            logAuditAction('MPESA_RECONCILED', `Automated reconciliation of STK Push KES ${amountNum} (Ref: ${refNo})`);
            
            setStkStatus('success');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [stkStatus, stkAmount, stkInvoiceId, selectedStudentId]);

  // Handle manual payment post
  const handlePostPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newPayment.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    const targetInvoice = invoices.find(i => i.id === newPayment.invoiceId);
    if (!targetInvoice) {
      alert("Please select a valid outstanding invoice.");
      return;
    }

    if (amountNum > targetInvoice.balance && newPayment.transactionType === 'fee_payment') {
      alert(`Amount exceeds the outstanding invoice balance of ${formatKES(targetInvoice.balance)}.`);
      return;
    }

    const refNo = newPayment.referenceNumber.trim() || `MAN-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    const newTx: PaymentTransaction = {
      id: `tx_${Date.now()}`,
      studentId: newPayment.studentId,
      invoiceId: newPayment.invoiceId,
      amount: amountNum,
      date: new Date().toISOString(),
      method: newPayment.method,
      referenceNumber: refNo,
      reconciled: true,
      remarks: newPayment.remarks || 'Manual over-the-counter posting',
      transactionType: newPayment.transactionType,
      academicYear: targetInvoice.academicYear,
      semester: targetInvoice.semester,
      receiptNumber: `RCP-MAN-${Math.floor(1000 + Math.random() * 9000)}`,
      recordedBy: currentUser.id
    };

    const updatedInvoices = invoices.map(inv => {
      if (inv.id === newPayment.invoiceId) {
        let nextBal = inv.balance;
        if (newPayment.transactionType === 'penalty') {
          nextBal = inv.balance + amountNum; // penalties increase balance
        } else {
          nextBal = inv.balance - amountNum; // payments/bursaries reduce balance
        }
        return {
          ...inv,
          balance: nextBal,
          status: nextBal <= 0 ? 'paid' : nextBal < inv.amount ? 'partially_paid' : 'unpaid' as any
        };
      }
      return inv;
    });

    onUpdateInvoices(updatedInvoices);
    onUpdatePayments([newTx, ...payments]);
    logAuditAction('POST_PAYMENT', `Posted transaction of ${formatKES(amountNum)} for student ID ${newPayment.studentId}`);
    setShowPostPaymentModal(false);
    setNewPayment({
      studentId: students[0]?.id || '',
      invoiceId: '',
      amount: '',
      method: 'bank',
      referenceNumber: '',
      transactionType: 'fee_payment',
      remarks: ''
    });
    alert("Transaction successfully posted and reconciled in the student ledger!");
  };

  // Open post payment modal with default student's first outstanding invoice initialized
  const handleOpenPostPaymentModal = () => {
    const defaultStudentId = students[0]?.id || '';
    const studentInvs = invoices.filter(inv => inv.studentId === defaultStudentId);
    const firstOutstanding = studentInvs.find(inv => inv.balance > 0) || studentInvs[0];
    setNewPayment({
      studentId: defaultStudentId,
      invoiceId: firstOutstanding ? firstOutstanding.id : '',
      amount: '',
      method: 'bank',
      referenceNumber: '',
      transactionType: 'fee_payment',
      remarks: ''
    });
    setShowPostPaymentModal(true);
  };

  // Handle walk-in application submission
  const handleAddApplicationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApplication.applicantName || !newApplication.email || !newApplication.courseId) {
      alert("Please fill in all required fields.");
      return;
    }

    const selectedCourseObj = courses.find(c => c.id === newApplication.courseId) || courses[0];
    const courseCode = selectedCourseObj ? selectedCourseObj.code.toUpperCase() : 'DICT';
    const intakeCode = newApplication.intake || 'J';
    const yearIntake = `2026${intakeCode}`;
    const autoNum = `KTVC/${courseCode}/${yearIntake}/00${students.filter(s => s.courseId === selectedCourseObj?.id).length + admissionApplications.filter(a => a.courseId === selectedCourseObj?.id).length + 1}`;

    const newApp: AdmissionApplication = {
      id: `app_${Date.now()}`,
      applicantName: newApplication.applicantName,
      email: newApplication.email,
      phone: newApplication.phone,
      courseId: newApplication.courseId,
      gender: newApplication.gender || 'Male',
      intake: newApplication.intake || 'J',
      indexNumber: newApplication.indexNumber.trim(),
      autoRegNumber: autoNum,
      dateApplied: new Date().toISOString().split('T')[0],
      status: 'pending',
      nationalId: newApplication.nationalId,
      sponsorType: newApplication.sponsorType
    };

    onUpdateAdmissionApplications([...admissionApplications, newApp]);
    logAuditAction('LOG_ADMISSION_APPLICATION', `Registered walk-in application for candidate ${newApp.applicantName} (${autoNum})`);
    setShowAddApplicationModal(false);
    setNewApplication({
      applicantName: '',
      email: '',
      phone: '',
      courseId: courses[0]?.id || '',
      gender: 'Male',
      intake: 'J',
      indexNumber: '',
      nationalId: '',
      sponsorType: 'self'
    });
    alert(`Successfully registered walk-in admission application for ${newApp.applicantName}!\nAuto-Generated Admission No: ${autoNum}`);
  };

  // Registrar: Register New Student
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.regNumber || !newStudent.name) {
      alert("Please fill in registration number and name.");
      return;
    }

    const targetCourse = courses.find(c => c.id === newStudent.courseId);
    if (!targetCourse) return;

    const studentId = `stud_${Date.now()}`;
    const registered: Student = {
      id: studentId,
      regNumber: newStudent.regNumber.trim().toUpperCase(),
      name: newStudent.name.trim(),
      email: newStudent.email.trim() || `${newStudent.name.toLowerCase().replace(/\s+/g, '.')}@student.kitcha.studio`,
      phone: newStudent.phone.trim() || '+254700000000',
      gender: newStudent.gender || 'Male',
      indexNumber: newStudent.indexNumber.trim(),
      nationalId: newStudent.nationalId.trim(),
      courseId: newStudent.courseId,
      departmentId: targetCourse.departmentId,
      yearOfStudy: parseInt(newStudent.yearOfStudy),
      semester: parseInt(newStudent.semester),
      status: 'active',
      sponsorType: newStudent.sponsorType
    };

    onUpdateStudents([registered, ...students]);
    logAuditAction('REGISTER_STUDENT', `Registered student ${registered.name} with RegNo ${registered.regNumber}`);

    // Auto-provision corresponding student user account so they can log in
    const newUserAccount: User = {
      id: `user_stud_${Date.now()}`,
      username: registered.regNumber.toUpperCase(), // Can log in with their Reg Number!
      password: 'student123', // Default easy password
      role: 'student',
      name: registered.name,
      isActive: true,
      isDefault: false,
      code: registered.regNumber
    };
    onUpdateUsers([...users, newUserAccount]);

    setCreatedStudentAccountModal({
      isOpen: true,
      studentName: registered.name,
      regNumber: registered.regNumber,
      username: registered.regNumber.toUpperCase(),
      password: 'student123',
      courseName: targetCourse.name
    });
    
    // Auto invoice the student on registration if a fee structure exists!
    const matchingStructure = feeStructures.find(
      s => s.courseId === registered.courseId && s.semester === registered.semester
    );

    if (matchingStructure) {
      const invId = `inv_${Date.now()}`;
      const newInv: Invoice = {
        id: invId,
        studentId: registered.id,
        feeStructureId: matchingStructure.id,
        description: `Admission Invoice - Year ${registered.yearOfStudy} Semester ${registered.semester}`,
        academicYear: '2025/2026',
        semester: registered.semester,
        amount: matchingStructure.totalAmount,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days due
        balance: matchingStructure.totalAmount,
        status: 'unpaid'
      };
      onUpdateInvoices([newInv, ...invoices]);
      logAuditAction('AUTO_INVOICING', `Auto-invoiced registered student ${registered.name} KES ${matchingStructure.totalAmount}`);
    }

    setShowAddStudentModal(false);
    setNewStudent({
      regNumber: '',
      name: '',
      email: '',
      phone: '',
      nationalId: '',
      courseId: courses[0]?.id || '',
      yearOfStudy: '1',
      semester: '1',
      sponsorType: 'self'
    });
    alert("Student successfully registered and auto-invoiced based on course admission structure!");
  };

  // Finance Officer: Create Fee Structure
  const handleAddStructureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = newStructure.items.reduce((sum, item) => sum + item.amount, 0);
    const newStruct: FeeStructure = {
      id: `struct_${Date.now()}`,
      courseId: newStructure.courseId,
      academicYear: newStructure.academicYear,
      semester: parseInt(newStructure.semester),
      items: newStructure.items,
      totalAmount
    };

    onUpdateFeeStructures([newStruct, ...feeStructures]);
    logAuditAction('CREATE_STRUCTURE', `Created fee structure for Course ID ${newStruct.courseId} (${formatKES(totalAmount)})`);
    setShowAddStructureModal(false);
    alert("New fee structure established successfully!");
  };

  // Super Admin: Create User Accounts
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newErpUser.username || !newErpUser.password || !newErpUser.name) {
      alert("Please fill in username, password, and display name.");
      return;
    }

    // Check if username already exists
    const usernameExists = users.some(u => u.username.toLowerCase() === newErpUser.username.trim().toLowerCase());
    if (usernameExists) {
      alert(`The username '${newErpUser.username}' is already in use by another staff member.`);
      return;
    }

    const newUserId = `user_${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      username: newErpUser.username.trim(),
      password: newErpUser.password.trim(),
      role: newErpUser.role,
      name: newErpUser.name.trim(),
      departmentId: ['trainer', 'hod'].includes(newErpUser.role) ? newErpUser.departmentId : undefined,
      code: newErpUser.code.trim() || `PF-${Math.floor(1000 + Math.random() * 9000)}`,
      isActive: true,
      isDefault: false
    };

    onUpdateUsers([...users, newUser]);
    logAuditAction('CREATE_USER_ACCOUNT', `Super Admin created user account ${newUser.name} with role ${newUser.role.toUpperCase()}`);
    
    // If the role is student, let's automatically check if a Student profile exists.
    // If it doesn't, let's create a stub Student profile so they can access their dashboard!
    if (newErpUser.role === 'student') {
      const regNoClean = newErpUser.code.trim().toUpperCase() || `KITCHA/2025/S${students.length + 1}`;
      const studentExists = students.some(s => s.regNumber.toUpperCase() === regNoClean);
      if (!studentExists) {
        const newStudentProfile: Student = {
          id: `stud_${Date.now()}`,
          regNumber: regNoClean,
          name: newErpUser.name.trim(),
          email: `${newErpUser.username.trim().toLowerCase()}@student.kitcha.studio`,
          phone: '+254700000000',
          courseId: courses[0]?.id || '',
          departmentId: departments[0]?.id || '',
          yearOfStudy: 1,
          semester: 1,
          status: 'active',
          sponsorType: 'self'
        };
        onUpdateStudents([...students, newStudentProfile]);
        logAuditAction('AUTO_STUDENT_PROFILE', `Auto-created Student registry profile for student user ${newStudentProfile.name} (${newStudentProfile.regNumber})`);
      }
    }

    // Reset Form and close modal
    setNewErpUser({
      username: '',
      password: '',
      role: 'finance_officer',
      name: '',
      departmentId: departments[0]?.id || '',
      code: ''
    });
    setShowAddUserModal(false);
    alert(`Account for ${newUser.name} (${newUser.role.toUpperCase()}) successfully registered!`);
  };

  // Installments Plan Builder
  const handleInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetInvoice = invoices.find(i => i.id === newInstallment.invoiceId);
    if (!targetInvoice) {
      alert("Please select a valid outstanding invoice.");
      return;
    }

    const stagesCount = parseInt(newInstallment.stages);
    const amountPerStage = Math.floor(targetInvoice.amount / stagesCount);
    
    const instPlan: InstallmentPlan = {
      id: `plan_${Date.now()}`,
      studentId: newInstallment.studentId,
      invoiceId: newInstallment.invoiceId,
      agreedAmount: targetInvoice.amount,
      dateAgreed: new Date().toISOString().split('T')[0],
      installments: Array.from({ length: stagesCount }).map((_, idx) => ({
        id: `inst_${Date.now()}_${idx}`,
        dueDate: new Date(Date.now() + (idx + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // spaced by 30 days
        amount: idx === stagesCount - 1 ? targetInvoice.amount - (amountPerStage * (stagesCount - 1)) : amountPerStage,
        amountPaid: 0,
        status: 'pending'
      })),
      active: true
    };

    onUpdateInstallmentPlans([instPlan, ...installmentPlans]);
    logAuditAction('INSTALLMENT_PLAN_ESTABLISHED', `Drafted ${stagesCount}-stage installment plan for student ${newInstallment.studentId}`);
    setShowInstallmentModal(false);
    alert("Installment agreement successfully generated and registered!");
  };

  // Trainer: Save and Submit student marks
  const handleSaveMarks = () => {
    if (!selectedExamCourseId || !selectedExamUnitId) {
      alert("Please select a Course Program and Subject Unit first!");
      return;
    }
    const updatedMarks = [...examMarks];
    const examStudents = students.filter(s => s.courseId === selectedExamCourseId);
    
    examStudents.forEach(student => {
      const c1Str = localCat1[student.id];
      const c2Str = localCat2[student.id];
      const etStr = localEndTerm[student.id];

      const c1 = c1Str !== undefined && c1Str !== "" ? parseFloat(c1Str) : undefined;
      const c2 = c2Str !== undefined && c2Str !== "" ? parseFloat(c2Str) : undefined;
      const et = etStr !== undefined && etStr !== "" ? parseFloat(etStr) : undefined;

      // Calculate score average
      let total = 0;
      let count = 0;
      if (c1 !== undefined && !isNaN(c1)) { total += c1; count++; }
      if (c2 !== undefined && !isNaN(c2)) { total += c2; count++; }
      if (et !== undefined && !isNaN(et)) { total += et; count++; }

      if (count > 0) {
        const score = Math.round(total / count);
        
        // Find if mark exists
        const existingIdx = updatedMarks.findIndex(m => m.studentId === student.id && m.unitId === selectedExamUnitId);
        
        let grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'F';
        if (score >= 75) grade = 'A';
        else if (score >= 60) grade = 'B';
        else if (score >= 50) grade = 'C';
        else if (score >= 40) grade = 'D';
        else if (score >= 30) grade = 'E';

        const newMark: ExamMark = {
          id: existingIdx >= 0 ? updatedMarks[existingIdx].id : `mark_${Date.now()}_${student.id}`,
          studentId: student.id,
          unitId: selectedExamUnitId,
          score,
          marksObtained: score,
          cat1: c1,
          cat2: c2,
          endTerm: et,
          grade,
          verifiedByHod: false,
          approvedByExamsOfficer: false,
          recordedBy: currentUser.id,
          academicYear: '2025/2026',
          semester: student.semester,
          examTerm: `Semester ${student.semester} End of Term`
        };

        if (existingIdx >= 0) {
          updatedMarks[existingIdx] = {
            ...updatedMarks[existingIdx],
            score,
            marksObtained: score,
            cat1: c1,
            cat2: c2,
            endTerm: et,
            grade,
            recordedBy: currentUser.id,
          };
        } else {
          updatedMarks.push(newMark);
        }
      }
    });

    onUpdateExamMarks(updatedMarks);
    const actorTitle = activeRole === 'hod' ? 'HOD' : 'Trainer';
    logAuditAction('SAVE_MARKS', `${actorTitle} ${currentUser.name} saved and submitted marks for Subject ${selectedExamUnitId}`);
    if (activeRole === 'hod') {
      alert("Marks have been successfully saved and drafted for departmental sign-off!");
    } else {
      alert("Marks have been successfully drafted and submitted for HOD verification!");
    }
  };

  // Examinations Officer: Open Result Amendment Modal
  const handleOpenAmendModal = (student: Student, unit: Unit, mark?: ExamMark) => {
    const targetMark = mark || examMarks.find(m => m.studentId === student.id && m.unitId === unit.id);
    setAmendingMark({ student, unit, mark: targetMark });
    setAmendCat1(targetMark?.cat1 !== undefined ? targetMark.cat1.toString() : '');
    setAmendCat2(targetMark?.cat2 !== undefined ? targetMark.cat2.toString() : '');
    setAmendEndTerm(targetMark?.endTerm !== undefined ? targetMark.endTerm.toString() : '');
    setAmendScore(targetMark?.score !== undefined ? targetMark.score.toString() : targetMark?.marksObtained !== undefined ? targetMark.marksObtained.toString() : '');
    setAmendReason(targetMark?.amendmentReason || 'Script Re-marking / Verification Request');
    setAmendRemarks(targetMark?.remarks || '');
    setAmendReleaseImmediately(targetMark?.approvedByExamsOfficer ?? true);
    setAmendSuccessMsg('');
  };

  // Examinations Officer: Save Result Amendment
  const handleSaveAmendedMark = () => {
    if (!amendingMark) return;
    const { student, unit, mark } = amendingMark;

    const c1 = amendCat1 !== '' ? parseFloat(amendCat1) : undefined;
    const c2 = amendCat2 !== '' ? parseFloat(amendCat2) : undefined;
    const et = amendEndTerm !== '' ? parseFloat(amendEndTerm) : undefined;

    let finalScore: number;
    if (amendScore !== '' && !isNaN(parseFloat(amendScore))) {
      finalScore = Math.min(100, Math.max(0, Math.round(parseFloat(amendScore))));
    } else {
      let tot = 0;
      let cnt = 0;
      if (c1 !== undefined && !isNaN(c1)) { tot += c1; cnt++; }
      if (c2 !== undefined && !isNaN(c2)) { tot += c2; cnt++; }
      if (et !== undefined && !isNaN(et)) { tot += et; cnt++; }
      finalScore = cnt > 0 ? Math.round(tot / cnt) : 0;
    }

    let grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' = 'F';
    if (finalScore >= 70) grade = 'A';
    else if (finalScore >= 60) grade = 'B';
    else if (finalScore >= 50) grade = 'C';
    else if (finalScore >= 40) grade = 'D';
    else if (finalScore >= 30) grade = 'E';

    const updatedMarks = [...examMarks];
    const existingIdx = updatedMarks.findIndex(m => m.studentId === student.id && m.unitId === unit.id);

    const newMark: ExamMark = {
      id: mark?.id || (existingIdx >= 0 ? updatedMarks[existingIdx].id : `mark_${Date.now()}_${student.id}`),
      studentId: student.id,
      unitId: unit.id,
      score: finalScore,
      marksObtained: finalScore,
      cat1: c1,
      cat2: c2,
      endTerm: et,
      grade,
      verifiedByHod: true,
      approvedByExamsOfficer: amendReleaseImmediately,
      amendedByExamsOfficer: true,
      amendmentReason: amendReason,
      amendedAt: new Date().toISOString(),
      amendedBy: currentUser.name || currentUser.username,
      remarks: amendRemarks,
      recordedBy: mark?.recordedBy || currentUser.id,
      academicYear: mark?.academicYear || '2025/2026',
      semester: student.semester || 1,
      examTerm: mark?.examTerm || `Semester ${student.semester || 1} End of Term`
    };

    if (existingIdx >= 0) {
      updatedMarks[existingIdx] = newMark;
    } else {
      updatedMarks.push(newMark);
    }

    onUpdateExamMarks(updatedMarks);
    logAuditAction(
      'EXAMS_AMENDED_MARK',
      `Examinations Officer ${currentUser.name} amended mark for ${student.name} (${student.regNumber}) in ${unit.name} (${unit.code}) -> ${finalScore}% [Grade ${grade}]. Reason: ${amendReason}`
    );

    setAmendSuccessMsg(`Result for ${student.name} successfully amended to ${finalScore}% (${grade})!`);
    setTimeout(() => {
      setAmendingMark(null);
      setAmendSuccessMsg('');
    }, 1000);
  };

  // Examinations Officer: Toggle single mark release
  const handleToggleReleaseMark = (markId: string) => {
    const updated = examMarks.map(m => {
      if (m.id === markId) {
        const next = !m.approvedByExamsOfficer;
        return { ...m, approvedByExamsOfficer: next, verifiedByHod: true };
      }
      return m;
    });
    onUpdateExamMarks(updated);
  };

  // Examinations Officer: Release all marks for a student
  const handleReleaseStudentAllMarks = (studentId: string) => {
    const updated = examMarks.map(m => {
      if (m.studentId === studentId) {
        return { ...m, approvedByExamsOfficer: true, verifiedByHod: true };
      }
      return m;
    });
    onUpdateExamMarks(updated);
    const stu = students.find(s => s.id === studentId);
    logAuditAction('EXAMS_RELEASE_STUDENT', `Released all exam results for ${stu?.name || studentId}`);
  };

  // Examinations Officer: Retract all marks for a student back to unreleased
  const handleRetractStudentAllMarks = (studentId: string) => {
    const updated = examMarks.map(m => {
      if (m.studentId === studentId) {
        return { ...m, approvedByExamsOfficer: false };
      }
      return m;
    });
    onUpdateExamMarks(updated);
    const stu = students.find(s => s.id === studentId);
    logAuditAction('EXAMS_RETRACT_STUDENT', `Retracted results for student ${stu?.name || studentId}`);
  };

  // Examinations Officer: Batch release all marks matching active filters
  const handleReleaseFilteredBatch = () => {
    let releasedCount = 0;
    const updated = examMarks.map(m => {
      const st = students.find(s => s.id === m.studentId);
      const u = units.find(unit => unit.id === m.unitId);
      if (!st || !u) return m;

      if (examsFilterDept) {
        const crs = courses.find(c => c.id === st.courseId);
        if (!crs || crs.departmentId !== examsFilterDept) return m;
      }
      if (examsFilterCourse && st.courseId !== examsFilterCourse) return m;
      if (examsFilterModule && !isUnitInModule(u, examsFilterModule)) return m;
      if (examsFilterUnitId && u.id !== examsFilterUnitId) return m;
      if (examStudentSearch.trim()) {
        const q = examStudentSearch.toLowerCase().trim();
        const matchesName = st.name.toLowerCase().includes(q);
        const matchesReg = st.regNumber.toLowerCase().includes(q);
        const matchesUnit = u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q);
        if (!matchesName && !matchesReg && !matchesUnit) return m;
      }

      if (m.verifiedByHod && !m.approvedByExamsOfficer) {
        releasedCount++;
        return { ...m, approvedByExamsOfficer: true };
      }
      return m;
    });

    onUpdateExamMarks(updated);
    logAuditAction('EXAMS_BATCH_RELEASE', `Batch released ${releasedCount} verified marks`);
    alert(`Batch release successful: ${releasedCount} verified marks have been officially approved and published!`);
  };

  // Examinations Officer: Release all marks for a subject unit
  const handleReleaseUnitAllMarks = (unitId: string) => {
    const updated = examMarks.map(m => {
      if (m.unitId === unitId) {
        return { ...m, approvedByExamsOfficer: true, verifiedByHod: true };
      }
      return m;
    });
    onUpdateExamMarks(updated);
    const u = units.find(unit => unit.id === unitId);
    logAuditAction('EXAMS_RELEASE_UNIT', `Released all results for subject unit ${u?.name || unitId}`);
  };

  // Financial Dashboard calculations
  const totalCollections = payments
    .filter(p => ['fee_payment', 'helb_funding', 'bursary', 'scholarship'].includes(p.transactionType))
    .reduce((sum, p) => sum + p.amount, 0);

  const totalOutstanding = invoices.reduce((sum, i) => sum + i.balance, 0);

  const defaultersCount = students.filter(s => {
    const studentInvs = invoices.filter(inv => inv.studentId === s.id);
    return studentInvs.some(inv => inv.balance > 0 && new Date(inv.dueDate) < new Date());
  }).length;

  const revenueByDept = departments.map(d => {
    const deptStudents = students.filter(s => s.departmentId === d.id);
    const deptPaymentsSum = payments
      .filter(p => deptStudents.some(s => s.id === p.studentId) && ['fee_payment', 'helb_funding', 'bursary', 'scholarship'].includes(p.transactionType))
      .reduce((sum, p) => sum + p.amount, 0);
    return { name: d.name, code: d.code, amount: deptPaymentsSum };
  });

  const collectionsByMethod = [
    { name: 'M-Pesa STK Push', amount: payments.filter(p => p.method === 'mpesa_stk').reduce((sum, p) => sum + p.amount, 0), icon: CreditCard },
    { name: 'M-Pesa PayBill', amount: payments.filter(p => p.method === 'mpesa_paybill').reduce((sum, p) => sum + p.amount, 0), icon: Coins },
    { name: 'Bank Transfer/Deposit', amount: payments.filter(p => p.method === 'bank').reduce((sum, p) => sum + p.amount, 0), icon: Building },
    { name: 'Over the Counter (Cash)', amount: payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0), icon: DollarSign }
  ];

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                          s.regNumber.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesCourse = !selectedCourseFilter || s.courseId === selectedCourseFilter;
    const matchesStatus = !selectedStatusFilter || s.status === selectedStatusFilter;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Top Header */}
      <header className="bg-gradient-to-r from-sky-100 to-[#eeddd3] text-slate-800 py-3 px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#d7bdac] shadow-sm print:hidden shrink-0">
        <div className="flex items-center gap-3.5">
          <img
            src={kitchaLogo}
            alt="KITCHA TVC Logo"
            className="w-12 h-12 object-contain rounded-full bg-white p-0.5 border border-[#c6aa96]"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-bold font-display text-lg sm:text-xl tracking-tight text-slate-900">Kitutu Chache TVC</h1>
            <p className="text-[10px] uppercase font-mono tracking-widest text-[#7c5335]">Student Fees & College ERP Console</p>
          </div>
        </div>
        
        {/* Role and Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* DEMO SIMULATION ROLE SWITCHER BAR - Render if currentUser is Admin or Principal */}
          {(currentUser.role === 'admin' || currentUser.role === 'principal') && (
            <div className="bg-white/80 p-1 rounded-xl border border-[#c6aa96] flex items-center gap-1 overflow-x-auto">
              <span className="text-[9px] font-bold text-[#7c5335] uppercase tracking-wider px-2 font-mono shrink-0">
                Simulate View:
              </span>
              {[
                { id: 'principal', label: 'Principal', icon: ShieldCheck },
                { id: 'registrar', label: 'Registrar', icon: UserCheck },
                { id: 'finance_officer', label: 'Finance Staff', icon: Coins },
                { id: 'trainer', label: 'Trainer', icon: BookOpen },
                { id: 'hod', label: 'HOD', icon: Building },
                { id: 'examinations_officer', label: 'Exams Officer', icon: GraduationCap },
                { id: 'student', label: 'Student', icon: Users },
                { id: 'auditor', label: 'Auditor', icon: ShieldCheck },
                { id: 'admin', label: 'Admin', icon: Database }
              ].map(role => {
                const IsSelected = activeRole === role.id;
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => {
                      setActiveRole(role.id as any);
                      if (role.id === 'student' && students.length > 0) {
                        setSelectedStudentId(students[0].id);
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      IsSelected 
                        ? 'bg-indigo-600 text-white shadow-xs border border-indigo-700' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {role.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* User badge and Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="block text-[10px] font-bold text-[#8c5e3c] font-mono uppercase">
                {currentUser.role.replace('_', ' ')}
              </span>
              <span className="text-xs font-bold text-slate-800">
                {currentUser.name}
              </span>
            </div>

            {/* Back to Timetable Button - ONLY for Super Admin */}
            {currentUser.role === 'admin' && (
              <button
                onClick={onBackToTimetable}
                className="py-1.5 px-3.5 rounded-lg border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold transition-all cursor-pointer bg-white"
              >
                📅 Switch to Timetable
              </button>
            )}

            <button
              onClick={() => setIsProfileOpen(true)}
              className="py-1.5 px-3.5 rounded-lg border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold transition-all cursor-pointer bg-white flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              Edit Profile
            </button>

            <button 
              onClick={onLogout}
              className="py-1.5 px-3.5 rounded-lg border border-[#c6aa96] hover:border-red-400 hover:bg-red-50 text-slate-800 hover:text-red-600 text-xs font-semibold transition-all cursor-pointer bg-white/80"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto print:p-0">

        {/* ========================================== */}
        {/* STAFF MODULAR ERP WORKSPACE SWITCHER */}
        {/* ========================================== */}
        {activeRole !== 'student' && (
          <div className="mb-6 flex flex-wrap gap-1.5 p-1 bg-slate-200/60 backdrop-blur-xs rounded-2xl border border-slate-200/80 max-w-fit print:hidden">
            {[
              { id: 'fees', label: 'Fee Collection', icon: Coins, roles: ['finance_officer', 'principal'] },
              { id: 'admissions', label: 'Admissions Desk', icon: UserPlus, roles: ['registrar', 'principal', 'admin'] },
              { id: 'records', label: 'Student Records', icon: Users, roles: ['registrar', 'principal', 'admin'] },
              { id: 'examinations', label: 'Examinations Desk', icon: GraduationCap, roles: ['trainer', 'hod', 'examinations_officer', 'principal', 'admin'] },
              { id: 'users', label: 'System Users', icon: ShieldCheck, roles: ['principal', 'admin'] }
            ]
              .filter(m => m.roles.includes(activeRole))
              .map(m => {
                const IsSelected = activeModule === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    id={`erp-tab-${m.id}`}
                    onClick={() => setActiveModule(m.id as any)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      IsSelected 
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-white/40'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-indigo-600" />
                    {m.label}
                    {m.id === 'examinations' && ['hod', 'principal', 'admin'].includes(activeRole) && pendingHodUnits.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-black font-mono animate-pulse" title={`${pendingHodUnits.length} course units pending HOD verification`}>
                        {pendingHodUnits.length}
                      </span>
                    )}
                    {m.id === 'examinations' && ['examinations_officer', 'principal', 'admin'].includes(activeRole) && pendingExamsUnits.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[9px] font-black font-mono" title={`${pendingExamsUnits.length} course units pending Exams Officer release`}>
                        {pendingExamsUnits.length}
                      </span>
                    )}
                  </button>
                );
              })}
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 1: FINANCE OFFICER WORKSPACE */}
        {/* ========================================== */}
        {activeRole !== 'student' && activeModule === 'fees' && ['finance_officer', 'principal'].includes(activeRole) && (
          <div className="space-y-6 animate-fadeIn print:hidden">
            
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Fee Collections</span>
                  <p className="text-xl sm:text-2xl font-black font-mono text-slate-800 mt-1">{formatKES(totalCollections)}</p>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">✓ Auto-Reconciled</span>
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Outstanding Balance</span>
                  <p className="text-xl sm:text-2xl font-black font-mono text-slate-800 mt-1">{formatKES(totalOutstanding)}</p>
                  <span className="text-[10px] text-indigo-500 font-semibold mt-1 block">Invoiced Student Debts</span>
                </div>
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl border border-indigo-100">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Defaulter Accounts</span>
                  <p className="text-xl sm:text-2xl font-black font-mono text-red-600 mt-1">{defaultersCount}</p>
                  <span className="text-[10px] text-red-500 font-semibold mt-1 block">Overdue invoice dates</span>
                </div>
                <div className="bg-red-50 text-red-600 p-3 rounded-2xl border border-red-100">
                  <AlertCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Structures</span>
                  <p className="text-xl sm:text-2xl font-black font-mono text-slate-800 mt-1">{feeStructures.length}</p>
                  <span className="text-[10px] text-amber-600 font-semibold mt-1 block">Department Curriculums</span>
                </div>
                <div className="bg-amber-50 text-amber-600 p-3 rounded-2xl border border-amber-100">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Sub Tabs Navigation */}
            <div className="border-b border-slate-200 flex items-center gap-4">
              {[
                { id: 'overview', label: 'Financial Summaries & Revenue', icon: FileText, roles: ['finance_officer', 'auditor', 'principal', 'admin'] },
                { id: 'structures', label: 'Fee Structures', icon: BookOpen, roles: ['finance_officer', 'principal', 'admin', 'auditor'] },
                { id: 'payments', label: 'Post Transactions / Ledgers', icon: Coins, roles: ['finance_officer', 'principal', 'admin'] },
                { id: 'installments', label: 'Installment Agreements', icon: ArrowRightLeft, roles: ['finance_officer', 'principal', 'admin'] }
              ]
                .filter(tab => tab.roles.includes(activeRole))
                .map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFinanceTab(tab.id as any)}
                    className={`py-3 px-1 border-b-2 font-bold text-sm flex items-center gap-1.5 transition-all cursor-pointer ${
                      financeTab === tab.id 
                        ? 'border-indigo-600 text-indigo-700' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
            </div>

            {/* TAB CONTENT: OVERVIEW & SUMMARIES */}
            {financeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Revenue breakdown by payment method */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-1.5">
                      <CreditCard className="w-4.5 h-4.5 text-indigo-600" />
                      Collections by Payment Channels
                    </h3>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">KES System Ledger</span>
                  </div>

                  <div className="space-y-4">
                    {collectionsByMethod.map((method, idx) => {
                      const percentage = totalCollections > 0 ? (method.amount / totalCollections) * 100 : 0;
                      const Icon = method.icon;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-slate-400" />
                              {method.name}
                            </span>
                            <span className="font-mono font-bold text-slate-800">{formatKES(method.amount)} ({percentage.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Revenue breakdown by departments */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-1.5">
                      <Building className="w-4.5 h-4.5 text-indigo-600" />
                      Revenue Collected by Department
                    </h3>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono font-bold">Academics</span>
                  </div>

                  <div className="space-y-4">
                    {revenueByDept.map((dept, idx) => {
                      const percentage = totalCollections > 0 ? (dept.amount / totalCollections) * 100 : 0;
                      return (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-600 block truncate max-w-xs">{dept.name} ({dept.code})</span>
                            <span className="font-mono font-bold text-slate-800">{formatKES(dept.amount)}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Audit & Default summary alerts */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs lg:col-span-12 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-1.5">
                      <AlertCircle className="w-4.5 h-4.5 text-red-600" />
                      Urgent Financial Action Required (Overdue Fee Invoices)
                    </h3>
                    <span className="bg-red-50 text-red-600 font-mono text-[9px] px-2 py-0.5 rounded-lg font-bold">
                      {defaultersCount} Delinquent Accounts
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-mono font-bold">
                          <th className="py-2">Reg Number</th>
                          <th className="py-2">Student Name</th>
                          <th className="py-2">Outstanding Fee</th>
                          <th className="py-2">Invoice Due Date</th>
                          <th className="py-2">Course Program</th>
                          <th className="py-2">Sponsor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {students.filter(s => {
                          const studentInvs = invoices.filter(inv => inv.studentId === s.id);
                          return studentInvs.some(inv => inv.balance > 0 && new Date(inv.dueDate) < new Date());
                        }).map(s => {
                          const mainInv = invoices.find(i => i.studentId === s.id && i.balance > 0);
                          const course = courses.find(c => c.id === s.courseId);
                          return (
                            <tr key={s.id} className="text-slate-700 hover:bg-slate-50/50">
                              <td className="py-2.5 font-mono font-bold text-slate-900">{s.regNumber}</td>
                              <td className="py-2.5 font-semibold text-slate-800">{s.name}</td>
                              <td className="py-2.5 font-mono text-red-600 font-bold">{mainInv ? formatKES(mainInv.balance) : 'KES 0'}</td>
                              <td className="py-2.5 text-slate-500 font-mono">{mainInv ? mainInv.dueDate : '-'}</td>
                              <td className="py-2.5 text-slate-500">{course?.code || s.courseId}</td>
                              <td className="py-2.5">
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg uppercase ${
                                  s.sponsorType === 'government' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                                }`}>
                                  {s.sponsorType}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT: FEE STRUCTURES */}
            {financeTab === 'structures' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">
                    Configure institutional fee structures per Course, Semester, and Academic Year. These are used to automatically formulate and generate student invoices.
                  </div>
                  <button
                    onClick={() => setShowAddStructureModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Establish Fee Structure
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {feeStructures.map(struct => {
                    const course = courses.find(c => c.id === struct.courseId);
                    return (
                      <div key={struct.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase font-mono tracking-wider block">
                            Academic Year {struct.academicYear} • Semester {struct.semester}
                          </span>
                          <h4 className="font-bold text-slate-800 text-sm font-display mt-0.5">
                            {course?.name} ({course?.code})
                          </h4>
                        </div>
                        <div className="p-5 flex-1 space-y-2.5">
                          {struct.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs text-slate-600">
                              <span>{item.name}</span>
                              <span className="font-mono font-semibold text-slate-800">{formatKES(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-500 uppercase tracking-wider text-[10px]">Structure Aggregate</span>
                          <span className="font-mono text-indigo-700 text-sm">{formatKES(struct.totalAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB CONTENT: POST PAYMENTS & GENERAL LEDGER */}
            {financeTab === 'payments' && (
              <div className="space-y-6">
                
                {/* Active search filters and record buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200">
                  <div className="flex items-center gap-2 w-full sm:max-w-md">
                    <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search students, reg number, reference number..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full text-xs bg-transparent border-0 focus:ring-0 focus:outline-none"
                    />
                  </div>
                  
                  <button
                    onClick={handleOpenPostPaymentModal}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Post Manual Transaction
                  </button>
                </div>

                {/* Ledger & Transactions Table */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Financial Payments Log ({payments.length} postings)</span>
                    <span className="text-indigo-600 font-semibold">✓ Double-entry Ledger Compliant</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-mono font-bold bg-slate-50">
                          <th className="py-3 px-4">Receipt No</th>
                          <th className="py-3 px-4">Student Info</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Channel / Reference</th>
                          <th className="py-3 px-4">Posting Date</th>
                          <th className="py-3 px-4 text-center">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {payments.map(tx => {
                          const student = students.find(s => s.id === tx.studentId);
                          return (
                            <tr key={tx.id} className="text-slate-700 hover:bg-slate-50/50">
                              <td className="py-3 px-4 font-mono font-bold text-indigo-700">{tx.receiptNumber || 'N/A'}</td>
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-800">{student?.name || 'Unknown Student'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{student?.regNumber}</div>
                              </td>
                              <td className="py-3 px-4 font-mono font-bold">
                                <span className={tx.transactionType === 'penalty' ? 'text-red-600' : 'text-emerald-600'}>
                                  {tx.transactionType === 'penalty' ? '+' : '-'}{formatKES(tx.amount)}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg uppercase ${
                                  tx.transactionType === 'penalty'
                                    ? 'bg-red-50 text-red-600 border border-red-100'
                                    : tx.transactionType === 'bursary' || tx.transactionType === 'scholarship'
                                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                    : tx.transactionType === 'helb_funding'
                                    ? 'bg-sky-50 text-sky-600 border border-sky-100'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                  {tx.transactionType.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-700">{tx.method.toUpperCase()}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{tx.referenceNumber}</div>
                              </td>
                              <td className="py-3 px-4 text-slate-500 font-mono">{formatDate(tx.date)}</td>
                              <td className="py-3 px-4 text-center">
                                {tx.receiptNumber ? (
                                  <button
                                    onClick={() => setSelectedReceipt(tx)}
                                    className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                                  >
                                    Generate Receipt
                                  </button>
                                ) : (
                                  <span className="text-slate-400 italic text-[10px]">No Receipt</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: INSTALLMENTS */}
            {financeTab === 'installments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">
                    Manage customized fee repayment agreements and installment schedules. Students who cannot pay in full can be assigned stages, and their outstanding balances are auto-checked against agreed stages.
                  </div>
                  <button
                    onClick={() => setShowInstallmentModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Draft Installment Agreement
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {installmentPlans.map(plan => {
                    const student = students.find(s => s.id === plan.studentId);
                    return (
                      <div key={plan.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm font-display">
                              {student?.name}
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {student?.regNumber} • Agreed on {plan.dateAgreed}
                            </span>
                          </div>
                          <span className="bg-emerald-50 text-emerald-600 font-mono text-[9px] px-2 py-0.5 rounded-lg border border-emerald-100 font-bold uppercase">
                            Active Contract
                          </span>
                        </div>
                        
                        <div className="p-5 space-y-3 flex-1">
                          {plan.installments.map((stage, idx) => (
                            <div key={stage.id} className="flex items-center justify-between text-xs">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-700 block">Stage {idx + 1} Installment</span>
                                <span className="text-[10px] text-slate-400 font-mono">Due: {stage.dueDate}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold text-slate-800 block">{formatKES(stage.amount)}</span>
                                <span className={`text-[10px] font-bold uppercase ${stage.status === 'paid' ? 'text-emerald-600' : 'text-amber-500'}`}>
                                  {stage.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-500 uppercase tracking-wider text-[10px]">Agreed Sum</span>
                          <span className="font-mono text-indigo-700 text-sm">{formatKES(plan.agreedAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ========================================== */}
        {/* ADMISSIONS SUB-MODULE */}
        {/* ========================================== */}
        {activeRole !== 'student' && activeModule === 'admissions' && (
          <div className="space-y-6 animate-fadeIn print:hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg font-black font-display text-slate-800 uppercase flex items-center gap-1.5">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                  Academic Admissions Registry Desk
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Evaluate incoming candidates, manage student intakes, approve applications, and auto-provision academic ledger profiles.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={exportAdmissionsCSV}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
                  title="Export Admissions Intake Data to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  Export CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
                  title="Print Official Admissions Intake Report"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  Print Report
                </button>
                {['registrar', 'admin', 'principal'].includes(activeRole) && (
                  <button
                    onClick={() => setShowAddApplicationModal(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Log Walk-in Application
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Intake Pool</span>
                  <span className="text-lg font-black text-slate-800 font-mono block mt-1">{admissionApplications.length} Candidates</span>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approved & Enrolled</span>
                  <span className="text-lg font-black text-emerald-600 font-mono block mt-1">
                    {admissionApplications.filter(a => a.status === 'admitted').length} Students
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Evaluation</span>
                  <span className="text-lg font-black text-amber-600 font-mono block mt-1">
                    {admissionApplications.filter(a => a.status === 'pending').length} Underway
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500 animate-pulse">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Female Enrolment Ratio</span>
                  <span className="text-lg font-black text-indigo-600 font-mono block mt-1">
                    {admissionApplications.length > 0 
                      ? `${((admissionApplications.filter(a => a.gender === 'Female').length / admissionApplications.length) * 100).toFixed(1)}%` 
                      : '0.0%'} Female
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Applications list */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-800">Candidate Intakes Queue</span>
                <span className="text-[#8c5e3c] font-mono uppercase tracking-widest text-[9px]">Role-Specific Credentials Appraised</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 bg-slate-50/80 font-mono font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Applicant Particulars</th>
                      <th className="py-3 px-4">Gender / Sex</th>
                      <th className="py-3 px-4">Intake & Auto Reg No</th>
                      <th className="py-3 px-4">KCSE/KCPE Index No</th>
                      <th className="py-3 px-4">Desired Program</th>
                      <th className="py-3 px-4">Sponsorship</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      {['registrar', 'admin', 'principal'].includes(activeRole) && <th className="py-3 px-4 text-right">Actions / Letter</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {admissionApplications.map(app => {
                      const courseObj = courses.find(c => c.id === app.courseId);
                      const intakeLabel = app.intake === 'M' ? 'May (M)' : app.intake === 'S' ? 'September (S)' : 'January (J)';
                      return (
                        <tr key={app.id} className="text-slate-700 hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{app.applicantName}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{app.email} • {app.phone}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase ${
                              (app.gender || 'Male') === 'Female' ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}>
                              {app.gender || 'Male'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-800 block text-[11px]">{app.autoRegNumber || 'KTVC/GEN/2026J/001'}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold inline-block mt-0.5">
                              {intakeLabel}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-slate-600">
                            {app.indexNumber || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-indigo-600 block">{courseObj?.code || app.courseId}</span>
                            <span className="text-[10px] text-slate-400 block">{courseObj?.name}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase ${
                              app.sponsorType === 'government' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                            }`}>
                              {app.sponsorType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              app.status === 'admitted'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                : app.status === 'rejected'
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          {['registrar', 'admin', 'principal'].includes(activeRole) && (
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {app.status === 'pending' ? (
                                  <>
                                    <button
                                      onClick={() => handleApproveApplication(app.id)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-xs"
                                    >
                                      Approve & Enroll
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (confirm(`Reject application for ${app.applicantName}?`)) {
                                          const updated = admissionApplications.map(a => 
                                            a.id === app.id ? { ...a, status: 'rejected' as const } : a
                                          );
                                          onUpdateAdmissionApplications(updated);
                                          logAuditAction('REJECT_ADMISSION', `Rejected admission application for ${app.applicantName}`);
                                        }
                                      }}
                                      className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer border border-slate-200 hover:border-red-100"
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => setSelectedAdmissionLetter(app)}
                                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                    title="View & Print Official Admission Letter"
                                  >
                                    <Printer className="w-3 h-3 text-indigo-600" />
                                    Admission Letter
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* STUDENT RECORDS SUB-MODULE */}
        {/* ========================================== */}
        {activeRole !== 'student' && activeModule === 'records' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Sub-navigation bar */}
            <div className="flex items-center gap-2 p-1 bg-slate-200/60 rounded-2xl border border-slate-200 max-w-fit print:hidden">
              <button
                onClick={() => setRecordsSubTab('directory')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  recordsSubTab === 'directory'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-600" />
                Student Registry Directory
              </button>
              <button
                onClick={() => setRecordsSubTab('gender_reports')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  recordsSubTab === 'gender_reports'
                    ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                Gender Enrolment Report (Male / Female per Course per Module)
              </button>
            </div>

            {recordsSubTab === 'directory' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs print:hidden">
                  <div>
                    <h2 className="text-lg font-black font-display text-slate-800 uppercase flex items-center gap-1.5">
                      <Users className="w-5 h-5 text-indigo-600" />
                      Comprehensive Student Directory
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Maintain institutional records, suspend or activate profiles, modify financial sponsor classes, and monitor registration dossiers.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={exportStudentsCSV}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
                      title="Export Student Directory to CSV"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-600" />
                      Export Directory CSV
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200"
                      title="Print Official Student Registry Roster"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      Print Student Roster
                    </button>
                    {['registrar', 'admin', 'principal'].includes(activeRole) && (
                      <button
                        onClick={() => setShowAddStudentModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Direct Register Student
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter controls */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter by name, registration No..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full text-xs bg-transparent border-0 focus:ring-0 focus:outline-none"
                    />
                  </div>

                  <select
                    value={selectedCourseFilter}
                    onChange={(e) => setSelectedCourseFilter(e.target.value)}
                    className="text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 focus:outline-none"
                  >
                    <option value="">-- All Course Programs --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>

                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => setSelectedStatusFilter(e.target.value)}
                    className="text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 focus:outline-none"
                  >
                    <option value="">-- All Academic Statuses --</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Student list */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <table className="min-w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 bg-slate-50 font-mono font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Reg Number</th>
                        <th className="py-3 px-4">KCSE/KCPE Index No</th>
                        <th className="py-3 px-4">Student Particulars</th>
                        <th className="py-3 px-4">Program & Study Year</th>
                        <th className="py-3 px-4">Sponsorship</th>
                        {['finance_officer', 'principal'].includes(activeRole) ? (
                          <th className="py-3 px-4">Financial Health</th>
                        ) : (
                          <th className="py-3 px-4">Gender / Sex</th>
                        )}
                        <th className="py-3 px-4 text-center">Academic Status</th>
                        <th className="py-3 px-4 text-right print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map(student => {
                        const courseObj = courses.find(c => c.id === student.courseId);
                        const sInvoices = invoices.filter(i => i.studentId === student.id);
                        const totalBilled = sInvoices.reduce((sum, i) => sum + i.amount, 0);
                        const totalRemaining = sInvoices.reduce((sum, i) => sum + i.balance, 0);
                        
                        return (
                          <tr key={student.id} className="text-slate-700 hover:bg-slate-50/50">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{student.regNumber}</td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-600">{student.indexNumber || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-800 block">{student.name}</span>
                              <span className="text-[10px] text-slate-400 block">{student.email} • {student.phone}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold block">{courseObj?.code || student.courseId}</span>
                              <span className="text-[10px] text-slate-400 block">{student.module || (student.yearOfStudy ? `Module ${student.yearOfStudy}` : 'Module 1')}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                                  student.sponsorType === 'government' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                                }`}>
                                  {student.sponsorType}
                                </span>
                                {(activeRole === 'finance_officer') && (
                                  <button
                                    onClick={() => {
                                      const nextSponsor = student.sponsorType === 'government' ? 'self' : 'government';
                                      const updated = students.map(s => 
                                        s.id === student.id ? { ...s, sponsorType: nextSponsor as any } : s
                                      );
                                      onUpdateStudents(updated);
                                      logAuditAction('SPONSORSHIP_MODIFIED', `Modified sponsorship of ${student.name} to ${nextSponsor}`);
                                      alert(`Sponsorship changed to ${nextSponsor.toUpperCase()} for ${student.name}`);
                                    }}
                                    className="text-[9px] text-indigo-600 hover:underline font-bold transition-all print:hidden"
                                  >
                                    Toggle Sponsor
                                  </button>
                                )}
                              </div>
                            </td>
                            {['finance_officer', 'principal'].includes(activeRole) ? (
                              <td className="py-3 px-4">
                                <div className="font-mono text-[10px]">
                                  <div className="text-slate-400">Billed: {formatKES(totalBilled)}</div>
                                  <div className="font-bold text-amber-600">Owes: {formatKES(totalRemaining)}</div>
                                </div>
                              </td>
                            ) : (
                              <td className="py-3 px-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase inline-block ${
                                  (student.gender || 'Male') === 'Female' ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                                }`}>
                                  {student.gender || 'Male'}
                                </span>
                              </td>
                            )}
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                student.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : student.status === 'suspended'
                                  ? 'bg-red-50 text-red-600 border border-red-100'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}>
                                {student.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right print:hidden">
                              {['registrar', 'admin', 'principal'].includes(activeRole) ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => {
                                      const studentUser = users.find(u => 
                                        u.username.toLowerCase() === student.regNumber.toLowerCase() ||
                                        (u.code && u.code.toLowerCase() === student.regNumber.toLowerCase())
                                      );
                                      if (studentUser) {
                                        setCreatedStudentAccountModal({
                                          isOpen: true,
                                          studentName: student.name,
                                          regNumber: student.regNumber,
                                          username: studentUser.username,
                                          password: studentUser.password || 'student123',
                                          courseName: courseObj?.name || 'Technical Program'
                                        });
                                      } else {
                                        const newUserAccount: User = {
                                          id: `user_stud_${Date.now()}`,
                                          username: student.regNumber.toUpperCase(),
                                          password: 'student123',
                                          role: 'student',
                                          name: student.name,
                                          isActive: true,
                                          isDefault: false,
                                          code: student.regNumber
                                        };
                                        onUpdateUsers([...users, newUserAccount]);
                                        setCreatedStudentAccountModal({
                                          isOpen: true,
                                          studentName: student.name,
                                          regNumber: student.regNumber,
                                          username: student.regNumber.toUpperCase(),
                                          password: 'student123',
                                          courseName: courseObj?.name || 'Technical Program'
                                        });
                                      }
                                    }}
                                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer flex items-center gap-1"
                                    title="View / Copy Student Portal Login Credentials"
                                  >
                                    <Key className="w-3 h-3 text-indigo-600" />
                                    Portal Slip
                                  </button>
                                  <button
                                    onClick={() => {
                                      const nextStatus = student.status === 'active' ? 'suspended' : 'active';
                                      const updated = students.map(s => 
                                        s.id === student.id ? { ...s, status: nextStatus as any } : s
                                      );
                                      onUpdateStudents(updated);
                                      logAuditAction('STUDENT_STATUS_TOGGLED', `Changed student status of ${student.name} to ${nextStatus}`);
                                      alert(`Student status successfully changed to ${nextStatus.toUpperCase()}`);
                                    }}
                                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-colors ${
                                      student.status === 'active'
                                        ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                    }`}
                                  >
                                    {student.status === 'active' ? 'Suspend' : 'Activate'}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Audit view</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DEMOGRAPHIC ENROLMENT REPORT FOR REGISTRAR (PER DEPARTMENT / COURSE / MODULE / GENDER) */}
            {recordsSubTab === 'gender_reports' && (
              <div className="space-y-6">
                {/* Header card with landscape print & export buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase font-mono tracking-wider block">
                      Office of the Academic Registrar
                    </span>
                    <h2 className="text-xl font-black font-display text-slate-900 uppercase flex items-center gap-2 mt-0.5">
                      <BarChart3 className="w-5 h-5 text-indigo-600" />
                      Departmental & Gender Enrolment Report
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Official gender-segregated enrolment metrics and student roster filterable by Department, Program, Study Module, and Gender.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 print:hidden">
                    <button
                      onClick={exportDepartmentGenderCSV}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                      title="Export Filtered Demographic Data to Excel/CSV"
                    >
                      <Download className="w-4 h-4" />
                      Export Excel (CSV)
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print Landscape PDF
                    </button>
                  </div>
                </div>

                {/* Interactive Filter Toolbar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter by Department</label>
                    <select
                      value={genderReportDepartment}
                      onChange={(e) => {
                        setGenderReportDepartment(e.target.value);
                        setGenderReportCourse(''); // reset course selection when dept changes
                      }}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none"
                    >
                      <option value="">-- All Departments --</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter by Course Program</label>
                    <select
                      value={genderReportCourse}
                      onChange={(e) => setGenderReportCourse(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none"
                    >
                      <option value="">-- All Course Programs --</option>
                      {courses
                        .filter(c => !genderReportDepartment || c.departmentId === genderReportDepartment)
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter by Study Module / Year</label>
                    <select
                      value={genderReportModule}
                      onChange={(e) => setGenderReportModule(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none"
                    >
                      <option value="">-- All Modules / Years --</option>
                      <option value="1">Module I (Year 1)</option>
                      <option value="2">Module II (Year 2)</option>
                      <option value="3">Module III (Year 3)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter by Gender / Sex</label>
                    <select
                      value={genderReportGender}
                      onChange={(e) => setGenderReportGender(e.target.value as any)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-none"
                    >
                      <option value="all">-- All Genders (Male & Female) --</option>
                      <option value="Male">Male Candidates Only</option>
                      <option value="Female">Female Candidates Only</option>
                    </select>
                  </div>
                </div>

                {/* Filtered KPI Summary Bar */}
                {(() => {
                  const filteredList = students.filter(s => {
                    const c = courses.find(course => course.id === s.courseId);
                    if (genderReportDepartment && c?.departmentId !== genderReportDepartment && s.departmentId !== genderReportDepartment) return false;
                    if (genderReportCourse && s.courseId !== genderReportCourse) return false;
                    if (genderReportModule && String(s.yearOfStudy) !== genderReportModule) return false;
                    if (genderReportGender && genderReportGender !== 'all' && (s.gender || 'Male') !== genderReportGender) return false;
                    return true;
                  });

                  const total = filteredList.length;
                  const totalMale = filteredList.filter(s => (s.gender || 'Male') === 'Male').length;
                  const totalFemale = filteredList.filter(s => s.gender === 'Female').length;
                  const malePct = total > 0 ? ((totalMale / total) * 100).toFixed(1) : '0.0';
                  const femalePct = total > 0 ? ((totalFemale / total) * 100).toFixed(1) : '0.0';

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">Filtered Total Enrolment</span>
                        <p className="text-2xl font-black font-mono text-slate-900 mt-1">{total} Students</p>
                        <span className="text-[10px] font-semibold text-slate-400 mt-0.5 block">Active Roster Count</span>
                      </div>

                      <div className="bg-sky-50/60 p-4 rounded-2xl border border-sky-100 shadow-xs">
                        <span className="text-[10px] font-bold uppercase text-sky-600 tracking-wider block">Male Enroled Students</span>
                        <p className="text-2xl font-black font-mono text-sky-950 mt-1">{totalMale} ({malePct}%)</p>
                        <div className="w-full bg-sky-200 rounded-full h-1.5 mt-2">
                          <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: `${malePct}%` }} />
                        </div>
                      </div>

                      <div className="bg-pink-50/60 p-4 rounded-2xl border border-pink-100 shadow-xs">
                        <span className="text-[10px] font-bold uppercase text-pink-600 tracking-wider block">Female Enroled Students</span>
                        <p className="text-2xl font-black font-mono text-pink-950 mt-1">{totalFemale} ({femalePct}%)</p>
                        <div className="w-full bg-pink-200 rounded-full h-1.5 mt-2">
                          <div className="bg-pink-600 h-1.5 rounded-full" style={{ width: `${femalePct}%` }} />
                        </div>
                      </div>

                      <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 shadow-xs">
                        <span className="text-[10px] font-bold uppercase text-indigo-600 tracking-wider block">Gender Parity Index</span>
                        <p className="text-2xl font-black font-mono text-indigo-950 mt-1">
                          {totalMale > 0 ? (totalFemale / totalMale).toFixed(2) : '1.00'} GPI
                        </p>
                        <span className="text-[10px] font-semibold text-indigo-600/80 mt-0.5 block">Female to Male Ratio</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Section 1: Breakdown Matrix Per Program Per Module */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-slate-800">
                      I. Program & Module Summary Breakdown Matrix
                    </h3>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Print Orientation: LANDSCAPE
                    </span>
                  </div>

                  <table className="min-w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 bg-slate-100/70 font-mono font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Department & Program</th>
                        <th className="py-3 px-4 text-center">Module / Year</th>
                        <th className="py-3 px-4 text-center">Male Enrolment</th>
                        <th className="py-3 px-4 text-center">Female Enrolment</th>
                        <th className="py-3 px-4 text-center font-bold">Total Enrolment</th>
                        <th className="py-3 px-4 text-center">Gender Ratio Bar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {courses
                        .filter(c => !genderReportDepartment || c.departmentId === genderReportDepartment)
                        .filter(c => !genderReportCourse || c.id === genderReportCourse)
                        .flatMap(course => {
                          const deptObj = departments.find(d => d.id === course.departmentId);
                          const modules = [1, 2, 3];
                          return modules
                            .filter(mod => !genderReportModule || genderReportModule === String(mod))
                            .map(mod => {
                              const matchingStudents = students.filter(s => {
                                if (s.courseId !== course.id || s.yearOfStudy !== mod) return false;
                                if (genderReportGender && genderReportGender !== 'all' && (s.gender || 'Male') !== genderReportGender) return false;
                                return true;
                              });

                              const maleCount = matchingStudents.filter(s => (s.gender || 'Male') === 'Male').length;
                              const femaleCount = matchingStudents.filter(s => s.gender === 'Female').length;
                              const totalCount = matchingStudents.length;

                              const malePct = totalCount > 0 ? (maleCount / totalCount) * 100 : 0;
                              const femalePct = totalCount > 0 ? (femaleCount / totalCount) * 100 : 0;

                              return (
                                <tr key={`${course.id}_mod_${mod}`} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-3 px-4">
                                    <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">{deptObj?.name || 'Department'}</span>
                                    <span className="font-bold font-mono text-indigo-700 inline-block mr-1.5">{course.code}</span>
                                    <span className="text-slate-800 font-semibold text-[11px]">{course.name}</span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 font-mono font-bold rounded-lg text-[10px] inline-block border border-slate-200">
                                      Module {mod} (Yr {mod})
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center font-mono font-bold text-sky-700">
                                    {maleCount}
                                  </td>
                                  <td className="py-3 px-4 text-center font-mono font-bold text-pink-700">
                                    {femaleCount}
                                  </td>
                                  <td className="py-3 px-4 text-center font-mono font-black text-slate-900 bg-slate-50/50">
                                    {totalCount}
                                  </td>
                                  <td className="py-3 px-4">
                                    {totalCount > 0 ? (
                                      <div className="space-y-1 max-w-xs mx-auto">
                                        <div className="flex h-3 rounded-full overflow-hidden border border-slate-200">
                                          <div
                                            className="bg-sky-500 text-[8px] font-bold text-white flex items-center justify-center font-mono"
                                            style={{ width: `${malePct}%` }}
                                            title={`Male: ${maleCount} (${malePct.toFixed(0)}%)`}
                                          >
                                            {malePct >= 20 && `${malePct.toFixed(0)}%`}
                                          </div>
                                          <div
                                            className="bg-pink-500 text-[8px] font-bold text-white flex items-center justify-center font-mono"
                                            style={{ width: `${femalePct}%` }}
                                            title={`Female: ${femaleCount} (${femalePct.toFixed(0)}%)`}
                                          >
                                            {femalePct >= 20 && `${femalePct.toFixed(0)}%`}
                                          </div>
                                        </div>
                                        <div className="flex justify-between text-[9px] font-mono font-bold text-slate-400">
                                          <span className="text-sky-600">M: {malePct.toFixed(0)}%</span>
                                          <span className="text-pink-600">F: {femalePct.toFixed(0)}%</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 italic text-center block">No Enroled Candidates</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            });
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Section 2: Detailed Filtered Student Roster (Print / PDF ready) */}
                {(() => {
                  const filteredStudentsList = students.filter(s => {
                    const c = courses.find(course => course.id === s.courseId);
                    if (genderReportDepartment && c?.departmentId !== genderReportDepartment && s.departmentId !== genderReportDepartment) return false;
                    if (genderReportCourse && s.courseId !== genderReportCourse) return false;
                    if (genderReportModule && String(s.yearOfStudy) !== genderReportModule) return false;
                    if (genderReportGender && genderReportGender !== 'all' && (s.gender || 'Male') !== genderReportGender) return false;
                    return true;
                  });

                  return (
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-slate-800">
                            II. Official Student Demographic Roster ({filteredStudentsList.length} Records)
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Printed Report Details: Reg No, Index No, Gender, Department, Course, Module & Status</p>
                        </div>
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-[10px] font-bold rounded-lg">
                          Registrar Certified
                        </span>
                      </div>

                      <table className="min-w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 bg-slate-100/70 font-mono font-bold uppercase tracking-wider">
                            <th className="py-3 px-4">Reg Number</th>
                            <th className="py-3 px-4">Student Full Name</th>
                            <th className="py-3 px-4">Gender / Sex</th>
                            <th className="py-3 px-4">KCSE/KCPE Index No</th>
                            <th className="py-3 px-4">Department & Program</th>
                            <th className="py-3 px-4">Module / Year</th>
                            <th className="py-3 px-4">Sponsorship</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredStudentsList.length > 0 ? (
                            filteredStudentsList.map(s => {
                              const courseObj = courses.find(c => c.id === s.courseId);
                              const deptObj = departments.find(d => d.id === (courseObj?.departmentId || s.departmentId));
                              return (
                                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{s.regNumber}</td>
                                  <td className="py-3 px-4 font-bold text-slate-800">{s.name}</td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase ${
                                      (s.gender || 'Male') === 'Female' ? 'bg-pink-50 text-pink-700 border border-pink-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                                    }`}>
                                      {s.gender || 'Male'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 font-mono font-bold text-slate-600">{s.indexNumber || 'N/A'}</td>
                                  <td className="py-3 px-4">
                                    <span className="font-bold text-indigo-700 block">{courseObj?.code || s.courseId} — {courseObj?.name}</span>
                                    <span className="text-[10px] text-slate-400 block">{deptObj?.name}</span>
                                  </td>
                                  <td className="py-3 px-4 font-mono font-semibold text-slate-700">Module {s.yearOfStudy}, Sem {s.semester}</td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase ${
                                      s.sponsorType === 'government' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                                    }`}>
                                      {s.sponsorType}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                      s.status === 'active'
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                        : s.status === 'suspended'
                                        ? 'bg-red-50 text-red-600 border border-red-100'
                                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}>
                                      {s.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                                No student records found matching the active department, program, module, and gender filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* EXAMINATIONS SUB-MODULE */}
        {/* ========================================== */}
        {activeRole !== 'student' && activeModule === 'examinations' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs print:hidden">
              <div>
                <h2 className="text-lg font-black font-display text-slate-800 uppercase flex items-center gap-1.5">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  Academic Grading & Examination Desk
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Role-based grading operations, departmental verification, exams office release, and high-quality printed transcripts.</p>
              </div>
            </div>

            {/* Sub Tabs Selection Bar */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 max-w-fit print:hidden">
              {[
                { id: 'trainer_entry', label: 'Trainer Grade Entry', icon: BookOpen, roles: ['trainer', 'hod', 'principal', 'admin'] },
                { id: 'hod_verify', label: 'HOD Results Verification', icon: Building, roles: ['hod', 'principal', 'admin'], count: pendingHodUnits.length, badgeBg: 'bg-amber-500' },
                { id: 'exams_approve', label: 'Exams Officer Release Panel', icon: FileCheck, roles: ['examinations_officer', 'principal', 'admin'], count: pendingExamsUnits.length, badgeBg: 'bg-indigo-600' },
                { id: 'transcript_print', label: 'Print Official Transcript', icon: Printer, roles: ['registrar', 'examinations_officer', 'principal', 'admin'] }
              ]
                .filter(tab => tab.roles.includes(activeRole))
                .map(tab => {
                  const IsSelected = examSubTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setExamSubTab(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        IsSelected
                          ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-white/40'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-indigo-600" />
                      {tab.label}
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`px-1.5 py-0.2 ${tab.badgeBg || 'bg-indigo-600'} text-white rounded-full text-[9px] font-black font-mono ml-0.5 animate-pulse`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>

            {/* Content per sub-tab */}
            {/* TAB 1: TRAINER GRADE ENTRY */}
            {examSubTab === 'trainer_entry' && ['trainer', 'hod', 'principal', 'admin'].includes(activeRole) && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6 print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      Academic Unit Grade Entry
                    </h3>
                    <p className="text-[11px] text-slate-400">Select course program, target module, and subject unit to submit student scores. Scores are automatically graded into TVET classifications.</p>
                  </div>
                </div>

                {/* 3-Level Selectors: Course -> Module -> Subject Unit */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">1. Course Program</label>
                    <select
                      value={selectedExamCourseId}
                      onChange={(e) => {
                        setSelectedExamCourseId(e.target.value);
                        setSelectedExamModule('');
                        setSelectedExamUnitId('');
                      }}
                      className="w-full text-xs bg-white px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Choose Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">2. Course Module</label>
                    <select
                      value={selectedExamModule}
                      onChange={(e) => {
                        setSelectedExamModule(e.target.value);
                        setSelectedExamUnitId('');
                      }}
                      disabled={!selectedExamCourseId}
                      className="w-full text-xs bg-white px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">-- All Modules --</option>
                      {selectedExamCourseId && getModulesForCourse(selectedExamCourseId).map(mod => (
                        <option key={mod} value={mod}>{mod}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">3. Subject Unit</label>
                    <select
                      value={selectedExamUnitId}
                      onChange={(e) => setSelectedExamUnitId(e.target.value)}
                      className="w-full text-xs bg-white px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                      disabled={!selectedExamCourseId}
                    >
                      <option value="">-- Choose Unit --</option>
                      {units
                        .filter(u => {
                          if (selectedExamCourseId && u.courseId !== selectedExamCourseId) return false;
                          if (selectedExamModule) {
                            return isUnitInModule(u, selectedExamModule);
                          }
                          return true;
                        })
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.code}) {u.module ? `[${u.module}]` : ''}</option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Student Search Bar */}
                {selectedExamCourseId && selectedExamUnitId && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student by Name or Admission / Registration Number (e.g. Emmanuel or KTVC/DICT/2026J/001)..."
                        value={examStudentSearch}
                        onChange={(e) => setExamStudentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white text-xs border border-indigo-200/80 rounded-xl text-slate-800 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                    {examStudentSearch && (
                      <button
                        onClick={() => setExamStudentSearch('')}
                        className="text-xs font-bold text-slate-600 hover:text-red-600 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shrink-0 cursor-pointer shadow-2xs"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                )}

                {/* Students List for Grade Input */}
                {selectedExamCourseId && selectedExamUnitId ? (
                  <div className="space-y-4 pt-2">
                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table className="min-w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase tracking-wider font-bold">
                            <th className="py-3 px-4">Student Name / RegNo</th>
                            <th className="py-3 px-4 text-center">Enrolled Intake</th>
                            <th className="py-3 px-2 text-center w-24">CAT 1 (100)</th>
                            <th className="py-3 px-2 text-center w-24">CAT 2 (100)</th>
                            <th className="py-3 px-2 text-center w-28">End Term (100)</th>
                            <th className="py-3 px-2 text-center w-24">Final Average</th>
                            <th className="py-3 px-4 text-center">TVET Grade Classification</th>
                            <th className="py-3 px-4 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {students
                            .filter(s => s.courseId === selectedExamCourseId)
                            .filter(s => {
                              if (!examStudentSearch.trim()) return true;
                              const q = examStudentSearch.toLowerCase().trim();
                              return (
                                s.name.toLowerCase().includes(q) ||
                                s.regNumber.toLowerCase().includes(q) ||
                                (s.indexNumber && s.indexNumber.toLowerCase().includes(q))
                              );
                            })
                            .map(student => {
                              const c1Val = localCat1[student.id] || '';
                              const c2Val = localCat2[student.id] || '';
                              const etVal = localEndTerm[student.id] || '';

                              const c1 = parseFloat(c1Val);
                              const c2 = parseFloat(c2Val);
                              const et = parseFloat(etVal);

                              let total = 0;
                              let count = 0;
                              if (c1Val !== '' && !isNaN(c1)) { total += c1; count++; }
                              if (c2Val !== '' && !isNaN(c2)) { total += c2; count++; }
                              if (etVal !== '' && !isNaN(et)) { total += et; count++; }

                              const scoreNum = count > 0 ? Math.round(total / count) : NaN;
                              const tvetInfo = getTvetClassification(scoreNum);
                              const markInDb = examMarks.find(m => m.studentId === student.id && m.unitId === selectedExamUnitId);

                              return (
                                <tr key={student.id} className="hover:bg-slate-50/50">
                                  <td className="py-3 px-4">
                                    <div className="font-bold text-slate-800">{student.name}</div>
                                    <div className="text-[10px] text-indigo-600 font-mono mt-0.5">{student.regNumber}</div>
                                  </td>
                                  <td className="py-3 px-4 text-center text-slate-500 font-mono font-medium">
                                    {student.intake === 'M' ? 'May Intake' : student.intake === 'S' ? 'Sept Intake' : 'Jan Intake'}
                                  </td>
                                  <td className="py-3 px-2">
                                    <div className="flex items-center justify-center">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="--"
                                        value={c1Val}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                                            setLocalCat1(prev => ({ ...prev, [student.id]: val }));
                                          }
                                        }}
                                        disabled={markInDb?.verifiedByHod || markInDb?.approvedByExamsOfficer}
                                        className="w-16 text-center font-mono font-bold bg-white border border-slate-200 px-1 py-1 rounded-lg text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                      />
                                    </div>
                                  </td>
                                  <td className="py-3 px-2">
                                    <div className="flex items-center justify-center">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="--"
                                        value={c2Val}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                                            setLocalCat2(prev => ({ ...prev, [student.id]: val }));
                                          }
                                        }}
                                        disabled={markInDb?.verifiedByHod || markInDb?.approvedByExamsOfficer}
                                        className="w-16 text-center font-mono font-bold bg-white border border-slate-200 px-1 py-1 rounded-lg text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                      />
                                    </div>
                                  </td>
                                  <td className="py-3 px-2">
                                    <div className="flex items-center justify-center">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        placeholder="--"
                                        value={etVal}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                                            setLocalEndTerm(prev => ({ ...prev, [student.id]: val }));
                                          }
                                        }}
                                        disabled={markInDb?.verifiedByHod || markInDb?.approvedByExamsOfficer}
                                        className="w-20 text-center font-mono font-bold bg-white border border-slate-200 px-1.5 py-1 rounded-lg text-slate-800 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                                      />
                                    </div>
                                  </td>
                                  <td className="py-3 px-2 text-center font-mono font-black text-slate-800 bg-slate-50/50">
                                    {!isNaN(scoreNum) ? `${scoreNum}%` : '--'}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold border ${tvetInfo.color}`}>
                                      {tvetInfo.grade} — {tvetInfo.label}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    {markInDb?.amendedByExamsOfficer ? (
                                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 rounded-md text-[9px] font-bold uppercase tracking-wider font-mono">✓ Amended & Released</span>
                                    ) : markInDb?.approvedByExamsOfficer ? (
                                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[9px] font-bold uppercase tracking-wider font-mono">✓ Approved & Released</span>
                                    ) : markInDb?.verifiedByHod ? (
                                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[9px] font-bold uppercase tracking-wider font-mono">✓ HOD Verified</span>
                                    ) : count > 0 ? (
                                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[9px] font-bold uppercase font-mono">Drafted</span>
                                    ) : (
                                      <span className="px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-[9px] font-bold uppercase font-mono">Unsubmitted</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="text-[11px] text-slate-400">
                        * Fields are disabled once results are verified by the HOD or released by the Exams Officer.
                      </div>
                      <button
                        onClick={handleSaveMarks}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-100 cursor-pointer flex items-center gap-1.5"
                      >
                        <Send className="w-4 h-4" />
                        {activeRole === 'hod' ? 'Save & Endorse Marks' : 'Save & Submit Marks to HOD'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Please select a Course Program and Academic Subject Unit above to record scores.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HOD RESULTS VERIFICATION */}
            {examSubTab === 'hod_verify' && ['hod', 'principal', 'admin'].includes(activeRole) && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6 print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1">
                      <Building className="w-4 h-4 text-indigo-600" />
                      Departmental Results Verification
                    </h3>
                    <p className="text-[11px] text-slate-400">Review, endorse, and sign off departmental examination drafts. Verified results are locked and forwarded to the Examinations Officer.</p>
                  </div>
                </div>

                {/* Automatic Notification Alert Banner for HOD */}
                {pendingHodUnits.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500 text-white rounded-xl font-bold text-xs shrink-0 animate-pulse">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-amber-950 uppercase font-mono tracking-wider flex items-center gap-2">
                          Action Required: {pendingHodUnits.length} Subject Unit(s) Awaiting Endorsement
                        </h4>
                        <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                          Trainers have submitted marks for subject units in your department that require your official verification.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {pendingHodUnits.slice(0, 3).map(u => {
                        const c = courses.find(course => course.id === u.courseId);
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setSelectedExamCourseId(u.courseId);
                              setSelectedExamUnitId(u.id);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer shadow-2xs"
                          >
                            Review {u.code} ({c?.code || ''}) →
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3-Level Selectors: Course -> Module -> Subject Unit */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">1. Course Program</label>
                    <select
                      value={selectedExamCourseId}
                      onChange={(e) => {
                        setSelectedExamCourseId(e.target.value);
                        setSelectedExamModule('');
                        setSelectedExamUnitId('');
                      }}
                      className="w-full text-xs bg-white px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Choose Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">2. Course Module</label>
                    <select
                      value={selectedExamModule}
                      onChange={(e) => {
                        setSelectedExamModule(e.target.value);
                        setSelectedExamUnitId('');
                      }}
                      disabled={!selectedExamCourseId}
                      className="w-full text-xs bg-white px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">-- All Modules --</option>
                      {selectedExamCourseId && getModulesForCourse(selectedExamCourseId).map(mod => (
                        <option key={mod} value={mod}>{mod}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5 font-mono">3. Select Subject Unit</label>
                    <select
                      value={selectedExamUnitId}
                      onChange={(e) => setSelectedExamUnitId(e.target.value)}
                      className="w-full text-xs bg-white px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:outline-none cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                      disabled={!selectedExamCourseId}
                    >
                      <option value="">-- Choose Unit --</option>
                      {units
                        .filter(u => {
                          if (selectedExamCourseId && u.courseId !== selectedExamCourseId) return false;
                          if (selectedExamModule) {
                            return isUnitInModule(u, selectedExamModule);
                          }
                          return true;
                        })
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.code}) {u.module ? `[${u.module}]` : ''}</option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Student Search Bar for HOD */}
                {selectedExamCourseId && selectedExamUnitId && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-amber-50/40 p-3.5 rounded-2xl border border-amber-100">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-amber-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student by Name or Admission / Registration Number..."
                        value={examStudentSearch}
                        onChange={(e) => setExamStudentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white text-xs border border-amber-200/80 rounded-xl text-slate-800 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    {examStudentSearch && (
                      <button
                        onClick={() => setExamStudentSearch('')}
                        className="text-xs font-bold text-slate-600 hover:text-red-600 px-3 py-1.5 bg-white border border-slate-200 rounded-xl shrink-0 cursor-pointer shadow-2xs"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                )}

                {selectedExamCourseId && selectedExamUnitId ? (
                  (() => {
                    const filteredMarks = examMarks.filter(m => m.unitId === selectedExamUnitId);
                    const isAllVerified = filteredMarks.length > 0 && filteredMarks.every(m => m.verifiedByHod);
                    
                    const handleVerifyAll = () => {
                      if (filteredMarks.length === 0) {
                        alert("No marks have been recorded yet for this unit by the trainer.");
                        return;
                      }
                      const updated = examMarks.map(m => {
                        if (m.unitId === selectedExamUnitId) {
                          return { ...m, verifiedByHod: true };
                        }
                        return m;
                      });
                      onUpdateExamMarks(updated);
                      logAuditAction('HOD_VERIFIED_MARKS', `HOD verified and signed off marks for Unit ID ${selectedExamUnitId}`);
                      alert("Departmental results successfully verified, signed, and submitted to the Examinations Desk!");
                    };

                    return (
                      <div className="space-y-4 pt-2">
                        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                          <table className="min-w-full text-xs text-left">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase tracking-wider font-bold">
                                <th className="py-3 px-4">Student Name / RegNo</th>
                                <th className="py-3 px-2 text-center">CAT 1</th>
                                <th className="py-3 px-2 text-center">CAT 2</th>
                                <th className="py-3 px-2 text-center">End Term</th>
                                <th className="py-3 px-2 text-center bg-slate-100/50">Final Average</th>
                                <th className="py-3 px-4 text-center">Grade</th>
                                <th className="py-3 px-4 text-center">HOD Endorsement Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {students
                                .filter(s => s.courseId === selectedExamCourseId)
                                .filter(s => {
                                  if (!examStudentSearch.trim()) return true;
                                  const q = examStudentSearch.toLowerCase().trim();
                                  return (
                                    s.name.toLowerCase().includes(q) ||
                                    s.regNumber.toLowerCase().includes(q) ||
                                    (s.indexNumber && s.indexNumber.toLowerCase().includes(q))
                                  );
                                })
                                .map(student => {
                                  const mark = examMarks.find(m => m.studentId === student.id && m.unitId === selectedExamUnitId);
                                  return (
                                    <tr key={student.id} className="hover:bg-slate-50/50">
                                      <td className="py-3 px-4">
                                        <div className="font-bold text-slate-800">{student.name}</div>
                                        <div className="text-[10px] text-indigo-600 font-mono mt-0.5">{student.regNumber}</div>
                                      </td>
                                      <td className="py-3 px-2 text-center font-mono text-slate-600">
                                        {mark && mark.cat1 !== undefined ? `${mark.cat1}%` : '--'}
                                      </td>
                                      <td className="py-3 px-2 text-center font-mono text-slate-600">
                                        {mark && mark.cat2 !== undefined ? `${mark.cat2}%` : '--'}
                                      </td>
                                      <td className="py-3 px-2 text-center font-mono text-slate-600">
                                        {mark && mark.endTerm !== undefined ? `${mark.endTerm}%` : '--'}
                                      </td>
                                      <td className="py-3 px-2 text-center font-mono font-black text-slate-800 bg-slate-50/50">
                                        {mark ? `${mark.score || mark.marksObtained || 0}%` : '--'}
                                      </td>
                                      <td className="py-3 px-4 text-center font-mono font-bold text-indigo-600">
                                        {mark ? mark.grade : '--'}
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        {mark?.verifiedByHod ? (
                                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono inline-flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                            Verified by HOD
                                          </span>
                                        ) : mark ? (
                                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[9px] font-bold uppercase tracking-wider font-mono inline-flex items-center gap-1">
                                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                            Awaiting Verification
                                          </span>
                                        ) : (
                                          <span className="text-[10px] text-slate-400 italic">No score registered</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                          <div className="text-xs text-slate-500 font-medium">
                            {isAllVerified ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4" />
                                Departmental Endorsement active for this module.
                              </span>
                            ) : (
                              <span className="text-amber-600 font-bold flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4" />
                                Subject requires departmental review and seal.
                              </span>
                            )}
                          </div>
                          {!isAllVerified && filteredMarks.length > 0 && (
                            <button
                              onClick={handleVerifyAll}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-100 cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Endorse & Verify Subject Results
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                    <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Please select a Course Program and Subject Unit above to verify departmental entries.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: EXAMS OFFICER APPROVAL & AMENDMENT PANEL */}
            {examSubTab === 'exams_approve' && ['examinations_officer', 'principal', 'admin'].includes(activeRole) && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6 print:hidden">
                {/* Header with Title & Stats Overview */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5 font-mono">
                      <FileCheck className="w-4 h-4 text-indigo-600" />
                      Examinations Officer Results Clearance & Amendment Portal
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Filter and view all students per Department, Course, and Module. Verify, amend marks with audit tracking, and authorize official release to student ledgers.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                      <button
                        onClick={() => setExamsViewMode('master_students')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          examsViewMode === 'master_students'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        Students Master Ledger
                      </button>
                      <button
                        onClick={() => setExamsViewMode('units_clearance')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          examsViewMode === 'units_clearance'
                            ? 'bg-white text-indigo-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Subject Units Clearance
                      </button>
                    </div>
                  </div>
                </div>

                {/* KPI Metrics Strip */}
                {(() => {
                  const totalExamStudents = students.length;
                  const totalRecordedMarks = examMarks.length;
                  const totalHodVerified = examMarks.filter(m => m.verifiedByHod).length;
                  const totalApproved = examMarks.filter(m => m.approvedByExamsOfficer).length;
                  const totalAmended = examMarks.filter(m => m.amendedByExamsOfficer).length;
                  const pendingReleaseCount = examMarks.filter(m => m.verifiedByHod && !m.approvedByExamsOfficer).length;

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                        <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Total Students</div>
                        <div className="text-lg font-black text-slate-800 font-mono mt-0.5">{totalExamStudents}</div>
                        <div className="text-[10px] text-slate-500 font-medium">All departments</div>
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                        <div className="text-[10px] font-bold uppercase text-slate-400 font-mono">Marks Tracked</div>
                        <div className="text-lg font-black text-slate-800 font-mono mt-0.5">{totalRecordedMarks}</div>
                        <div className="text-[10px] text-slate-500 font-medium">Total submissions</div>
                      </div>
                      <div className="p-3 bg-amber-50/60 border border-amber-200/70 rounded-2xl">
                        <div className="text-[10px] font-bold uppercase text-amber-700 font-mono">HOD Certified</div>
                        <div className="text-lg font-black text-amber-900 font-mono mt-0.5">{totalHodVerified}</div>
                        <div className="text-[10px] text-amber-700 font-medium">Dept endorsed</div>
                      </div>
                      <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl">
                        <div className="text-[10px] font-bold uppercase text-indigo-700 font-mono">Pending Release</div>
                        <div className="text-lg font-black text-indigo-900 font-mono mt-0.5">{pendingReleaseCount}</div>
                        <div className="text-[10px] text-indigo-700 font-medium">Awaiting exams signoff</div>
                      </div>
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
                        <div className="text-[10px] font-bold uppercase text-emerald-700 font-mono">Officially Released</div>
                        <div className="text-lg font-black text-emerald-900 font-mono mt-0.5">{totalApproved}</div>
                        <div className="text-[10px] text-emerald-700 font-medium">Active in portals</div>
                      </div>
                      <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl">
                        <div className="text-[10px] font-bold uppercase text-purple-700 font-mono">Amended Marks</div>
                        <div className="text-lg font-black text-purple-900 font-mono mt-0.5">{totalAmended}</div>
                        <div className="text-[10px] text-purple-700 font-medium">Audit recorded</div>
                      </div>
                    </div>
                  );
                })()}

                {/* Automatic Notification Alert Banner for Pending Release */}
                {pendingExamsUnits.length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-200/80 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shrink-0 animate-pulse">
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-indigo-950 uppercase font-mono tracking-wider flex items-center gap-2">
                          Action Required: {pendingExamsUnits.length} HOD-Verified Unit(s) Pending Release
                        </h4>
                        <p className="text-[11px] text-indigo-800 font-medium mt-0.5">
                          Departmental HODs have signed off results for these units. You can review, amend any anomalies, or authorize immediate release.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const updated = examMarks.map(m => {
                          if (pendingExamsUnits.some(pu => pu.id === m.unitId)) {
                            return { ...m, approvedByExamsOfficer: true };
                          }
                          return m;
                        });
                        onUpdateExamMarks(updated);
                        logAuditAction('EXAMS_RELEASED_ALL_PENDING', `Released all ${pendingExamsUnits.length} pending verified units`);
                        alert(`Successfully approved and released all ${pendingExamsUnits.length} pending subject results to student ledgers!`);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Approve & Release All Pending ({pendingExamsUnits.length})
                    </button>
                  </div>
                )}

                {/* Comprehensive Multi-Filter Bar: Department -> Course -> Module -> Unit -> Status */}
                <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-500 font-mono flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-indigo-600" />
                      Filter Students & Academic Results
                    </span>
                    {(examsFilterDept || examsFilterCourse || examsFilterModule || examsFilterUnitId || examsFilterStatus !== 'all' || examStudentSearch) && (
                      <button
                        onClick={() => {
                          setExamsFilterDept('');
                          setExamsFilterCourse('');
                          setExamsFilterModule('');
                          setExamsFilterUnitId('');
                          setExamsFilterStatus('all');
                          setExamStudentSearch('');
                        }}
                        className="text-[11px] font-bold text-slate-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reset All Filters
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* Filter 1: Department */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-mono">1. Department</label>
                      <select
                        value={examsFilterDept}
                        onChange={(e) => {
                          setExamsFilterDept(e.target.value);
                          setExamsFilterCourse('');
                          setExamsFilterModule('');
                          setExamsFilterUnitId('');
                        }}
                        className="w-full text-xs bg-white px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- All Departments --</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Filter 2: Course */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-mono">2. Course Program</label>
                      <select
                        value={examsFilterCourse}
                        onChange={(e) => {
                          setExamsFilterCourse(e.target.value);
                          setExamsFilterModule('');
                          setExamsFilterUnitId('');
                        }}
                        className="w-full text-xs bg-white px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- All Courses --</option>
                        {courses
                          .filter(c => !examsFilterDept || c.departmentId === examsFilterDept)
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                          ))}
                      </select>
                    </div>

                    {/* Filter 3: Module */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-mono">3. Module</label>
                      <select
                        value={examsFilterModule}
                        onChange={(e) => {
                          setExamsFilterModule(e.target.value);
                          setExamsFilterUnitId('');
                        }}
                        className="w-full text-xs bg-white px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- All Modules --</option>
                        {examsFilterCourse ? (
                          getModulesForCourse(examsFilterCourse).map(mod => (
                            <option key={mod} value={mod}>{mod}</option>
                          ))
                        ) : (
                          // If course not chosen, show all distinct modules found in scheduling DB
                          Array.from(new Set(units.map(u => u.module).filter(Boolean))).map(mod => (
                            <option key={mod as string} value={mod as string}>{mod as string}</option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Filter 4: Subject Unit */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-mono">4. Subject Unit</label>
                      <select
                        value={examsFilterUnitId}
                        onChange={(e) => setExamsFilterUnitId(e.target.value)}
                        className="w-full text-xs bg-white px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- All Subject Units --</option>
                        {units
                          .filter(u => {
                            if (examsFilterDept) {
                              const crs = courses.find(c => c.id === u.courseId);
                              if (crs && crs.departmentId !== examsFilterDept) return false;
                            }
                            if (examsFilterCourse && u.courseId !== examsFilterCourse) return false;
                            if (examsFilterModule && !isUnitInModule(u, examsFilterModule)) return false;
                            return true;
                          })
                          .map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                          ))}
                      </select>
                    </div>

                    {/* Filter 5: Clearance Status */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-mono">5. Status Filter</label>
                      <select
                        value={examsFilterStatus}
                        onChange={(e) => setExamsFilterStatus(e.target.value as any)}
                        className="w-full text-xs bg-white px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:outline-none cursor-pointer"
                      >
                        <option value="all">All Statuses</option>
                        <option value="pending_release">Pending Release (HOD Verified)</option>
                        <option value="released">Officially Released</option>
                        <option value="pending_hod">Awaiting HOD</option>
                        <option value="amended">Amended by Exams Office</option>
                      </select>
                    </div>
                  </div>

                  {/* Search Bar & Batch Action Row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search student by Name, Reg Number, Index No, or Unit Name/Code..."
                        value={examStudentSearch}
                        onChange={(e) => setExamStudentSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-xl text-slate-800 font-bold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleReleaseFilteredBatch}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-100 cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Release All Filtered Verified Marks
                      </button>
                    </div>
                  </div>
                </div>

                {/* VIEW 1: STUDENTS MASTER LEDGER */}
                {examsViewMode === 'master_students' && (
                  <div className="space-y-4">
                    {(() => {
                      const filteredStudents = students.filter(student => {
                        if (examsFilterDept) {
                          const crs = courses.find(c => c.id === student.courseId);
                          if (!crs || crs.departmentId !== examsFilterDept) return false;
                        }
                        if (examsFilterCourse && student.courseId !== examsFilterCourse) return false;
                        if (examsFilterModule) {
                          // Match student module
                          if (student.module && student.module !== examsFilterModule && !student.module.includes(examsFilterModule)) {
                            // Check if student has marks in this module or courseGroup
                            const hasMarksInModule = examMarks.some(m => {
                              if (m.studentId !== student.id) return false;
                              const uObj = units.find(u => u.id === m.unitId);
                              return uObj && isUnitInModule(uObj, examsFilterModule);
                            });
                            if (!hasMarksInModule) return false;
                          }
                        }
                        if (examsFilterUnitId) {
                          const hasMarkInUnit = examMarks.some(m => m.studentId === student.id && m.unitId === examsFilterUnitId);
                          if (!hasMarkInUnit) return false;
                        }
                        if (examsFilterStatus !== 'all') {
                          const stMarks = examMarks.filter(m => m.studentId === student.id);
                          if (examsFilterStatus === 'pending_release' && !stMarks.some(m => m.verifiedByHod && !m.approvedByExamsOfficer)) return false;
                          if (examsFilterStatus === 'released' && !stMarks.some(m => m.approvedByExamsOfficer)) return false;
                          if (examsFilterStatus === 'pending_hod' && !stMarks.some(m => !m.verifiedByHod)) return false;
                          if (examsFilterStatus === 'amended' && !stMarks.some(m => m.amendedByExamsOfficer)) return false;
                        }
                        if (examStudentSearch.trim()) {
                          const q = examStudentSearch.toLowerCase().trim();
                          const matchesName = student.name.toLowerCase().includes(q);
                          const matchesReg = student.regNumber.toLowerCase().includes(q);
                          const matchesIdx = student.indexNumber ? student.indexNumber.toLowerCase().includes(q) : false;
                          const matchesUnit = examMarks.some(m => {
                            if (m.studentId !== student.id) return false;
                            const u = units.find(un => un.id === m.unitId);
                            return u && (u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q));
                          });
                          if (!matchesName && !matchesReg && !matchesIdx && !matchesUnit) return false;
                        }
                        return true;
                      });

                      if (filteredStudents.length === 0) {
                        return (
                          <div className="text-center py-12 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl">
                            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 font-bold">No students match the selected department, course, module, or search filters.</p>
                            <p className="text-[11px] text-slate-400 mt-1">Try broadening your search or resetting active filters above.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs text-slate-500 font-mono font-bold px-1">
                            <span>Showing {filteredStudents.length} student(s) in Master Ledger</span>
                            <span>Click on any student row or arrow to expand subject unit breakdown & amend marks</span>
                          </div>

                          <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
                            <table className="min-w-full text-xs text-left">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase tracking-wider font-bold">
                                  <th className="py-3.5 px-4">Student Name & RegNo</th>
                                  <th className="py-3.5 px-4">Department & Course</th>
                                  <th className="py-3.5 px-3 text-center">Module / Level</th>
                                  <th className="py-3.5 px-3 text-center">Units Recorded</th>
                                  <th className="py-3.5 px-3 text-center">Overall Average</th>
                                  <th className="py-3.5 px-3 text-center">TVET Classification</th>
                                  <th className="py-3.5 px-3 text-center">Clearance Status</th>
                                  <th className="py-3.5 px-4 text-right">Exams Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map(student => {
                                  const crs = courses.find(c => c.id === student.courseId);
                                  const dept = departments.find(d => d.id === crs?.departmentId);
                                  const studentMarks = examMarks.filter(m => m.studentId === student.id);
                                  
                                  // Compute overall weighted / cumulative average
                                  const validMarks = studentMarks.filter(m => m.score !== undefined || m.marksObtained !== undefined);
                                  const avgScore = validMarks.length > 0
                                    ? Math.round(validMarks.reduce((acc, m) => acc + (m.score || m.marksObtained || 0), 0) / validMarks.length)
                                    : NaN;
                                  const tvetInfo = getTvetClassification(avgScore);

                                  const isExpanded = expandedStudentId === student.id;
                                  const allReleased = studentMarks.length > 0 && studentMarks.every(m => m.approvedByExamsOfficer);
                                  const somePendingRelease = studentMarks.some(m => m.verifiedByHod && !m.approvedByExamsOfficer);
                                  const hasAmended = studentMarks.some(m => m.amendedByExamsOfficer);

                                  return (
                                    <React.Fragment key={student.id}>
                                      <tr
                                        className={`hover:bg-slate-50/70 transition-colors ${
                                          isExpanded ? 'bg-indigo-50/30' : ''
                                        }`}
                                      >
                                        <td className="py-3.5 px-4">
                                          <div className="flex items-center gap-2.5">
                                            <button
                                              onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                              title={isExpanded ? 'Collapse' : 'Expand units'}
                                            >
                                              {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                            <div>
                                              <div className="font-black text-slate-800 flex items-center gap-1.5">
                                                {student.name}
                                                {hasAmended && (
                                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[9px] font-mono font-bold rounded-md" title="Contains amended grades">
                                                    Amended
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-[10px] text-indigo-600 font-mono mt-0.5 font-bold">
                                                {student.regNumber} {student.indexNumber ? `• Index: ${student.indexNumber}` : ''}
                                              </div>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                          <div className="font-bold text-slate-800">{crs?.name || 'Unassigned Course'}</div>
                                          <div className="text-[10px] text-slate-400 font-medium">{dept?.name || 'General'}</div>
                                        </td>
                                        <td className="py-3.5 px-3 text-center">
                                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold font-mono">
                                            {student.module || (student.yearOfStudy ? `Module ${student.yearOfStudy}` : 'Module I')}
                                          </span>
                                        </td>
                                        <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                                          {studentMarks.length} Unit(s)
                                        </td>
                                        <td className="py-3.5 px-3 text-center font-mono font-black text-slate-800">
                                          {!isNaN(avgScore) ? `${avgScore}%` : '--'}
                                        </td>
                                        <td className="py-3.5 px-3 text-center">
                                          <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold border ${tvetInfo.color}`}>
                                            {tvetInfo.grade} — {tvetInfo.label}
                                          </span>
                                        </td>
                                        <td className="py-3.5 px-3 text-center">
                                          {allReleased ? (
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-bold uppercase font-mono">
                                              Released ({studentMarks.length})
                                            </span>
                                          ) : somePendingRelease ? (
                                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[9px] font-bold uppercase font-mono animate-pulse">
                                              Ready for Release
                                            </span>
                                          ) : studentMarks.length > 0 ? (
                                            <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[9px] font-bold uppercase font-mono">
                                              Awaiting HOD
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-[9px] font-bold font-mono">
                                              No Entries
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                            {/* Expand breakdown button */}
                                            <button
                                              onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                              title="View & Amend Units"
                                            >
                                              <Eye className="w-3 h-3 text-slate-500" />
                                              {isExpanded ? 'Hide' : 'Units'}
                                            </button>

                                            {/* Release / Retract button */}
                                            {allReleased ? (
                                              <button
                                                onClick={() => handleRetractStudentAllMarks(student.id)}
                                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                                title="Retract release back to draft for further moderation"
                                              >
                                                Retract
                                              </button>
                                            ) : (
                                              <button
                                                onClick={() => handleReleaseStudentAllMarks(student.id)}
                                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                                title="Release all verified marks for this student"
                                              >
                                                <CheckCircle2 className="w-3 h-3" />
                                                Release
                                              </button>
                                            )}
                                          </div>
                                        </td>
                                      </tr>

                                      {/* EXPANDED ACCORDION: FULL UNITS BREAKDOWN & AMENDMENTS */}
                                      {isExpanded && (
                                        <tr>
                                          <td colSpan={8} className="p-0 bg-slate-50/70 border-b border-indigo-100">
                                            <div className="p-4 sm:p-5 space-y-3">
                                              <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-black text-slate-800 font-mono uppercase tracking-wider flex items-center gap-1.5">
                                                  <BookOpen className="w-4 h-4 text-indigo-600" />
                                                  Registered Subject Units & Grade Ledger for {student.name}
                                                </h4>
                                                <span className="text-[10px] text-slate-500 font-mono font-medium">
                                                  Registration Number: <strong>{student.regNumber}</strong>
                                                </span>
                                              </div>

                                              {studentMarks.length === 0 ? (
                                                <div className="text-center py-6 bg-white rounded-xl border border-dashed border-slate-200">
                                                  <p className="text-xs text-slate-400 italic">No examination marks have been submitted for this student yet.</p>
                                                </div>
                                              ) : (
                                                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-2xs">
                                                  <table className="min-w-full text-xs text-left">
                                                    <thead>
                                                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-mono uppercase tracking-wider text-[10px] font-bold">
                                                        <th className="py-2.5 px-3">Subject Unit</th>
                                                        <th className="py-2.5 px-2 text-center">Module</th>
                                                        <th className="py-2.5 px-2 text-center">CAT 1 (100)</th>
                                                        <th className="py-2.5 px-2 text-center">CAT 2 (100)</th>
                                                        <th className="py-2.5 px-2 text-center">End Term (100)</th>
                                                        <th className="py-2.5 px-2 text-center bg-slate-50 font-black">Total %</th>
                                                        <th className="py-2.5 px-3 text-center">TVET Grade</th>
                                                        <th className="py-2.5 px-3 text-center">HOD Verified</th>
                                                        <th className="py-2.5 px-3 text-center">Exams Release</th>
                                                        <th className="py-2.5 px-3 text-right">Amend & Clear</th>
                                                      </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                      {studentMarks.map(mark => {
                                                        const uObj = units.find(u => u.id === mark.unitId);
                                                        const scoreVal = mark.score !== undefined ? mark.score : mark.marksObtained;
                                                        const tvetClass = getTvetClassification(scoreVal);

                                                        return (
                                                          <tr key={mark.id || mark.unitId} className="hover:bg-slate-50/50">
                                                            <td className="py-2.5 px-3">
                                                              <div className="font-bold text-slate-800">{uObj?.name || 'Unknown Unit'}</div>
                                                              <div className="text-[10px] text-slate-400 font-mono">Code: {uObj?.code || '--'}</div>
                                                              {mark.amendedByExamsOfficer && (
                                                                <div className="mt-1 p-1.5 bg-purple-50 border border-purple-200 rounded-md text-[9px] text-purple-900 font-mono">
                                                                  <strong>Amended:</strong> {mark.amendmentReason || 'Senate moderation'}
                                                                  {mark.amendedAt && ` (${new Date(mark.amendedAt).toLocaleDateString()})`}
                                                                </div>
                                                              )}
                                                            </td>
                                                            <td className="py-2.5 px-2 text-center font-mono text-slate-600">
                                                              {uObj?.module || '--'}
                                                            </td>
                                                            <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">
                                                              {mark.cat1 !== undefined ? `${mark.cat1}%` : '--'}
                                                            </td>
                                                            <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">
                                                              {mark.cat2 !== undefined ? `${mark.cat2}%` : '--'}
                                                            </td>
                                                            <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700">
                                                              {mark.endTerm !== undefined ? `${mark.endTerm}%` : '--'}
                                                            </td>
                                                            <td className="py-2.5 px-2 text-center font-mono font-black text-slate-900 bg-slate-50">
                                                              {scoreVal !== undefined ? `${scoreVal}%` : '--'}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-center">
                                                              <span className={`px-2 py-0.5 rounded-md font-mono text-[9px] font-bold border ${tvetClass.color}`}>
                                                                {tvetClass.grade} — {tvetClass.label}
                                                              </span>
                                                            </td>
                                                            <td className="py-2.5 px-3 text-center">
                                                              {mark.verifiedByHod ? (
                                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[9px] font-bold font-mono">
                                                                  ✓ Endorsed
                                                                </span>
                                                             ) : (
                                                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[9px] font-bold font-mono">
                                                                  Pending
                                                                </span>
                                                             )}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-center">
                                                              {mark.approvedByExamsOfficer ? (
                                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[9px] font-bold font-mono">
                                                                  ✓ Released
                                                                </span>
                                                              ) : (
                                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-bold font-mono">
                                                                  Unreleased
                                                                </span>
                                                              )}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right">
                                                              <div className="flex items-center justify-end gap-1.5">
                                                                {/* Amend Result Button */}
                                                                <button
                                                                  onClick={() => {
                                                                    const targetUnit = uObj || units.find(u => u.id === mark.unitId);
                                                                    if (targetUnit) {
                                                                      handleOpenAmendModal(student, targetUnit, mark);
                                                                    }
                                                                  }}
                                                                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                                                  title="Amend mark before official release"
                                                                >
                                                                  <Edit3 className="w-3 h-3 text-purple-600" />
                                                                  Amend Mark
                                                                </button>

                                                                {/* Individual Unit Release Toggle */}
                                                                {mark.approvedByExamsOfficer ? (
                                                                  <button
                                                                    onClick={() => {
                                                                      const updated = examMarks.map(m =>
                                                                        m.id === mark.id || (m.studentId === mark.studentId && m.unitId === mark.unitId)
                                                                          ? { ...m, approvedByExamsOfficer: false }
                                                                          : m
                                                                      );
                                                                      onUpdateExamMarks(updated);
                                                                      logAuditAction('EXAMS_RETRACTED_UNIT', `Retracted release of unit ${uObj?.name} for ${student.name}`);
                                                                    }}
                                                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                                                  >
                                                                    Retract
                                                                  </button>
                                                                ) : (
                                                                  <button
                                                                    onClick={() => {
                                                                      const updated = examMarks.map(m =>
                                                                        m.id === mark.id || (m.studentId === mark.studentId && m.unitId === mark.unitId)
                                                                          ? { ...m, approvedByExamsOfficer: true }
                                                                          : m
                                                                      );
                                                                      onUpdateExamMarks(updated);
                                                                      logAuditAction('EXAMS_RELEASED_UNIT', `Approved & released unit ${uObj?.name} for ${student.name}`);
                                                                    }}
                                                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                                                                  >
                                                                    Release
                                                                  </button>
                                                                )}
                                                              </div>
                                                            </td>
                                                          </tr>
                                                        );
                                                      })}
                                                    </tbody>
                                                  </table>
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* VIEW 2: SUBJECT UNITS CLEARANCE */}
                {examsViewMode === 'units_clearance' && (
                  <div className="space-y-4">
                    {(() => {
                      const filteredUnits = units.filter(unit => {
                        if (examsFilterDept) {
                          const crs = courses.find(c => c.id === unit.courseId);
                          if (!crs || crs.departmentId !== examsFilterDept) return false;
                        }
                        if (examsFilterCourse && unit.courseId !== examsFilterCourse) return false;
                        if (examsFilterModule && !isUnitInModule(unit, examsFilterModule)) return false;
                        if (examsFilterUnitId && unit.id !== examsFilterUnitId) return false;

                        if (examStudentSearch.trim()) {
                          const q = examStudentSearch.toLowerCase().trim();
                          const cObj = courses.find(c => c.id === unit.courseId);
                          const matchesUnit = unit.name.toLowerCase().includes(q) || unit.code.toLowerCase().includes(q);
                          const matchesCourse = cObj && (cObj.name.toLowerCase().includes(q) || cObj.code.toLowerCase().includes(q));
                          const matchesStudent = examMarks.some(m => {
                            if (m.unitId !== unit.id) return false;
                            const st = students.find(s => s.id === m.studentId);
                            return st && (st.name.toLowerCase().includes(q) || st.regNumber.toLowerCase().includes(q));
                          });
                          if (!matchesUnit && !matchesCourse && !matchesStudent) return false;
                        }
                        return true;
                      });

                      if (filteredUnits.length === 0) {
                        return (
                          <div className="text-center py-12 bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl">
                            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 font-bold">No subject units match the active department, course, or module filters.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-2xs">
                          <table className="min-w-full text-xs text-left">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-mono uppercase tracking-wider font-bold">
                                <th className="py-3.5 px-4">Subject Unit Details</th>
                                <th className="py-3.5 px-4">Course Program & Department</th>
                                <th className="py-3.5 px-3 text-center">Module</th>
                                <th className="py-3.5 px-3 text-center">Submissions</th>
                                <th className="py-3.5 px-3 text-center">HOD Endorsed</th>
                                <th className="py-3.5 px-3 text-center">Status</th>
                                <th className="py-3.5 px-4 text-right">Actions & Clearance</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {filteredUnits.map(unit => {
                                const unitMarks = examMarks.filter(m => m.unitId === unit.id);
                                const verifiedCount = unitMarks.filter(m => m.verifiedByHod).length;
                                const approvedCount = unitMarks.filter(m => m.approvedByExamsOfficer).length;
                                const isFullyApproved = unitMarks.length > 0 && approvedCount === unitMarks.length;
                                const isVerified = unitMarks.length > 0 && verifiedCount === unitMarks.length;
                                const courseObj = courses.find(c => c.id === unit.courseId);
                                const deptObj = departments.find(d => d.id === courseObj?.departmentId);
                                const isExpanded = expandedUnitId === unit.id;

                                return (
                                  <React.Fragment key={unit.id}>
                                    <tr className={`hover:bg-slate-50/70 ${isExpanded ? 'bg-indigo-50/30' : ''}`}>
                                      <td className="py-3.5 px-4">
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => setExpandedUnitId(isExpanded ? null : unit.id)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                          >
                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4" />}
                                          </button>
                                          <div>
                                            <div className="font-bold text-slate-800">{unit.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">Code: {unit.code}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3.5 px-4">
                                        <div className="font-bold text-slate-800">{courseObj?.name || 'Unassigned'}</div>
                                        <div className="text-[10px] text-slate-400">{deptObj?.name || 'General'}</div>
                                      </td>
                                      <td className="py-3.5 px-3 text-center">
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold font-mono">
                                          {unit.module || 'Module I'}
                                        </span>
                                      </td>
                                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                                        {unitMarks.length} Students
                                      </td>
                                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700">
                                        {verifiedCount} / {unitMarks.length}
                                      </td>
                                      <td className="py-3.5 px-3 text-center">
                                        {isFullyApproved ? (
                                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[9px] font-bold uppercase font-mono">
                                            Released
                                          </span>
                                        ) : isVerified ? (
                                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[9px] font-bold uppercase font-mono">
                                            HOD Verified
                                          </span>
                                        ) : unitMarks.length > 0 ? (
                                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[9px] font-bold uppercase font-mono">
                                            Pending HOD
                                          </span>
                                        ) : (
                                          <span className="px-2 py-0.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-md text-[9px] font-bold font-mono">
                                            No Entries
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-3.5 px-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button
                                            onClick={() => setExpandedUnitId(isExpanded ? null : unit.id)}
                                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                                          >
                                            <Eye className="w-3 h-3 text-slate-500" />
                                            {isExpanded ? 'Hide' : 'Students'}
                                          </button>
                                          {isFullyApproved ? (
                                            <span className="text-[10px] text-slate-400 italic font-mono font-bold">Clearance Active</span>
                                          ) : isVerified ? (
                                            <button
                                              onClick={() => {
                                                const updated = examMarks.map(m => {
                                                  if (m.unitId === unit.id) {
                                                    return { ...m, approvedByExamsOfficer: true };
                                                  }
                                                  return m;
                                                });
                                                onUpdateExamMarks(updated);
                                                logAuditAction('EXAMS_RELEASED_MARKS', `Released results officially for subject ${unit.name}`);
                                                alert(`Subject results for ${unit.name} have been officially approved and released to all student portals!`);
                                              }}
                                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all cursor-pointer"
                                            >
                                              Release Results
                                            </button>
                                          ) : (
                                            <span className="text-[10px] text-amber-600 italic font-bold">Awaiting HOD</span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>

                                    {/* EXPANDED UNIT STUDENTS TABLE */}
                                    {isExpanded && (
                                      <tr>
                                        <td colSpan={7} className="p-0 bg-slate-50/70 border-b border-indigo-100">
                                          <div className="p-4 space-y-3">
                                            <h4 className="text-xs font-black text-slate-800 font-mono uppercase tracking-wider">
                                              Enrolled Students & Mark Details for {unit.name} ({unit.code})
                                            </h4>
                                            {unitMarks.length === 0 ? (
                                              <p className="text-xs text-slate-400 italic">No marks submitted yet.</p>
                                            ) : (
                                              <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                                                <table className="min-w-full text-xs text-left">
                                                  <thead>
                                                    <tr className="bg-slate-100/70 text-slate-600 font-mono uppercase text-[10px] font-bold">
                                                      <th className="py-2.5 px-3">Student Name & RegNo</th>
                                                      <th className="py-2.5 px-2 text-center">CAT 1</th>
                                                      <th className="py-2.5 px-2 text-center">CAT 2</th>
                                                      <th className="py-2.5 px-2 text-center">End Term</th>
                                                      <th className="py-2.5 px-2 text-center bg-slate-50">Total %</th>
                                                      <th className="py-2.5 px-3 text-center">Grade</th>
                                                      <th className="py-2.5 px-3 text-center">Release Status</th>
                                                      <th className="py-2.5 px-3 text-right">Actions</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody className="divide-y divide-slate-100">
                                                    {unitMarks.map(mark => {
                                                      const st = students.find(s => s.id === mark.studentId);
                                                      const scoreVal = mark.score !== undefined ? mark.score : mark.marksObtained;
                                                      const tvetClass = getTvetClassification(scoreVal);

                                                      return (
                                                        <tr key={mark.id || mark.studentId} className="hover:bg-slate-50/50">
                                                          <td className="py-2.5 px-3">
                                                            <div className="font-bold text-slate-800">{st?.name || 'Unknown Student'}</div>
                                                            <div className="text-[10px] text-indigo-600 font-mono">{st?.regNumber || '--'}</div>
                                                            {mark.amendedByExamsOfficer && (
                                                              <div className="text-[9px] text-purple-700 font-mono font-bold mt-0.5">
                                                                Amended: {mark.amendmentReason}
                                                              </div>
                                                            )}
                                                          </td>
                                                          <td className="py-2.5 px-2 text-center font-mono">{mark.cat1 !== undefined ? `${mark.cat1}%` : '--'}</td>
                                                          <td className="py-2.5 px-2 text-center font-mono">{mark.cat2 !== undefined ? `${mark.cat2}%` : '--'}</td>
                                                          <td className="py-2.5 px-2 text-center font-mono">{mark.endTerm !== undefined ? `${mark.endTerm}%` : '--'}</td>
                                                          <td className="py-2.5 px-2 text-center font-mono font-black bg-slate-50">{scoreVal !== undefined ? `${scoreVal}%` : '--'}</td>
                                                          <td className="py-2.5 px-3 text-center font-mono font-bold text-indigo-600">{tvetClass.grade}</td>
                                                          <td className="py-2.5 px-3 text-center">
                                                            {mark.approvedByExamsOfficer ? (
                                                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[9px] font-bold font-mono">Released</span>
                                                            ) : mark.verifiedByHod ? (
                                                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[9px] font-bold font-mono">HOD Certified</span>
                                                            ) : (
                                                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-[9px] font-bold font-mono">Pending</span>
                                                            )}
                                                          </td>
                                                          <td className="py-2.5 px-3 text-right">
                                                            <button
                                                              onClick={() => {
                                                                const foundStudent = students.find(s => s.id === mark.studentId);
                                                                if (foundStudent) {
                                                                  handleOpenAmendModal(foundStudent, unit, mark);
                                                                }
                                                              }}
                                                              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ml-auto"
                                                            >
                                                              <Edit3 className="w-3 h-3 text-purple-600" />
                                                              Amend
                                                            </button>
                                                          </td>
                                                        </tr>
                                                      );
                                                    })}
                                                  </tbody>
                                                </table>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* MODAL: EXAMINATIONS OFFICER RESULT AMENDMENT MODAL */}
                {amendingMark && (
                  <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in duration-150">
                      <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                        <div>
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[9px] font-bold uppercase font-mono tracking-wider">
                            Official Exam Board Amendment
                          </span>
                          <h3 className="text-base font-black text-slate-800 font-mono mt-1">
                            Amend Student Examination Mark
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Authoritatively adjust subject scores before final release. Every change is timestamped and recorded in the permanent audit trail.
                          </p>
                        </div>
                        <button
                          onClick={() => setAmendingMark(null)}
                          className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Student & Subject Metadata Card */}
                      {(() => {
                        const targetStudent = amendingMark.student;
                        const targetUnit = amendingMark.unit;
                        const targetCourse = courses.find(c => c.id === targetStudent?.courseId);

                        // Live compute amended score
                        const c1 = parseFloat(amendCat1);
                        const c2 = parseFloat(amendCat2);
                        const et = parseFloat(amendEndTerm);

                        let total = 0;
                        let count = 0;
                        if (amendCat1 !== '' && !isNaN(c1)) { total += c1; count++; }
                        if (amendCat2 !== '' && !isNaN(c2)) { total += c2; count++; }
                        if (amendEndTerm !== '' && !isNaN(et)) { total += et; count++; }

                        const liveAvg = count > 0 ? Math.round(total / count) : NaN;
                        const liveTvet = getTvetClassification(liveAvg);

                        return (
                          <div className="space-y-4">
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-mono">Candidate:</span>
                                <span className="font-black text-slate-800">{targetStudent?.name} ({targetStudent?.regNumber})</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-mono">Course:</span>
                                <span className="font-bold text-slate-700">{targetCourse?.name}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400 font-mono">Subject Unit:</span>
                                <span className="font-bold text-indigo-700">{targetUnit?.name} ({targetUnit?.code}) [{targetUnit?.module || 'Module'}]</span>
                              </div>
                            </div>

                            {/* Mark Entry Fields */}
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-mono">CAT 1 (100)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={amendCat1}
                                  onChange={(e) => setAmendCat1(e.target.value)}
                                  placeholder="0-100"
                                  className="w-full text-center font-mono font-bold text-sm bg-white px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-mono">CAT 2 (100)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={amendCat2}
                                  onChange={(e) => setAmendCat2(e.target.value)}
                                  placeholder="0-100"
                                  className="w-full text-center font-mono font-bold text-sm bg-white px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-mono">End Term (100)</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={amendEndTerm}
                                  onChange={(e) => setAmendEndTerm(e.target.value)}
                                  placeholder="0-100"
                                  className="w-full text-center font-mono font-bold text-sm bg-white px-3 py-2 rounded-xl border border-slate-200 text-slate-800 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Live Score Preview */}
                            <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold uppercase text-purple-700 font-mono">Computed Final Average</span>
                                <div className="text-xl font-black text-purple-950 font-mono">
                                  {!isNaN(liveAvg) ? `${liveAvg}%` : '--'}
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-xl font-mono text-xs font-bold border ${liveTvet.color}`}>
                                {liveTvet.grade} — {liveTvet.label}
                              </span>
                            </div>

                            {/* Amendment Justification / Reason (Mandatory) */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-mono">
                                Official Amendment Reason / Justification <span className="text-rose-500">*</span>
                              </label>
                              <select
                                value={amendReason}
                                onChange={(e) => setAmendReason(e.target.value)}
                                className="w-full text-xs bg-white px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:ring-2 focus:ring-purple-500/20 focus:outline-none cursor-pointer"
                              >
                                <option value="Remarking following student appeal">Remarking following student appeal</option>
                                <option value="Data entry correction / Transposition error">Data entry correction / Transposition error</option>
                                <option value="Academic Board / Senate moderation">Academic Board / Senate moderation</option>
                                <option value="Special Examination sitting integration">Special Examination sitting integration</option>
                                <option value="Supplementary assessment update">Supplementary assessment update</option>
                                <option value="Practical / Workshop rubric recalculation">Practical / Workshop rubric recalculation</option>
                                <option value="Other authorized administrative adjustment">Other authorized administrative adjustment</option>
                              </select>
                            </div>

                            {/* Optional Remarks */}
                            <div>
                              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 font-mono">
                                Internal Remarks / Reference (Optional)
                              </label>
                              <input
                                type="text"
                                value={amendRemarks}
                                onChange={(e) => setAmendRemarks(e.target.value)}
                                placeholder="e.g. Minute 14/2026 Academic Senate meeting..."
                                className="w-full text-xs bg-white px-3 py-2 rounded-xl border border-slate-200 text-slate-800 font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
                              />
                            </div>

                            {/* Modal Action Buttons */}
                            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => setAmendingMark(null)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveAmendedMark}
                                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-200 cursor-pointer flex items-center gap-1.5"
                              >
                                <Save className="w-4 h-4" />
                                Save & Seal Amended Grade
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: PRINT OFFICIAL TRANSCRIPT */}
            {examSubTab === 'transcript_print' && ['registrar', 'examinations_officer', 'principal', 'admin'].includes(activeRole) && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 print:hidden">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1">
                      <Printer className="w-4 h-4 text-indigo-600" />
                      Academic Registrar Transcript Terminal
                    </h3>
                    <p className="text-[11px] text-slate-400">Search student profile and print high-quality institutional transcripts formatted with departmental and examination head signatures.</p>
                  </div>

                  <div className="max-w-md">
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5 font-mono">Select Student</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full text-xs bg-slate-50 px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Choose student from Registry --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.regNumber})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedStudentId ? (
                  (() => {
                    const studentObj = students.find(s => s.id === selectedStudentId);
                    const courseObj = courses.find(c => c.id === studentObj?.courseId);
                    const deptObj = departments.find(d => d.id === studentObj?.departmentId);
                    const studentMarks = examMarks.filter(m => m.studentId === selectedStudentId);
                    
                    const totalScore = studentMarks.reduce((sum, m) => sum + (m.score || m.marksObtained || 0), 0);
                    const meanScore = studentMarks.length > 0 ? Math.round(totalScore / studentMarks.length) : 0;
                    
                    let aggregateGrade = '-';
                    let classification = 'FAIL';
                    if (studentMarks.length > 0) {
                      if (meanScore >= 80) { aggregateGrade = 'A'; classification = 'PASS WITH DISTINCTION'; }
                      else if (meanScore >= 70) { aggregateGrade = 'A-'; classification = 'PASS WITH DISTINCTION'; }
                      else if (meanScore >= 65) { aggregateGrade = 'B+'; classification = 'PASS WITH CREDIT'; }
                      else if (meanScore >= 60) { aggregateGrade = 'B'; classification = 'PASS WITH CREDIT'; }
                      else if (meanScore >= 50) { aggregateGrade = 'C'; classification = 'PASS'; }
                      else if (meanScore >= 40) { aggregateGrade = 'D'; classification = 'PASS'; }
                      else { aggregateGrade = 'F'; classification = 'FAIL (ACADEMIC PROBATION)'; }
                    }

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-end print:hidden">
                          <button
                            onClick={() => window.print()}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                            Print Official Transcript
                          </button>
                        </div>

                        {/* TRANSCRIPT DESIGN BLOCK FOR PRINT & SCREEN */}
                        <div className="transcript-portrait-print bg-white p-8 sm:p-12 border-[12px] border-double border-slate-300 rounded-xs shadow-lg max-w-4xl mx-auto space-y-8 relative overflow-hidden print:border-none print:shadow-none print:p-0">
                          {/* STAMP WATERMARK */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
                            <div className="w-96 h-96 border-[24px] border-indigo-900 rounded-full flex flex-col items-center justify-center font-bold text-indigo-900 text-center tracking-widest leading-tight">
                              <span className="text-3xl">KITUTU CHACHE</span>
                              <span className="text-xl my-4">TECHNICAL & VOCATIONAL</span>
                              <span className="text-3xl">COLLEGE</span>
                              <span className="text-lg font-mono mt-2">OFFICIAL SEAL</span>
                            </div>
                          </div>

                          {/* Header section with coat of arms / emblem placeholder and titles */}
                          <div className="flex flex-col items-center text-center pb-6 border-b-2 border-slate-800">
                            <img
                              src={kitchaLogo}
                              alt="College Crest"
                              className="w-20 h-20 object-contain rounded-full bg-white p-1 border border-slate-400 mb-3"
                              referrerPolicy="no-referrer"
                            />
                            <h1 className="text-xl sm:text-2xl font-black tracking-wider text-slate-900 uppercase">Kitutu Chache Technical & Vocational College</h1>
                            <p className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-widest mt-1">P.O. Box 414-40200, Kisii, Kenya • email: info@kitutuchachetvc.ac.ke • www.kitutuchachetvc.ac.ke</p>
                            <div className="mt-4 px-6 py-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-sm">
                              Official Academic Transcript
                            </div>
                          </div>

                          {/* Student bio info card */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-xs border border-slate-200 p-4 rounded-lg bg-slate-50/50">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-mono block">Student Full Name</span>
                              <span className="font-extrabold text-slate-900 text-sm">{studentObj?.name.toUpperCase()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-mono block">Student Registration Number</span>
                              <span className="font-extrabold font-mono text-slate-900 text-sm">{studentObj?.regNumber}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-mono block">Departmental Faculty</span>
                              <span className="font-bold text-slate-700">{deptObj?.name || 'School of Engineering & Applied Sciences'}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-mono block">Course of Study Enrolled</span>
                              <span className="font-bold text-slate-700">{courseObj?.name}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-mono block">Current Academic Period</span>
                              <span className="font-bold text-slate-700">Year {studentObj?.yearOfStudy}, Semester {studentObj?.semester}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-mono block">Sponsorship Stream</span>
                              <span className="font-bold text-slate-700 capitalize">{studentObj?.sponsorType} Sponsored</span>
                            </div>
                          </div>

                          {/* Academic grading ledger */}
                          <div className="space-y-2">
                            <h4 className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">Graded Course Modules Ledger</h4>
                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                              <table className="min-w-full text-xs text-left">
                                <thead>
                                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-600 font-mono uppercase tracking-wider font-bold text-[10px]">
                                    <th className="py-2.5 px-4">Subject Code</th>
                                    <th className="py-2.5 px-4">Subject Unit Title</th>
                                    <th className="py-2.5 px-2 text-center">CAT 1</th>
                                    <th className="py-2.5 px-2 text-center">CAT 2</th>
                                    <th className="py-2.5 px-2 text-center">End Term</th>
                                    <th className="py-2.5 px-2 text-center bg-slate-200/50">Average (%)</th>
                                    <th className="py-2.5 px-4 text-center">KNEC Grade</th>
                                    <th className="py-2.5 px-4 text-center">Outcome</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-[11px]">
                                  {units
                                    .filter(u => u.courseId === studentObj?.courseId)
                                    .map(unit => {
                                      const mark = studentMarks.find(m => m.unitId === unit.id);
                                      const isReleased = mark?.approvedByExamsOfficer;

                                      return (
                                        <tr key={unit.id} className="text-slate-800">
                                          <td className="py-3 px-4 font-mono font-bold">{unit.code}</td>
                                          <td className="py-3 px-4 font-semibold">{unit.name}</td>
                                          <td className="py-3 px-2 text-center font-mono text-slate-600">
                                            {isReleased && mark?.cat1 !== undefined ? `${mark.cat1}%` : '--'}
                                          </td>
                                          <td className="py-3 px-2 text-center font-mono text-slate-600">
                                            {isReleased && mark?.cat2 !== undefined ? `${mark.cat2}%` : '--'}
                                          </td>
                                          <td className="py-3 px-2 text-center font-mono text-slate-600">
                                            {isReleased && mark?.endTerm !== undefined ? `${mark.endTerm}%` : '--'}
                                          </td>
                                          <td className="py-3 px-2 text-center font-mono font-black bg-slate-50/50">
                                            {isReleased ? `${mark.score || mark.marksObtained}%` : '--'}
                                          </td>
                                          <td className="py-3 px-4 text-center font-mono font-black text-indigo-700">
                                            {isReleased ? mark.grade : 'PENDING'}
                                          </td>
                                          <td className="py-3 px-4 text-center">
                                            {isReleased ? (
                                              <span className={`font-bold uppercase text-[10px] ${mark.score >= 40 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                {mark.score >= 40 ? 'pass' : 'fail'}
                                              </span>
                                            ) : (
                                              <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono">Unreleased</span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Summary Box */}
                          <div className="border-2 border-slate-200 p-4 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/20 text-xs">
                            <div className="text-center sm:text-left">
                              <span className="text-[9px] text-slate-400 font-mono uppercase block">Institutional Mean Score</span>
                              <span className="text-2xl font-black font-mono text-slate-900 mt-1 block">{studentMarks.some(m => m.approvedByExamsOfficer) ? `${meanScore}%` : '--'}</span>
                            </div>
                            <div className="text-center">
                              <span className="text-[9px] text-slate-400 font-mono uppercase block">Grade Classification</span>
                              <span className="text-base font-black text-indigo-800 mt-1.5 block">{studentMarks.some(m => m.approvedByExamsOfficer) ? `GRADE ${aggregateGrade}` : '--'}</span>
                            </div>
                            <div className="text-center sm:text-right">
                              <span className="text-[9px] text-slate-400 font-mono uppercase block">Academic Verdict</span>
                              <span className="text-[11px] font-black text-slate-900 mt-2 block">{studentMarks.some(m => m.approvedByExamsOfficer) ? classification : 'UNRELEASED'}</span>
                            </div>
                          </div>

                          {/* Signature Lines Block */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t-2 border-slate-800 text-xs font-sans">
                            <div className="space-y-4">
                              <span className="block font-bold text-slate-400 uppercase tracking-wide">1. Departmental Faculty Clearance</span>
                              <div className="border-b border-slate-400 h-10 w-4/5 flex items-end font-serif italic text-indigo-800">
                                {studentMarks.some(m => m.verifiedByHod) && (
                                  <span>Andrew Rabach - HOD</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-600 font-medium">
                                <p className="font-extrabold text-slate-900">Andrew Rabach</p>
                                <p>Head of Department (HOD) - CSIT Faculty</p>
                                <p className="text-[9px] text-slate-400 font-mono">Kitutu Chache TVC • Department Stamp</p>
                              </div>
                            </div>

                            <div className="space-y-4 sm:text-right flex flex-col sm:items-end">
                              <span className="block font-bold text-slate-400 uppercase tracking-wide self-start sm:self-end">2. Institutional Exams Registry Clearance</span>
                              <div className="border-b border-slate-400 h-10 w-4/5 flex items-end justify-end font-serif italic text-indigo-800">
                                {studentMarks.some(m => m.approvedByExamsOfficer) && (
                                  <span>Prof. David Koech - Registrar</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-600 font-medium text-left sm:text-right">
                                <p className="font-extrabold text-slate-900">Prof. David Koech</p>
                                <p>Examinations Registrar & Officer-in-Charge</p>
                                <p className="text-[9px] text-slate-400 font-mono">Kitutu Chache TVC • Institutional Seal</p>
                              </div>
                            </div>
                          </div>

                          {/* Footer with serial details */}
                          <div className="flex flex-col sm:flex-row items-center justify-between text-[9px] font-mono text-slate-400 pt-6 border-t border-slate-100">
                            <div>
                              TRANSCRIPT SERIAL: <span className="font-bold text-slate-600">KCTC-TR-{studentObj?.regNumber.replace('/', '-')}-{Date.now().toString().slice(-6)}</span>
                            </div>
                            <div>
                              ISSUED ON: <span className="font-bold text-slate-600">{new Date().toISOString().split('T')[0]}</span>
                            </div>
                            <div className="print:hidden text-indigo-600 font-bold">
                              * Official stamp visible on printout
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-10 bg-white border border-slate-200 rounded-3xl">
                    <Printer className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Please select a Student from the directory above to review and print their academic transcripts.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* SYSTEM USERS DIRECTORY SUB-MODULE (SUPER ADMIN ONLY) */}
        {/* ========================================== */}
        {activeRole === 'admin' && activeModule === 'users' && (
          <div className="space-y-6 animate-fadeIn print:hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div>
                <h2 className="text-lg font-black font-display text-slate-800 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  ERP Security & User Directory Console
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Authoritatively manage ERP credentials, create Registrar, Finance, and Auditor staff profiles, and oversee role rights.</p>
              </div>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Register ERP Staff Account
              </button>
            </div>

            {/* Quick alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <span className="font-bold block">Authority Restriction Protocol</span>
                HODs and trainers do not have credentials or portal visibility to access this fee system, keeping billing data isolated. Only Registrar, Finance Staff, Auditors, and Super Administrators possess designated access profiles.
              </div>
            </div>

            {/* Directory table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-800">Seeded System Administrators & Staff Accounts</span>
                <span className="text-slate-400 italic">Total: {users.length} authorized users</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 bg-slate-50 font-mono font-bold uppercase tracking-wider">
                      <th className="py-3 px-4">Staff Name</th>
                      <th className="py-3 px-4">Username ID</th>
                      <th className="py-3 px-4">Security Role Key</th>
                      <th className="py-3 px-4">Access Code</th>
                      <th className="py-3 px-4 text-center">Authorization Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="text-slate-700 hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-600">{u.username}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold uppercase ${
                            u.role === 'admin' ? 'bg-red-50 text-red-600 border border-red-100' : u.role === 'finance_officer' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                          }`}>
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">{u.code || 'N/A'}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            u.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {u.isActive ? 'Authorized' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {u.isDefault || u.id === currentUser.id ? (
                            <span className="text-[10px] text-slate-400 italic">Protected Default Account</span>
                          ) : (
                            <button
                              onClick={() => {
                                const nextActive = !u.isActive;
                                const updated = users.map(user => 
                                  user.id === u.id ? { ...user, isActive: nextActive } : user
                                );
                                onUpdateUsers(updated);
                                logAuditAction('TOGGLE_USER_ACTIVE', `Modified authorization status for user ${u.name} to ${nextActive}`);
                                alert(`User Account for ${u.name} status modified to ${nextActive ? 'AUTHORIZED' : 'DEACTIVATED'}`);
                              }}
                              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border cursor-pointer transition-colors ${
                                u.isActive
                                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                  : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {u.isActive ? 'Revoke' : 'Authorize'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 3: STUDENT WEB PORTAL */}
        {/* ========================================== */}
        {activeRole === 'student' && (
          <div className="space-y-6 animate-fadeIn">
            {(() => {
              const loggedInStudent = students.find(s => 
                s.regNumber.toUpperCase() === currentUser.username.toUpperCase() ||
                (currentUser.code && s.regNumber.toUpperCase() === currentUser.code.toUpperCase()) ||
                (s.email && s.email.toLowerCase() === currentUser.username.toLowerCase()) ||
                s.name.toLowerCase() === currentUser.name.toLowerCase()
              );
              const activeStudent = loggedInStudent || (['admin', 'principal'].includes(currentUser.role) ? students.find(s => s.id === selectedStudentId) : undefined);
              if (!activeStudent) return (
                <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                  <h3 className="font-bold text-slate-800 text-base">Student Record Not Found</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Your portal user account is active, but your official student admission record could not be matched. Please contact the Academic Registrar's office.
                  </p>
                </div>
              );

              const studentInvoices = invoices.filter(inv => inv.studentId === activeStudent.id);
              const studentPayments = payments.filter(tx => tx.studentId === activeStudent.id);
              
              const totalInvoiced = studentInvoices.reduce((sum, i) => sum + i.amount, 0);
              const totalPaid = studentPayments
                .filter(p => ['fee_payment', 'bursary', 'scholarship', 'helb_funding'].includes(p.transactionType))
                .reduce((sum, p) => sum + p.amount, 0);
              const totalPenalties = studentPayments
                .filter(p => p.transactionType === 'penalty')
                .reduce((sum, p) => sum + p.amount, 0);
              
              const netDue = (totalInvoiced + totalPenalties) - totalPaid;

              return (
                <div className="space-y-6">

                  {/* Student Header Card with Logo */}
                  <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-indigo-950">
                    <div className="absolute top-0 right-0 p-8 opacity-15">
                      <Sparkles className="w-40 h-40" />
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                      <div>
                        <span className="text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider block">
                          Student Portal • Self Service Tab
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black font-display uppercase tracking-tight mt-1">
                          {activeStudent.name}
                        </h2>
                        <p className="text-xs text-indigo-200 mt-1 font-mono font-bold">
                          REG: {activeStudent.regNumber} • {courses.find(c => c.id === activeStudent.courseId)?.name}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                        <button
                          onClick={() => setIsProfileOpen(true)}
                          className="px-4 py-2.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold transition-all border border-indigo-400/30 flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          Edit My Profile
                        </button>
                        <div className="bg-indigo-800/50 backdrop-blur-md p-4 rounded-2xl border border-indigo-700 text-right">
                          <span className="text-[10px] text-indigo-200 uppercase tracking-wider font-mono font-bold">Aggregate Outstanding</span>
                          <p className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-1">{formatKES(netDue)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick summary metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aggregate Invoiced</span>
                      <p className="text-xl font-black font-mono text-slate-800 mt-1">{formatKES(totalInvoiced)}</p>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aggregate Paid / Bursaries</span>
                      <p className="text-xl font-black font-mono text-emerald-600 mt-1">{formatKES(totalPaid)}</p>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penalties Applied</span>
                      <p className="text-xl font-black font-mono text-red-600 mt-1">{formatKES(totalPenalties)}</p>
                    </div>
                  </div>

                  {/* Student Portal Navigation Tab Bar */}
                  <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80 max-w-fit print:hidden">
                    <button
                      onClick={() => setStudentActiveTab('fees')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        studentActiveTab === 'fees'
                          ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-white/40'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                      My Fee Ledger & Statements
                    </button>
                    <button
                      onClick={() => setStudentActiveTab('results')}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        studentActiveTab === 'results'
                          ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                          : 'text-slate-600 hover:text-slate-800 hover:bg-white/40'
                      }`}
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                      My Academic Results & Grades
                    </button>
                  </div>

                  {studentActiveTab === 'fees' && (
                    /* Interactive Fee payment STK Push section */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
                    
                    {/* Live Statement Ledger Cards */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs lg:col-span-8 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-1.5">
                          <FileSpreadsheet className="w-4.5 h-4.5 text-indigo-600" />
                          Academic Ledger Statement
                        </h3>
                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print Ledger
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-mono font-bold bg-slate-50">
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Description / Reference</th>
                              <th className="py-2.5 px-3">Debit (Charges)</th>
                              <th className="py-2.5 px-3">Credit (Payments)</th>
                              <th className="py-2.5 px-3">Receipt No</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono">
                            {/* Invoices as Debits */}
                            {studentInvoices.map(inv => (
                              <tr key={inv.id} className="text-slate-700">
                                <td className="py-2 px-3 text-slate-400">{inv.dueDate}</td>
                                <td className="py-2 px-3 font-sans">
                                  <span className="font-bold block text-slate-800">{inv.description}</span>
                                  <span className="text-[10px] text-slate-400 uppercase block font-mono">Invoice Charge</span>
                                </td>
                                <td className="py-2 px-3 text-slate-800 font-bold">{formatKES(inv.amount)}</td>
                                <td className="py-2 px-3 text-slate-400">-</td>
                                <td className="py-2 px-3 text-slate-400">N/A</td>
                              </tr>
                            ))}

                            {/* Transactions as Debit/Credits */}
                            {studentPayments.map(tx => {
                              const isPenalty = tx.transactionType === 'penalty';
                              return (
                                <tr key={tx.id} className="text-slate-700">
                                  <td className="py-2 px-3 text-slate-400">{tx.date.split('T')[0]}</td>
                                  <td className="py-2 px-3 font-sans">
                                    <span className="font-bold block text-slate-800">{tx.remarks}</span>
                                    <span className="text-[10px] text-slate-400 uppercase block font-mono">
                                      Ref: {tx.referenceNumber} • {tx.transactionType.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-red-600 font-bold">{isPenalty ? formatKES(tx.amount) : '-'}</td>
                                  <td className="py-2 px-3 text-emerald-600 font-bold">{!isPenalty ? formatKES(tx.amount) : '-'}</td>
                                  <td className="py-2 px-3">
                                    {tx.receiptNumber ? (
                                      <button
                                        onClick={() => setSelectedReceipt(tx)}
                                        className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-sans text-[10px] font-bold cursor-pointer transition-colors block"
                                      >
                                        Receipt
                                      </button>
                                    ) : (
                                      <span className="text-slate-400 italic text-[10px]">No Receipt</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Interactive payment module */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs lg:col-span-4 space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-1.5">
                          <Send className="w-4.5 h-4.5 text-indigo-600" />
                          Simulate M-Pesa STK Payment
                        </h3>
                        <span className="text-[10px] text-emerald-500 font-mono font-bold">24/7 Gateways</span>
                      </div>

                      {stkStatus === 'idle' ? (
                        <form onSubmit={handleStkPush} className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Outstanding Invoice</label>
                            <select
                              value={stkInvoiceId}
                              onChange={(e) => setStkInvoiceId(e.target.value)}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                              required
                            >
                              <option value="">-- Choose Invoice to pay --</option>
                              {studentInvoices.filter(i => i.balance > 0).map(i => (
                                <option key={i.id} value={i.id}>{i.description} (Bal: {formatKES(i.balance)})</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">M-Pesa Phone Number</label>
                            <input
                              type="text"
                              value={stkPhone}
                              onChange={(e) => setStkPhone(e.target.value)}
                              placeholder="+2547XXXXXXXX"
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Payment Amount (KES)</label>
                            <input
                              type="number"
                              value={stkAmount}
                              onChange={(e) => setStkAmount(e.target.value)}
                              placeholder="Enter amount to pay"
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            Send M-Pesa STK Push
                          </button>
                        </form>
                      ) : (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-4">
                          
                          {stkStatus === 'sending' && (
                            <>
                              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-slate-800">Dispatching STK Push Request</h4>
                                <p className="text-[10px] text-slate-400 leading-relaxed">Pinging Safaricom API to trigger transaction on {stkPhone}</p>
                              </div>
                            </>
                          )}

                          {stkStatus === 'pending_pin' && (
                            <>
                              <div className="p-4 bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl animate-pulse text-xs font-bold flex flex-col gap-1 text-center">
                                <span className="uppercase text-[9px] tracking-widest block font-mono">Interactive PIN Prompt</span>
                                Enter Safaricom M-Pesa PIN on your handset to authorize the payment
                              </div>
                              <div className="text-xs font-semibold text-slate-500">
                                Simulated timeout: <span className="font-mono text-indigo-600">{stkTimer}s</span>
                              </div>
                            </>
                          )}

                          {stkStatus === 'verifying' && (
                            <>
                              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-slate-800">Verifying Bank Reconciliation</h4>
                                <p className="text-[10px] text-slate-400 leading-relaxed">Polling payment callback webhook for instant receipts confirmation</p>
                              </div>
                            </>
                          )}

                          {stkStatus === 'success' && (
                            <>
                              <div className="text-emerald-500 bg-emerald-50 border border-emerald-100 p-3 rounded-2xl inline-flex">
                                <CheckCircle2 className="w-8 h-8" />
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold text-emerald-800">M-Pesa Payment Successful!</h4>
                                <p className="text-[10px] text-slate-400 leading-relaxed">Payment of KES {stkAmount} has been reconciled. Receipt has been credited to your statement.</p>
                              </div>
                              <button
                                onClick={() => setStkStatus('idle')}
                                className="w-full py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
                              >
                                Process Another Payment
                              </button>
                            </>
                          )}

                        </div>
                      )}

                    </div>

                  </div>
                  )}

                  {studentActiveTab === 'results' && (
                    <div className="space-y-6">
                      {netDue > 0 ? (
                        /* LOCKED RESULTS CARD */
                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto text-center space-y-5 animate-fadeIn">
                          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-100">
                            <ShieldAlert className="w-8 h-8" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Academic Results Locked</h3>
                            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                              Kitutu Chache TVC Academic Board policy requires complete fee clearance to access end-of-semester marks, KNEC grades, and printable transcripts.
                            </p>
                          </div>
                          
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 max-w-xs mx-auto text-center font-mono">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Your Current Balance</span>
                            <span className="text-xl font-black text-red-600">{formatKES(netDue)}</span>
                          </div>

                          <div className="pt-2">
                            <button
                              onClick={() => setStudentActiveTab('fees')}
                              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-100 cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <CreditCard className="w-4 h-4" />
                              Pay Balance & Unlock Results
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* UNLOCKED RESULTS SHEET */
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                              <h3 className="font-bold text-slate-800 text-sm font-display flex items-center gap-1.5 uppercase">
                                <GraduationCap className="w-4.5 h-4.5 text-indigo-600" />
                                Official Semester Grades & Result Slip
                              </h3>
                              <p className="text-[11px] text-slate-400 mt-0.5">Your fees are fully cleared. You have complete access to verified departmental grades.</p>
                            </div>
                            <button
                              onClick={() => window.print()}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer print:hidden"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Print Unofficial Result Slip
                            </button>
                          </div>

                          {/* Marks Table */}
                          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                            <table className="min-w-full text-xs text-left">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase tracking-wider font-bold">
                                  <th className="py-3 px-4">Subject Unit Title</th>
                                  <th className="py-3 px-2 text-center">CAT 1</th>
                                  <th className="py-3 px-2 text-center">CAT 2</th>
                                  <th className="py-3 px-2 text-center">End Term</th>
                                  <th className="py-3 px-2 text-center bg-indigo-50/50">Marks Score (Avg)</th>
                                  <th className="py-3 px-4 text-center">KNEC Grade Classification</th>
                                  <th className="py-3 px-4 text-center">Outcome Status</th>
                                  <th className="py-3 px-4 text-center">Release Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {units
                                  .filter(u => u.courseId === activeStudent.courseId)
                                  .map(unit => {
                                    const studentMarks = examMarks.filter(m => m.studentId === activeStudent.id);
                                    const mark = studentMarks.find(m => m.unitId === unit.id);
                                    const isReleased = mark?.approvedByExamsOfficer;

                                    return (
                                      <tr key={unit.id} className="hover:bg-slate-50/50 text-slate-700">
                                        <td className="py-3.5 px-4">
                                          <div className="font-bold text-slate-800">{unit.name}</div>
                                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">Code: {unit.code}</div>
                                        </td>
                                        <td className="py-3.5 px-2 text-center font-mono">
                                          {isReleased && mark?.cat1 !== undefined ? `${mark.cat1}%` : '--'}
                                        </td>
                                        <td className="py-3.5 px-2 text-center font-mono">
                                          {isReleased && mark?.cat2 !== undefined ? `${mark.cat2}%` : '--'}
                                        </td>
                                        <td className="py-3.5 px-2 text-center font-mono">
                                          {isReleased && mark?.endTerm !== undefined ? `${mark.endTerm}%` : '--'}
                                        </td>
                                        <td className="py-3.5 px-2 text-center font-mono font-black bg-slate-50/30">
                                          {isReleased ? `${mark.score || mark.marksObtained}%` : '--'}
                                        </td>
                                        <td className="py-3.5 px-4 text-center font-mono font-black text-indigo-700">
                                          {isReleased ? mark.grade : 'PENDING RELEASE'}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                          {isReleased ? (
                                            <span className={`font-bold uppercase text-[10px] ${mark.score >= 40 ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md' : 'text-red-600 bg-red-50 px-2 py-0.5 rounded-md'}`}>
                                              {mark.score >= 40 ? 'pass' : 'fail'}
                                            </span>
                                          ) : (
                                            <span className="text-slate-400 text-[9px] font-bold uppercase font-mono">--</span>
                                          )}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                          {isReleased ? (
                                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[9px] font-bold uppercase tracking-wider font-mono">Released</span>
                                          ) : mark?.verifiedByHod ? (
                                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[9px] font-bold uppercase tracking-wider font-mono">Verified by HOD</span>
                                          ) : (
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md text-[9px] font-bold uppercase tracking-wider font-mono font-bold">In Draft</span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                {units.filter(u => u.courseId === activeStudent.courseId).length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">No subject units allocated to this course program.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Quick Summary Box */}
                          {(() => {
                            const studentMarks = examMarks.filter(m => m.studentId === activeStudent.id && m.approvedByExamsOfficer);
                            if (studentMarks.length === 0) {
                              return (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-center text-slate-500 font-bold">
                                  Your end-of-semester scores are currently being verified by the Exams Office. Check back shortly.
                                </div>
                              );
                            }

                            const totalScore = studentMarks.reduce((sum, m) => sum + (m.score || m.marksObtained || 0), 0);
                            const meanScore = Math.round(totalScore / studentMarks.length);
                            let aggGrade = '-';
                            let classif = 'FAIL';
                            if (meanScore >= 80) { aggGrade = 'A'; classif = 'PASS WITH DISTINCTION'; }
                            else if (meanScore >= 70) { aggGrade = 'A-'; classif = 'PASS WITH DISTINCTION'; }
                            else if (meanScore >= 65) { aggGrade = 'B+'; classif = 'PASS WITH CREDIT'; }
                            else if (meanScore >= 60) { aggGrade = 'B'; classif = 'PASS WITH CREDIT'; }
                            else if (meanScore >= 50) { aggGrade = 'C'; classif = 'PASS'; }
                            else if (meanScore >= 40) { aggGrade = 'D'; classif = 'PASS'; }
                            else { aggGrade = 'F'; classif = 'FAIL'; }

                            return (
                              <div className="border border-slate-200 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 text-xs">
                                <div className="text-center sm:text-left">
                                  <span className="text-[9px] text-slate-400 font-mono uppercase block">Your Mean Score</span>
                                  <span className="text-xl font-black font-mono text-slate-900 mt-1 block">{meanScore}%</span>
                                </div>
                                <div className="text-center">
                                  <span className="text-[9px] text-slate-400 font-mono uppercase block">Grade Classification</span>
                                  <span className="text-sm font-black text-indigo-800 mt-1.5 block">GRADE {aggGrade}</span>
                                </div>
                                <div className="text-center sm:text-right">
                                  <span className="text-[9px] text-slate-400 font-mono uppercase block">Academic Verdict</span>
                                  <span className="text-[10px] font-black text-emerald-600 mt-2 block">{classif}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })()}

          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 4: AUDITOR PANEL */}
        {/* ========================================== */}
        {activeRole === 'auditor' && (
          <div className="space-y-6 animate-fadeIn print:hidden">
            
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black font-display text-slate-800 uppercase flex items-center gap-1.5">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Audit Trail & Double-Entry Ledger System
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Maintain institutional financial integrity. Tracks structural fee creations, manual recordings, and M-Pesa automated transaction reconciliations.</p>
              </div>

              <button
                onClick={() => {
                  alert("Ledger exported as CSV for spreadsheet calculations!");
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-4 h-4" />
                Export Audit Logs (CSV)
              </button>
            </div>

            {/* Audit list logs */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">Double-entry Audit Trails ({feeAuditLogs.length} logs)</span>
                <span className="text-emerald-600 font-semibold font-mono text-[10px]">● System Integrity Secured</span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {feeAuditLogs.map(log => (
                  <div key={log.id} className="p-4 flex items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50">
                    <div className="flex items-start gap-3">
                      <div className="bg-slate-100 p-2 rounded-xl border border-slate-200 text-slate-600 shrink-0 mt-0.5 sm:mt-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block">{log.action.replace('_', ' ')}</span>
                        <p className="text-slate-500 leading-relaxed">{log.details}</p>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono">
                          <span>User: {log.userId}</span>
                          <span>•</span>
                          <span className="uppercase text-indigo-600 font-bold">{log.userRole}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 5: ADMINISTRATOR UTILITIES */}
        {/* ========================================== */}
        {activeRole === 'admin' && (
          <div className="space-y-6 animate-fadeIn print:hidden bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-black font-display text-slate-800 uppercase flex items-center gap-1.5">
                <Database className="w-5 h-5 text-indigo-600" />
                Administrative & System Parameters
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Restore configurations, clear states, seed institutional frameworks, or evaluate general ledger logs.</p>
            </div>

            <div className="border-t border-slate-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <RefreshCw className="w-4.5 h-4.5 text-indigo-600" />
                  Reset Fee Database to Factory Settings
                </h4>
                <p className="text-slate-500 leading-relaxed">
                  Clears customized profiles, installments, and posted collections, reverting to pristine mock demonstration records. Warning: This is permanent.
                </p>
                <button
                  onClick={() => {
                    if (confirm("Reset financial databases to seeded credentials? This is permanent.")) {
                      window.location.reload();
                    }
                  }}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all cursor-pointer"
                >
                  Reset Finance States
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4.5 h-4.5 text-indigo-600" />
                  System Security Parameters
                </h4>
                <p className="text-slate-500 leading-relaxed">
                  Active security checks monitor direct bank deposits, Safaricom webhook API endpoints, and credential matching. Complete SSL-encryption binds all transaction records.
                </p>
                <div className="bg-emerald-50 text-emerald-700 p-2.5 rounded-lg font-mono text-[10px] font-bold border border-emerald-100">
                  STATUS: All API Endpoints Secure (SSL)
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========================================== */}
      {/* PRINT DIALOG: MODAL RECEIPT PRINTER */}
      {/* ========================================== */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col p-6 space-y-6">
            
            {/* Print Friendly Receipt Component */}
            <div id="print-area" className="p-4 border-2 border-slate-200 rounded-2xl space-y-6 font-mono text-xs text-slate-800 bg-white">
              <div className="text-center border-b-2 border-dashed border-slate-300 pb-4 space-y-1">
                <h2 className="font-black font-display text-sm tracking-tight text-slate-900">KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE</h2>
                <p className="text-[10px] text-slate-400">P.O. Box 112 - Kitutu Chache, Kenya</p>
                <p className="text-[10px] text-slate-400">TEL: +254 700 000000 • INFO@KITCHA.AC.KE</p>
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 font-bold uppercase rounded-md text-[10px] mt-2">
                  OFFICIAL FEES RECEIPT
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block uppercase text-[9px]">Receipt Number</span>
                  <span className="font-bold text-slate-900">{selectedReceipt.receiptNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block uppercase text-[9px]">Date of Posting</span>
                  <span className="font-bold text-slate-900">{formatDate(selectedReceipt.date).split(',')[0]}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[9px]">Student Name</span>
                  <span className="font-bold text-slate-900">{(students.find(s => s.id === selectedReceipt.studentId))?.name.toUpperCase()}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block uppercase text-[9px]">Admission Reg No</span>
                  <span className="font-bold text-slate-900">{(students.find(s => s.id === selectedReceipt.studentId))?.regNumber}</span>
                </div>
              </div>

              <div className="border-t-2 border-b-2 border-dashed border-slate-200 py-3 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between font-bold">
                  <span>Particulars</span>
                  <span>Amount Allocated</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Academic Fees Allocation (Year 1 Sem 1)</span>
                  <span>{formatKES(selectedReceipt.amount)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-slate-500 text-[10px]">
                  <span>Channel: {selectedReceipt.method.toUpperCase()}</span>
                  <span>Ref: {selectedReceipt.referenceNumber}</span>
                </div>
              </div>

              <div className="flex items-center justify-between font-black text-sm text-slate-900">
                <span>TOTAL PAID</span>
                <span>{formatKES(selectedReceipt.amount)}</span>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed text-center space-y-1 pt-2 border-t border-slate-100">
                <p>Payment has been automatically reconciled on the student ledger.</p>
                <p className="font-black text-indigo-600">✓ Safaricom M-Pesa verified transaction</p>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Close Receipt
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Official Copy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: REGISTER NEW STUDENT */}
      {/* ========================================== */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h3 className="font-bold font-display text-lg text-slate-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                Student Admission Registration
              </h3>
              <p className="text-xs text-slate-400 mt-1">Register a new student and associate them with a Course and Department program.</p>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Registration Number (Reg No)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const selCourse = courses.find(c => c.id === newStudent.courseId) || courses[0];
                      const code = selCourse ? selCourse.code.toUpperCase() : 'DICT';
                      const intakeCode = newStudent.intake || 'J';
                      const autoNum = `KTVC/${code}/2026${intakeCode}/00${students.filter(s => s.courseId === selCourse?.id).length + 1}`;
                      setNewStudent({ ...newStudent, regNumber: autoNum });
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    ✨ Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. KTVC/DICT/2026J/005"
                  value={newStudent.regNumber}
                  onChange={(e) => setNewStudent({ ...newStudent, regNumber: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Intake Term</label>
                  <select
                    value={newStudent.intake || 'J'}
                    onChange={(e) => setNewStudent({ ...newStudent, intake: e.target.value as 'J' | 'M' | 'S' })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-bold"
                  >
                    <option value="J">January Intake (J)</option>
                    <option value="M">May Intake (M)</option>
                    <option value="S">September Intake (S)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">KCSE / KCPE Index No</label>
                  <input
                    type="text"
                    placeholder="e.g. 38610001/014"
                    value={newStudent.indexNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, indexNumber: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter student's official name"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Gender / Sex</label>
                  <select
                    value={newStudent.gender || 'Male'}
                    onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="student@kitcha.ac.ke"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+2547XXXXXXXX"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Academic Program Course</label>
                <select
                  value={newStudent.courseId}
                  onChange={(e) => setNewStudent({ ...newStudent, courseId: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Year of Study</label>
                  <select
                    value={newStudent.yearOfStudy}
                    onChange={(e) => setNewStudent({ ...newStudent, yearOfStudy: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                  >
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Semester</label>
                  <select
                    value={newStudent.semester}
                    onChange={(e) => setNewStudent({ ...newStudent, semester: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Sponsorship</label>
                  <select
                    value={newStudent.sponsorType}
                    onChange={(e) => setNewStudent({ ...newStudent, sponsorType: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                  >
                    <option value="self">Self Sponsor</option>
                    <option value="government">Government Capitation</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: ESTABLISH FEE STRUCTURE */}
      {/* ========================================== */}
      {showAddStructureModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h3 className="font-bold font-display text-lg text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Configure New Fee Structure
              </h3>
              <p className="text-xs text-slate-400 mt-1">Setup specific cost-items and aggregations for courses.</p>
            </div>

            <form onSubmit={handleAddStructureSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Target Course</label>
                <select
                  value={newStructure.courseId}
                  onChange={(e) => setNewStructure({ ...newStructure, courseId: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Academic Year</label>
                  <input
                    type="text"
                    required
                    placeholder="2025/2026"
                    value={newStructure.academicYear}
                    onChange={(e) => setNewStructure({ ...newStructure, academicYear: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Semester</label>
                  <select
                    value={newStructure.semester}
                    onChange={(e) => setNewStructure({ ...newStructure, semester: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Particular Breakdown (KES)</label>
                {newStructure.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-1/2 block font-semibold text-slate-600 bg-slate-50 p-2 rounded-xl">{item.name}</span>
                    <input
                      type="number"
                      required
                      value={item.amount}
                      onChange={(e) => {
                        const nextItems = [...newStructure.items];
                        nextItems[idx].amount = parseInt(e.target.value) || 0;
                        setNewStructure({ ...newStructure, items: nextItems });
                      }}
                      className="w-1/2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none text-slate-700"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddStructureModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
                >
                  Establish Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: POST MANUAL PAYMENT / PENALTY */}
      {/* ========================================== */}
      {showPostPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h3 className="font-bold font-display text-lg text-slate-800 flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-600" />
                Post Ledger Transaction
              </h3>
              <p className="text-xs text-slate-400 mt-1">Record financial payments, bursaries, late-fees, or government loan capitation on a student account.</p>
            </div>

            <form onSubmit={handlePostPaymentSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Target Student</label>
                <select
                  value={newPayment.studentId}
                  onChange={(e) => {
                    const selectedStudId = e.target.value;
                    const studentInvs = invoices.filter(inv => inv.studentId === selectedStudId);
                    const firstOutstanding = studentInvs.find(inv => inv.balance > 0) || studentInvs[0];
                    setNewPayment({
                      ...newPayment,
                      studentId: selectedStudId,
                      invoiceId: firstOutstanding ? firstOutstanding.id : ''
                    });
                  }}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.regNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Invoice Allocation</label>
                <select
                  value={newPayment.invoiceId}
                  onChange={(e) => setNewPayment({ ...newPayment, invoiceId: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                  required
                >
                  <option value="">-- Choose student invoice --</option>
                  {invoices.filter(inv => inv.studentId === newPayment.studentId).map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.description} (Outstanding: {formatKES(inv.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Transaction Type</label>
                  <select
                    value={newPayment.transactionType}
                    onChange={(e) => setNewPayment({ ...newPayment, transactionType: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                  >
                    <option value="fee_payment">Fee Payment (Standard)</option>
                    <option value="bursary">CDF / County Bursary</option>
                    <option value="helb_funding">HELB Government Loan</option>
                    <option value="penalty">Late Payment Penalty (+)</option>
                    <option value="refund">Financial Refund (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Payment Method</label>
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                  >
                    <option value="bank">Bank Deposit/Wire</option>
                    <option value="mpesa_paybill">M-Pesa PayBill</option>
                    <option value="cash">Over Counter Cash</option>
                    <option value="cheque">Banker Cheque</option>
                    <option value="card">Visa / Mastercard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Amount (KES)</label>
                  <input
                    type="number"
                    required
                    placeholder="Enter sum"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Reference Number</label>
                  <input
                    type="text"
                    placeholder="e.g. EQY-99283"
                    value={newPayment.referenceNumber}
                    onChange={(e) => setNewPayment({ ...newPayment, referenceNumber: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Internal Ledger Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Paid Equity Bank Slip #10"
                  value={newPayment.remarks}
                  onChange={(e) => setNewPayment({ ...newPayment, remarks: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (newPayment.studentId && newPayment.invoiceId) {
                      handleTriggerHelbSimulation(newPayment.studentId, newPayment.invoiceId);
                      setShowPostPaymentModal(false);
                    } else {
                      alert("Please select a student and an active invoice first!");
                    }
                  }}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Simulate HELB Disbursement
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPostPaymentModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
                  >
                    Post Transaction
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 4: INSTALLMENTS DRAFT BUILDER */}
      {/* ========================================== */}
      {showInstallmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h3 className="font-bold font-display text-lg text-slate-800 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                Draft Installment Repayment Schedule
              </h3>
              <p className="text-xs text-slate-400 mt-1">Split outstanding fee structure totals into custom installment milestones.</p>
            </div>

            <form onSubmit={handleInstallmentSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Student</label>
                <select
                  value={newInstallment.studentId}
                  onChange={(e) => setNewInstallment({ ...newInstallment, studentId: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.regNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Target Invoice</label>
                <select
                  value={newInstallment.invoiceId}
                  onChange={(e) => setNewInstallment({ ...newInstallment, invoiceId: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                  required
                >
                  <option value="">-- Choose outstanding invoice --</option>
                  {invoices.filter(inv => inv.studentId === newInstallment.studentId && inv.balance > 0).map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.description} (Invoiced: {formatKES(inv.amount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Installment Repayment Milestones</label>
                <select
                  value={newInstallment.stages}
                  onChange={(e) => setNewInstallment({ ...newInstallment, stages: e.target.value as any })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none text-slate-700"
                >
                  <option value="2">2 Instalment milestones (50% / 50%)</option>
                  <option value="3">3 Instalment milestones (40% / 30% / 30%)</option>
                  <option value="4">4 Instalment milestones (25% each)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInstallmentModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
                >
                  Commit Agreement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 5: LOG WALK-IN APPLICATION */}
      {/* ========================================== */}
      {showAddApplicationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h3 className="font-bold font-display text-lg text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Log Walk-in Application
              </h3>
              <p className="text-xs text-slate-400 mt-1">Record a new walk-in or physical applicant directly into the admissions pipeline.</p>
            </div>

            <form onSubmit={handleAddApplicationSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Applicant Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emmanuel Ariga"
                  value={newApplication.applicantName}
                  onChange={(e) => setNewApplication({ ...newApplication, applicantName: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="applicant@gmail.com"
                    value={newApplication.email}
                    onChange={(e) => setNewApplication({ ...newApplication, email: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0712345678"
                    value={newApplication.phone}
                    onChange={(e) => setNewApplication({ ...newApplication, phone: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Gender / Sex</label>
                  <select
                    value={newApplication.gender || 'Male'}
                    onChange={(e) => setNewApplication({ ...newApplication, gender: e.target.value as 'Male' | 'Female' })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-semibold"
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">National ID / Birth Cert No</label>
                  <input
                    type="text"
                    placeholder="e.g. 38472948"
                    value={newApplication.nationalId}
                    onChange={(e) => setNewApplication({ ...newApplication, nationalId: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Intake Term (J / M / S)</label>
                  <select
                    value={newApplication.intake || 'J'}
                    onChange={(e) => setNewApplication({ ...newApplication, intake: e.target.value as 'J' | 'M' | 'S' })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-bold"
                    required
                  >
                    <option value="J">January Intake (J) — e.g. 2026J</option>
                    <option value="M">May Intake (M) — e.g. 2026M</option>
                    <option value="S">September Intake (S) — e.g. 2026S</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">KCSE / KCPE Index Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 38610001/014"
                    value={newApplication.indexNumber}
                    onChange={(e) => setNewApplication({ ...newApplication, indexNumber: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Sponsor Category</label>
                <select
                  value={newApplication.sponsorType}
                  onChange={(e) => setNewApplication({ ...newApplication, sponsorType: e.target.value as 'self' | 'government' })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                >
                  <option value="self">Self Sponsored (Private)</option>
                  <option value="government">KUCCPS Government Sponsored</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Proposed Academic Program</label>
                <select
                  value={newApplication.courseId}
                  onChange={(e) => setNewApplication({ ...newApplication, courseId: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 font-semibold"
                  required
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              {/* LIVE AUTOGENERATED ADMISSION NUMBER BANNER */}
              {(() => {
                const selectedCourseObj = courses.find(c => c.id === newApplication.courseId) || courses[0];
                const courseCode = selectedCourseObj ? selectedCourseObj.code.toUpperCase() : 'DICT';
                const intakeCode = newApplication.intake || 'J';
                const yearIntake = `2026${intakeCode}`;
                const autoNum = `KTVC/${courseCode}/${yearIntake}/00${students.filter(s => s.courseId === selectedCourseObj?.id).length + admissionApplications.filter(a => a.courseId === selectedCourseObj?.id).length + 1}`;
                return (
                  <div className="p-3.5 bg-indigo-50/90 border border-indigo-200/90 rounded-2xl flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase font-mono tracking-wider block">
                        ✨ Live Auto-Generated Admission / Reg No.
                      </span>
                      <span className="text-sm font-black font-mono text-indigo-950 mt-0.5 block">
                        {autoNum}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-mono text-[10px] font-bold shadow-xs">
                      {courseCode} • {yearIntake}
                    </span>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddApplicationModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
                >
                  Record Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 6: REGISTER ERP STAFF ACCOUNT */}
      {/* ========================================== */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h3 className="font-bold font-display text-lg text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Register ERP User Account
              </h3>
              <p className="text-xs text-slate-400 mt-1">Create an official login profile for administrative staff, trainers, or student portal access.</p>
            </div>

            <form onSubmit={handleAddUserSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. David Wekesa"
                  value={newErpUser.name}
                  onChange={(e) => setNewErpUser({ ...newErpUser, name: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Username / Sign-In ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. dwekesa"
                    value={newErpUser.username}
                    onChange={(e) => setNewErpUser({ ...newErpUser, username: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Secure Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newErpUser.password}
                    onChange={(e) => setNewErpUser({ ...newErpUser, password: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">User Authorization Role</label>
                  <select
                    value={newErpUser.role}
                    onChange={(e) => setNewErpUser({ ...newErpUser, role: e.target.value as any })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                  >
                    <option value="registrar">Secretary / Registrar</option>
                    <option value="finance_officer">Finance Officer</option>
                    <option value="principal">Principal (Full Access)</option>
                    <option value="trainer">Trainer (Marks Entry)</option>
                    <option value="hod">HOD (Department Head)</option>
                    <option value="examinations_officer">Examinations Officer</option>
                    <option value="auditor">Internal Auditor</option>
                    <option value="student">Student Portal Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">PF Number / Reg Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. PF-9832 or KITCHA/2025/S..."
                    value={newErpUser.code}
                    onChange={(e) => setNewErpUser({ ...newErpUser, code: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                  />
                </div>
              </div>

              {['trainer', 'hod'].includes(newErpUser.role) && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Associated Academic Department</label>
                  <select
                    value={newErpUser.departmentId}
                    onChange={(e) => setNewErpUser({ ...newErpUser, departmentId: e.target.value })}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
                >
                  Register Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATED / PROVISIONED STUDENT ACCOUNT MODAL */}
      {createdStudentAccountModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-fadeIn space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Student Portal Account Ready</h3>
              <p className="text-xs text-slate-500">
                A student account has been created/verified for self-service portal access.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                <span className="text-slate-400 font-sans text-[11px]">Student Name:</span>
                <span className="font-bold text-slate-900">{createdStudentAccountModal.studentName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                <span className="text-slate-400 font-sans text-[11px]">Program Enrolled:</span>
                <span className="font-bold text-indigo-600 text-right">{createdStudentAccountModal.courseName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-2 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100">
                <span className="text-indigo-800 font-sans text-[11px] font-bold">Portal Username:</span>
                <span className="font-black text-indigo-900">{createdStudentAccountModal.username}</span>
              </div>
              <div className="flex justify-between items-center bg-indigo-50/50 p-2 rounded-xl border border-indigo-100">
                <span className="text-indigo-800 font-sans text-[11px] font-bold">Default Password:</span>
                <span className="font-black text-indigo-900">{createdStudentAccountModal.password}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 text-amber-800 rounded-xl text-[11px] border border-amber-200 flex items-start gap-2">
              <Key className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                The student can log in using their <strong>Registration Number</strong> as username and the default password above. They can edit their password anytime from their profile.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => {
                  const slipText = `KITUTU CHACHE TVC - STUDENT PORTAL ACCESS SLIP\nPortal URL: https://kitcha.studio\nName: ${createdStudentAccountModal.studentName}\nReg Number / Username: ${createdStudentAccountModal.username}\nPassword: ${createdStudentAccountModal.password}\nCourse: ${createdStudentAccountModal.courseName}`;
                  navigator.clipboard.writeText(slipText);
                  setCopiedCredentials(true);
                  setTimeout(() => setCopiedCredentials(false), 2000);
                }}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
              >
                {copiedCredentials ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copiedCredentials ? 'Copied Slip!' : 'Copy Credentials'}
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-200"
              >
                <Printer className="w-4 h-4" />
                Print Slip
              </button>
              <button
                onClick={() => setCreatedStudentAccountModal(null)}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-indigo-100 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE EDIT MODAL */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        users={users}
        departments={departments}
        onSaveUsers={onUpdateUsers}
        students={students}
        onSaveStudents={onUpdateStudents}
      />

    </div>
  );
}
