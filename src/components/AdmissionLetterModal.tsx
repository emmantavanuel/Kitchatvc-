import React, { useRef } from 'react';
import { X, Printer, Download, CheckCircle, ShieldCheck, Award } from 'lucide-react';
import { AdmissionApplication } from '../types';
import kitchaLogo from '../assets/images/kitcha_tvc_logo.jpg';

interface AdmissionLetterModalProps {
  application: AdmissionApplication;
  onClose: () => void;
}

export default function AdmissionLetterModal({ application, onClose }: AdmissionLetterModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const admNo = application.admissionNumber || application.autoRegNumber || `KTTVC/2026/${application.id.slice(-4)}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none">
        {/* Header Bar - Hidden on print */}
        <div className="bg-gradient-to-r from-[#B88856] via-[#C29563] to-[#D4A97A] text-white px-6 py-4 flex items-center justify-between print:hidden border-b border-white/20 shadow-sm">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-white" />
            <div>
              <h3 className="font-bold text-lg text-white">Official Provisional Admission Letter</h3>
              <p className="text-xs text-[#FDF4EA] font-medium">Kitutu Chache Technical and Vocational College • Office of the Registrar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white hover:bg-[#FAF5EE] text-[#523414] font-black text-sm rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4 text-[#8F6335]" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Body */}
        <div ref={printRef} className="p-8 sm:p-12 overflow-y-auto bg-white text-slate-800 print:p-6 print:overflow-visible">
          {/* Institutional Letterhead */}
          <div className="border-b-2 border-amber-600 pb-6 mb-6">
            <div className="flex items-center justify-between gap-6">
              <img
                src={kitchaLogo}
                alt="KITCHA TVC Logo"
                className="w-24 h-24 object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="text-center flex-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                  KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE
                </h1>
                <p className="text-xs font-semibold text-amber-700 tracking-wider uppercase mt-0.5">
                  Ministry of Education • State Department for TVET
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  P.O. Box 376 - 40200 Kisii, Kenya | Mobile: +254 774 703 453 | Email: kitutuchachetvc@gmail.com
                </p>
                <p className="text-xs text-slate-500">
                  Location: Off Kisii Town - Nyamataro Road | Web: https://kitchatvc.ac.ke
                </p>
              </div>
              <div className="w-24 hidden sm:flex flex-col items-center justify-center border border-dashed border-slate-300 rounded p-2 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Affix Passport Photo Here</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs font-semibold text-slate-700">
              <span>OUR REF: KTTVC/ADM/2026/OFFER</span>
              <span className="text-amber-800 bg-amber-50 px-3 py-1 rounded border border-amber-200">
                OFFICIAL ADMISSION NO: <strong className="text-sm font-black">{admNo}</strong>
              </span>
              <span>DATE: {todayStr}</span>
            </div>
          </div>

          {/* Recipient Details */}
          <div className="mb-6 text-sm text-slate-800">
            <p className="font-bold text-base text-slate-900 uppercase">{application.applicantName}</p>
            <p>Index Number: <strong className="font-mono">{application.indexNumber || 'N/A'}</strong> | KCSE Mean Grade: <strong>{application.meanGrade || 'Eligible'}</strong></p>
            <p>National ID / Birth Cert: {application.nationalId || 'Provided'}</p>
            <p>Mobile: {application.phone} | Email: {application.email}</p>
            <p>County: {application.county || 'Kisii'} | Postal: {application.postalAddress || 'P.O. Box 40200 Kisii'}</p>
          </div>

          {/* Letter Title */}
          <div className="bg-slate-50 border-y border-slate-200 py-2.5 px-4 mb-6 text-center">
            <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-wide uppercase">
              RE: PROVISIONAL OFFER OF ADMISSION FOR ACADEMIC YEAR 2026/2027
            </h2>
          </div>

          {/* Letter Content */}
          <div className="space-y-4 text-sm leading-relaxed text-slate-700 text-justify">
            <p>
              I am pleased to inform you that following your application, you have been offered provisional admission to 
              <strong> KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE</strong> to pursue the following program:
            </p>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 my-3 text-slate-900">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                <div><span className="text-slate-500 font-medium">Program of Study:</span> <strong className="block text-slate-900">{application.courseName || application.courseId}</strong></div>
                <div><span className="text-slate-500 font-medium">Academic Department:</span> <strong className="block text-slate-900">{application.departmentName || 'Technical Department'}</strong></div>
                <div><span className="text-slate-500 font-medium">Reporting Date:</span> <strong className="block text-amber-900">Monday, 21st September 2026 at 8:00 AM</strong></div>
                <div><span className="text-slate-500 font-medium">Mode of Study:</span> <strong className="block text-slate-900">{application.modeOfStudy || 'Full-Time (CBET)'}</strong></div>
                <div><span className="text-slate-500 font-medium">Sponsorship Category:</span> <strong className="block text-slate-900 uppercase">{application.sponsorType || 'Government / Self'}</strong></div>
                <div><span className="text-slate-500 font-medium">Assessing Examination Body:</span> <strong className="block text-slate-900">TVET-CDACC / KNEC</strong></div>
              </div>
            </div>

            <p>
              This offer is subject to satisfactory verification of your academic qualifications, original certificates, and compliance with the college rules and regulations. On reporting day, you are required to present the following:
            </p>

            <ol className="list-decimal list-inside space-y-1 pl-2 text-xs sm:text-sm">
              <li>Original and two (2) photocopies of KCSE Result Slip / Leaving Certificate.</li>
              <li>Original and two (2) photocopies of National Identity Card or Birth Certificate.</li>
              <li>Four (4) recent colored passport-size photographs (name written on reverse).</li>
              <li>Completed Medical Examination Report endorsed by a registered Government Medical Officer.</li>
              <li>Original Bank Deposit Slip or M-PESA Confirmation for the First Term fees as per the official fee schedule.</li>
            </ol>

            <p>
              Please note that official college accommodation is limited and allocated on a first-come, first-served basis upon full registration. 
              Private accredited hostels are available within walking distance of the college campus along the Kisii-Nyamataro road.
            </p>

            <p>
              We look forward to welcoming you to Kitutu Chache TVC as you embark on acquiring practical, industry-grade skills for national development.
            </p>
          </div>

          {/* Signatures & Seal */}
          <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-end gap-6 text-xs text-slate-700">
            <div>
              <div className="w-44 border-b border-slate-800 mb-1">
                <span className="font-serif italic font-bold text-blue-900 text-sm">Justus Onsando</span>
              </div>
              <p className="font-bold text-slate-900">MR. JUSTUS ONSANDO</p>
              <p className="text-slate-600">Registrar (Academic Affairs)</p>
              <p className="text-slate-500">Kitutu Chache Technical & Vocational College</p>
            </div>

            {/* Official Stamp Simulation */}
            <div className="w-36 h-36 rounded-full border-2 border-dashed border-blue-800/60 p-2 flex flex-col items-center justify-center text-center text-blue-900/80 rotate-[-12deg] select-none">
              <span className="text-[9px] font-black uppercase">KITUTU CHACHE TVC</span>
              <span className="text-[8px] font-bold text-amber-700">★ REGISTRAR ★</span>
              <span className="text-[10px] font-black tracking-widest my-0.5">APPROVED</span>
              <span className="text-[8px] font-mono">{todayStr}</span>
              <span className="text-[8px] uppercase">P.O. BOX 376 KISII</span>
            </div>

            <div className="text-right">
              <p className="font-bold text-slate-900">For Principal & BOG Secretary</p>
              <p className="text-slate-500 text-[11px] mt-1">This document is legally valid with institutional serial number.</p>
              <p className="font-mono text-[10px] text-slate-400 mt-0.5">Doc Ref: KTTVC-REG-{admNo.replace(/\//g, '-')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
