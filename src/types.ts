export type UserRole = 'admin' | 'hod' | 'trainer';

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
