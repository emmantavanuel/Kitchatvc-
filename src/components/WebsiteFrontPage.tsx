import React, { useState } from 'react';
import { 
  Phone, Mail, MapPin, ChevronDown, BookOpen, GraduationCap, Download, 
  FileText, Award, CheckCircle, ArrowRight, ExternalLink, Calendar, 
  Search, Shield, Users, Building, Bell, Sparkles, Clock, Compass, Menu, X,
  Send, MessageSquare, HelpCircle
} from 'lucide-react';
import { 
  WEBSITE_DEPARTMENTS, COLLEGE_INFO, WebsiteCourse, WebsiteDepartment 
} from '../data/websiteData';
import { AdmissionApplication, User, Department } from '../types';
import TraineeRegistrationModal from './TraineeRegistrationModal';
import ApplicationStatusModal from './ApplicationStatusModal';
import AdmissionLetterModal from './AdmissionLetterModal';
import kitchaLogo from '../assets/images/kitcha_tvc_logo.jpg';
import principalImg from '../assets/images/principal_john_mareri.jpg';
import deputyAdminImg from '../assets/images/deputy_samwel_geke.jpg';
import deputyAcadImg from '../assets/images/deputy_martin_nyamweya.jpg';
import registrarImg from '../assets/images/registrar_obare_vincent.jpg';
import deanImg from '../assets/images/dean_elmelda_moranga.jpg';

interface ManagementMember {
  name: string;
  role: string;
  image: string;
}

const MANAGEMENT_MEMBERS: ManagementMember[] = [
  {
    name: 'Mr. John Mareri Ondieki',
    role: 'Principal',
    image: principalImg
  },
  {
    name: 'Mr.Samwel Geke Sagwe',
    role: 'Deputy Principal Administration',
    image: deputyAdminImg
  },
  {
    name: 'Mr. Martin Nyamweya Mageto',
    role: 'Deputy Principal Academics',
    image: deputyAcadImg
  },
  {
    name: 'Mr.Obare Nyamweya Vincent',
    role: 'Registrar',
    image: registrarImg
  },
  {
    name: 'Ms Elmelda Moranga',
    role: 'Dean of Students',
    image: deanImg
  }
];

interface WebsiteFrontPageProps {
  onNavigateToPortal: () => void;
  applications: AdmissionApplication[];
  onAddApplication: (app: AdmissionApplication) => void;
  erpUsers?: User[];
  erpDepartments?: Department[];
}

export default function WebsiteFrontPage({ 
  onNavigateToPortal, 
  applications, 
  onAddApplication,
  erpUsers = [],
  erpDepartments = []
}: WebsiteFrontPageProps) {
  // Navigation active view / active section (Added 'contact' menu)
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'bog' | 'management' | 'admissions' | 'departments' | 'downloads' | 'adverts' | 'tenders' | 'courses' | 'contact'>('home');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ict');
  
  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerCourseId, setRegisterCourseId] = useState<string | undefined>(undefined);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [selectedLetterApp, setSelectedLetterApp] = useState<AdmissionApplication | null>(null);

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dropdown states
  const [aboutDropdown, setAboutDropdown] = useState(false);
  const [downloadsDropdown, setDownloadsDropdown] = useState(false);

  // Contact Form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactSubject, setContactSubject] = useState('Admissions & Course Inquiries');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactMessage) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactMessage('');
    }, 4000);
  };

  const currentDepartment = WEBSITE_DEPARTMENTS.find(d => d.id === selectedDeptId) || WEBSITE_DEPARTMENTS[0];

  const handleApplyCourse = (courseId: string) => {
    setRegisterCourseId(courseId);
    setIsRegisterOpen(true);
  };

  const scrollToCourses = () => {
    setActiveTab('home');
    const el = document.getElementById('courses-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF9] text-[#2C1F15] font-sans flex flex-col">
      {/* 1. TOP BAR / HEADER (Clean White & Soft Light Brown, Contacts Box Removed from Right Corner) */}
      <header className="bg-white border-b border-[#EDE2D5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & College Title */}
          <div className="flex items-center gap-4 text-center md:text-left">
            <img 
              src={kitchaLogo} 
              alt="KITCHA TVC Logo" 
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain shrink-0 drop-shadow-2xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black text-[#281A10] tracking-tight uppercase leading-tight font-serif">
                KITUTU CHACHE TECHNICAL<br />AND<br />VOCATIONAL COLLEGE
              </h1>
            </div>
          </div>

          {/* Right Header Badges (Spacious, Clean & Professional) */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#BA8D5C] block">Motto</span>
              <span className="text-xs font-bold text-[#3D2E20] italic">"{COLLEGE_INFO.motto}"</span>
            </div>
            <div className="h-8 w-px bg-[#EADBCA]" />
            <button
              onClick={() => setActiveTab('contact')}
              className="px-3 py-1.5 bg-[#FAF5EE] hover:bg-[#F3E8DB] text-[#7D5325] border border-[#E2CEB8] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-[#BA8D5C]" />
              <span>Contact Us</span>
            </button>
          </div>
        </div>

        {/* 2. PRIMARY NAVIGATION BAR (Featuring CONTACT US menu and Light Honey-Brown Theme) */}
        <nav className="bg-white border-t border-[#EDE2D5] shadow-2xs sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-3 text-[#2C1F15] hover:text-[#BA8D5C] flex items-center gap-2 font-bold text-sm"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              <span>Menu</span>
            </button>

            {/* Desktop Menus */}
            <div className="hidden lg:flex items-center gap-1 font-bold text-xs uppercase tracking-wider text-[#3D2E20] py-1">
              {/* HOME */}
              <button
                onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
                className={`px-3.5 py-2.5 rounded-lg transition-colors ${
                  activeTab === 'home' ? 'text-[#8F6335] font-black bg-[#FAF3EA] border-b-2 border-[#C29563]' : 'hover:text-[#8F6335] hover:bg-[#FBF6F0]'
                }`}
              >
                HOME
              </button>

              {/* ABOUT US (Sub-menus: About Kitcha TVC, BOG, Management) */}
              <div 
                className="relative"
                onMouseEnter={() => setAboutDropdown(true)}
                onMouseLeave={() => setAboutDropdown(false)}
              >
                <button
                  onClick={() => setAboutDropdown(!aboutDropdown)}
                  className={`px-3.5 py-2.5 rounded-lg transition-colors flex items-center gap-1 ${
                    ['about', 'bog', 'management'].includes(activeTab) ? 'text-[#8F6335] font-black bg-[#FAF3EA] border-b-2 border-[#C29563]' : 'hover:text-[#8F6335] hover:bg-[#FBF6F0]'
                  }`}
                >
                  <span>ABOUT US</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {aboutDropdown && (
                  <div className="absolute top-full left-0 w-52 bg-white rounded-xl shadow-xl border border-[#EADBCA] py-2 z-40">
                    <button
                      onClick={() => { setActiveTab('about'); setAboutDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2C1F15] hover:bg-[#FAF3EA] hover:text-[#8F6335] transition-colors"
                    >
                      About KITCHA TVC
                    </button>
                    <button
                      onClick={() => { setActiveTab('bog'); setAboutDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2C1F15] hover:bg-[#FAF3EA] hover:text-[#8F6335] transition-colors"
                    >
                      BOG (Board of Governors)
                    </button>
                    <button
                      onClick={() => { setActiveTab('management'); setAboutDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2C1F15] hover:bg-[#FAF3EA] hover:text-[#8F6335] transition-colors"
                    >
                      Management
                    </button>
                  </div>
                )}
              </div>

              {/* ADMISSIONS */}
              <button
                onClick={() => setActiveTab('admissions')}
                className={`px-3.5 py-2.5 rounded-lg transition-colors ${
                  activeTab === 'admissions' ? 'text-[#8F6335] font-black bg-[#FAF3EA] border-b-2 border-[#C29563]' : 'hover:text-[#8F6335] hover:bg-[#FBF6F0]'
                }`}
              >
                ADMISSIONS
              </button>

              {/* DEPARTMENTS */}
              <button
                onClick={() => setActiveTab('departments')}
                className={`px-3.5 py-2.5 rounded-lg transition-colors ${
                  activeTab === 'departments' ? 'text-[#8F6335] font-black bg-[#FAF3EA] border-b-2 border-[#C29563]' : 'hover:text-[#8F6335] hover:bg-[#FBF6F0]'
                }`}
              >
                DEPARTMENTS
              </button>

              {/* DOWNLOADS (Sub-menus: Downloads, Adverts, Tenders) */}
              <div 
                className="relative"
                onMouseEnter={() => setDownloadsDropdown(true)}
                onMouseLeave={() => setDownloadsDropdown(false)}
              >
                <button
                  onClick={() => setDownloadsDropdown(!downloadsDropdown)}
                  className={`px-3.5 py-2.5 rounded-lg transition-colors flex items-center gap-1 ${
                    ['downloads', 'adverts', 'tenders'].includes(activeTab) ? 'text-[#8F6335] font-black bg-[#FAF3EA] border-b-2 border-[#C29563]' : 'hover:text-[#8F6335] hover:bg-[#FBF6F0]'
                  }`}
                >
                  <span>DOWNLOADS</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {downloadsDropdown && (
                  <div className="absolute top-full left-0 w-48 bg-white rounded-xl shadow-xl border border-[#EADBCA] py-2 z-40">
                    <button
                      onClick={() => { setActiveTab('downloads'); setDownloadsDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2C1F15] hover:bg-[#FAF3EA] hover:text-[#8F6335] transition-colors"
                    >
                      Downloads
                    </button>
                    <button
                      onClick={() => { setActiveTab('adverts'); setDownloadsDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2C1F15] hover:bg-[#FAF3EA] hover:text-[#8F6335] transition-colors"
                    >
                      Adverts
                    </button>
                    <button
                      onClick={() => { setActiveTab('tenders'); setDownloadsDropdown(false); }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#2C1F15] hover:bg-[#FAF3EA] hover:text-[#8F6335] transition-colors"
                    >
                      Tenders
                    </button>
                  </div>
                )}
              </div>

              {/* COURSES */}
              <button
                onClick={scrollToCourses}
                className="px-3.5 py-2.5 rounded-lg transition-colors hover:text-[#8F6335] hover:bg-[#FBF6F0]"
              >
                COURSES
              </button>

              {/* CONTACT US (Requested New Dedicated Menu) */}
              <button
                onClick={() => setActiveTab('contact')}
                className={`px-3.5 py-2.5 rounded-lg transition-colors flex items-center gap-1 ${
                  activeTab === 'contact' ? 'text-[#8F6335] font-black bg-[#FAF3EA] border-b-2 border-[#C29563]' : 'hover:text-[#8F6335] hover:bg-[#FBF6F0]'
                }`}
              >
                <Phone className="w-3.5 h-3.5 text-[#BA8D5C]" />
                <span>CONTACT US</span>
              </button>
            </div>

            {/* Right Action Menus (CHECK ADMISSION, PORTAL & TRAINEE REGISTRATION) */}
            <div className="flex items-center gap-2 py-2">
              <button
                onClick={() => setIsStatusOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#54381C] bg-[#FAF3EA] hover:bg-[#F3E8DB] border border-[#E0CCB8] rounded-lg transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-[#BA8D5C]" />
                <span>Check Admission</span>
              </button>

              {/* Portal Button - Directs to Login page of ERP Suite */}
              <button
                onClick={onNavigateToPortal}
                className="px-4 py-2 bg-[#A87B4C] hover:bg-[#966A3D] text-white font-bold text-xs rounded-lg transition-all shadow-2xs flex items-center gap-1.5 active:scale-95"
                title="Login to Smart College ERP & Timetable Portal"
              >
                <Building className="w-3.5 h-3.5 text-[#F5E6D5]" />
                <span>PORTAL</span>
              </button>

              {/* Trainee Registration Button - Opens TVET Admission Form */}
              <button
                onClick={() => { setRegisterCourseId(undefined); setIsRegisterOpen(true); }}
                className="px-4 py-2 bg-[#C29563] hover:bg-[#B28452] text-white font-black text-xs rounded-lg transition-all shadow-2xs flex items-center gap-1.5 active:scale-95"
                title="Register online for TVET courses"
              >
                <GraduationCap className="w-4 h-4 text-white" />
                <span>TRAINEE REGISTRATION</span>
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-[#EDE2D5] bg-white px-4 py-4 space-y-2 text-xs font-bold uppercase">
              <button
                onClick={() => { setActiveTab('home'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 px-3 rounded hover:bg-[#FAF3EA] text-[#2C1F15]"
              >
                Home
              </button>
              <div className="pl-3 border-l-2 border-[#C29563] space-y-1 my-1">
                <div className="text-[10px] text-[#8F6335] font-semibold">About Us Sub-menus:</div>
                <button
                  onClick={() => { setActiveTab('about'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-1 text-[#3D2E20] hover:text-[#8F6335]"
                >
                  • About KITCHA TVC
                </button>
                <button
                  onClick={() => { setActiveTab('bog'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-1 text-[#3D2E20] hover:text-[#8F6335]"
                >
                  • BOG (Board of Governors)
                </button>
                <button
                  onClick={() => { setActiveTab('management'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-1 text-[#3D2E20] hover:text-[#8F6335]"
                >
                  • Management
                </button>
              </div>
              <button
                onClick={() => { setActiveTab('admissions'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 px-3 rounded hover:bg-[#FAF3EA] text-[#2C1F15]"
              >
                Admissions
              </button>
              <button
                onClick={() => { setActiveTab('departments'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 px-3 rounded hover:bg-[#FAF3EA] text-[#2C1F15]"
              >
                Departments
              </button>
              <div className="pl-3 border-l-2 border-[#A87B4C] space-y-1 my-1">
                <div className="text-[10px] text-[#8F6335] font-semibold">Downloads Sub-menus:</div>
                <button
                  onClick={() => { setActiveTab('downloads'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-1 text-[#3D2E20] hover:text-[#8F6335]"
                >
                  • Downloads
                </button>
                <button
                  onClick={() => { setActiveTab('adverts'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-1 text-[#3D2E20] hover:text-[#8F6335]"
                >
                  • Adverts
                </button>
                <button
                  onClick={() => { setActiveTab('tenders'); setMobileMenuOpen(false); }}
                  className="block w-full text-left py-1 text-[#3D2E20] hover:text-[#8F6335]"
                >
                  • Tenders
                </button>
              </div>
              <button
                onClick={() => { scrollToCourses(); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 px-3 rounded hover:bg-[#FAF3EA] text-[#2C1F15]"
              >
                Courses
              </button>
              <button
                onClick={() => { setActiveTab('contact'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 px-3 rounded bg-[#FAF3EA] text-[#7D5325] font-black"
              >
                📞 Contact Us (Campus & Directory)
              </button>
              <button
                onClick={() => { setIsStatusOpen(true); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 px-3 rounded bg-[#FAF3EA] text-[#54381C] font-bold"
              >
                🔍 Check Trainee Admission Status
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* 3. HERO BANNER (Light, Luminous Honey-Brown & Ivory Gradient) */}
      <div className="relative bg-gradient-to-br from-[#FAF5EE] via-[#F4EBE0] to-[#E9D7C2] text-[#2C1F15] border-b border-[#E2CEB8] overflow-hidden">
        {/* Subtle patterned overlay simulating hands-on college trainees */}
        <div 
          className="absolute inset-0 opacity-15 bg-cover bg-center mix-blend-multiply scale-105 transform"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=1600&q=80')`
          }}
        />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C29563]/20 border border-[#C29563]/40 text-[#7D5325] font-black text-xs sm:text-sm tracking-wider uppercase mb-4 backdrop-blur-2xs">
            <Sparkles className="w-4 h-4 text-[#C29563]" />
            Empowering Youth with Practical Competency-Based Skills (CBET)
          </span>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#281A10] max-w-4xl leading-tight">
            Build Your Technical Career at Kitutu Chache TVC
          </h2>

          <p className="mt-4 text-sm sm:text-base text-[#4F3C2C] max-w-2xl leading-relaxed font-medium">
            Hands-on technical training, certified by TVET-CDACC and KNEC. Direct admissions and KUCCPS government-sponsored placements available across all departments.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => { setRegisterCourseId(undefined); setIsRegisterOpen(true); }}
              className="px-6 py-3.5 bg-[#C29563] hover:bg-[#B28452] text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              <GraduationCap className="w-5 h-5 text-white" />
              Apply Online (TVET Admission Form)
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={scrollToCourses}
              className="px-6 py-3.5 bg-white hover:bg-[#F9F5EF] text-[#4F3C2C] font-bold text-sm rounded-xl transition-colors border border-[#D9B996] shadow-2xs flex items-center gap-2 active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-[#BA8D5C]" />
              View Courses Offered
            </button>

            <button
              onClick={() => setIsStatusOpen(true)}
              className="px-6 py-3.5 bg-[#EBD4BE] hover:bg-[#DFC5AB] text-[#3D2612] font-bold text-sm rounded-xl transition-colors border border-[#CDB194] flex items-center gap-2 active:scale-95"
            >
              <Search className="w-4 h-4 text-[#7D5325]" />
              Check Status
            </button>
          </div>
        </div>

        {/* Ongoing Intake Announcement Ribbon (Light Brown with Sharp Contrast) */}
        <div className="relative z-20 bg-[#DEC8B2] text-[#3D2713] py-2.5 px-4 text-center font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 border-y border-[#CBB39B] shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-[#8F6335] animate-ping inline-block" />
          <span>{COLLEGE_INFO.intakeAnnouncement}</span>
          <button 
            onClick={() => { setRegisterCourseId(undefined); setIsRegisterOpen(true); }}
            className="underline ml-2 text-[#7D5325] hover:text-[#523414] transition-colors text-xs font-black uppercase tracking-wider"
          >
            Apply Now &rarr;
          </button>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* =========================================================================
            TAB: HOME & COURSES OFFERED
        ========================================================================= */}
        {(activeTab === 'home' || activeTab === 'courses') && (
          <section id="courses-section" className="space-y-8">
            <div className="text-center sm:text-left border-b border-[#EDE2D5] pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-[#281A10] tracking-tight uppercase underline decoration-[#C29563] decoration-4 underline-offset-8">
                Courses Offered:
              </h2>
              <p className="text-xs sm:text-sm text-[#544030] mt-2 font-medium">
                Select an academic department from the left menu to browse entry grades, assessment bodies, and intake periods.
              </p>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Sidebar Department Menu */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-[#EADBCA] shadow-2xs p-3 space-y-1.5">
                <div className="px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#8F6335]">
                  Academic Departments ({WEBSITE_DEPARTMENTS.length})
                </div>

                {WEBSITE_DEPARTMENTS.map((dept) => {
                  const isSelected = dept.id === selectedDeptId;
                  return (
                    <button
                      key={dept.id}
                      onClick={() => setSelectedDeptId(dept.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#C29563] text-white shadow-2xs'
                          : 'text-[#3D2E20] hover:bg-[#FAF4EC] hover:text-[#8F6335]'
                      }`}
                    >
                      <span className="leading-snug">{dept.name}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                        isSelected ? 'bg-[#A87B4C] text-white' : 'bg-[#F4E7D9] text-[#5C3D20]'
                      }`}>
                        {dept.courses.length}
                      </span>
                    </button>
                  );
                })}

                <div className="mt-4 pt-3 border-t border-[#EDE2D5] px-3 text-center">
                  <p className="text-[11px] text-[#544030] font-medium">Need guidance on qualifications?</p>
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="mt-1 text-xs font-bold text-[#8F6335] hover:underline"
                  >
                    Consult Academic Registrar &rarr;
                  </button>
                </div>
              </div>

              {/* Right Side: Courses Table for Selected Department (HEAD OF DEPARTMENT REMOVED) */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-[#EADBCA] shadow-2xs overflow-hidden flex flex-col">
                {/* Department Header in Light Caramel Brown */}
                <div className="bg-[#C29563] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#FDF4EA] font-bold">
                      Department Code: {currentDepartment.code}
                    </span>
                    <h3 className="font-bold text-base sm:text-xl text-white mt-0.5">
                      {currentDepartment.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleApplyCourse(currentDepartment.courses[0]?.id)}
                    className="px-3.5 py-1.5 bg-[#A87B4C] hover:bg-[#966A3D] text-white font-bold text-xs rounded-lg transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-[#FDEBD8]" />
                    Register for this Dept
                  </button>
                </div>

                <div className="px-6 py-3.5 bg-[#FAF7F2] border-b border-[#EFE5D8] text-xs sm:text-sm text-[#453629] leading-relaxed font-medium">
                  {currentDepartment.description}
                </div>

                {/* Table with High Visibility and Contrast */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse">
                    <thead>
                      <tr className="bg-[#F5EADF] text-[#281A10] font-black border-b border-[#E0CCB8]">
                        <th className="py-3.5 px-4 font-black">Course</th>
                        <th className="py-3.5 px-4 font-black">Entry Grade</th>
                        <th className="py-3.5 px-4 font-black">Assessment Body</th>
                        <th className="py-3.5 px-4 font-black">Intake Periods</th>
                        <th className="py-3.5 px-4 text-center font-black">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE5D8]">
                      {currentDepartment.courses.map((c) => (
                        <tr key={c.id} className="hover:bg-[#FAF4EC] transition-colors">
                          <td className="py-3.5 px-4">
                            <strong className="text-[#1F130A] block text-sm">{c.name}</strong>
                            <span className="text-[11px] text-[#6B5746] font-medium">{c.level} • {c.duration}</span>
                          </td>
                          <td className="py-3.5 px-4 text-[#2C1D11] font-medium">
                            <span className="px-2.5 py-1 bg-[#FAF4EC] rounded text-xs border border-[#E0D2C2] inline-block font-bold text-[#3B281B]">
                              {c.entryGrade}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[#2E1E12] font-semibold">
                            {c.assessmentBody}
                          </td>
                          <td className="py-3.5 px-4 text-[#4A3B2E] text-xs font-medium">
                            {c.intakePeriods}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => handleApplyCourse(c.id)}
                              className="px-3.5 py-1.5 bg-[#C29563] hover:bg-[#B28452] active:bg-[#A37442] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs inline-flex items-center gap-1"
                            >
                              <span>Apply</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#FAF7F2] px-6 py-3 border-t border-[#EFE5D8] flex flex-col sm:flex-row justify-between items-center text-xs text-[#5C4B3C] font-semibold gap-2">
                  <span>Showing {currentDepartment.courses.length} courses in {currentDepartment.name}</span>
                  <span className="text-[#8F6335] font-bold">All courses are fully accredited by TVETA Kenya</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            TAB: CONTACT US (Dedicated New View for All College Contacts & Inquiries)
        ========================================================================= */}
        {activeTab === 'contact' && (
          <section className="space-y-8">
            <div className="border-b border-[#EDE2D5] pb-4">
              <span className="text-[#BA8D5C] text-xs font-bold uppercase tracking-widest">Get In Touch</span>
              <h2 className="text-3xl font-black text-[#281A10] mt-1">Contact Kitutu Chache TVC</h2>
              <p className="text-[#544030] mt-2 text-sm sm:text-base font-medium max-w-3xl">
                We are eager to assist prospective students, current trainees, parents, guardians, and industry partners. Contact our offices or visit our campus.
              </p>
            </div>

            {/* 4 Main Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Telephone */}
              <div className="bg-white p-6 rounded-2xl border border-[#EADBCA] shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#FAF3EA] text-[#8F6335] flex items-center justify-center">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[#281A10]">Phone & WhatsApp</h3>
                <p className="text-xs text-[#544030]">Call or WhatsApp our admissions desk directly:</p>
                <div className="pt-1">
                  <a 
                    href="tel:+254774703453" 
                    className="text-base font-black text-[#8F6335] hover:underline block"
                  >
                    +254 774 703 453
                  </a>
                  <span className="text-[11px] text-[#785F4C]">Mon–Fri: 8:00 AM – 5:00 PM</span>
                </div>
              </div>

              {/* Email */}
              <div className="bg-white p-6 rounded-2xl border border-[#EADBCA] shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#FAF3EA] text-[#8F6335] flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[#281A10]">Official Email</h3>
                <p className="text-xs text-[#544030]">Direct inquiries to our administrative team:</p>
                <div className="pt-1">
                  <a 
                    href="mailto:kitutuchachetvc@gmail.com" 
                    className="text-sm font-black text-[#8F6335] hover:underline break-all block"
                  >
                    kitutuchachetvc@gmail.com
                  </a>
                  <span className="text-[11px] text-[#785F4C]">Replies within 24 business hours</span>
                </div>
              </div>

              {/* Campus Location */}
              <div className="bg-white p-6 rounded-2xl border border-[#EADBCA] shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#FAF3EA] text-[#8F6335] flex items-center justify-center">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[#281A10]">Campus Location</h3>
                <p className="text-xs text-[#544030] leading-relaxed">
                  Off Kisii Town along Nyamataro Road<br />
                  Kitutu Chache South Sub-County<br />
                  Kisii County, Republic of Kenya
                </p>
                <span className="text-[11px] font-bold text-[#8F6335]">Approx. 5 km from Kisii Town CBD</span>
              </div>

              {/* Postal & Hours */}
              <div className="bg-white p-6 rounded-2xl border border-[#EADBCA] shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-xl bg-[#FAF3EA] text-[#8F6335] flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[#281A10]">Postal & Working Hours</h3>
                <p className="text-xs text-[#544030] leading-relaxed">
                  <strong>P.O. Box:</strong> 376 - 40200 Kisii<br />
                  <strong>Weekdays:</strong> 8:00 AM – 5:00 PM<br />
                  <strong>Weekends:</strong> Closed (Official Holidays)
                </p>
                <span className="text-[11px] font-bold text-[#8F6335]">KUCCPS Institution Code: 1262</span>
              </div>
            </div>

            {/* Interactive Section: Form & Department Directory */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
              {/* Left: Contact Form */}
              <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-[#EADBCA] shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-[#BA8D5C]" />
                  <h3 className="font-black text-xl text-[#281A10]">Send Us an Inquiry / Message</h3>
                </div>
                <p className="text-xs text-[#544030] mb-6">
                  Have a question about courses, admission requirements, bursaries, or hostel accommodation? Fill out this inquiry form and our admissions desk will get in touch with you.
                </p>

                {contactSubmitted ? (
                  <div className="p-6 bg-[#FAF5EE] border border-[#C29563] rounded-xl text-center space-y-3">
                    <CheckCircle className="w-12 h-12 text-[#8F6335] mx-auto" />
                    <h4 className="font-black text-lg text-[#281A10]">Message Received!</h4>
                    <p className="text-xs text-[#544030] max-w-md mx-auto">
                      Thank you for contacting Kitutu Chache TVC. An admissions officer will review your request and reach out to your provided phone number or email address shortly.
                    </p>
                    <button
                      onClick={() => setContactSubmitted(false)}
                      className="mt-2 px-4 py-2 bg-[#C29563] text-white text-xs font-bold rounded-lg hover:bg-[#B28452] transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#3D2E20] mb-1">
                          Your Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. John Mogaka"
                          className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EADBCA] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#C29563] focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#3D2E20] mb-1">
                          Phone Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="e.g. 0712 345 678"
                          className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EADBCA] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#C29563] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#3D2E20] mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="e.g. name@example.com"
                          className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EADBCA] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#C29563] focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#3D2E20] mb-1">
                          Inquiry Subject / Topic
                        </label>
                        <select
                          value={contactSubject}
                          onChange={(e) => setContactSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EADBCA] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#C29563] focus:bg-white focus:outline-none"
                        >
                          <option>Admissions & Course Inquiries</option>
                          <option>KUCCPS Placement & Verification</option>
                          <option>Fee Structure & HELB Loans</option>
                          <option>Office of the Academic Registrar</option>
                          <option>Hostel Accommodation</option>
                          <option>Tenders & Procurement</option>
                          <option>Other General Inquiries</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#3D2E20] mb-1">
                        Message / Question <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Please write your detailed inquiry here..."
                        className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EADBCA] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#C29563] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#C29563] hover:bg-[#B28452] active:bg-[#A37442] text-white font-bold text-xs rounded-xl transition-all shadow-2xs flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send College Inquiry</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Right: Key Departments Directory & Directions */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl p-6 border border-[#EADBCA] shadow-2xs space-y-4">
                  <h4 className="font-black text-base text-[#281A10]">College Administrative Directory</h4>
                  <div className="divide-y divide-[#EDE2D5] text-xs">
                    <div className="py-2.5 flex justify-between items-center">
                      <div>
                        <strong className="block text-[#281A10]">Office of the Principal</strong>
                        <span className="text-[11px] text-[#785F4C]">Chief Executive Officer & BOG Secretary</span>
                      </div>
                      <span className="text-[#8F6335] font-bold">Admin Block 1</span>
                    </div>

                    <div className="py-2.5 flex justify-between items-center">
                      <div>
                        <strong className="block text-[#281A10]">Academic Registrar</strong>
                        <span className="text-[11px] text-[#785F4C]">Admissions, Registration, KNEC/CDACC</span>
                      </div>
                      <span className="text-[#8F6335] font-bold">Ext. 102</span>
                    </div>

                    <div className="py-2.5 flex justify-between items-center">
                      <div>
                        <strong className="block text-[#281A10]">Dean of Trainees</strong>
                        <span className="text-[11px] text-[#785F4C]">Hostel, Welfare, Clubs & Sports</span>
                      </div>
                      <span className="text-[#8F6335] font-bold">Ext. 103</span>
                    </div>

                    <div className="py-2.5 flex justify-between items-center">
                      <div>
                        <strong className="block text-[#281A10]">Finance & Accounts</strong>
                        <span className="text-[11px] text-[#785F4C]">Fee Payments, Invoicing, HELB Bursaries</span>
                      </div>
                      <span className="text-[#8F6335] font-bold">Ext. 104</span>
                    </div>

                    <div className="py-2.5 flex justify-between items-center">
                      <div>
                        <strong className="block text-[#281A10]">Procurement & Supply Chain</strong>
                        <span className="text-[11px] text-[#785F4C]">Tenders, Bids, Supplier Inquiries</span>
                      </div>
                      <span className="text-[#8F6335] font-bold">Ext. 105</span>
                    </div>
                  </div>
                </div>

                {/* Quick Assistance Banner */}
                <div className="bg-[#FAF5EE] rounded-2xl p-6 border border-[#DFCBB5] space-y-3">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-[#EBD4BE] text-[#523414]">
                    Trainee Admissions Desk
                  </span>
                  <h4 className="font-black text-base text-[#281A10]">Ready to Apply?</h4>
                  <p className="text-xs text-[#544030] leading-relaxed">
                    You do not need to travel to campus to register. You can fill out our official online TVET admission form in just 3 minutes.
                  </p>
                  <button
                    onClick={() => { setRegisterCourseId(undefined); setIsRegisterOpen(true); }}
                    className="w-full py-2.5 bg-[#C29563] hover:bg-[#B28452] text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Open Trainee Registration Form &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            TAB: ABOUT US (About KITCHA TVC & STRATEGIC STATEMENTS)
        ========================================================================= */}
        {activeTab === 'about' && (
          <section className="space-y-8 bg-white rounded-2xl p-6 sm:p-10 border border-[#EADBCA] shadow-2xs">
            <div className="max-w-3xl">
              <span className="text-[#BA8D5C] text-xs font-bold uppercase tracking-widest">Institutional Profile</span>
              <h2 className="text-3xl font-black text-[#281A10] mt-1">About Kitutu Chache TVC</h2>
              <p className="text-[#453629] mt-3 leading-relaxed text-sm sm:text-base font-medium">
                Kitutu Chache Technical and Vocational College is a state-of-the-art public TVET institution located off Kisii Town along the Nyamataro road in Kisii County. Established under the TVET Act 2013, the college addresses national technical skills gaps by offering Competency-Based Education and Training (CBET).
              </p>
            </div>

            {/* STRATEGIC STATEMENTS (Light, Fresh Card Layout) */}
            <div className="bg-[#FAF5EE] border border-[#DFCBB5] rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
              <div className="border-b border-[#E2CEB8] pb-3 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[11px] font-mono font-bold tracking-widest text-[#7D5325] uppercase bg-[#EBD4BE] px-2.5 py-1 rounded">
                    Institutional Framework
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#281A10] tracking-tight mt-2">
                    STRATEGIC STATEMENTS
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#7D5325] font-bold">
                  <Award className="w-4 h-4 text-[#C29563]" />
                  <span>KITCHA TVC Strategic Plan</span>
                </div>
              </div>

              {/* Vision and Mission Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white border border-[#E2CEB8] rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#FAF3EA] text-[#8F6335]">
                      <Compass className="w-5 h-5" />
                    </div>
                    <h4 className="font-black text-lg text-[#281A10] uppercase tracking-wider">Vision</h4>
                  </div>
                  <p className="text-sm text-[#453629] leading-relaxed font-medium">
                    A Centre of Excellence in research and skills training that commensurate with industry and community demands.
                  </p>
                </div>

                <div className="p-6 bg-white border border-[#E2CEB8] rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#FAF3EA] text-[#8F6335]">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h4 className="font-black text-lg text-[#281A10] uppercase tracking-wider">Mission</h4>
                  </div>
                  <p className="text-sm text-[#453629] leading-relaxed font-medium">
                    To provide quality, market driven technical and vocational education through effective training, innovation and partnerships for sustainable development.
                  </p>
                </div>
              </div>

              {/* CORE VALUES */}
              <div className="bg-white border border-[#E2CEB8] rounded-xl p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#C29563]" />
                  <h4 className="font-black text-lg text-[#281A10] uppercase tracking-wider">
                    CORE VALUES
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {COLLEGE_INFO.coreValues.map((val, idx) => (
                    <div key={idx} className="p-4 bg-[#FAF8F5] border border-[#EADBCA] rounded-xl space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-[#BA8D5C] block mb-1">0{idx + 1}</span>
                        <h5 className="font-black text-base text-[#281A10]">{val.title}</h5>
                      </div>
                      <p className="text-xs text-[#544030] leading-relaxed font-medium">{val.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            TAB: BOG (Board of Governors)
        ========================================================================= */}
        {activeTab === 'bog' && (
          <section className="bg-white rounded-2xl p-6 sm:p-12 border border-[#EADBCA] shadow-2xs min-h-[350px]">
            {/* Blank as requested */}
          </section>
        )}

        {/* =========================================================================
            TAB: MANAGEMENT
        ========================================================================= */}
        {activeTab === 'management' && (
          <section className="space-y-8 bg-white rounded-2xl p-6 sm:p-10 border border-[#EADBCA] shadow-2xs">
            <div className="max-w-3xl">
              <span className="text-[#BA8D5C] text-xs font-bold uppercase tracking-widest">Administration</span>
              <h2 className="text-3xl font-black text-[#281A10] mt-1">College Management</h2>
              <p className="text-[#453629] mt-3 leading-relaxed text-sm font-medium">
                Executive leadership team guiding academic governance, administration, and trainee empowerment at Kitutu Chache Technical and Vocational College.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
              {MANAGEMENT_MEMBERS.map((member, idx) => (
                <div 
                  key={idx} 
                  className="bg-[#FAF8F5] border border-[#EADBCA] rounded-2xl overflow-hidden shadow-2xs hover:border-[#C29563] transition-all hover:shadow-md flex flex-col group"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#EADBCA]/30">
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-4 text-center flex-1 flex flex-col justify-center bg-white/70">
                    <h4 className="font-bold text-sm sm:text-base text-[#281A10] leading-snug">
                      {member.name}
                    </h4>
                    <p className="text-xs font-semibold text-[#8F6335] mt-1">
                      {member.role}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            TAB: ADMISSIONS
        ========================================================================= */}
        {activeTab === 'admissions' && (
          <section className="space-y-8 bg-white rounded-2xl p-6 sm:p-10 border border-[#EADBCA] shadow-2xs">
            <div>
              <span className="text-[#BA8D5C] text-xs font-bold uppercase tracking-widest">Intake Information</span>
              <h2 className="text-3xl font-black text-[#281A10] mt-1">Admissions at Kitutu Chache TVC</h2>
              <p className="text-[#453629] mt-2 text-sm leading-relaxed max-w-3xl font-medium">
                We admit students three times a year (January, May, and September) across all Diploma (Level 6), Certificate (Level 5), Artisan (Level 4), and Professional Short Courses.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-[#FAF8F5] border border-[#EADBCA] rounded-2xl space-y-3 shadow-2xs">
                <span className="text-xs font-bold px-2.5 py-1 bg-[#EBD4BE] text-[#523414] rounded uppercase">Direct Entry</span>
                <h3 className="font-bold text-base text-[#281A10]">Self-Sponsored Admissions</h3>
                <p className="text-xs text-[#544030] leading-relaxed font-medium">
                  Walk in directly or complete the online Trainee Registration form on this website. Our admissions team reviews your certificates and generates an official admission letter.
                </p>
                <button
                  onClick={() => setIsRegisterOpen(true)}
                  className="w-full py-2.5 bg-[#C29563] text-white font-bold text-xs rounded-lg hover:bg-[#B28452] transition-colors"
                >
                  Apply Directly Online
                </button>
              </div>

              <div className="p-6 bg-[#FAF8F5] border border-[#EADBCA] rounded-2xl space-y-3 shadow-2xs">
                <span className="text-xs font-bold px-2.5 py-1 bg-[#E8DEC7] text-[#4A3018] rounded uppercase">Government Placed</span>
                <h3 className="font-bold text-base text-[#281A10]">KUCCPS Admissions</h3>
                <p className="text-xs text-[#544030] leading-relaxed font-medium">
                  Placed to Kitutu Chache TVC via KUCCPS? Search your index number in our system to confirm placement, activate your trainee record, and download your reporting requirements.
                </p>
                <a
                  href="https://students.kuccps.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#BA8D5C] text-white font-bold text-xs rounded-lg hover:bg-[#AA7E4D] transition-colors"
                >
                  <span>Go to KUCCPS Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="p-6 bg-[#FAF8F5] border border-[#EADBCA] rounded-2xl space-y-3 shadow-2xs">
                <span className="text-xs font-bold px-2.5 py-1 bg-[#E0D2BE] text-[#3B2412] rounded uppercase">Application Tracker</span>
                <h3 className="font-bold text-base text-[#281A10]">Check Admission Status</h3>
                <p className="text-xs text-[#544030] leading-relaxed font-medium">
                  Already applied? Enter your KCSE Index Number or National ID to verify whether the Registrar has approved your admission and download your provisional letter.
                </p>
                <button
                  onClick={() => setIsStatusOpen(true)}
                  className="w-full py-2.5 bg-[#A87B4C] text-white font-bold text-xs rounded-lg hover:bg-[#966A3D] transition-colors"
                >
                  Verify Admission Status
                </button>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            TAB: DEPARTMENTS (HEAD OF DEPARTMENT REMOVED)
        ========================================================================= */}
        {activeTab === 'departments' && (
          <section className="space-y-6">
            <div className="border-b border-[#EDE2D5] pb-4">
              <h2 className="text-3xl font-black text-[#281A10]">Academic Departments</h2>
              <p className="text-xs sm:text-sm text-[#544030] mt-1 font-medium">
                Explore our nine specialized technical training divisions equipped for modern industry.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {WEBSITE_DEPARTMENTS.map((dept) => (
                <div key={dept.id} className="bg-[#FAF8F5] rounded-2xl p-6 border border-[#EADBCA] shadow-2xs flex flex-col justify-between hover:border-[#C29563] transition-colors">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#EBD4BE] text-[#523414] rounded font-bold">
                      DEPT CODE: {dept.code}
                    </span>
                    <h3 className="text-base font-bold text-[#281A10] mt-2">{dept.name}</h3>
                    <p className="text-xs text-[#544030] mt-2 leading-relaxed font-medium">{dept.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#EDE2D5] flex items-center justify-between">
                    <span className="text-xs text-[#785F4C] font-semibold">{dept.courses.length} Approved Courses</span>
                    <button
                      onClick={() => {
                        setSelectedDeptId(dept.id);
                        scrollToCourses();
                      }}
                      className="text-xs font-bold text-[#8F6335] hover:underline flex items-center gap-1"
                    >
                      Browse Courses &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            TAB: DOWNLOADS (Sub-menu items: Downloads, Adverts, Tenders)
        ========================================================================= */}
        {activeTab === 'downloads' && (
          <section className="space-y-6 bg-white rounded-2xl p-6 sm:p-10 border border-[#EADBCA] shadow-2xs">
            <div>
              <span className="text-[#BA8D5C] text-xs font-bold uppercase tracking-widest">Document Repository</span>
              <h2 className="text-3xl font-black text-[#281A10] mt-1">Official College Downloads</h2>
              <p className="text-[#453629] mt-2 text-sm font-medium">
                Download official application forms, fee structures, student handbooks, and academic calendars.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COLLEGE_INFO.downloads.map((doc, idx) => (
                <div key={idx} className="p-4 bg-[#FAF8F5] border border-[#EADBCA] rounded-xl flex items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-[#BA8D5C] shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-[#281A10]">{doc.title}</h4>
                      <p className="text-[11px] text-[#544030] font-medium">Ref: {doc.ref} • {doc.category} • {doc.size}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (doc.title.includes('Application')) {
                        setIsRegisterOpen(true);
                      } else {
                        alert(`Opening official document: ${doc.title} (${doc.ref})`);
                      }
                    }}
                    className="px-3.5 py-2 bg-[#C29563] hover:bg-[#B28452] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            TAB: ADVERTS
        ========================================================================= */}
        {activeTab === 'adverts' && (
          <section className="space-y-6 bg-white rounded-2xl p-6 sm:p-10 border border-[#EADBCA] shadow-2xs">
            <div>
              <span className="text-[#BA8D5C] text-xs font-bold uppercase tracking-widest">Notices & Vacancies</span>
              <h2 className="text-3xl font-black text-[#281A10] mt-1">College Adverts & Opportunities</h2>
              <p className="text-[#453629] mt-2 text-sm font-medium">
                Latest announcements regarding trainer recruitment, intake deadlines, and student opportunities.
              </p>
            </div>

            <div className="space-y-4">
              {COLLEGE_INFO.adverts.map((adv, idx) => (
                <div key={idx} className="p-5 bg-[#FAF8F5] border border-[#EADBCA] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#EBD4BE] text-[#523414] rounded uppercase">
                      {adv.category}
                    </span>
                    <h4 className="font-bold text-base text-[#281A10] mt-1">{adv.title}</h4>
                    <p className="text-xs text-[#544030] mt-0.5 font-medium">
                      Posted: {adv.date} • Deadline: <strong className="text-[#872626]">{adv.deadline}</strong> • Ref: {adv.ref}
                    </p>
                  </div>
                  <button
                    onClick={() => alert(`Viewing details for notice: ${adv.title}`)}
                    className="px-4 py-2 bg-[#A87B4C] hover:bg-[#966A3D] text-white text-xs font-bold rounded-lg transition-colors shrink-0"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            TAB: TENDERS
        ========================================================================= */}
        {activeTab === 'tenders' && (
          <section className="space-y-6 bg-white rounded-2xl p-6 sm:p-10 border border-[#EADBCA] shadow-2xs">
            <div>
              <span className="text-[#BA8D5C] text-xs font-bold uppercase tracking-widest">Procurement</span>
              <h2 className="text-3xl font-black text-[#281A10] mt-1">Tenders & Supplier Pre-qualification</h2>
              <p className="text-[#453629] mt-2 text-sm font-medium">
                Pursuant to the Public Procurement and Asset Disposal Act 2015, Kitutu Chache TVC invites eligible firms to bid for tenders.
              </p>
            </div>

            <div className="space-y-4">
              {COLLEGE_INFO.tenders.map((tnd, idx) => (
                <div key={idx} className="p-5 bg-[#FAF8F5] border border-[#EADBCA] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#E0D2BE] text-[#3B2412] rounded uppercase">
                      Status: {tnd.status}
                    </span>
                    <h4 className="font-bold text-base text-[#281A10] mt-1">{tnd.title}</h4>
                    <p className="text-xs text-[#544030] mt-0.5 font-medium">
                      Tender No: <strong className="font-mono text-[#281A10]">{tnd.ref}</strong> • Closing Date: <strong className="text-[#872626]">{tnd.deadline}</strong>
                    </p>
                  </div>
                  <button
                    onClick={() => alert(`Downloading tender document: ${tnd.ref}`)}
                    className="px-4 py-2 bg-[#C29563] hover:bg-[#B28452] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Tender Document
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 5. PARTNERS & REGULATORY BODIES BANNER */}
      <section className="bg-white border-y border-[#EDE2D5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center text-xs font-bold uppercase tracking-widest text-[#8F6335] mb-6">
            Institutional Affiliations, Regulators & Assessment Bodies
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-center text-center">
            {/* TVETA */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EADBCA] flex flex-col items-center justify-center hover:border-[#C29563] transition-colors shadow-2xs">
              <div className="font-black text-[#281A10] text-sm tracking-wider">TVETA</div>
              <div className="text-[10px] text-[#544030] font-semibold mt-1">
                Technical and Vocational Education and Training Authority
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-[#EBD4BE] text-[#523414] rounded font-bold mt-2">
                Accredited TVC
              </span>
            </div>

            {/* HELB */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EADBCA] flex flex-col items-center justify-center hover:border-[#C29563] transition-colors shadow-2xs">
              <div className="font-black text-[#8F6335] text-sm tracking-wider">HELB</div>
              <div className="text-[10px] text-[#544030] font-semibold mt-1">
                Higher Education Loans Board (TVET Bursary Scheme)
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-[#E0D2BE] text-[#3B2412] rounded font-bold mt-2">
                HELB Enabled
              </span>
            </div>

            {/* KUCCPS */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EADBCA] flex flex-col items-center justify-center hover:border-[#C29563] transition-colors shadow-2xs">
              <div className="font-black text-[#A87B4C] text-sm tracking-wider">KUCCPS</div>
              <div className="text-[10px] text-[#544030] font-semibold mt-1">
                Kenya Universities and Colleges Central Placement Service
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-[#EBD4BE] text-[#523414] rounded font-bold mt-2">
                Official Centre
              </span>
            </div>

            {/* Ministry of Education */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EADBCA] flex flex-col items-center justify-center hover:border-[#C29563] transition-colors shadow-2xs">
              <div className="font-black text-[#281A10] text-sm tracking-wider">MINISTRY OF EDUCATION</div>
              <div className="text-[10px] text-[#544030] font-semibold mt-1">
                Republic of Kenya • State Department for TVET
              </div>
              <span className="text-[9px] px-2 py-0.5 bg-[#E2CEB8] text-[#2C1F15] rounded font-bold mt-2">
                Government Institution
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. COLLEGE FOOTER (Soft Light Warm Honey-Brown & White Theme) */}
      <footer className="bg-[#FAF3EA] text-[#4A3727] border-t border-[#E2CEB8] pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs text-[#544030]">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img 
                src={kitchaLogo} 
                alt="Logo" 
                className="w-12 h-12 object-contain"
                referrerPolicy="no-referrer"
              />
              <span className="font-bold text-[#281A10] text-sm">KITUTU CHACHE TVC</span>
            </div>
            <p className="leading-relaxed font-medium">
              Providing premier competency-based technical training for industrial transformation, youth empowerment, and self-reliance.
            </p>
            <p className="text-[#8F6335] font-bold">Motto: {COLLEGE_INFO.motto}</p>
          </div>

          <div>
            <h4 className="font-bold text-[#281A10] text-sm uppercase mb-3">Quick Links</h4>
            <ul className="space-y-2 font-medium">
              <li><button onClick={() => setActiveTab('home')} className="hover:text-[#8F6335]">Home</button></li>
              <li><button onClick={() => setActiveTab('about')} className="hover:text-[#8F6335]">About the College</button></li>
              <li><button onClick={() => setActiveTab('bog')} className="hover:text-[#8F6335]">Board of Governors</button></li>
              <li><button onClick={() => setActiveTab('management')} className="hover:text-[#8F6335]">College Management</button></li>
              <li><button onClick={scrollToCourses} className="hover:text-[#8F6335]">Courses Offered</button></li>
              <li><button onClick={() => setActiveTab('contact')} className="hover:text-[#8F6335] font-bold text-[#8F6335]">Contact Us (Campus & Helplines)</button></li>
              <li><button onClick={() => setActiveTab('downloads')} className="hover:text-[#8F6335]">Downloads</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#281A10] text-sm uppercase mb-3">Trainee Services</h4>
            <ul className="space-y-2 font-medium">
              <li>
                <button 
                  onClick={() => { setRegisterCourseId(undefined); setIsRegisterOpen(true); }}
                  className="text-[#8F6335] hover:underline font-bold"
                >
                  Online Trainee Registration &rarr;
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setIsStatusOpen(true)}
                  className="hover:text-[#8F6335]"
                >
                  Check Admission Status
                </button>
              </li>
              <li>
                <button 
                  onClick={onNavigateToPortal}
                  className="hover:text-[#8F6335] font-bold text-[#8F6335]"
                >
                  Staff & Student ERP Portal Login &rarr;
                </button>
              </li>
              <li><button onClick={() => setActiveTab('tenders')} className="hover:text-[#8F6335]">Tenders & Procurement</button></li>
              <li><button onClick={() => setActiveTab('adverts')} className="hover:text-[#8F6335]">Career Opportunities</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-[#281A10] text-sm uppercase mb-3">Campus Location</h4>
            <p className="leading-relaxed font-medium">
              {COLLEGE_INFO.contacts.physicalAddress}<br />
              {COLLEGE_INFO.contacts.postalAddress}<br />
              {COLLEGE_INFO.contacts.county}
            </p>
            <p className="mt-3 font-medium">
              <strong className="text-[#281A10] font-bold">Mobile:</strong> {COLLEGE_INFO.contacts.mobile}<br />
              <strong className="text-[#281A10] font-bold">Email:</strong> {COLLEGE_INFO.contacts.email}
            </p>
            <button
              onClick={() => setActiveTab('contact')}
              className="mt-2 text-xs font-bold text-[#8F6335] hover:underline flex items-center gap-1"
            >
              <span>View Full Campus Directory & Map</span> &rarr;
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 border-t border-[#E2CEB8] flex flex-col sm:flex-row items-center justify-between text-xs text-[#785F4C] gap-3">
          <p>© {new Date().getFullYear()} Kitutu Chache Technical and Vocational College. All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('contact')} className="hover:text-[#8F6335] transition-colors font-bold">
              Contact Us
            </button>
            <span>•</span>
            <button onClick={onNavigateToPortal} className="hover:text-[#8F6335] transition-colors font-bold">
              ERP Portal
            </button>
            <span>•</span>
            <button onClick={() => setIsRegisterOpen(true)} className="hover:text-[#8F6335] transition-colors font-bold">
              Trainee Registration
            </button>
          </div>
        </div>
      </footer>

      {/* 7. MODALS */}
      {isRegisterOpen && (
        <TraineeRegistrationModal
          initialCourseId={registerCourseId}
          onClose={() => setIsRegisterOpen(false)}
          onSubmitApplication={(newApp) => {
            onAddApplication(newApp);
          }}
        />
      )}

      {isStatusOpen && (
        <ApplicationStatusModal
          applications={applications}
          onClose={() => setIsStatusOpen(false)}
          onOpenLetter={(app) => {
            setSelectedLetterApp(app);
          }}
        />
      )}

      {selectedLetterApp && (
        <AdmissionLetterModal
          application={selectedLetterApp}
          onClose={() => setSelectedLetterApp(null)}
        />
      )}
    </div>
  );
}
