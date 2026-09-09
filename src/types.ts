export type UserRole = 
  | 'admin' 
  | 'principal' 
  | 'deputy_academics' 
  | 'hod' 
  | 'trainer' 
  | 'trainee' 
  | 'student' 
  | 'quality_assurance' 
  | 'assessor' 
  | 'manager' 
  | 'registrar' 
  | 'finance_officer' 
  | 'auditor' 
  | 'examinations_officer' 
  | 'review' 
  | 'reviewer';

export interface User {
  id: string;
  username: string;
  password?: string; // Stored in plain text for this local prototype
  role: UserRole;
  name: string;
  departmentId?: string; // Associated department for HODs (and primary for Trainers)
  isActive: boolean;
  isDefault?: boolean; // Protect seed accounts
  isDemo?: boolean; // Identifies seed demonstration accounts
  code?: string;
  phone?: string;
  email?: string;
  nationalId?: string;
  pfNumber?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
}

export interface Course {
  id: string;
  departmentId: string;
  name: string;
  code: string;
}

export interface Classroom {
  id: string;
  name: string;
  capacity: number;
  type: 'classroom' | 'laboratory' | 'workshop';
}

export interface AcademicSetting {
  academicYear: string; // e.g. "2025/2026"
  semester: string; // e.g. "Semester 1"
}

export interface Unit {
  id: string;
  courseId: string;
  departmentId: string; // Cache department ID for ease of scheduling
  name: string;
  code: string;
  slotsRequired: number; // e.g., 1 slot (2 hours) or 2 slots (4 hours) per week
  trainerId?: string; // Pre-assigned trainer for this unit
  module?: string; // Associated Module (e.g. "Module 1", "Module 2", etc.)
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface TimeSlot {
  id: number; // 1, 2, 3, 4
  label: string; // e.g., "08:00 AM - 10:00 AM"
}

export type AvailabilityType = 'available' | 'unavailable' | 'preferred';

export interface TrainerSlotPreference {
  trainerId: string;
  day: DayOfWeek;
  slotId: number; // 1, 2, 3, 4
  type: AvailabilityType;
}

export interface CourseGroup {
  id: string;
  courseId: string;
  module: string; // e.g. "Module 1", "Module 2", "Module 3", etc.
  name: string; // e.g. "Group A", "Group B", "Group C", etc.
  code?: string; // e.g. "A", "B", "C"
  description?: string;
}

export interface TimetableEntry {
  id: string;
  departmentId: string;
  courseId: string;
  semesterName: string; // e.g. "Year 1 Semester 1"
  unitId: string;
  trainerId: string;
  classroomId: string;
  day: DayOfWeek;
  slotId: number; // 1, 2, 3, 4
  isPublished: boolean;
  groupId?: string; // Optional: specific group ID
  groupName?: string; // Optional: specific group label e.g. "Group A"
}

// Conflict report
export interface SchedulingConflict {
  type: 'trainer_double_booking' | 'classroom_double_booking' | 'class_double_booking' | 'trainer_unavailable';
  severity: 'error' | 'warning';
  message: string;
  affectedEntries: string[]; // TimetableEntry IDs involved
  details?: {
    day: DayOfWeek;
    slotId: number;
    trainerName?: string;
    classroomName?: string;
    courseName?: string;
    conflictingDepartment?: string;
  };
}

// --- Fee Management Types ---
export type FeePaymentMethod = 'mpesa_stk' | 'mpesa_paybill' | 'bank' | 'cash' | 'cheque' | 'card';
export type FeeTransactionType = 'fee_payment' | 'penalty' | 'bursary' | 'scholarship' | 'helb_funding' | 'refund';

export interface Student {
  id: string;
  regNumber: string;
  name: string;
  email: string;
  phone: string;
  gender?: 'Male' | 'Female';
  nationalId?: string;
  indexNumber?: string; // KCSE / KCPE Index Number
  courseId: string;
  departmentId: string;
  yearOfStudy: number; // 1, 2, 3
  semester: number; // 1, 2
  status: 'active' | 'suspended' | 'completed';
  sponsorType: 'self' | 'government'; // Capitation eligible
  intake?: string; // e.g. "M" (May), "S" (Sept), "J" (Jan)
  module?: string; // e.g. "Module 1", "Module 2", "Module 3"
}

export interface FeeItem {
  name: string;
  amount: number;
}

export interface FeeStructure {
  id: string;
  courseId: string;
  academicYear: string; // e.g. "2025/2026"
  semester: number; // 1 or 2
  items: FeeItem[];
  totalAmount: number;
}

export interface Invoice {
  id: string;
  studentId: string;
  feeStructureId: string;
  description: string;
  academicYear: string;
  semester: number;
  amount: number;
  dueDate: string;
  balance: number;
  status: 'unpaid' | 'partially_paid' | 'paid';
}

export interface PaymentTransaction {
  id: string;
  studentId: string;
  invoiceId?: string; // Optional if payment is overpaid or prepay
  amount: number;
  date: string;
  method: FeePaymentMethod;
  referenceNumber: string;
  reconciled: boolean;
  remarks: string;
  transactionType: FeeTransactionType;
  academicYear: string;
  semester: number;
  receiptNumber?: string;
  recordedBy: string; // User ID who processed it
}

export interface InstallmentPlan {
  id: string;
  studentId: string;
  invoiceId: string;
  agreedAmount: number;
  dateAgreed: string;
  installments: {
    id: string;
    dueDate: string;
    amount: number;
    amountPaid: number;
    status: 'pending' | 'paid';
  }[];
  active: boolean;
}

export interface FeeAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userRole: string;
  action: string; // e.g. "RECONCILED_PAYMENT", "REGISTERED_STUDENT"
  details: string;
}

// --- Unified ERP Expansion Types ---
export interface AdmissionApplication {
  id: string;
  applicantName: string;
  email: string;
  phone: string;
  courseId: string;
  courseName?: string;
  departmentName?: string;
  gender?: 'Male' | 'Female';
  dob?: string;
  intake?: 'J' | 'M' | 'S' | string; // J = January, M = May, S = September
  indexNumber?: string; // KCSE / KCPE Index Number
  meanGrade?: string;
  kcseYear?: string;
  previousSchool?: string;
  county?: string;
  subCounty?: string;
  postalAddress?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  modeOfStudy?: 'Full-Time' | 'Part-Time' | 'Evening' | string;
  accommodation?: boolean;
  autoRegNumber?: string;
  admissionNumber?: string; // Assigned when Registrar approves, e.g. KTTVC/ICT/2026/0001
  dateApplied: string;
  status: 'pending' | 'admitted' | 'rejected';
  approvedDate?: string;
  approvedBy?: string;
  nationalId?: string;
  sponsorType?: 'self' | 'government';
  remarks?: string;
}

export interface ExamMark {
  id: string;
  studentId: string;
  unitId: string;
  score: number; // 0 to 100
  grade: 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'E' | 'F' | string;
  academicYear: string;
  semester: number;
  recordedBy?: string;
  examTerm?: string;
  marksObtained?: number; // fallback/alias
  cat1?: number;
  cat2?: number;
  endTerm?: number;
  verifiedByHod?: boolean;
  approvedByExamsOfficer?: boolean;
  amendedByExamsOfficer?: boolean;
  amendmentReason?: string;
  amendedAt?: string;
  amendedBy?: string;
  remarks?: string;
}

// --- Dynamic Website CMS & Content Management Types ---
export interface WebsiteManager {
  id: string;
  name: string;
  role: string;
  department?: string;
  image?: string; // base64 Data URL or image path; empty string when pending upload
  bio?: string;
  email?: string;
  phone?: string;
  order: number;
}

export interface WebsiteAdvert {
  id: string;
  title: string;
  category: string; // 'Careers' | 'Admissions' | 'Tenders' | 'Events' | 'Announcements' | string
  description: string;
  image?: string; // uploaded banner image data URL or image path
  documentUrl?: string; // uploaded PDF or document Data URL or path
  documentName?: string; // file name (e.g. application_form.pdf)
  documentSize?: string; // e.g. 1.2 MB
  date: string;
  deadline?: string;
  ref?: string;
  actionText?: string;
  actionLink?: string;
  active: boolean;
}

export interface WebsiteDownloadDocument {
  id: string;
  title: string;
  category: string; // 'Admission' | 'Finance' | 'Policy' | 'Academic' | 'Attachment' | 'Examination' | 'Tenders' | string
  ref?: string;
  fileData?: string; // base64 Data URL or server /uploads/ url
  fileName?: string;
  fileSize?: string;
  fileType?: string; // e.g. 'application/pdf'
  dateAdded: string;
  deadline?: string; // For tenders
  status?: string; // 'Open' | 'Closed' | 'Active'
  description?: string;
  downloadsCount?: number;
}

export interface WebsiteCoreValueItem {
  title: string;
  desc: string;
}

export interface WebsiteStatItem {
  id: string;
  label: string;
  value: string;
  helper?: string;
}

export interface WebsiteConfig {
  collegeName: string;
  shortName: string;
  motto: string;
  tagline: string;
  mobile: string;
  email: string;
  postalAddress: string;
  physicalAddress: string;
  workingHours: string;
  intakeAnnouncement: string;
  
  // Media & Branding
  logoUrl?: string;
  heroImageUrl?: string;
  principalImageUrl?: string;

  // Hero & Overview
  heroHeadline: string;
  heroSubheadline: string;
  heroBadge: string;
  
  // Strategic statements
  vision: string;
  mission: string;
  coreValues: WebsiteCoreValueItem[];
  
  // Leadership & Team (Dynamic managers)
  managers: WebsiteManager[];
  
  // Adverts & Notices
  adverts: WebsiteAdvert[];

  // Official Downloads & Document Repository (PDFs)
  downloads?: WebsiteDownloadDocument[];

  // Tenders & Procurement (PDFs)
  tenders?: WebsiteDownloadDocument[];
  
  // Public Quick Stats
  stats: WebsiteStatItem[];
  
  // Principal's Welcome Message
  principalName: string;
  principalTitle: string;
  principalWelcomeMessage: string;
  
  // Meta
  lastUpdated?: string;
  updatedBy?: string;
}

// ============================================================================
// TVET PORTFOLIO OF EVIDENCE (PoE) TYPES & WORKFLOW SCHEMAS
// ============================================================================

export type PoeType = 'trainer' | 'trainee';

export type PoeCategory =
  // Trainer Professional Evidence
  | 'scheme_of_work'
  | 'lesson_plan'
  | 'record_of_work'
  | 'assessment_tool'
  | 'learning_guide'
  | 'cpd_certificate'
  | 'attendance_register'
  | 'curriculum_cbet'
  | 'other_trainer_evidence'
  // Trainee Competency Evidence
  | 'practical_project'
  | 'industrial_attachment'
  | 'competency_task'
  | 'attachment_logbook'
  | 'assessment_assignment'
  | 'rpl_prior_evidence'
  | 'safety_osha_certification'
  | 'other_trainee_evidence';

export type PoeStatus = 
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'revision_requested'
  | 'approved'
  | 'verified'
  | 'rejected';

export type PoeCompetencyGrade = 
  | 'competent'
  | 'not_yet_competent'
  | 'distinction'
  | 'credit'
  | 'pass'
  | 'pending';

export interface PoeRubricScore {
  criterionId: string;
  criterionName: string;
  maxScore: number;
  scoreAwarded: number;
  remarks?: string;
}

export interface PoeReview {
  id: string;
  documentId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRole;
  dateReviewed: string;
  feedbackComments: string;
  rubricScores?: PoeRubricScore[];
  overallScore?: number;
  maxPossibleScore?: number;
  decision: 'approved' | 'revision_requested' | 'rejected' | 'verified';
}

export interface PoeVerificationStamp {
  verifiedBy: string;
  verifierName: string;
  verifierRole: 'quality_assurance' | 'assessor' | 'deputy_academics' | 'principal' | string;
  verificationDate: string;
  verificationCode: string; // e.g. "KTVC-QA-2026-8894"
  comments: string;
  complianceStatus: 'fully_compliant' | 'minor_gaps_noted' | 'non_compliant';
  standardsBody?: 'TVETA' | 'CDACC' | 'KNEC' | 'INTERNAL_QA';
}

export interface PoeDocument {
  id: string;
  poeType: PoeType; // 'trainer' | 'trainee'
  title: string;
  description?: string;
  category: PoeCategory;
  targetUnitId?: string;
  targetUnitName?: string;
  targetCourseId?: string;
  targetCourseName?: string;
  departmentId: string;
  departmentName?: string;
  
  // Owner info
  ownerId: string;
  ownerName: string;
  ownerRole: 'trainer' | 'trainee' | 'student';
  ownerIdentifier?: string; // Reg No. for student/trainee, PF No. for trainer
  ownerEmail?: string;
  
  // Academic context
  academicYear: string; // e.g. "2026/2027"
  termSemester: string; // e.g. "Term 1"
  
  // Document metadata
  fileName: string;
  fileSize: string; // e.g. "2.4 MB"
  fileType: string; // e.g. "application/pdf"
  fileData?: string; // base64 or object URL (when uploaded)
  version: string; // e.g. "v1.0", "v1.1"
  dateUploaded: string;
  dateModified?: string;
  
  // Workflow state
  status: PoeStatus;
  competencyGrade?: PoeCompetencyGrade;
  tags: string[];
  
  // Reviews and audit sign-offs
  reviews: PoeReview[];
  verificationStamp?: PoeVerificationStamp;
}

export interface PoeNotification {
  id: string;
  recipientId: string; // specific user ID or "all_trainers", "all_hods", "qa"
  recipientRole?: UserRole;
  senderName: string;
  title: string;
  message: string;
  documentId?: string;
  dateSent: string;
  isRead: boolean;
  type: 'submission' | 'review_completed' | 'revision_needed' | 'verified' | 'compliance_alert';
}

export interface PoeRubricCriterion {
  id: string;
  name: string;
  maxScore: number;
  description: string;
}

export interface PoeRubric {
  id: string;
  title: string;
  targetCategory: PoeCategory;
  criteria: PoeRubricCriterion[];
}


