export type UserRole = 'admin' | 'manager' | 'principal' | 'hod' | 'trainer' | 'registrar' | 'finance_officer' | 'auditor' | 'examinations_officer' | 'student' | 'review' | 'reviewer';

export interface User {
  id: string;
  username: string;
  password?: string; // Stored in plain text for this local prototype
  role: UserRole;
  name: string;
  departmentId?: string; // Associated department for HODs (and primary for Trainers)
  isActive: boolean;
  isDefault?: boolean; // Protect seed accounts
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
  gender?: 'Male' | 'Female';
  intake?: 'J' | 'M' | 'S'; // J = January, M = May, S = September
  indexNumber?: string; // KCSE / KCPE Index Number
  autoRegNumber?: string;
  dateApplied: string;
  status: 'pending' | 'admitted' | 'rejected';
  nationalId?: string;
  sponsorType?: 'self' | 'government';
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


