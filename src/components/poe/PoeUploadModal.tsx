import React, { useState, useRef } from 'react';
import { 
  X, UploadCloud, FileText, CheckCircle2, AlertCircle, Info, Tag, Layers, Calendar
} from 'lucide-react';
import { 
  User, Department, Course, Unit, PoeDocument, PoeType, PoeCategory, PoeStatus 
} from '../../types';

interface PoeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  departments: Department[];
  courses: Course[];
  units: Unit[];
  academicYear: string;
  termSemester: string;
  onSaveDocument: (doc: PoeDocument) => void;
}

const TRAINER_CATEGORIES: { value: PoeCategory; label: string; desc: string }[] = [
  { value: 'scheme_of_work', label: 'Scheme of Work', desc: '14-week curriculum delivery plan aligned with CDACC/TVETA standards' },
  { value: 'lesson_plan', label: 'Session / Lesson Plan', desc: 'Practical or theory session breakdown with facilitator and trainee activities' },
  { value: 'record_of_work', label: 'Record of Work Covered', desc: 'Cumulative log of topics, hours, and practical lab sessions taught' },
  { value: 'assessment_tool', label: 'Assessment Tool / Rubric', desc: 'Formative CATs, summative exam papers, and practical observation guides' },
  { value: 'learning_guide', label: 'Learning Guide / Trainee Manual', desc: 'Trainee instructional handout or step-by-step workshop manual' },
  { value: 'cpd_certificate', label: 'CPD / TVETA Professional License', desc: 'Pedagogical training certificates, assessor license, or industry attachment' },
  { value: 'attendance_register', label: 'Trainee Attendance Register', desc: 'Certified session roll-call and continuous assessment attendance records' },
  { value: 'other_trainer_evidence', label: 'Other Professional Teaching Evidence', desc: 'Departmental meeting minutes, trade project supervision records' }
];

const TRAINEE_CATEGORIES: { value: PoeCategory; label: string; desc: string }[] = [
  { value: 'practical_project', label: 'Practical Project / Capstone', desc: 'Photographic & technical documentation of working prototype or fabrication' },
  { value: 'competency_task', label: 'Competency Task / Job Card', desc: 'Evidence of specific occupational skills performed against occupational standards' },
  { value: 'industrial_attachment', label: 'Industrial Attachment / Dual Training', desc: 'Industry supervisor evaluation, placement report, and company rating' },
  { value: 'attachment_logbook', label: 'Attachment Daily Logbook', desc: 'Certified daily log of occupational duties completed in industry' },
  { value: 'assessment_assignment', label: 'Assessed Coursework / Assignment', desc: 'Marked CAT, technical report, lab experiment sheet, or design drawing' },
  { value: 'safety_osha_certification', label: 'Safety & OSHA Certificate', desc: 'Workplace health and safety, first aid, or fire fighting certification' },
  { value: 'rpl_prior_evidence', label: 'Recognition of Prior Learning (RPL)', desc: 'Prior certificates, portfolio evidence, or previous workshop experience' },
  { value: 'other_trainee_evidence', label: 'Other Competency Evidence', desc: 'Exhibition entry, trade competition award, or peer evaluation' }
];

export default function PoeUploadModal({
  isOpen,
  onClose,
  currentUser,
  departments,
  courses,
  units,
  academicYear,
  termSemester,
  onSaveDocument
}: PoeUploadModalProps) {
  const isTrainerOrStaff = ['admin', 'principal', 'deputy_academics', 'hod', 'trainer', 'quality_assurance', 'assessor'].includes(currentUser.role);
  const defaultPoeType: PoeType = ['student', 'trainee'].includes(currentUser.role) ? 'trainee' : 'trainer';

  const [poeType, setPoeType] = useState<PoeType>(defaultPoeType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PoeCategory>(defaultPoeType === 'trainer' ? 'scheme_of_work' : 'practical_project');
  const [departmentId, setDepartmentId] = useState(currentUser.departmentId || (departments[0]?.id ?? ''));
  const [courseId, setCourseId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['TVET', 'CBET']);
  const [version, setVersion] = useState('v1.0');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const categories = poeType === 'trainer' ? TRAINER_CATEGORIES : TRAINEE_CATEGORIES;
  const filteredCourses = courses.filter(c => !departmentId || c.departmentId === departmentId);
  const filteredUnits = units.filter(u => !courseId || u.courseId === courseId);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setFileError('');
    if (file.size > 50 * 1024 * 1024) {
      setFileError('File size exceeds the 50MB institutional limit.');
      return;
    }
    setSelectedFile(file);
    if (!title) {
      // Auto-populate title from file name
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedDept = departments.find(d => d.id === departmentId);
    const matchedCourse = courses.find(c => c.id === courseId);
    const matchedUnit = units.find(u => u.id === unitId);

    const newDoc: PoeDocument = {
      id: `poe_doc_${Date.now()}`,
      poeType,
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      departmentId: departmentId || (departments[0]?.id ?? 'dept_cs'),
      departmentName: matchedDept?.name,
      targetCourseId: courseId || undefined,
      targetCourseName: matchedCourse?.name,
      targetUnitId: unitId || undefined,
      targetUnitName: matchedUnit ? `${matchedUnit.name} (${matchedUnit.code})` : undefined,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerRole: ['student', 'trainee'].includes(currentUser.role) ? 'trainee' : 'trainer',
      ownerIdentifier: currentUser.pfNumber || currentUser.code || currentUser.username,
      ownerEmail: currentUser.email,
      academicYear,
      termSemester,
      fileName: selectedFile ? selectedFile.name : `${title.replace(/\s+/g, '_')}.pdf`,
      fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB',
      fileType: selectedFile?.type || 'application/pdf',
      version: version.trim() || 'v1.0',
      dateUploaded: new Date().toISOString(),
      status: 'submitted', // submitted for review
      tags: tags.length > 0 ? tags : ['TVET', 'Evidence'],
      reviews: []
    };

    onSaveDocument(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-700/60 rounded-xl">
              <UploadCloud className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Upload TVET Portfolio Evidence</h3>
              <p className="text-xs text-indigo-200">
                Secure digital submission for verification, review, and accreditation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-slate-700">
          
          {/* Portfolio Type Toggle (if user has permissions) */}
          {isTrainerOrStaff && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Portfolio Domain
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPoeType('trainer');
                    setCategory('scheme_of_work');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    poeType === 'trainer'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${poeType === 'trainer' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Trainer Professional Portfolio</span>
                    <span className="text-[11px] text-slate-500">Schemes, Lesson Plans, Records of Work</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPoeType('trainee');
                    setCategory('practical_project');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    poeType === 'trainee'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${poeType === 'trainee' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Trainee Competency Evidence</span>
                    <span className="text-[11px] text-slate-500">Projects, Job Cards, Attachment Logbooks</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* File Drag and Drop Zone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select or Drag Evidence Document
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDragging 
                  ? 'border-indigo-500 bg-indigo-50/70' 
                  : selectedFile 
                    ? 'border-emerald-400 bg-emerald-50/40' 
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip"
                onChange={(e) => e.target.files && e.target.files[0] && handleFileSelected(e.target.files[0])}
              />
              
              {selectedFile ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-sm text-slate-800">{selectedFile.name}</span>
                  <span className="text-xs text-slate-500 font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Document'}
                  </span>
                  <span className="text-xs text-indigo-600 hover:underline mt-1 font-semibold">
                    Click to choose a different file
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-indigo-100/80 text-indigo-600 rounded-full">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-slate-700">
                    <span className="text-indigo-600 font-bold hover:underline">Click to browse</span> or drag and drop your file here
                  </div>
                  <p className="text-xs text-slate-400">
                    Supported formats: PDF, Word (DOCX), Excel (XLSX), Images (JPG/PNG), ZIP archives (Max 50MB)
                  </p>
                </div>
              )}
            </div>
            {fileError && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5" /> {fileError}
              </p>
            )}
          </div>

          {/* Document Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Evidence Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Scheme of Work: Introduction to Programming (ICT111)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Document Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PoeCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} — {cat.desc.slice(0, 45)}...
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Academic Context (Department, Course, Unit) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Academic Mapping
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setCourseId('');
                    setUnitId('');
                  }}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-indigo-600"
                >
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Course (Optional)</label>
                <select
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value);
                    setUnitId('');
                  }}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="">-- All Courses / General --</option>
                  {filteredCourses.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Unit (Optional)</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="">-- General / Non-Unit Specific --</option>
                  {filteredUnits.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description / Summary Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Evidence Description / Learning Objectives
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe the contents of this evidence, methodology, practical lab hours covered, or competency standards demonstrated..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
            />
          </div>

          {/* Version and Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Version Tag
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.0"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Keywords & Tags (Press Enter)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="e.g. CDACC, Lab 1, Term 1"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-red-600 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Submission Info Notice */}
          <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex items-start gap-2.5 text-xs text-blue-800">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Once submitted, your portfolio item will be queued for formal review by the <strong>{poeType === 'trainer' ? 'HOD and Quality Assurance' : 'Assessor and Assigned Trainer'}</strong>. You will receive notifications on review decisions and revision requests.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Submit for Review</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
