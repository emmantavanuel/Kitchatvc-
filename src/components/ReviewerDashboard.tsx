import React, { useState } from 'react';
import { 
  User, 
  Department, 
  Course, 
  Classroom, 
  Unit, 
  TimetableEntry, 
  TrainerSlotPreference, 
  AcademicSetting,
  DayOfWeek,
  CourseGroup
} from '../types';
import { 
  Printer, 
  Search, 
  Calendar, 
  Building, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  Clock, 
  LayoutGrid, 
  Layers, 
  FileText, 
  ShieldCheck, 
  Filter, 
  Eye, 
  LogOut,
  ChevronRight,
  Download,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import kitchaLogo from '../assets/images/kitcha_tvc_logo.jpg';
import UserProfileModal from './UserProfileModal';
import { 
  formatSemesterToModule, 
  formatCombinedCourseCode, 
  formatCombinedBadges,
  buildCombinedCohorts,
  getMatchingEntriesForCohortCell
} from '../utils/scheduler';

interface ReviewerDashboardProps {
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
  onUpdateUsers?: (users: User[]) => void;
  onLogout: () => void;
}

type ReviewTab = 'master_grid' | 'departmental' | 'trainers' | 'audit_overview';

export default function ReviewerDashboard({
  currentUser,
  users,
  departments,
  courses,
  classrooms,
  units,
  courseGroups = [],
  timetableEntries,
  trainerPreferences,
  academicSetting,
  onUpdateUsers,
  onLogout
}: ReviewerDashboardProps) {
  const [activeTab, setActiveTab] = useState<ReviewTab>('master_grid');
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Filter States
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [masterGridDensity, setMasterGridDensity] = useState<'codes_only' | 'detailed'>('codes_only');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');

  // Departmental Tab States
  const [deptViewDeptId, setDeptViewDeptId] = useState<string>(departments[0]?.id || '');
  const [deptViewCourseId, setDeptViewCourseId] = useState<string>('');
  const [deptViewSemester, setDeptViewSemester] = useState<string>('Module 1');
  const [deptSelectedGroupId, setDeptSelectedGroupId] = useState<string>('all');
  const [deptLayoutMode, setDeptLayoutMode] = useState<'single_cohort' | 'combined_grid'>('single_cohort');

  // Trainer Tab States
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('');
  const [trainerDeptFilter, setTrainerDeptFilter] = useState<string>('all');
  const [trainerSearchQuery, setTrainerSearchQuery] = useState('');

  // Print Preview Modals
  const [printMasterPreview, setPrintMasterPreview] = useState(false);
  const [printDeptPreview, setPrintDeptPreview] = useState(false);
  const [printAllTrainersPreview, setPrintAllTrainersPreview] = useState(false);

  const daysOfWeek: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    { id: 1, label: '08:00 AM - 10:00 AM' },
    { id: 2, label: '10:00 AM - 12:00 PM' },
    { id: 3, label: '01:00 PM - 03:00 PM' },
    { id: 4, label: '03:00 PM - 05:00 PM' }
  ];

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
    return name.replace(/Room\s+/i, 'R').replace(/Laboratory\s+/i, 'Lab').replace(/Workshop\s+/i, 'WS').trim();
  };

  // Helper to get short semester suffix (e.g. M1)
  const getShortSemester = (sem: string) => {
    const mapped = formatSemesterToModule(sem);
    return mapped
      .replace(/Module\s+(\d+)/i, 'M$1')
      .replace(/Semester\s+(\d+)/i, 'S$1')
      .replace(/\s+/g, '');
  };

  // Active trainers
  const allTrainers = users.filter(u => (u.role === 'trainer' || u.role === 'hod') && u.isActive);
  const activeTrainer = allTrainers.find(t => t.id === selectedTrainerId) || allTrainers[0];

  // Initialize dept view course
  React.useEffect(() => {
    const deptCourses = courses.filter(c => c.departmentId === deptViewDeptId);
    if (deptCourses.length > 0 && (!deptViewCourseId || !deptCourses.some(c => c.id === deptViewCourseId))) {
      setDeptViewCourseId(deptCourses[0].id);
    }
  }, [deptViewDeptId, courses]);

  // Set initial selected trainer
  React.useEffect(() => {
    if (!selectedTrainerId && allTrainers.length > 0) {
      setSelectedTrainerId(allTrainers[0].id);
    }
  }, [allTrainers, selectedTrainerId]);

  // Cohorts for Master Grid
  const masterCohorts = buildCombinedCohorts(
    timetableEntries,
    courses,
    units,
    daysOfWeek,
    timeSlots,
    selectedDeptId === 'all' ? undefined : selectedDeptId
  );

  // Filter master cohorts by search query
  const filteredMasterCohorts = masterCohorts.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesCourse = c.courseCode.toLowerCase().includes(q) || c.courseName.toLowerCase().includes(q);
    const matchesGroup = c.groupName ? c.groupName.toLowerCase().includes(q) : false;
    const matchesDept = departments.find(d => d.id === c.departmentId)?.name.toLowerCase().includes(q);
    return matchesCourse || matchesGroup || matchesDept;
  });

  // Departmental cohorts
  const departmentalCourses = courses.filter(c => c.departmentId === deptViewDeptId);
  const currentDept = departments.find(d => d.id === deptViewDeptId);

  // Available groups for current selected course and module
  const activeGroups = courseGroups.filter(
    g => g.courseId === deptViewCourseId && 
         formatSemesterToModule(g.module) === formatSemesterToModule(deptViewSemester)
  );

  // Departmental Combined Cohorts
  const departmentalCohorts = buildCombinedCohorts(
    timetableEntries,
    departmentalCourses,
    units,
    daysOfWeek,
    timeSlots,
    deptViewDeptId
  );

  // Calculate conflict count for auditing
  const calculateTotalConflicts = () => {
    let count = 0;
    const slotTrainerMap = new Map<string, string[]>();
    const slotRoomMap = new Map<string, string[]>();

    timetableEntries.forEach(entry => {
      const pos = `${entry.day}_${entry.slotId}`;
      
      // Trainer overlap
      const trKey = `${pos}_${entry.trainerId}`;
      if (!slotTrainerMap.has(trKey)) slotTrainerMap.set(trKey, []);
      slotTrainerMap.get(trKey)!.push(entry.id);

      // Room overlap
      const rmKey = `${pos}_${entry.classroomId}`;
      if (!slotRoomMap.has(rmKey)) slotRoomMap.set(rmKey, []);
      slotRoomMap.get(rmKey)!.push(entry.id);
    });

    slotTrainerMap.forEach(entries => {
      if (entries.length > 1) count++;
    });
    slotRoomMap.forEach(entries => {
      if (entries.length > 1) count++;
    });

    return count;
  };

  const totalClashes = calculateTotalConflicts();

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // CSV Export for Master Grid (Codes Only)
  const exportMasterGridCSV = () => {
    let csv = `KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE\n`;
    csv += `OFFICIAL COMBINED MASTER TIMETABLE (CODES ONLY)\n`;
    csv += `Academic Year: ${academicSetting.academicYear} | Term: ${academicSetting.semester}\n`;
    csv += `Export Date: ${new Date().toLocaleDateString()}\n\n`;

    csv += `Day,Course / Cohort,Slot 1 (08:00 - 10:00),Slot 2 (10:00 - 12:00),Slot 3 (01:00 - 03:00),Slot 4 (03:00 - 05:00)\n`;

    daysOfWeek.forEach(day => {
      filteredMasterCohorts.forEach(cohort => {
        const cohortLabel = `${cohort.courseCode} (${getShortSemester(cohort.semesterName)}${cohort.groupName ? ` - ${cohort.groupName}` : ''})`;
        const rowCells = timeSlots.map(ts => {
          const matchingEntries = getMatchingEntriesForCohortCell(timetableEntries, cohort, day, ts.id, units);
          if (matchingEntries.length === 0) return '-';
          const items = matchingEntries.map(entry => {
            const unit = units.find(u => u.id === entry.unitId);
            const trainer = users.find(u => u.id === entry.trainerId);
            const room = classrooms.find(c => c.id === entry.classroomId);
            const grp = entry.groupName ? ` (${entry.groupName})` : '';
            return `${unit?.code || '?'} [${getTrainerInitials(trainer?.name || '?', trainer)} / ${getRoomCode(room?.name || '?')}]${grp}`;
          });
          return `"${items.join(' & ')}"`;
        });
        csv += `"${day}","${cohortLabel}",${rowCells.join(',')}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `KTVC_Master_Timetable_Grid_${academicSetting.academicYear.replace('/', '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reusable Print Header
  const PrintHeader = ({ title, subtitle, meta }: { title: string; subtitle: string; meta?: React.ReactNode }) => (
    <div className="text-center pb-3 border-b-2 border-slate-800 mb-4 flex flex-col items-center justify-center print:pb-1.5 print:mb-2 print:border-b-2 print:border-black shrink-0 master-grid-header">
      <img
        src={kitchaLogo}
        alt="KITCHA TVC Logo"
        className="w-16 h-16 object-contain mb-1.5 print:w-11 print:h-11 print:mb-0.5"
        referrerPolicy="no-referrer"
      />
      <h1 className="text-xl font-bold font-display uppercase tracking-tight text-slate-950 print:text-[12.5pt] print:leading-tight">
        KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE
      </h1>
      <p className="text-xs uppercase font-mono tracking-widest text-indigo-600 font-bold mt-1 print:text-[8.5pt] print:mt-0.5 print:text-indigo-900">
        {title}
      </p>
      {subtitle && <p className="text-[10px] text-slate-500 font-medium print:text-[7.5pt]">{subtitle}</p>}
      {meta && (
        <div className="mt-2.5 flex flex-wrap justify-between items-center text-xs text-slate-700 font-semibold gap-2 max-w-2xl w-full mx-auto font-mono bg-slate-50 border border-slate-200 p-2.5 rounded-xl print:bg-slate-50 print:border print:border-slate-300 print:mt-1 print:p-1.5 print:text-[7.5pt] print:max-w-none">
          {meta}
        </div>
      )}
    </div>
  );

  // Reusable Signature Block
  const PrintSignatures = () => (
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

  // MASTER PRINT PREVIEW MODAL
  if (printMasterPreview) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6 print:bg-white print:p-0">
        <div className="max-w-7xl mx-auto mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white">
              🖨️
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Print Preview: Combined Master Grid (Codes Only)</h2>
              <p className="text-xs text-slate-400">Standard institutional matrix format for all departments and cohorts.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              Print Now
            </button>
            <button
              onClick={() => setPrintMasterPreview(false)}
              className="inline-flex items-center gap-2 py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
          <PrintHeader 
            title="INSTITUTIONAL COMBINED MASTER TIMETABLE (CODES ONLY)"
            subtitle="OFFICIAL ACADEMIC SCHEDULE AUDIT AND VERIFICATION SHEET"
            meta={
              <>
                <span>DEPARTMENTS: {selectedDeptId === 'all' ? 'ALL ACADEMIC DEPARTMENTS' : departments.find(d => d.id === selectedDeptId)?.name.toUpperCase()}</span>
                <span>REVIEWER: {currentUser.name.toUpperCase()}</span>
                <span>ACADEMIC TERM: {academicSetting.academicYear} - {academicSetting.semester}</span>
              </>
            }
          />

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-slate-300 text-xs font-sans print:border-slate-500">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200">
                  <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-800 uppercase font-mono text-[11px] w-28 print:border-slate-500">Day</th>
                  <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-800 uppercase font-mono text-[11px] w-48 print:border-slate-500">Cohort / Group</th>
                  {timeSlots.map(ts => (
                    <th key={ts.id} className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-800 uppercase font-mono text-[11px] print:border-slate-500">
                      Slot {ts.id}
                      <span className="block font-sans text-[9px] font-normal text-slate-500">{ts.label}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 print:divide-slate-400">
                {daysOfWeek.map(day => {
                  const dayCohorts = filteredMasterCohorts;
                  const rowCount = dayCohorts.length;
                  return dayCohorts.map((cohort, index) => {
                    const isFirstRow = index === 0;
                    return (
                      <tr key={`${day}_${cohort.key}`} className="hover:bg-slate-50/50">
                        {isFirstRow && (
                          <td 
                            rowSpan={rowCount} 
                            className="border border-slate-300 px-3 py-2 font-bold text-slate-900 bg-slate-50 align-middle text-sm text-center font-display uppercase print:border-slate-500 print:bg-slate-100"
                          >
                            {day}
                          </td>
                        )}
                        <td className="border border-slate-300 px-3 py-2 font-bold text-slate-800 font-mono text-xs bg-slate-50/30 print:border-slate-500">
                          {cohort.courseCode} <span className="text-[10px] text-slate-600 font-sans font-semibold">({getShortSemester(cohort.semesterName)}{cohort.groupName ? ` • ${cohort.groupName}` : ''})</span>
                        </td>
                        {timeSlots.map(ts => {
                          const matchingEntries = getMatchingEntriesForCohortCell(timetableEntries, cohort, day, ts.id, units);
                          return (
                            <td key={ts.id} className="border border-slate-300 px-2 py-1.5 text-center align-middle w-1/5 min-w-[130px] print:border-slate-500">
                              {matchingEntries.length > 0 ? (
                                <div className="flex flex-col items-center justify-center space-y-1.5 py-0.5">
                                  {matchingEntries.map((entry, idx) => {
                                    const unit = units.find(u => u.id === entry.unitId);
                                    const trainer = users.find(u => u.id === entry.trainerId);
                                    const room = classrooms.find(c => c.id === entry.classroomId);
                                    return (
                                      <div key={entry.id || idx} className={`w-full ${idx > 0 ? 'border-t border-slate-200/80 pt-1' : ''}`}>
                                        <div className="font-mono font-black text-slate-950 text-xs sm:text-[13px] uppercase">
                                          {unit?.code || '?'}
                                        </div>
                                        {entry.groupName && (
                                          <span className="text-[7.5px] font-bold px-1 rounded bg-indigo-50 text-indigo-800">
                                            {entry.groupName}
                                          </span>
                                        )}
                                        <div className="text-[9px] font-bold text-indigo-700 flex items-center justify-center gap-1 mt-0.5">
                                          <span>{getTrainerInitials(trainer?.name || '?', trainer || undefined)}</span>
                                          <span className="text-slate-300">•</span>
                                          <span className="text-slate-600">{getRoomCode(room?.name || '?')}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-slate-300 text-[10px] italic">&mdash;</span>
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

          <PrintSignatures />
        </div>
      </div>
    );
  }

  // ALL TRAINERS BATCH PRINT PREVIEW
  if (printAllTrainersPreview) {
    const trainersToPrint = allTrainers.filter(t => {
      const matchesDept = trainerDeptFilter === 'all' || t.departmentId === trainerDeptFilter;
      const matchesSearch = t.name.toLowerCase().includes(trainerSearchQuery.toLowerCase()) || 
                            (t.code && t.code.toLowerCase().includes(trainerSearchQuery.toLowerCase()));
      return matchesDept && matchesSearch;
    });

    return (
      <div className="min-h-screen bg-slate-100 p-4 sm:p-6 print:bg-white print:p-0">
        <div className="max-w-7xl mx-auto mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white">
              👨‍🏫
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Print All Personal Trainer Schedules</h2>
              <p className="text-xs text-slate-400">Total {trainersToPrint.length} trainer timetable sheets ready for inspection and sign-off.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              Print All Sheets
            </button>
            <button
              onClick={() => setPrintAllTrainersPreview(false)}
              className="inline-flex items-center gap-2 py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-12">
          {trainersToPrint.map((tr) => {
            const trClasses = timetableEntries.filter(e => e.trainerId === tr.id && units.some(u => u.id === e.unitId));
            const trDept = departments.find(d => d.id === tr.departmentId);
            const trSlots = new Set(trClasses.map(e => `${e.day}_${e.slotId}`)).size;
            const trHours = trSlots * 2;

            return (
              <div 
                key={tr.id}
                className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm personal-timetable-sheet print:border-none print:shadow-none print:p-0"
              >
                <PrintHeader
                  title="PERSONAL EDUCATOR TIMETABLE SCHEDULE"
                  subtitle="INDIVIDUAL TEACHING ALLOCATION & WORKLOAD AUDIT SHEET"
                  meta={
                    <>
                      <span>TRAINER: {tr.name.toUpperCase()} ({tr.code || 'NO-CODE'})</span>
                      <span>DEPARTMENT: {trDept ? trDept.name.toUpperCase() : 'GENERAL'}</span>
                      <span>WORKLOAD: {trHours} HRS / WK ({trSlots} SLOTS)</span>
                      <span>TERM: {academicSetting.academicYear} - {academicSetting.semester}</span>
                    </>
                  }
                />

                <div className="timetable-grid-wrap overflow-x-auto print:overflow-visible">
                  <table className="min-w-full border-collapse border border-slate-300 text-xs font-sans print:border-slate-500 table-fixed">
                    <thead>
                      <tr className="bg-slate-100 print:bg-slate-200">
                        <th className="border border-slate-300 px-3 py-2 text-left font-bold text-slate-800 uppercase font-mono w-24 print:border-slate-500">Day</th>
                        {timeSlots.map(ts => (
                          <th key={ts.id} className="border border-slate-300 px-3 py-2 text-center font-bold text-slate-800 uppercase font-mono print:border-slate-500">
                            Slot {ts.id}
                            <span className="block font-sans text-[8px] font-normal text-slate-500">{ts.label}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {daysOfWeek.map(day => (
                        <tr key={day} className="hover:bg-slate-50/50">
                          <td className="border border-slate-300 px-3 py-2 font-bold text-slate-900 bg-slate-50 text-center font-mono print:border-slate-500">
                            {day}
                          </td>
                          {timeSlots.map(ts => {
                            const matchingEntries = trClasses.filter(e => e.day === day && e.slotId === ts.id);
                            const entry = matchingEntries[0];
                            const unit = entry ? units.find(u => u.id === entry.unitId) : null;
                            const room = entry ? classrooms.find(c => c.id === entry.classroomId) : null;

                            const levelSet = new Set<string>();
                            matchingEntries.forEach(e => {
                              const c = courses.find(item => item.id === e.courseId);
                              const code = c?.code || '?';
                              const sem = getShortSemester(e.semesterName);
                              const grp = e.groupName ? ` • ${e.groupName}` : '';
                              levelSet.add(`${code} (${sem}${grp})`);
                            });

                            const levelBadges = Array.from(levelSet);
                            const levelsText = formatCombinedBadges(levelBadges);

                            return (
                              <td key={ts.id} className="border border-slate-300 px-2 py-2 align-top text-center w-1/5 min-w-[130px] print:border-slate-500">
                                {entry && unit ? (
                                  <div className="space-y-1 text-left">
                                    <div className="flex items-start justify-between gap-1 border-b border-slate-100 pb-0.5">
                                      <span className="font-mono font-black text-sm uppercase text-slate-950 print:text-[20px]">
                                        {unit?.code || '?'}
                                      </span>
                                    </div>
                                    {unit?.name && (
                                      <div className="text-[9.5px] text-slate-700 font-medium leading-tight print:text-black print:text-[10px] print:font-semibold">
                                        {unit.name}
                                      </div>
                                    )}
                                    <div className="text-[9px] text-indigo-700 font-bold print:text-slate-800">
                                      ROOM: {room?.name ? room.name.replace(/Room\s+/i, '').replace(/Laboratory\s+/i, 'Lab') : '?'}
                                    </div>
                                    <div className="text-[8.5px] font-mono font-bold text-slate-600 bg-slate-50 px-1 py-0.5 rounded print:text-black print:bg-transparent print:p-0">
                                      {levelsText}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full flex items-center justify-center">
                                    <span className="text-slate-300 text-[10px] italic print:hidden">&mdash;</span>
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

                <PrintSignatures />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* TOP REVIEWER / MANAGER HEADER BAR */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shrink-0 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-slate-950 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-white text-base tracking-tight">
                {currentUser.role === 'manager' ? 'Academic Management & Timetable Suite' : 'Academic Quality & Review Workspace'}
              </h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                currentUser.role === 'manager' 
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {currentUser.role === 'manager' ? 'Academic Manager' : 'Review Officer'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Official timetable view & print suite for Combined Master Grid (Codes Only), Departmental Standard Pages, and Personal Trainer Timetables.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Term: <strong className="text-white">{academicSetting.academicYear} • {academicSetting.semester}</strong></span>
          </div>

          <button
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer border border-slate-700"
          >
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentUser.name}</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-semibold transition-all cursor-pointer border border-red-500/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* NAVIGATION TABS BAR */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-2 flex items-center justify-between gap-4 overflow-x-auto print:hidden shadow-xs">
        <nav className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('master_grid')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'master_grid'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Combined Master Grid (Codes Only)</span>
          </button>

          <button
            onClick={() => setActiveTab('departmental')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'departmental'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Departmental Standard Pages</span>
          </button>

          <button
            onClick={() => setActiveTab('trainers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'trainers'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Personal Trainer Timetables</span>
          </button>

          <button
            onClick={() => setActiveTab('audit_overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'audit_overview'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Quality Audit Overview</span>
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-3xs"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600" />
            <span>Print Current Screen</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT BODY */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto print:p-0">

        {/* ========================================================================= */}
        {/* TAB 1: COMBINED MASTER GRID - CODES ONLY */}
        {/* ========================================================================= */}
        {activeTab === 'master_grid' && (
          <div className="space-y-6">
            {/* Header and Controls */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Combined Master Timetable Grid (Codes Only)</h2>
                <p className="text-xs text-slate-400 mt-0.5">High-density institutional matrix showing code allocations across all streams and module groups.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={exportMasterGridCSV}
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Grid CSV</span>
                </button>

                <button
                  onClick={() => setPrintMasterPreview(true)}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm shadow-indigo-100"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Master View</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 print:hidden">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">-- All Academic Departments --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search Unit / Course / Group</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by code, unit, or group..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Day Filter</label>
                <select
                  value={selectedDayFilter}
                  onChange={(e) => setSelectedDayFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Days (Monday - Friday)</option>
                  {daysOfWeek.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Matrix Density</label>
                <select
                  value={masterGridDensity}
                  onChange={(e) => setMasterGridDensity(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="codes_only">Codes Only (High Density)</option>
                  <option value="detailed">Detailed Cards</option>
                </select>
              </div>
            </div>

            {/* Printable & Interactive Grid */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700 print:hidden">
                <span className="flex items-center gap-2">
                  <span>Displaying {filteredMasterCohorts.length} Active Cohort Streams</span>
                  {selectedDeptId !== 'all' && (
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[10px]">
                      {departments.find(d => d.id === selectedDeptId)?.name}
                    </span>
                  )}
                </span>
                <span className="text-slate-400 font-normal">Format: UNIT [Trainer / Room]</span>
              </div>

              <div className="overflow-x-auto max-h-[75vh]">
                <table className="min-w-full border-collapse border border-slate-200 text-xs font-sans print:border-slate-400">
                  <thead className="sticky top-0 z-10 bg-slate-100 shadow-3xs">
                    <tr className="bg-slate-100 print:bg-slate-200">
                      <th className="border border-slate-200 px-3 py-2.5 text-left font-bold text-slate-700 uppercase font-mono text-[11px] w-28 print:border-slate-400">Day</th>
                      <th className="border border-slate-200 px-3 py-2.5 text-left font-bold text-slate-700 uppercase font-mono text-[11px] w-48 print:border-slate-400">Cohort / Group</th>
                      {timeSlots.map(ts => (
                        <th key={ts.id} className="border border-slate-200 px-3 py-2.5 text-center font-bold text-slate-700 uppercase font-mono text-[11px] print:border-slate-400">
                          Slot {ts.id}
                          <span className="block font-sans text-[9px] font-normal text-slate-500">{ts.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 print:divide-slate-400">
                    {(selectedDayFilter === 'all' ? daysOfWeek : [selectedDayFilter as DayOfWeek]).map(day => {
                      const dayCohorts = filteredMasterCohorts;
                      const rowCount = dayCohorts.length;

                      if (rowCount === 0) {
                        return (
                          <tr key={day}>
                            <td colSpan={6} className="text-center py-8 text-slate-400 italic">
                              No scheduled cohort streams found for {day}.
                            </td>
                          </tr>
                        );
                      }

                      return dayCohorts.map((cohort, index) => {
                        const isFirstRow = index === 0;
                        return (
                          <tr key={`${day}_${cohort.key}`} className="hover:bg-slate-50/50 transition-colors">
                            {isFirstRow && (
                              <td 
                                rowSpan={rowCount} 
                                className="border border-slate-200 px-3 py-2 font-bold text-slate-900 bg-slate-50 align-middle text-sm text-center font-display uppercase print:border-slate-400 print:bg-slate-100"
                              >
                                {day}
                              </td>
                            )}
                            <td className="border border-slate-200 px-3 py-2 font-bold text-slate-800 font-mono text-xs bg-slate-50/30 print:border-slate-400">
                              <span className="text-indigo-950 font-black">{cohort.courseCode}</span>
                              <span className="block text-[10px] text-slate-500 font-sans font-semibold">
                                ({getShortSemester(cohort.semesterName)}{cohort.groupName ? ` • ${cohort.groupName}` : ''})
                              </span>
                            </td>
                            {timeSlots.map(ts => {
                              const matchingEntries = getMatchingEntriesForCohortCell(timetableEntries, cohort, day, ts.id, units);

                              return (
                                <td key={ts.id} className="border border-slate-200 px-2 py-1.5 text-center align-middle w-1/5 min-w-[130px] print:border-slate-400">
                                  {matchingEntries.length > 0 ? (
                                    masterGridDensity === 'codes_only' ? (
                                      <div className="flex flex-col items-center justify-center space-y-1 py-0.5">
                                        {matchingEntries.map((entry, idx) => {
                                          const unit = units.find(u => u.id === entry.unitId);
                                          const trainer = users.find(u => u.id === entry.trainerId);
                                          const room = classrooms.find(c => c.id === entry.classroomId);
                                          return (
                                            <div key={entry.id || idx} className={`w-full ${idx > 0 ? 'border-t border-slate-200/70 pt-1' : ''}`}>
                                              <div className="font-mono font-black text-slate-950 text-xs sm:text-[13px] uppercase tracking-wide">
                                                {unit?.code || '?'}
                                              </div>
                                              {entry.groupName && (
                                                <span className="text-[7.5px] font-bold px-1 rounded bg-indigo-50 text-indigo-800">
                                                  {entry.groupName}
                                                </span>
                                              )}
                                              <div className="text-[9.5px] font-bold text-indigo-700 leading-none flex items-center justify-center gap-1 mt-0.5">
                                                <span className="bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded text-[8.5px]">
                                                  {getTrainerInitials(trainer?.name || '?', trainer || undefined)}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="bg-slate-50 text-slate-600 px-1 py-0.2 rounded text-[8.5px]">
                                                  {getRoomCode(room?.name || '?')}
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5">
                                        {matchingEntries.map((entry, idx) => {
                                          const unit = units.find(u => u.id === entry.unitId);
                                          const trainer = users.find(u => u.id === entry.trainerId);
                                          const room = classrooms.find(c => c.id === entry.classroomId);
                                          return (
                                            <div key={entry.id || idx} className="text-left bg-slate-50/80 p-2 rounded-xl border border-slate-200/60">
                                              <div className="font-mono font-black text-slate-900 text-xs uppercase flex items-center justify-between">
                                                <span>{unit?.code || '?'}</span>
                                                <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-1 rounded">
                                                  {getRoomCode(room?.name || '?')}
                                                </span>
                                              </div>
                                              {entry.groupName && (
                                                <span className="text-[8px] font-bold px-1 rounded bg-indigo-50 text-indigo-700 inline-block mt-0.5">
                                                  {entry.groupName}
                                                </span>
                                              )}
                                              {unit?.name && (
                                                <div className="text-[9.5px] text-slate-600 font-medium truncate">
                                                  {unit.name}
                                                </div>
                                              )}
                                              <div className="text-[9px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                                                <Users className="w-2.5 h-2.5 text-slate-400" />
                                                <span className="truncate">{trainer?.name || '?'}</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )
                                  ) : (
                                    <span className="text-slate-300 text-[10px] italic">&mdash;</span>
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
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: DEPARTMENTAL STANDARD PAGES & GROUP SEPARATED SCHEDULES */}
        {/* ========================================================================= */}
        {activeTab === 'departmental' && (
          <div className="space-y-6">
            {/* Header and Controls */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Departmental Standard Schedules & Groups</h2>
                <p className="text-xs text-slate-400 mt-0.5">Separate itemized schedules for each module group (e.g. Group A, Group B, Group C) and departmental binders.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm shadow-indigo-100"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Department Sheet</span>
                </button>
              </div>
            </div>

            {/* Department and View Mode Switcher */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Department</label>
                <select
                  value={deptViewDeptId}
                  onChange={(e) => setDeptViewDeptId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Layout Mode</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setDeptLayoutMode('single_cohort')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      deptLayoutMode === 'single_cohort' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Single Cohort / Group
                  </button>
                  <button
                    onClick={() => setDeptLayoutMode('combined_grid')}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      deptLayoutMode === 'combined_grid' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    All Cohorts Grid
                  </button>
                </div>
              </div>

              {deptLayoutMode === 'single_cohort' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Course Program</label>
                    <select
                      value={deptViewCourseId}
                      onChange={(e) => setDeptViewCourseId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {departmentalCourses.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Module & Group</label>
                    <div className="flex gap-2">
                      <select
                        value={deptViewSemester}
                        onChange={(e) => setDeptViewSemester(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 px-2 py-2 bg-slate-50/50 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Module 1">Module 1</option>
                        <option value="Module 2">Module 2</option>
                        <option value="Module 3">Module 3</option>
                      </select>

                      {activeGroups.length > 0 && (
                        <select
                          value={deptSelectedGroupId}
                          onChange={(e) => setDeptSelectedGroupId(e.target.value)}
                          className="flex-1 rounded-xl border border-indigo-200 bg-indigo-50/50 text-indigo-800 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="all">All Groups</option>
                          {activeGroups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* SINGLE COHORT / INDIVIDUAL GROUP VIEW */}
            {deptLayoutMode === 'single_cohort' ? (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs departmental-module-sheet print:border-none print:shadow-none print:p-0">
                <PrintHeader
                  title={`${currentDept?.name.toUpperCase()} DEPARTMENTAL TIMETABLE`}
                  subtitle="OFFICIAL PROGRAM TIMETABLE SCHEDULE"
                  meta={
                    <>
                      <span>DEPARTMENT: {currentDept?.name.toUpperCase()} ({currentDept?.code})</span>
                      <span>PROGRAM: {departmentalCourses.find(c => c.id === deptViewCourseId)?.name} ({departmentalCourses.find(c => c.id === deptViewCourseId)?.code})</span>
                      <span>MODULE: {deptViewSemester}</span>
                      {activeGroups.length > 0 && deptSelectedGroupId !== 'all' && (
                        <span className="text-indigo-700 font-black">
                          MODULE GROUP: {activeGroups.find(g => g.id === deptSelectedGroupId)?.name}
                        </span>
                      )}
                    </>
                  }
                />

                {/* Individual Group Selector Banner */}
                {activeGroups.length > 0 && (
                  <div className="mb-6 p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                        👥
                      </span>
                      <div>
                        <h3 className="text-xs font-bold text-indigo-950">
                          Separate Module Groups Active for {deptViewSemester}
                        </h3>
                        <p className="text-[11px] text-indigo-700">
                          Select an individual stream to inspect its isolated timetable schedule:
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setDeptSelectedGroupId('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          deptSelectedGroupId === 'all'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100/50'
                        }`}
                      >
                        All Groups Combined
                      </button>
                      {activeGroups.map(g => (
                        <button
                          key={g.id}
                          onClick={() => setDeptSelectedGroupId(g.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            deptSelectedGroupId === g.id
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-100/50'
                          }`}
                        >
                          {g.name} Schedule
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timetable Matrix */}
                <div className="timetable-grid-wrap overflow-x-auto print:overflow-visible">
                  <table className="min-w-full border-collapse border border-slate-300 text-xs font-sans print:border-slate-500">
                    <thead>
                      <tr className="bg-slate-100 print:bg-slate-200">
                        <th className="border border-slate-300 px-3 py-2.5 text-left font-bold text-slate-800 uppercase font-mono w-28 print:border-slate-500">Day</th>
                        {timeSlots.map(ts => (
                          <th key={ts.id} className="border border-slate-300 px-3 py-2.5 text-center font-bold text-slate-800 uppercase font-mono print:border-slate-500">
                            Slot {ts.id}
                            <span className="block font-sans text-[9px] font-normal text-slate-500">{ts.label}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {daysOfWeek.map(day => (
                        <tr key={day} className="hover:bg-slate-50/50">
                          <td className="border border-slate-300 px-3 py-3 font-bold text-slate-900 bg-slate-50 text-center font-mono print:border-slate-500">
                            {day}
                          </td>
                          {timeSlots.map(ts => {
                            const matchingEntries = timetableEntries.filter(
                              e => e.day === day &&
                                   e.courseId === deptViewCourseId &&
                                   e.semesterName === deptViewSemester &&
                                   e.slotId === ts.id &&
                                   (deptSelectedGroupId === 'all' || e.groupId === deptSelectedGroupId || (activeGroups.find(g => g.id === deptSelectedGroupId)?.name && e.groupName === activeGroups.find(g => g.id === deptSelectedGroupId)?.name))
                            );

                            return (
                              <td key={ts.id} className="border border-slate-300 px-2.5 py-2 align-top text-center w-1/4 min-w-[140px] print:border-slate-500">
                                {matchingEntries.length > 0 ? (
                                  <div className="space-y-1.5">
                                    {matchingEntries.map(entry => {
                                      const unit = units.find(u => u.id === entry.unitId);
                                      const trainer = users.find(u => u.id === entry.trainerId);
                                      const room = classrooms.find(c => c.id === entry.classroomId);

                                      return (
                                        <div key={entry.id} className="bg-slate-50/90 p-2 rounded-xl border border-slate-200 text-left space-y-0.5">
                                          <div className="flex items-center justify-between">
                                            <span className="font-mono font-black text-slate-950 text-xs uppercase">
                                              {unit?.code || '?'}
                                            </span>
                                            {entry.groupName && (
                                              <span className="text-[8.5px] font-bold bg-indigo-100 text-indigo-800 px-1 py-0.2 rounded font-mono">
                                                {entry.groupName}
                                              </span>
                                            )}
                                          </div>
                                          {unit?.name && (
                                            <div className="text-[9.5px] text-slate-600 font-medium truncate">
                                              {unit.name}
                                            </div>
                                          )}
                                          <div className="text-[9px] text-slate-500 font-semibold flex items-center justify-between pt-0.5">
                                            <span className="truncate">{trainer?.name || '?'}</span>
                                            <span className="text-indigo-700 font-bold font-mono">
                                              {getRoomCode(room?.name || '?')}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <span className="text-slate-300 text-[10px] italic">&mdash;</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <PrintSignatures />
              </div>
            ) : (
              /* DEPARTMENTAL COMBINED COHORTS GRID - CONTINUOUS FLOW */
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none space-y-6 print:space-y-0 master-grid-container">
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex justify-between items-center text-xs font-bold text-slate-700 print:hidden">
                  <span>{currentDept?.name} All Active Cohorts Matrix</span>
                  <span className="text-slate-400 font-normal">Includes Grouped & Whole Cohorts</span>
                </div>

                <div className="overflow-x-auto max-h-[75vh] print:max-h-none print:overflow-visible">
                  <table className="min-w-full border-collapse border border-slate-200 text-xs font-sans print:border-slate-400">
                    <thead className="sticky top-0 z-10 bg-slate-100 shadow-3xs print:static">
                      <tr className="bg-slate-100 print:bg-slate-200">
                        <th className="border border-slate-200 px-3 py-2.5 text-left font-bold text-slate-700 uppercase font-mono text-[11px] w-28 print:border-slate-400">Day</th>
                        <th className="border border-slate-200 px-3 py-2.5 text-left font-bold text-slate-700 uppercase font-mono text-[11px] w-48 print:border-slate-400">Cohort / Group</th>
                        {timeSlots.map(ts => (
                          <th key={ts.id} className="border border-slate-200 px-3 py-2.5 text-center font-bold text-slate-700 uppercase font-mono text-[11px] print:border-slate-400">
                            Slot {ts.id}
                            <span className="block font-sans text-[9px] font-normal text-slate-500">{ts.label}</span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 print:divide-slate-400">
                      {daysOfWeek.map(day => (
                        <React.Fragment key={day}>
                          <tr className="master-day-divider bg-slate-200 text-slate-800 print:bg-slate-200 print:text-slate-900 border-y border-slate-300">
                            <td 
                              colSpan={2 + timeSlots.length} 
                              className="master-day-separator px-3 py-1 font-mono font-bold text-[11px] sm:text-xs uppercase tracking-wider text-left bg-slate-200 text-slate-800 print:bg-slate-200 print:text-slate-900"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-slate-900">{day.toUpperCase()}</span>
                                <span className="text-[9.5px] font-semibold text-slate-600 print:text-slate-700 uppercase tracking-normal font-sans">
                                  {departmentalCohorts.length} {departmentalCohorts.length === 1 ? 'Cohort' : 'Cohorts'}
                                </span>
                              </div>
                            </td>
                          </tr>
                          {departmentalCohorts.map((cohort, index) => {
                            const isFirstRow = index === 0;
                            return (
                              <tr 
                                key={`${day}_${cohort.key}`} 
                                className="hover:bg-slate-50/50"
                              >
                                {isFirstRow && (
                                  <td 
                                    rowSpan={departmentalCohorts.length}
                                    className="master-day-vertical border-2 border-slate-300 px-1 py-2 font-black text-slate-900 bg-slate-100/90 align-middle text-center print:border print:border-slate-400 print:bg-slate-100 print:text-black w-12 min-w-[44px] max-w-[56px]"
                                  >
                                    <div className="master-day-vertical-text h-full min-h-full flex flex-col items-center justify-around font-black font-display text-lg sm:text-xl md:text-2xl print:text-2xl tracking-widest text-slate-950 select-none py-2 print:text-black">
                                      {day.toUpperCase().split('').map((char, charIdx) => (
                                        <span key={charIdx} className="my-0.5 sm:my-1 leading-none font-black text-slate-950 print:text-black">
                                          {char}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                )}
                                <td className="border border-slate-200 px-3 py-2 font-bold text-slate-800 font-mono text-xs bg-slate-50/30 print:border-slate-400">
                                  <span className="text-indigo-950 font-black">{cohort.courseCode}</span>
                                  <span className="block text-[10px] text-slate-500 font-sans font-semibold">
                                    ({getShortSemester(cohort.semesterName)}{cohort.groupName ? ` • ${cohort.groupName}` : ''})
                                  </span>
                                </td>
                                {timeSlots.map(ts => {
                                  const matchingEntries = getMatchingEntriesForCohortCell(timetableEntries, cohort, day, ts.id, units);

                                  return (
                                    <td key={ts.id} className="border border-slate-200 px-2 py-1.5 text-center align-middle w-1/5 min-w-[130px] print:border-slate-400">
                                      {matchingEntries.length > 0 ? (
                                        <div className="flex flex-col items-center justify-center space-y-1 py-0.5">
                                          {matchingEntries.map((entry, idx) => {
                                            const unit = units.find(u => u.id === entry.unitId);
                                            const trainer = users.find(u => u.id === entry.trainerId);
                                            const room = classrooms.find(c => c.id === entry.classroomId);
                                            return (
                                              <div key={entry.id || idx} className={`w-full ${idx > 0 ? 'border-t border-slate-200/70 pt-1' : ''}`}>
                                                <div className="font-mono font-black text-slate-950 text-xs sm:text-[13px] uppercase">
                                                  {unit?.code || '?'}
                                                </div>
                                                {entry.groupName && (
                                                  <span className="text-[7.5px] font-bold px-1 rounded bg-indigo-50 text-indigo-800">
                                                    {entry.groupName}
                                                  </span>
                                                )}
                                                <div className="text-[9.5px] font-bold text-indigo-700 flex items-center justify-center gap-1 mt-0.5">
                                                  <span>{getTrainerInitials(trainer?.name || '?', trainer || undefined)}</span>
                                                  <span className="text-slate-300">•</span>
                                                  <span className="text-slate-600">{getRoomCode(room?.name || '?')}</span>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <span className="text-slate-300 text-[10px] italic">&mdash;</span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PERSONAL TRAINER TIMETABLES */}
        {/* ========================================================================= */}
        {activeTab === 'trainers' && (
          <div className="space-y-6">
            {/* Header and Controls */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Personal Educator Timetables</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspection of trainer teaching workload, assigned units, and module groups in brackets.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setPrintAllTrainersPreview(true)}
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Print All Trainers Batch</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm shadow-indigo-100"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Trainer Schedule</span>
                </button>
              </div>
            </div>

            {/* Trainer Selection Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 print:hidden">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Filter by Department</label>
                <select
                  value={trainerDeptFilter}
                  onChange={(e) => setTrainerDeptFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Educator / Trainer</label>
                <select
                  value={selectedTrainerId}
                  onChange={(e) => setSelectedTrainerId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50/50 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {allTrainers
                    .filter(t => trainerDeptFilter === 'all' || t.departmentId === trainerDeptFilter)
                    .map(t => {
                      const d = departments.find(dept => dept.id === t.departmentId);
                      return (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code || 'NO-CODE'}) - {d ? d.code : 'General'}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Search Educator Name</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type name or code..."
                    value={trainerSearchQuery}
                    onChange={(e) => setTrainerSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-700 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Individual Trainer Schedule Card */}
            {activeTrainer ? (() => {
              const trainerClasses = timetableEntries.filter(e => e.trainerId === activeTrainer.id && units.some(u => u.id === e.unitId));
              const trainerDept = departments.find(d => d.id === activeTrainer.departmentId);
              const trainerSlots = new Set(trainerClasses.map(e => `${e.day}_${e.slotId}`)).size;
              const trainerHours = trainerSlots * 2;

              return (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs personal-timetable-sheet print:border-none print:shadow-none print:p-0">
                  <PrintHeader
                    title="PERSONAL EDUCATOR TIMETABLE SCHEDULE"
                    subtitle="INDIVIDUAL TEACHING ALLOCATION & WORKLOAD AUDIT SHEET"
                    meta={
                      <>
                        <span>TRAINER: {activeTrainer.name.toUpperCase()} ({activeTrainer.code || 'NO-CODE'})</span>
                        <span>DEPARTMENT: {trainerDept ? trainerDept.name.toUpperCase() : 'GENERAL'}</span>
                        <span>WORKLOAD: <strong className="text-indigo-900">{trainerHours} HRS / WK</strong> ({trainerSlots} SLOTS)</span>
                        <span>TERM: {academicSetting.academicYear} - {academicSetting.semester}</span>
                      </>
                    }
                  />

                  {/* Workload Summary Bar (Web View) */}
                  <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 print:hidden">
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Weekly Workload</span>
                      <span className="text-lg font-black text-indigo-600 font-mono">{trainerHours} Hrs / Wk</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Slots</span>
                      <span className="text-lg font-black text-slate-800 font-mono">{trainerSlots} Slots</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Timetable Code</span>
                      <span className="text-lg font-black text-slate-800 font-mono">{activeTrainer.code || '—'}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Department</span>
                      <span className="text-sm font-bold text-slate-700 mt-1 block truncate">{trainerDept?.name || 'General'}</span>
                    </div>
                  </div>

                  {/* Weekly Matrix */}
                  <div className="timetable-grid-wrap overflow-x-auto print:overflow-visible">
                    <table className="min-w-full border-collapse border border-slate-300 text-xs font-sans print:border-slate-500 table-fixed">
                      <thead>
                        <tr className="bg-slate-100 print:bg-slate-200">
                          <th className="border border-slate-300 px-3 py-2.5 text-left font-bold text-slate-800 uppercase font-mono w-28 print:border-slate-500">Day</th>
                          {timeSlots.map(ts => (
                            <th key={ts.id} className="border border-slate-300 px-3 py-2.5 text-center font-bold text-slate-800 uppercase font-mono print:border-slate-500">
                              Slot {ts.id}
                              <span className="block font-sans text-[9px] font-normal text-slate-500">{ts.label}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {daysOfWeek.map(day => (
                          <tr key={day} className="hover:bg-slate-50/50">
                            <td className="border border-slate-300 px-3 py-3 font-bold text-slate-900 bg-slate-50 text-center font-mono print:border-slate-500">
                              {day}
                            </td>
                            {timeSlots.map(ts => {
                              const matchingEntries = trainerClasses.filter(e => e.day === day && e.slotId === ts.id);
                              const entry = matchingEntries[0];
                              const unit = entry ? units.find(u => u.id === entry.unitId) : null;
                              const room = entry ? classrooms.find(c => c.id === entry.classroomId) : null;

                              // Format badges with module and group in small brackets
                              const levelSet = new Set<string>();
                              matchingEntries.forEach(e => {
                                const c = courses.find(item => item.id === e.courseId);
                                const code = c?.code || '?';
                                const sem = getShortSemester(e.semesterName);
                                const grp = e.groupName ? ` • ${e.groupName}` : '';
                                levelSet.add(`${code} (${sem}${grp})`);
                              });

                              const levelBadges = Array.from(levelSet);
                              const levelsText = formatCombinedBadges(levelBadges);

                              return (
                                <td key={ts.id} className="border border-slate-300 px-2.5 py-2.5 align-top text-left w-1/4 min-w-[140px] print:border-slate-500">
                                  {entry && unit ? (
                                    <div className="space-y-1.5 bg-slate-50/90 p-2 rounded-xl border border-slate-200/80">
                                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1">
                                        <span className="font-mono font-black text-sm uppercase text-slate-950">
                                          {unit?.code || '?'}
                                        </span>
                                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                                          {getRoomCode(room?.name || '?')}
                                        </span>
                                      </div>

                                      {unit?.name && (
                                        <div className="text-[10px] text-slate-700 font-medium leading-snug">
                                          {unit.name}
                                        </div>
                                      )}

                                      {/* Course & Module Group in brackets in small text */}
                                      <div className="text-[9px] font-mono font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200/60 inline-block">
                                        {levelsText}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-full flex items-center justify-center py-4">
                                      <span className="text-slate-300 text-[10px] italic">&mdash;</span>
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

                  <PrintSignatures />
                </div>
              );
            })() : (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400">
                No active trainers found in the selected department.
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: QUALITY AUDIT OVERVIEW */}
        {/* ========================================================================= */}
        {activeTab === 'audit_overview' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <h2 className="text-xl font-bold text-slate-900 font-display">Academic Quality & Timetable Verification</h2>
              <p className="text-xs text-slate-400 mt-0.5">Comprehensive audit breakdown of institutional rooms, teaching loads, and clash detection.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-indigo-600">Total Timetable Entries</span>
                  <span className="text-2xl font-black text-indigo-950 font-mono mt-1 block">{timetableEntries.length}</span>
                  <span className="text-[11px] text-slate-500">Scheduled classroom sessions</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600">Conflict / Clash Status</span>
                  <span className={`text-2xl font-black font-mono mt-1 block ${totalClashes === 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    {totalClashes === 0 ? '0 Clashes' : `${totalClashes} Clashes`}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {totalClashes === 0 ? 'All rooms & trainers verified safe' : 'Overlapping trainer/room detected'}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Active Educators</span>
                  <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{allTrainers.length}</span>
                  <span className="text-[11px] text-slate-500">Across {departments.length} departments</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">Classrooms & Labs</span>
                  <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">{classrooms.length}</span>
                  <span className="text-[11px] text-slate-500">Capacity verified spaces</span>
                </div>
              </div>
            </div>

            {/* Departmental Workload & Cohort Audit Summary */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-800">
                Departmental Audit Breakdown
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {departments.map(dept => {
                    const deptCourses = courses.filter(c => c.departmentId === dept.id);
                    const deptUnits = units.filter(u => u.departmentId === dept.id);
                    const deptTrainers = allTrainers.filter(t => t.departmentId === dept.id);
                    const deptEntries = timetableEntries.filter(e => e.departmentId === dept.id);

                    return (
                      <div key={dept.id} className="p-4 rounded-2xl bg-slate-50/60 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm">{dept.name}</h3>
                            <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">{dept.code}</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {deptCourses.length} Programs • {deptUnits.length} Subject Units • {deptTrainers.length} Educators
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                            <span className="text-slate-400 text-[10px] block">SCHEDULED SESSIONS</span>
                            <strong className="text-indigo-600 text-sm">{deptEntries.length} Slots</strong>
                          </div>

                          <button
                            onClick={() => {
                              setDeptViewDeptId(dept.id);
                              setActiveTab('departmental');
                            }}
                            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold transition-all cursor-pointer shadow-3xs"
                          >
                            Inspect Department
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          currentUser={currentUser}
          users={users}
          departments={departments}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSaveUsers={(newUsers) => {
            if (onUpdateUsers) {
              onUpdateUsers(newUsers);
            }
            setShowProfileModal(false);
          }}
        />
      )}
    </div>
  );
}
