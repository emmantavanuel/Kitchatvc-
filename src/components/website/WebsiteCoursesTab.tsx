import React, { useState } from 'react';
import { 
  WebsiteConfig, WebsiteDepartment, WebsiteCourse 
} from '../../types';
import { WEBSITE_DEPARTMENTS } from '../../data/websiteData';
import { 
  GraduationCap, Plus, Trash2, Edit2, Copy, Search, 
  BookOpen, Building2, CheckCircle2, AlertCircle, RefreshCw, 
  ChevronRight, ArrowUpDown, Filter, Sparkles, X
} from 'lucide-react';

interface WebsiteCoursesTabProps {
  formData: WebsiteConfig;
  setFormData: React.Dispatch<React.SetStateAction<WebsiteConfig>>;
  onSaveAll: () => void;
}

export default function WebsiteCoursesTab({
  formData,
  setFormData,
  onSaveAll
}: WebsiteCoursesTabProps) {
  const departments = formData.departments && formData.departments.length > 0 
    ? formData.departments 
    : WEBSITE_DEPARTMENTS;

  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  // Modal states for Course Add/Edit
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<WebsiteCourse | null>(null);

  // Modal states for Department Add/Edit
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<WebsiteDepartment | null>(null);

  // Course Form Fields
  const [courseName, setCourseName] = useState('');
  const [courseDeptId, setCourseDeptId] = useState('');
  const [courseLevel, setCourseLevel] = useState('Level 6 Diploma');
  const [courseEntryGrade, setCourseEntryGrade] = useState('KCSE C- (Minus)');
  const [courseExamBody, setCourseExamBody] = useState('TVET-CDACC');
  const [courseIntakes, setCourseIntakes] = useState('January, May & September');
  const [courseDuration, setCourseDuration] = useState('3 Years (9 Terms)');

  // Department Form Fields
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDesc, setDeptDesc] = useState('');

  // Open Course Add
  const handleOpenAddCourse = (deptId?: string) => {
    const defaultDept = deptId && deptId !== 'all' ? deptId : (departments[0]?.id || 'ict');
    setCourseName('');
    setCourseDeptId(defaultDept);
    setCourseLevel('Level 6 Diploma');
    setCourseEntryGrade('KCSE C- (Minus)');
    setCourseExamBody('TVET-CDACC');
    setCourseIntakes('January, May & September');
    setCourseDuration('3 Years (9 Terms)');
    setEditingCourse(null);
    setIsCourseModalOpen(true);
  };

  // Open Course Edit
  const handleOpenEditCourse = (course: WebsiteCourse) => {
    setCourseName(course.name);
    setCourseDeptId(course.departmentId);
    setCourseLevel(course.level);
    setCourseEntryGrade(course.entryGrade);
    setCourseExamBody(course.assessmentBody);
    setCourseIntakes(course.intakePeriods);
    setCourseDuration(course.duration);
    setEditingCourse(course);
    setIsCourseModalOpen(true);
  };

  // Open Department Add
  const handleOpenAddDept = () => {
    setDeptName('');
    setDeptCode('');
    setDeptDesc('');
    setEditingDept(null);
    setIsDeptModalOpen(true);
  };

  // Open Department Edit
  const handleOpenEditDept = (dept: WebsiteDepartment) => {
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setDeptDesc(dept.description);
    setEditingDept(dept);
    setIsDeptModalOpen(true);
  };

  // Save Course (Create or Update)
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();

    if (!courseName.trim()) {
      alert('Please enter a course name.');
      return;
    }

    const currentDepts = [...(formData.departments && formData.departments.length > 0 ? formData.departments : WEBSITE_DEPARTMENTS)];

    if (editingCourse) {
      // If department changed, remove from old department and add to new
      const oldDeptId = editingCourse.departmentId;
      const updatedDepts = currentDepts.map(dept => {
        if (dept.id === oldDeptId && oldDeptId !== courseDeptId) {
          return {
            ...dept,
            courses: dept.courses.filter(c => c.id !== editingCourse.id)
          };
        }
        if (dept.id === courseDeptId) {
          const existingIdx = dept.courses.findIndex(c => c.id === editingCourse.id);
          const updatedCourse: WebsiteCourse = {
            id: editingCourse.id,
            name: courseName.trim(),
            departmentId: courseDeptId,
            level: courseLevel.trim(),
            entryGrade: courseEntryGrade.trim(),
            assessmentBody: courseExamBody.trim(),
            intakePeriods: courseIntakes.trim(),
            duration: courseDuration.trim()
          };

          if (existingIdx >= 0) {
            const copy = [...dept.courses];
            copy[existingIdx] = updatedCourse;
            return { ...dept, courses: copy };
          } else {
            return { ...dept, courses: [...dept.courses, updatedCourse] };
          }
        }
        return dept;
      });

      setFormData(prev => ({ ...prev, departments: updatedDepts }));
    } else {
      // Add new course
      const newCourse: WebsiteCourse = {
        id: `course_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        name: courseName.trim(),
        departmentId: courseDeptId,
        level: courseLevel.trim(),
        entryGrade: courseEntryGrade.trim(),
        assessmentBody: courseExamBody.trim(),
        intakePeriods: courseIntakes.trim(),
        duration: courseDuration.trim()
      };

      const updatedDepts = currentDepts.map(dept => {
        if (dept.id === courseDeptId) {
          return { ...dept, courses: [...dept.courses, newCourse] };
        }
        return dept;
      });

      setFormData(prev => ({ ...prev, departments: updatedDepts }));
    }

    setIsCourseModalOpen(false);
    setEditingCourse(null);
  };

  // Duplicate Course
  const handleDuplicateCourse = (course: WebsiteCourse) => {
    const currentDepts = [...(formData.departments && formData.departments.length > 0 ? formData.departments : WEBSITE_DEPARTMENTS)];
    const duplicated: WebsiteCourse = {
      ...course,
      id: `course_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: `${course.name} (Copy)`
    };

    const updatedDepts = currentDepts.map(dept => {
      if (dept.id === course.departmentId) {
        return { ...dept, courses: [...dept.courses, duplicated] };
      }
      return dept;
    });

    setFormData(prev => ({ ...prev, departments: updatedDepts }));
  };

  // Delete Course
  const handleDeleteCourse = (courseId: string, deptId: string) => {
    if (!window.confirm('Are you sure you want to remove this course from the front page catalogue?')) return;
    const currentDepts = [...(formData.departments && formData.departments.length > 0 ? formData.departments : WEBSITE_DEPARTMENTS)];
    const updatedDepts = currentDepts.map(dept => {
      if (dept.id === deptId) {
        return { ...dept, courses: dept.courses.filter(c => c.id !== courseId) };
      }
      return dept;
    });
    setFormData(prev => ({ ...prev, departments: updatedDepts }));
  };

  // Save Department (Create or Update)
  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) {
      alert('Please provide Department Name and Code.');
      return;
    }

    const currentDepts = [...(formData.departments && formData.departments.length > 0 ? formData.departments : WEBSITE_DEPARTMENTS)];

    if (editingDept) {
      const updated = currentDepts.map(d => {
        if (d.id === editingDept.id) {
          return {
            ...d,
            name: deptName.trim(),
            code: deptCode.trim().toUpperCase(),
            description: deptDesc.trim()
          };
        }
        return d;
      });
      setFormData(prev => ({ ...prev, departments: updated }));
    } else {
      const newId = deptCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      const newDept: WebsiteDepartment = {
        id: newId,
        name: deptName.trim(),
        code: deptCode.trim().toUpperCase(),
        description: deptDesc.trim() || `Department of ${deptName.trim()} offering specialized technical training.`,
        headOfDepartment: 'Head of Department',
        courses: []
      };
      setFormData(prev => ({ ...prev, departments: [...currentDepts, newDept] }));
      setSelectedDeptId(newId);
    }

    setIsDeptModalOpen(false);
    setEditingDept(null);
  };

  // Delete Department
  const handleDeleteDepartment = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    if (!dept) return;

    if (dept.courses.length > 0) {
      if (!window.confirm(`This department has ${dept.courses.length} courses. Deleting the department will also delete these courses. Do you want to proceed?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to delete the department "${dept.name}"?`)) return;
    }

    const currentDepts = [...(formData.departments && formData.departments.length > 0 ? formData.departments : WEBSITE_DEPARTMENTS)];
    const updated = currentDepts.filter(d => d.id !== deptId);
    setFormData(prev => ({ ...prev, departments: updated }));
    setSelectedDeptId('all');
  };

  // Reset to Institutional Defaults
  const handleResetDefaults = () => {
    if (!window.confirm('Reset all courses and academic departments to standard Kitutu Chache TVC institutional catalogue? Any custom courses will be replaced with defaults.')) return;
    setFormData(prev => ({ ...prev, departments: WEBSITE_DEPARTMENTS }));
  };

  // Compute filtered courses list
  const allCoursesWithDept = departments.flatMap(dept => 
    dept.courses.map(course => ({
      ...course,
      deptName: dept.name,
      deptCode: dept.code
    }))
  );

  const filteredCourses = allCoursesWithDept.filter(c => {
    // Dept filter
    if (selectedDeptId !== 'all' && c.departmentId !== selectedDeptId) return false;
    // Level filter
    if (levelFilter !== 'all') {
      if (!c.level.toLowerCase().includes(levelFilter.toLowerCase())) return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchBody = c.assessmentBody.toLowerCase().includes(q);
      const matchGrade = c.entryGrade.toLowerCase().includes(q);
      const matchDept = c.deptName.toLowerCase().includes(q);
      if (!matchName && !matchBody && !matchGrade && !matchDept) return false;
    }
    return true;
  });

  const totalCoursesCount = departments.reduce((acc, d) => acc + d.courses.length, 0);

  return (
    <div className="space-y-8">
      {/* Tab Header Banner */}
      <div className="bg-gradient-to-r from-[#281A10] via-[#3A2416] to-[#281A10] rounded-2xl p-6 text-white border border-[#BA8D5C]/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-[#C29563]/25 text-[#E2BE8D]">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold tracking-tight text-white font-serif">
              Front Page Courses & Departments Offered
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#DFC5AB] max-w-2xl leading-relaxed">
            Manage the complete academic course catalogue displayed on the college front page and accessible in trainee online admission forms. Add, edit, duplicate, or categorize technical courses with custom entry requirements and assessment bodies.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenAddDept}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-[#F5E6D5] hover:text-white rounded-xl text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-[#BA8D5C]" />
            <span>+ Add Department</span>
          </button>

          <button
            onClick={() => handleOpenAddCourse(selectedDeptId)}
            className="px-4 py-2 bg-[#C29563] hover:bg-[#B28452] text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Course</span>
          </button>
        </div>
      </div>

      {/* Quick Filter & Department Tabs */}
      <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#EADBCA] space-y-4">
        {/* Department Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedDeptId('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedDeptId === 'all'
                ? 'bg-[#281A10] text-white shadow-xs'
                : 'bg-white text-[#453629] border border-[#EADBCA] hover:bg-[#FAF4EC]'
            }`}
          >
            All Departments ({totalCoursesCount})
          </button>

          {departments.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedDeptId(d.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                selectedDeptId === d.id
                  ? 'bg-[#C29563] text-white shadow-xs'
                  : 'bg-white text-[#453629] border border-[#EADBCA] hover:bg-[#FAF4EC]'
              }`}
            >
              <span>{d.code}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedDeptId === d.id ? 'bg-[#A87B4C] text-white' : 'bg-[#FAF4EC] text-[#8F6335]'
              }`}>
                {d.courses.length}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Level Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-[#EFE5D8]">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#8F6335] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search course title, exam body (CDACC/KNEC), or KCSE entry grade..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E0CCB8] rounded-xl text-xs focus:ring-2 focus:ring-[#C29563] outline-none"
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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E0CCB8] rounded-xl text-xs text-[#281A10] font-semibold outline-none"
            >
              <option value="all">All Academic Levels</option>
              <option value="Diploma">Diploma (Level 6)</option>
              <option value="Certificate">Certificate (Level 5)</option>
              <option value="Artisan">Artisan (Level 4)</option>
              <option value="Foundation">Foundation (Level 3)</option>
              <option value="Modular">Modular / Short Course</option>
            </select>

            <button
              onClick={handleResetDefaults}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-[#8F6335] text-xs font-bold border border-[#E0CCB8] rounded-xl transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              title="Restore standard institutional course list"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selected Department Overview Banner (If a specific dept is selected) */}
      {selectedDeptId !== 'all' && (() => {
        const currentDept = departments.find(d => d.id === selectedDeptId);
        if (!currentDept) return null;
        return (
          <div className="p-4 bg-white rounded-2xl border border-[#C29563]/40 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#C29563] text-white text-[11px] font-mono font-bold rounded">
                  {currentDept.code}
                </span>
                <h4 className="font-bold text-base text-[#281A10]">
                  {currentDept.name}
                </h4>
              </div>
              <p className="text-xs text-[#544030] mt-1 max-w-xl">
                {currentDept.description}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenEditDept(currentDept)}
                className="px-3 py-1.5 bg-[#FAF4EC] hover:bg-[#F3E6D5] text-[#7D5325] border border-[#E0CCB8] text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#BA8D5C]" />
                <span>Edit Dept</span>
              </button>

              <button
                onClick={() => handleDeleteDepartment(currentDept.id)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Department"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Courses List Table / Cards */}
      <div className="bg-white rounded-2xl border border-[#EADBCA] shadow-2xs overflow-hidden">
        <div className="px-6 py-4 bg-[#FAF7F2] border-b border-[#EFE5D8] flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs font-black text-[#281A10] uppercase tracking-wide">
            Courses Found ({filteredCourses.length} of {totalCoursesCount})
          </div>

          <button
            onClick={() => handleOpenAddCourse(selectedDeptId)}
            className="text-xs font-bold text-[#8F6335] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Course to Catalogue</span>
          </button>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <GraduationCap className="w-12 h-12 mx-auto text-slate-300" />
            <p className="font-semibold text-sm text-[#281A10]">No courses match your search or filter criteria.</p>
            <button
              onClick={() => { setSearchQuery(''); setLevelFilter('all'); setSelectedDeptId('all'); }}
              className="text-xs font-bold text-[#C29563] hover:underline"
            >
              Clear filters and show all courses
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF4EC] text-[#281A10] font-black border-b border-[#E0CCB8]">
                  <th className="py-3.5 px-4 font-black">Course Name & Level</th>
                  <th className="py-3.5 px-4 font-black">Department</th>
                  <th className="py-3.5 px-4 font-black">Entry Grade</th>
                  <th className="py-3.5 px-4 font-black">Assessment Body</th>
                  <th className="py-3.5 px-4 font-black">Duration & Intakes</th>
                  <th className="py-3.5 px-4 text-center font-black">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE5D8]">
                {filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF4EC] transition-colors group">
                    <td className="py-3 px-4">
                      <span className="font-bold text-[#1F130A] block text-sm group-hover:text-[#BA8D5C] transition-colors">
                        {c.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 bg-[#FAF4EC] text-[#7D5325] rounded font-bold text-[10px] border border-[#EADBCA]">
                          {c.level}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-slate-100 rounded text-slate-700 font-bold text-[11px]">
                        {c.deptCode}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[#2C1D11]">
                      <span className="px-2.5 py-1 bg-amber-50 rounded text-xs border border-amber-200 font-bold text-amber-900 inline-block">
                        {c.entryGrade}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[#2E1E12] font-semibold">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 text-[11px] font-bold">
                        {c.assessmentBody}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-[#4A3B2E] text-xs">
                      <div className="font-medium">{c.duration}</div>
                      <div className="text-[10px] text-[#8F6335]">{c.intakePeriods}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditCourse(c)}
                          className="p-1.5 text-[#7D5325] hover:bg-[#FAF4EC] rounded-lg transition-colors border border-transparent hover:border-[#E0CCB8] cursor-pointer"
                          title="Edit Course"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#BA8D5C]" />
                        </button>

                        <button
                          onClick={() => handleDuplicateCourse(c)}
                          className="p-1.5 text-[#7D5325] hover:bg-[#FAF4EC] rounded-lg transition-colors border border-transparent hover:border-[#E0CCB8] cursor-pointer"
                          title="Duplicate Course (Create Copy)"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                        </button>

                        <button
                          onClick={() => handleDeleteCourse(c.id, c.departmentId)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-[#FAF7F2] px-6 py-3 border-t border-[#EFE5D8] flex flex-col sm:flex-row justify-between items-center text-xs text-[#5C4B3C] font-semibold gap-2">
          <span>Showing {filteredCourses.length} active courses across {departments.length} academic departments</span>
          <span className="text-[#8F6335] font-bold">All modifications update front page and trainee registration live</span>
        </div>
      </div>

      {/* Course Add / Edit Modal */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-[#EADBCA] shadow-2xl overflow-hidden my-8">
            <div className="bg-[#281A10] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#C29563]" />
                <h4 className="font-bold text-base text-white">
                  {editingCourse ? 'Edit Course Details' : 'Add New Course to Catalogue'}
                </h4>
              </div>
              <button
                onClick={() => setIsCourseModalOpen(false)}
                className="text-[#DFC5AB] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
              {/* Course Title */}
              <div>
                <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Diploma in Electrical & Electronic Engineering (Power Option)"
                  className="w-full px-3.5 py-2.5 border border-[#E0CCB8] rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#C29563] outline-none"
                />
              </div>

              {/* Department & Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                    Academic Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={courseDeptId}
                    onChange={(e) => setCourseDeptId(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E0CCB8] rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#C29563] outline-none font-semibold"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                    Academic Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={courseLevel}
                    onChange={(e) => setCourseLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E0CCB8] rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#C29563] outline-none font-semibold"
                  >
                    <option value="Level 6 Diploma">Level 6 Diploma</option>
                    <option value="Level 5 Certificate">Level 5 Certificate</option>
                    <option value="Level 4 Artisan">Level 4 Artisan</option>
                    <option value="Level 3 Foundation">Level 3 Foundation</option>
                    <option value="Short Course / Modular">Short Course / Modular</option>
                  </select>
                </div>
              </div>

              {/* Entry Grade & Assessment Body */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                    Minimum Entry Grade <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={courseEntryGrade}
                    onChange={(e) => setCourseEntryGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E0CCB8] rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#C29563] outline-none font-semibold"
                  >
                    <option value="KCSE C- (Minus)">KCSE C- (Minus) & Above</option>
                    <option value="KCSE D+ (Plus)">KCSE D+ (Plus) & Above</option>
                    <option value="KCSE D Plain">KCSE D Plain & Above</option>
                    <option value="KCSE D- (Minus)">KCSE D- (Minus)</option>
                    <option value="KCSE E">KCSE E / Open</option>
                    <option value="KCPE Certificate">KCPE Certificate / Open</option>
                    <option value="Open / Industry Competency">Open / Industry Competency</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                    Exam / Assessment Body <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={courseExamBody}
                    onChange={(e) => setCourseExamBody(e.target.value)}
                    className="w-full px-3 py-2 border border-[#E0CCB8] rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#C29563] outline-none font-semibold"
                  >
                    <option value="TVET-CDACC">TVET-CDACC</option>
                    <option value="KNEC">KNEC</option>
                    <option value="NITA">NITA</option>
                    <option value="KASNEB">KASNEB</option>
                    <option value="TVET-CDACC & KNEC">TVET-CDACC & KNEC</option>
                    <option value="Institutional Certification">Institutional Certification</option>
                  </select>
                </div>
              </div>

              {/* Duration & Intake Periods */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                    Course Duration
                  </label>
                  <input 
                    type="text"
                    value={courseDuration}
                    onChange={(e) => setCourseDuration(e.target.value)}
                    placeholder="e.g. 3 Years (9 Terms) or 2 Years (6 Terms)"
                    className="w-full px-3 py-2 border border-[#E0CCB8] rounded-xl text-xs focus:ring-2 focus:ring-[#C29563] outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                    Intake Periods
                  </label>
                  <input 
                    type="text"
                    value={courseIntakes}
                    onChange={(e) => setCourseIntakes(e.target.value)}
                    placeholder="e.g. January, May & September"
                    className="w-full px-3 py-2 border border-[#E0CCB8] rounded-xl text-xs focus:ring-2 focus:ring-[#C29563] outline-none"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE5D8]">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#544030] hover:bg-[#FAF4EC] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C29563] hover:bg-[#B28452] text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {editingCourse ? 'Save Changes' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Add / Edit Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full border border-[#EADBCA] shadow-2xl overflow-hidden my-8">
            <div className="bg-[#281A10] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#C29563]" />
                <h4 className="font-bold text-base text-white">
                  {editingDept ? 'Edit Academic Department' : 'Add New Department'}
                </h4>
              </div>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="text-[#DFC5AB] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. Electrical & Electronics Engineering"
                  className="w-full px-3.5 py-2 border border-[#E0CCB8] rounded-xl text-xs sm:text-sm font-bold focus:ring-2 focus:ring-[#C29563] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                  Department Code <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  placeholder="e.g. EET or ICT or BE"
                  className="w-full px-3.5 py-2 border border-[#E0CCB8] rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-[#C29563] outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#281A10] block mb-1 uppercase tracking-wide">
                  Description
                </label>
                <textarea 
                  rows={3}
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  placeholder="Describe technical workshops, faculty expertise, and practical equipment available in this department..."
                  className="w-full px-3.5 py-2 border border-[#E0CCB8] rounded-xl text-xs focus:ring-2 focus:ring-[#C29563] outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFE5D8]">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#544030] hover:bg-[#FAF4EC] rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-[#C29563] hover:bg-[#B28452] text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {editingDept ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
