import React, { useState, useMemo } from 'react';
import { 
  FileText, UploadCloud, CheckCircle2, Clock, AlertTriangle, ShieldCheck, 
  Award, Stamp, Bell, Search, Filter, Layers, BookOpen, Users, BarChart3, 
  Printer, ArrowRight, UserCheck, RefreshCw, Eye, Download, Check, Sparkles, Building
} from 'lucide-react';
import { 
  User, Department, Course, Unit, AcademicSetting, PoeDocument, PoeReview, 
  PoeNotification, PoeRubric, PoeStatus, PoeType, PoeVerificationStamp, PoeCompetencyGrade 
} from '../types';
import PoeUploadModal from './poe/PoeUploadModal';
import PoeReviewModal from './poe/PoeReviewModal';
import PoeVerificationModal from './poe/PoeVerificationModal';
import PoeAuditReportModal from './poe/PoeAuditReportModal';
import PoeDocumentCard from './poe/PoeDocumentCard';
import PoeNotificationsDrawer from './poe/PoeNotificationsDrawer';

interface PoeDashboardProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser?: (user: User) => void;
  departments: Department[];
  courses: Course[];
  units: Unit[];
  academicSetting: AcademicSetting;
  documents: PoeDocument[];
  onSaveDocument: (doc: PoeDocument) => void;
  onUpdateDocument: (doc: PoeDocument) => void;
  onDeleteDocument: (docId: string) => void;
  notifications: PoeNotification[];
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  rubrics: PoeRubric[];
  onBackToMain?: () => void;
}

export default function PoeDashboard({
  currentUser,
  allUsers,
  onSwitchUser,
  departments,
  courses,
  units,
  academicSetting,
  documents,
  onSaveDocument,
  onUpdateDocument,
  onDeleteDocument,
  notifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  rubrics,
  onBackToMain
}: PoeDashboardProps) {
  // Navigation tabs
  const isTrainee = ['student', 'trainee'].includes(currentUser.role);
  const isTrainer = currentUser.role === 'trainer';
  const isQA = currentUser.role === 'quality_assurance';
  const isAssessor = currentUser.role === 'assessor';
  const isHOD = currentUser.role === 'hod';
  const isLeadership = ['admin', 'principal', 'deputy_academics'].includes(currentUser.role);

  const [activeTab, setActiveTab] = useState<'all' | 'trainer_poe' | 'trainee_poe' | 'review_queue' | 'verification' | 'analytics'>(
    isTrainee ? 'trainee_poe' : isTrainer ? 'trainer_poe' : isQA || isAssessor ? 'verification' : 'all'
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isAuditReportOpen, setIsAuditReportOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedDocForModal, setSelectedDocForModal] = useState<PoeDocument | null>(null);
  const [feedbackDoc, setFeedbackDoc] = useState<PoeDocument | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState<PoeDocument | null>(null);

  // Unread notifications count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Filtered documents calculation
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Tab based filtering
      if (activeTab === 'trainer_poe' && doc.poeType !== 'trainer') return false;
      if (activeTab === 'trainee_poe' && doc.poeType !== 'trainee') return false;
      if (activeTab === 'review_queue') {
        // Pending review
        if (!['submitted', 'under_review'].includes(doc.status)) return false;
        // If HOD, show own department
        if (isHOD && currentUser.departmentId && doc.departmentId !== currentUser.departmentId) return false;
      }
      if (activeTab === 'verification') {
        // Verified or approved ready for stamping
        if (!['approved', 'verified'].includes(doc.status)) return false;
      }

      // Trainee only sees own documents on Trainee tab unless admin/staff
      if (isTrainee && activeTab === 'trainee_poe' && doc.ownerId !== currentUser.id) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesOwner = doc.ownerName.toLowerCase().includes(q);
        const matchesUnit = doc.targetUnitName?.toLowerCase().includes(q);
        const matchesCourse = doc.targetCourseName?.toLowerCase().includes(q);
        const matchesTag = doc.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesOwner && !matchesUnit && !matchesCourse && !matchesTag) {
          return false;
        }
      }

      // Department filter
      if (selectedDept && doc.departmentId !== selectedDept) return false;

      // Status filter
      if (selectedStatus !== 'all' && doc.status !== selectedStatus) return false;

      // Category filter
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;

      return true;
    });
  }, [documents, activeTab, searchQuery, selectedDept, selectedStatus, selectedCategory, isTrainee, isHOD, currentUser]);

  // Key KPI metrics
  const totalCount = documents.length;
  const verifiedCount = documents.filter(d => d.status === 'verified').length;
  const pendingReviewCount = documents.filter(d => ['submitted', 'under_review'].includes(d.status)).length;
  const revisionCount = documents.filter(d => d.status === 'revision_requested').length;
  const complianceRate = totalCount > 0 
    ? Math.round((documents.filter(d => ['approved', 'verified'].includes(d.status)).length / totalCount) * 100) 
    : 0;

  // Handlers
  const handleOpenReview = (doc: PoeDocument) => {
    setSelectedDocForModal(doc);
    setIsReviewOpen(true);
  };

  const handleOpenVerification = (doc: PoeDocument) => {
    setSelectedDocForModal(doc);
    setIsVerifyOpen(true);
  };

  const handleViewFeedback = (doc: PoeDocument) => {
    setFeedbackDoc(doc);
  };

  const handleSubmitReview = (docId: string, review: PoeReview) => {
    const target = documents.find(d => d.id === docId);
    if (!target) return;

    const newReviews = [...(target.reviews || []), review];
    let newStatus: PoeStatus = target.status;
    if (review.decision === 'approved') newStatus = 'approved';
    else if (review.decision === 'revision_requested') newStatus = 'revision_requested';
    else if (review.decision === 'rejected') newStatus = 'rejected';

    const updatedDoc: PoeDocument = {
      ...target,
      status: newStatus,
      reviews: newReviews,
      dateModified: new Date().toISOString()
    };

    onUpdateDocument(updatedDoc);
  };

  const handleApplyVerification = (
    docId: string, 
    stamp: PoeVerificationStamp, 
    competencyGrade?: PoeCompetencyGrade
  ) => {
    const target = documents.find(d => d.id === docId);
    if (!target) return;

    const updatedDoc: PoeDocument = {
      ...target,
      status: 'verified',
      verificationStamp: stamp,
      competencyGrade: competencyGrade || target.competencyGrade || 'competent',
      dateModified: new Date().toISOString()
    };

    onUpdateDocument(updatedDoc);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 font-sans pb-16">
      
      {/* Top TVET Banner & Header */}
      <header className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl sticky top-0 z-30 border-b border-indigo-800/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Title & Brand */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-md shadow-indigo-900/40 border border-indigo-400/30">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-widest font-bold text-indigo-300">
                    Kitutu Chache TVC • TVETA / CDACC CBET
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Secure Portfolio Portal
                  </span>
                </div>
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  TVET Portfolio of Evidence (PoE)
                </h1>
              </div>
            </div>

            {/* User info, Persona Quick-Switcher, & Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Persona Quick Switcher */}
              {onSwitchUser && (
                <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/10 text-xs">
                  <Users className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                  <span className="text-[11px] text-indigo-200 hidden sm:inline">Role View:</span>
                  <select
                    value={currentUser.id}
                    onChange={(e) => {
                      const selected = allUsers.find(u => u.id === e.target.value);
                      if (selected) onSwitchUser(selected);
                    }}
                    className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer [&>option]:text-slate-900"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* In-app Notifications Button */}
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(true)}
                className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/10"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Audit Report Button */}
              <button
                type="button"
                onClick={() => setIsAuditReportOpen(true)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-300" />
                <span className="hidden sm:inline">Accreditation Report</span>
              </button>

              {/* Upload Document Button */}
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-700/50 flex items-center gap-1.5 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Evidence</span>
              </button>

              {onBackToMain && (
                <button
                  type="button"
                  onClick={onBackToMain}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                >
                  Exit PoE
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* KPI Summary Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Files</span>
              <span className="text-xl font-black text-slate-900 font-mono">{totalCount}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Verified Seal</span>
              <span className="text-xl font-black text-emerald-700 font-mono">{verifiedCount}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">In Review</span>
              <span className="text-xl font-black text-blue-700 font-mono">{pendingReviewCount}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Revisions</span>
              <span className="text-xl font-black text-amber-700 font-mono">{revisionCount}</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-indigo-900 to-slate-900 p-4 rounded-2xl text-white shadow-xs flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl">
              <Stamp className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">Compliance</span>
              <span className="text-xl font-black text-emerald-400 font-mono">{complianceRate}%</span>
            </div>
          </div>
        </section>

        {/* Trainee Banner if logged in as Trainee */}
        {isTrainee && (
          <div className="p-4 bg-gradient-to-r from-sky-600 to-indigo-700 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl">
                <Sparkles className="w-6 h-6 text-sky-200" />
              </div>
              <div>
                <h3 className="font-bold text-base">Trainee Competency Portfolio Dashboard</h3>
                <p className="text-xs text-sky-100">
                  Welcome <strong>{currentUser.name}</strong> ({currentUser.code || currentUser.username}). Upload workshop job cards, project blueprints, and attachment logbooks to achieve TVET Certification.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const verifiedOne = documents.find(d => d.ownerId === currentUser.id && d.status === 'verified');
                if (verifiedOne) setShowCertificateModal(verifiedOne);
                else alert('You currently have no verified items. Once your evidence is approved and verified by the Assessor/QA, your official certificate will appear here!');
              }}
              className="px-4 py-2 bg-white text-indigo-900 hover:bg-sky-50 rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Award className="w-4 h-4 text-indigo-700" />
              <span>View Verified Certificate</span>
            </button>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Documents ({documents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('trainer_poe')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'trainer_poe'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Trainer Portfolios ({documents.filter(d => d.poeType === 'trainer').length})</span>
            </button>

            <button
              onClick={() => setActiveTab('trainee_poe')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'trainee_poe'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Trainee Evidence ({documents.filter(d => d.poeType === 'trainee').length})</span>
            </button>

            <button
              onClick={() => setActiveTab('review_queue')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'review_queue'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Review Queue ({pendingReviewCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('verification')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'verification'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Stamp className="w-3.5 h-3.5" />
              <span>QA & Assessor Verification ({verifiedCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Compliance Analytics</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium px-2 hidden lg:block">
            Academic Session: <span className="font-bold text-slate-800">{academicSetting.academicYear} • {academicSetting.semester}</span>
          </div>
        </div>

        {/* Tab View: Compliance Analytics Tab */}
        {activeTab === 'analytics' ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Departmental TVET PoE Completion Analytics</h3>
                  <p className="text-xs text-slate-500">Live progress towards institutional 100% CBET accreditation readiness</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuditReportOpen(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Generate Accreditation Inspection Report</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {departments.map((dept) => {
                  const deptDocs = documents.filter(d => d.departmentId === dept.id);
                  const approved = deptDocs.filter(d => ['approved', 'verified'].includes(d.status)).length;
                  const schemes = deptDocs.filter(d => d.category === 'scheme_of_work').length;
                  const lessons = deptDocs.filter(d => d.category === 'lesson_plan').length;
                  const traineeItems = deptDocs.filter(d => d.poeType === 'trainee').length;
                  const pct = deptDocs.length > 0 ? Math.round((approved / deptDocs.length) * 100) : 0;

                  return (
                    <div key={dept.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-slate-900">{dept.name}</span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                          {dept.code}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-slate-500">Accredited Evidence</span>
                          <span className="text-slate-900 font-mono">{pct}% ({approved}/{deptDocs.length})</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-slate-200/60">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Schemes</span>
                          <span className="font-mono font-bold text-slate-800">{schemes}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Lessons</span>
                          <span className="font-mono font-bold text-slate-800">{lessons}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Trainee</span>
                          <span className="font-mono font-bold text-slate-800">{traineeItems}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Document Grid & Filters */
          <div className="space-y-4">
            
            {/* Search & Filter Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, owner, course, unit, or #tag..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-xs"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Department */}
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>

                {/* Status */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="revision_requested">Revision Requested</option>
                  <option value="approved">Approved</option>
                  <option value="verified">Verified Seal</option>
                </select>

                {/* Category */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value="all">All Categories</option>
                  <option value="scheme_of_work">Scheme of Work</option>
                  <option value="lesson_plan">Lesson Plan</option>
                  <option value="record_of_work">Record of Work</option>
                  <option value="practical_project">Practical Project</option>
                  <option value="industrial_attachment">Industrial Attachment</option>
                  <option value="competency_task">Competency Task</option>
                  <option value="cpd_certificate">CPD Certificate</option>
                </select>
              </div>

            </div>

            {/* Document Count Header */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Showing <strong>{filteredDocuments.length}</strong> of {documents.length} evidence items</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-indigo-600 hover:underline font-medium cursor-pointer"
                >
                  Clear search
                </button>
              )}
            </div>

            {/* Document Cards Grid */}
            {filteredDocuments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-3">
                <FileText className="w-10 h-10 mx-auto text-slate-300" />
                <h4 className="font-bold text-sm text-slate-700">No Evidence Found</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  No portfolio evidence documents match your selected filters or search query. Click below to upload a new document.
                </p>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Document</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDocuments.map((doc) => (
                  <PoeDocumentCard
                    key={doc.id}
                    document={doc}
                    currentUser={currentUser}
                    onOpenReview={handleOpenReview}
                    onOpenVerification={handleOpenVerification}
                    onViewFeedback={handleViewFeedback}
                    onDeleteDocument={onDeleteDocument}
                  />
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* Upload Modal */}
      <PoeUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        currentUser={currentUser}
        departments={departments}
        courses={courses}
        units={units}
        academicYear={academicSetting.academicYear}
        termSemester={academicSetting.semester}
        onSaveDocument={onSaveDocument}
      />

      {/* Review Modal */}
      <PoeReviewModal
        isOpen={isReviewOpen}
        onClose={() => {
          setIsReviewOpen(false);
          setSelectedDocForModal(null);
        }}
        document={selectedDocForModal}
        currentUser={currentUser}
        rubrics={rubrics}
        onSubmitReview={handleSubmitReview}
      />

      {/* Verification Modal */}
      <PoeVerificationModal
        isOpen={isVerifyOpen}
        onClose={() => {
          setIsVerifyOpen(false);
          setSelectedDocForModal(null);
        }}
        document={selectedDocForModal}
        currentUser={currentUser}
        onApplyVerification={handleApplyVerification}
      />

      {/* Audit Report Modal */}
      <PoeAuditReportModal
        isOpen={isAuditReportOpen}
        onClose={() => setIsAuditReportOpen(false)}
        documents={documents}
        departments={departments}
        academicYear={academicSetting.academicYear}
        termSemester={academicSetting.semester}
        currentUser={currentUser}
      />

      {/* Notifications Drawer */}
      <PoeNotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={onMarkNotificationRead}
        onMarkAllAsRead={onMarkAllNotificationsRead}
      />

      {/* Feedback History Modal */}
      {feedbackDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Review & Feedback Trail</h3>
                <p className="text-xs text-slate-300 truncate">{feedbackDoc.title}</p>
              </div>
              <button
                onClick={() => setFeedbackDoc(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {feedbackDoc.reviews && feedbackDoc.reviews.length > 0 ? (
                feedbackDoc.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{rev.reviewerName}</span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(rev.dateReviewed).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">{rev.feedbackComments}</p>
                    {rev.rubricScores && rev.rubricScores.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          Criteria Breakdown:
                        </span>
                        {rev.rubricScores.map((score, idx) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span className="text-slate-600">{score.criterionName}</span>
                            <span className="font-mono font-bold text-indigo-700">{score.scoreAwarded}/{score.maxScore}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                        rev.decision === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rev.decision.replace('_', ' ')}
                      </span>
                      {rev.overallScore !== undefined && (
                        <span className="font-bold text-slate-700">Total: {rev.overallScore}%</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No reviews have been recorded yet.</p>
              )}
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setFeedbackDoc(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trainee Verified Certificate Modal */}
      {showCertificateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 p-8 space-y-6 text-center text-slate-800">
            <div className="border-4 border-double border-indigo-900 p-6 rounded-xl space-y-4 relative">
              
              <div className="flex items-center justify-center gap-2 text-indigo-900 font-bold text-sm tracking-wide">
                <Building className="w-5 h-5 text-indigo-700" />
                <span>KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE</span>
              </div>

              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">
                Official TVET CBET Portfolio Competency Verification Certificate
              </span>

              <h2 className="text-xl font-black text-slate-900 uppercase pt-2">
                Certificate of Occupational Competence
              </h2>

              <p className="text-xs text-slate-600">
                This is to certify that the TVET portfolio evidence submitted by candidate:
              </p>

              <div className="py-2">
                <span className="text-lg font-black text-indigo-950 underline decoration-indigo-300">
                  {showCertificateModal.ownerName}
                </span>
                <span className="block text-xs font-mono font-bold text-slate-500 mt-0.5">
                  Registration No: {showCertificateModal.ownerIdentifier}
                </span>
              </div>

              <p className="text-xs text-slate-600 max-w-md mx-auto">
                for the competence unit <strong>{showCertificateModal.targetUnitName || showCertificateModal.title}</strong> has been comprehensively assessed and officially validated against national TVETA & CDACC standards.
              </p>

              <div className="py-2 flex items-center justify-center gap-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold uppercase">
                  <Stamp className="w-4 h-4 text-emerald-700" />
                  Outcome: {showCertificateModal.competencyGrade || 'COMPETENT'}
                </div>
                {showCertificateModal.verificationStamp && (
                  <span className="text-xs font-mono font-bold text-slate-600">
                    Seal: {showCertificateModal.verificationStamp.verificationCode}
                  </span>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs text-left">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Verified By</span>
                  <span className="font-bold text-slate-800">
                    {showCertificateModal.verificationStamp?.verifierName || 'Lead Verifier'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Date Issued</span>
                  <span className="font-mono text-slate-800">
                    {showCertificateModal.verificationStamp?.verificationDate 
                      ? new Date(showCertificateModal.verificationStamp.verificationDate).toLocaleDateString() 
                      : new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
              <button
                onClick={() => setShowCertificateModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
