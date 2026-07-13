import React, { useState } from 'react';
import { 
  User, Department, Course, Classroom, Unit, TimetableEntry, AcademicSetting, SchedulingConflict 
} from '../types';
import { 
  Users, Layers, GraduationCap, School, Calendar, LayoutGrid, BarChart3, Database,
  Plus, Edit2, Trash2, ShieldAlert, Key, ToggleLeft, ToggleRight, Download, Upload, CheckCircle2, XCircle,
  Printer, FileDown
} from 'lucide-react';
import { detectConflicts } from '../utils/scheduler';
import kitchaLogo from '../assets/images/kitcha_tvc_logo.jpg';
import UserProfileModal from './UserProfileModal';

interface AdminDashboardProps {
  currentUser: User;
  users: User[];
  departments: Department[];
  courses: Course[];
  classrooms: Classroom[];
  units: Unit[];
  timetableEntries: TimetableEntry[];
  trainerPreferences: any[];
  academicSetting: AcademicSetting;
  onUpdateUsers: (users: User[]) => void;
  onUpdateDepartments: (depts: Department[]) => void;
  onUpdateCourses: (courses: Course[]) => void;
  onUpdateClassrooms: (rooms: Classroom[]) => void;
  onUpdateAcademicSetting: (setting: AcademicSetting) => void;
  onImportState: (fullState: any) => void;
  onLogout: () => void;
  fullState: any;
}

type TabType = 'users' | 'departments' | 'courses' | 'classrooms' | 'academic' | 'global_timetables' | 'reports' | 'backup';

const PrintSignatureBlock = () => (
  <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs font-mono font-semibold text-slate-700 print:text-black print:mt-6 print:pt-4 break-inside-avoid">
    {/* CONFIRMED BY */}
    <div className="space-y-4">
      <p className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 uppercase tracking-wider print:border-black print:text-black">
        CONFIRMED BY : Q/A
      </p>
      <div className="space-y-3">
        <div className="flex items-end">
          <span className="shrink-0">Sign.:</span>
          <span className="flex-1 ml-2 border-b border-slate-300 border-dashed print:border-black">&nbsp;</span>
        </div>
        <div className="flex items-end">
          <span className="shrink-0">Date:</span>
          <span className="flex-1 ml-2 border-b border-slate-300 border-dashed print:border-black">&nbsp;</span>
        </div>
      </div>
    </div>

    {/* APPROVED BY */}
    <div className="space-y-4">
      <p className="font-bold text-slate-900 border-b border-slate-200 pb-1.5 uppercase tracking-wider print:border-black print:text-black">
        APPROVED BY : D/P ACADEMICS
      </p>
      <div className="space-y-3">
        <div className="flex items-end">
          <span className="shrink-0">Sign.:</span>
          <span className="flex-1 ml-2 border-b border-slate-300 border-dashed print:border-black">&nbsp;</span>
        </div>
        <div className="flex items-end">
          <span className="shrink-0">Date:</span>
          <span className="flex-1 ml-2 border-b border-slate-300 border-dashed print:border-black">&nbsp;</span>
        </div>
      </div>
    </div>
  </div>
);

// Helper to format semester/year to modules globally
export const formatSemesterToModule = (sem: string): string => {
  if (!sem) return '';
  const s = sem.toLowerCase().trim();
  // Translate Year X Semester Y to Module Z
  if (s === 'year 1 semester 1' || s === 'year 1 sem 1' || s === 'y1s1') return 'Module 1';
  if (s === 'year 1 semester 2' || s === 'year 1 sem 2' || s === 'y1s2') return 'Module 2';
  if (s === 'year 2 semester 1' || s === 'year 2 sem 1' || s === 'y2s1') return 'Module 3';
  if (s === 'year 2 semester 2' || s === 'year 2 sem 2' || s === 'y2s2') return 'Module 4';
  if (s === 'year 3 semester 1' || s === 'year 3 sem 1' || s === 'y3s1') return 'Module 5';
  if (s === 'year 3 semester 2' || s === 'year 3 sem 2' || s === 'y3s2') return 'Module 6';
  if (s === 'year 4 semester 1' || s === 'year 4 sem 1' || s === 'y4s1') return 'Module 7';
  if (s === 'year 4 semester 2' || s === 'year 4 sem 2' || s === 'y4s2') return 'Module 8';
  return sem;
};

export default function AdminDashboard({
  currentUser,
  users,
  departments,
  courses,
  classrooms,
  units,
  timetableEntries,
  trainerPreferences,
  academicSetting,
  onUpdateUsers,
  onUpdateDepartments,
  onUpdateCourses,
  onUpdateClassrooms,
  onUpdateAcademicSetting,
  onImportState,
  onLogout,
  fullState
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  
  // Modals / Forms States
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    password: '',
    role: 'trainer' as any,
    departmentId: '',
    isActive: true,
    code: '',
    phone: '',
    email: '',
    nationalId: '',
    pfNumber: ''
  });

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({ name: '', code: '', departmentId: '' });

  const [showClassroomModal, setShowClassroomModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [classroomForm, setClassroomForm] = useState({ name: '', capacity: 40, type: 'classroom' as any });

  // Filters for Global Timetables
  const [selectedDeptId, setSelectedDeptId] = useState(departments[0]?.id || '');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('Module 1');
  const [printMasterPreview, setPrintMasterPreview] = useState(false);
  const [printTrainersPreview, setPrintTrainersPreview] = useState(false);
  const [printUnitsPreview, setPrintUnitsPreview] = useState(false);
  const [unitsFilterDept, setUnitsFilterDept] = useState<string>('all');
  const [unitsFilterCourse, setUnitsFilterCourse] = useState<string>('all');
  const [unitsFilterModule, setUnitsFilterModule] = useState<string>('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [hideEmptySemesters, setHideEmptySemesters] = useState(true);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [printLayoutMode, setPrintLayoutMode] = useState<'departmental' | 'combined_grid' | 'trainer_timetables'>('combined_grid');
  const [trainerSearchQuery, setTrainerSearchQuery] = useState('');

  // Backup state feedback
  const [backupMessage, setBackupMessage] = useState({ text: '', type: 'success' as 'success' | 'error' });

  // Compute stats
  const totalConflicts = detectConflicts(timetableEntries, trainerPreferences, users, classrooms, courses, units);
  const activeUsersCount = users.filter(u => u.isActive).length;

  // USER CRUD HANDLERS
  const openUserModal = (user: User | null = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        username: user.username,
        password: user.password || '',
        role: user.role,
        departmentId: user.departmentId || '',
        isActive: user.isActive,
        code: user.code || '',
        phone: user.phone || '',
        email: user.email || '',
        nationalId: user.nationalId || '',
        pfNumber: user.pfNumber || ''
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: '',
        username: '',
        password: '',
        role: 'trainer',
        departmentId: departments[0]?.id || '',
        isActive: true,
        code: '',
        phone: '',
        email: '',
        nationalId: '',
        pfNumber: ''
      });
    }
    setShowUserModal(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      // Edit
      const updated = users.map(u => u.id === editingUser.id ? { 
        ...u, 
        name: userForm.name,
        username: userForm.username,
        password: userForm.password,
        role: userForm.role,
        departmentId: userForm.role === 'admin' ? undefined : userForm.departmentId,
        isActive: userForm.isActive,
        code: userForm.role === 'admin' ? undefined : userForm.code.toUpperCase().trim(),
        phone: userForm.role === 'admin' ? undefined : userForm.phone.trim(),
        email: userForm.email.trim(),
        nationalId: userForm.nationalId.trim(),
        pfNumber: userForm.pfNumber.trim()
      } : u);
      onUpdateUsers(updated);
    } else {
      // Add
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: userForm.name,
        username: userForm.username.toLowerCase().trim(),
        password: userForm.password || 'password', // fallback
        role: userForm.role,
        departmentId: userForm.role === 'admin' ? undefined : userForm.departmentId,
        isActive: userForm.isActive,
        code: userForm.role === 'admin' ? undefined : userForm.code.toUpperCase().trim(),
        phone: userForm.role === 'admin' ? undefined : userForm.phone.trim(),
        email: userForm.email.trim(),
        nationalId: userForm.nationalId.trim(),
        pfNumber: userForm.pfNumber.trim()
      };
      onUpdateUsers([...users, newUser]);
    }
    setShowUserModal(false);
  };

  const handleDeleteUser = (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    if (id === currentUser.id) {
      alert("You cannot delete your own logged-in account!");
      return;
    }
    if (confirm("Are you sure you want to delete this user account?")) {
      onUpdateUsers(users.filter(u => u.id !== id));
    }
  };

  const handleToggleUserActive = (user: User) => {
    if (user.id === currentUser.id) {
      alert("You cannot deactivate your own account!");
      return;
    }
    const updated = users.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u);
    onUpdateUsers(updated);
  };

  const handleResetUserPassword = (user: User) => {
    const newPass = prompt(`Enter a new password for ${user.name}:`, 'password123');
    if (newPass !== null && newPass.trim() !== '') {
      const updated = users.map(u => u.id === user.id ? { ...u, password: newPass.trim() } : u);
      onUpdateUsers(updated);
      alert(`Password for ${user.username} successfully reset!`);
    }
  };

  // DEPARTMENT CRUD HANDLERS
  const openDeptModal = (dept: Department | null = null) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({ name: dept.name, code: dept.code });
    } else {
      setEditingDept(null);
      setDeptForm({ name: '', code: '' });
    }
    setShowDeptModal(true);
  };

  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDept) {
      const updated = departments.map(d => d.id === editingDept.id ? { ...d, name: deptForm.name, code: deptForm.code.toUpperCase() } : d);
      onUpdateDepartments(updated);
    } else {
      const newDept: Department = {
        id: `dept_${Date.now()}`,
        name: deptForm.name,
        code: deptForm.code.toUpperCase()
      };
      onUpdateDepartments([...departments, newDept]);
    }
    setShowDeptModal(false);
  };

  const handleDeleteDept = (id: string) => {
    if (timetableEntries.some(e => e.departmentId === id)) {
      alert("Cannot delete department because it has active timetable schedules assigned.");
      return;
    }
    if (confirm("Are you sure you want to delete this department? All associated courses and HOD links will need updating.")) {
      onUpdateDepartments(departments.filter(d => d.id !== id));
    }
  };

  // COURSE CRUD HANDLERS
  const openCourseModal = (course: Course | null = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({ name: course.name, code: course.code, departmentId: course.departmentId });
    } else {
      setEditingCourse(null);
      setCourseForm({ name: '', code: '', departmentId: departments[0]?.id || '' });
    }
    setShowCourseModal(true);
  };

  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCourse) {
      const updated = courses.map(c => c.id === editingCourse.id ? { ...c, name: courseForm.name, code: courseForm.code.toUpperCase(), departmentId: courseForm.departmentId } : c);
      onUpdateCourses(updated);
    } else {
      const newCourse: Course = {
        id: `course_${Date.now()}`,
        name: courseForm.name,
        code: courseForm.code.toUpperCase(),
        departmentId: courseForm.departmentId
      };
      onUpdateCourses([...courses, newCourse]);
    }
    setShowCourseModal(false);
  };

  const handleDeleteCourse = (id: string) => {
    if (timetableEntries.some(e => e.courseId === id)) {
      alert("Cannot delete course because it has active timetable entries scheduled.");
      return;
    }
    if (confirm("Are you sure you want to delete this course and program?")) {
      onUpdateCourses(courses.filter(c => c.id !== id));
    }
  };

  // CLASSROOM CRUD HANDLERS
  const openClassroomModal = (room: Classroom | null = null) => {
    if (room) {
      setEditingClassroom(room);
      setClassroomForm({ name: room.name, capacity: room.capacity, type: room.type });
    } else {
      setEditingClassroom(null);
      setClassroomForm({ name: '', capacity: 40, type: 'classroom' });
    }
    setShowClassroomModal(true);
  };

  const handleSaveClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClassroom) {
      const updated = classrooms.map(c => c.id === editingClassroom.id ? { ...c, name: classroomForm.name, capacity: Number(classroomForm.capacity), type: classroomForm.type } : c);
      onUpdateClassrooms(updated);
    } else {
      const newRoom: Classroom = {
        id: `room_${Date.now()}`,
        name: classroomForm.name,
        capacity: Number(classroomForm.capacity),
        type: classroomForm.type
      };
      onUpdateClassrooms([...classrooms, newRoom]);
    }
    setShowClassroomModal(false);
  };

  const handleDeleteClassroom = (id: string) => {
    if (timetableEntries.some(e => e.classroomId === id)) {
      alert("Cannot delete classroom because classes are currently scheduled to take place in it.");
      return;
    }
    if (confirm("Are you sure you want to delete this classroom?")) {
      onUpdateClassrooms(classrooms.filter(c => c.id !== id));
    }
  };

  // BACKUP & RESTORE HANDLERS
  const handleBackupDownload = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullState, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `KITUTU_CHACHE_timetable_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setBackupMessage({ text: 'System backup file downloaded successfully!', type: 'success' });
    } catch (e) {
      setBackupMessage({ text: 'Failed to generate backup file.', type: 'error' });
    }
  };

  const handleRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.users && parsed.departments && parsed.courses && parsed.classrooms) {
          onImportState(parsed);
          setBackupMessage({ text: 'System backup restored and synchronized successfully!', type: 'success' });
        } else {
          setBackupMessage({ text: 'Invalid backup file format. Essential keys are missing.', type: 'error' });
        }
      } catch (err) {
        setBackupMessage({ text: 'Error parsing the uploaded backup JSON.', type: 'error' });
      }
    };
    fileReader.readAsText(file);
  };

  // RENDER REPORT UTILITY METRICS
  const getTrainerWorkload = () => {
    const load: { [trainerId: string]: number } = {};
    users.filter(u => u.role === 'trainer' || u.role === 'hod').forEach(t => {
      load[t.id] = 0;
    });
    timetableEntries.forEach(entry => {
      if (load[entry.trainerId] !== undefined) {
        load[entry.trainerId] += 2; // Each slot counts as 2 hours
      }
    });
    return Object.entries(load).map(([id, hours]) => {
      const trainer = users.find(u => u.id === id);
      return { name: trainer?.name || 'Unknown', hours };
    });
  };

  const getClassroomUtilization = () => {
    const totalPossibleSlots = 20; // 5 days * 4 slots
    return classrooms.map(room => {
      const bookedSlots = timetableEntries.filter(e => e.classroomId === room.id).length;
      const rate = Math.round((bookedSlots / totalPossibleSlots) * 100);
      return { name: room.name, rate, type: room.type };
    });
  };

  // GLOBAL GRID HELPERS
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as any[];
  const timeSlots = [
    { id: 1, label: '08:00 AM - 10:00 AM' },
    { id: 2, label: '10:30 AM - 12:30 PM' },
    { id: 3, label: '02:00 PM - 04:00 PM' },
    { id: 4, label: '04:00 PM - 06:00 PM' }
  ];

  const getFilteredEntries = () => {
    return timetableEntries.filter(e => {
      if (selectedCourseId) {
        return e.courseId === selectedCourseId && e.semesterName === selectedSemester;
      }
      return e.departmentId === selectedDeptId && e.semesterName === selectedSemester;
    });
  };

  const getCellContent = (day: string, slotId: number) => {
    const match = getFilteredEntries().find(e => e.day === day && e.slotId === slotId);
    if (!match) return null;

    const unit = units.find(u => u.id === match.unitId);
    const trainer = users.find(u => u.id === match.trainerId);
    const room = classrooms.find(c => c.id === match.classroomId);
    const course = courses.find(c => c.id === match.courseId);
    
    // Check conflicts involving this specific cell
    const cellConflicts = totalConflicts.filter(c => c.affectedEntries.includes(match.id));

    return {
      entry: match,
      unit,
      trainer,
      room,
      course,
      conflicts: cellConflicts
    };
  };

  if (printTrainersPreview) {
    const trainers = users.filter(u => u.role === 'trainer' || u.role === 'hod');
    const sortedTrainers = [...trainers].sort((a, b) => {
      const deptA = departments.find(d => d.id === a.departmentId);
      const deptB = departments.find(d => d.id === b.departmentId);
      
      const deptNameA = deptA ? deptA.name.toLowerCase() : 'zzz_unassigned';
      const deptNameB = deptB ? deptB.name.toLowerCase() : 'zzz_unassigned';
      
      if (deptNameA !== deptNameB) {
        return deptNameA.localeCompare(deptNameB);
      }
      
      // HOD goes first
      if (a.role === 'hod' && b.role !== 'hod') return -1;
      if (a.role !== 'hod' && b.role === 'hod') return 1;
      
      // Secondary sort: Name
      return a.name.localeCompare(b.name);
    });

    return (
      <div className="min-h-screen bg-slate-100 p-3 sm:p-8 print:p-0 print:bg-white text-slate-800">
        {/* Print Bar */}
        <div className="max-w-4xl mx-auto mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold font-display text-slate-800 text-sm">Trainer Contact Directory Print Preview</h1>
              <p className="text-xs text-slate-400">Review layout before printing. Use the buttons to print or go back.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs transition-all cursor-pointer shadow-md flex-1 sm:flex-none"
            >
              <Printer className="w-4 h-4" />
              Print List
            </button>
            <button
              onClick={() => setPrintTrainersPreview(false)}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-600 font-semibold text-xs transition-all cursor-pointer flex-1 sm:flex-none"
            >
              Exit Preview
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="max-w-4xl mx-auto bg-white p-4 sm:p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
          <div className="text-center pb-6 border-b-2 border-slate-800 mb-8 flex flex-col items-center justify-center">
            <img
              src={kitchaLogo}
              alt="KITCHA TVC Logo"
              className="w-24 h-24 object-contain mb-3"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-xl font-bold font-display uppercase tracking-tight text-slate-950">KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE</h1>
            <p className="text-xs uppercase font-mono tracking-widest text-indigo-600 font-bold mt-1.5">
              Trainers & Academic Staff Contact Directory
            </p>
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-700 font-semibold gap-2 max-w-lg mx-auto font-mono bg-slate-50 border border-slate-100 p-3 rounded-xl print:bg-transparent print:border-none">
              <span>GENERATED BY: <span className="text-slate-900">{currentUser.name.toUpperCase()}</span></span>
              <span>DATE: <span className="text-slate-900">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}</span></span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto print:overflow-x-visible border border-slate-300 rounded-xl">
            <table className="min-w-full divide-y divide-slate-300 text-left text-xs">
              <thead className="bg-slate-50 font-bold font-mono text-slate-700 uppercase">
                <tr>
                  <th className="px-4 py-3 border-r border-slate-300">Name</th>
                  <th className="px-4 py-3 border-r border-slate-300">Code</th>
                  <th className="px-4 py-3 border-r border-slate-300">Department</th>
                  <th className="px-4 py-3 border-r border-slate-300">National ID</th>
                  <th className="px-4 py-3 border-r border-slate-300">PF Number</th>
                  <th className="px-4 py-3 border-r border-slate-300">Phone</th>
                  <th className="px-4 py-3">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {sortedTrainers.map((t) => {
                  const dept = departments.find(d => d.id === t.departmentId);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/40">
                      <td className="px-4 py-3 border-r border-slate-200 font-semibold text-slate-900">
                        {t.name}
                        {t.role === 'hod' && <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md font-bold uppercase">HOD</span>}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 font-bold font-mono text-indigo-600">
                        {t.code || '-'}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 text-slate-600">
                        {dept ? `${dept.name} (${dept.code})` : <span className="text-slate-400 italic">Institution</span>}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 font-mono text-slate-700">
                        {t.nationalId || '-'}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 font-mono text-slate-700">
                        {t.pfNumber || '-'}
                      </td>
                      <td className="px-4 py-3 border-r border-slate-200 font-mono text-slate-700">
                        {t.phone || '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-700">
                        {t.email || '-'}
                      </td>
                    </tr>
                  );
                })}
                {sortedTrainers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                      No trainers or HOD accounts found in the system database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PrintSignatureBlock />
        </div>
      </div>
    );
  }

  if (printUnitsPreview) {
    const filtered = units.filter(u => {
      const matchDept = unitsFilterDept === 'all' || u.departmentId === unitsFilterDept;
      const matchCourse = unitsFilterCourse === 'all' || u.courseId === unitsFilterCourse;
      const matchModule = unitsFilterModule === 'all' || (u.module || 'Unassigned') === unitsFilterModule;
      return matchDept && matchCourse && matchModule;
    });

    const uniqueModules = Array.from(new Set(filtered.map(u => u.module || 'Unassigned'))).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    });

    return (
      <div className="min-h-screen bg-white p-6 sm:p-10 font-sans text-slate-800">
        <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-bold font-display text-slate-800 text-sm">Units per Module Print Preview</h1>
              <p className="text-xs text-slate-400">Configure filters and print the college curriculum structure.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={unitsFilterDept}
              onChange={(e) => {
                setUnitsFilterDept(e.target.value);
                setUnitsFilterCourse('all');
              }}
              className="rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>

            <select
              value={unitsFilterCourse}
              onChange={(e) => setUnitsFilterCourse(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
            >
              <option value="all">All Programs</option>
              {courses
                .filter(c => unitsFilterDept === 'all' || c.departmentId === unitsFilterDept)
                .map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
            </select>

            <select
              value={unitsFilterModule}
              onChange={(e) => setUnitsFilterModule(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
            >
              <option value="all">All Modules</option>
              <option value="Module 1">Module 1</option>
              <option value="Module 2">Module 2</option>
              <option value="Module 3">Module 3</option>
              <option value="Module 4">Module 4</option>
              <option value="Module 5">Module 5</option>
              <option value="Module 6">Module 6</option>
              <option value="Module 7">Module 7</option>
              <option value="Unassigned">Unassigned Modules</option>
            </select>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Report
            </button>
            <button
              onClick={() => setPrintUnitsPreview(false)}
              className="py-1.5 px-3.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all cursor-pointer bg-white"
            >
              Exit Preview
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto print:max-w-full print:p-0">
          <div className="flex flex-col items-center justify-center text-center pb-6 border-b-2 border-slate-800 mb-8">
            <img
              src={kitchaLogo}
              alt="KITCHA TVC Logo"
              className="w-20 h-20 object-contain mb-2.5"
              referrerPolicy="no-referrer"
            />
            <h2 className="text-xl sm:text-2xl font-bold font-display uppercase tracking-tight text-slate-900 leading-tight">
              KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE
            </h2>
            <p className="text-[11px] font-mono tracking-widest text-slate-500 mt-1 uppercase">
              PRINTED BY: {currentUser.name.toUpperCase()} / SUPER ADMIN
            </p>
            <p className="text-xs font-bold text-slate-700 mt-2 border border-slate-800/80 px-4 py-1.5 rounded-lg bg-slate-50 uppercase tracking-wider">
              WHOLE SCHOOL SUBJECT UNITS REPORT (BY MODULE SECTION)
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-600 mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 print:border-slate-300 print:bg-white">
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Department Filter</span>
              <span className="text-slate-800 font-mono">
                {unitsFilterDept === 'all' ? 'All College Departments' : departments.find(d => d.id === unitsFilterDept)?.name}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Report Date</span>
              <span className="text-slate-800 font-mono">{new Date().toLocaleDateString('en-KE', { dateStyle: 'medium' })}</span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Program Filter</span>
              <span className="text-slate-800">
                {unitsFilterCourse === 'all' ? 'All Programs' : courses.find(c => c.id === unitsFilterCourse)?.name}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Curriculum Subjects</span>
              <span className="text-slate-800 font-mono">{filtered.length} Subjects</span>
            </div>
          </div>

          {uniqueModules.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-300 rounded-3xl text-slate-400 italic">
              No subjects or modules found matching the active filter.
            </div>
          ) : (
            <div className="space-y-8">
              {uniqueModules.map(moduleName => {
                const moduleUnits = filtered.filter(u => (u.module || 'Unassigned') === moduleName);
                
                return (
                  <div key={moduleName} className="space-y-3 break-inside-avoid">
                    <h3 className="text-sm font-bold text-indigo-900 border-b-2 border-indigo-200 pb-1.5 flex items-center justify-between print:text-black print:border-slate-500 uppercase font-display">
                      <span>{moduleName === 'Unassigned' ? 'General / Unassigned Module Section' : moduleName}</span>
                      <span className="text-xs font-mono font-semibold text-slate-500 print:text-black">
                        {moduleUnits.length} Subject(s) • Total Slots: {moduleUnits.reduce((acc, curr) => acc + curr.slotsRequired, 0)} ({moduleUnits.reduce((acc, curr) => acc + curr.slotsRequired, 0) * 2} Hrs/Wk)
                      </span>
                    </h3>

                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono print:bg-slate-100 print:border-slate-400">
                          <th className="py-2.5 px-3 text-left w-24 border border-slate-200 print:border-slate-300 print:text-black">Code</th>
                          <th className="py-2.5 px-3 text-left border border-slate-200 print:border-slate-300 print:text-black">Subject Name</th>
                          <th className="py-2.5 px-3 text-left border border-slate-200 print:border-slate-300 print:text-black">Program/Course</th>
                          <th className="py-2.5 px-3 text-left border border-slate-200 print:border-slate-300 print:text-black">Department</th>
                          <th className="py-2.5 px-3 text-left w-28 border border-slate-200 print:border-slate-300 print:text-black">Slots (Hours)</th>
                          <th className="py-2.5 px-3 text-left border border-slate-200 print:border-slate-300 print:text-black">Assigned Trainer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700 print:divide-slate-300">
                        {moduleUnits.map(unit => {
                          const pCourse = courses.find(c => c.id === unit.courseId);
                          const pDept = departments.find(d => d.id === unit.departmentId);
                          const trainer = users.find(u => u.id === unit.trainerId);
                          return (
                            <tr key={unit.id} className="hover:bg-slate-50/30 print:hover:bg-transparent">
                              <td className="py-2 px-3 font-bold font-mono text-slate-900 border border-slate-200 print:border-slate-300">
                                {unit.code}
                              </td>
                              <td className="py-2 px-3 font-semibold text-slate-800 border border-slate-200 print:border-slate-300">
                                {unit.name}
                              </td>
                              <td className="py-2 px-3 text-slate-500 border border-slate-200 print:border-slate-300">
                                {pCourse ? `${pCourse.name} (${pCourse.code})` : 'N/A'}
                              </td>
                              <td className="py-2 px-3 text-slate-500 border border-slate-200 print:border-slate-300">
                                {pDept ? pDept.code : 'N/A'}
                              </td>
                              <td className="py-2 px-3 border border-slate-200 print:border-slate-300 font-semibold text-slate-700 font-mono">
                                {unit.slotsRequired} slots ({unit.slotsRequired * 2} Hrs)
                              </td>
                              <td className="py-2 px-3 border border-slate-200 print:border-slate-300">
                                {trainer ? (
                                  <span className="font-medium text-slate-800">{trainer.name} ({trainer.code || 'N/A'})</span>
                                ) : (
                                  <span className="text-slate-400 italic">Unassigned</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          <PrintSignatureBlock />
        </div>
      </div>
    );
  }

  if (printMasterPreview) {
    // Helper to extract initials/short code for trainer
    const getTrainerInitials = (name: string, tr?: User) => {
      if (tr?.code) return tr.code;
      if (!name) return '';
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Helper to get room code
    const getRoomCode = (name: string) => {
      if (!name) return '';
      return name.replace(/Room\s+/i, 'R').replace(/Laboratory\s+/i, 'Lab').trim();
    };


    // Helper to get short semester suffix (e.g. M1)
    const getShortSemester = (sem: string) => {
      const mapped = formatSemesterToModule(sem);
      return mapped
        .replace(/Module\s+/i, 'M')
        .replace(/\s+/g, '');
    };

    // Find all active (course, semester) combinations
    const activeCohorts: Array<{
      courseId: string;
      semesterName: string;
      courseCode: string;
      courseName: string;
      departmentId: string;
      key: string;
    }> = [];

    const seenCohorts = new Set<string>();
    timetableEntries.forEach(entry => {
      const key = `${entry.courseId}_${entry.semesterName}`;
      if (!seenCohorts.has(key)) {
        seenCohorts.add(key);
        const course = courses.find(c => c.id === entry.courseId);
        if (course) {
          activeCohorts.push({
            courseId: entry.courseId,
            semesterName: entry.semesterName,
            courseCode: course.code,
            courseName: course.name,
            departmentId: course.departmentId,
            key
          });
        }
      }
    });

    // Sort active cohorts by courseCode, then semester name
    activeCohorts.sort((a, b) => {
      if (a.courseCode !== b.courseCode) {
        return a.courseCode.localeCompare(b.courseCode);
      }
      return a.semesterName.localeCompare(b.semesterName);
    });

    // Filter cohorts based on the chosen department filter
    const filteredCohorts = activeCohorts.filter(cohort => {
      if (selectedDeptFilter === 'all') return true;
      return cohort.departmentId === selectedDeptFilter;
    });

    return (
      <div className="min-h-screen bg-slate-100 p-3 sm:p-6 print:bg-white print:p-0 font-sans">
        {/* Top Control Bar - hidden during physical print */}
        <div className="max-w-7xl mx-auto mb-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-lg">
              🖨️
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Master Timetable Printer Engine</h2>
              <p className="text-xs text-slate-400">Select view formats, filter by departments, and print high-quality document sheets.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Departments (Combined)</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            {/* Layout Mode selection */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Format:</span>
              <select
                value={printLayoutMode}
                onChange={(e) => setPrintLayoutMode(e.target.value as 'departmental' | 'combined_grid' | 'trainer_timetables')}
                className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="combined_grid">Combined Master Grid (Codes-Only)</option>
                <option value="departmental">Departmental Standard Pages</option>
                <option value="trainer_timetables">Personal Trainer Timetables</option>
              </select>
            </div>

            {printLayoutMode === 'trainer_timetables' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trainer Search:</span>
                <input
                  type="text"
                  value={trainerSearchQuery}
                  onChange={(e) => setTrainerSearchQuery(e.target.value)}
                  placeholder="Search trainer name..."
                  className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

            {printLayoutMode === 'departmental' && (
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={hideEmptySemesters}
                  onChange={(e) => setHideEmptySemesters(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Hide Empty Modules
              </label>
            )}

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              Print Timetable
            </button>
            <button
              onClick={() => setPrintMasterPreview(false)}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-600 font-semibold text-xs transition-all cursor-pointer"
            >
              Exit Preview
            </button>
          </div>
        </div>

        {/* Printable Master Document */}
        <div className="max-w-7xl mx-auto bg-white p-4 sm:p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
          <div className={`text-center pb-6 border-b-2 border-slate-800 mb-8 flex flex-col items-center justify-center ${printLayoutMode === 'trainer_timetables' ? 'print:hidden' : ''}`}>
            <img
              src={kitchaLogo}
              alt="KITCHA TVC Logo"
              className="w-24 h-24 object-contain mb-3"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-2xl font-bold font-display uppercase tracking-tight text-slate-950">KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE</h1>
            <p className="text-xs uppercase font-mono tracking-widest text-indigo-600 font-bold mt-1.5">
              {printLayoutMode === 'combined_grid' 
                ? 'Combined School-Wide Master Timetable Grid' 
                : printLayoutMode === 'trainer_timetables'
                  ? 'Personal Trainer Timetable Schedule'
                  : 'Departmental Master Timetable Binder'
              }
            </p>
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-700 font-semibold gap-2 max-w-2xl mx-auto font-mono bg-slate-50 border border-slate-100 p-3 rounded-xl print:bg-transparent print:border-none">
              <span>DEPARTMENTS: <span className="text-slate-900">{selectedDeptFilter === 'all' ? 'ALL DEPARTMENTS' : departments.find(d => d.id === selectedDeptFilter)?.name.toUpperCase()}</span></span>
              <span>ADMINISTRATOR: <span className="text-slate-900">{currentUser.name.toUpperCase()}</span></span>
              <span>ACADEMIC TERM: <span className="text-slate-900">{academicSetting.academicYear} - {academicSetting.semester}</span></span>
            </div>
          </div>

          {printLayoutMode === 'combined_grid' ? (
            /* COMBINED COMPACT GRID VIEW */
            <div className="space-y-6">
              {filteredCohorts.length === 0 ? (
                <div className="py-12 text-center text-slate-500 italic">
                  No active timetable schedule cohorts found matching the selected filters.
                </div>
              ) : (
                <div className="overflow-auto max-h-[65vh]">
                  <table className="min-w-full border-collapse border border-slate-300 text-xs font-sans print:border-slate-850">
                    <thead className="sticky top-0 z-10 bg-slate-100">
                      <tr className="bg-slate-100 print:bg-slate-200">
                        <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-700 uppercase tracking-wider font-mono text-[11px] w-28 print:border-slate-800 print:text-black">Day</th>
                        <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-700 uppercase tracking-wider font-mono text-[11px] w-36 print:border-slate-800 print:text-black">Course</th>
                        {timeSlots.map(ts => (
                          <th key={ts.id} className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-700 uppercase tracking-wider font-mono text-[11px] print:border-slate-800 print:text-black">
                            Slot {ts.id}
                            <span className="block font-sans text-[9px] font-normal text-slate-500 capitalize print:text-slate-600">{ts.label}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 print:divide-slate-800">
                      {daysOfWeek.map(day => {
                        const rowCount = filteredCohorts.length;
                        return filteredCohorts.map((cohort, index) => {
                          const isFirstRow = index === 0;
                          return (
                            <tr key={`${day}_${cohort.key}`} className="hover:bg-slate-50/50">
                              {isFirstRow && (
                                <td 
                                  rowSpan={rowCount} 
                                  className="border border-slate-300 px-4 py-3 font-bold text-slate-900 bg-slate-50/80 align-middle text-sm text-center font-display uppercase tracking-wide print:border-slate-800 print:bg-slate-100 print:text-black print:font-bold"
                                >
                                  {day}
                                </td>
                              )}
                              <td className="border border-slate-300 px-3 py-2.5 font-bold text-slate-800 font-mono bg-slate-50/20 print:border-slate-800 print:text-black print:bg-transparent">
                                {cohort.courseCode} <span className="text-[10px] text-slate-500 font-sans font-normal">({getShortSemester(cohort.semesterName)})</span>
                              </td>
                              {timeSlots.map(ts => {
                                const entry = timetableEntries.find(
                                  e => e.day === day && 
                                       e.courseId === cohort.courseId && 
                                       e.semesterName === cohort.semesterName && 
                                       e.slotId === ts.id
                                );
                                const unit = entry ? units.find(u => u.id === entry.unitId) : null;
                                const trainer = entry ? users.find(u => u.id === entry.trainerId) : null;
                                const room = entry ? classrooms.find(c => c.id === entry.classroomId) : null;

                                return (
                                  <td key={ts.id} className="border border-slate-300 px-2.5 py-2 align-middle text-center w-1/5 min-w-[130px] print:border-slate-800">
                                    {entry ? (
                                      <div className="flex flex-col items-center justify-center space-y-1.5 py-0.5">
                                        <div className="font-mono font-extrabold text-slate-950 text-xs sm:text-[13px] uppercase leading-tight print:text-[13.5px] print:font-black tracking-wide bg-slate-100/80 px-1.5 py-0.5 rounded border border-slate-200/50 print:bg-transparent print:border-none print:p-0">
                                          {unit?.code || '?'}
                                        </div>
                                        <div className="text-[9.5px] font-bold text-indigo-600 print:text-black leading-none flex items-center justify-center gap-1 mt-0.5">
                                          <span className="bg-indigo-50/80 text-indigo-700 px-1 py-0.5 rounded text-[8px] print:bg-transparent print:text-black print:p-0 print:font-bold">{getTrainerInitials(trainer?.name || '?', trainer || undefined)}</span>
                                          <span className="text-slate-300 print:text-black">•</span>
                                          <span className="bg-slate-50/80 text-slate-600 px-1 py-0.5 rounded text-[8px] print:bg-transparent print:text-black print:p-0 print:font-bold">{getRoomCode(room?.name || '?')}</span>
                                        </div>
                                        {!entry.isPublished && (
                                          <span className="inline-block text-[8px] font-bold text-amber-600 uppercase font-mono px-1 border border-amber-100 bg-amber-50/60 rounded print:hidden">
                                            Draft
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <span className="text-slate-300 italic block text-center py-2 print:hidden">No assigned classes</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        });
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <PrintSignatureBlock />
            </div>
          ) : printLayoutMode === 'trainer_timetables' ? (
            /* PERSONAL TRAINER TIMETABLES VIEW */
            <div className="space-y-16">
              {(() => {
                const activeTrainers = users.filter(u => (u.role === 'trainer' || u.role === 'hod') && u.isActive);
                const filteredTrainers = activeTrainers.filter(t => {
                  const matchesSearch = t.name.toLowerCase().includes(trainerSearchQuery.toLowerCase());
                  const matchesDept = selectedDeptFilter === 'all' || t.departmentId === selectedDeptFilter;
                  return matchesSearch && matchesDept;
                });

                if (filteredTrainers.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-500 italic">
                      No personal trainer timetables found matching the selected filters.
                    </div>
                  );
                }

                return filteredTrainers.map((trainer, trainerIdx) => {
                  const trainerClasses = timetableEntries.filter(e => e.trainerId === trainer.id);
                  const trainerDept = departments.find(d => d.id === trainer.departmentId);

                  return (
                    <div 
                      key={trainer.id} 
                      className={`space-y-4 print:space-y-3 ${trainerIdx > 0 ? 'print:break-before-page print:pt-4' : 'print:pt-1'}`}
                    >
                      {/* Individual Trainer Print Header with Logo and full metadata */}
                      <div className="flex flex-col items-center justify-center text-center pb-3 border-b border-slate-300 mb-2 print:pb-2 print:mb-1">
                        <img
                          src={kitchaLogo}
                          alt="KITCHA TVC Logo"
                          className="w-12 h-12 object-contain mb-1 print:w-10 print:h-10"
                          referrerPolicy="no-referrer"
                        />
                        <h2 className="text-base font-bold font-display uppercase tracking-tight text-slate-950 print:text-sm">
                          KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE
                        </h2>
                        <p className="text-[10px] uppercase font-mono tracking-widest text-indigo-600 font-bold mt-0.5">
                          Personal Trainer Timetable Schedule
                        </p>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-1.5 w-full text-[9px] text-slate-700 font-semibold font-mono bg-slate-50 border border-slate-100 p-2 rounded-xl print:bg-transparent print:border-none print:p-0 print:mt-1">
                          <div className="text-center md:text-left">
                            TRAINER: <span className="text-slate-900 font-bold">{trainer.name.toUpperCase()} {trainer.phone ? `• TEL: ${trainer.phone}` : ''}</span>
                          </div>
                          <div className="text-center">
                            DEPARTMENT: <span className="text-slate-900 font-bold">{trainerDept ? trainerDept.name.toUpperCase() : 'NO DEPARTMENT'}</span>
                          </div>
                          <div className="text-center md:text-right">
                            TERM & SEMESTER: <span className="text-slate-900 font-bold">{academicSetting.academicYear.toUpperCase()} - {academicSetting.semester.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50/30 p-3 rounded-2xl border border-slate-200/60 print:bg-transparent print:p-0 print:border-none">
                        <div className="overflow-auto max-h-[60vh] print:max-h-none">
                          <table className="min-w-full border-collapse border border-slate-200 text-xs font-sans print:border-slate-400">
                            <thead className="sticky top-0 z-10 bg-slate-100">
                              <tr className="bg-slate-100 print:bg-slate-200">
                                <th className="border border-slate-200 px-2.5 py-1.5 text-left font-bold text-slate-600 uppercase tracking-wider font-mono w-24 print:border-slate-400 print:text-black print:py-1">Day</th>
                                {timeSlots.map(ts => (
                                  <th key={ts.id} className="border border-slate-200 px-2 py-1.5 text-center font-bold text-slate-600 uppercase tracking-wider font-mono print:border-slate-400 print:text-black print:py-1">
                                    Slot {ts.id}
                                    <span className="block font-sans text-[8px] font-normal text-slate-400 capitalize print:text-slate-600">{ts.label}</span>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {daysOfWeek.map(day => (
                                <tr key={day} className="hover:bg-slate-50/50">
                                  <td className="border border-slate-200 px-2.5 py-2 font-bold text-slate-800 bg-slate-50 print:border-slate-400 print:bg-slate-100 print:text-black print:py-1 print:px-1.5">{day}</td>
                                  {timeSlots.map(ts => {
                                    const entry = trainerClasses.find(e => e.day === day && e.slotId === ts.id);
                                    const unit = entry ? units.find(u => u.id === entry.unitId) : null;
                                    const room = entry ? classrooms.find(c => c.id === entry.classroomId) : null;
                                    const course = entry ? courses.find(c => c.id === entry.courseId) : null;

                                    return (
                                      <td key={ts.id} className="border border-slate-200 px-2 py-2 align-top w-1/5 min-w-[130px] print:border-slate-400 print:py-1 print:px-1.5">
                                        {entry ? (
                                          <div className="space-y-1 text-center">
                                            <div className="flex items-center justify-between gap-1 border-b border-slate-100 pb-0.5 mb-0.5 print:border-slate-300">
                                              <span className="font-mono font-extrabold text-[12px] sm:text-[13px] uppercase text-slate-950 print:text-[13.5px] print:font-black tracking-wider">
                                                {unit?.code || '?'}
                                              </span>
                                              {!entry.isPublished && (
                                                <span className="text-[7px] font-bold text-amber-600 uppercase font-mono px-0.5 border border-amber-200 bg-amber-50 rounded print:border-slate-400 print:text-black print:bg-transparent">
                                                  Draft
                                                </span>
                                              )}
                                            </div>
                                            <div className="text-[9px] text-indigo-600 block print:text-black font-bold">
                                              ROOM: {room?.name ? room.name.replace(/Room\s+/i, '').replace(/Laboratory\s+/i, 'Lab').trim() : '?'}
                                            </div>
                                            <div className="text-[8px] text-slate-500 block print:text-slate-800 font-medium">
                                              {course?.code || '?'} ({getShortSemester(entry.semesterName)})
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-slate-300 italic block text-center py-1.5 print:hidden">No assigned classes</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <PrintSignatureBlock />
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            /* STANDARD DEPARTMENTAL PAGINATED VIEW */
            <div className="space-y-16">
              {departments
                .filter(d => selectedDeptFilter === 'all' || d.id === selectedDeptFilter)
                .map(dept => {
                  const deptCourses = courses.filter(c => c.departmentId === dept.id);
                  
                  const activeCourses = deptCourses.filter(course => {
                    if (!hideEmptySemesters) return true;
                    return timetableEntries.some(e => e.courseId === course.id);
                  });

                  if (activeCourses.length === 0) {
                    return null;
                  }

                  return (
                    <div key={dept.id} className="space-y-8 page-break-before-always">
                      {/* Department Divider */}
                      <div className="bg-slate-900 text-white p-4 rounded-xl flex justify-between items-center print:bg-slate-200 print:text-black print:border-b-2 print:border-black print:p-2 print:rounded-none">
                        <h2 className="text-lg font-bold uppercase tracking-wide font-display">🏢 {dept.name} ({dept.code})</h2>
                        <span className="text-xs font-mono font-semibold text-indigo-300 print:text-black">
                          Department Master Section
                        </span>
                      </div>

                      <div className="space-y-12">
                        {activeCourses.map(course => {
                          const semestersToRender = ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5', 'Module 6', 'Module 7'].filter(sem => {
                            if (!hideEmptySemesters) return true;
                            return timetableEntries.some(e => e.courseId === course.id && e.semesterName === sem);
                          });

                          if (semestersToRender.length === 0) {
                            return null;
                          }

                          return (
                            <div key={course.id} className="space-y-6 break-inside-avoid">
                              <div className="border-l-4 border-indigo-600 pl-4 py-1 print:border-slate-400">
                                <h3 className="text-base font-bold text-slate-900 uppercase font-display">{course.name} ({course.code})</h3>
                                <p className="text-xs text-slate-500 font-mono">Curriculum Schedule Grid</p>
                              </div>

                              {semestersToRender.map(sem => {
                                return (
                                  <div key={sem} className="bg-slate-50/30 p-5 rounded-2xl border border-slate-200/60 print:bg-transparent print:p-0 print:border-none space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 print:border-slate-300">
                                      <span className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-700 print:text-black">
                                        📚 {sem}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-400 font-semibold print:hidden">
                                        Total Assigned: {timetableEntries.filter(e => e.courseId === course.id && e.semesterName === sem).length} Classes
                                      </span>
                                    </div>

                                    <div className="overflow-auto max-h-[60vh]">
                                      <table className="min-w-full border-collapse border border-slate-200 text-xs font-sans print:border-slate-400">
                                      <thead className="sticky top-0 z-10 bg-slate-100">
                                        <tr className="bg-slate-100 print:bg-slate-200">
                                          <th className="border border-slate-200 px-3 py-2 text-left font-bold text-slate-600 uppercase tracking-wider font-mono w-24 print:border-slate-400 print:text-black">Day</th>
                                          {timeSlots.map(ts => (
                                            <th key={ts.id} className="border border-slate-200 px-3 py-2 text-left font-bold text-slate-600 uppercase tracking-wider font-mono print:border-slate-400 print:text-black">
                                              Slot {ts.id}
                                              <span className="block font-sans text-[9px] font-normal text-slate-400 capitalize print:text-slate-600">{ts.label}</span>
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {daysOfWeek.map(day => (
                                          <tr key={day} className="hover:bg-slate-50/50">
                                            <td className="border border-slate-200 px-3 py-2.5 font-bold text-slate-800 bg-slate-50 print:border-slate-400 print:bg-slate-100 print:text-black">{day}</td>
                                            {timeSlots.map(ts => {
                                              const entry = timetableEntries.find(e => e.courseId === course.id && e.semesterName === sem && e.day === day && e.slotId === ts.id);
                                              const unit = entry ? units.find(u => u.id === entry.unitId) : null;
                                              const trainer = entry ? users.find(u => u.id === entry.trainerId) : null;
                                              const room = entry ? classrooms.find(c => c.id === entry.classroomId) : null;

                                              return (
                                                <td key={ts.id} className="border border-slate-200 px-3 py-2.5 align-top w-1/5 min-w-[140px] print:border-slate-400">
                                                  {entry ? (
                                                    <div className="space-y-1">
                                                      <div className="flex items-center justify-between gap-1">
                                                        <span className="font-mono font-extrabold text-[12px] sm:text-[13px] uppercase text-slate-950 print:text-[13.5px] print:font-black tracking-wider bg-slate-100/60 px-1 py-0.5 rounded border border-slate-200/50 print:bg-transparent print:border-none print:p-0">
                                                          {unit?.code}
                                                        </span>
                                                        {!entry.isPublished && (
                                                          <span className="text-[8px] font-bold text-amber-600 uppercase font-mono px-1 border border-amber-200 bg-amber-50 rounded print:border-slate-400 print:text-black print:bg-transparent">
                                                            Draft
                                                          </span>
                                                        )}
                                                      </div>
                                                      <div className="font-semibold text-slate-800 block leading-tight text-[11px] print:text-[10px]" title={unit?.name}>{unit?.name}</div>
                                                      <div className="text-[9px] text-indigo-600 block print:text-black font-bold leading-none mt-1">👤 {getTrainerInitials(trainer?.name || '?', trainer || undefined)}</div>
                                                      <div className="text-[9px] text-slate-500 block print:text-slate-700 font-semibold leading-none mt-0.5">🏢 {room?.name ? room.name.replace(/Room\s+/i, '').replace(/Laboratory\s+/i, 'Lab').trim() : '?'}</div>
                                                    </div>
                                                  ) : (
                                                    <span className="text-slate-300 italic block text-center py-2 print:hidden">No assigned classes</span>
                                                  )}
                                                </td>
                                              );
                                            })}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                  <PrintSignatureBlock />
                                </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-sky-100 to-[#eeddd3] text-slate-800 py-3 px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#d7bdac] shadow-sm">
        <div className="flex items-center gap-3.5">
          <img
            src={kitchaLogo}
            alt="KITCHA TVC Logo"
            className="w-12 h-12 object-contain rounded-full bg-white p-0.5 border border-[#c6aa96]"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-bold font-display text-lg sm:text-xl tracking-tight text-slate-900">Kitutu Chache TVC</h1>
            <p className="text-[10px] uppercase font-mono tracking-widest text-[#7c5335]">Administration Console</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block text-xs font-semibold text-[#8c5e3c] font-mono">SUPER ADMIN</span>
            <button 
              onClick={() => setShowProfileModal(true)}
              id="btn-admin-profile-trigger"
              className="text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {currentUser.name} <span className="text-[10px] text-slate-400 font-mono">(Edit Profile)</span>
            </button>
          </div>
          <button 
            onClick={onLogout}
            id="btn-admin-logout"
            className="py-1.5 px-3.5 rounded-lg border border-[#c6aa96] hover:border-red-400 hover:bg-red-50 text-slate-800 hover:text-red-600 text-xs font-semibold transition-all cursor-pointer bg-white/80"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Sidebar Navigation */}
        <nav className="w-full lg:w-72 bg-white border-r border-slate-200/80 p-5 flex flex-col gap-1 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">System Entities</span>
          
          <button 
            onClick={() => setActiveTab('users')}
            id="tab-users"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Users className="w-4.5 h-4.5" />
            User Accounts
          </button>

          <button 
            onClick={() => setActiveTab('departments')}
            id="tab-departments"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${activeTab === 'departments' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Layers className="w-4.5 h-4.5" />
            Departments
          </button>

          <button 
            onClick={() => setActiveTab('courses')}
            id="tab-courses"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${activeTab === 'courses' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <GraduationCap className="w-4.5 h-4.5" />
            Courses & Programs
          </button>

          <button 
            onClick={() => setActiveTab('classrooms')}
            id="tab-classrooms"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${activeTab === 'classrooms' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <School className="w-4.5 h-4.5" />
            Classrooms & Labs
          </button>

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-6 mb-3 px-3">Scheduling & Auditing</span>

          <button 
            onClick={() => setActiveTab('academic')}
            id="tab-academic"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${activeTab === 'academic' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Calendar className="w-4.5 h-4.5" />
            Academic Term Settings
          </button>

          <button 
            onClick={() => setActiveTab('global_timetables')}
            id="tab-global-timetables"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${activeTab === 'global_timetables' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <LayoutGrid className="w-4.5 h-4.5" />
            Global Timetables
          </button>

          <button 
            onClick={() => setActiveTab('reports')}
            id="tab-reports"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${activeTab === 'reports' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <BarChart3 className="w-4.5 h-4.5" />
            Reports & Diagnostics
          </button>

          <button 
            onClick={() => setActiveTab('backup')}
            id="tab-backup"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${activeTab === 'backup' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Database className="w-4.5 h-4.5" />
            Backup & Restore Data
          </button>

          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <button 
              onClick={() => setPrintMasterPreview(true)}
              id="btn-sidebar-print-master"
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 shadow-3xs transition-all text-left cursor-pointer"
            >
              <Printer className="w-4.5 h-4.5 text-indigo-600" />
              Print Whole School Master
            </button>
            <button 
              onClick={() => {
                setUnitsFilterDept('all');
                setUnitsFilterCourse('all');
                setUnitsFilterModule('all');
                setPrintUnitsPreview(true);
              }}
              id="btn-sidebar-print-units"
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-100 shadow-3xs transition-all text-left cursor-pointer"
            >
              <Printer className="w-4.5 h-4.5 text-indigo-600" />
              Print Units per Module
            </button>
          </div>
        </nav>

        {/* Inner Content Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {/* Quick Statistics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Active Users</span>
              <span className="text-2xl font-bold text-slate-800 mt-1">{activeUsersCount} / {users.length}</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Schedules</span>
              <span className="text-2xl font-bold text-slate-800 mt-1">{timetableEntries.length} Classes</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Active Term</span>
              <span className="text-base font-bold text-indigo-600 mt-2 block truncate">{academicSetting.academicYear} - {academicSetting.semester}</span>
            </div>
            <div className={`p-4 rounded-2xl border shadow-xs ${totalConflicts.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white border-slate-200'}`}>
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Scheduling Conflicts</span>
              <span className={`text-2xl font-bold block mt-1 ${totalConflicts.length > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-800'}`}>
                {totalConflicts.length} Errors
              </span>
            </div>
          </div>

          {/* TAB 1: USER ACCOUNTS */}
          {activeTab === 'users' && (
            <div id="section-users">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 font-display">User Accounts Management</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Create and manage login credentials for Administrators, HODs, and Trainers.</p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setPrintTrainersPreview(true)}
                    id="btn-print-trainers"
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm transition-all cursor-pointer shadow-3xs"
                  >
                    <Printer className="w-4 h-4" />
                    Print Trainer Contacts
                  </button>
                  <button
                    onClick={() => openUserModal()}
                    id="btn-add-user"
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add User Account
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-auto max-h-[65vh]">
                  <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50 sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Name & Username</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">System Role</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Department Association</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Status</th>
                      <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {users.map((u) => {
                      const dept = departments.find(d => d.id === u.departmentId);
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <span className="font-semibold text-slate-800 block">{u.name}</span>
                              <div className="space-y-0.5">
                                <span className="text-xs text-slate-400 font-mono block">username: {u.username}</span>
                                {u.code && (
                                  <span className="text-[11px] text-indigo-600 font-bold font-mono block">timetable code: {u.code}</span>
                                )}
                                {u.phone && (
                                  <span className="text-[11px] text-slate-500 font-medium font-mono block">phone: {u.phone}</span>
                                )}
                                {u.email && (
                                  <span className="text-[11px] text-slate-500 font-medium font-mono block">email: {u.email}</span>
                                )}
                                {u.nationalId && (
                                  <span className="text-[11px] text-slate-500 font-medium font-mono block">national ID: {u.nationalId}</span>
                                )}
                                {u.pfNumber && (
                                  <span className="text-[11px] text-slate-500 font-medium font-mono block">PF number: {u.pfNumber}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase border ${
                              u.role === 'admin' ? 'bg-red-50 text-red-700 border-red-100' : 
                              u.role === 'hod' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                              'bg-blue-50 text-blue-700 border-blue-100'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {u.role === 'admin' ? (
                              <span className="text-slate-400 italic">Entire Institution</span>
                            ) : (
                              dept ? `${dept.name} (${dept.code})` : <span className="text-red-400">Not Assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleUserActive(u)}
                              className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
                              title={u.isActive ? "Deactivate User" : "Activate User"}
                            >
                              {u.isActive ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                                  <ToggleRight className="w-6 h-6 text-emerald-500 shrink-0" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
                                  <ToggleLeft className="w-6 h-6 text-slate-300 shrink-0" /> Inactive
                                </span>
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleResetUserPassword(u)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
                                title="Reset Password"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => openUserModal(u)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                                title="Edit User Account"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-red-500 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all cursor-pointer"
                                title="Delete User Account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

          {/* TAB 2: DEPARTMENTS */}
          {activeTab === 'departments' && (
            <div id="section-departments">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 font-display">Academic Departments</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Configure institutional departments, forming the administrative scope for HOD timetables.</p>
                </div>
                <button
                  onClick={() => openDeptModal()}
                  id="btn-add-dept"
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Department
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {departments.map((d) => {
                  const courseCount = courses.filter(c => c.departmentId === d.id).length;
                  const hod = users.find(u => u.role === 'hod' && u.departmentId === d.id);
                  return (
                    <div key={d.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-mono font-bold text-slate-600 border border-slate-200">
                            {d.code}
                          </span>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => openDeptModal(d)}
                              className="p-1.5 rounded-lg border border-slate-100 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteDept(d.id)}
                              className="p-1.5 rounded-lg border border-slate-100 hover:border-red-400 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">{d.name}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-1">ID: {d.id}</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Programs:</span>
                          <span className="font-semibold text-slate-700">{courseCount} Active</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Head (HOD):</span>
                          <span className="font-semibold text-indigo-600">{hod ? hod.name : 'Unassigned'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: COURSES / PROGRAMS */}
          {activeTab === 'courses' && (
            <div id="section-courses">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 font-display">Courses & Programs of Study</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Manage the curriculums offered under specific academic departments.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      setUnitsFilterDept('all');
                      setUnitsFilterCourse('all');
                      setUnitsFilterModule('all');
                      setPrintUnitsPreview(true);
                    }}
                    id="btn-admin-print-units-header"
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-semibold text-sm transition-all shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    Print Units per Module
                  </button>
                  <button
                    onClick={() => openCourseModal()}
                    id="btn-add-course"
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Course
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-auto max-h-[65vh]">
                  <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50 sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Code</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Course Title</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Department</th>
                      <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Registered Units</th>
                      <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {courses.map((c) => {
                      const dept = departments.find(d => d.id === c.departmentId);
                      const unitCount = units.filter(u => u.courseId === c.id).length;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-slate-700 bg-slate-100 py-0.5 px-2 rounded text-xs border border-slate-200">
                              {c.code}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800">{c.name}</td>
                          <td className="px-6 py-4 text-slate-500">{dept ? dept.name : <span className="text-red-400">Missing</span>}</td>
                          <td className="px-6 py-4 font-semibold text-slate-600">{unitCount} subjects</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => openCourseModal(c)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteCourse(c.id)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:border-red-500 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

          {/* TAB 4: CLASSROOMS & LABS */}
          {activeTab === 'classrooms' && (
            <div id="section-classrooms">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 font-display">Classrooms & Laboratories</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Define rooms, computer labs, and specialized workshops available for slot schedules.</p>
                </div>
                <button
                  onClick={() => openClassroomModal()}
                  id="btn-add-classroom"
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Classroom
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {classrooms.map((room) => {
                  const bookedCount = timetableEntries.filter(e => e.classroomId === room.id).length;
                  return (
                    <div key={room.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                            room.type === 'laboratory' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                            room.type === 'workshop' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}>
                            {room.type}
                          </span>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => openClassroomModal(room)}
                              className="p-1.5 rounded-lg border border-slate-100 hover:border-blue-400 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClassroom(room.id)}
                              className="p-1.5 rounded-lg border border-slate-100 hover:border-red-400 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">{room.name}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Capacity: {room.capacity} students</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                        <span>Current Reservations:</span>
                        <span className={`font-semibold ${bookedCount > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {bookedCount} slots booked
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: ACADEMIC SETTINGS */}
          {activeTab === 'academic' && (
            <div id="section-academic" className="max-w-xl">
              <h2 className="text-2xl font-bold text-slate-800 font-display mb-2">Academic Term Settings</h2>
              <p className="text-sm text-slate-400 mb-6">Set the global academic year and active term. Changing this propagates updates dynamically across all schedules.</p>
              
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  alert("Academic Settings saved successfully!");
                }} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Active Academic Year</label>
                    <input
                      type="text"
                      required
                      value={academicSetting.academicYear}
                      onChange={(e) => onUpdateAcademicSetting({ ...academicSetting, academicYear: e.target.value })}
                      placeholder="e.g. 2026/2027"
                      className="block w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Active Term</label>
                    <select
                      value={academicSetting.semester}
                      onChange={(e) => onUpdateAcademicSetting({ ...academicSetting, semester: e.target.value })}
                      className="block w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                    >
                      <option value="Term 1">Term 1</option>
                      <option value="Term 2">Term 2</option>
                      <option value="Term 3">Term 3</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="py-2.5 px-5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white text-sm transition-all cursor-pointer"
                    >
                      Apply Term Settings
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

           {/* TAB 6: GLOBAL TIMETABLES VIEW */}
          {activeTab === 'global_timetables' && (
            <div id="section-global-timetables">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 font-display">Global Timetables Auditor</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Review all department timetables, audit publish states, and inspect detected scheduling conflicts across the entire college.</p>
                </div>
                <div className="flex shrink-0">
                  <button
                    onClick={() => setPrintMasterPreview(true)}
                    id="btn-print-master-college"
                    className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs shadow-sm shadow-indigo-100 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Print College Master Timetable
                  </button>
                </div>
              </div>

              {/* Filtering bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => {
                      setSelectedDeptId(e.target.value);
                      setSelectedCourseId(''); // Reset course
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500/20"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter by Specific Course</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500/20"
                  >
                    <option value="">-- All Departmental Programs --</option>
                    {courses.filter(c => c.departmentId === selectedDeptId).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Module Section</label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500/20"
                  >
                    <option value="Module 1">Module 1</option>
                    <option value="Module 2">Module 2</option>
                    <option value="Module 3">Module 3</option>
                    <option value="Module 4">Module 4</option>
                    <option value="Module 5">Module 5</option>
                    <option value="Module 6">Module 6</option>
                    <option value="Module 7">Module 7</option>
                  </select>
                </div>
              </div>

              {/* Conflicts notification dashboard */}
              {totalConflicts.length > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-900 print:hidden">
                  <div className="flex items-center gap-2 mb-2 font-bold text-sm text-amber-800">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                    <span>{totalConflicts.length} Active System Conflicts Detected</span>
                  </div>
                  <ul className="text-xs space-y-1 list-disc list-inside text-amber-700 max-h-36 overflow-y-auto">
                    {totalConflicts.map((c, idx) => (
                      <li key={idx}>{c.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Schedule Grid */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-auto max-h-[70vh]">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono w-24">Day</th>
                        {timeSlots.map(ts => (
                          <th key={ts.id} className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            Slot {ts.id}
                            <span className="block font-sans text-[10px] font-medium text-slate-400 capitalize">{ts.label}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-sans">
                      {daysOfWeek.map(day => (
                        <tr key={day} className="hover:bg-slate-50/30">
                          <td className="px-4 py-4 font-bold text-slate-900 bg-slate-50/50">{day}</td>
                          {timeSlots.map(ts => {
                            const data = getCellContent(day, ts.id);
                            return (
                              <td key={ts.id} className="px-4 py-4 align-top w-1/5 min-w-[150px] relative border-r border-slate-100 last:border-r-0">
                                {data ? (
                                  <div className={`p-2.5 rounded-xl border flex flex-col justify-between h-full ${
                                    data.conflicts.length > 0 
                                      ? `bg-red-50/50 border-red-200 text-red-900 ${
                                          data.entry.isPublished 
                                            ? 'print:bg-emerald-50/30 print:border-emerald-100 print:text-slate-800' 
                                            : 'print:bg-indigo-50/30 print:border-indigo-100 print:text-slate-800'
                                        }`
                                      : data.entry.isPublished 
                                        ? 'bg-emerald-50/30 border-emerald-100 text-slate-800' 
                                        : 'bg-indigo-50/30 border-indigo-100 text-slate-800'
                                  }`}>
                                    <div>
                                      <div className="flex items-center justify-between gap-1 mb-1.5">
                                        <span className="font-mono font-extrabold text-[12px] sm:text-[13px] uppercase text-slate-950 tracking-wider bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate" title={data.unit?.name}>
                                          {data.unit?.code}
                                        </span>
                                        <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-full uppercase shrink-0 ${
                                          data.entry.isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                          {data.entry.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                      </div>
                                      <span className="font-semibold text-slate-800 block leading-tight truncate" title={data.unit?.name}>
                                        {data.unit?.name}
                                      </span>
                                      <span className="text-[10px] text-indigo-600 block mt-1 truncate" title={data.trainer?.name}>
                                        👤 {data.trainer?.name}
                                      </span>
                                      <span className="text-[10px] text-slate-500 block mt-0.5 truncate" title={data.room?.name}>
                                        🏢 {data.room?.name}
                                      </span>
                                      {selectedCourseId === '' && (
                                        <span className="text-[9px] text-slate-400 block mt-1 italic">
                                          Course: {data.course?.code}
                                        </span>
                                      )}
                                    </div>

                                    {/* Warnings list on the cell */}
                                    {data.conflicts.length > 0 && (
                                      <div className="mt-2 pt-1.5 border-t border-red-100 flex flex-col gap-1 print:hidden">
                                        {data.conflicts.map((conf, idx) => (
                                          <div key={idx} className="flex items-start gap-1 text-[9px] font-semibold text-red-600 leading-tight">
                                            <ShieldAlert className="w-3 h-3 shrink-0 text-red-500 mt-0.5" />
                                            <span>{conf.type.replace(/_/g, ' ')}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-300 italic block py-3 text-center print:hidden">No assigned classes</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: REPORTS & METRICS */}
          {activeTab === 'reports' && (
            <div id="section-reports">
              <h2 className="text-2xl font-bold text-slate-800 font-display mb-1">Reports & Diagnostics</h2>
              <p className="text-sm text-slate-400 mb-8">Inspect trainer workload density, classroom assignment capacity rates, and structural scheduler health.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Trainer Hours */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-500" />
                    Trainer Weekly Teaching Load
                  </h3>
                  <div className="space-y-4">
                    {getTrainerWorkload().map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span className="font-semibold">{item.name}</span>
                          <span className="font-mono font-bold text-indigo-600">{item.hours} hours / week</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all" 
                            style={{ width: `${Math.min((item.hours / 24) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Estimated slots scheduled: {item.hours / 2}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Classroom Utilization */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                  <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                    <School className="w-5 h-5 text-indigo-500" />
                    Classroom Booking Utilization Rates
                  </h3>
                  <div className="space-y-4">
                    {getClassroomUtilization().map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span className="font-semibold">{item.name} <span className="text-[10px] font-mono text-slate-400 uppercase font-normal">({item.type})</span></span>
                          <span className="font-mono font-bold text-emerald-600">{item.rate}% Booking</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              item.rate > 80 ? 'bg-amber-500' : item.rate > 50 ? 'bg-indigo-500' : 'bg-emerald-500'
                            }`} 
                            style={{ width: `${item.rate}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">Allocated out of 20 total weekly teaching slots</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Curriculum Modules Breakdown */}
                <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5 flex-1">
                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-500" />
                      Curriculum Subjects by Module Section
                    </h3>
                    <p className="text-xs text-slate-400">
                      Print or view the grouping of all {units.length} subjects in Kitutu Chache TVC curriculum, sorted by standard Module 1 through Module 7 sections.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5', 'Module 6', 'Module 7'].map(mod => {
                        const count = units.filter(u => u.module === mod).length;
                        if (count === 0) return null;
                        return (
                          <span key={mod} className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            {mod}: <strong>{count}</strong>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUnitsFilterDept('all');
                      setUnitsFilterCourse('all');
                      setUnitsFilterModule('all');
                      setPrintUnitsPreview(true);
                    }}
                    id="btn-admin-print-units-reports-tab"
                    className="inline-flex items-center gap-2 py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Printer className="w-4 h-4" />
                    Print Units per Module Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div id="section-backup" className="max-w-xl">
              <h2 className="text-2xl font-bold text-slate-800 font-display mb-1">System Database Maintenance</h2>
              <p className="text-sm text-slate-400 mb-6">Backup full college settings, schedules, accounts and preferences to a local JSON file, or restore existing backup states instantly.</p>

              {backupMessage.text && (
                <div className={`mb-6 p-4 rounded-xl border text-sm flex items-start gap-2.5 ${
                  backupMessage.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                }`}>
                  {backupMessage.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                  )}
                  <span>{backupMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1 flex items-center gap-2">
                      <Download className="w-5 h-5 text-indigo-500" />
                      Create System Backup
                    </h3>
                    <p className="text-sm text-slate-500">
                      Downloads the entire active state of the Kitutu Chache Technical and Vocational College timetable database—including users, credentials, departments, classroom definitions, and active timetables—as a structured JSON backup file.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <button
                      onClick={handleBackupDownload}
                      id="btn-download-backup"
                      className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download JSON Backup
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg mb-1 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-indigo-500" />
                      Restore System from Backup File
                    </h3>
                    <p className="text-sm text-slate-500">
                      Upload an existing `.json` backup file generated from this system to restore Kitutu Chache Technical and Vocational College timetable data. Warning: This will override any current data in the browser's persistent cache.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <label className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-all shadow-sm cursor-pointer">
                      <Upload className="w-4 h-4" />
                      Select JSON Backup File
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={handleRestoreUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* USER MODAL */}
      {showUserModal && (
        <div id="modal-user" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 shrink-0">
              <h3 className="font-bold font-display text-lg text-slate-800">
                {editingUser ? `Edit Account: ${editingUser.name}` : 'Create New User Account'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Provide full name, credential, and system access levels.</p>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. Dr. Jane Smith"
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="e.g. jsmith"
                    className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Password</label>
                  <input
                    type="text"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="password123"
                    className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">System Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-700 text-sm"
                >
                  <option value="trainer">Trainer (Teacher)</option>
                  <option value="hod">Head of Department (HOD)</option>
                  <option value="admin">Administrator (Super Admin)</option>
                </select>
              </div>

              {userForm.role !== 'admin' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    {userForm.role === 'hod' ? 'Assigned Department' : 'Primary Department'}
                  </label>
                  <select
                    value={userForm.departmentId}
                    onChange={(e) => setUserForm({ ...userForm, departmentId: e.target.value })}
                    className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-700 text-sm"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {userForm.role !== 'admin' ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Teacher Code
                    </label>
                    <input
                      type="text"
                      value={userForm.code}
                      onChange={(e) => setUserForm({ ...userForm, code: e.target.value })}
                      placeholder="e.g. EA or JSM"
                      maxLength={8}
                      className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                    />
                  </div>
                ) : null}
                <div className={userForm.role === 'admin' ? "col-span-2" : ""}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    placeholder="e.g. +254 712 345"
                    className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="e.g. user@kitcha.ac.ke"
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    National ID Number
                  </label>
                  <input
                    type="text"
                    value={userForm.nationalId}
                    onChange={(e) => setUserForm({ ...userForm, nationalId: e.target.value })}
                    placeholder="e.g. 12345678"
                    className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                    PF / Payroll Number
                  </label>
                  <input
                    type="text"
                    value={userForm.pfNumber}
                    onChange={(e) => setUserForm({ ...userForm, pfNumber: e.target.value })}
                    placeholder="e.g. PF9982"
                    className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="checkbox-is-active"
                    checked={userForm.isActive}
                    onChange={(e) => setUserForm({ ...userForm, isActive: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <label htmlFor="checkbox-is-active" className="text-xs font-semibold text-slate-600">Active Account</label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEPARTMENT MODAL */}
      {showDeptModal && (
        <div id="modal-dept" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold font-display text-lg text-slate-800">
                {editingDept ? 'Edit Department' : 'Create New Department'}
              </h3>
            </div>
            
            <form onSubmit={handleSaveDept} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Computer Science & IT"
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Department Code (Abbreviation)</label>
                <input
                  type="text"
                  required
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  placeholder="e.g. CSIT"
                  maxLength={8}
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COURSE MODAL */}
      {showCourseModal && (
        <div id="modal-course" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold font-display text-lg text-slate-800">
                {editingCourse ? 'Edit Course Program' : 'Create New Course Program'}
              </h3>
            </div>
            
            <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  placeholder="e.g. Diploma in ICT"
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Program Code</label>
                <input
                  type="text"
                  required
                  value={courseForm.code}
                  onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                  placeholder="e.g. DICT"
                  maxLength={8}
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Owning Department</label>
                <select
                  value={courseForm.departmentId}
                  onChange={(e) => setCourseForm({ ...courseForm, departmentId: e.target.value })}
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-700 text-sm"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLASSROOM MODAL */}
      {showClassroomModal && (
        <div id="modal-classroom" className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold font-display text-lg text-slate-800">
                {editingClassroom ? 'Edit Physical Classroom' : 'Create New Physical Classroom'}
              </h3>
            </div>
            
            <form onSubmit={handleSaveClassroom} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Classroom Name / Room No.</label>
                <input
                  type="text"
                  required
                  value={classroomForm.name}
                  onChange={(e) => setClassroomForm({ ...classroomForm, name: e.target.value })}
                  placeholder="e.g. Computer Lab 1"
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Student Seating Capacity</label>
                <input
                  type="number"
                  required
                  value={classroomForm.capacity}
                  onChange={(e) => setClassroomForm({ ...classroomForm, capacity: Number(e.target.value) })}
                  placeholder="40"
                  min={10}
                  max={200}
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Facility Classification</label>
                <select
                  value={classroomForm.type}
                  onChange={(e) => setClassroomForm({ ...classroomForm, type: e.target.value as any })}
                  className="block w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50/50 text-slate-700 text-sm"
                >
                  <option value="classroom">Standard Lecture Room</option>
                  <option value="laboratory">Computer Laboratory</option>
                  <option value="workshop">Heavy Engineering Workshop</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClassroomModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Save Classroom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UserProfileModal
        currentUser={currentUser}
        users={users}
        departments={departments}
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSaveUsers={onUpdateUsers}
      />

    </div>
  );
}
