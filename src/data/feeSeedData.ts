import { Student, FeeStructure, Invoice, PaymentTransaction, InstallmentPlan, FeeAuditLog, AdmissionApplication, ExamMark } from '../types';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'stud_001',
    regNumber: 'KTVC/DICT/2026J/001',
    name: 'Emmanuel Omondi',
    email: 'emmanuel.omondi@student.kitcha.ac.ke',
    phone: '+254712345678',
    gender: 'Male',
    nationalId: '38495029',
    indexNumber: '38610001/014',
    courseId: 'course_dict',
    departmentId: 'dept_cs',
    yearOfStudy: 1,
    semester: 1,
    module: 'Module 1',
    intake: 'J',
    status: 'active',
    sponsorType: 'government'
  },
  {
    id: 'stud_002',
    regNumber: 'KTVC/DCS/2026J/002',
    name: 'Faith Chepkoech',
    email: 'faith.chepkoech@student.kitcha.ac.ke',
    phone: '+254723456789',
    gender: 'Female',
    nationalId: '39201948',
    indexNumber: '38620004/008',
    courseId: 'course_dcs',
    departmentId: 'dept_cs',
    yearOfStudy: 1,
    semester: 1,
    module: 'Module 1',
    intake: 'J',
    status: 'active',
    sponsorType: 'self'
  },
  {
    id: 'stud_003',
    regNumber: 'KTVC/DEEE/2026M/001',
    name: 'Kevin Wafula',
    email: 'kevin.wafula@student.kitcha.ac.ke',
    phone: '+254734567890',
    gender: 'Male',
    nationalId: '37492019',
    indexNumber: '38630012/031',
    courseId: 'course_dee',
    departmentId: 'dept_ee',
    yearOfStudy: 2,
    semester: 1,
    module: 'Module 2',
    intake: 'M',
    status: 'active',
    sponsorType: 'government'
  },
  {
    id: 'stud_004',
    regNumber: 'KTVC/DCE/2026S/001',
    name: 'Alice Nyaboke',
    email: 'alice.nyaboke@student.kitcha.ac.ke',
    phone: '+254745678901',
    gender: 'Female',
    nationalId: '38192049',
    indexNumber: '38640008/022',
    courseId: 'course_dce',
    departmentId: 'dept_be',
    yearOfStudy: 1,
    semester: 2,
    module: 'Module 1',
    intake: 'S',
    status: 'active',
    sponsorType: 'self'
  },
  {
    id: 'stud_005',
    regNumber: 'KTVC/DICT/2026J/003',
    name: 'Brian Mwangi',
    email: 'brian.mwangi@student.kitcha.ac.ke',
    phone: '+254756789012',
    gender: 'Male',
    nationalId: '36481029',
    indexNumber: '38610005/019',
    courseId: 'course_dict',
    departmentId: 'dept_cs',
    yearOfStudy: 2,
    semester: 2,
    module: 'Module 2',
    intake: 'J',
    status: 'suspended',
    sponsorType: 'self'
  }
];

export const INITIAL_FEE_STRUCTURES: FeeStructure[] = [
  {
    id: 'struct_dict_y1s1',
    courseId: 'course_dict',
    academicYear: '2025/2026',
    semester: 1,
    items: [
      { name: 'Tuition Fee', amount: 15000 },
      { name: 'Examination Fee', amount: 4000 },
      { name: 'Library & ICT Fee', amount: 2500 },
      { name: 'Student Activity Fee', amount: 1500 },
      { name: 'Caution Money (One-off)', amount: 2000 },
      { name: 'Student Council Union', amount: 500 }
    ],
    totalAmount: 25500
  },
  {
    id: 'struct_dcs_y1s1',
    courseId: 'course_dcs',
    academicYear: '2025/2026',
    semester: 1,
    items: [
      { name: 'Tuition Fee', amount: 16500 },
      { name: 'Examination Fee', amount: 4000 },
      { name: 'Library & ICT Fee', amount: 3000 },
      { name: 'Student Activity Fee', amount: 1500 },
      { name: 'Caution Money (One-off)', amount: 2000 },
      { name: 'Student Council Union', amount: 500 }
    ],
    totalAmount: 27500
  },
  {
    id: 'struct_dee_y2s1',
    courseId: 'course_dee',
    academicYear: '2025/2026',
    semester: 1,
    items: [
      { name: 'Tuition Fee', amount: 18000 },
      { name: 'Workshop Consumables Fee', amount: 5000 },
      { name: 'Examination Fee', amount: 4000 },
      { name: 'Library & ICT Fee', amount: 2000 },
      { name: 'Student Activity Fee', amount: 1500 },
      { name: 'Student Council Union', amount: 500 }
    ],
    totalAmount: 31000
  },
  {
    id: 'struct_dce_y1s2',
    courseId: 'course_dce',
    academicYear: '2025/2026',
    semester: 2,
    items: [
      { name: 'Tuition Fee', amount: 17500 },
      { name: 'Lab Consumables Fee', amount: 4500 },
      { name: 'Examination Fee', amount: 4000 },
      { name: 'Library & ICT Fee', amount: 2000 },
      { name: 'Student Activity Fee', amount: 1500 },
      { name: 'Student Council Union', amount: 500 }
    ],
    totalAmount: 30000
  }
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv_001',
    studentId: 'stud_001',
    feeStructureId: 'struct_dict_y1s1',
    description: 'Fees Invoice - Year 1 Semester 1',
    academicYear: '2025/2026',
    semester: 1,
    amount: 25500,
    dueDate: '2026-03-31',
    balance: 0, // Fully paid
    status: 'paid'
  },
  {
    id: 'inv_002',
    studentId: 'stud_002',
    feeStructureId: 'struct_dcs_y1s1',
    description: 'Fees Invoice - Year 1 Semester 1',
    academicYear: '2025/2026',
    semester: 1,
    amount: 27500,
    dueDate: '2026-03-31',
    balance: 8500, // Partially Paid
    status: 'partially_paid'
  },
  {
    id: 'inv_003',
    studentId: 'stud_003',
    feeStructureId: 'struct_dee_y2s1',
    description: 'Fees Invoice - Year 2 Semester 1',
    academicYear: '2025/2026',
    semester: 1,
    amount: 31000,
    dueDate: '2026-03-31',
    balance: 11000, // Partially paid via government funding
    status: 'partially_paid'
  },
  {
    id: 'inv_004',
    studentId: 'stud_004',
    feeStructureId: 'struct_dce_y1s2',
    description: 'Fees Invoice - Year 1 Semester 2',
    academicYear: '2025/2026',
    semester: 2,
    amount: 30000,
    dueDate: '2026-04-15',
    balance: 30000, // Unpaid
    status: 'unpaid'
  },
  {
    id: 'inv_005',
    studentId: 'stud_005',
    feeStructureId: 'struct_dict_y1s1',
    description: 'Fees Invoice - Year 1 Semester 1',
    academicYear: '2025/2026',
    semester: 1,
    amount: 25500,
    dueDate: '2026-02-28',
    balance: 27500, // Overdue & Penalty Applied
    status: 'unpaid'
  }
];

export const INITIAL_PAYMENTS: PaymentTransaction[] = [
  // Payments for Student 1 (Emmanuel Omondi - Balance 0)
  {
    id: 'tx_001',
    studentId: 'stud_001',
    invoiceId: 'inv_001',
    amount: 15000,
    date: '2026-01-10T10:15:30Z',
    method: 'mpesa_stk',
    referenceNumber: 'RAK12M9XJL',
    reconciled: true,
    remarks: 'M-Pesa STK Push Online Fee Payment',
    transactionType: 'fee_payment',
    academicYear: '2025/2026',
    semester: 1,
    receiptNumber: 'RCP-2026-0001',
    recordedBy: 'user_finance_1'
  },
  {
    id: 'tx_002',
    studentId: 'stud_001',
    invoiceId: 'inv_001',
    amount: 10500,
    date: '2026-02-05T14:22:11Z',
    method: 'bank',
    referenceNumber: 'KCB-DEP-994829',
    reconciled: true,
    remarks: 'Equity Bank Direct Deposit',
    transactionType: 'fee_payment',
    academicYear: '2025/2026',
    semester: 1,
    receiptNumber: 'RCP-2026-0002',
    recordedBy: 'user_finance_1'
  },

  // Payments for Student 2 (Faith Chepkoech - Invoiced 27500, Paid 19000, Balance 8500)
  {
    id: 'tx_003',
    studentId: 'stud_002',
    invoiceId: 'inv_002',
    amount: 10000,
    date: '2026-01-15T11:45:00Z',
    method: 'mpesa_paybill',
    referenceNumber: 'RAP83N4MKD',
    reconciled: true,
    remarks: 'M-Pesa Paybill payment #242424',
    transactionType: 'fee_payment',
    academicYear: '2025/2026',
    semester: 1,
    receiptNumber: 'RCP-2026-0003',
    recordedBy: 'user_finance_1'
  },
  {
    id: 'tx_004',
    studentId: 'stud_002',
    invoiceId: 'inv_002',
    amount: 5000,
    date: '2026-02-18T09:30:15Z',
    method: 'cash',
    referenceNumber: 'CSH-0218-093',
    reconciled: true,
    remarks: 'Cash Payment at Counter Office',
    transactionType: 'fee_payment',
    academicYear: '2025/2026',
    semester: 1,
    receiptNumber: 'RCP-2026-0004',
    recordedBy: 'user_finance_1'
  },
  {
    id: 'tx_005',
    studentId: 'stud_002',
    invoiceId: 'inv_002',
    amount: 4000,
    date: '2026-03-01T16:00:00Z',
    method: 'bank',
    referenceNumber: 'SCH-CDF-2026',
    reconciled: true,
    remarks: 'Kitutu Chache CDF Bursary allocation',
    transactionType: 'bursary',
    academicYear: '2025/2026',
    semester: 1,
    receiptNumber: 'RCP-2026-0005',
    recordedBy: 'user_finance_2'
  },

  // Payments for Student 3 (Kevin Wafula - Invoiced 31000, Paid 20000, Balance 11000)
  {
    id: 'tx_006',
    studentId: 'stud_003',
    invoiceId: 'inv_003',
    amount: 20000,
    date: '2026-02-10T12:00:00Z',
    method: 'bank',
    referenceNumber: 'HELB-DISB-25B',
    reconciled: true,
    remarks: 'HELB Loan Allocation Semester 1',
    transactionType: 'helb_funding',
    academicYear: '2025/2026',
    semester: 1,
    receiptNumber: 'RCP-2026-0006',
    recordedBy: 'system'
  },

  // Penalty on Student 5 (Brian Mwangi - Overdue Penalty +2,000)
  {
    id: 'tx_007',
    studentId: 'stud_005',
    invoiceId: 'inv_005',
    amount: 2000,
    date: '2026-03-01T00:00:00Z',
    method: 'cash',
    referenceNumber: 'PEN-001',
    reconciled: true,
    remarks: 'Late fee penalty for semester invoice default',
    transactionType: 'penalty',
    academicYear: '2025/2026',
    semester: 1,
    receiptNumber: undefined,
    recordedBy: 'system'
  }
];

export const INITIAL_INSTALLMENT_PLANS: InstallmentPlan[] = [
  {
    id: 'plan_001',
    studentId: 'stud_002',
    invoiceId: 'inv_002',
    agreedAmount: 27500,
    dateAgreed: '2026-01-12',
    installments: [
      { id: 'inst_001_1', dueDate: '2026-01-15', amount: 10000, amountPaid: 10000, status: 'paid' },
      { id: 'inst_001_2', dueDate: '2026-02-15', amount: 9000, amountPaid: 9000, status: 'paid' },
      { id: 'inst_001_3', dueDate: '2026-03-15', amount: 8500, amountPaid: 0, status: 'pending' }
    ],
    active: true
  }
];

export const INITIAL_FEE_AUDIT_LOGS: FeeAuditLog[] = [
  {
    id: 'log_001',
    timestamp: '2026-01-10T10:15:30Z',
    userId: 'stud_001',
    userRole: 'student',
    action: 'INITIATED_MPESA_PAYMENT',
    details: 'Initiated STK Push of KES 15,000 for Invoice inv_001'
  },
  {
    id: 'log_002',
    timestamp: '2026-01-10T10:16:10Z',
    userId: 'system',
    userRole: 'system',
    action: 'MPESA_RECONCILIATION_SUCCESS',
    details: 'Auto-reconciled M-Pesa STK payment (Ref: RAK12M9XJL) of KES 15,000'
  },
  {
    id: 'log_003',
    timestamp: '2026-01-12T09:00:00Z',
    userId: 'user_finance_1',
    userRole: 'finance_officer',
    action: 'APPROVED_INSTALLMENT_PLAN',
    details: 'Approved 3-stage installment plan for Faith Chepkoech (stud_002)'
  },
  {
    id: 'log_004',
    timestamp: '2026-02-18T09:30:15Z',
    userId: 'user_finance_1',
    userRole: 'finance_officer',
    action: 'RECORDED_MANUAL_PAYMENT',
    details: 'Recorded cash payment of KES 5,000 for student Faith Chepkoech'
  },
  {
    id: 'log_005',
    timestamp: '2026-03-01T00:00:00Z',
    userId: 'system',
    userRole: 'system',
    action: 'APPLIED_LATE_PENALTY',
    details: 'Applied automatic KES 2,000 late payment default penalty on Brian Mwangi (stud_005)'
  }
];

export const INITIAL_ADMISSION_APPLICATIONS: AdmissionApplication[] = [
  {
    id: 'app_001',
    applicantName: 'Justus Nyakundi',
    email: 'justus.nyakundi@gmail.com',
    phone: '+254711223344',
    courseId: 'course_dict',
    gender: 'Male',
    intake: 'J',
    indexNumber: '38610015/042',
    autoRegNumber: 'KTVC/DICT/2026J/004',
    dateApplied: '2026-06-01',
    status: 'pending',
    nationalId: '38291049',
    sponsorType: 'self'
  },
  {
    id: 'app_002',
    applicantName: 'Mary Atieno',
    email: 'mary.atieno@outlook.com',
    phone: '+254722334455',
    courseId: 'course_dcs',
    gender: 'Female',
    intake: 'M',
    indexNumber: '38620020/011',
    autoRegNumber: 'KTVC/DCS/2026M/003',
    dateApplied: '2026-06-05',
    status: 'pending',
    nationalId: '39102948',
    sponsorType: 'government'
  },
  {
    id: 'app_003',
    applicantName: 'Geoffrey Rotich',
    email: 'geoffrey.rotich@yahoo.com',
    phone: '+254733445566',
    courseId: 'course_dee',
    gender: 'Male',
    intake: 'J',
    indexNumber: '38630005/007',
    autoRegNumber: 'KTVC/DEEE/2026J/002',
    dateApplied: '2026-05-20',
    status: 'admitted',
    nationalId: '37291048',
    sponsorType: 'government'
  }
];

export const INITIAL_EXAM_MARKS: ExamMark[] = [
  // Emmanuel Omondi (stud_001) - DICT Module 1, 2, 3 Complete Marks Ledger
  {
    id: 'mark_001',
    studentId: 'stud_001',
    unitId: 'unit_prog',
    cat1: 26,
    cat2: 27,
    endTerm: 80,
    score: 78,
    marksObtained: 78,
    grade: 'A',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 1
  },
  {
    id: 'mark_002',
    studentId: 'stud_001',
    unitId: 'unit_db',
    cat1: 24,
    cat2: 26,
    endTerm: 74,
    score: 72,
    marksObtained: 72,
    grade: 'A-',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 1
  },
  {
    id: 'mark_003',
    studentId: 'stud_001',
    unitId: 'unit_math',
    cat1: 22,
    cat2: 24,
    endTerm: 68,
    score: 66,
    marksObtained: 66,
    grade: 'B+',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 1
  },
  {
    id: 'mark_004',
    studentId: 'stud_001',
    unitId: 'unit_comm_ict',
    cat1: 28,
    cat2: 27,
    endTerm: 82,
    score: 81,
    marksObtained: 81,
    grade: 'A',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 1
  },
  {
    id: 'mark_005',
    studentId: 'stud_001',
    unitId: 'unit_oop',
    cat1: 25,
    cat2: 28,
    endTerm: 76,
    score: 75,
    marksObtained: 75,
    grade: 'A-',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 2
  },
  {
    id: 'mark_006',
    studentId: 'stud_001',
    unitId: 'unit_sad',
    cat1: 23,
    cat2: 25,
    endTerm: 70,
    score: 68,
    marksObtained: 68,
    grade: 'B+',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 2
  },
  {
    id: 'mark_007',
    studentId: 'stud_001',
    unitId: 'unit_net_ict',
    cat1: 24,
    cat2: 26,
    endTerm: 72,
    score: 71,
    marksObtained: 71,
    grade: 'A-',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 2
  },
  {
    id: 'mark_008',
    studentId: 'stud_001',
    unitId: 'unit_quant',
    cat1: 20,
    cat2: 22,
    endTerm: 64,
    score: 62,
    marksObtained: 62,
    grade: 'B',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 2
  },
  {
    id: 'mark_009',
    studentId: 'stud_001',
    unitId: 'unit_mis',
    cat1: 26,
    cat2: 28,
    endTerm: 78,
    score: 77,
    marksObtained: 77,
    grade: 'A',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 3
  },
  {
    id: 'mark_010',
    studentId: 'stud_001',
    unitId: 'unit_sec_ict',
    cat1: 27,
    cat2: 29,
    endTerm: 84,
    score: 83,
    marksObtained: 83,
    grade: 'A',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 3
  },
  {
    id: 'mark_011',
    studentId: 'stud_001',
    unitId: 'unit_proj_ict',
    cat1: 28,
    cat2: 29,
    endTerm: 88,
    score: 86,
    marksObtained: 86,
    grade: 'A',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 3
  },

  // Faith Chepkoech (stud_002) - DCS Marks
  {
    id: 'mark_012',
    studentId: 'stud_002',
    unitId: 'unit_web',
    cat1: 28,
    cat2: 29,
    endTerm: 86,
    score: 85,
    marksObtained: 85,
    grade: 'A',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 1
  },
  {
    id: 'mark_013',
    studentId: 'stud_002',
    unitId: 'unit_net',
    cat1: 24,
    cat2: 25,
    endTerm: 72,
    score: 70,
    marksObtained: 70,
    grade: 'A-',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 1
  },
  {
    id: 'mark_014',
    studentId: 'stud_002',
    unitId: 'unit_algo',
    cat1: 26,
    cat2: 27,
    endTerm: 78,
    score: 76,
    marksObtained: 76,
    grade: 'A',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 1
  },
  {
    id: 'mark_015',
    studentId: 'stud_002',
    unitId: 'unit_fullstack',
    cat1: 27,
    cat2: 28,
    endTerm: 82,
    score: 80,
    marksObtained: 80,
    grade: 'A',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 2
  },

  // Kevin Wafula (stud_003) - DEEE Marks
  {
    id: 'mark_016',
    studentId: 'stud_003',
    unitId: 'unit_elec_princ',
    cat1: 22,
    cat2: 23,
    endTerm: 64,
    score: 62,
    marksObtained: 62,
    grade: 'B',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 1
  },
  {
    id: 'mark_017',
    studentId: 'stud_003',
    unitId: 'unit_dig_elec',
    cat1: 25,
    cat2: 26,
    endTerm: 74,
    score: 72,
    marksObtained: 72,
    grade: 'A-',
    verifiedByHod: true,
    approvedByExamsOfficer: true,
    academicYear: '2025/2026',
    semester: 1
  }
];

