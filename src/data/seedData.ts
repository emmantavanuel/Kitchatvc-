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
  { id: 'course_dce', departmentId: 'dept_be', name: 'Diploma in Civil Engineering', code: 'DCE' },
  { id: 'course_plm_l3', departmentId: 'dept_be', name: 'Plumbing Level 3 (Artisan)', code: 'PLM-L3' },
  { id: 'course_plm_l4', departmentId: 'dept_be', name: 'Plumbing Level 4 (Craft)', code: 'PLM-L4' },
  { id: 'course_plm_l5', departmentId: 'dept_be', name: 'Plumbing Level 5 (Certificate)', code: 'PLM-L5' },
  { id: 'course_plm_l6', departmentId: 'dept_be', name: 'Plumbing Level 6 (Diploma)', code: 'PLM-L6' }
];

export const INITIAL_CLASSROOMS: Classroom[] = [
  { id: 'room_lab1', name: 'Computer Laboratory 1', capacity: 40, type: 'laboratory' },
  { id: 'room_lab2', name: 'Computer Laboratory 2', capacity: 30, type: 'laboratory' },
  { id: 'room_101', name: 'Lecture Room 101', capacity: 50, type: 'classroom' },
  { id: 'room_102', name: 'Lecture Room 102', capacity: 50, type: 'classroom' },
  { id: 'room_ee_workshop', name: 'Electrical Power Workshop', capacity: 35, type: 'workshop' },
  { id: 'room_be_drawing', name: 'Civil Drawing Room', capacity: 40, type: 'classroom' },
  { id: 'room_plumbing_ws', name: 'Plumbing & Pipework Workshop', capacity: 35, type: 'workshop' }
];

export const INITIAL_UNITS: Unit[] = [
  // Computer Science - Diploma in ICT (Module 1, Module 2, Module 3)
  { id: 'unit_prog', courseId: 'course_dict', departmentId: 'dept_cs', name: 'Introduction to Programming', code: 'ICT111', slotsRequired: 2, module: 'Module 1' },
  { id: 'unit_db', courseId: 'course_dict', departmentId: 'dept_cs', name: 'Database Management Systems', code: 'ICT112', slotsRequired: 1, module: 'Module 1' },
  { id: 'unit_math', courseId: 'course_dict', departmentId: 'dept_cs', name: 'Discrete Mathematics', code: 'ICT113', slotsRequired: 1, module: 'Module 1' },
  { id: 'unit_comm_ict', courseId: 'course_dict', departmentId: 'dept_cs', name: 'Communication & Life Skills', code: 'ICT114', slotsRequired: 1, module: 'Module 1' },
  { id: 'unit_oop', courseId: 'course_dict', departmentId: 'dept_cs', name: 'Object Oriented Programming (Java/C#)', code: 'ICT211', slotsRequired: 2, module: 'Module 2' },
  { id: 'unit_sad', courseId: 'course_dict', departmentId: 'dept_cs', name: 'System Analysis & Design', code: 'ICT212', slotsRequired: 1, module: 'Module 2' },
  { id: 'unit_net_ict', courseId: 'course_dict', departmentId: 'dept_cs', name: 'Data Communication & Networking', code: 'ICT213', slotsRequired: 2, module: 'Module 2' },
  { id: 'unit_quant', courseId: 'course_dict', departmentId: 'dept_cs', name: 'Quantitative Methods & Statistics', code: 'ICT214', slotsRequired: 1, module: 'Module 2' },
  { id: 'unit_mis', courseId: 'course_dict', departmentId: 'dept_cs', name: 'Management Information Systems', code: 'ICT311', slotsRequired: 1, module: 'Module 3' },
  { id: 'unit_sec_ict', courseId: 'course_dict', departmentId: 'dept_cs', name: 'Information Systems Security & Audit', code: 'ICT312', slotsRequired: 2, module: 'Module 3' },
  { id: 'unit_proj_ict', courseId: 'course_dict', departmentId: 'dept_cs', name: 'Trade Project & Research', code: 'ICT313', slotsRequired: 2, module: 'Module 3' },

  // Computer Science - Diploma in Computer Science
  { id: 'unit_web', courseId: 'course_dcs', departmentId: 'dept_cs', name: 'Responsive Web Design', code: 'DCS111', slotsRequired: 2, module: 'Module 1' },
  { id: 'unit_net', courseId: 'course_dcs', departmentId: 'dept_cs', name: 'Computer Networks & Protocols', code: 'DCS112', slotsRequired: 1, module: 'Module 1' },
  { id: 'unit_algo', courseId: 'course_dcs', departmentId: 'dept_cs', name: 'Data Structures & Algorithms', code: 'DCS113', slotsRequired: 2, module: 'Module 1' },
  { id: 'unit_fullstack', courseId: 'course_dcs', departmentId: 'dept_cs', name: 'Full-Stack Web Engineering', code: 'DCS211', slotsRequired: 2, module: 'Module 2' },
  { id: 'unit_os', courseId: 'course_dcs', departmentId: 'dept_cs', name: 'Operating Systems Architecture', code: 'DCS212', slotsRequired: 1, module: 'Module 2' },
  { id: 'unit_cloud', courseId: 'course_dcs', departmentId: 'dept_cs', name: 'Cloud Computing & DevOps', code: 'DCS311', slotsRequired: 2, module: 'Module 3' },
  { id: 'unit_dcs_proj', courseId: 'course_dcs', departmentId: 'dept_cs', name: 'Software Capstone Project', code: 'DCS312', slotsRequired: 2, module: 'Module 3' },

  // Electrical Engineering units
  { id: 'unit_elec_princ', courseId: 'course_dee', departmentId: 'dept_ee', name: 'Electrical Principles I', code: 'EEE111', slotsRequired: 2, module: 'Module 1' },
  { id: 'unit_dig_elec', courseId: 'course_dee', departmentId: 'dept_ee', name: 'Digital Electronics', code: 'EEE112', slotsRequired: 1, module: 'Module 1' },
  { id: 'unit_elec_mach', courseId: 'course_dee', departmentId: 'dept_ee', name: 'Electrical Machines & Control', code: 'EEE211', slotsRequired: 2, module: 'Module 2' },
  { id: 'unit_telecom', courseId: 'course_dee', departmentId: 'dept_ee', name: 'Telecommunication Principles', code: 'EEE212', slotsRequired: 1, module: 'Module 2' },
  { id: 'unit_power', courseId: 'course_dee', departmentId: 'dept_ee', name: 'Power Systems & High Voltage', code: 'EEE311', slotsRequired: 2, module: 'Module 3' },
  { id: 'unit_wiring', courseId: 'course_cei', departmentId: 'dept_ee', name: 'Domestic Wiring Practice', code: 'CEI111', slotsRequired: 2, module: 'Module 1' },
  { id: 'unit_solar', courseId: 'course_cei', departmentId: 'dept_ee', name: 'Solar Installation Technology', code: 'CEI112', slotsRequired: 1, module: 'Module 1' },

  // Building & Civil Engineering units
  { id: 'unit_surveying', courseId: 'course_dce', departmentId: 'dept_be', name: 'Engineering Surveying I', code: 'DCE111', slotsRequired: 2, module: 'Module 1' },
  { id: 'unit_drawing', courseId: 'course_dce', departmentId: 'dept_be', name: 'Building Drawing & CAD', code: 'DCE112', slotsRequired: 1, module: 'Module 1' },
  { id: 'unit_structures', courseId: 'course_dce', departmentId: 'dept_be', name: 'Theory of Structures', code: 'DCE211', slotsRequired: 2, module: 'Module 2' },
  { id: 'unit_concrete', courseId: 'course_dce', departmentId: 'dept_be', name: 'Concrete Technology', code: 'DCE212', slotsRequired: 1, module: 'Module 2' },
  { id: 'unit_highways', courseId: 'course_dce', departmentId: 'dept_be', name: 'Highway & Transportation Engineering', code: 'DCE311', slotsRequired: 2, module: 'Module 3' },

  // Plumbing Common Module 1 Units across Levels 3, 4, 5, 6
  { id: 'unit_plm_pipe_l3', courseId: 'course_plm_l3', departmentId: 'dept_be', name: 'Plumbing Technology & Pipework Practice', code: 'PLM101', slotsRequired: 2, module: 'Module 1' },
  { id: 'unit_plm_comm_l3', courseId: 'course_plm_l3', departmentId: 'dept_be', name: 'Communication Skills', code: 'COMM101', slotsRequired: 1, module: 'Module 1' },
  { id: 'unit_plm_ohs_l3', courseId: 'course_plm_l3', departmentId: 'dept_be', name: 'Occupational Safety & Health (OSH)', code: 'OSH101', slotsRequired: 1, module: 'Module 1' },
  { id: 'unit_plm_ent_l3', courseId: 'course_plm_l3', departmentId: 'dept_be', name: 'Entrepreneurship Education', code: 'ENT101', slotsRequired: 1, module: 'Module 1' },
  { id: 'unit_plm_math_l3', courseId: 'course_plm_l3', departmentId: 'dept_be', name: 'Basic Technical Mathematics', code: 'MAT101', slotsRequired: 1, module: 'Module 1' }
];

export const INITIAL_USERS: User[] = [
  { id: 'user_admin', username: 'admin', password: 'admin123', role: 'admin', name: 'Super Admin', isActive: true, isDefault: true },
  { id: 'user_principal', username: 'principal', password: 'password', role: 'principal', name: 'Dr. Charles Kitur (Principal)', isActive: true },
  { id: 'user_registrar', username: 'registrar', password: 'password', role: 'registrar', name: 'Mrs. Grace Kerubo (Registrar)', isActive: true },
  { id: 'user_finance', username: 'finance', password: 'password', role: 'finance_officer', name: 'Mr. John Kamau (Finance)', isActive: true },
  { id: 'user_exams', username: 'exams', password: 'password', role: 'examinations_officer', name: 'Prof. David Koech (Exams Officer)', isActive: true },
  { id: 'user_hod', username: 'hod', password: 'password', role: 'hod', name: 'Dr. Andrew Rabach (HOD CSIT)', departmentId: 'dept_cs', isActive: true },
  { id: 'user_hod_be', username: 'hod_be', password: 'password', role: 'hod', name: 'Eng. Faith Bosire (HOD Building & Civil / Plumbing)', departmentId: 'dept_be', isActive: true },
  { id: 'user_trainer', username: 'trainer', password: 'password', role: 'trainer', name: 'Mr. Evans Kemboi (Trainer)', departmentId: 'dept_cs', isActive: true },
  { id: 'user_trainer_be', username: 'trainer_be', password: 'password', role: 'trainer', name: 'Mr. Dennis Mogaka (Plumbing Trainer)', departmentId: 'dept_be', isActive: true },
  { id: 'user_manager', username: 'manager', password: 'password', role: 'manager', name: 'Academic Manager (Timetable & Verification)', isActive: true },
  { id: 'user_review', username: 'review', password: 'password', role: 'review', name: 'Academic Review Officer (Timetable Review & Audit)', isActive: true },
  { id: 'user_student1', username: 'KTVC/DICT/2026J/001', password: 'password', role: 'student', name: 'Emmanuel Omondi', isActive: true, code: 'KTVC/DICT/2026J/001' },
  { id: 'user_student2', username: 'KTVC/DCS/2026J/002', password: 'password', role: 'student', name: 'Faith Chepkoech', isActive: true, code: 'KTVC/DCS/2026J/002' }
];

// Seed time slot definitions (for labels)
export const TIME_SLOTS = [
  { id: 1, label: '08:00 AM - 10:00 AM' },
  { id: 2, label: '10:00 AM - 12:00 PM' },
  { id: 3, label: '01:00 PM - 03:00 PM' },
  { id: 4, label: '03:00 PM - 05:00 PM' }
];

// Seed trainer preferences (some unavailable slots and some preferred slots)
export const INITIAL_TRAINER_PREFERENCES: TrainerSlotPreference[] = [];

export const INITIAL_TIMETABLE_ENTRIES: TimetableEntry[] = [];

export const DEFAULT_ACADEMIC_SETTING: AcademicSetting = {
  academicYear: '2026/2027',
  semester: 'Term 1'
};
