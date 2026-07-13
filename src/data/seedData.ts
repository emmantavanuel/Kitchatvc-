import { Department, Course, Classroom, Unit, User, TrainerSlotPreference, TimetableEntry, AcademicSetting } from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept_cs', name: 'Computer Science & IT', code: 'CSIT' },
  { id: 'dept_ee', name: 'Electrical & Electronics Engineering', code: 'EEE' },
  { id: 'dept_be', name: 'Building & Civil Engineering', code: 'BCE' }
];

export const INITIAL_COURSES: Course[] = [
  // Computer Science & IT Courses
  { id: 'course_dict', departmentId: 'dept_cs', name: 'Diploma in ICT', code: 'DICT' },
  { id: 'course_dcs', departmentId: 'dept_cs', name: 'Diploma in Computer Science', code: 'DCS' },
  // Electrical Engineering Courses
  { id: 'course_dee', departmentId: 'dept_ee', name: 'Diploma in Electrical Engineering', code: 'DEE' },
  { id: 'course_cei', departmentId: 'dept_ee', name: 'Certificate in Electrical Installation', code: 'CEI' },
  // Building & Civil Engineering Courses
  { id: 'course_dce', departmentId: 'dept_be', name: 'Diploma in Civil Engineering', code: 'DCE' }
];

export const INITIAL_CLASSROOMS: Classroom[] = [
  { id: 'room_lab1', name: 'Computer Laboratory 1', capacity: 40, type: 'laboratory' },
  { id: 'room_lab2', name: 'Computer Laboratory 2', capacity: 30, type: 'laboratory' },
  { id: 'room_101', name: 'Lecture Room 101', capacity: 50, type: 'classroom' },
  { id: 'room_102', name: 'Lecture Room 102', capacity: 50, type: 'classroom' },
  { id: 'room_ee_workshop', name: 'Electrical Power Workshop', capacity: 35, type: 'workshop' },
  { id: 'room_be_drawing', name: 'Civil Drawing Room', capacity: 40, type: 'classroom' }
];

export const INITIAL_UNITS: Unit[] = [
  // Computer Science units
  { id: 'unit_prog', courseId: 'course_dict', departmentId: 'dept_cs', name: 'Introduction to Programming', code: 'ICT111', slotsRequired: 2 },
  { id: 'unit_db', courseId: 'course_dict', departmentId: 'dept_cs', name: 'Database Management Systems', code: 'ICT112', slotsRequired: 1 },
  { id: 'unit_web', courseId: 'course_dcs', departmentId: 'dept_cs', name: 'Responsive Web Design', code: 'DCS111', slotsRequired: 2 },
  { id: 'unit_net', courseId: 'course_dcs', departmentId: 'dept_cs', name: 'Computer Networks', code: 'DCS112', slotsRequired: 1 },
  { id: 'unit_math', courseId: 'course_dict', departmentId: 'dept_cs', name: 'Discrete Mathematics', code: 'ICT113', slotsRequired: 1 },

  // Electrical Engineering units
  { id: 'unit_elec_princ', courseId: 'course_dee', departmentId: 'dept_ee', name: 'Electrical Principles I', code: 'EEE111', slotsRequired: 2 },
  { id: 'unit_dig_elec', courseId: 'course_dee', departmentId: 'dept_ee', name: 'Digital Electronics', code: 'EEE112', slotsRequired: 1 },
  { id: 'unit_wiring', courseId: 'course_cei', departmentId: 'dept_ee', name: 'Domestic Wiring Practice', code: 'CEI111', slotsRequired: 2 },
  { id: 'unit_solar', courseId: 'course_cei', departmentId: 'dept_ee', name: 'Solar Installation Technology', code: 'CEI112', slotsRequired: 1 },

  // Building & Civil Engineering units
  { id: 'unit_surveying', courseId: 'course_dce', departmentId: 'dept_be', name: 'Engineering Surveying I', code: 'DCE111', slotsRequired: 2 },
  { id: 'unit_drawing', courseId: 'course_dce', departmentId: 'dept_be', name: 'Building Drawing', code: 'DCE112', slotsRequired: 1 }
];

export const INITIAL_USERS: User[] = [
  { id: 'user_admin', username: 'admin', password: 'password', role: 'admin', name: 'Super Admin', isActive: true, isDefault: true }
];

// Seed time slot definitions (for labels)
export const TIME_SLOTS = [
  { id: 1, label: '08:00 AM - 10:00 AM' },
  { id: 2, label: '10:30 AM - 12:30 PM' },
  { id: 3, label: '02:00 PM - 04:00 PM' },
  { id: 4, label: '04:00 PM - 06:00 PM' }
];

// Seed trainer preferences (some unavailable slots and some preferred slots)
export const INITIAL_TRAINER_PREFERENCES: TrainerSlotPreference[] = [];

export const INITIAL_TIMETABLE_ENTRIES: TimetableEntry[] = [];

export const DEFAULT_ACADEMIC_SETTING: AcademicSetting = {
  academicYear: '2026/2027',
  semester: 'Term 1'
};
