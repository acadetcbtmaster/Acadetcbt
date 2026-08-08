export type UserRole = 'student' | 'admin';

export interface Subscription {
  isPremium: boolean;
  plan: 'Free Trial' | '14-Day Premium' | '30-Day Premium' | string;
  startDate: string | null;
  expiryDate: string | null;
  questionsAttemptedCount: number;
  freeLimit: number;
}

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  passwordHint?: string;
  password?: string;
  photoUrl?: string;
  googleUserId?: string;
  authProvider?: 'Google' | 'Email' | string;
  role: UserRole;
  universityId: string;
  universityName?: string;
  departmentId: string;
  departmentName?: string;
  subscription: Subscription;
  bookmarks: string[]; // Question IDs
  purchasedMaterialIds?: string[]; // Material IDs user paid 500 NGN for
  seenQuestionIds?: string[]; // Question IDs user has practiced
  createdDate: string;
  referralCode?: string;
  successfulReferrals?: number;
  completedReferrals?: number;
  referredBy?: string; // User ID of the referrer
  referredByCode?: string; // Referral code used at signup
  streakCount?: number;
  lastPracticeDate?: string;
  streakHistory?: string[];
  isRestricted?: boolean;
  isBanned?: boolean;
  banReason?: string;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface University {
  id: string;
  name: string;
  abbreviation: string;
  location: string;
  logoUrl?: string;
}

export interface Faculty {
  id: string;
  universityId: string;
  name: string;
}

export interface Department {
  id: string;
  facultyId: string;
  name: string;
}

export interface Course {
  id: string;
  departmentId: string;
  code: string;
  title: string;
  level?: string;
  semester: 'First' | 'Second' | 'First Semester' | 'Second Semester' | string;
  session: string;
  universityId?: string;
  universityName?: string;
  isDisabled?: boolean;
}

export interface Topic {
  id: string;
  courseId: string;
  name: string;
}

export type QuestionSource = 'Past Question' | 'Material Generated' | 'SMART Generated' | 'Smart Upload' | 'Manual Admin';
export type QuestionStatus = 'Draft' | 'Pending' | 'Under Review' | 'Publishing Queue' | 'Published' | 'Rejected';
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export type QuestionType = 'MCQ' | 'True or False' | 'Fill in the Blank' | 'Matching';

export interface QuestionVersion {
  version: number;
  editor: string;
  date: string;
  changes: string;
  snapshot: Partial<Question>;
}

export interface Question {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | string;
  explanation: string;
  universityId: string;
  facultyId?: string;
  departmentId?: string;
  courseId: string;
  courseCode?: string;
  level?: string;
  semester?: 'First' | 'Second' | 'First Semester' | 'Second Semester' | string;
  session?: string;
  topicId?: string;
  topicName?: string;
  difficulty: DifficultyLevel;
  questionType?: QuestionType;
  source: QuestionSource;
  status: QuestionStatus;
  createdDate: string;
  updatedDate: string;
  createdBy?: string;
  lastModifiedBy?: string;
  versionNumber?: number;
  versionHistory?: QuestionVersion[];
  qualityScore?: string;
  issuesDetected?: string;
  isWarning?: boolean;
  suggestedFix?: string;
  suggestedVersion?: {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation: string;
    issuesDetected?: string;
  };
  timesAnswered?: number;
  timesFailed?: number;
  averageSuccessRate?: number;
  diagramUrl?: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  universityId: string;
  universityName?: string;
  level?: string;
  semester?: string;
  courseId: string;
  courseCode?: string;
  courseTitle?: string;
  type: 'PDF' | 'DOCX' | 'PPTX' | 'Image' | 'Video Link' | 'Lecture Notes' | 'Text Document';
  accessLevel: 'Free Trial' | 'Premium Only';
  fileSize?: string;
  fileSizeBytes?: number;
  totalDownloads: number;
  uploadedBy: string;
  uploadDate: string;
  status: 'Active' | 'Archived';
  fileUrl?: string;
  videoUrl?: string;
  description?: string;
  pagesCount?: number;
  thumbnailUrl?: string;
  topic?: string;
  tags?: string[];
  extractedTextPreview?: string;
}

export const SEED_STUDY_MATERIALS: StudyMaterial[] = [
  {
    id: 'mat-101',
    title: 'GST101 English Grammar & Concord Master Summary',
    universityId: 'uni-ful',
    universityName: 'Federal University Lokoja (FUL)',
    courseId: 'crs-1',
    courseCode: 'GST101',
    courseTitle: 'Use of English & Communication',
    type: 'PDF',
    accessLevel: 'Free Trial',
    fileSize: '1.4 MB',
    fileSizeBytes: 1468006,
    totalDownloads: 1420,
    uploadedBy: 'Dr. Aaron Vance (Admin)',
    uploadDate: '2026-01-15',
    status: 'Active',
    description: 'Comprehensive study note covering subject-verb agreement, common tense errors, and concord rules for CBT exams.',
    pagesCount: 16,
  },
  {
    id: 'mat-102',
    title: 'MTH101 Fundamental Calculus & Formula Cheat Sheet',
    universityId: 'uni-ful',
    universityName: 'Federal University Lokoja (FUL)',
    courseId: 'crs-2',
    courseCode: 'MTH101',
    courseTitle: 'Elementary Mathematics I',
    type: 'PDF',
    accessLevel: 'Premium Only',
    fileSize: '2.1 MB',
    fileSizeBytes: 2202009,
    totalDownloads: 2890,
    uploadedBy: 'Prof. Mary Okafor',
    uploadDate: '2026-02-01',
    status: 'Active',
    description: 'Quick reference sheet for limits, quadratic formulas, matrix determinant rules, and trigonometric derivatives.',
    pagesCount: 12,
  },
  {
    id: 'mat-103',
    title: 'ANA201 Human Anatomy Systemic Dissection Diagram Map',
    universityId: 'uni-fuahse',
    universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)',
    courseId: 'crs-fuahse-ana',
    courseCode: 'ANA201',
    courseTitle: 'Human Anatomy & Histology',
    type: 'Image',
    accessLevel: 'Premium Only',
    fileSize: '4.8 MB',
    fileSizeBytes: 5033164,
    totalDownloads: 940,
    uploadedBy: 'Dr. Chidi Nnamani',
    uploadDate: '2026-02-10',
    status: 'Active',
    description: 'High-definition medical anatomical diagrams with labeled tissue layers and vascular pathway notes.',
    pagesCount: 1,
  },
  {
    id: 'mat-104',
    title: 'COS101 Introduction to Binary Logic & Algorithm Flowcharts Video Tutorial',
    universityId: 'uni-ful',
    universityName: 'Federal University Lokoja (FUL)',
    courseId: 'crs-4',
    courseCode: 'COS101',
    courseTitle: 'Introduction to Computer Science & Algorithms',
    type: 'Video Link',
    accessLevel: 'Free Trial',
    fileSize: 'N/A (Stream)',
    fileSizeBytes: 0,
    totalDownloads: 3100,
    uploadedBy: 'Engr. David Bello',
    uploadDate: '2026-02-18',
    status: 'Active',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: '45-minute structured video walk-through demonstrating binary logic gates, pseudocode design, and flowchart symbol standards.',
  },
  {
    id: 'mat-105',
    title: 'PHY101 Mechanics & Thermal Physics Lecture Notes',
    universityId: 'uni-1',
    universityName: 'University of Lagos',
    courseId: 'crs-3',
    courseCode: 'PHY101',
    courseTitle: 'General Physics I',
    type: 'Lecture Notes',
    accessLevel: 'Free Trial',
    fileSize: '920 KB',
    fileSizeBytes: 942080,
    totalDownloads: 1850,
    uploadedBy: 'Dr. S. A. Adeleke',
    uploadDate: '2026-03-01',
    status: 'Active',
    description: 'Typed classroom lecture slides and solved past practice examples on kinematics, friction, and thermodynamics.',
    pagesCount: 24,
  },
];

export interface TestSessionResult {
  id: string;
  type: 'practice' | 'mock_cbt';
  courseId: string;
  courseCode: string;
  courseTitle: string;
  universityName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timeSpentSeconds: number;
  timeLimitMinutes?: number;
  date: string;
  userAnswers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  markedForReview?: string[];
  questionIds: string[];
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
  popular?: boolean;
  status?: 'Active' | 'Disabled';
}

export interface PaymentTransaction {
  id: string;
  paymentId?: string;
  userId: string;
  userName: string;
  userUsername?: string;
  userEmail: string;
  studentIdCode?: string;
  universityName?: string;
  departmentName?: string;
  courseName?: string;
  reference: string;
  gateway: 'Squad' | 'Squad Payment Gateway' | 'Paystack' | 'Flutterwave' | 'Bank Transfer' | 'Free Access' | string;
  amount: number;
  planName: string;
  date: string;
  paymentDate?: string;
  expiryDate?: string;
  status: 'Successful' | 'Pending' | 'Failed' | 'Refunded';
  paymentMethod?: string;
  squadResponse?: any;
  proofUrl?: string;
  proofType?: 'JPG' | 'PNG' | 'JPEG' | 'PDF';
  handledByAdmin?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface LeaderboardStudentEntry {
  rank: number;
  previousRank: number;
  studentId: string;
  studentName: string;
  studentIdCode: string;
  photoUrl?: string;
  universityName: string;
  departmentName: string;
  courseCode: string;
  level: string;
  subscriptionStatus: 'Free Trial' | '14-Day Premium' | '30-Day Premium' | 'Expired' | string;
  totalScore: number;
  averageScore: number;
  totalAttempts: number;
  completionRate: number;
  lastCbtDate: string;
  badge: string;
  highestScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalStudyTimeMinutes: number;
  registeredDate: string;
  lastActive: string;
}

export interface RankingHistoryRecord {
  id: string;
  studentId: string;
  studentName: string;
  previousRank: number;
  newRank: number;
  dateChanged: string;
  reason: string;
  scoreUsed: number;
  category: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  userName?: string;
  title: string;
  message: string;
  type: 'payment' | 'subscription' | 'leaderboard' | 'system';
  date: string;
  read: boolean;
}

export interface AdminActivityLog {
  id: string;
  admin: string;
  action: string;
  module: string;
  details: string;
  time: string;
}

export interface SystemSettings {
  freeQuestionLimit: number;
  allowAiGeneration: boolean;
  maintenanceMode: boolean;
  paystackPublicKey: string;
  flutterwavePublicKey: string;
}

// Specific University Department Lists
export const FUL_DEPARTMENTS = [
  'Computer Science',
  'Cyber Security',
  'Software Engineering',
  'Information Technology',
  'Mathematics',
  'Statistics',
  'Physics',
  'Chemistry',
  'Biochemistry',
  'Biology',
  'Microbiology',
  'Geology',
  'Economics',
  'Accounting',
  'Business Administration',
  'Political Science',
  'Sociology',
  'English',
  'History and International Studies',
  'Library and Information Science',
  'Geography',
  'Agriculture',
  'Animal Science',
  'Crop Science',
  'Fisheries and Aquaculture',
  'Food Science and Technology',
];

export const FUAHSE_DEPARTMENTS = [
  'Medicine and Surgery',
  'Nursing Science',
  'Medical Laboratory Science',
  'Radiography',
  'Physiotherapy',
  'Human Anatomy',
  'Human Physiology',
  'Public Health',
  'Nutrition and Dietetics',
  'Dentistry',
  'Dental Therapy',
  'Dental Technology',
  'Prosthetics and Orthotics',
  'Biomedical Engineering',
  'Audiology',
  'Optometry',
  'Environmental Health Science',
  'Health Information Management',
];

export interface FacultyGroup {
  id: string;
  name: string;
  departments: string[];
}

export const DEFAULT_FACULTY_DEPARTMENTS: FacultyGroup[] = [
  {
    id: 'fac-1',
    name: '1. Faculty of Administration / Management Sciences',
    departments: [
      'Accounting / Accountancy',
      'Banking and Finance',
      'Business Administration / Management',
      'Public Administration',
      'Marketing',
      'Insurance and Actuarial Science',
      'Industrial Relations and Personnel Management (IRPM)',
      'Entrepreneurship',
      'Hospitality and Tourism Management',
    ],
  },
  {
    id: 'fac-2',
    name: '2. Faculty of Agriculture & Agricultural Sciences',
    departments: [
      'Agricultural Economics',
      'Agricultural Extension and Rural Development',
      'Animal Science / Animal Production',
      'Crop Science / Agronomy',
      'Soil Science and Land Management',
      'Fisheries and Aquaculture',
      'Forestry and Wildlife Management',
      'Food Science and Technology',
    ],
  },
  {
    id: 'fac-3',
    name: '3. Faculty of Arts & Humanities',
    departments: [
      'English Language and Literary Studies',
      'History and International Studies',
      'Linguistics and African / Foreign Languages (Igbo, Yoruba, Hausa, French, Arabic, etc.)',
      'Theatre, Film, and Performing Arts',
      'Philosophy',
      'Religious Studies (Christian Religious Studies, Islamic Studies)',
      'Music',
      'Archaeology and Heritage Studies',
      'Fine and Applied Arts',
    ],
  },
  {
    id: 'fac-4',
    name: '4. Faculty of Basic Medical / Medical Sciences',
    departments: [
      'Human Anatomy',
      'Human Physiology',
      'Medical Biochemistry',
      'Medical Laboratory Science (MLS)',
      'Nursing Science',
      'Radiography and Radiation Science',
      'Physiotherapy / Medical Rehabilitation',
    ],
  },
  {
    id: 'fac-5',
    name: '5. Faculty of Clinical Sciences / Medicine',
    departments: [
      'Medicine and Surgery (MBBS)',
      'Anesthesia',
      'Community Health / Public Health Medicine',
      'Obstetrics and Gynecology',
      'Pediatrics',
      'Surgery',
      'Internal Medicine',
      'Pathology / Hematology',
    ],
  },
  {
    id: 'fac-6',
    name: '6. Faculty of Computing & Information Technology',
    departments: [
      'Computer Science',
      'Cybersecurity',
      'Software Engineering',
      'Information Technology (IT)',
      'Data Science',
      'Information Systems',
      'Artificial Intelligence',
    ],
  },
  {
    id: 'fac-7',
    name: '7. Faculty of Dentistry',
    departments: [
      'Oral and Maxillofacial Surgery',
      'Preventive and Community Dentistry',
      'Restorative Dentistry',
      'Child Dental Health',
    ],
  },
  {
    id: 'fac-8',
    name: '8. Faculty of Education',
    departments: [
      'Educational Foundations',
      'Educational Management / Administration',
      'Guidance and Counseling',
      'Adult and Non-Formal Education',
      'Science Education (Biology, Chemistry, Physics, Mathematics Education)',
      'Arts Education (English, History, Religious Education)',
      'Social Science Education (Economics, Geography Education)',
      'Vocational and Technical Education',
      'Library and Information Science (LIS)',
      'Human Kinetics and Health Education',
    ],
  },
  {
    id: 'fac-9',
    name: '9. Faculty of Engineering & Technology',
    departments: [
      'Agricultural and Bio-resources Engineering',
      'Chemical Engineering',
      'Civil Engineering',
      'Computer Engineering',
      'Electrical and Electronics Engineering',
      'Mechanical Engineering',
      'Petroleum and Gas Engineering',
      'Mechatronics Engineering',
      'Metallurgical and Materials Engineering',
      'Marine Engineering',
      'Systems Engineering',
    ],
  },
  {
    id: 'fac-10',
    name: '10. Faculty of Environmental Sciences / Design',
    departments: [
      'Architecture',
      'Building Technology',
      'Estate Management',
      'Quantity Surveying',
      'Urban and Regional Planning (URP)',
      'Surveying and Geo-informatics',
      'Fine Arts / Industrial Design',
    ],
  },
  {
    id: 'fac-11',
    name: '11. Faculty of Law',
    departments: [
      'Jurisprudence and International Law',
      'Commercial and Industrial Law',
      'Private and Property Law',
      'Public Law',
      'Islamic Law / Sharia (in select institutions)',
    ],
  },
  {
    id: 'fac-12',
    name: '12. Faculty of Communication & Media Studies',
    departments: [
      'Mass Communication',
      'Journalism and Media Studies',
      'Public Relations and Advertising',
      'Broadcasting (Radio, TV, Film)',
      'Development Communication',
    ],
  },
  {
    id: 'fac-13',
    name: '13. Faculty of Pharmaceutical Sciences',
    departments: [
      'Clinical Pharmacy and Pharmacy Management',
      'Pharmaceutical Chemistry',
      'Pharmaceutics and Pharmaceutical Technology',
      'Pharmacognosy and Environmental Medicine',
      'Pharmacology and Toxicology',
      'Pharmaceutical Microbiology and Biotechnology',
    ],
  },
  {
    id: 'fac-14',
    name: '14. Faculty of Physical Sciences',
    departments: [
      'Pure and Applied Chemistry',
      'Physics and Astronomy',
      'Mathematics',
      'Statistics',
      'Geology / Geophysics',
      'Industrial Chemistry',
    ],
  },
  {
    id: 'fac-15',
    name: '15. Faculty of Life / Biological Sciences',
    departments: [
      'Biochemistry',
      'Microbiology',
      'Plant Science and Biotechnology (Botany)',
      'Zoology and Environmental Biology',
      'Cell Biology and Genetics',
    ],
  },
  {
    id: 'fac-16',
    name: '16. Faculty of Social Sciences',
    departments: [
      'Economics',
      'Political Science',
      'Sociology and Anthropology',
      'Psychology',
      'Geography and Environmental Management',
      "Mass Communication (in schools where it's under Social Sciences)",
      'Social Work',
      'Criminology and Security Studies',
      'Demography and Social Statistics',
    ],
  },
  {
    id: 'fac-17',
    name: '17. Faculty of Veterinary Medicine',
    departments: [
      'Veterinary Anatomy',
      'Veterinary Physiology and Pharmacology',
      'Veterinary Pathology',
      'Veterinary Microbiology and Parasitology',
      'Veterinary Medicine',
      'Veterinary Surgery and Radiology',
      'Veterinary Public Health and Preventive Medicine',
    ],
  },
];

export const COMMON_UNIVERSITY_DEPARTMENTS = [
  'Accounting',
  'Actuarial Science',
  'Agriculture & Agricultural Economics',
  'Animal Science',
  'Architecture',
  'Banking and Finance',
  'Biochemistry',
  'Biological Sciences',
  'Biomedical Engineering',
  'Building & Quantity Surveying',
  'Business Administration',
  'Chemical Engineering',
  'Chemistry',
  'Civil Engineering',
  'Computer Engineering',
  'Computer Science',
  'Crop Science',
  'Cyber Security',
  'Dentistry & Dental Technology',
  'Economics',
  'Educational Management',
  'Electrical & Electronics Engineering',
  'English & Literary Studies',
  'Environmental Health Science',
  'Estate Management',
  'Fisheries and Aquaculture',
  'Food Science and Technology',
  'General Studies (GST)',
  'Geography & Environmental Management',
  'Geology & Geophysics',
  'Health Information Management',
  'History and International Studies',
  'Human Anatomy',
  'Human Physiology',
  'Industrial Chemistry',
  'Information Technology',
  'Law (LL.B)',
  'Library and Information Science',
  'Mass Communication & Media Studies',
  'Mathematics',
  'Mechanical Engineering',
  'Mechatronics Engineering',
  'Medical Laboratory Science',
  'Medicine and Surgery (MBBS)',
  'Microbiology',
  'Mining Engineering',
  'Nursing Science',
  'Optometry',
  'Petroleum Engineering',
  'Pharmacy (Pharm D / B.Pharm)',
  'Physics & Electronics',
  'Physiotherapy',
  'Political Science & Public Administration',
  'Public Health',
  'Radiography & Radiation Science',
  'Sociology & Criminology',
  'Software Engineering',
  'Statistics',
  'Surveying and Geo-informatics',
  'Urban and Regional Planning',
];

// Initial Seed Data
export const SEED_UNIVERSITIES: University[] = [
  { id: 'uni-abdulrasaq', name: 'Abdulrasaq Abubakar Toyin University', abbreviation: 'AATU', location: 'Ganmo, Kwara State' },
  { id: 'uni-absu', name: 'Abia State University', abbreviation: 'ABSU', location: 'Uturu, Abia State' },
  { id: 'uni-atbu', name: 'Abubakar Tafawa Balewa University', abbreviation: 'ATBU', location: 'Bauchi, Bauchi State' },
  { id: 'uni-achievers', name: 'Achievers University', abbreviation: 'AU', location: 'Owo, Ondo State' },
  { id: 'uni-adamawa-state', name: 'Adamawa State University', abbreviation: 'ADSU', location: 'Mubi, Adamawa State' },
  { id: 'uni-adekunle', name: 'Adekunle Ajasin University', abbreviation: 'AAUA', location: 'Akungba-Akoko, Ondo State' },
  { id: 'uni-admiralty', name: 'Admiralty University', abbreviation: 'ADUN', location: 'Ibusa, Delta State' },
  { id: 'uni-afe-babalola', name: 'Afe Babalola University', abbreviation: 'ABUAD', location: 'Ado-Ekiti, Ekiti State' },
  { id: 'uni-african-sci', name: 'African University of Science and Technology', abbreviation: 'AUST', location: 'Abuja, FCT' },
  { id: 'uni-abu', name: 'Ahmadu Bello University', abbreviation: 'ABU', location: 'Zaria, Kaduna State' },
  { id: 'uni-afit', name: 'Air Force Institute of Technology', abbreviation: 'AFIT', location: 'Kaduna, Kaduna State' },
  { id: 'uni-ajayi', name: 'Ajayi Crowther University', abbreviation: 'ACU', location: 'Oyo, Oyo State' },
  { id: 'uni-aksu', name: 'Akwa Ibom State University', abbreviation: 'AKSU', location: 'Ikot Akpaden, Akwa Ibom State' },
  { id: 'uni-al-hikmah', name: 'Al-Hikmah University', abbreviation: 'AHU', location: 'Ilorin, Kwara State' },
  { id: 'uni-amadeus', name: 'Amadeus University', abbreviation: 'AMU', location: 'Amizi, Abia State' },
  { id: 'uni-ambrose', name: 'Ambrose Alli University', abbreviation: 'AAU', location: 'Ekpoma, Edo State' },
  { id: 'uni-anchor', name: 'Anchor University', abbreviation: 'AUL', location: 'Lagos State' },
  { id: 'uni-arthur-jarvis', name: 'Arthur Jarvis University', abbreviation: 'AJU', location: 'Akpabuyo, Cross River State' },
  { id: 'uni-augustine', name: 'Augustine University', abbreviation: 'AUI', location: 'Ilara-Epe, Lagos State' },
  { id: 'uni-ave-maria', name: 'Ave Maria University', abbreviation: 'AMU', location: 'Piyanko, Nasarawa State' },
  { id: 'uni-babcock', name: 'Babcock University', abbreviation: 'BU', location: 'Ilishan-Remo, Ogun State' },
  { id: 'uni-bauchi-state', name: 'Bauchi State University', abbreviation: 'BASUG', location: 'Gadau, Bauchi State' },
  { id: 'uni-buk', name: 'Bayero University', abbreviation: 'BUK', location: 'Kano, Kano State' },
  { id: 'uni-baze', name: 'Baze University', abbreviation: 'BUA', location: 'Abuja, FCT' },
  { id: 'uni-bells', name: 'Bells University of Technology', abbreviation: 'BUT', location: 'Ota, Ogun State' },
  { id: 'uni-benue-state', name: 'Benue State University', abbreviation: 'BSUM', location: 'Makurdi, Benue State' },
  { id: 'uni-borno-state', name: 'Borno State University', abbreviation: 'BOSU', location: 'Maiduguri, Borno State' },
  { id: 'uni-bowen', name: 'Bowen University', abbreviation: 'BU', location: 'Iwo, Osun State' },
  { id: 'uni-caleb', name: 'Caleb University', abbreviation: 'CU', location: 'Imota, Lagos State' },
  { id: 'uni-capital-city', name: 'Capital City University', abbreviation: 'CCUK', location: 'Kano State' },
  { id: 'uni-chrisland', name: 'Chrisland University', abbreviation: 'CU', location: 'Abeokuta, Ogun State' },
  { id: 'uni-christopher', name: 'Christopher University', abbreviation: 'UNICRIS', location: 'Mowe, Ogun State' },
  { id: 'uni-coou', name: 'Chukwuemeka Odumegwu Ojukwu University', abbreviation: 'COOU', location: 'Uli/Igbariam, Anambra State' },
  { id: 'uni-claretian', name: 'Claretian University of Nigeria', abbreviation: 'CUN', location: 'Nekede, Imo State' },
  { id: 'uni-coal-city', name: 'Coal City University', abbreviation: 'CCU', location: 'Enugu State' },
  { id: 'uni-custech', name: 'Confluence University of Science and Technology', abbreviation: 'CUSTECH', location: 'Osara, Kogi State' },
  { id: 'uni-covenant', name: 'Covenant University', abbreviation: 'CU', location: 'Ota, Ogun State' },
  { id: 'uni-delsu', name: 'Delta State University', abbreviation: 'DELSU', location: 'Abraka, Delta State' },
  { id: 'uni-dominican', name: 'Dominican University', abbreviation: 'DU', location: 'Ibadan, Oyo State' },
  { id: 'uni-eastern-palm', name: 'Eastern Palm University', abbreviation: 'EPU', location: 'Ogboko, Imo State' },
  { id: 'uni-ebsu', name: 'Ebonyi State University', abbreviation: 'EBSU', location: 'Abakaliki, Ebonyi State' },
  { id: 'uni-edsu', name: 'Edo State University', abbreviation: 'EDSU', location: 'Uzairue, Edo State' },
  { id: 'uni-edwin-clark', name: 'Edwin Clark University', abbreviation: 'ECU', location: 'Kiagbodo, Delta State' },
  { id: 'uni-eksu', name: 'Ekiti State University', abbreviation: 'EKSU', location: 'Ado-Ekiti, Ekiti State' },
  { id: 'uni-elizade', name: 'Elizade University', abbreviation: 'EU', location: 'Ilara-Mokin, Ondo State' },
  { id: 'uni-esut', name: 'Enugu State University of Science and Technology', abbreviation: 'ESUT', location: 'Enugu, Enugu State' },
  { id: 'uni-evangel', name: 'Evangel University', abbreviation: 'EUA', location: 'Akaeze, Ebonyi State' },
  { id: 'uni-funaab', name: 'Federal University of Agriculture, Abeokuta', abbreviation: 'FUNAAB', location: 'Abeokuta, Ogun State' },
  { id: 'uni-fuam', name: 'Federal University of Agriculture, Makurdi', abbreviation: 'FUAM', location: 'Makurdi, Benue State' },
  { id: 'uni-fuahse', name: 'Federal University of Allied Health Sciences, Enugu', abbreviation: 'FUAHSE', location: 'Enugu State' },
  { id: 'uni-fubk', name: 'Federal University Birnin Kebbi', abbreviation: 'FUBK', location: 'Birnin Kebbi, Kebbi State' },
  { id: 'uni-fud', name: 'Federal University Dutse', abbreviation: 'FUD', location: 'Dutse, Jigawa State' },
  { id: 'uni-fudma', name: 'Federal University Dutsin-Ma', abbreviation: 'FUDMA', location: 'Dutsin-Ma, Katsina State' },
  { id: 'uni-fugashua', name: 'Federal University Gashua', abbreviation: 'FUGASHUA', location: 'Gashua, Yobe State' },
  { id: 'uni-fugus', name: 'Federal University Gusau', abbreviation: 'FUGUS', location: 'Gusau, Zamfara State' },
  { id: 'uni-fukashere', name: 'Federal University Kashere', abbreviation: 'FUKASHERE', location: 'Kashere, Gombe State' },
  { id: 'uni-fulafia', name: 'Federal University Lafia', abbreviation: 'FULAFIA', location: 'Lafia, Nasarawa State' },
  { id: 'uni-ful', name: 'Federal University Lokoja', abbreviation: 'FUL', location: 'Lokoja, Kogi State' },
  { id: 'uni-futa', name: 'Federal University of Technology, Akure', abbreviation: 'FUTA', location: 'Akure, Ondo State' },
  { id: 'uni-futminna', name: 'Federal University of Technology, Minna', abbreviation: 'FUTMINNA', location: 'Minna, Niger State' },
  { id: 'uni-futo', name: 'Federal University of Technology, Owerri', abbreviation: 'FUTO', location: 'Owerri, Imo State' },
  { id: 'uni-fountain', name: 'Fountain University', abbreviation: 'FUO', location: 'Osogbo, Osun State' },
  { id: 'uni-godfrey-okoye', name: 'Godfrey Okoye University', abbreviation: 'GOUNI', location: 'Enugu State' },
  { id: 'uni-gsu', name: 'Gombe State University', abbreviation: 'GSU', location: 'Gombe, Gombe State' },
  { id: 'uni-gregory', name: 'Gregory University', abbreviation: 'GUU', location: 'Uturu, Abia State' },
  { id: 'uni-hallmark', name: 'Hallmark University', abbreviation: 'HU', location: 'Ijebu-Itele, Ogun State' },
  { id: 'uni-havilla', name: 'Havilla University', abbreviation: 'HUNI', location: 'Cross River State' },
  { id: 'uni-ibbu', name: 'Ibrahim Badamasi Babangida University', abbreviation: 'IBBU', location: 'Lapai, Niger State' },
  { id: 'uni-iaue', name: 'Ignatius Ajuru University of Education', abbreviation: 'IAUE', location: 'Port Harcourt, Rivers State' },
  { id: 'uni-isa-mustapha', name: 'Isa Mustapha Agwai I Polytechnic University', abbreviation: 'IMAP', location: 'Nasarawa State' },
  { id: 'uni-jabu', name: 'Joseph Ayo Babalola University', abbreviation: 'JABU', location: 'Ikeji-Arakeji, Osun State' },
  { id: 'uni-kasu', name: 'Kaduna State University', abbreviation: 'KASU', location: 'Kaduna, Kaduna State' },
  { id: 'uni-ksusta', name: 'Kebbi State University of Science and Technology', abbreviation: 'KSUSTA', location: 'Aliero, Kebbi State' },
  { id: 'uni-kings', name: 'Kings University', abbreviation: 'KU', location: 'Ode Omu, Osun State' },
  { id: 'uni-ksu', name: 'Kogi State University', abbreviation: 'KSU', location: 'Anyigba, Kogi State' },
  { id: 'uni-lautech', name: 'Ladoke Akintola University of Technology', abbreviation: 'LAUTECH', location: 'Ogbomoso, Oyo State' },
  { id: 'uni-lasu', name: 'Lagos State University', abbreviation: 'LASU', location: 'Ojo, Lagos State' },
  { id: 'uni-landmark', name: 'Landmark University', abbreviation: 'LMU', location: 'Omu-Aran, Kwara State' },
  { id: 'uni-lead-city', name: 'Lead City University', abbreviation: 'LCU', location: 'Ibadan, Oyo State' },
  { id: 'uni-lux-mundi', name: 'Lux Mundi University', abbreviation: 'LMU', location: 'Umuahia, Abia State' },
  { id: 'uni-madonna', name: 'Madonna University', abbreviation: 'MU', location: 'Okija, Anambra State' },
  { id: 'uni-maria-montessori', name: 'Maria Montessori University', abbreviation: 'MMU', location: 'Abuja, FCT' },
  { id: 'uni-mcpherson', name: 'McPherson University', abbreviation: 'MCU', location: 'Ogun State' },
  { id: 'uni-mewar', name: 'Mewar International University', abbreviation: 'MIUN', location: 'Masaka, Nasarawa State' },
  { id: 'uni-ibru', name: 'Michael and Cecilia Ibru University', abbreviation: 'MCIU', location: 'Agbara-Otor, Delta State' },
  { id: 'uni-mouau', name: 'Michael Okpara University of Agriculture', abbreviation: 'MOUAU', location: 'Umudike, Abia State' },
  { id: 'uni-minaret', name: 'Minaret University', abbreviation: 'MU', location: 'Osun State' },
  { id: 'uni-mtu', name: 'Mountain Top University', abbreviation: 'MTU', location: 'Makogi Oba, Ogun State' },
  { id: 'uni-nsuk', name: 'Nasarawa State University', abbreviation: 'NSUK', location: 'Keffi, Nasarawa State' },
  { id: 'uni-noun', name: 'National Open University of Nigeria', abbreviation: 'NOUN', location: 'Abuja (Headquarters)' },
  { id: 'uni-ndu', name: 'Niger Delta University', abbreviation: 'NDU', location: 'Wilberforce Island, Bayelsa State' },
  { id: 'uni-naub', name: 'Nigerian Army University Biu', abbreviation: 'NAUB', location: 'Biu, Borno State' },
  { id: 'uni-nda', name: 'Nigerian Defence Academy', abbreviation: 'NDA', location: 'Kaduna, Kaduna State' },
  { id: 'uni-nmu', name: 'Nigeria Maritime University', abbreviation: 'NMU', location: 'Okerenkoko, Delta State' },
  { id: 'uni-nile', name: 'Nile University of Nigeria', abbreviation: 'NUN', location: 'Abuja, FCT' },
  { id: 'uni-unizik', name: 'Nnamdi Azikiwe University', abbreviation: 'UNIZIK', location: 'Awka, Anambra State' },
  { id: 'uni-novena', name: 'Novena University', abbreviation: 'NU', location: 'Ogume, Delta State' },
  { id: 'uni-oau', name: 'Obafemi Awolowo University', abbreviation: 'OAU', location: 'Ile-Ife, Osun State' },
  { id: 'uni-obong', name: 'Obong University', abbreviation: 'OU', location: 'Obong Ntak, Akwa Ibom State' },
  { id: 'uni-oduduwa', name: 'Oduduwa University', abbreviation: 'OUI', location: 'Ipetumodu, Osun State' },
  { id: 'uni-oou', name: 'Olabisi Onabanjo University', abbreviation: 'OOU', location: 'Ago-Iwoye, Ogun State' },
  { id: 'uni-oaustech', name: 'Olusegun Agagu University of Science and Technology', abbreviation: 'OAUSTECH', location: 'Okitipupa, Ondo State' },
  { id: 'uni-osustech', name: 'Ondo State University of Science and Technology', abbreviation: 'OSUSTECH', location: 'Okitipupa, Ondo State' },
  { id: 'uni-uniosun', name: 'Osun State University', abbreviation: 'UNIOSUN', location: 'Osogbo, Osun State' },
  { id: 'uni-pau', name: 'Pan-Atlantic University', abbreviation: 'PAU', location: 'Lagos State' },
  { id: 'uni-paul', name: 'Paul University', abbreviation: 'PU', location: 'Awka, Anambra State' },
  { id: 'uni-plasu', name: 'Plateau State University', abbreviation: 'PLASU', location: 'Bokkos, Plateau State' },
  { id: 'uni-redeemers', name: 'Redeemer\'s University', abbreviation: 'RUN', location: 'Ede, Osun State' },
  { id: 'uni-renaissance', name: 'Renaissance University', abbreviation: 'RNU', location: 'Ugbawka, Enugu State' },
  { id: 'uni-rhema', name: 'Rhema University', abbreviation: 'RU', location: 'Aba, Abia State' },
  { id: 'uni-rsu', name: 'Rivers State University', abbreviation: 'RSU', location: 'Port Harcourt, Rivers State' },
  { id: 'uni-salem', name: 'Salem University', abbreviation: 'SU', location: 'Lokoja, Kogi State' },
  { id: 'uni-samuel-adegboyega', name: 'Samuel Adegboyega University', abbreviation: 'SAU', location: 'Ogwa, Edo State' },
  { id: 'uni-skyline', name: 'Skyline University Nigeria', abbreviation: 'SUN', location: 'Kano State' },
  { id: 'uni-ssu', name: 'Sokoto State University', abbreviation: 'SSU', location: 'Sokoto, Sokoto State' },
  { id: 'uni-southwestern', name: 'Southwestern University Nigeria', abbreviation: 'SUN', location: 'Okun Owa, Ogun State' },
  { id: 'uni-spiritan', name: 'Spiritan University', abbreviation: 'SUN', location: 'Nneochi, Abia State' },
  { id: 'uni-slu', name: 'Sule Lamido University', abbreviation: 'SLU', location: 'Kafin Hausa, Jigawa State' },
  { id: 'uni-summit', name: 'Summit University', abbreviation: 'SUN', location: 'Offa, Kwara State' },
  { id: 'uni-tasued', name: 'Tai Solarin University of Education', abbreviation: 'TASUED', location: 'Ijagun, Ogun State' },
  { id: 'uni-tsu', name: 'Taraba State University', abbreviation: 'TSU', location: 'Jalingo, Taraba State' },
  { id: 'uni-tech-u', name: 'Technical University, Ibadan', abbreviation: 'Tech-U', location: 'Ibadan, Oyo State' },
  { id: 'uni-thomas-adewumi', name: 'Thomas Adewumi University', abbreviation: 'TAU', location: 'Oko-Irese, Kwara State' },
  { id: 'uni-trinity', name: 'Trinity University', abbreviation: 'TU', location: 'Yaba, Lagos State' },
  { id: 'uni-umyu', name: 'Umaru Musa Yar\'adua University', abbreviation: 'UMYU', location: 'Katsina, Katsina State' },
  { id: 'uni-uniabuja', name: 'University of Abuja', abbreviation: 'UNIABUJA', location: 'Abuja, FCT' },
  { id: 'uni-uniben', name: 'University of Benin', abbreviation: 'UNIBEN', location: 'Benin City, Edo State' },
  { id: 'uni-unical', name: 'University of Calabar', abbreviation: 'UNICAL', location: 'Calabar, Cross River State' },
  { id: 'uni-unicross', name: 'University of Cross River State', abbreviation: 'UNICROSS', location: 'Calabar, Cross River State' },
  { id: 'uni-fortune', name: 'University of Fortune', abbreviation: 'UF', location: 'Ondo State' },
  { id: 'uni-2', name: 'University of Ibadan', abbreviation: 'UI', location: 'Ibadan, Oyo State' },
  { id: 'uni-unilorin', name: 'University of Ilorin', abbreviation: 'UNILORIN', location: 'Ilorin, Kwara State' },
  { id: 'uni-unijos', name: 'University of Jos', abbreviation: 'UNIJOS', location: 'Jos, Plateau State' },
  { id: 'uni-1', name: 'University of Lagos', abbreviation: 'UNILAG', location: 'Lagos State' },
  { id: 'uni-unimaid', name: 'University of Maiduguri', abbreviation: 'UNIMAID', location: 'Maiduguri, Borno State' },
  { id: 'uni-unn', name: 'University of Nigeria', abbreviation: 'UNN', location: 'Nsukka, Enugu State' },
  { id: 'uni-on-the-niger', name: 'University on the Niger', abbreviation: 'UNN', location: 'Umunya, Anambra State' },
  { id: 'uni-uniport', name: 'University of Port Harcourt', abbreviation: 'UNIPORT', location: 'Port Harcourt, Rivers State' },
  { id: 'uni-uniuyo', name: 'University of Uyo', abbreviation: 'UNIUYO', location: 'Uyo, Akwa Ibom State' },
  { id: 'uni-udus', name: 'Usmanu Danfodiyo University', abbreviation: 'UDUS', location: 'Sokoto, Sokoto State' },
  { id: 'uni-veritas', name: 'Veritas University', abbreviation: 'VUNA', location: 'Abuja, FCT' },
  { id: 'uni-wellspring', name: 'Wellspring University', abbreviation: 'WU', location: 'Benin City, Edo State' },
  { id: 'uni-wesley', name: 'Wesley University', abbreviation: 'WUMO', location: 'Ondo, Ondo State' },
  { id: 'uni-western-delta', name: 'Western Delta University', abbreviation: 'WDU', location: 'Oghara, Delta State' },
  { id: 'uni-yakubu-gowon', name: 'Yakubu Gowon University', abbreviation: 'YGU', location: 'Abuja, FCT' },
  { id: 'uni-ysu', name: 'Yobe State University', abbreviation: 'YSU', location: 'Damaturu, Yobe State' },
  { id: 'uni-yumsuk', name: 'Yusuf Maitama Sule University', abbreviation: 'YUMSUK', location: 'Kano, Kano State' },
  { id: 'uni-zamsut', name: 'Zamfara State University', abbreviation: 'ZAMSUT', location: 'Talata Mafara, Zamfara State' },
];

export const SEED_FACULTIES: Faculty[] = [
  { id: 'fac-fuahse-1', universityId: 'uni-fuahse', name: 'Faculty of Allied Health Sciences' },
  { id: 'fac-ful-1', universityId: 'uni-ful', name: 'Faculty of Science & Computing' },
  { id: 'fac-1', universityId: 'uni-1', name: 'Faculty of Science' },
];

export const SEED_DEPARTMENTS: Department[] = [
  ...FUAHSE_DEPARTMENTS.map((dept, idx) => ({
    id: `dept-fuahse-${idx + 1}`,
    facultyId: 'fac-fuahse-1',
    name: dept,
  })),
  ...FUL_DEPARTMENTS.map((dept, idx) => ({
    id: `dept-ful-${idx + 1}`,
    facultyId: 'fac-ful-1',
    name: dept,
  })),
  { id: 'dept-1', facultyId: 'fac-1', name: 'Computer Science' },
];

export const SEED_COURSES: Course[] = [
  // Federal University of Allied Health Sciences, Enugu (FUAHSE)
  { id: 'crs-fuahse-1', departmentId: 'dept-fuahse-1', code: 'MED101', title: 'Medicine & Surgery Foundations', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-2', departmentId: 'dept-fuahse-2', code: 'NUR101', title: 'Nursing Science & Clinical Care', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-3', departmentId: 'dept-fuahse-3', code: 'RAD101', title: 'Radiography & Diagnostic Imaging', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-4', departmentId: 'dept-fuahse-4', code: 'PHT101', title: 'Physiotherapy & Kinesiology', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-5', departmentId: 'dept-fuahse-5', code: 'MLS101', title: 'Medical Laboratory Science & Hematology', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-6', departmentId: 'dept-fuahse-6', code: 'ANA101', title: 'Human Anatomy & Histology', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-7', departmentId: 'dept-fuahse-7', code: 'PIO101', title: 'Human Physiology & Biophysics', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-8', departmentId: 'dept-fuahse-8', code: 'NUT101', title: 'Nutrition & Clinical Dietetics', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-9', departmentId: 'dept-fuahse-9', code: 'PBH101', title: 'Public Health & Epidemiology', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-10', departmentId: 'dept-fuahse-10', code: 'HIM101', title: 'Health Information Management', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-11', departmentId: 'dept-fuahse-11', code: 'BME101', title: 'Biomedical Engineering Systems', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-12', departmentId: 'dept-fuahse-6', code: 'ANA201', title: 'Advanced Human Gross Anatomy', level: '200 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },
  { id: 'crs-fuahse-13', departmentId: 'dept-fuahse-7', code: 'PHS201', title: 'Organ System Physiology II', level: '200 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-fuahse', universityName: 'Federal University of Allied Health Sciences, Enugu (FUAHSE)' },

  // Federal University Lokoja (FUL)
  { id: 'crs-1', departmentId: 'dept-ful-1', code: 'GST101', title: 'Use of English & Communication', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-2', departmentId: 'dept-ful-2', code: 'MTH101', title: 'Elementary Mathematics I (Calculus & Algebra)', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-3', departmentId: 'dept-ful-3', code: 'PHY101', title: 'General Physics I (Mechanics & Thermal)', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-4', departmentId: 'dept-ful-4', code: 'COS101', title: 'Introduction to Computer Science & Algorithms', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-ful-5', departmentId: 'dept-ful-5', code: 'CHM101', title: 'General Chemistry I (Physical & Inorganic)', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-ful-6', departmentId: 'dept-ful-6', code: 'HIS101', title: 'History & Diplomatic Studies', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-ful-7', departmentId: 'dept-ful-7', code: 'ECO101', title: 'Principles of Economics I', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-ful-8', departmentId: 'dept-ful-8', code: 'SOC101', title: 'Introduction to Sociology', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },
  { id: 'crs-ful-9', departmentId: 'dept-ful-4', code: 'CSC201', title: 'Data Structures & C++ Programming', level: '200 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-ful', universityName: 'Federal University Lokoja (FUL)' },

  // University of Lagos (UNILAG) & University of Ibadan (UI)
  { id: 'crs-unilag-1', departmentId: 'dept-1', code: 'CSC111', title: 'Introduction to Programming & Logic', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-1', universityName: 'University of Lagos (UNILAG)' },
  { id: 'crs-ui-1', departmentId: 'dept-1', code: 'GES101', title: 'Use of English (UI General Studies)', level: '100 Level', semester: 'First Semester', session: '2023/2024', universityId: 'uni-2', universityName: 'University of Ibadan (UI)' },
];

export const SEED_TOPICS: Topic[] = [
  { id: 'top-1', courseId: 'crs-1', name: 'Lexis & Structure' },
  { id: 'top-2', courseId: 'crs-1', name: 'Reading Comprehension & Concord' },
  { id: 'top-3', courseId: 'crs-2', name: 'Quadratic Equations & Polynomials' },
  { id: 'top-4', courseId: 'crs-2', name: 'Limits & Differentiation' },
  { id: 'top-5', courseId: 'crs-3', name: 'Vectors & Kinematics' },
  { id: 'top-6', courseId: 'crs-3', name: 'Newton Laws of Motion' },
  { id: 'top-7', courseId: 'crs-4', name: 'Binary Logic & Number Systems' },
  { id: 'top-8', courseId: 'crs-4', name: 'Algorithm Flowcharts & Pseudocode' },
];

export const SEED_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    question: 'Choose the option that best completes the sentence: "Neither the lecturer nor the students _____ present at the auditorium yesterday."',
    optionA: 'was',
    optionB: 'were',
    optionC: 'are',
    optionD: 'have been',
    correctAnswer: 'B',
    explanation: 'According to the rule of proximity in subject-verb agreement with "neither... nor", the verb agrees with the subject closer to it. Here, "the students" is plural, so the plural past verb "were" is required.',
    universityId: 'uni-1',
    facultyId: 'fac-3',
    departmentId: 'dept-4',
    courseId: 'crs-1',
    level: '100 Level',
    semester: 'First Semester',
    session: '2023/2024',
    topicId: 'top-2',
    topicName: 'Reading Comprehension & Concord',
    difficulty: 'Medium',
    source: 'Past Question',
    status: 'Published',
    createdDate: '2025-01-10',
    updatedDate: '2025-01-10',
  },
  {
    id: 'q-2',
    question: 'Solve for x in the quadratic equation: 2x² - 5x + 2 = 0.',
    optionA: 'x = 1/2 or x = 2',
    optionB: 'x = -1/2 or x = -2',
    optionC: 'x = 1 or x = 4',
    optionD: 'x = 2 or x = 3',
    correctAnswer: 'A',
    explanation: 'Factoring 2x² - 5x + 2 = 0 gives (2x - 1)(x - 2) = 0. Therefore 2x - 1 = 0 => x = 1/2, or x - 2 = 0 => x = 2.',
    universityId: 'uni-1',
    facultyId: 'fac-1',
    departmentId: 'dept-2',
    courseId: 'crs-2',
    semester: 'First',
    session: '2023/2024',
    topicId: 'top-3',
    topicName: 'Quadratic Equations & Polynomials',
    difficulty: 'Easy',
    source: 'Past Question',
    status: 'Published',
    createdDate: '2025-01-11',
    updatedDate: '2025-01-11',
  },
  {
    id: 'q-3',
    question: 'A car accelerates uniformly from rest to a velocity of 20 m/s in 5 seconds. What is its acceleration?',
    optionA: '2 m/s²',
    optionB: '4 m/s²',
    optionC: '5 m/s²',
    optionD: '100 m/s²',
    correctAnswer: 'B',
    explanation: 'Using the kinematic formula v = u + at, where initial velocity u = 0, final velocity v = 20 m/s, time t = 5 s: a = (v - u) / t = 20 / 5 = 4 m/s².',
    universityId: 'uni-1',
    facultyId: 'fac-1',
    departmentId: 'dept-3',
    courseId: 'crs-3',
    semester: 'First',
    session: '2023/2024',
    topicId: 'top-5',
    topicName: 'Vectors & Kinematics',
    difficulty: 'Easy',
    source: 'Past Question',
    status: 'Published',
    createdDate: '2025-01-12',
    updatedDate: '2025-01-12',
  },
  {
    id: 'q-4',
    question: 'What is the binary equivalent of the decimal number 25?',
    optionA: '11001₂',
    optionB: '10101₂',
    optionC: '11100₂',
    optionD: '10011₂',
    correctAnswer: 'A',
    explanation: '25 in binary: 25 = 16 + 8 + 1 = (1 * 2⁴) + (1 * 2³) + (0 * 2²) + (0 * 2¹) + (1 * 2⁰) = 11001₂.',
    universityId: 'uni-1',
    facultyId: 'fac-1',
    departmentId: 'dept-1',
    courseId: 'crs-4',
    semester: 'First',
    session: '2023/2024',
    topicId: 'top-7',
    topicName: 'Binary Logic & Number Systems',
    difficulty: 'Medium',
    source: 'Material Generated',
    status: 'Published',
    createdDate: '2025-01-15',
    updatedDate: '2025-01-15',
  },
  {
    id: 'q-5',
    question: 'Find the derivative of f(x) = 3x⁴ - 5x² + 7 with respect to x.',
    optionA: '12x³ - 10x',
    optionB: '12x² - 10',
    optionC: '7x³ - 5x',
    optionD: '3x³ - 5x + 7',
    correctAnswer: 'A',
    explanation: 'By the power rule d/dx[xⁿ] = n·xⁿ⁻¹: f\'(x) = 3(4x³) - 5(2x) + 0 = 12x³ - 10x.',
    universityId: 'uni-1',
    facultyId: 'fac-1',
    departmentId: 'dept-2',
    courseId: 'crs-2',
    semester: 'First',
    session: '2023/2024',
    topicId: 'top-4',
    topicName: 'Limits & Differentiation',
    difficulty: 'Hard',
    source: 'Past Question',
    status: 'Published',
    createdDate: '2025-01-16',
    updatedDate: '2025-01-16',
  },
  {
    id: 'q-6',
    question: 'Which component of a computer system CPU is responsible for performing arithmetic operations and logic comparisons?',
    optionA: 'Control Unit (CU)',
    optionB: 'Arithmetic Logic Unit (ALU)',
    optionC: 'Cache Memory',
    optionD: 'RAM',
    correctAnswer: 'B',
    explanation: 'The ALU (Arithmetic Logic Unit) executes all basic arithmetic (+, -, *, /) and decision-making logic gates operations inside the central processor.',
    universityId: 'uni-1',
    facultyId: 'fac-1',
    departmentId: 'dept-1',
    courseId: 'crs-4',
    semester: 'First',
    session: '2023/2024',
    topicId: 'top-7',
    topicName: 'Binary Logic & Number Systems',
    difficulty: 'Easy',
    source: 'Material Generated',
    status: 'Published',
    createdDate: '2025-01-18',
    updatedDate: '2025-01-18',
  },
];

export const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-free',
    name: 'Free Trial',
    price: 0,
    currency: 'NGN',
    durationDays: 0,
    features: [
      '30 Free CBT practice questions',
      'Instant SMART scoring & explanations',
      'Department & Course selection',
      'No credit card required',
    ],
  },
  {
    id: 'plan-14d',
    name: '14-Day Premium',
    price: 800,
    currency: 'NGN',
    durationDays: 14,
    features: [
      'Unlimited practice questions',
      'Unlimited CBT simulations',
      'Extracted study questions',
      'Detailed explanations',
      'Performance analytics',
      'Unlimited bookmarks',
    ],
  },
  {
    id: 'plan-30d',
    name: '30-Day Premium',
    price: 1500,
    currency: 'NGN',
    durationDays: 30,
    popular: true,
    features: [
      'Includes ALL 14-Day Premium features',
      'Full 30-Day uninterrupted access',
      'Priority material question generation',
      'Downloadable CBT performance reports',
      '24/7 Academic support access',
    ],
  },
];

export type NotificationType =
  | 'Announcement'
  | 'Information'
  | 'Reminder'
  | 'Warning'
  | 'Maintenance'
  | 'Subscription'
  | 'Payment'
  | 'CBT Updates'
  | 'System Updates'
  | 'Emergency';

export type RecipientGroup =
  | 'All Students'
  | 'All Premium Students'
  | 'All Free Trial Students'
  | 'Students of a Selected University'
  | 'Students of a Selected Course'
  | 'Students of a Selected Level'
  | 'Individual Student(s)'
  | 'Suspended Students'
  | 'Administrators';

export type NotificationDeliveryStatus = 'Sent' | 'Scheduled' | 'Draft' | 'Delivered' | 'Failed';
export type NotificationPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface NotificationAttachment {
  name: string;
  type: 'PDF' | 'Image' | 'Video Link' | 'Study Material' | 'External Link';
  url: string;
  fileSize?: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  recipientGroup: RecipientGroup;
  universityId?: string;
  universityName?: string;
  courseId?: string;
  courseCode?: string;
  targetStudentIds?: string[];
  priority: NotificationPriority;
  status: NotificationDeliveryStatus;
  totalRecipients: number;
  totalDelivered: number;
  totalRead: number;
  failedCount: number;
  failedDevices?: number;
  createdDate: string;
  scheduledDate?: string;
  sentDate?: string;
  sentBy: string;
  attachments?: NotificationAttachment[];
  openedCount?: number;
  isSystemGenerated?: boolean;
}

export type ReportCategory =
  | 'Student Reports'
  | 'CBT Reports'
  | 'Question Reports'
  | 'University Reports'
  | 'Course Reports'
  | 'Revenue Reports'
  | 'Subscription Reports'
  | 'System Reports';

export type ReportFormat = 'PDF' | 'Excel' | 'CSV';

export interface ReportRecord {
  id: string;
  title: string;
  category: ReportCategory;
  universityId?: string;
  universityName?: string;
  courseId?: string;
  courseCode?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  generatedBy: string;
  generatedDate: string;
  status: 'Completed' | 'Generating' | 'Failed' | 'Scheduled';
  format: ReportFormat;
  totalRecords: number;
  summaryText: string;
  keyInsights: string[];
  scheduleFrequency?: 'Daily' | 'Weekly' | 'Monthly' | 'Annual' | 'None';
  dataPayload?: any;
}

// Full Activity Logs Data Model
export type ActivityLogCategory =
  | 'Student Activity'
  | 'Administrator Activity'
  | 'Payment Activity'
  | 'Question Activity'
  | 'System Activity'
  | 'Security Alert';

export type ActivityLogStatus = 'Success' | 'Failed' | 'Warning';
export type ActivityLogUserRole = 'Student' | 'Administrator' | 'System';

export interface FullActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: ActivityLogUserRole;
  userEmail?: string;
  category: ActivityLogCategory;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  device?: string;
  browser?: string;
  operatingSystem?: string;
  status: ActivityLogStatus;
  isArchived?: boolean;
  isSecurityAlert?: boolean;
  metadata?: Record<string, any>;
}

export interface ActiveUserSession {
  sessionId: string;
  userId: string;
  userName: string;
  userRole: ActivityLogUserRole;
  email: string;
  ipAddress: string;
  device: string;
  browser: string;
  operatingSystem: string;
  loginTime: string;
  lastActivityTime: string;
  status: 'Active' | 'Idle' | 'Terminated';
  location?: string;
}

// Support Tickets & Feedback Data Model
export type SupportTicketCategory =
  | 'Account & Login'
  | 'Payment & Subscription'
  | 'CBT & Examination'
  | 'Question Error / Report'
  | 'Technical / App Bug'
  | 'Feature Request'
  | 'General Inquiry';

export type SupportTicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type SupportTicketStatus = 'Open' | 'In Progress' | 'Pending Student' | 'Resolved' | 'Closed';

export interface TicketAttachment {
  name: string;
  url: string;
  size?: string;
  type?: string;
}

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'Student' | 'Administrator' | 'Support Agent' | 'System';
  messageText: string;
  timestamp: string;
  isInternalNote?: boolean;
  attachments?: TicketAttachment[];
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  universityName?: string;
  departmentName?: string;
  courseCode?: string;
  questionId?: string;
  title: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  assignedAdmin?: string;
  createdDate: string;
  lastUpdated: string;
  description: string;
  messages: TicketMessage[];
  attachments?: TicketAttachment[];
  deviceInfo?: string;
  browser?: string;
  operatingSystem?: string;
  isBugReport?: boolean;
  isQuestionReport?: boolean;
  satisfactionRating?: number;
  feedbackComments?: string;
}

// ==========================================
// Backup & Restore Module Types
// ==========================================

export type BackupType = 'Automatic' | 'Manual';
export type BackupStatus = 'Success' | 'In Progress' | 'Failed' | 'Restored';
export type VerificationStatus = 'Verified' | 'Unverified' | 'Corrupted' | 'Pending';

export interface BackupRecord {
  id: string;
  name: string;
  type: BackupType;
  size: string; // e.g. "24.5 MB"
  sizeBytes: number;
  createdDate: string;
  createdBy: string;
  status: BackupStatus;
  location: string; // e.g. "Cloud Firestore Bucket (eu-west2)"
  verificationStatus: VerificationStatus;
  durationSeconds: number;
  scope: string[]; // ['Complete System Backup'] or specific entities
  healthScore: number;
  dataPayload?: Record<string, any>;
  notes?: string;
}

export interface AutoBackupConfig {
  enabled: boolean;
  schedule: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly';
  backupTime: string; // e.g. "02:00 AM"
  retentionCount: number;
  selectedScopes: string[];
}

export interface RestoreLog {
  id: string;
  backupId: string;
  backupName: string;
  restoredBy: string;
  timestamp: string;
  status: 'Completed' | 'In Progress' | 'Failed';
  details: string;
  scopeRestored: string[];
}

// ==========================================
// Settings & System Configuration Module Types
// ==========================================

export interface SystemGeneralSettings {
  platformName: string;
  logoUrl: string;
  faviconUrl: string;
  description: string;
  contactEmail: string;
  supportPhone: string;
  officialWebsite: string;
  copyrightText: string;
  defaultLanguage: string;
  defaultTimeZone: string;
  dateTimeFormat: string;
}

export interface AuthenticationSettings {
  emailAuthEnabled: boolean;
  googleSignInEnabled: boolean;
  minPasswordLength: number;
  requirePasswordNumber: boolean;
  requirePasswordSpecialChar: boolean;
  sessionTimeoutMinutes: number;
  loginAttemptLimit: number;
  lockoutDurationMinutes: number;
  rememberMeOption: boolean;
  twoFactorEnabled: boolean;
}

export interface StudentRegistrationSettings {
  registrationEnabled: boolean;
  requireEmailVerification: boolean;
  requirePhoneVerification: boolean;
  defaultFreeTrialDurationDays: number;
  maxFreeTrialAttempts: number;
  defaultStudentStatus: 'Active' | 'Pending Approval';
  autoAssignStudentId: boolean;
}

export interface CbtExamSettings {
  defaultCbtTimeMinutes: number;
  passingScorePercentage: number;
  randomizeQuestions: boolean;
  randomizeAnswerOptions: boolean;
  showResultImmediately: boolean;
  hideCorrectAnswersUntilCompletion: boolean;
  allowQuestionReview: boolean;
  autoSubmitWhenTimeEnds: boolean;
  maxCbtAttempts: number;
  negativeMarkingEnabled: boolean;
  negativeMarkingDeductionPct: number;
}

export interface SubscriptionSettingsConfig {
  freeTrialQuestionLimit: number;
  enableUnlimitedQuestions: boolean;
  allowUnlimitedForPremiumOnly: boolean;
  warningThreshold: number;
  freeTrialEnabled: boolean;
  premiumQuestionAccess: string;
  subscriptionDurationDays: number;
  subscriptionPriceNGN: number;
  subscriptionBenefits: string[];
  trialExpirationMessage: string;
  upgradePageTitle: string;
  upgradePageContent: string;
  paymentActivationEnabled: boolean;
  gracePeriodDays: number;
  autoExpirationEnabled: boolean;
  renewalReminderDays: number;
}

export interface NotificationSettingsConfig {
  pushNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
  maintenanceAlertsEnabled: boolean;
  paymentNotificationsEnabled: boolean;
  cbtRemindersEnabled: boolean;
  subscriptionExpiryRemindersEnabled: boolean;
}

export interface SystemSecuritySettings {
  passwordPolicyStrictness: 'Basic' | 'Moderate' | 'Strict' | 'Enterprise';
  sessionExpirationMinutes: number;
  deviceLoginLimit: number;
  ipRestrictionsEnabled: boolean;
  allowedIps: string[];
  auditLoggingEnabled: boolean;
  securityAlertsEnabled: boolean;
}

export interface MaintenanceModeConfig {
  enabled: boolean;
  message: string;
  startTime: string;
  endTime: string;
  allowAdminsThrough: boolean;
}

export interface SystemIntegrationStatus {
  id: string;
  name: string;
  serviceKey: string;
  status: 'Connected' | 'Disconnected' | 'Error';
  lastTested: string;
  details: string;
}

export interface AdminRolePermission {
  roleId: string;
  roleName: string;
  description: string;
  userCount: number;
  permissions: string[];
  isCustom?: boolean;
}

export interface SystemHealthMetrics {
  cpuUsagePct: number;
  memoryUsagePct: number;
  dbPerformanceMs: number;
  storageUsageMb: number;
  activeUsersCount: number;
  networkStatus: 'Optimal' | 'Degraded' | 'Offline';
  errorRatePct: number;
  responseTimeMs: number;
  lastUpdated: string;
}

export interface SystemSettingsPayload {
  general: SystemGeneralSettings;
  auth: AuthenticationSettings;
  registration: StudentRegistrationSettings;
  cbt: CbtExamSettings;
  subscription: SubscriptionSettingsConfig;
  notifications: NotificationSettingsConfig;
  security: SystemSecuritySettings;
  maintenance: MaintenanceModeConfig;
  integrations: SystemIntegrationStatus[];
  roles: AdminRolePermission[];
}

export interface ReferralLeaderboardConfig {
  enabled: boolean;
  showOnHomepage: boolean;
  showOnDashboard: boolean;
  updatedAt?: string;
}

// Learning Community Models
export interface TopicRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  universityId: string;
  universityName: string;
  level: string;
  semester: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  topicTitle: string;
  challengeDescription: string;
  status: 'Pending' | 'In Review' | 'Tutorial Planned' | 'Completed';
  createdAt: string;
  requestCount?: number;
}

export interface TopicCollectionConfig {
  isOpen: boolean;
  closedMessage: string;
  updatedAt: string;
  updatedBy: string;
}

export interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  universityId: string;
  universityName: string;
  level: string;
  semester: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  topic: string;
  durationMinutes: number;
  keyLearningPoints: string[];
  viewsCount: number;
  likesCount?: number;
  likedBy?: string[];
  savedBy?: string[];
  isFeatured: boolean;
  createdAt: string;
  createdByName: string;
}

export interface CommunityDiscussionPost {
  id: string;
  authorId: string;
  authorName: string;
  authorUniversity: string;
  authorLevel: string;
  courseCode: string;
  courseTitle: string;
  topic: string;
  title: string;
  content: string;
  upvotes: number;
  upvotedBy: string[];
  repliesCount: number;
  isReported: boolean;
  reportReason?: string;
  reportedBy?: string;
  createdAt: string;
  status: 'Active' | 'Hidden' | 'Reviewed';
}

export interface CommunityReply {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: 'student' | 'admin';
  content: string;
  createdAt: string;
}

export interface LearningResourceItem {
  id: string;
  title: string;
  description: string;
  resourceType: 'PDF Summary' | 'Formula Sheet' | 'Revision Outline' | 'Diagram' | 'Past Q&A Note';
  fileUrl: string;
  fileSize: string;
  universityName: string;
  courseCode: string;
  level: string;
  createdAt: string;
}

export interface CommunityAnnouncement {
  id: string;
  title: string;
  content: string;
  category: 'New Tutorial' | 'Academic Update' | 'CBT Notice' | 'Weekly Tip';
  authorName: string;
  youtubeLink?: string;
  createdAt: string;
  isPinned: boolean;
}

// ==========================================
// MENCORE AI ASSISTANT SPECIFICATION (POWERED BY MENMEX)
// ==========================================

export interface MenCorePermissions {
  websiteFeatures: boolean;
  platformNavigation: boolean;
  premiumPlans: boolean;
  payments: boolean;
  notifications: boolean;
  accountRecovery: boolean;
  studyMaterials: boolean;
  community: boolean;
  analytics: boolean;
  academicQuestions: boolean;
  courseQuestions: boolean;
  universityQuestions: boolean;
  cbtQuestions: boolean;
  generalAI: boolean;
}

export interface MenCoreNavigationTarget {
  label: string; // e.g. "Open Subscription Page"
  view: string;  // e.g. "dashboard", "study-materials", "community", "leaderboard", "practice"
  tab?: string;  // e.g. "subscription", "profile"
}

export interface MenCoreKnowledgeItem {
  id: string;
  title: string;
  category: 'CBT & Practice' | 'Subscriptions & Payments' | 'Account & Profile' | 'Platform Features' | 'Study Tools & Community' | 'General';
  keywords: string[];
  answer: string;
  navigationTarget?: MenCoreNavigationTarget;
  isPinned: boolean;
  scheduledDate?: string;
  updatedAt: string;
}

export interface MenCoreConversationLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: 'student' | 'admin';
  question: string;
  answer: string;
  questionType: 'platform' | 'navigation' | 'subscription' | 'academic' | 'restricted' | 'other';
  wasHelpful?: boolean;
  starRating?: number; // 1 to 5 ⭐⭐⭐⭐⭐
  createdAt: string;
  unanswered: boolean; // For Smart Suggestions
}

export interface MenCoreAnnouncementItem {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isActive: boolean;
  badgeCount: number;
}

export interface MenCoreSettings {
  isEnabled: boolean;
  showOnAuthPages: boolean;
  maintenanceMode: boolean;
  onlineStatus: 'online' | 'offline' | 'busy';
  name: string;
  subtitle: string;
  tagline: string;
  welcomeMessage: string;
  typingSpeed: number;
  responseSpeed: 'instant' | 'fast' | 'natural';
  maxConversationLength: number;
  avatarUrl: string;
  themeColor: 'indigo' | 'emerald' | 'violet' | 'amber' | 'blue';
  glowingAnimation: boolean;
  restrictedReplyMessage: string;
  permissions: any;
}

export interface FaceArenaSettings {
  status: 'open' | 'closed' | 'locked';
  weeklyChallengeId: string;
  weeklyTitle: string;
  description?: string;
  bannerUrl?: string;
  startDate?: string;
  endDate?: string;
  isPublished?: boolean;
  timerDurationSeconds: number;
  totalQuestionsCount: number;
  passingScorePercentage: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  allowPreviousQuestion: boolean;
  autoSubmitOnTimeout: boolean;
  showResultsImmediately: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FaceArenaQuestion {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  category?: string;
}

export interface FaceArenaParticipant {
  id: string;
  weeklyChallengeId: string;
  userId: string;
  fullName: string;
  whatsAppNumber: string;
  date: string;
  timeStarted: string;
  timeSubmitted: string | null;
  timeUsedSeconds: number;
  questionsAttempted: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number;
  percentage: number;
  position?: number;
  passed: boolean;
  answers: Record<number, 'A' | 'B' | 'C' | 'D'>;
  status: 'registered' | 'in_progress' | 'completed';
}

export interface FaceArenaArchive {
  id: string;
  weeklyChallengeId: string;
  weeklyTitle: string;
  archivedAt: string;
  totalParticipants: number;
  highestScore: number;
  lowestScore: number;
  averageScore: number;
  numberPassed: number;
  numberFailed: number;
  participants: FaceArenaParticipant[];
  settings: FaceArenaSettings;
}




