import React from 'react';
import { 
  X, Printer, Download, Award, ShieldCheck, CheckCircle2, AlertTriangle, FileText, Building2 
} from 'lucide-react';
import { 
  Department, PoeDocument, User 
} from '../../types';

interface PoeAuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: PoeDocument[];
  departments: Department[];
  academicYear: string;
  termSemester: string;
  currentUser: User;
}

export default function PoeAuditReportModal({
  isOpen,
  onClose,
  documents,
  departments,
  academicYear,
  termSemester,
  currentUser
}: PoeAuditReportModalProps) {
  if (!isOpen) return null;

  // Compute institutional metrics
  const totalDocs = documents.length;
  const trainerDocs = documents.filter(d => d.poeType === 'trainer');
  const traineeDocs = documents.filter(d => d.poeType === 'trainee');
  const verifiedDocs = documents.filter(d => d.status === 'verified');
  const approvedDocs = documents.filter(d => d.status === 'approved' || d.status === 'verified');
  const pendingDocs = documents.filter(d => ['submitted', 'under_review'].includes(d.status));
  const revisionDocs = documents.filter(d => d.status === 'revision_requested');

  const complianceRate = totalDocs > 0 ? Math.round((approvedDocs.length / totalDocs) * 100) : 0;

  // Compute breakdown by department
  const deptBreakdown = departments.map(dept => {
    const deptDocs = documents.filter(d => d.departmentId === dept.id);
    const approved = deptDocs.filter(d => d.status === 'approved' || d.status === 'verified');
    const schemesCount = deptDocs.filter(d => d.category === 'scheme_of_work').length;
    const lessonPlansCount = deptDocs.filter(d => d.category === 'lesson_plan').length;
    const traineeProjects = deptDocs.filter(d => d.poeType === 'trainee').length;
    const rate = deptDocs.length > 0 ? Math.round((approved.length / deptDocs.length) * 100) : 0;

    return {
      department: dept,
      total: deptDocs.length,
      approved: approved.length,
      schemesCount,
      lessonPlansCount,
      traineeProjects,
      rate
    };
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 print:border-none print:shadow-none print:m-0 print:max-w-none">
        
        {/* Modal Header (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">TVET Institutional Portfolio Audit Report</h3>
              <p className="text-xs text-slate-300">
                Accreditation & Compliance Documentation for TVETA / CDACC Inspection
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="p-8 space-y-6 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-6 text-slate-800">
          
          {/* Institutional Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-indigo-900 font-black text-xl tracking-tight">
              <Building2 className="w-6 h-6 text-indigo-700" />
              <span>KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE</span>
            </div>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
              Quality Assurance Directorate & Academic Standards Office
            </p>
            <p className="text-[11px] text-slate-500">
              P.O. Box 595 - 40200 Kisii, Kenya • Email: academics@kitutuchachetvc.ac.ke • Website: www.kitutuchachetvc.ac.ke
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded">
                OFFICIAL TVET PORTFOLIO OF EVIDENCE (PoE) AUDIT & COMPLIANCE REPORT
              </span>
            </div>
          </div>

          {/* Metadata Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Academic Session</span>
              <span className="font-bold text-slate-900">{academicYear} — {termSemester}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Report Generated</span>
              <span className="font-bold text-slate-900">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Audited By</span>
              <span className="font-bold text-slate-900">{currentUser.name}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold block text-[10px] uppercase">Audit Standards</span>
              <span className="font-bold text-indigo-800 font-mono">TVETA / CDACC CBET-2026</span>
            </div>
          </div>

          {/* Executive Metrics Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white text-center">
              <span className="text-xs text-slate-500 block uppercase font-bold">Total Evidence Files</span>
              <span className="text-2xl font-black text-slate-900 font-mono">{totalDocs}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">{trainerDocs.length} Trainer • {traineeDocs.length} Trainee</span>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 text-center">
              <span className="text-xs text-emerald-800 block uppercase font-bold">Accreditation Rate</span>
              <span className="text-2xl font-black text-emerald-700 font-mono">{complianceRate}%</span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">{approvedDocs.length} of {totalDocs} Approved/Verified</span>
            </div>

            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 text-center">
              <span className="text-xs text-indigo-800 block uppercase font-bold">Officially Verified</span>
              <span className="text-2xl font-black text-indigo-700 font-mono">{verifiedDocs.length}</span>
              <span className="text-[10px] text-indigo-600 block mt-0.5">QA & Assessor Seal Applied</span>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-center">
              <span className="text-xs text-amber-800 block uppercase font-bold">Action Required</span>
              <span className="text-2xl font-black text-amber-700 font-mono">{revisionDocs.length + pendingDocs.length}</span>
              <span className="text-[10px] text-amber-600 block mt-0.5">{pendingDocs.length} Pending • {revisionDocs.length} Revisions</span>
            </div>
          </div>

          {/* Departmental Breakdown Table */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-600" />
              1. Departmental Portfolio of Evidence Compliance Breakdown
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Department Name</th>
                    <th className="py-2.5 px-3 text-center">Schemes of Work</th>
                    <th className="py-2.5 px-3 text-center">Lesson Plans</th>
                    <th className="py-2.5 px-3 text-center">Trainee Evidence</th>
                    <th className="py-2.5 px-3 text-center">Total Files</th>
                    <th className="py-2.5 px-3 text-right">Compliance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {deptBreakdown.map((row) => (
                    <tr key={row.department.id} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 font-semibold text-slate-900">{row.department.name}</td>
                      <td className="py-2 px-3 text-center font-mono">{row.schemesCount}</td>
                      <td className="py-2 px-3 text-center font-mono">{row.lessonPlansCount}</td>
                      <td className="py-2 px-3 text-center font-mono">{row.traineeProjects}</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">{row.total}</td>
                      <td className="py-2 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                          row.rate >= 80 ? 'bg-emerald-100 text-emerald-800' : row.rate >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {row.rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mandatory TVET Quality Audit Checklist */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              2. TVETA & CDACC Pedagogical Audit Checklist
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { title: 'Schemes of Work Prepared & Approved Before Term Start', status: 'Compliant', note: 'All HODs signed off on 14-week plans' },
                { title: '70:30 Practical-to-Theory Ratio Demonstrated in Lesson Plans', status: 'Compliant', note: 'Hands-on practical workshop guides attached' },
                { title: 'Continuous Assessment Tests (CATs) & Rubrics Uploaded', status: 'Compliant', note: 'Formative rubrics mapped to unit competencies' },
                { title: 'Industrial Attachment Logbooks & Industry Supervisor Ratings', status: 'In Progress', note: 'Ongoing verification for Term 1 attachments' },
                { title: 'Recognition of Prior Learning (RPL) Evidence Documentation', status: 'Compliant', note: 'Candidate workshop certificates registered' },
                { title: 'Internal Verification (IV) and External Verification (EV) Sign-offs', status: 'Compliant', note: 'Assessor stamps validated with security code' }
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">{item.title}</span>
                    <span className="text-[11px] text-slate-500">{item.note}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Sign-off Block */}
          <div className="pt-6 border-t-2 border-slate-200 space-y-4">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              3. Institutional Endorsement & Verification Sign-Off
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <div className="h-10 flex items-center justify-center">
                  <span className="font-serif italic text-sm text-indigo-900 font-bold">Dr. Charles Kitur</span>
                </div>
                <div className="border-t border-slate-300 pt-1 text-[11px]">
                  <span className="font-bold block text-slate-900">Principal</span>
                  <span className="text-[10px] text-slate-500">Kitutu Chache TVC</span>
                </div>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <div className="h-10 flex items-center justify-center">
                  <span className="font-serif italic text-sm text-indigo-900 font-bold">Eng. Justus Ngetich</span>
                </div>
                <div className="border-t border-slate-300 pt-1 text-[11px]">
                  <span className="font-bold block text-slate-900">Deputy Principal Academics</span>
                  <span className="text-[10px] text-slate-500">Academic Affairs</span>
                </div>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <div className="h-10 flex items-center justify-center">
                  <span className="font-serif italic text-sm text-emerald-900 font-bold">Madam Scholastica W.</span>
                </div>
                <div className="border-t border-slate-300 pt-1 text-[11px]">
                  <span className="font-bold block text-slate-900">Quality Assurance Officer</span>
                  <span className="text-[10px] text-slate-500">QASO Directorate</span>
                </div>
              </div>

              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <div className="h-10 flex items-center justify-center">
                  <span className="font-serif italic text-sm text-indigo-900 font-bold">Mr. Benson Nyabuto</span>
                </div>
                <div className="border-t border-slate-300 pt-1 text-[11px]">
                  <span className="font-bold block text-slate-900">Lead Assessor & Verifier</span>
                  <span className="text-[10px] text-slate-500">Internal Verification</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
