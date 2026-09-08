import React from 'react';
import { 
  FileText, Download, CheckCircle2, Clock, AlertTriangle, XCircle, Award, 
  ShieldCheck, Stamp, MessageSquare, Tag, Eye, ArrowRight, User, Calendar, Trash2
} from 'lucide-react';
import { 
  PoeDocument, User as UserType, PoeStatus 
} from '../../types';

interface PoeDocumentCardProps {
  key?: React.Key;
  document: PoeDocument;
  currentUser: UserType;
  onOpenReview: (doc: PoeDocument) => void;
  onOpenVerification: (doc: PoeDocument) => void;
  onViewFeedback: (doc: PoeDocument) => void;
  onDeleteDocument?: (docId: string) => void;
}

export default function PoeDocumentCard({
  document: doc,
  currentUser,
  onOpenReview,
  onOpenVerification,
  onViewFeedback,
  onDeleteDocument
}: PoeDocumentCardProps) {
  // Role capabilities
  const canReview = [
    'admin', 'principal', 'deputy_academics', 'hod', 'trainer', 'quality_assurance', 'assessor'
  ].includes(currentUser.role) && doc.ownerId !== currentUser.id;

  const canVerify = [
    'admin', 'principal', 'deputy_academics', 'quality_assurance', 'assessor'
  ].includes(currentUser.role);

  const isOwner = doc.ownerId === currentUser.id;
  const canDelete = currentUser.role === 'admin' || (isOwner && ['draft', 'submitted'].includes(doc.status));

  // Status styling
  const getStatusBadge = (status: PoeStatus) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800 border border-teal-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            Approved
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            Under Review
          </span>
        );
      case 'revision_requested':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Revision Needed
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Submitted
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
            Draft
          </span>
        );
    }
  };

  const getCategoryLabel = (cat: string) => {
    return cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const latestReview = doc.reviews && doc.reviews.length > 0 ? doc.reviews[doc.reviews.length - 1] : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group">
      
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
              doc.poeType === 'trainer' 
                ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                : 'bg-sky-100 text-sky-800 border border-sky-200'
            }`}>
              {doc.poeType === 'trainer' ? 'Trainer PoE' : 'Trainee Evidence'}
            </span>

            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
              {getCategoryLabel(doc.category)}
            </span>

            {doc.competencyGrade && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${
                doc.competencyGrade === 'distinction'
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : doc.competencyGrade === 'competent'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-slate-100 text-slate-700'
              }`}>
                <Award className="w-3 h-3" />
                {doc.competencyGrade}
              </span>
            )}
          </div>

          <div className="shrink-0">
            {getStatusBadge(doc.status)}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-indigo-900 transition-colors mb-1.5">
          {doc.title}
        </h3>

        {/* Target Course & Unit */}
        {(doc.targetUnitName || doc.targetCourseName) && (
          <div className="text-xs text-slate-600 font-medium mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
            <span className="truncate">{doc.targetUnitName || doc.targetCourseName}</span>
          </div>
        )}

        {/* Description snippet if any */}
        {doc.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-3">
            {doc.description}
          </p>
        )}

        {/* Owner Info & Academic Context */}
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 text-xs space-y-1 mb-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              {doc.ownerName}
            </span>
            {doc.ownerIdentifier && (
              <span className="text-[10px] font-mono text-slate-500 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {doc.ownerIdentifier}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{doc.departmentName}</span>
            <span>{doc.academicYear} • {doc.termSemester}</span>
          </div>
        </div>

        {/* Verification Stamp Banner if Verified */}
        {doc.verificationStamp && (
          <div className="p-2.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl text-xs space-y-1 mb-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 flex items-center gap-1 text-[11px]">
                <Stamp className="w-3.5 h-3.5 text-emerald-700" />
                {doc.verificationStamp.standardsBody || 'TVET'} Seal Applied
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-800">
                {doc.verificationStamp.verificationCode}
              </span>
            </div>
            <p className="text-[11px] text-emerald-800/90 italic">
              "{doc.verificationStamp.comments}"
            </p>
          </div>
        )}

        {/* Latest Review Feedback Snippet if revision requested */}
        {doc.status === 'revision_requested' && latestReview && (
          <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1 mb-3">
            <div className="flex items-center justify-between text-[11px] text-amber-900 font-bold">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Reviewer Action Required
              </span>
              <span>{latestReview.reviewerName}</span>
            </div>
            <p className="text-[11px] text-amber-800 line-clamp-2">
              {latestReview.feedbackComments}
            </p>
          </div>
        )}

        {/* Tags */}
        {doc.tags && doc.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {doc.tags.map((tag, idx) => (
              <span key={idx} className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Details and Actions */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
          <span className="font-mono">{doc.fileName} ({doc.fileSize})</span>
          <span className="font-mono">{doc.version}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Left actions: Download & Feedback */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => alert(`Simulating download for: ${doc.fileName} (${doc.fileSize})`)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              title="Download / View Evidence"
            >
              <Download className="w-4 h-4" />
            </button>

            {doc.reviews && doc.reviews.length > 0 && (
              <button
                type="button"
                onClick={() => onViewFeedback(doc)}
                className="px-2.5 py-1 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                <span>Reviews ({doc.reviews.length})</span>
              </button>
            )}

            {canDelete && onDeleteDocument && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                    onDeleteDocument(doc.id);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title="Delete Evidence"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right actions: Review or Verify buttons */}
          <div className="flex items-center gap-1.5">
            {canReview && (
              <button
                type="button"
                onClick={() => onOpenReview(doc)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Review / Grade</span>
              </button>
            )}

            {canVerify && doc.status !== 'verified' && (
              <button
                type="button"
                onClick={() => onOpenVerification(doc)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Stamp className="w-3.5 h-3.5" />
                <span>Verify Stamp</span>
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
