import React, { useState } from 'react';
import { X, CheckCircle, GraduationCap, User, BookOpen, MapPin, Phone, Shield, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { AdmissionApplication } from '../types';
import { WEBSITE_DEPARTMENTS, WebsiteCourse } from '../data/websiteData';
import kitchaLogo from '../assets/images/kitcha_tvc_logo.jpg';

interface TraineeRegistrationModalProps {
  initialCourseId?: string;
  onClose: () => void;
  onSubmitApplication: (app: AdmissionApplication) => void;
}

export default function TraineeRegistrationModal({ 
  initialCourseId, 
  onClose, 
  onSubmitApplication 
}: TraineeRegistrationModalProps) {
  // Find selected course if initialCourseId provided
  const findInitialCourse = (): { course?: WebsiteCourse, deptId?: string } => {
    if (!initialCourseId) return {};
    for (const d of WEBSITE_DEPARTMENTS) {
      const c = d.courses.find(item => item.id === initialCourseId);
      if (c) return { course: c, deptId: d.id };
    }
    return {};
  };

  const initialMatch = findInitialCourse();

  // Form states
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialMatch.deptId || 'ict');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || 'cp_l6');
  
  // Personal Details
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [dob, setDob] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Academic Background
  const [indexNumber, setIndexNumber] = useState('');
  const [kcseYear, setKcseYear] = useState('2025');
  const [meanGrade, setMeanGrade] = useState('C-');
  const [previousSchool, setPreviousSchool] = useState('');

  // Location / Address
  const [county, setCounty] = useState('Kisii');
  const [subCounty, setSubCounty] = useState('Kitutu Chache South');
  const [postalAddress, setPostalAddress] = useState('P.O. Box 40200 Kisii');

  // Guardian / Sponsor
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('Parent');
  const [sponsorType, setSponsorType] = useState<'government' | 'self'>('government');

  // Study Preferences
  const [intake, setIntake] = useState<'J' | 'M' | 'S'>('S'); // Default September
  const [modeOfStudy, setModeOfStudy] = useState('Full-Time (CBET)');
  const [accommodation, setAccommodation] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<AdmissionApplication | null>(null);

  // Available courses for selected department
  const currentDept = WEBSITE_DEPARTMENTS.find(d => d.id === selectedDeptId);
  const availableCourses = currentDept ? currentDept.courses : [];
  const selectedCourse = currentDept?.courses.find(c => c.id === selectedCourseId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedId = `app_${Date.now().toString().slice(-6)}`;
    const autoReg = `KTTVC/${currentDept?.code || 'GEN'}/2026S/${Math.floor(100 + Math.random() * 900)}`;

    const newApplication: AdmissionApplication = {
      id: generatedId,
      applicantName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      courseId: selectedCourseId,
      courseName: selectedCourse?.name || selectedCourseId,
      departmentName: currentDept?.name,
      gender,
      dob,
      intake,
      indexNumber: indexNumber.trim(),
      meanGrade,
      kcseYear,
      previousSchool: previousSchool.trim(),
      county,
      subCounty,
      postalAddress,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      guardianRelation,
      modeOfStudy,
      accommodation,
      autoRegNumber: autoReg,
      dateApplied: new Date().toISOString().split('T')[0],
      status: 'pending', // Pending Registrar approval to generate official admission number
      nationalId: nationalId.trim(),
      sponsorType
    };

    setTimeout(() => {
      onSubmitApplication(newApplication);
      setSubmittedApp(newApplication);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#B88856] via-[#C29563] to-[#D4A97A] text-white px-6 py-4 flex items-center justify-between border-b border-white/20 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <img 
              src={kitchaLogo} 
              alt="Logo" 
              className="w-10 h-10 object-contain rounded-full bg-white/20 p-0.5"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight text-white">
                Trainee Online Admission & Registration Form
              </h3>
              <p className="text-xs text-[#FDF4EA] font-medium">
                Kitutu Chache TVC • Office of the Academic Registrar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 sm:p-8 overflow-y-auto">
          {submittedApp ? (
            /* Success confirmation screen */
            <div className="text-center py-6 sm:py-8 space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                  Application Successfully Submitted
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  Welcome to KITCHA TVC, {submittedApp.applicantName}!
                </h3>
                <p className="text-sm text-slate-600 max-w-lg mx-auto mt-1">
                  Your admission application has been registered into the academic database and forwarded to the <strong>Office of the Registrar</strong> for approval.
                </p>
              </div>

              {/* Reference Details Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-lg mx-auto text-left shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Application Reference:</span>
                  <span className="font-mono font-black text-blue-800 text-sm">{submittedApp.id}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Registered Course:</span>
                  <span className="font-bold text-slate-900 text-sm text-right">{submittedApp.courseName}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Intake Period:</span>
                  <span className="font-bold text-amber-900 text-sm">September 2026 Intake</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Application Status:</span>
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Pending Registrar Approval
                  </span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
                  <strong>What happens next:</strong>
                  <p className="mt-1 text-[11px] text-blue-800 leading-relaxed">
                    Once the Registrar verifies your KCSE grade, an official <strong>TVET Admission Number</strong> (e.g. <code>KTTVC/2026/0001</code>) and Provisional Admission Letter will be issued. You can check your status anytime using your National ID or KCSE Index Number.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-800 hover:bg-blue-900 text-white font-bold text-sm rounded-xl transition-colors shadow"
                >
                  Return to College Website
                </button>
              </div>
            </div>
          ) : (
            /* TVET Admission Form */
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Notice Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>TVET Competency-Based Education and Training (CBET) Application</strong>
                  <p className="mt-0.5 text-amber-800">
                    Please provide accurate information as appearing on your official KCSE Result Slip / National Identity Card. Once approved by the Registrar, your official Admission Number will be generated.
                  </p>
                </div>
              </div>

              {/* SECTION 1: COURSE SELECTION */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <BookOpen className="w-5 h-5 text-blue-700" />
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                    1. Program of Study & Intake Preference
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Academic Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedDeptId}
                      onChange={(e) => {
                        setSelectedDeptId(e.target.value);
                        const d = WEBSITE_DEPARTMENTS.find(dept => dept.id === e.target.value);
                        if (d && d.courses.length > 0) {
                          setSelectedCourseId(d.courses[0].id);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      {WEBSITE_DEPARTMENTS.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Course Applied For <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      {availableCourses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.entryGrade})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedCourse && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 text-xs text-slate-700 flex flex-wrap gap-4">
                    <span><strong>Level:</strong> {selectedCourse.level}</span>
                    <span><strong>Minimum Requirement:</strong> {selectedCourse.entryGrade}</span>
                    <span><strong>Exam Body:</strong> {selectedCourse.assessmentBody}</span>
                    <span><strong>Duration:</strong> {selectedCourse.duration}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Intake <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={intake}
                      onChange={(e) => setIntake(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="S">September 2026 (Ongoing)</option>
                      <option value="J">January 2027</option>
                      <option value="M">May 2027</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sponsorship Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={sponsorType}
                      onChange={(e) => setSponsorType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="government">Government Sponsored (KUCCPS / HELB)</option>
                      <option value="self">Self Sponsored (Direct Entry)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mode of Study <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={modeOfStudy}
                      onChange={(e) => setModeOfStudy(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="Full-Time (CBET)">Full-Time (CBET)</option>
                      <option value="Part-Time / Evening">Part-Time / Evening</option>
                      <option value="Weekend Modular">Weekend Modular</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: PERSONAL DETAILS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <User className="w-5 h-5 text-blue-700" />
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                    2. Trainee Personal Details
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Official Names (As in KCSE) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. OMBATI KEVIN MOGAKA"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Gender <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Date of Birth <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      National ID / Birth Cert No <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="e.g. 39482019"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 0712345678"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="trainee@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: ACADEMIC QUALIFICATIONS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <GraduationCap className="w-5 h-5 text-blue-700" />
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                    3. Academic Background (KCSE / Prior Education)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      KCSE Index Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={indexNumber}
                      onChange={(e) => setIndexNumber(e.target.value)}
                      placeholder="e.g. 38610015/042"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      KCSE Exam Year <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={kcseYear}
                      onChange={(e) => setKcseYear(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                      <option value="2021">2021</option>
                      <option value="Earlier">2020 or Earlier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      KCSE Mean Grade <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={meanGrade}
                      onChange={(e) => setMeanGrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-black focus:ring-2 focus:ring-blue-600 focus:outline-none text-blue-900"
                    >
                      <option value="A">A (Plain)</option>
                      <option value="A-">A- (Minus)</option>
                      <option value="B+">B+ (Plus)</option>
                      <option value="B">B (Plain)</option>
                      <option value="B-">B- (Minus)</option>
                      <option value="C+">C+ (Plus)</option>
                      <option value="C">C (Plain)</option>
                      <option value="C-">C- (Minus)</option>
                      <option value="D+">D+ (Plus)</option>
                      <option value="D">D (Plain)</option>
                      <option value="D-">D- (Minus)</option>
                      <option value="E">E</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Secondary / High School Attended
                  </label>
                  <input
                    type="text"
                    value={previousSchool}
                    onChange={(e) => setPreviousSchool(e.target.value)}
                    placeholder="e.g. Kisii High School / Nyabururu Girls"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* SECTION 4: LOCATION & GUARDIAN */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <MapPin className="w-5 h-5 text-blue-700" />
                  <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">
                    4. County of Residence & Parent / Guardian Contact
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">County</label>
                    <input
                      type="text"
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      placeholder="e.g. Kisii / Nyamira"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sub-County</label>
                    <input
                      type="text"
                      value={subCounty}
                      onChange={(e) => setSubCounty(e.target.value)}
                      placeholder="e.g. Kitutu Chache South"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Postal Address</label>
                    <input
                      type="text"
                      value={postalAddress}
                      onChange={(e) => setPostalAddress(e.target.value)}
                      placeholder="e.g. P.O. Box 376 - 40200 Kisii"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Parent/Guardian Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="e.g. James Mogaka"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Guardian Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={guardianPhone}
                      onChange={(e) => setGuardianPhone(e.target.value)}
                      placeholder="e.g. 0722000000"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Relationship</label>
                    <select
                      value={guardianRelation}
                      onChange={(e) => setGuardianRelation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Sponsor">Sponsor / NGO</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={accommodation}
                      onChange={(e) => setAccommodation(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                    <span>I request on-campus / college-accredited hostel accommodation (subject to availability).</span>
                  </label>
                </div>
              </div>

              {/* DECLARATION & SUBMISSION */}
              <div className="pt-4 border-t border-slate-200">
                <div className="bg-slate-50 rounded-xl p-4 mb-4 text-xs text-slate-600 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <p>
                    I hereby certify that the information given above is true and complete to the best of my knowledge. I understand that any false information or forged credentials will result in immediate disqualification or legal prosecution.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3 bg-[#C29563] hover:bg-[#B28452] active:bg-[#A37442] text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Submitting to Registrar...</span>
                    ) : (
                      <>
                        <span>Submit Trainee Admission Application</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
