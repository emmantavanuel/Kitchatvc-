import React, { useState, useMemo } from 'react';
import { 
  User, Department, Course, Classroom, Unit, TimetableEntry, AcademicSetting 
} from '../types';
import { TIME_SLOTS } from '../data/seedData';
import { 
  Users, Printer, Search, Filter, Download, Phone, Mail, 
  BookOpen, Clock, CheckCircle2, AlertTriangle, Briefcase, 
  ChevronDown, ChevronUp, Edit3, X, Eye, FileSpreadsheet, Building2, Shield
} from 'lucide-react';
import kitchaLogo from '../assets/images/kitcha_tvc_logo.jpg';

interface TrainerWorkloadReportProps {
  currentUser: User;
  role: 'admin' | 'hod';
  users: User[];
  departments: Department[];
  courses: Course[];
  classrooms: Classroom[];
  units: Unit[];
  timetableEntries: TimetableEntry[];
  academicSetting: AcademicSetting;
  onUpdateUsers?: (users: User[]) => void;
  onClose?: () => void;
  // If provided, forces HOD to only view this department
  fixedDepartmentId?: string;
}

export interface TrainerWorkloadItem {
  trainer: User;
  department?: Department;
  trainerCode: string;
  phone: string;
  email: string;
  uniqueSlots: number;
  teachingHours: number;
  allocatedUnits: {
    unit: Unit;
    course?: Course;
    isScheduled: boolean;
    scheduledSlotsCount: number;
  }[];
  scheduledSlotDetails: {
    day: string;
    slotId: number;
    slotLabel: string;
    unitCode: string;
    unitName: string;
    courseCode: string;
    roomName: string;
  }[];
}

export default function TrainerWorkloadReport({
  currentUser,
  role,
  users,
  departments,
  courses,
  classrooms,
  units,
  timetableEntries,
  academicSetting,
  onUpdateUsers,
  onClose,
  fixedDepartmentId
}: TrainerWorkloadReportProps) {
  // Enforce HOD limitation: HOD can ONLY view their own department
  const isHod = role === 'hod' || !!fixedDepartmentId;
  const initialDeptId = isHod 
    ? (fixedDepartmentId || currentUser.departmentId || departments[0]?.id || '') 
    : 'all';

  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDeptId);
  const [searchQuery, setSearchQuery] = useState('');
  const [workloadFilter, setWorkloadFilter] = useState<'all' | 'unassigned' | 'light' | 'optimal' | 'heavy'>('all');
  const [expandedTrainerId, setExpandedTrainerId] = useState<string | null>(null);
  const [isPrintPreviewActive, setIsPrintPreviewActive] = useState(false);

  // Quick edit modal for trainer contact & code
  const [editingTrainer, setEditingTrainer] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    code: '',
    phone: '',
    email: '',
    nationalId: '',
    pfNumber: ''
  });

  // Calculate comprehensive workload for each trainer
  const allTrainerData = useMemo<TrainerWorkloadItem[]>(() => {
    // Academic trainers: role is 'trainer' or 'hod'
    const trainersList = users.filter(u => (u.role === 'trainer' || u.role === 'hod') && u.isActive);

    return trainersList.map(trainer => {
      const dept = departments.find(d => d.id === trainer.departmentId);

      // Timetable entries for this trainer with valid, existing units
      const trainerEntries = timetableEntries.filter(
        e => e.trainerId === trainer.id && units.some(u => u.id === e.unitId)
      );

      // Unique slots calculation: simultaneous multi-course classes count as ONE 2-hour teaching slot
      const uniqueSlotKeys = new Set(trainerEntries.map(e => `${e.day}_${e.slotId}`));
      const uniqueSlots = uniqueSlotKeys.size;
      const teachingHours = uniqueSlots * 2;

      // Units allocated either by curriculum assignment or by timetable schedule
      const unitMap = new Map<string, { unit: Unit; course?: Course; isScheduled: boolean; scheduledSlotsCount: number }>();

      // 1. Units where trainerId matches in curriculum
      units.filter(u => u.trainerId === trainer.id).forEach(u => {
        const c = courses.find(item => item.id === u.courseId);
        unitMap.set(u.id, {
          unit: u,
          course: c,
          isScheduled: false,
          scheduledSlotsCount: 0
        });
      });

      // 2. Units where trainer has scheduled entries in timetable
      trainerEntries.forEach(entry => {
        const u = units.find(unitItem => unitItem.id === entry.unitId);
        if (!u) return;

        const c = courses.find(item => item.id === entry.courseId);
        if (unitMap.has(u.id)) {
          const existing = unitMap.get(u.id)!;
          existing.isScheduled = true;
          existing.scheduledSlotsCount += 1;
        } else {
          unitMap.set(u.id, {
            unit: u,
            course: c,
            isScheduled: true,
            scheduledSlotsCount: 1
          });
        }
      });

      const allocatedUnits = Array.from(unitMap.values());

      // Detailed slot schedule
      const scheduledSlotDetails = Array.from(uniqueSlotKeys).map(key => {
        const [day, slotIdStr] = key.split('_');
        const slotId = parseInt(slotIdStr, 10);
        const slotInfo = TIME_SLOTS.find(ts => ts.id === slotId);
        const matchingEntries = trainerEntries.filter(e => e.day === day && e.slotId === slotId);
        const primaryEntry = matchingEntries[0];
        const u = primaryEntry ? units.find(item => item.id === primaryEntry.unitId) : null;
        const c = primaryEntry ? courses.find(item => item.id === primaryEntry.courseId) : null;
        const room = primaryEntry ? classrooms.find(r => r.id === primaryEntry.classroomId) : null;

        return {
          day,
          slotId,
          slotLabel: slotInfo?.label || `Slot ${slotId}`,
          unitCode: u?.code || 'N/A',
          unitName: u?.name || 'Subject',
          courseCode: c?.code || 'All Cohorts',
          roomName: room?.name || 'Classroom'
        };
      }).sort((a, b) => {
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        return a.slotId - b.slotId;
      });

      // Fallback code if not set
      const trainerCode = trainer.code || `TR-${trainer.id.slice(-4).toUpperCase()}`;

      return {
        trainer,
        department: dept,
        trainerCode,
        phone: trainer.phone || '',
        email: trainer.email || '',
        uniqueSlots,
        teachingHours,
        allocatedUnits,
        scheduledSlotDetails
      };
    });
  }, [users, departments, courses, classrooms, units, timetableEntries]);

  // Filter by Department: HOD is locked to their own department
  const departmentFilteredData = useMemo(() => {
    if (isHod) {
      const targetDeptId = fixedDepartmentId || currentUser.departmentId;
      return allTrainerData.filter(item => item.trainer.departmentId === targetDeptId);
    }
    if (selectedDeptId === 'all') {
      return allTrainerData;
    }
    return allTrainerData.filter(item => item.trainer.departmentId === selectedDeptId);
  }, [allTrainerData, isHod, fixedDepartmentId, currentUser.departmentId, selectedDeptId]);

  // Filter by Search Query & Workload Status
  const filteredData = useMemo(() => {
    return departmentFilteredData.filter(item => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.trainer.name.toLowerCase().includes(query);
        const matchesCode = item.trainerCode.toLowerCase().includes(query);
        const matchesPhone = item.phone.toLowerCase().includes(query);
        const matchesEmail = item.email.toLowerCase().includes(query);
        const matchesDept = item.department?.name.toLowerCase().includes(query) || item.department?.code.toLowerCase().includes(query);
        const matchesUnit = item.allocatedUnits.some(
          u => u.unit.code.toLowerCase().includes(query) || u.unit.name.toLowerCase().includes(query)
        );

        if (!matchesName && !matchesCode && !matchesPhone && !matchesEmail && !matchesDept && !matchesUnit) {
          return false;
        }
      }

      // Workload filter
      if (workloadFilter === 'unassigned') {
        return item.teachingHours === 0;
      }
      if (workloadFilter === 'light') {
        return item.teachingHours > 0 && item.teachingHours < 16;
      }
      if (workloadFilter === 'optimal') {
        return item.teachingHours >= 16 && item.teachingHours <= 24;
      }
      if (workloadFilter === 'heavy') {
        return item.teachingHours > 24;
      }

      return true;
    });
  }, [departmentFilteredData, searchQuery, workloadFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalTrainers = departmentFilteredData.length;
    const totalHours = departmentFilteredData.reduce((acc, curr) => acc + curr.teachingHours, 0);
    const avgHours = totalTrainers > 0 ? (totalHours / totalTrainers).toFixed(1) : '0';
    const totalAllocatedUnits = departmentFilteredData.reduce((acc, curr) => acc + curr.allocatedUnits.length, 0);
    const optimalCount = departmentFilteredData.filter(i => i.teachingHours >= 16 && i.teachingHours <= 24).length;
    const lightCount = departmentFilteredData.filter(i => i.teachingHours > 0 && i.teachingHours < 16).length;
    const heavyCount = departmentFilteredData.filter(i => i.teachingHours > 24).length;
    const unassignedCount = departmentFilteredData.filter(i => i.teachingHours === 0).length;

    return {
      totalTrainers,
      totalHours,
      avgHours,
      totalAllocatedUnits,
      optimalCount,
      lightCount,
      heavyCount,
      unassignedCount
    };
  }, [departmentFilteredData]);

  // Current department details
  const activeDepartment = useMemo(() => {
    if (isHod) {
      return departments.find(d => d.id === (fixedDepartmentId || currentUser.departmentId));
    }
    if (selectedDeptId !== 'all') {
      return departments.find(d => d.id === selectedDeptId);
    }
    return null;
  }, [isHod, fixedDepartmentId, currentUser.departmentId, selectedDeptId, departments]);

  // Handle saving trainer contact / code
  const handleSaveTrainerInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer || !onUpdateUsers) return;

    const updated = users.map(u => {
      if (u.id === editingTrainer.id) {
        return {
          ...u,
          code: editForm.code.trim() || undefined,
          phone: editForm.phone.trim() || undefined,
          email: editForm.email.trim() || undefined,
          nationalId: editForm.nationalId.trim() || undefined,
          pfNumber: editForm.pfNumber.trim() || undefined
        };
      }
      return u;
    });

    onUpdateUsers(updated);
    setEditingTrainer(null);
  };

  const openEditModal = (t: User) => {
    setEditingTrainer(t);
    setEditForm({
      code: t.code || '',
      phone: t.phone || '',
      email: t.email || '',
      nationalId: t.nationalId || '',
      pfNumber: t.pfNumber || ''
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    let csv = "S/No,Trainer Name,Trainer Code,Role,Department,Phone,Email,Allocated Units Count,Allocated Units List,Weekly Slots,Weekly Teaching Hours,Status\n";
    
    filteredData.forEach((item, index) => {
      const unitsList = item.allocatedUnits.map(u => `${u.unit.code}: ${u.unit.name}`).join('; ');
      const status = item.teachingHours === 0 ? 'Unassigned' : item.teachingHours < 16 ? 'Light Load' : item.teachingHours <= 24 ? 'Optimal' : 'Heavy Load';
      
      csv += `"${index + 1}",` +
        `"${item.trainer.name.replace(/"/g, '""')}",` +
        `"${item.trainerCode}",` +
        `"${item.trainer.role.toUpperCase()}",` +
        `"${item.department ? item.department.name.replace(/"/g, '""') : 'Unassigned'}",` +
        `"${item.phone}",` +
        `"${item.email}",` +
        `"${item.allocatedUnits.length}",` +
        `"${unitsList.replace(/"/g, '""')}",` +
        `"${item.uniqueSlots}",` +
        `"${item.teachingHours}",` +
        `"${status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const deptName = activeDepartment ? activeDepartment.name.replace(/\s+/g, '_') : 'All_Departments';
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Trainer_Workload_Allocation_${deptName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PRINT PREVIEW / FULL PRINT VIEW
  if (isPrintPreviewActive) {
    return (
      <div className="min-h-screen bg-slate-100 p-3 sm:p-8 print:p-0 print:bg-white text-slate-800">
        {/* Print Bar */}
        <div className="max-w-5xl mx-auto mb-6 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold font-display text-slate-800 text-sm">
                Trainer Allocation & Workload Report — Print Preview
              </h1>
              <p className="text-xs text-slate-400">
                {activeDepartment ? `Department: ${activeDepartment.name}` : 'All Departments (College-Wide)'} • {academicSetting.academicYear} {academicSetting.semester}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-xs transition-all cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              Print Now
            </button>
            <button
              onClick={() => setIsPrintPreviewActive(false)}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-600 font-semibold text-xs transition-all cursor-pointer"
            >
              Exit Preview
            </button>
          </div>
        </div>

        {/* Printable Paper Document */}
        <div className="max-w-5xl mx-auto bg-white p-4 sm:p-8 md:p-10 rounded-3xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="text-center pb-5 border-b-2 border-slate-900 mb-6 flex flex-col items-center justify-center">
            <img
              src={kitchaLogo}
              alt="KITCHA TVC Logo"
              className="w-20 h-20 object-contain mb-2"
              referrerPolicy="no-referrer"
            />
            <h1 className="text-xl font-bold font-display uppercase tracking-tight text-slate-950">
              KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE
            </h1>
            <p className="text-[11px] uppercase tracking-widest text-slate-600 font-semibold mt-0.5">
              P.O. BOX 594-40202, KEROKA • info@kitchatvc.ac.ke
            </p>
            <div className="mt-2 inline-block px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg">
              <h2 className="text-xs uppercase font-mono tracking-wider text-indigo-900 font-black">
                ACADEMIC TRAINER ALLOCATION & WORKLOAD DIRECTORY
              </h2>
            </div>
            
            <div className="mt-3 flex flex-wrap justify-between items-center text-xs text-slate-700 font-semibold gap-3 w-full font-mono bg-slate-50 border border-slate-200 p-2.5 rounded-xl print:bg-transparent print:border-none">
              <div>
                <span>DEPARTMENT: </span>
                <span className="text-slate-950 font-bold uppercase">
                  {activeDepartment ? `${activeDepartment.name} (${activeDepartment.code})` : 'ALL DEPARTMENTS'}
                </span>
              </div>
              <div>
                <span>ACADEMIC PERIOD: </span>
                <span className="text-slate-950 font-bold">
                  {academicSetting.academicYear} | {academicSetting.semester}
                </span>
              </div>
              <div>
                <span>DATE: </span>
                <span className="text-slate-950 font-bold">
                  {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto print:overflow-x-visible border border-slate-300 rounded-xl mb-6">
            <table className="min-w-full divide-y divide-slate-300 text-left text-xs">
              <thead className="bg-slate-100 font-bold font-mono text-slate-900 uppercase">
                <tr>
                  <th className="px-3 py-2.5 border-r border-slate-300 text-center w-10">#</th>
                  <th className="px-3 py-2.5 border-r border-slate-300">Trainer Name</th>
                  <th className="px-3 py-2.5 border-r border-slate-300 w-24">Trainer Code</th>
                  <th className="px-3 py-2.5 border-r border-slate-300">Phone</th>
                  <th className="px-3 py-2.5 border-r border-slate-300">Email</th>
                  <th className="px-3 py-2.5 border-r border-slate-300">Allocated Subjects / Units</th>
                  <th className="px-3 py-2.5 border-r border-slate-300 text-center w-16">Units</th>
                  <th className="px-3 py-2.5 text-center w-24">Workload (Hrs/Wk)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                {filteredData.map((item, index) => {
                  return (
                    <tr key={item.trainer.id} className="hover:bg-slate-50/40">
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center font-mono text-slate-600">
                        {index + 1}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold text-slate-950">
                        {item.trainer.name}
                        {item.trainer.role === 'hod' && (
                          <span className="ml-1.5 px-1.5 py-0.5 text-[9px] bg-indigo-100 text-indigo-800 border border-indigo-200 rounded font-bold uppercase">
                            HOD
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-bold font-mono text-indigo-700">
                        {item.trainerCode}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-mono text-slate-700 whitespace-nowrap">
                        {item.phone || '—'}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-200 font-mono text-slate-700 break-all text-[11px]">
                        {item.email || '—'}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-slate-800 text-[11px]">
                        {item.allocatedUnits.length > 0 ? (
                          <div className="space-y-1">
                            {item.allocatedUnits.map((alloc, idx) => (
                              <div key={idx} className="leading-tight">
                                <span className="font-bold font-mono text-slate-900">{alloc.unit.code}</span>: {alloc.unit.name}
                                {alloc.course && (
                                  <span className="text-[10px] text-slate-500 ml-1">({alloc.course.code})</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No units allocated yet</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 border-r border-slate-200 text-center font-bold font-mono text-slate-700">
                        {item.allocatedUnits.length}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold font-mono">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          item.teachingHours === 0 
                            ? 'bg-slate-100 text-slate-600' 
                            : item.teachingHours < 16 
                              ? 'bg-amber-100 text-amber-900' 
                              : item.teachingHours <= 24 
                                ? 'bg-emerald-100 text-emerald-900 font-black' 
                                : 'bg-rose-100 text-rose-900 font-black'
                        }`}>
                          {item.teachingHours} Hrs
                        </span>
                        <div className="text-[9px] text-slate-500 font-normal mt-0.5">
                          ({item.uniqueSlots} slots)
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">
                      No trainers found matching the selected filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-slate-900 font-mono text-xs">
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-right uppercase">
                    Department Totals:
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200">
                    {metrics.totalTrainers} Trainers Listed
                  </td>
                  <td className="px-3 py-2 border-r border-slate-200 text-center">
                    {metrics.totalAllocatedUnits} Units
                  </td>
                  <td className="px-3 py-2 text-center text-indigo-700 font-black">
                    {metrics.totalHours} Total Hrs
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Department Workload Distribution Summary */}
          <div className="grid grid-cols-4 gap-2 border border-slate-200 rounded-xl p-3 mb-8 text-center text-xs font-mono bg-slate-50 print:bg-transparent">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Optimal Load (16-24h)</span>
              <span className="font-bold text-emerald-700 text-sm">{metrics.optimalCount} Trainers</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Light Load (&lt;16h)</span>
              <span className="font-bold text-amber-700 text-sm">{metrics.lightCount} Trainers</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Heavy Load (&gt;24h)</span>
              <span className="font-bold text-rose-700 text-sm">{metrics.heavyCount} Trainers</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Avg Hours / Trainer</span>
              <span className="font-bold text-indigo-700 text-sm">{metrics.avgHours} Hrs/Wk</span>
            </div>
          </div>

          {/* Sign-Off Block */}
          <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-3 gap-6 text-[11px] font-mono">
            <div>
              <p className="font-bold uppercase text-slate-900 border-b border-slate-300 pb-1 mb-6">
                Prepared By (HOD / Academic)
              </p>
              <div className="space-y-1">
                <div>Name: _______________________</div>
                <div>Sign: _______________________</div>
                <div>Date: _______________________</div>
              </div>
            </div>
            <div>
              <p className="font-bold uppercase text-slate-900 border-b border-slate-300 pb-1 mb-6">
                Verified By (Timetable Officer)
              </p>
              <div className="space-y-1">
                <div>Name: _______________________</div>
                <div>Sign: _______________________</div>
                <div>Date: _______________________</div>
              </div>
            </div>
            <div>
              <p className="font-bold uppercase text-slate-900 border-b border-slate-300 pb-1 mb-6">
                Approved By (Principal / Registrar)
              </p>
              <div className="space-y-1">
                <div>Name: _______________________</div>
                <div>Sign: _______________________</div>
                <div>Date: _______________________</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MAIN ON-SCREEN VIEW
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-display text-slate-900">
              Trainer Workload & Allocation Directory
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            {isHod ? (
              <span>
                Department: <strong className="text-indigo-700">{activeDepartment?.name || 'Your Department'}</strong> ({activeDepartment?.code || 'HOD View'}) — View and print trainer details, contacts, and workload allocation.
              </span>
            ) : (
              <span>
                Inspect academic trainers, trainer codes, contacts, allocated subjects, and teaching workload per department across the institution.
              </span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-3xs transition-all cursor-pointer"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsPrintPreviewActive(true)}
            id="btn-print-workload-report"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Workload Report</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
              title="Close Report"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Department Trainers</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{metrics.totalTrainers}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Active teaching staff
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Total Teaching Hours</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-600">{metrics.totalHours} <span className="text-xs text-slate-500 font-normal">Hrs/Wk</span></div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Avg: <strong className="text-slate-700 font-mono">{metrics.avgHours}</strong> Hrs / Trainer
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Allocated Subjects</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-600">{metrics.totalAllocatedUnits}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Curriculum unit assignments
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-3xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Workload Distribution</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              {metrics.optimalCount} Opt
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-700 border border-amber-200">
              {metrics.lightCount} Light
            </span>
            {metrics.heavyCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-50 text-rose-700 border border-rose-200">
                {metrics.heavyCount} Heavy
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Standard: 16-24 hrs/week
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search trainer name, code, phone, email, or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department Filter (Admin Only: HOD is locked to their department) */}
          {!isHod && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDeptId}
                onChange={(e) => setSelectedDeptId(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Departments ({departments.length})</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {isHod && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shrink-0">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dept: {activeDepartment?.name || 'Department'}</span>
              <span className="px-1.5 py-0.5 text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-bold uppercase">
                HOD Filter Locked
              </span>
            </div>
          )}
        </div>

        {/* Workload Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap mr-1">Load:</span>
          {(['all', 'optimal', 'light', 'heavy', 'unassigned'] as const).map((filterVal) => {
            const labels: Record<string, string> = {
              all: 'All',
              optimal: 'Optimal (16-24h)',
              light: 'Light (<16h)',
              heavy: 'Heavy (>24h)',
              unassigned: 'Unassigned (0h)'
            };
            const active = workloadFilter === filterVal;
            return (
              <button
                key={filterVal}
                onClick={() => setWorkloadFilter(filterVal)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  active 
                    ? 'bg-indigo-600 text-white shadow-3xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                {labels[filterVal]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Trainers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase font-mono text-[11px]">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Trainer &amp; Role</th>
                <th className="py-3 px-4">Trainer Code</th>
                <th className="py-3 px-4">Contact Details</th>
                {!isHod && <th className="py-3 px-4">Department</th>}
                <th className="py-3 px-4">Allocated Units</th>
                <th className="py-3 px-4 text-center">Weekly Load</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item, idx) => {
                const isExpanded = expandedTrainerId === item.trainer.id;
                return (
                  <React.Fragment key={item.trainer.id}>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      
                      {/* Trainer Name & Role */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {item.trainer.name}
                          {item.trainer.role === 'hod' && (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                              HOD
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Username: @{item.trainer.username}
                        </div>
                      </td>

                      {/* Trainer Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                        <span className="bg-indigo-50/80 px-2 py-1 rounded-lg border border-indigo-100">
                          {item.trainerCode}
                        </span>
                      </td>

                      {/* Contacts: Phone and Email */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono text-slate-700">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            {item.phone ? (
                              <a 
                                href={`tel:${item.phone}`} 
                                className="hover:text-indigo-600 hover:underline"
                                title="Click to call"
                              >
                                {item.phone}
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">No phone</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-slate-700">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            {item.email ? (
                              <a 
                                href={`mailto:${item.email}`} 
                                className="hover:text-indigo-600 hover:underline truncate max-w-[170px]"
                                title="Click to send email"
                              >
                                {item.email}
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">No email</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Department (Admin only) */}
                      {!isHod && (
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-700">
                            {item.department ? item.department.name : <span className="text-slate-400 italic">Unassigned</span>}
                          </span>
                          {item.department && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              ({item.department.code})
                            </span>
                          )}
                        </td>
                      )}

                      {/* Allocated Units Badges */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {item.allocatedUnits.slice(0, 3).map((alloc, uIdx) => (
                            <span 
                              key={uIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold"
                              title={`${alloc.unit.code} - ${alloc.unit.name}`}
                            >
                              <span className="font-mono text-indigo-700">{alloc.unit.code}</span>
                            </span>
                          ))}
                          {item.allocatedUnits.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-medium px-1 self-center">
                              +{item.allocatedUnits.length - 3} more
                            </span>
                          )}
                          {item.allocatedUnits.length === 0 && (
                            <span className="text-slate-400 italic text-[11px]">No units allocated</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Total: <strong className="text-slate-700 font-mono">{item.allocatedUnits.length}</strong> unit(s)
                        </div>
                      </td>

                      {/* Weekly Workload */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-block font-mono">
                          <div className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
                            item.teachingHours === 0 
                              ? 'bg-slate-100 text-slate-600 border border-slate-200' 
                              : item.teachingHours < 16 
                                ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                                : item.teachingHours <= 24 
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                                  : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>
                            {item.teachingHours} Hrs / Wk
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {item.uniqueSlots} slots scheduled
                          </div>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onUpdateUsers && (
                            <button
                              onClick={() => openEditModal(item.trainer)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-all cursor-pointer"
                              title="Edit Trainer Code & Contact Details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setExpandedTrainerId(isExpanded ? null : item.trainer.id)}
                            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                              isExpanded 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-300' 
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            <span>Schedule</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Detailed Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/70 border-b border-slate-200/80">
                        <td colSpan={isHod ? 7 : 8} className="p-4 sm:p-5">
                          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-4 shadow-3xs">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                                <Clock className="w-4 h-4 text-indigo-600" />
                                <span>Weekly Teaching Schedule for {item.trainer.name} ({item.trainerCode})</span>
                              </h4>
                              <span className="text-[11px] font-mono text-slate-500">
                                {item.scheduledSlotDetails.length} Scheduled Sessions • {item.teachingHours} Total Hours
                              </span>
                            </div>

                            {/* Scheduled Slots Grid */}
                            {item.scheduledSlotDetails.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                {item.scheduledSlotDetails.map((slot, sIdx) => (
                                  <div 
                                    key={sIdx} 
                                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                                  >
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                                      <span className="font-bold text-indigo-700 uppercase">{slot.day}</span>
                                      <span>{slot.slotLabel}</span>
                                    </div>
                                    <div className="font-bold text-slate-900 text-xs truncate">
                                      <span className="font-mono text-indigo-600 mr-1">{slot.unitCode}</span>
                                      {slot.unitName}
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                                      <span>Class: {slot.courseCode}</span>
                                      <span className="font-medium text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                        {slot.roomName}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-slate-400 italic py-2">
                                No scheduled timetable slots found for this trainer in the active timetable.
                              </p>
                            )}

                            {/* All Allocated Units List */}
                            <div className="pt-2 border-t border-slate-100">
                              <h5 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                                <span>Curriculum Subject Allocations ({item.allocatedUnits.length})</span>
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {item.allocatedUnits.map((uItem, uIdx) => (
                                  <div key={uIdx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                                    <div className="font-bold text-slate-900 font-mono text-[11px]">
                                      {uItem.unit.code}
                                    </div>
                                    <div className="text-slate-700 text-[11px] truncate">
                                      {uItem.unit.name}
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                                      <span>{uItem.course?.code || 'Course'}</span>
                                      <span className={`px-1.5 py-0.2 rounded font-bold text-[9px] ${
                                        uItem.isScheduled 
                                          ? 'bg-emerald-100 text-emerald-800' 
                                          : 'bg-amber-100 text-amber-800'
                                      }`}>
                                        {uItem.isScheduled ? 'Scheduled' : 'Assigned (No Slots)'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={isHod ? 7 : 8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-xs">No trainers found matching your search or filter.</p>
                    <button
                      onClick={() => { setSearchQuery(''); setWorkloadFilter('all'); }}
                      className="mt-2 text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                    >
                      Clear search &amp; filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK EDIT TRAINER CONTACT & CODE MODAL */}
      {editingTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Update Trainer Code &amp; Contacts
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingTrainer.name} (@{editingTrainer.username})
                </p>
              </div>
              <button 
                onClick={() => setEditingTrainer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTrainerInfo} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Trainer Code / Identifier
                </label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  placeholder="e.g. TR-CS01, TR01"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="e.g. +254 712 345 678"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="e.g. trainer@kitchatvc.ac.ke"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    National ID
                  </label>
                  <input
                    type="text"
                    value={editForm.nationalId}
                    onChange={(e) => setEditForm({ ...editForm, nationalId: e.target.value })}
                    placeholder="e.g. 12345678"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PF Number
                  </label>
                  <input
                    type="text"
                    value={editForm.pfNumber}
                    onChange={(e) => setEditForm({ ...editForm, pfNumber: e.target.value })}
                    placeholder="e.g. PF1001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTrainer(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
