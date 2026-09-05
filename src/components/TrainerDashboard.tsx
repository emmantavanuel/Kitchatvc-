import React, { useState } from 'react';
import { 
  User, Department, Course, Classroom, Unit, TimetableEntry, AcademicSetting, DayOfWeek, TrainerSlotPreference, AvailabilityType, CourseGroup 
} from '../types';
import { TIME_SLOTS } from '../data/seedData';
import { formatCombinedBadges } from '../utils/scheduler';
import { 
  Calendar, Clock, Star, HelpCircle, Check, X, Printer, ShieldAlert, CheckCircle2, GraduationCap
} from 'lucide-react';
import kitchaLogo from '../assets/images/kitcha_tvc_logo.jpg';
import UserProfileModal from './UserProfileModal';

interface TrainerDashboardProps {
  currentUser: User;
  users: User[];
  departments: Department[];
  courses: Course[];
  classrooms: Classroom[];
  units: Unit[];
  courseGroups?: CourseGroup[];
  timetableEntries: TimetableEntry[];
  trainerPreferences: TrainerSlotPreference[];
  academicSetting: AcademicSetting;
  onUpdateTrainerPreferences: (prefs: TrainerSlotPreference[]) => void;
  onUpdateUsers: (users: User[]) => void;
  onLogout: () => void;
}

type TabType = 'my_timetable' | 'my_avail' | 'units_per_module';

const PrintSignatureBlock = () => (
  <div className="print-signature-block mt-4 pt-3 border-t border-slate-200 grid grid-cols-3 gap-4 text-xs font-mono font-semibold text-slate-700 print:text-black print:mt-1 print:pt-1.5 print:border-t-2 print:border-slate-800 print:gap-6 print:text-[9.5pt] break-inside-avoid print:break-inside-avoid shrink-0 print:pb-0">
    {/* PREPARED BY */}
    <div className="space-y-2 print:space-y-1">
      <p className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider print:border-black print:text-black print:text-[10pt] print:pb-0.5 whitespace-nowrap">
        PREPARED BY : TIMETABLER
      </p>
      <div className="space-y-2.5 print:space-y-1">
        <div className="flex items-end print:h-7">
          <span className="shrink-0 print:text-[10pt] print:font-bold">Sign.:</span>
          <span className="flex-1 ml-2 border-b border-slate-400 border-dashed print:border-black print:border-b-2">&nbsp;</span>
        </div>
        <div className="flex items-end print:h-5">
          <span className="shrink-0 print:text-[10pt] print:font-bold">Date:</span>
          <span className="flex-1 ml-2 border-b border-slate-400 border-dashed print:border-black print:border-b-2">&nbsp;</span>
        </div>
      </div>
    </div>

    {/* APPROVED BY */}
    <div className="space-y-2 print:space-y-1">
      <p className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider print:border-black print:text-black print:text-[10pt] print:pb-0.5 whitespace-nowrap">
        APPROVED BY : Q/A
      </p>
      <div className="space-y-2.5 print:space-y-1">
        <div className="flex items-end print:h-7">
          <span className="shrink-0 print:text-[10pt] print:font-bold">Sign.:</span>
          <span className="flex-1 ml-2 border-b border-slate-400 border-dashed print:border-black print:border-b-2">&nbsp;</span>
        </div>
        <div className="flex items-end print:h-5">
          <span className="shrink-0 print:text-[10pt] print:font-bold">Date:</span>
          <span className="flex-1 ml-2 border-b border-slate-400 border-dashed print:border-black print:border-b-2">&nbsp;</span>
        </div>
      </div>
    </div>

    {/* CONFIRMED BY */}
    <div className="space-y-2 print:space-y-1">
      <p className="font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wider print:border-black print:text-black print:text-[10pt] print:pb-0.5 whitespace-nowrap">
        CONFIRMED BY : D/P ACADEMICS
      </p>
      <div className="space-y-2.5 print:space-y-1">
        <div className="flex items-end print:h-7">
          <span className="shrink-0 print:text-[10pt] print:font-bold">Sign.:</span>
          <span className="flex-1 ml-2 border-b border-slate-400 border-dashed print:border-black print:border-b-2">&nbsp;</span>
        </div>
        <div className="flex items-end print:h-5">
          <span className="shrink-0 print:text-[10pt] print:font-bold">Date:</span>
          <span className="flex-1 ml-2 border-b border-slate-400 border-dashed print:border-black print:border-b-2">&nbsp;</span>
        </div>
      </div>
    </div>
  </div>
);

export default function TrainerDashboard({
  currentUser,
  users,
  departments,
  courses,
  classrooms,
  units,
  timetableEntries,
  trainerPreferences,
  academicSetting,
  onUpdateTrainerPreferences,
  onUpdateUsers,
  onLogout
}: TrainerDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('my_timetable');
  const [tempPreferences, setTempPreferences] = useState<TrainerSlotPreference[]>(trainerPreferences);
  const [saveStatus, setSaveStatus] = useState('');
  const [conflictAlerts, setConflictAlerts] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Units Filter/Print States
  const [printUnitsPreview, setPrintUnitsPreview] = useState(false);
  const [unitsFilterDept, setUnitsFilterDept] = useState<string>(currentUser.departmentId || 'all');
  const [unitsFilterCourse, setUnitsFilterCourse] = useState<string>('all');
  const [unitsFilterModule, setUnitsFilterModule] = useState<string>('all');
  const [unitsSearchQuery, setUnitsSearchQuery] = useState('');

  const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = TIME_SLOTS;

  // Filter ONLY published timetable entries assigned to me with valid existing curriculum units
  const myClasses = timetableEntries.filter(e => e.trainerId === currentUser.id && e.isPublished && units.some(u => u.id === e.unitId));
  const uniqueScheduledSlots = new Set(myClasses.map(e => `${e.day}_${e.slotId}`)).size;

  const getShortSemester = (sem: string) => {
    if (!sem) return 'M1';
    return sem.replace(/Module\s*(\d+)/i, 'M$1').replace(/Semester\s*(\d+)/i, 'S$1');
  };

  const getCellDetails = (day: DayOfWeek, slotId: number) => {
    const slotEntries = myClasses.filter(e => e.day === day && e.slotId === slotId);
    if (slotEntries.length === 0) return null;

    const primaryEntry = slotEntries[0];
    const unit = units.find(u => u.id === primaryEntry.unitId);
    // If unit was deleted from schedule or curriculum, do not render slot
    if (!unit) return null;

    const room = classrooms.find(c => c.id === primaryEntry.classroomId);
    const dept = departments.find(d => d.id === primaryEntry.departmentId);
    const primaryCourse = courses.find(c => c.id === primaryEntry.courseId);

    // Collect all level strings across scheduled entries at this slot
    const levelSet = new Set<string>();
    slotEntries.forEach(e => {
      const c = courses.find(item => item.id === e.courseId);
      const code = c?.code || '?';
      const sem = getShortSemester(e.semesterName);
      const grp = e.groupName ? ` - ${e.groupName}` : '';
      levelSet.add(`${code} (${sem}${grp})`);
    });

    const levelBadges = Array.from(levelSet);
    const levelsText = formatCombinedBadges(levelBadges);
    const isCommon = levelBadges.length > 1;

    return {
      entry: primaryEntry,
      entries: slotEntries,
      unit,
      room,
      dept,
      course: primaryCourse,
      levelsText,
      levelBadges,
      isCommon
    };
  };

  // AVAILABILITY PREFERENCES TOGGLE (Cycle: Available -> Preferred -> Unavailable -> Available)
  const handleSlotToggle = (day: DayOfWeek, slotId: number) => {
    const existingIndex = tempPreferences.findIndex(
      p => p.trainerId === currentUser.id && p.day === day && p.slotId === slotId
    );

    let updated = [...tempPreferences];

    if (existingIndex !== -1) {
      const currentType = tempPreferences[existingIndex].type;
      let nextType: AvailabilityType = 'available';

      if (currentType === 'available') nextType = 'preferred';
      else if (currentType === 'preferred') nextType = 'unavailable';
      else nextType = 'available';

      updated[existingIndex] = {
        ...updated[existingIndex],
        type: nextType
      };
    } else {
      // Create new preference record, start cycle at 'preferred'
      updated.push({
        trainerId: currentUser.id,
        day,
        slotId,
        type: 'preferred'
      });
    }

    setTempPreferences(updated);
  };

  const getSlotPreferenceType = (day: DayOfWeek, slotId: number): AvailabilityType => {
    const pref = tempPreferences.find(
      p => p.trainerId === currentUser.id && p.day === day && p.slotId === slotId
    );
    return pref ? pref.type : 'available';
  };

  const handleSavePreferences = () => {
    // Audit if trainer is saving a slot as "unavailable" that is ALREADY assigned by HOD (even if HOD's entry is draft or published)
    const activeAssignments = timetableEntries.filter(e => e.trainerId === currentUser.id);
    const conflictsFound: string[] = [];

    tempPreferences.forEach(p => {
      if (p.trainerId === currentUser.id && p.type === 'unavailable') {
        const assigned = activeAssignments.find(a => a.day === p.day && a.slotId === p.slotId);
        if (assigned) {
          const unit = units.find(u => u.id === assigned.unitId);
          const dept = departments.find(d => d.id === assigned.departmentId);
          conflictsFound.push(
            `HOD assigned you to ${unit?.code || 'Class'} on ${p.day} Slot ${p.slotId} (${dept?.code || 'Dept'}). Marking this slot as Unavailable raises an active conflict flag.`
          );
        }
      }
    });

    onUpdateTrainerPreferences(tempPreferences);
    setConflictAlerts(conflictsFound);
    setSaveStatus('Preferences saved successfully!');
    
    setTimeout(() => {
      setSaveStatus('');
    }, 4000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (printUnitsPreview) {
    const filtered = units.filter(u => {
      const matchDept = u.departmentId === currentUser.departmentId;
      const matchCourse = unitsFilterCourse === 'all' || u.courseId === unitsFilterCourse;
      const matchModule = unitsFilterModule === 'all' || (u.module || 'Unassigned') === unitsFilterModule;
      const matchQuery = !unitsSearchQuery.trim() || 
        u.name.toLowerCase().includes(unitsSearchQuery.toLowerCase()) || 
        u.code.toLowerCase().includes(unitsSearchQuery.toLowerCase());
      return matchDept && matchCourse && matchModule && matchQuery;
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
              <p className="text-xs text-slate-400">Configure filters and print the department curriculum structure.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-slate-200 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-semibold">
              Department: {departments.find(d => d.id === currentUser.departmentId)?.name || 'My Department'}
            </div>

            <select
              value={unitsFilterCourse}
              onChange={(e) => setUnitsFilterCourse(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-slate-700 text-xs focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
            >
              <option value="all">All Programs</option>
              {courses
                .filter(c => c.departmentId === currentUser.departmentId)
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
              <option value="Module 8">Module 8</option>
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
              PRINTED BY: {currentUser.name.toUpperCase()} / TRAINER
            </p>
            <p className="text-xs font-bold text-slate-700 mt-2 border border-slate-800/80 px-4 py-1.5 rounded-lg bg-slate-50 uppercase tracking-wider">
              SUBJECT UNITS REPORT (BY MODULE SECTION)
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-600 mb-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 print:border-slate-300 print:bg-white">
            <div>
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Department Filter</span>
              <span className="text-slate-800 font-mono">
                {departments.find(d => d.id === currentUser.departmentId)?.name || 'My Department'}
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white print:p-0">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-sky-100 to-[#eeddd3] text-slate-800 py-3 px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border-b border-[#d7bdac] print:hidden">
        <div className="flex items-center gap-3">
          <img
            src={kitchaLogo}
            alt="KITCHA TVC Logo"
            className="w-12 h-12 object-contain rounded-full bg-white p-0.5 border border-[#c6aa96]"
            referrerPolicy="no-referrer"
          />
          <div>
            <h1 className="font-bold font-display text-lg sm:text-xl tracking-tight text-slate-900">Kitutu Chache TVC</h1>
            <p className="text-[10px] uppercase font-mono tracking-widest text-[#7c5335]">
              Trainer Portal
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="block text-xs font-semibold text-[#8c5e3c] font-mono">EDUCATOR INSTRUCTOR</span>
            <button 
              onClick={() => setShowProfileModal(true)}
              id="btn-trainer-profile-trigger"
              className="text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              {currentUser.name} <span className="text-[10px] text-indigo-400 font-mono">(Edit Profile)</span>
            </button>
          </div>
          <button 
            onClick={onLogout}
            id="btn-trainer-logout"
            className="py-1.5 px-3.5 rounded-lg border border-[#c6aa96] hover:border-red-400 hover:bg-red-50 text-slate-800 hover:text-red-600 text-xs font-semibold transition-all cursor-pointer bg-white/80"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main shell Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar Nav */}
        <nav className="w-full lg:w-72 bg-white border-r border-slate-200/80 p-5 flex flex-col gap-1 shrink-0 print:hidden">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">Trainer Workspace</span>

          <button 
            onClick={() => setActiveTab('my_timetable')}
            id="tab-my-timetable"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${activeTab === 'my_timetable' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Calendar className="w-4.5 h-4.5" />
            My Class Schedule ({myClasses.length})
          </button>

          <button 
            onClick={() => setActiveTab('units_per_module')}
            id="tab-units-per-module"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${activeTab === 'units_per_module' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <GraduationCap className="w-4.5 h-4.5" />
            Curriculum Units per Module
          </button>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                setUnitsFilterDept(currentUser.departmentId || 'all');
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

        {/* Content Panel */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto w-full max-w-7xl mx-auto print:p-0">
          
          {/* TAB 1: PERSONAL TIMETABLE */}
          {activeTab === 'my_timetable' && (
            <div id="section-my-timetable" className="personal-timetable-sheet">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 font-display">My Class Timetable</h2>
                    <p className="text-sm text-slate-400 mt-0.5">Displays only published classes and schedules assigned by department HODs.</p>
                  </div>

                  <div className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500 font-semibold">Total Hours: <span className="text-indigo-600 font-bold">{uniqueScheduledSlots * 2} Hrs / Week</span> ({uniqueScheduledSlots} slots)</span>
                    <div className="h-4 w-px bg-slate-200" />
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-600 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print Schedule
                    </button>
                  </div>
                </div>

                {/* PRINT ONLY COMPACT BALANCED HEADER */}
                <div className="hidden print:flex print:flex-col print:items-center print:justify-center text-center mb-1 pb-1 border-b border-slate-800 shrink-0">
                  <img
                    src={kitchaLogo}
                    alt="KITCHA TVC Logo"
                    className="w-12 h-12 object-contain mb-0.5"
                    referrerPolicy="no-referrer"
                  />
                  <h1 className="text-base sm:text-lg font-bold font-display uppercase text-slate-900 tracking-tight leading-tight">
                    KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE
                  </h1>
                  <p className="text-[9.5px] uppercase font-mono tracking-wider text-slate-600 mt-0.5 font-semibold">
                    PERSONAL EDUCATOR TIMETABLE SCHEDULE
                  </p>
                  <div className="mt-1 grid grid-cols-4 gap-2 text-[9.5px] font-bold text-slate-800 w-full max-w-2xl mx-auto border border-slate-400 py-0.5 px-2 rounded bg-slate-50">
                    <span>TRAINER: {currentUser.name.toUpperCase()}</span>
                    <span>DEPT: {departments.find(d => d.id === currentUser.departmentId)?.code || 'TECHNICAL'}</span>
                    <span>WORKLOAD: {uniqueScheduledSlots * 2} HRS / WK ({uniqueScheduledSlots} SLOTS)</span>
                    <span>TERM: {academicSetting.academicYear} - {academicSetting.semester}</span>
                  </div>
                </div>
              </div>

              <div className="timetable-grid-wrap bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none my-auto">
                <div className="overflow-auto max-h-[70vh] print:max-h-none print:overflow-visible">
                  <table className="min-w-full border-collapse border border-slate-200 print:border print:border-slate-400 text-xs font-sans table-fixed">
                    <thead className="bg-slate-50 sticky top-0 z-10 print:bg-slate-100">
                      <tr>
                        <th className="border border-slate-200 px-4 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono w-24 print:w-20 print:py-1 print:px-2 print:text-[10px] print:border print:border-slate-400 print:text-black">Day</th>
                        {timeSlots.map(ts => (
                          <th key={ts.id} className="border border-slate-200 px-4 py-3 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider font-mono print:py-1 print:px-2 print:text-[10px] print:border print:border-slate-400 print:text-black">
                            Slot {ts.id}
                            <span className="block font-sans text-[10px] font-medium text-slate-500 capitalize print:text-slate-600 print:text-[8px] print:leading-tight">{ts.label}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 print:divide-slate-400 text-xs">
                      {daysOfWeek.map(day => (
                        <tr key={day} className="hover:bg-slate-50/20 transition-colors">
                          <td className="border border-slate-200 px-4 py-4 font-bold text-slate-900 bg-slate-50/50 print:bg-slate-100 print:border print:border-slate-400 print:text-black print:py-2 print:px-2 print:text-sm print:font-black print:w-20 print:text-center align-middle">{day}</td>
                          {timeSlots.map(ts => {
                            const details = getCellDetails(day, ts.id);
                            return (
                              <td key={ts.id} className="border border-slate-200 px-3 py-3 align-top w-1/5 min-w-[155px] relative print:border print:border-slate-400 print:p-1 print:w-[18%]">
                                {details ? (
                                  <div className={`p-2.5 rounded-xl border print:border-none print:p-0 ${details.isCommon ? 'border-purple-200 bg-purple-50/40 text-slate-800' : 'border-indigo-100 bg-indigo-50/30 text-slate-800'}`}>
                                    <div className="flex items-start justify-between gap-1 mb-1.5 print:mb-0.5">
                                      <div className="leading-tight flex-1">
                                        <span className="font-mono font-black text-[15px] sm:text-[16px] uppercase bg-slate-100 border border-slate-200 py-0.5 px-1.5 rounded text-slate-950 print:bg-transparent print:border-none print:p-0 print:text-[21px] print:font-black print:tracking-tight print:leading-tight inline-block mr-1">
                                          {details.unit?.code}
                                        </span>
                                        {details.entry.groupName && (
                                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1 py-0.5 rounded inline-block mr-1 print:text-black print:border-none print:p-0">
                                            ({details.entry.groupName})
                                          </span>
                                        )}
                                        {details.unit?.name && (
                                          <span className="text-[9.5px] font-medium text-slate-600 print:text-black print:text-[10px] print:font-semibold leading-tight break-words">
                                            ({details.unit.name})
                                          </span>
                                        )}
                                      </div>
                                      {details.isCommon ? (
                                        <span className="text-[8px] font-bold text-purple-700 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded-full uppercase tracking-wider print:hidden shrink-0">
                                          Common ({details.levelBadges.length})
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-indigo-600 font-bold print:hidden shrink-0">
                                          {details.dept?.code} Dept
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-600 font-medium block mt-1 print:text-[8.5px] print:text-slate-800 print:mt-0.5 print:font-semibold print:leading-none">
                                      🏢 {details.room?.name ? details.room.name.replace(/Room\s+/i, '').replace(/Laboratory\s+/i, 'Lab').trim() : '?'}
                                    </span>
                                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 print:border-t print:border-slate-300 print:mt-0.5 print:pt-0.5">
                                      <span className="text-[9px] font-mono font-bold text-indigo-900 uppercase block tracking-tight leading-snug bg-white/90 p-1 rounded border border-indigo-100 print:bg-transparent print:border-none print:p-0 print:text-black print:text-[9.5px] print:font-bold print:leading-tight">
                                        {details.levelsText}
                                      </span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center">
                                    <span className="text-slate-300 italic block py-3 text-center print:hidden">No assigned classes</span>
                                    <span className="hidden print:inline-block print:text-slate-400 print:text-[10px]">&mdash;</span>
                                  </div>
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
          )}

          {activeTab === 'units_per_module' && (
            <div id="section-units-module">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 font-display">Curriculum Subjects by Module</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Explore Kitutu Chache TVC curriculum subjects and weekly hour allocations grouped by standard Module sections.</p>
                </div>
                <button
                  onClick={() => {
                    setPrintUnitsPreview(true);
                  }}
                  id="btn-trainer-print-units-header"
                  className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-semibold text-sm transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  Print Units per Module
                </button>
              </div>

              {/* Filtering Controls */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 mb-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Department */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Department</label>
                    <div className="block w-full rounded-xl border border-slate-200 px-3.5 py-2 bg-slate-100 text-slate-700 text-sm font-medium">
                      {departments.find(d => d.id === currentUser.departmentId)?.name || 'My Department'}
                    </div>
                  </div>

                  {/* Program */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Program / Course</label>
                    <select
                      value={unitsFilterCourse}
                      onChange={(e) => setUnitsFilterCourse(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 px-3.5 py-2 bg-slate-50/50 text-slate-700 text-sm focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
                    >
                      <option value="all">All Programs</option>
                      {courses
                        .filter(c => c.departmentId === currentUser.departmentId)
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                        ))}
                    </select>
                  </div>

                  {/* Module Section */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Module Section</label>
                    <select
                      value={unitsFilterModule}
                      onChange={(e) => setUnitsFilterModule(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 px-3.5 py-2 bg-slate-50/50 text-slate-700 text-sm focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
                    >
                      <option value="all">All Modules</option>
                      <option value="Module 1">Module 1</option>
                      <option value="Module 2">Module 2</option>
                      <option value="Module 3">Module 3</option>
                      <option value="Module 4">Module 4</option>
                      <option value="Module 5">Module 5</option>
                      <option value="Module 6">Module 6</option>
                      <option value="Module 7">Module 7</option>
                      <option value="Module 8">Module 8</option>
                      <option value="Unassigned">Unassigned Modules</option>
                    </select>
                  </div>

                  {/* Search */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Search Subject Name/Code</label>
                    <input
                      type="text"
                      value={unitsSearchQuery}
                      onChange={(e) => setUnitsSearchQuery(e.target.value)}
                      placeholder="e.g. MATH 101"
                      className="block w-full rounded-xl border border-slate-200 px-3.5 py-2 bg-slate-50/50 text-slate-700 text-sm focus:ring-1 focus:ring-indigo-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Main curriculum breakdown list */}
              {(() => {
                const filtered = units.filter(u => {
                  const matchDept = u.departmentId === currentUser.departmentId;
                  const matchCourse = unitsFilterCourse === 'all' || u.courseId === unitsFilterCourse;
                  const matchModule = unitsFilterModule === 'all' || (u.module || 'Unassigned') === unitsFilterModule;
                  const matchQuery = !unitsSearchQuery.trim() || 
                    u.name.toLowerCase().includes(unitsSearchQuery.toLowerCase()) || 
                    u.code.toLowerCase().includes(unitsSearchQuery.toLowerCase());
                  return matchDept && matchCourse && matchModule && matchQuery;
                });

                const uniqueModules = Array.from(new Set(filtered.map(u => u.module || 'Unassigned'))).sort((a, b) => {
                  if (a === 'Unassigned') return 1;
                  if (b === 'Unassigned') return -1;
                  return a.localeCompare(b);
                });

                if (uniqueModules.length === 0) {
                  return (
                    <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl text-slate-400 italic">
                      No matching subjects found in the curriculum database.
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {uniqueModules.map(modName => {
                      const moduleUnits = filtered.filter(u => (u.module || 'Unassigned') === modName);
                      return (
                        <div key={modName} className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
                          <div className="bg-slate-50/80 border-b border-slate-200/60 px-5 py-3.5 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wide">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                              {modName === 'Unassigned' ? 'General / Unassigned Module' : modName}
                            </h3>
                            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100/80 border border-slate-200 px-2 py-0.5 rounded-lg">
                              {moduleUnits.length} subjects • {moduleUnits.reduce((acc, curr) => acc + curr.slotsRequired, 0) * 2} Hrs
                            </span>
                          </div>

                          <div className="overflow-auto max-h-[400px]">
                            <table className="min-w-full divide-y divide-slate-100 text-sm text-slate-700">
                              <thead className="bg-slate-50/40 text-slate-400 uppercase tracking-widest text-[10px] font-bold font-mono">
                                <tr>
                                  <th className="px-5 py-3 text-left">Code</th>
                                  <th className="px-5 py-3 text-left">Subject Title</th>
                                  <th className="px-5 py-3 text-left">Program</th>
                                  <th className="px-5 py-3 text-left">Department</th>
                                  <th className="px-5 py-3 text-left">Slots (Hours/Wk)</th>
                                  <th className="px-5 py-3 text-left">Trainer Assigned</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-600">
                                {moduleUnits.map(unit => {
                                  const pCourse = courses.find(c => c.id === unit.courseId);
                                  const pDept = departments.find(d => d.id === unit.departmentId);
                                  const trainer = users.find(u => u.id === unit.trainerId);
                                  return (
                                    <tr key={unit.id} className="hover:bg-slate-50/30 transition-colors">
                                      <td className="px-5 py-3.5 font-bold font-mono text-slate-950 text-xs">
                                        <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                                          {unit.code}
                                        </span>
                                      </td>
                                      <td className="px-5 py-3.5 font-semibold text-slate-800">{unit.name}</td>
                                      <td className="px-5 py-3.5 text-slate-500">{pCourse ? pCourse.name : 'N/A'}</td>
                                      <td className="px-5 py-3.5 text-slate-500 font-medium">{pDept ? pDept.code : 'N/A'}</td>
                                      <td className="px-5 py-3.5 font-mono font-bold text-slate-700 text-xs">
                                        {unit.slotsRequired} slots ({unit.slotsRequired * 2} Hrs)
                                      </td>
                                      <td className="px-5 py-3.5">
                                        {trainer ? (
                                          <span className="font-semibold text-slate-800">{trainer.name} ({trainer.code || 'N/A'})</span>
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
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

        </main>
      </div>

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
