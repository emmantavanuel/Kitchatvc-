export interface WebsiteCourse {
  id: string;
  name: string;
  entryGrade: string;
  assessmentBody: string;
  intakePeriods: string;
  duration: string;
  level: string;
  departmentId: string;
}

export interface WebsiteDepartment {
  id: string;
  name: string;
  code: string;
  description: string;
  headOfDepartment: string;
  courses: WebsiteCourse[];
}

export const WEBSITE_DEPARTMENTS: WebsiteDepartment[] = [
  {
    id: 'ict',
    name: 'Information Communication Technology',
    code: 'ICT',
    headOfDepartment: 'Dr. Andrew Rabach (HOD CSIT)',
    description: 'Equipping trainees with cutting-edge skills in software engineering, networking, mobile computing, and digital multimedia aligned with Industry 4.0.',
    courses: [
      {
        id: 'cp_l6',
        name: 'Computer Programming Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '3 Years (6 Terms + Attachment)',
        level: 'Level 6 (Diploma)',
        departmentId: 'ict'
      },
      {
        id: 'cs_l6',
        name: 'Computer Science Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'ict'
      },
      {
        id: 'ict_l6',
        name: 'ICT Technician Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'ict'
      },
      {
        id: 'ict_l5',
        name: 'ICT Technician Level 5',
        entryGrade: 'KCSE D+ and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '2 Years',
        level: 'Level 5 (Certificate)',
        departmentId: 'ict'
      },
      {
        id: 'ict_l4',
        name: 'ICT Technician Level 4',
        entryGrade: 'KCSE E and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '1 Year',
        level: 'Level 4 (Artisan)',
        departmentId: 'ict'
      },
      {
        id: 'cmr_l4',
        name: 'Computer Mobile Repair Level 4',
        entryGrade: 'KCSE E and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '1 Year',
        level: 'Level 4 (Artisan)',
        departmentId: 'ict'
      },
      {
        id: 'ca_l3',
        name: 'Computer Applications Level 3',
        entryGrade: 'KCSE E and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '6 Months',
        level: 'Level 3 (Foundation)',
        departmentId: 'ict'
      },
      {
        id: 'adm_l5',
        name: 'Animation and Digital Media',
        entryGrade: 'KCSE E and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '2 Years',
        level: 'Level 5 (Certificate)',
        departmentId: 'ict'
      }
    ]
  },
  {
    id: 'electrical',
    name: 'Electrical and Electronics Engineering',
    code: 'EEE',
    headOfDepartment: '',
    description: 'Practical training in power systems, solar installation, industrial automation, telecommunications, and electronic instrumentation.',
    courses: [
      {
        id: 'eee_l6',
        name: 'Electrical Power Engineering Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC / KNEC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'electrical'
      },
      {
        id: 'ete_l6',
        name: 'Telecommunication Engineering Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'electrical'
      },
      {
        id: 'ei_l5',
        name: 'Electrical Installation Level 5',
        entryGrade: 'KCSE D (Plain) and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '2 Years',
        level: 'Level 5 (Certificate)',
        departmentId: 'electrical'
      },
      {
        id: 'spv_l5',
        name: 'Solar Photovoltaic Systems Level 5',
        entryGrade: 'KCSE D- and Above',
        assessmentBody: 'TVET-CDACC / EPRA',
        intakePeriods: 'January, May and September',
        duration: '1 Year',
        level: 'Level 5 (Certificate)',
        departmentId: 'electrical'
      },
      {
        id: 'ei_l4',
        name: 'Electrical Wireman Level 4',
        entryGrade: 'KCSE E and Above / KCPE',
        assessmentBody: 'TVET-CDACC / NITA',
        intakePeriods: 'January, May and September',
        duration: '1 Year',
        level: 'Level 4 (Artisan)',
        departmentId: 'electrical'
      }
    ]
  },
  {
    id: 'mechanical',
    name: 'Mechanical Engineering',
    code: 'ME',
    headOfDepartment: '',
    description: 'Comprehensive technical skills in automotive mechanics, manufacturing technology, welding and fabrication, and plant engineering.',
    courses: [
      {
        id: 'ae_l6',
        name: 'Automotive Engineering Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC / KNEC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'mechanical'
      },
      {
        id: 'pe_l6',
        name: 'Mechanical Production Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'mechanical'
      },
      {
        id: 'at_l5',
        name: 'Automotive Technician Level 5',
        entryGrade: 'KCSE D (Plain) and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '2 Years',
        level: 'Level 5 (Certificate)',
        departmentId: 'mechanical'
      },
      {
        id: 'wf_l5',
        name: 'Welding and Fabrication Level 5',
        entryGrade: 'KCSE D- and Above',
        assessmentBody: 'TVET-CDACC / NITA',
        intakePeriods: 'January, May and September',
        duration: '1.5 Years',
        level: 'Level 5 (Certificate)',
        departmentId: 'mechanical'
      },
      {
        id: 'am_l4',
        name: 'Motor Vehicle Mechanics Level 4',
        entryGrade: 'KCSE E and Above',
        assessmentBody: 'TVET-CDACC / NITA',
        intakePeriods: 'January, May and September',
        duration: '1 Year',
        level: 'Level 4 (Artisan)',
        departmentId: 'mechanical'
      }
    ]
  },
  {
    id: 'building',
    name: 'Building and Civil Engineering',
    code: 'BCE',
    headOfDepartment: 'Eng. Faith Bosire (HOD Building & Civil / Plumbing)',
    description: 'Developing construction professionals in civil engineering, architectural drafting, quantity surveying, plumbing, and masonry.',
    courses: [
      {
        id: 'ce_l6',
        name: 'Civil Engineering Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC / KNEC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'building'
      },
      {
        id: 'bt_l6',
        name: 'Building Technology Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'building'
      },
      {
        id: 'bt_l5',
        name: 'Building Technology Level 5',
        entryGrade: 'KCSE D (Plain) and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '2 Years',
        level: 'Level 5 (Certificate)',
        departmentId: 'building'
      },
      {
        id: 'pl_l5',
        name: 'Plumbing and Pipe Fitting Level 5',
        entryGrade: 'KCSE D- and Above',
        assessmentBody: 'TVET-CDACC / NITA',
        intakePeriods: 'January, May and September',
        duration: '1 Year',
        level: 'Level 5 (Certificate)',
        departmentId: 'building'
      },
      {
        id: 'ms_l4',
        name: 'Masonry and Bricklaying Level 4',
        entryGrade: 'KCSE E and Above',
        assessmentBody: 'TVET-CDACC / NITA',
        intakePeriods: 'January, May and September',
        duration: '1 Year',
        level: 'Level 4 (Artisan)',
        departmentId: 'building'
      }
    ]
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    code: 'AGR',
    headOfDepartment: '',
    description: 'Transforming modern agriculture with sustainable farming, greenhouse technologies, agribusiness management, and horticulture.',
    courses: [
      {
        id: 'ag_l6',
        name: 'Sustainable Agriculture Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC / KNEC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'agriculture'
      },
      {
        id: 'hort_l6',
        name: 'Horticultural Production Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'agriculture'
      },
      {
        id: 'ag_l5',
        name: 'General Agriculture Level 5',
        entryGrade: 'KCSE D (Plain) and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '2 Years',
        level: 'Level 5 (Certificate)',
        departmentId: 'agriculture'
      },
      {
        id: 'ab_l5',
        name: 'Agribusiness Management Level 5',
        entryGrade: 'KCSE D- and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '2 Years',
        level: 'Level 5 (Certificate)',
        departmentId: 'agriculture'
      }
    ]
  },
  {
    id: 'business',
    name: 'Business Studies',
    code: 'BUS',
    headOfDepartment: '',
    description: 'Developing ethical enterprise leaders, accountants, supply chain managers, and human resource practitioners.',
    courses: [
      {
        id: 'ba_l6',
        name: 'Business Management Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC / KNEC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'business'
      },
      {
        id: 'scm_l6',
        name: 'Supply Chain Management Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC / KNEC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'business'
      },
      {
        id: 'cpa_kasneb',
        name: 'Certified Public Accountants (CPA)',
        entryGrade: 'KCSE C+ / C (Plain)',
        assessmentBody: 'KASNEB',
        intakePeriods: 'January and July',
        duration: '2.5 Years',
        level: 'Professional',
        departmentId: 'business'
      },
      {
        id: 'bm_l5',
        name: 'Business Management Level 5',
        entryGrade: 'KCSE D (Plain) and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '2 Years',
        level: 'Level 5 (Certificate)',
        departmentId: 'business'
      },
      {
        id: 'atd_kasneb',
        name: 'Accounting Technicians Diploma (ATD)',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'KASNEB',
        intakePeriods: 'January and July',
        duration: '1.5 Years',
        level: 'Diploma',
        departmentId: 'business'
      }
    ]
  },
  {
    id: 'hospitality',
    name: 'Institutional Management',
    code: 'IM',
    headOfDepartment: '',
    description: 'Professional training in culinary arts, food and beverage operations, housekeeping, catering, and event coordination.',
    courses: [
      {
        id: 'fb_l6',
        name: 'Food and Beverage Management Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC / KNEC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'hospitality'
      },
      {
        id: 'ca_l6',
        name: 'Culinary Arts Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'hospitality'
      },
      {
        id: 'fb_l5',
        name: 'Food and Beverage Sales Level 5',
        entryGrade: 'KCSE D (Plain) and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '2 Years',
        level: 'Level 5 (Certificate)',
        departmentId: 'hospitality'
      },
      {
        id: 'ck_l4',
        name: 'Commercial Cooking Level 4',
        entryGrade: 'KCSE E and Above',
        assessmentBody: 'TVET-CDACC / NITA',
        intakePeriods: 'January, May and September',
        duration: '1 Year',
        level: 'Level 4 (Artisan)',
        departmentId: 'hospitality'
      }
    ]
  },
  {
    id: 'applied_sciences',
    name: 'Applied Sciences',
    code: 'AS',
    headOfDepartment: '',
    description: 'Laboratory science technology, food science processing, chemical analysis, and environmental management.',
    courses: [
      {
        id: 'slt_l6',
        name: 'Science Laboratory Technology Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC / KNEC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'applied_sciences'
      },
      {
        id: 'fst_l6',
        name: 'Food Science Technology Level 6',
        entryGrade: 'KCSE C- and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '3 Years',
        level: 'Level 6 (Diploma)',
        departmentId: 'applied_sciences'
      },
      {
        id: 'slt_l5',
        name: 'Science Laboratory Technology Level 5',
        entryGrade: 'KCSE D (Plain) and Above',
        assessmentBody: 'TVET-CDACC',
        intakePeriods: 'January, May and September',
        duration: '2 Years',
        level: 'Level 5 (Certificate)',
        departmentId: 'applied_sciences'
      }
    ]
  },
  {
    id: 'short_courses',
    name: 'ICT Short Courses',
    code: 'SHORT',
    headOfDepartment: '',
    description: 'Rapid, hands-on certification short courses designed for youth, working professionals, and continuous skills development.',
    courses: [
      {
        id: 'sc_web',
        name: 'Web Design & Web Development (Full Stack)',
        entryGrade: 'Open to All / Basic Literacy',
        assessmentBody: 'KITCHA TVC / NITA',
        intakePeriods: 'Monthly Intake',
        duration: '3 Months',
        level: 'Short Professional',
        departmentId: 'short_courses'
      },
      {
        id: 'sc_cisco',
        name: 'Cisco CCNA Routing & Switching Certification',
        entryGrade: 'Open to All',
        assessmentBody: 'Cisco Networking Academy',
        intakePeriods: 'Quarterly Intake',
        duration: '4 Months',
        level: 'International Certification',
        departmentId: 'short_courses'
      },
      {
        id: 'sc_cctv',
        name: 'CCTV Installation, Access Control & Alarm Systems',
        entryGrade: 'Open to All',
        assessmentBody: 'NITA / KITCHA TVC',
        intakePeriods: 'Monthly Intake',
        duration: '1 Month',
        level: 'Skill Competency',
        departmentId: 'short_courses'
      },
      {
        id: 'sc_graphics',
        name: 'Graphic Design (Adobe Photoshop, Illustrator & CorelDraw)',
        entryGrade: 'Open to All',
        assessmentBody: 'KITCHA TVC',
        intakePeriods: 'Monthly Intake',
        duration: '2 Months',
        level: 'Creative Certificate',
        departmentId: 'short_courses'
      },
      {
        id: 'sc_data',
        name: 'Data Analysis with Excel, SPSS & Power BI',
        entryGrade: 'Diploma / Degree or Open',
        assessmentBody: 'KITCHA TVC',
        intakePeriods: 'Monthly Intake',
        duration: '6 Weeks',
        level: 'Analytics Specialist',
        departmentId: 'short_courses'
      }
    ]
  }
];

export const COLLEGE_INFO = {
  name: 'KITUTU CHACHE TECHNICAL AND VOCATIONAL COLLEGE',
  shortName: 'KITCHA TVC',
  motto: 'Skills for Empowerment and Industrial Transformation',
  contacts: {
    mobile: '+254774703453',
    email: 'kitutuchachetvc@gmail.com',
    postalAddress: 'P.o Box 376 - 40200 Kisii',
    physicalAddress: 'Off Kisii Town - Nyamataro Road',
    county: 'Kisii County, Kenya',
    workingHours: 'Monday - Friday: 8:00 AM - 5:00 PM'
  },
  intakeAnnouncement: 'September 2026 Intake Ongoing. Secure your chance now!',
  strategicStatements: {
    heading: 'STRATEGIC STATEMENTS',
    vision: 'A Centre of Excellence in research and skills training that commensurate with industry and community demands.',
    mission: 'To provide quality, market driven technical and vocational education through effective training, innovation and partnerships for sustainable development.',
    coreValues: [
      'Integrity',
      'Quality',
      'Creativity',
      'Professionalism',
      'Equity'
    ]
  },
  vision: 'A Centre of Excellence in research and skills training that commensurate with industry and community demands.',
  mission: 'To provide quality, market driven technical and vocational education through effective training, innovation and partnerships for sustainable development.',
  coreValues: [
    { title: 'Integrity', desc: 'Upholding honesty, transparency, ethical principles, and accountability in all academic and administrative conduct.' },
    { title: 'Quality', desc: 'Delivering exceptional, market-driven technical competencies that meet modern industry standards.' },
    { title: 'Creativity', desc: 'Fostering innovative technical solutions, research ingenuity, and enterprise problem-solving.' },
    { title: 'Professionalism', desc: 'Demonstrating competence, ethical discipline, continuous improvement, and mutual respect.' },
    { title: 'Equity', desc: 'Ensuring fair, inclusive, and accessible opportunities in technical education for all trainees.' }
  ],
  bog: [],
  management: [
    { name: 'Mr. John Mareri Ondieki', title: 'Principal', department: 'Executive Management' },
    { name: 'Mr. Samwel Geke Sagwe', title: 'Deputy Principal Administration', department: 'Administration' },
    { name: 'Mr. Martin Nyamweya Mageto', title: 'Deputy Principal Academics', department: 'Academics' },
    { name: 'Mr. Obare Nyamweya Vincent', title: 'Registrar', department: 'Registrar Office' },
    { name: 'Ms Elmelda Moranga', title: 'Dean of Students', department: 'Dean of Students Office' }
  ],
  downloads: [
    { title: 'Official Trainee Application & Registration Form 2026/2027', category: 'Admission', size: '1.2 MB', format: 'PDF', ref: 'KTVC/ADM/FORM/2026' },
    { title: 'Government-Sponsored & Self-Sponsored Fee Structure 2026/2027', category: 'Finance', size: '850 KB', format: 'PDF', ref: 'KTVC/FIN/FEES/2026' },
    { title: 'Trainee Rules, Regulations & Code of Conduct Handbook', category: 'Policy', size: '2.4 MB', format: 'PDF', ref: 'KTVC/DOS/POLICY/01' },
    { title: 'KITCHA TVC Academic Calendar of Events 2026/2027', category: 'Academic', size: '640 KB', format: 'PDF', ref: 'KTVC/ACA/CAL/2026' },
    { title: 'Industrial Attachment Trainee Logbook & Assessment Guidelines', category: 'Attachment', size: '1.8 MB', format: 'PDF', ref: 'KTVC/ILL/LOGBOOK/2026' },
    { title: 'TVET-CDACC Assessment & Examination Regulations', category: 'Examination', size: '920 KB', format: 'PDF', ref: 'KTVC/EXAM/CDACC/2026' }
  ],
  adverts: [
    { title: 'Part-Time Trainer Vacancies (Electrical, Building & ICT)', date: 'August 28, 2026', deadline: 'September 25, 2026', category: 'Careers', ref: 'KTVC/ADV/TR/2026/03' },
    { title: 'Call for September 2026 Direct & KUCCPS Trainee Intake', date: 'August 15, 2026', deadline: 'September 30, 2026', category: 'Admissions', ref: 'KTVC/ADV/INTAKE/SEP26' },
    { title: 'Industrial Attachment Placement Opportunities for Diploma Students', date: 'September 01, 2026', deadline: 'October 15, 2026', category: 'Opportunities', ref: 'KTVC/ADV/ATT/2026' }
  ],
  tenders: [
    { title: 'Tender for Supply and Delivery of Engineering Workshop Equipment & Tools', date: 'August 20, 2026', deadline: 'September 22, 2026', ref: 'KTVC/TND/ENG/01/2026-2027', status: 'Open' },
    { title: 'Tender for Supply, Installation & Commissioning of High-Speed Campus LAN & Wi-Fi', date: 'August 24, 2026', deadline: 'September 26, 2026', ref: 'KTVC/TND/ICT/02/2026-2027', status: 'Open' },
    { title: 'Pre-qualification of Suppliers for Provision of Security, Sanitary & Catering Services', date: 'August 10, 2026', deadline: 'September 18, 2026', ref: 'KTVC/PQ/GEN/03/2026-2027', status: 'Open' },
    { title: 'Supply & Delivery of Trainee Library Books & Technical Manuals', date: 'September 02, 2026', deadline: 'October 05, 2026', ref: 'KTVC/TND/LIB/04/2026-2027', status: 'Open' }
  ]
};
