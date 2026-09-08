import { PoeDocument, PoeNotification, PoeRubric } from '../types';

export const INITIAL_POE_RUBRICS: PoeRubric[] = [
  {
    id: 'rubric_scheme',
    title: 'TVET CDACC Scheme of Work Quality Standard',
    targetCategory: 'scheme_of_work',
    criteria: [
      { id: 'sc_1', name: 'Curriculum & NOS Alignment', maxScore: 25, description: 'Alignment with national occupational standards and CDACC learning outcomes.' },
      { id: 'sc_2', name: 'Practical Trainee Tasks & Activities', maxScore: 25, description: 'Adequacy and depth of student practical workshop and laboratory sessions.' },
      { id: 'sc_3', name: 'Assessment & Feedback Strategies', maxScore: 25, description: 'Inclusion of formative continuous assessment tests (CATs) and competency rubrics.' },
      { id: 'sc_4', name: 'Resource & Safety Planning', maxScore: 25, description: 'Specified workshop consumables, equipment, and occupational safety rules.' }
    ]
  },
  {
    id: 'rubric_lesson',
    title: 'CBET Session / Lesson Plan Evaluation Tool',
    targetCategory: 'lesson_plan',
    criteria: [
      { id: 'lp_1', name: 'Safety Briefing & Introduction', maxScore: 20, description: 'Tool safety check, protective gear inspection, and session objective briefing.' },
      { id: 'lp_2', name: 'Trainer Demonstration (Modeling)', maxScore: 30, description: 'Step-by-step master demonstration of skills and procedural technique.' },
      { id: 'lp_3', name: 'Trainee Hands-on Practice', maxScore: 30, description: 'Individual and group practical trial with active facilitator guidance.' },
      { id: 'lp_4', name: 'Competency Check & Debrief', maxScore: 20, description: 'Observation checklist review, housekeeping, and debriefing.' }
    ]
  },
  {
    id: 'rubric_project',
    title: 'Trainee Practical Project Competency Assessment Rubric',
    targetCategory: 'practical_project',
    criteria: [
      { id: 'tp_1', name: 'Workplace Safety & Standards Compliance', maxScore: 20, description: 'PPE compliance, hazard identification, and compliance with industry regulations.' },
      { id: 'tp_2', name: 'Craftsmanship & Technical Execution', maxScore: 30, description: 'Accuracy of fabrication, neatness of wiring/piping/code, and adherence to tolerances.' },
      { id: 'tp_3', name: 'Operational Functionality & Testing', maxScore: 30, description: 'Product or installation functions flawlessly under real-world testing conditions.' },
      { id: 'tp_4', name: 'Technical Portfolio Documentation', maxScore: 20, description: 'Accompanying diagrams, project report, cost estimation, and user manual.' }
    ]
  },
  {
    id: 'rubric_attachment',
    title: 'Industrial Attachment & Dual Training Rubric',
    targetCategory: 'industrial_attachment',
    criteria: [
      { id: 'ia_1', name: 'Logbook Completeness & Weekly Reflections', maxScore: 25, description: 'Daily log of occupational activities endorsed by the industry supervisor.' },
      { id: 'ia_2', name: 'Industry Supervisor Evaluation Report', maxScore: 35, description: 'Punctuality, work ethic, teamwork, and technical dexterity ratings.' },
      { id: 'ia_3', name: 'Comprehensive Attachment Summary Report', maxScore: 25, description: 'Organizational background, key technical challenges solved, and skills acquired.' },
      { id: 'ia_4', name: 'Institutional Visiting Assessor Sign-off', maxScore: 15, description: 'On-site visitation inspection and viva voce assessment.' }
    ]
  }
];

export const INITIAL_POE_DOCUMENTS: PoeDocument[] = [
  // -------------------------------------------------------------
  // TRAINER PORTFOLIOS
  // -------------------------------------------------------------
  {
    id: 'poe_doc_001',
    poeType: 'trainer',
    title: 'Scheme of Work: Introduction to Programming (ICT111)',
    description: 'Term 1 14-Week detailed CDACC competency-based scheme covering structured programming in C, algorithms, flowcharts, and practical lab exercises.',
    category: 'scheme_of_work',
    targetUnitId: 'unit_prog',
    targetUnitName: 'Introduction to Programming (ICT111)',
    targetCourseId: 'course_dict',
    targetCourseName: 'Diploma in ICT',
    departmentId: 'dept_cs',
    departmentName: 'Computer Science & IT',
    ownerId: 'user_trainer',
    ownerName: 'Mr. Evans Kemboi',
    ownerRole: 'trainer',
    ownerIdentifier: 'PF-2024-042',
    ownerEmail: 'e.kemboi@kitchatvc.ac.ke',
    academicYear: '2026/2027',
    termSemester: 'Term 1',
    fileName: 'ICT111_Scheme_Of_Work_Term1_2026.pdf',
    fileSize: '1.8 MB',
    fileType: 'application/pdf',
    version: 'v1.2',
    dateUploaded: '2026-08-20T08:30:00.000Z',
    dateModified: '2026-08-24T10:15:00.000Z',
    status: 'verified',
    tags: ['CDACC', 'CBET', 'Term 1', 'Curriculum', 'Module 1'],
    competencyGrade: 'competent',
    reviews: [
      {
        id: 'rev_001',
        documentId: 'poe_doc_001',
        reviewerId: 'user_hod',
        reviewerName: 'Dr. Andrew Rabach (HOD CSIT)',
        reviewerRole: 'hod',
        dateReviewed: '2026-08-22T14:10:00.000Z',
        feedbackComments: 'Well-structured scheme. Practical lab ratios meet the 70% practical threshold mandated by CDACC. Approved for deployment.',
        overallScore: 94,
        maxPossibleScore: 100,
        decision: 'approved'
      }
    ],
    verificationStamp: {
      verifiedBy: 'user_qa',
      verifierName: 'Madam Scholastica Wanjiku',
      verifierRole: 'quality_assurance',
      verificationDate: '2026-08-24T10:15:00.000Z',
      verificationCode: 'KTVC-QA-SCH-2026-014',
      complianceStatus: 'fully_compliant',
      standardsBody: 'TVETA',
      comments: 'Full compliance with TVETA Standards for Trainer Pedagogical Documentation.'
    }
  },
  {
    id: 'poe_doc_002',
    poeType: 'trainer',
    title: 'Lesson Plan: Database Normalization & ERD Modeling (ICT112)',
    description: 'Detailed 2-hour practical session plan for teaching 1NF, 2NF, and 3NF database design using MySQL Workbench in Computer Lab 1.',
    category: 'lesson_plan',
    targetUnitId: 'unit_db',
    targetUnitName: 'Database Management Systems (ICT112)',
    targetCourseId: 'course_dict',
    targetCourseName: 'Diploma in ICT',
    departmentId: 'dept_cs',
    departmentName: 'Computer Science & IT',
    ownerId: 'user_trainer',
    ownerName: 'Mr. Evans Kemboi',
    ownerRole: 'trainer',
    ownerIdentifier: 'PF-2024-042',
    academicYear: '2026/2027',
    termSemester: 'Term 1',
    fileName: 'Lesson_Plan_Week4_Database_Normalization.pdf',
    fileSize: '840 KB',
    fileType: 'application/pdf',
    version: 'v1.0',
    dateUploaded: '2026-09-01T09:00:00.000Z',
    status: 'approved',
    tags: ['Lesson Plan', 'Week 4', 'MySQL', 'Database'],
    reviews: [
      {
        id: 'rev_002',
        documentId: 'poe_doc_002',
        reviewerId: 'user_hod',
        reviewerName: 'Dr. Andrew Rabach (HOD CSIT)',
        reviewerRole: 'hod',
        dateReviewed: '2026-09-02T11:45:00.000Z',
        feedbackComments: 'Great breakdown of hands-on trainee activities. Ensure every trainee saves their schema export before session end.',
        overallScore: 88,
        maxPossibleScore: 100,
        decision: 'approved'
      }
    ]
  },
  {
    id: 'poe_doc_003',
    poeType: 'trainer',
    title: 'Record of Work Covered: Electrical Principles I (EEE111)',
    description: 'Weekly cumulative log of lectures and workshop lab sessions covered across Weeks 1 to 6, including attendance rates and trainee mastery notes.',
    category: 'record_of_work',
    targetUnitId: 'unit_elec_princ',
    targetUnitName: 'Electrical Principles I (EEE111)',
    targetCourseId: 'course_dee',
    targetCourseName: 'Diploma in Electrical Engineering',
    departmentId: 'dept_ee',
    departmentName: 'Electrical & Electronics Engineering',
    ownerId: 'user_trainer',
    ownerName: 'Mr. Evans Kemboi',
    ownerRole: 'trainer',
    ownerIdentifier: 'PF-2024-042',
    academicYear: '2026/2027',
    termSemester: 'Term 1',
    fileName: 'Record_Of_Work_EEE111_Term1.xlsx',
    fileSize: '450 KB',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    version: 'v1.0',
    dateUploaded: '2026-09-04T16:20:00.000Z',
    status: 'under_review',
    tags: ['Record of Work', 'Weekly Log', 'Term 1', 'EEE'],
    reviews: []
  },
  {
    id: 'poe_doc_004',
    poeType: 'trainer',
    title: 'Plumbing Workshop Safety & Pipework Learning Guide (PLM101)',
    description: 'Comprehensive trainee practical workshop manual including tool safety, pipe sizing charts, PPE regulations, and pipe threading step-by-step procedures.',
    category: 'learning_guide',
    targetUnitId: 'unit_plm_pipe_l3',
    targetUnitName: 'Plumbing Technology & Pipework Practice (PLM101)',
    targetCourseId: 'course_plm_l4',
    targetCourseName: 'Plumbing Level 4 (Craft)',
    departmentId: 'dept_be',
    departmentName: 'Building & Civil Engineering',
    ownerId: 'user_trainer_be',
    ownerName: 'Mr. Dennis Mogaka',
    ownerRole: 'trainer',
    ownerIdentifier: 'PF-2023-018',
    academicYear: '2026/2027',
    termSemester: 'Term 1',
    fileName: 'Plumbing_Workshop_Safety_Guide_L4.pdf',
    fileSize: '4.2 MB',
    fileType: 'application/pdf',
    version: 'v2.0',
    dateUploaded: '2026-08-15T11:00:00.000Z',
    status: 'verified',
    tags: ['Learning Guide', 'Safety', 'Plumbing', 'Level 4', 'Workshop'],
    competencyGrade: 'competent',
    reviews: [
      {
        id: 'rev_003',
        documentId: 'poe_doc_004',
        reviewerId: 'user_hod_be',
        reviewerName: 'Eng. Faith Bosire (HOD Building & Civil)',
        reviewerRole: 'hod',
        dateReviewed: '2026-08-18T10:00:00.000Z',
        feedbackComments: 'Superb guide! Illustrated pictures of copper pipe jointing and hydrostatic testing are clear and meet NITA/CDACC requirements.',
        overallScore: 96,
        maxPossibleScore: 100,
        decision: 'approved'
      }
    ],
    verificationStamp: {
      verifiedBy: 'user_assessor',
      verifierName: 'Mr. Benson Nyabuto',
      verifierRole: 'assessor',
      verificationDate: '2026-08-19T14:30:00.000Z',
      verificationCode: 'KTVC-IV-PLM-2026-003',
      complianceStatus: 'fully_compliant',
      standardsBody: 'CDACC',
      comments: 'Internal Verification completed: Fully aligned with Occupational Standard OS-PLM-004.'
    }
  },
  {
    id: 'poe_doc_005',
    poeType: 'trainer',
    title: 'Trainer CPD Certificate: CBET Assessor & Verifier Certification',
    description: 'National TVETA certificate of competency in Competency-Based Assessment, Verification, and Portfolio Auditing (Certificate No. TVETA/CBET/ASS/2025/1192).',
    category: 'cpd_certificate',
    departmentId: 'dept_cs',
    departmentName: 'Computer Science & IT',
    ownerId: 'user_trainer',
    ownerName: 'Mr. Evans Kemboi',
    ownerRole: 'trainer',
    ownerIdentifier: 'PF-2024-042',
    academicYear: '2026/2027',
    termSemester: 'Term 1',
    fileName: 'TVETA_CBET_Assessor_Certificate_Kemboi.pdf',
    fileSize: '1.2 MB',
    fileType: 'application/pdf',
    version: 'v1.0',
    dateUploaded: '2026-08-10T09:15:00.000Z',
    status: 'verified',
    tags: ['CPD', 'TVETA', 'License', 'Assessor'],
    reviews: [],
    verificationStamp: {
      verifiedBy: 'user_deputy',
      verifierName: 'Eng. Justus Ngetich',
      verifierRole: 'deputy_academics',
      verificationDate: '2026-08-12T15:00:00.000Z',
      verificationCode: 'KTVC-DEP-CPD-2026-009',
      complianceStatus: 'fully_compliant',
      standardsBody: 'TVETA',
      comments: 'Credential verified against national TVETA register.'
    }
  },

  // -------------------------------------------------------------
  // TRAINEE EVIDENCE PORTFOLIOS
  // -------------------------------------------------------------
  {
    id: 'poe_doc_101',
    poeType: 'trainee',
    title: 'Practical Project: Dynamic College E-Portal & Database Backend',
    description: 'Capstone individual project implementing a full relational database, authentication system, and responsive UI for student grade records and course registrations.',
    category: 'practical_project',
    targetUnitId: 'unit_fullstack',
    targetUnitName: 'Full-Stack Web Engineering (DCS211)',
    targetCourseId: 'course_dcs',
    targetCourseName: 'Diploma in Computer Science',
    departmentId: 'dept_cs',
    departmentName: 'Computer Science & IT',
    ownerId: 'user_student1',
    ownerName: 'Emmanuel Omondi',
    ownerRole: 'trainee',
    ownerIdentifier: 'KTVC/DICT/2026J/001',
    ownerEmail: 'e.omondi@student.kitchatvc.ac.ke',
    academicYear: '2026/2027',
    termSemester: 'Term 1',
    fileName: 'Capstone_Project_Report_And_Code_Emmanuel_Omondi.zip',
    fileSize: '14.5 MB',
    fileType: 'application/zip',
    version: 'v1.1',
    dateUploaded: '2026-09-02T13:40:00.000Z',
    status: 'verified',
    tags: ['FullStack', 'React', 'NodeJS', 'Database', 'Capstone'],
    competencyGrade: 'distinction',
    reviews: [
      {
        id: 'rev_101',
        documentId: 'poe_doc_101',
        reviewerId: 'user_trainer',
        reviewerName: 'Mr. Evans Kemboi (Trainer)',
        reviewerRole: 'trainer',
        dateReviewed: '2026-09-03T15:20:00.000Z',
        feedbackComments: 'Exceptional architectural execution. The code follows clean modular principles, security tokens are validated, and the database schema is in 3NF.',
        rubricScores: [
          { criterionId: 'tp_1', criterionName: 'Workplace Safety & Standards Compliance', maxScore: 20, scoreAwarded: 19, remarks: 'Code sanitization and security implemented.' },
          { criterionId: 'tp_2', criterionName: 'Craftsmanship & Technical Execution', maxScore: 30, scoreAwarded: 29, remarks: 'Modern UI/UX and clean asynchronous queries.' },
          { criterionId: 'tp_3', criterionName: 'Operational Functionality & Testing', maxScore: 30, scoreAwarded: 30, remarks: 'All endpoints pass load tests.' },
          { criterionId: 'tp_4', criterionName: 'Technical Portfolio Documentation', maxScore: 20, scoreAwarded: 18, remarks: 'Clear ERD diagrams and deployment guide.' }
        ],
        overallScore: 96,
        maxPossibleScore: 100,
        decision: 'approved'
      }
    ],
    verificationStamp: {
      verifiedBy: 'user_assessor',
      verifierName: 'Mr. Benson Nyabuto',
      verifierRole: 'assessor',
      verificationDate: '2026-09-04T11:00:00.000Z',
      verificationCode: 'KTVC-EV-DCS-2026-021',
      complianceStatus: 'fully_compliant',
      standardsBody: 'CDACC',
      comments: 'Assessor Decision: COMPETENT (DISTINCTION). Portfolio meets all criteria for Unit DCS211.'
    }
  },
  {
    id: 'poe_doc_102',
    poeType: 'trainee',
    title: 'Industrial Attachment Logbook & Supervisor Report: KPLC Ltd',
    description: '12-Week industrial attachment at Kenya Power & Lighting Company (Substation Maintenance & Telemetry Division). Includes daily logs and signed supervisor rating.',
    category: 'industrial_attachment',
    targetCourseId: 'course_dcs',
    targetCourseName: 'Diploma in Computer Science',
    departmentId: 'dept_cs',
    departmentName: 'Computer Science & IT',
    ownerId: 'user_student2',
    ownerName: 'Faith Chepkoech',
    ownerRole: 'trainee',
    ownerIdentifier: 'KTVC/DCS/2026J/002',
    academicYear: '2026/2027',
    termSemester: 'Term 1',
    fileName: 'Industrial_Attachment_Logbook_Faith_Chepkoech_KPLC.pdf',
    fileSize: '6.8 MB',
    fileType: 'application/pdf',
    version: 'v1.0',
    dateUploaded: '2026-08-28T10:00:00.000Z',
    status: 'approved',
    tags: ['Attachment', 'Logbook', 'KPLC', 'Dual Training', 'Industry'],
    competencyGrade: 'competent',
    reviews: [
      {
        id: 'rev_102',
        documentId: 'poe_doc_102',
        reviewerId: 'user_trainer',
        reviewerName: 'Mr. Evans Kemboi (Attachment Coordinator)',
        reviewerRole: 'trainer',
        dateReviewed: '2026-08-30T14:30:00.000Z',
        feedbackComments: 'Industry supervisor rated Faith with 92% for reliability and fiber splicing skills. Weekly entries are properly certified with company official stamp.',
        overallScore: 92,
        maxPossibleScore: 100,
        decision: 'approved'
      }
    ]
  },
  {
    id: 'poe_doc_103',
    poeType: 'trainee',
    title: 'Practical Task: Two-Way Staircase Lighting & Consumer Unit Wiring',
    description: 'Demonstration job card and annotated photographic evidence of wiring a PVC surface conduit, two 2-way switches, intermediate switch, and residual current breaker (RCD).',
    category: 'competency_task',
    targetUnitId: 'unit_wiring',
    targetUnitName: 'Domestic Wiring Practice (CEI111)',
    targetCourseId: 'course_cei',
    targetCourseName: 'Certificate in Electrical Installation',
    departmentId: 'dept_ee',
    departmentName: 'Electrical & Electronics Engineering',
    ownerId: 'user_trainee',
    ownerName: 'Brian Kiprop',
    ownerRole: 'trainee',
    ownerIdentifier: 'KTVC/CEI/2026J/015',
    academicYear: '2026/2027',
    termSemester: 'Term 1',
    fileName: 'Staircase_Wiring_Job_Card_Brian_Kiprop.pdf',
    fileSize: '3.1 MB',
    fileType: 'application/pdf',
    version: 'v1.0',
    dateUploaded: '2026-09-05T14:20:00.000Z',
    status: 'under_review',
    tags: ['Domestic Wiring', 'Conduit', 'Two-Way', 'Practical Evidence'],
    competencyGrade: 'pending',
    reviews: []
  },
  {
    id: 'poe_doc_104',
    poeType: 'trainee',
    title: 'Lab Assignment: Network Subnetting & VLSM Design Topology',
    description: 'Hierarchical campus network address scheme calculated using Variable Length Subnet Masking (VLSM) with Cisco Packet Tracer simulation topology file.',
    category: 'assessment_assignment',
    targetUnitId: 'unit_net_ict',
    targetUnitName: 'Data Communication & Networking (ICT213)',
    targetCourseId: 'course_dict',
    targetCourseName: 'Diploma in ICT',
    departmentId: 'dept_cs',
    departmentName: 'Computer Science & IT',
    ownerId: 'user_student2',
    ownerName: 'Faith Chepkoech',
    ownerRole: 'trainee',
    ownerIdentifier: 'KTVC/DCS/2026J/002',
    academicYear: '2026/2027',
    termSemester: 'Term 1',
    fileName: 'VLSM_Subnetting_Campus_Assignment.pdf',
    fileSize: '1.9 MB',
    fileType: 'application/pdf',
    version: 'v1.1',
    dateUploaded: '2026-09-06T11:00:00.000Z',
    status: 'revision_requested',
    tags: ['Networking', 'Subnetting', 'VLSM', 'Packet Tracer'],
    competencyGrade: 'pending',
    reviews: [
      {
        id: 'rev_104',
        documentId: 'poe_doc_104',
        reviewerId: 'user_trainer',
        reviewerName: 'Mr. Evans Kemboi (Trainer)',
        reviewerRole: 'trainer',
        dateReviewed: '2026-09-06T16:00:00.000Z',
        feedbackComments: 'Subnet mask for Department of Engineering (VLAN 30) has an off-by-one host range error. Recalculate the broadcast address and upload Revision v1.2.',
        overallScore: 68,
        maxPossibleScore: 100,
        decision: 'revision_requested'
      }
    ]
  }
];

export const INITIAL_POE_NOTIFICATIONS: PoeNotification[] = [
  {
    id: 'notif_001',
    recipientId: 'user_trainer',
    senderName: 'Faith Chepkoech (Trainee)',
    title: 'Assignment Resubmitted',
    message: 'Faith Chepkoech submitted updated evidence for VLSM Subnetting Assignment (ICT213).',
    documentId: 'poe_doc_104',
    dateSent: '2026-09-07T08:15:00.000Z',
    isRead: false,
    type: 'submission'
  },
  {
    id: 'notif_002',
    recipientId: 'user_student2',
    senderName: 'Mr. Evans Kemboi (Trainer)',
    title: 'Revision Requested on Network Assignment',
    message: 'Please update the broadcast address calculation for VLAN 30 and re-upload your work.',
    documentId: 'poe_doc_104',
    dateSent: '2026-09-06T16:05:00.000Z',
    isRead: true,
    type: 'revision_needed'
  },
  {
    id: 'notif_003',
    recipientId: 'user_hod',
    senderName: 'Mr. Evans Kemboi (Trainer)',
    title: 'Record of Work Submitted for Review',
    message: 'Record of Work for EEE111 Weeks 1-6 has been submitted for departmental sign-off.',
    documentId: 'poe_doc_003',
    dateSent: '2026-09-04T16:22:00.000Z',
    isRead: false,
    type: 'submission'
  },
  {
    id: 'notif_004',
    recipientId: 'user_qa',
    senderName: 'System Auditor',
    title: 'Departmental PoE Audit Due',
    message: 'End-of-month Quality Assurance sampling is now open for Computer Science & IT portfolios.',
    dateSent: '2026-09-07T07:00:00.000Z',
    isRead: false,
    type: 'compliance_alert'
  },
  {
    id: 'notif_005',
    recipientId: 'user_student1',
    senderName: 'Mr. Benson Nyabuto (Lead Assessor)',
    title: 'Portfolio Verified - Distinction Awarded!',
    message: 'Your Capstone Project Evidence has been certified with TVET CDACC Distinction Stamp.',
    documentId: 'poe_doc_101',
    dateSent: '2026-09-04T11:05:00.000Z',
    isRead: true,
    type: 'verified'
  }
];
