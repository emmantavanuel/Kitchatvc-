import React, { useState } from 'react';
import { 
  X, ShieldCheck, Award, CheckCircle2, AlertTriangle, FileCheck, Stamp, Sparkles, Building
} from 'lucide-react';
import { 
  User, PoeDocument, PoeVerificationStamp, PoeCompetencyGrade 
} from '../../types';

interface PoeVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: PoeDocument | null;
  currentUser: User;
  onApplyVerification: (docId: string, stamp: PoeVerificationStamp, competencyGrade?: PoeCompetencyGrade) => void;
}

export default function PoeVerificationModal({
  isOpen,
  onClose,
  document: doc,
  currentUser,
  onApplyVerification
}: PoeVerificationModalProps) {
  if (!isOpen || !doc) return null;

  const defaultCode = `KTVC-${currentUser.role === 'quality_assurance' ? 'QA' : currentUser.role === 'assessor' ? 'IV' : 'DEP'}-${Date.now().toString().slice(-5)}`;

  const [verificationCode, setVerificationCode] = useState(defaultCode);
  const [complianceStatus, setComplianceStatus] = useState<'fully_compliant' | 'minor_gaps_noted' | 'non_compliant'>('fully_compliant');
  const [standardsBody, setStandardsBody] = useState<'TVETA' | 'CDACC' | 'KNEC' | 'INTERNAL_QA'>('TVETA');
  const [competencyGrade, setCompetencyGrade] = useState<PoeCompetencyGrade>(
    doc.poeType === 'trainee' ? 'competent' : 'competent'
  );
  const [comments, setComments] = useState(
    `Formally inspected and verified against TVET CBET criteria. Evidence meets national benchmarks for occupational competence.`
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const stamp: PoeVerificationStamp = {
      verifiedBy: currentUser.id,
      verifierName: currentUser.name,
      verifierRole: currentUser.role,
      verificationDate: new Date().toISOString(),
      verificationCode: verificationCode.trim() || defaultCode,
      comments: comments.trim(),
      complianceStatus,
      standardsBody
    };

    onApplyVerification(doc.id, stamp, competencyGrade);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600/50 rounded-xl">
              <Stamp className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">TVET Quality Verification & Accreditation Stamp</h3>
              <p className="text-xs text-emerald-200">
                Official Regulatory Seal • {currentUser.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-slate-700 max-h-[80vh] overflow-y-auto">
          
          {/* Target Document Brief */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-500">{doc.category.replace(/_/g, ' ')}</span>
              <span className="font-mono text-slate-400">{doc.version}</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">{doc.title}</h4>
            <p className="text-xs text-slate-600">
              Submitted by <strong>{doc.ownerName}</strong> ({doc.ownerRole.toUpperCase()}) • {doc.departmentName}
            </p>
          </div>

          {/* Verification Code & Regulatory Body */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Accreditation Standards Body
              </label>
              <select
                value={standardsBody}
                onChange={(e) => setStandardsBody(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:outline-none focus:border-emerald-600"
              >
                <option value="TVETA">TVETA (Technical & Vocational Education Authority)</option>
                <option value="CDACC">CDACC (Curriculum Dev. Assessment & Cert. Council)</option>
                <option value="KNEC">KNEC (Kenya National Examinations Council)</option>
                <option value="INTERNAL_QA">Internal Institutional Quality Assurance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Verification Security Stamp Code
              </label>
              <input
                type="text"
                required
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-emerald-800 bg-emerald-50/50"
              />
            </div>
          </div>

          {/* Compliance Status Radio / Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Regulatory Compliance Status
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setComplianceStatus('fully_compliant')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  complianceStatus === 'fully_compliant'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 ${complianceStatus === 'fully_compliant' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="text-xs">Fully Compliant</span>
                <span className="text-[10px] text-emerald-700/80">100% Standards Met</span>
              </button>

              <button
                type="button"
                onClick={() => setComplianceStatus('minor_gaps_noted')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  complianceStatus === 'minor_gaps_noted'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 ${complianceStatus === 'minor_gaps_noted' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span className="text-xs">Minor Gaps</span>
                <span className="text-[10px] text-amber-700/80">Conditional Pass</span>
              </button>

              <button
                type="button"
                onClick={() => setComplianceStatus('non_compliant')}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  complianceStatus === 'non_compliant'
                    ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                <X className={`w-5 h-5 ${complianceStatus === 'non_compliant' ? 'text-red-600' : 'text-slate-400'}`} />
                <span className="text-xs">Non-Compliant</span>
                <span className="text-[10px] text-red-700/80">Failed Audit</span>
              </button>
            </div>
          </div>

          {/* Competency Grade (for trainees or practical portfolios) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Awarded Competency Outcome
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { grade: 'competent', label: 'Competent (C)', desc: 'Passed criteria' },
                { grade: 'distinction', label: 'Distinction', desc: 'Exemplary execution' },
                { grade: 'credit', label: 'Credit', desc: 'Above average' },
                { grade: 'not_yet_competent', label: 'NYC', desc: 'Requires re-assessment' }
              ].map((item) => (
                <button
                  key={item.grade}
                  type="button"
                  onClick={() => setCompetencyGrade(item.grade as any)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    competencyGrade === item.grade
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-bold ring-2 ring-emerald-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-xs">{item.label}</span>
                  <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Verifier Endorsement Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Official Verifier Endorsement & Audit Remarks
            </label>
            <textarea
              rows={3}
              required
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs"
            />
          </div>

          {/* Live Preview of Verification Badge */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-emerald-600 flex items-center justify-center bg-white text-emerald-700 shadow-xs">
                <Stamp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Digital Verification Seal
                </span>
                <span className="text-xs font-mono font-bold text-slate-900">{verificationCode}</span>
                <span className="text-[11px] text-slate-500 block">
                  Certified by {currentUser.name} • {standardsBody} Accredited
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                {complianceStatus.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-200 flex items-center gap-2 cursor-pointer"
            >
              <Stamp className="w-4 h-4" />
              <span>Sign & Apply TVET Stamp</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
