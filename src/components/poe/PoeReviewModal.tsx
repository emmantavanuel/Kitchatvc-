import React, { useState } from 'react';
import { 
  X, CheckCircle2, AlertTriangle, XCircle, Star, MessageSquare, Download, 
  FileText, User, Calendar, Award, ShieldCheck, Sparkles 
} from 'lucide-react';
import { 
  User as UserType, PoeDocument, PoeReview, PoeRubric, PoeRubricScore 
} from '../../types';

interface PoeReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: PoeDocument | null;
  currentUser: UserType;
  rubrics: PoeRubric[];
  onSubmitReview: (docId: string, review: PoeReview) => void;
}

export default function PoeReviewModal({
  isOpen,
  onClose,
  document: doc,
  currentUser,
  rubrics,
  onSubmitReview
}: PoeReviewModalProps) {
  if (!isOpen || !doc) return null;

  // Find matching rubric if applicable
  const matchingRubric = rubrics.find(r => r.targetCategory === doc.category);

  // Initialize criterion scores
  const [criterionScores, setCriterionScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (matchingRubric) {
      matchingRubric.criteria.forEach(c => {
        initial[c.id] = Math.round(c.maxScore * 0.85); // default to 85%
      });
    }
    return initial;
  });

  const [decision, setDecision] = useState<'approved' | 'revision_requested' | 'rejected'>('approved');
  const [feedbackComments, setFeedbackComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate total score
  const totalMaxScore = matchingRubric 
    ? matchingRubric.criteria.reduce((sum, c) => sum + c.maxScore, 0) 
    : 100;
  
  const totalAwardedScore = matchingRubric
    ? matchingRubric.criteria.reduce((sum, c) => sum + (criterionScores[c.id] || 0), 0)
    : 85;

  const scorePercentage = Math.round((totalAwardedScore / totalMaxScore) * 100);

  const quickFeedbackTemplates = [
    'Fully meets TVET CDACC occupational competence standards. Well articulated.',
    'Practical laboratory/workshop demonstration hours satisfy the curriculum threshold.',
    'Revision required: Please include the occupational safety & hazard mitigation plan in section 2.',
    'Please recalculate the circuit parameters and re-submit version 1.2 for final sign-off.',
    'Superb craftsmanship and meticulous documentation in the technical portfolio.'
  ];

  const handleScoreChange = (criterionId: string, value: number, max: number) => {
    const clamped = Math.max(0, Math.min(max, value));
    setCriterionScores(prev => ({ ...prev, [criterionId]: clamped }));
  };

  const handleApplyTemplate = (text: string) => {
    if (!feedbackComments) {
      setFeedbackComments(text);
    } else {
      setFeedbackComments(prev => `${prev}\n• ${text}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComments.trim()) return;

    setIsSubmitting(true);

    const rubricScores: PoeRubricScore[] = matchingRubric 
      ? matchingRubric.criteria.map(c => ({
          criterionId: c.id,
          criterionName: c.name,
          maxScore: c.maxScore,
          scoreAwarded: criterionScores[c.id] || 0
        }))
      : [];

    const newReview: PoeReview = {
      id: `rev_${Date.now()}`,
      documentId: doc.id,
      reviewerId: currentUser.id,
      reviewerName: `${currentUser.name} (${currentUser.role.toUpperCase()})`,
      reviewerRole: currentUser.role,
      dateReviewed: new Date().toISOString(),
      feedbackComments: feedbackComments.trim(),
      rubricScores: rubricScores.length > 0 ? rubricScores : undefined,
      overallScore: scorePercentage,
      maxPossibleScore: 100,
      decision
    };

    onSubmitReview(doc.id, newReview);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/50 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">TVET Competency Review & Grading</h3>
              <p className="text-xs text-indigo-200">
                Evaluation by {currentUser.name} • {currentUser.role.toUpperCase()}
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
        <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto text-slate-700">
          
          {/* Document Summary Header Card */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 mb-1">
                  {doc.category.replace(/_/g, ' ')}
                </span>
                <h4 className="font-bold text-base text-slate-900">{doc.title}</h4>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert(`Opening simulated download for: ${doc.fileName} (${doc.fileSize})`)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Download / Preview Document</span>
                </button>
              </div>
            </div>

            {doc.description && (
              <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-100">
                "{doc.description}"
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Submitted By</span>
                <span className="font-semibold text-slate-800">{doc.ownerName}</span>
                {doc.ownerIdentifier && (
                  <span className="text-[10px] font-mono text-slate-500 block">{doc.ownerIdentifier}</span>
                )}
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Unit</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {doc.targetUnitName || 'General / Interdisciplinary'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Academic Session</span>
                <span className="font-semibold text-slate-800">{doc.academicYear} • {doc.termSemester}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">File & Version</span>
                <span className="font-semibold text-slate-800 font-mono text-[11px]">{doc.fileName} ({doc.version})</span>
              </div>
            </div>
          </div>

          {/* Previous Reviews History if any */}
          {doc.reviews && doc.reviews.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                Previous Review Trail ({doc.reviews.length})
              </h5>
              <div className="space-y-2">
                {doc.reviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">{rev.reviewerName}</span>
                      <span className="text-slate-400 font-mono">
                        {new Date(rev.dateReviewed).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600">{rev.feedbackComments}</p>
                    <div className="flex items-center gap-2 pt-1 text-[10px]">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                        rev.decision === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Decision: {rev.decision.replace('_', ' ')}
                      </span>
                      {rev.overallScore !== undefined && (
                        <span className="font-semibold text-slate-500">Score: {rev.overallScore}%</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Rubric Criteria Evaluation */}
            {matchingRubric ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-indigo-600" />
                      TVET Assessment Rubric: {matchingRubric.title}
                    </h5>
                    <p className="text-[11px] text-slate-500">Grade each occupational competency criterion</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Overall Score</span>
                    <span className={`text-lg font-black font-mono ${
                      scorePercentage >= 75 ? 'text-emerald-600' : scorePercentage >= 50 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {scorePercentage}%
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {matchingRubric.criteria.map((crit) => {
                    const currentVal = criterionScores[crit.id] ?? 0;
                    return (
                      <div key={crit.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{crit.name}</span>
                          <span className="font-mono font-bold text-indigo-700 text-xs">
                            {currentVal} / {crit.maxScore} pts
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{crit.description}</p>
                        <div className="flex items-center gap-3 pt-1">
                          <input
                            type="range"
                            min={0}
                            max={crit.maxScore}
                            value={currentVal}
                            onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value) || 0, crit.maxScore)}
                            className="flex-1 accent-indigo-600 cursor-pointer"
                          />
                          <input
                            type="number"
                            min={0}
                            max={crit.maxScore}
                            value={currentVal}
                            onChange={(e) => handleScoreChange(crit.id, parseInt(e.target.value) || 0, crit.maxScore)}
                            className="w-14 px-2 py-1 border border-slate-300 rounded text-center text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">Standard TVET Professional Evidence Assessment</span>
                <p className="text-slate-500">
                  Standard rubric applies for this document type. Evaluate adherence to institutional and CDACC standards below.
                </p>
              </div>
            )}

            {/* Review Decision Choice */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Assessment Verdict & Decision <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setDecision('approved')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    decision === 'approved'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <CheckCircle2 className={`w-5 h-5 ${decision === 'approved' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-xs">Approve Evidence</span>
                  <span className="text-[10px] text-emerald-700/80 font-normal">Meets Competency Criteria</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('revision_requested')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    decision === 'revision_requested'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <AlertTriangle className={`w-5 h-5 ${decision === 'revision_requested' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className="text-xs">Request Revision</span>
                  <span className="text-[10px] text-amber-700/80 font-normal">Corrections Needed</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('rejected')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    decision === 'rejected'
                      ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <XCircle className={`w-5 h-5 ${decision === 'rejected' ? 'text-red-600' : 'text-slate-400'}`} />
                  <span className="text-xs">Reject Document</span>
                  <span className="text-[10px] text-red-700/80 font-normal">Non-Compliant</span>
                </button>
              </div>
            </div>

            {/* Feedback Comments */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Detailed Feedback Comments & Required Actions <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Clear feedback for the candidate</span>
              </div>
              
              <textarea
                required
                rows={4}
                value={feedbackComments}
                onChange={(e) => setFeedbackComments(e.target.value)}
                placeholder="Provide constructive, criterion-based feedback. If requesting revision, outline exact corrections needed before resubmission..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
              />

              {/* Quick Template Snippets */}
              <div className="mt-2 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Quick Commentary Templates:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickFeedbackTemplates.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-800 text-[11px] transition-colors text-left border border-slate-200/80 cursor-pointer"
                    >
                      + {tmpl.slice(0, 48)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
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
                disabled={isSubmitting || !feedbackComments.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                  decision === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                    : decision === 'revision_requested'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit {decision === 'approved' ? 'Approval' : decision === 'revision_requested' ? 'Revision Request' : 'Rejection'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
