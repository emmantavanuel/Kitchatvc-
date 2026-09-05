import React, { useState } from 'react';
import { X, Search, CheckCircle, Clock, AlertCircle, Award, FileText, ArrowRight, Phone, Mail } from 'lucide-react';
import { AdmissionApplication } from '../types';

interface ApplicationStatusModalProps {
  applications: AdmissionApplication[];
  onClose: () => void;
  onOpenLetter: (app: AdmissionApplication) => void;
}

export default function ApplicationStatusModal({ applications, onClose, onOpenLetter }: ApplicationStatusModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [foundApp, setFoundApp] = useState<AdmissionApplication | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setHasSearched(true);
    const cleaned = searchTerm.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const match = applications.find(app => {
      const matchId = app.id.toLowerCase().includes(cleaned);
      const matchNatId = app.nationalId && app.nationalId.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleaned);
      const matchIndex = app.indexNumber && app.indexNumber.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleaned);
      const matchAdm = app.admissionNumber && app.admissionNumber.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleaned);
      const matchPhone = app.phone && app.phone.replace(/[^0-9]/g, '').includes(cleaned);
      const matchEmail = app.email && app.email.toLowerCase().includes(cleaned);
      return matchId || matchNatId || matchIndex || matchAdm || matchPhone || matchEmail;
    });

    setFoundApp(match || null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#B88856] via-[#C29563] to-[#D4A97A] text-white px-6 py-5 flex items-center justify-between border-b border-white/20 shadow-sm">
          <div className="flex items-center gap-3">
            <Search className="w-6 h-6 text-white" />
            <div>
              <h3 className="font-bold text-lg text-white">Check Trainee Admission Status</h3>
              <p className="text-xs text-[#FDF4EA] font-medium">Kitutu Chache TVC • Office of the Registrar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Form */}
        <div className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2E1E12] mb-1">
                Enter National ID, KCSE Index Number, or Application Ref:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. 38495029 or 38610015/042 or APP_001"
                  className="w-full px-4 py-3 pl-11 text-sm bg-[#FAF6F0] border border-[#EADBCA] rounded-xl focus:ring-2 focus:ring-[#C29563] focus:bg-white focus:outline-none transition-all font-medium text-[#1F1309]"
                  autoFocus
                />
                <Search className="w-5 h-5 text-[#BA8D5C] absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-[#5C4B3C] mt-1 font-medium">
                Search using the KCSE Index Number, National ID/Birth Cert, or Phone Number you registered with.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#C29563] hover:bg-[#B28452] active:bg-[#A37442] text-white font-bold text-sm rounded-xl transition-colors shadow flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4 text-white" />
              Verify Admission Status
            </button>
          </form>

          {/* Results Area */}
          {hasSearched && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              {foundApp ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  {foundApp.status === 'admitted' ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded uppercase tracking-wider mb-1">
                          ADMISSION APPROVED
                        </span>
                        <h4 className="text-base font-black text-emerald-950">
                          Congratulations, {foundApp.applicantName}!
                        </h4>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          Your application has been reviewed and officially approved by the Registrar.
                        </p>
                      </div>
                    </div>
                  ) : foundApp.status === 'rejected' ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded uppercase tracking-wider mb-1">
                          APPLICATION UNSUCCESSFUL
                        </span>
                        <h4 className="text-base font-bold text-rose-950">
                          Application Not Approved
                        </h4>
                        <p className="text-xs text-rose-800 mt-0.5">
                          {foundApp.remarks || 'Your qualifications did not match the entry requirement for this course. Please contact the admissions office.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                      <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="inline-block px-2 py-0.5 bg-amber-600 text-white text-[10px] font-black rounded uppercase tracking-wider mb-1">
                          UNDER REVIEW
                        </span>
                        <h4 className="text-base font-bold text-amber-950">
                          Application Pending Registrar Approval
                        </h4>
                        <p className="text-xs text-amber-800 mt-0.5">
                          Your credentials are currently undergoing review by the Academic Registrar. You will receive an SMS and email notification once verified.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Trainee Details Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Trainee Full Name:</span>
                      <strong className="text-slate-900 uppercase font-bold">{foundApp.applicantName}</strong>
                    </div>
                    <div className="flex justify-between pb-2 border-b border-slate-200">
                      <span className="text-slate-500 font-medium">Course Allocated:</span>
                      <strong className="text-slate-900 text-right">{foundApp.courseName || foundApp.courseId}</strong>
                    </div>
                    {foundApp.admissionNumber && (
                      <div className="flex justify-between items-center py-1.5 px-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <span className="text-blue-900 font-bold">Official Admission Number:</span>
                        <strong className="text-sm font-black font-mono text-blue-800 tracking-wider">
                          {foundApp.admissionNumber}
                        </strong>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">KCSE Index / Grade:</span>
                      <span className="text-slate-800">{foundApp.indexNumber || 'N/A'} ({foundApp.meanGrade || 'N/A'})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Date Submitted:</span>
                      <span className="text-slate-800">{foundApp.dateApplied}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Intake Period:</span>
                      <span className="text-slate-800 font-bold">September 2026 Intake</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {foundApp.status === 'admitted' && (
                    <button
                      onClick={() => onOpenLetter(foundApp)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <Award className="w-5 h-5 text-amber-300" />
                      View & Download Official Admission Letter (PDF)
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm">No Application Record Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    We could not find an admission record matching "<span className="font-semibold text-slate-700">{searchTerm}</span>". 
                    Please verify the number or submit a new application through the Trainee Registration form.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Help contacts */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-blue-600" /> Admissions: +254 774 703 453</span>
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-600" /> kitutuchachetvc@gmail.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
