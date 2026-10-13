import mongoose from 'mongoose';
import dns from 'node:dns';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import Book from './models/Book.js';
import Issue from './models/Issue.js';
import Reservation from './models/Reservation.js';
import Fine from './models/Fine.js';
import Notification from './models/Notification.js';
import DigitalResource from './models/DigitalResource.js';
import Setting from './models/Setting.js';

dotenv.config();

const sampleBooks = [
  {
    title: 'Introduction to Algorithms (4th Edition)',
    author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    ISBN: '978-0262046305',
    publisher: 'MIT Press',
    category: 'Computer Science',
    department: 'Computer Science & Engineering',
    description: 'The standard reference for algorithms research and university computer science courses worldwide.',
    coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80',
    totalCopies: 8,
    availableCopies: 5,
    shelfNumber: 'CS-01',
    rackNumber: 'R-03',
    publicationYear: 2022,
    language: 'English',
    format: 'BOTH',
    digitalFile: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    ISBN: '978-0132350884',
    publisher: 'Prentice Hall',
    category: 'Software Engineering',
    department: 'Computer Science & Engineering',
    description: 'Essential reading for any developer, software architect, systems analyst, or project manager.',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=400&q=80',
    totalCopies: 6,
    availableCopies: 4,
    shelfNumber: 'CS-02',
    rackNumber: 'R-01',
    publicationYear: 2008,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Artificial Intelligence: A Modern Approach (4th Edition)',
    author: 'Stuart Russell & Peter Norvig',
    ISBN: '978-0134610993',
    publisher: 'Pearson',
    category: 'Artificial Intelligence',
    department: 'Computer Science & Engineering',
    description: 'The long-anticipated leading textbook in Artificial Intelligence, machine learning, and multi-agent systems.',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80',
    totalCopies: 5,
    availableCopies: 2,
    shelfNumber: 'AI-04',
    rackNumber: 'R-02',
    publicationYear: 2020,
    language: 'English',
    format: 'BOTH',
    digitalFile: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Operating System Concepts (10th Edition)',
    author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
    ISBN: '978-1118063330',
    publisher: 'Wiley',
    category: 'Computer Science',
    department: 'Computer Science & Engineering',
    description: 'Comprehensive coverage of processes, memory management, file systems, security, and virtual machines.',
    coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=400&q=80',
    totalCopies: 7,
    availableCopies: 3,
    shelfNumber: 'CS-05',
    rackNumber: 'R-04',
    publicationYear: 2018,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Digital Signal Processing: Principles, Algorithms & Applications',
    author: 'John G. Proakis & Dimitris G. Manolakis',
    ISBN: '978-0131873742',
    publisher: 'Pearson',
    category: 'Electronics',
    department: 'Electronics & Communication',
    description: 'In-depth coverage of discrete-time signals, systems, digital filters, spectral analysis, and DSP applications.',
    coverImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
    totalCopies: 4,
    availableCopies: 2,
    shelfNumber: 'EC-01',
    rackNumber: 'R-02',
    publicationYear: 2021,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Microelectronic Circuits (8th Edition)',
    author: 'Adel S. Sedra & Kenneth C. Smith',
    ISBN: '978-0190853464',
    publisher: 'Oxford University Press',
    category: 'Electronics',
    department: 'Electronics & Communication',
    description: 'The standard text for analog and digital electronic circuit analysis and design.',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
    totalCopies: 5,
    availableCopies: 1,
    shelfNumber: 'EC-03',
    rackNumber: 'R-01',
    publicationYear: 2019,
    language: 'English',
    format: 'BOTH',
    digitalFile: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Thermodynamics: An Engineering Approach',
    author: 'Yunus A. Cengel & Michael A. Boles',
    ISBN: '978-1259822674',
    publisher: 'McGraw-Hill Education',
    category: 'Mechanical Engineering',
    department: 'Mechanical Engineering',
    description: 'Clear explanation of energy conversion, laws of thermodynamics, power cycles, and heat transmission.',
    coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80',
    totalCopies: 6,
    availableCopies: 4,
    shelfNumber: 'ME-02',
    rackNumber: 'R-05',
    publicationYear: 2019,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Fluid Mechanics & Hydraulic Machines',
    author: 'Dr. R.K. Bansal',
    ISBN: '978-8131808153',
    publisher: 'Laxmi Publications',
    category: 'Mechanical Engineering',
    department: 'Mechanical Engineering',
    description: 'Detailed analysis of fluid dynamics, hydraulic turbines, pumps, and dimensional analysis.',
    coverImage: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80',
    totalCopies: 4,
    availableCopies: 0, // Out of stock for testing reservations!
    shelfNumber: 'ME-05',
    rackNumber: 'R-01',
    publicationYear: 2018,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Structural Analysis (10th Edition)',
    author: 'Russell C. Hibbeler',
    ISBN: '978-0134610849',
    publisher: 'Pearson',
    category: 'Civil Engineering',
    department: 'Civil Engineering',
    description: 'Comprehensive theory and practical application of structural engineering analysis for beams, trusses, and frames.',
    coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80',
    totalCopies: 5,
    availableCopies: 3,
    shelfNumber: 'CE-01',
    rackNumber: 'R-03',
    publicationYear: 2020,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Principles of Database Systems (Database System Concepts)',
    author: 'Silberschatz, Korth, Sudarshan',
    ISBN: '978-0078022159',
    publisher: 'McGraw-Hill',
    category: 'Database Management',
    department: 'Computer Science & Engineering',
    description: 'Foundational concepts of relational databases, SQL queries, transaction processing, indexing, and NoSQL.',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
    totalCopies: 6,
    availableCopies: 2,
    shelfNumber: 'CS-08',
    rackNumber: 'R-02',
    publicationYear: 2019,
    language: 'English',
    format: 'BOTH',
    digitalFile: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Computer Networking: A Top-Down Approach (8th Edition)',
    author: 'James F. Kurose & Keith W. Ross',
    ISBN: '978-0136681557',
    publisher: 'Pearson',
    category: 'Networking',
    department: 'Computer Science & Engineering',
    description: 'Top-down architecture covering application layer protocols, HTTP, TCP/IP congestion control, and wireless networks.',
    coverImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80',
    totalCopies: 5,
    availableCopies: 3,
    shelfNumber: 'CS-09',
    rackNumber: 'R-04',
    publicationYear: 2021,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Design Patterns: Elements of Reusable Object-Oriented Software',
    author: 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides',
    ISBN: '978-0201633610',
    publisher: 'Addison-Wesley',
    category: 'Software Engineering',
    department: 'Computer Science & Engineering',
    description: 'The iconic Gang of Four handbook detailing 23 fundamental software architectural patterns.',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80',
    totalCopies: 4,
    availableCopies: 2,
    shelfNumber: 'SE-01',
    rackNumber: 'R-01',
    publicationYear: 1994,
    language: 'English',
    format: 'BOTH',
    digitalFile: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Advanced Engineering Mathematics (10th Edition)',
    author: 'Erwin Kreyszig',
    ISBN: '978-0470458365',
    publisher: 'Wiley',
    category: 'Mathematics',
    department: 'General Engineering',
    description: 'Differential equations, linear algebra, vector calculus, complex analysis, and numerical algorithms.',
    coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80',
    totalCopies: 10,
    availableCopies: 6,
    shelfNumber: 'MATH-01',
    rackNumber: 'R-05',
    publicationYear: 2011,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'University Physics with Modern Physics (15th Edition)',
    author: 'Hugh D. Young & Roger A. Freedman',
    ISBN: '978-0135159552',
    publisher: 'Pearson',
    category: 'Physics',
    department: 'General Engineering',
    description: 'Mechanics, wave motion, thermodynamics, electromagnetism, optics, quantum theory, and nuclear physics.',
    coverImage: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=400&q=80',
    totalCopies: 8,
    availableCopies: 5,
    shelfNumber: 'PHY-02',
    rackNumber: 'R-03',
    publicationYear: 2019,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Electric Machinery Fundamentals (5th Edition)',
    author: 'Stephen J. Chapman',
    ISBN: '978-0073529547',
    publisher: 'McGraw-Hill Science',
    category: 'Electrical Engineering',
    department: 'Electrical Engineering',
    description: 'Transformers, AC/DC motors, synchronous generators, induction machines, and power systems.',
    coverImage: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=400&q=80',
    totalCopies: 5,
    availableCopies: 3,
    shelfNumber: 'EE-01',
    rackNumber: 'R-02',
    publicationYear: 2011,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Control Systems Engineering (7th Edition)',
    author: 'Norman S. Nise',
    ISBN: '978-1118170519',
    publisher: 'Wiley',
    category: 'Electrical Engineering',
    department: 'Electrical Engineering',
    description: 'Feedback control systems design, root locus techniques, frequency response methods, and state space modeling.',
    coverImage: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=400&q=80',
    totalCopies: 4,
    availableCopies: 0, // Out of stock for testing reservations!
    shelfNumber: 'EE-04',
    rackNumber: 'R-01',
    publicationYear: 2015,
    language: 'English',
    format: 'BOTH',
    digitalFile: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Machine Learning: A Probabilistic Perspective',
    author: 'Kevin P. Murphy',
    ISBN: '978-0262018029',
    publisher: 'MIT Press',
    category: 'Artificial Intelligence',
    department: 'Computer Science & Engineering',
    description: 'Comprehensive introduction to probabilistic machine learning models, graphical models, and deep neural nets.',
    coverImage: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=400&q=80',
    totalCopies: 5,
    availableCopies: 2,
    shelfNumber: 'AI-01',
    rackNumber: 'R-04',
    publicationYear: 2012,
    language: 'English',
    format: 'BOTH',
    digitalFile: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Cloud Computing: Concepts, Technology & Architecture',
    author: 'Thomas Erl, Ricardo Puttini, Zaigham Mahmood',
    ISBN: '978-0133387520',
    publisher: 'Prentice Hall',
    category: 'Cloud Computing',
    department: 'Computer Science & Engineering',
    description: 'Breakthrough cloud models, SaaS, PaaS, IaaS architectures, virtual server deployment, and security controls.',
    coverImage: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80',
    totalCopies: 6,
    availableCopies: 4,
    shelfNumber: 'CS-12',
    rackNumber: 'R-02',
    publicationYear: 2013,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Cybersecurity Principles & Practice (3rd Edition)',
    author: 'William Stallings',
    ISBN: '978-0134794105',
    publisher: 'Pearson',
    category: 'Cybersecurity',
    department: 'Information Technology',
    description: 'Network security protocols, cryptographic algorithms, intrusion detection, software vulnerability mitigation.',
    coverImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=400&q=80',
    totalCopies: 4,
    availableCopies: 2,
    shelfNumber: 'IT-02',
    rackNumber: 'R-01',
    publicationYear: 2018,
    language: 'English',
    format: 'BOTH',
    digitalFile: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  },
  {
    title: 'Financial Accounting & Management for Engineers',
    author: 'Dr. S. N. Maheshwari & Dr. S. K. Maheshwari',
    ISBN: '978-9352718105',
    publisher: 'Vikas Publishing',
    category: 'Management',
    department: 'Business & Management',
    description: 'Financial analysis, cost accounting, cash flow management, budgeting, and managerial decision making.',
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80',
    totalCopies: 5,
    availableCopies: 3,
    shelfNumber: 'MGT-01',
    rackNumber: 'R-03',
    publicationYear: 2021,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Principles of Soft Computing (3rd Edition)',
    author: 'S. N. Sivanandam & S. N. Deepa',
    ISBN: '978-8126572573',
    publisher: 'Wiley India',
    category: 'Artificial Intelligence',
    department: 'Computer Science & Engineering',
    description: 'Neural networks, fuzzy logic, genetic algorithms, and hybrid soft computing paradigms.',
    coverImage: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=400&q=80',
    totalCopies: 3,
    availableCopies: 1,
    shelfNumber: 'AI-03',
    rackNumber: 'R-02',
    publicationYear: 2018,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Database System Concepts (6th Edition)',
    author: 'Abraham Silberschatz, Henry F. Korth & S. Sudarshan',
    ISBN: '978-0073523323',
    publisher: 'McGraw Hill',
    category: 'Database Systems',
    department: 'Computer Science & Engineering',
    description: 'A comprehensive introduction to relational databases, SQL, transaction processing, and database design.',
    coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80',
    totalCopies: 5,
    availableCopies: 5,
    shelfNumber: 'CS-13',
    rackNumber: 'R-03',
    publicationYear: 2010,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Computer Networks (5th Edition)',
    author: 'Andrew S. Tanenbaum & David J. Wetherall',
    ISBN: '978-0132126953',
    publisher: 'Pearson',
    category: 'Computer Networks',
    department: 'Computer Science & Engineering',
    description: 'Covers network architectures, protocols, wireless networks, security, and internet technologies.',
    coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
    totalCopies: 4,
    availableCopies: 4,
    shelfNumber: 'CS-14',
    rackNumber: 'R-03',
    publicationYear: 2010,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'The Pragmatic Programmer (20th Anniversary Edition)',
    author: 'David Thomas & Andrew Hunt',
    ISBN: '978-0135957059',
    publisher: 'Addison-Wesley',
    category: 'Software Engineering',
    department: 'Computer Science & Engineering',
    description: 'Practical guidance on software craftsmanship, problem-solving, and building maintainable systems.',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=400&q=80',
    totalCopies: 3,
    availableCopies: 3,
    shelfNumber: 'CS-15',
    rackNumber: 'R-01',
    publicationYear: 2019,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'An Introduction to Statistical Learning (2nd Edition)',
    author: 'Gareth James, Daniela Witten, Trevor Hastie & Robert Tibshirani',
    ISBN: '978-1071614174',
    publisher: 'Springer',
    category: 'Data Science',
    department: 'Computer Science & Engineering',
    description: 'An accessible introduction to statistical learning methods, including regression, classification, and resampling.',
    coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80',
    totalCopies: 4,
    availableCopies: 4,
    shelfNumber: 'DS-01',
    rackNumber: 'R-02',
    publicationYear: 2021,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Calculus: Early Transcendentals (8th Edition)',
    author: 'James Stewart',
    ISBN: '978-1285741550',
    publisher: 'Cengage Learning',
    category: 'Mathematics',
    department: 'General Engineering',
    description: 'A university calculus text covering limits, derivatives, integrals, and their engineering applications.',
    coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80',
    totalCopies: 6,
    availableCopies: 6,
    shelfNumber: 'MATH-01',
    rackNumber: 'R-04',
    publicationYear: 2015,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Engineering Mechanics: Statics (14th Edition)',
    author: 'Russell C. Hibbeler',
    ISBN: '978-0133918922',
    publisher: 'Pearson',
    category: 'Mechanical Engineering',
    department: 'Mechanical Engineering',
    description: 'Develops methods for analyzing forces, equilibrium, and structural systems in engineering mechanics.',
    coverImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
    totalCopies: 5,
    availableCopies: 5,
    shelfNumber: 'ME-01',
    rackNumber: 'R-02',
    publicationYear: 2015,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Signals and Systems (2nd Edition)',
    author: 'Alan V. Oppenheim, Alan S. Willsky & S. Hamid Nawab',
    ISBN: '978-0138147570',
    publisher: 'Pearson',
    category: 'Electronics',
    department: 'Electrical Engineering',
    description: 'Introduces continuous- and discrete-time signals, linear systems, transforms, and signal analysis.',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
    totalCopies: 4,
    availableCopies: 4,
    shelfNumber: 'EE-02',
    rackNumber: 'R-02',
    publicationYear: 1996,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Structural Analysis (10th Edition)',
    author: 'Russell C. Hibbeler',
    ISBN: '978-0134610672',
    publisher: 'Pearson',
    category: 'Civil Engineering',
    department: 'Civil Engineering',
    description: 'Explains analysis of determinate and indeterminate structures, trusses, beams, and frames.',
    coverImage: 'https://images.unsplash.com/photo-1503387762-592dee58c266?auto=format&fit=crop&w=400&q=80',
    totalCopies: 3,
    availableCopies: 3,
    shelfNumber: 'CE-01',
    rackNumber: 'R-02',
    publicationYear: 2017,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Fundamentals of Fluid Mechanics (8th Edition)',
    author: 'Bruce R. Munson, Theodore H. Okiishi, Wade W. Huebsch & Alric P. Rothmayer',
    ISBN: '978-1119320523',
    publisher: 'Wiley',
    category: 'Mechanical Engineering',
    department: 'Mechanical Engineering',
    description: 'Introduces fluid statics and dynamics with practical applications in mechanical and civil engineering.',
    coverImage: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&q=80',
    totalCopies: 3,
    availableCopies: 3,
    shelfNumber: 'ME-02',
    rackNumber: 'R-02',
    publicationYear: 2017,
    language: 'English',
    format: 'PHYSICAL',
  },
  {
    title: 'Introduction to Machine Learning with Python',
    author: 'Andreas C. Müller & Sarah Guido',
    ISBN: '978-1449369415',
    publisher: "O'Reilly Media",
    category: 'Machine Learning',
    department: 'Computer Science & Engineering',
    description: 'A practical guide to applying machine-learning algorithms using Python and scikit-learn.',
    coverImage: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=400&q=80',
    totalCopies: 4,
    availableCopies: 4,
    shelfNumber: 'AI-05',
    rackNumber: 'R-02',
    publicationYear: 2016,
    language: 'English',
    format: 'PHYSICAL',
  },
];

const demoUsers = [
  {
    name: 'Dr. Robert Vance',
    email: 'admin@gist.edu',
    password: 'password123',
    role: 'ADMIN',
    employeeId: 'ADM-001',
    department: 'Library Administration',
    phone: '+91 9876543210',
  },
  {
    name: 'Eleanor Vance',
    email: 'librarian@gist.edu',
    password: 'password123',
    role: 'LIBRARIAN',
    employeeId: 'LIB-102',
    department: 'Central Library',
    phone: '+91 9876543211',
  },
  {
    name: 'Prof. David Miller',
    email: 'faculty@gist.edu',
    password: 'password123',
    role: 'FACULTY',
    employeeId: 'FAC-304',
    department: 'Computer Science & Engineering',
    phone: '+91 9876543212',
  },
  {
    name: 'Alex Johnson',
    email: 'student@gist.edu',
    password: 'password123',
    role: 'STUDENT',
    studentId: 'STU-2024-001',
    department: 'Computer Science & Engineering',
    year: '3rd Year',
    phone: '+91 9876543213',
  },
  {
    name: 'Sophia Patel',
    email: 'sophia@gist.edu',
    password: 'password123',
    role: 'STUDENT',
    studentId: 'STU-2024-045',
    department: 'Electronics & Communication',
    year: '2nd Year',
    phone: '+91 9876543214',
  },
  {
    name: 'Marcus Chen',
    email: 'marcus@gist.edu',
    password: 'password123',
    role: 'STUDENT',
    studentId: 'STU-2024-089',
    department: 'Mechanical Engineering',
    year: '4th Year',
    phone: '+91 9876543215',
  },
];

const demoCirculation = [
  {
    email: 'student@gist.edu',
    ISBN: '978-0262046305',
    status: 'ISSUED',
    issueDaysAgo: 4,
    dueDaysFromNow: 10,
  },
  {
    email: 'sophia@gist.edu',
    ISBN: '978-0190853464',
    status: 'OVERDUE',
    issueDaysAgo: 19,
    dueDaysAgo: 5,
    fineAmount: 10,
    fineReason: 'Late return overdue fine for "Microelectronic Circuits" (5 days overdue)',
  },
  {
    email: 'marcus@gist.edu',
    ISBN: '978-1259822674',
    status: 'RETURNED',
    issueDaysAgo: 25,
    dueDaysAgo: 11,
    returnedDaysAgo: 11,
  },
  {
    email: 'faculty@gist.edu',
    ISBN: '978-0134610993',
    status: 'ISSUED',
    issueDaysAgo: 8,
    dueDaysFromNow: 22,
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing library collections...');
    await User.deleteMany({});
    await Book.deleteMany({});
    await Issue.deleteMany({});
    await Reservation.deleteMany({});
    await Fine.deleteMany({});
    await Notification.deleteMany({});
    await DigitalResource.deleteMany({});
    await Setting.deleteMany({});

    console.log('⚙️ Creating default settings...');
    await Setting.create({
      finePerDay: 2,
      studentMaxBooks: 3,
      studentIssueDays: 14,
      facultyMaxBooks: 6,
      facultyIssueDays: 30,
      collegeName: 'Apex Institute of Technology & Management',
    });

    console.log('👤 Creating users with hashed passwords...');
    // Create Admin
    const adminUser = await User.create({
      name: 'Dr. Robert Vance',
      email: 'admin@gist.edu',
      password: 'password123',
      role: 'ADMIN',
      employeeId: 'ADM-001',
      department: 'Library Administration',
      phone: '+91 9876543210',
      profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    });

    // Create Librarian
    const librarianUser = await User.create({
      name: 'Eleanor Vance',
      email: 'librarian@gist.edu',
      password: 'password123',
      role: 'LIBRARIAN',
      employeeId: 'LIB-102',
      department: 'Central Library',
      phone: '+91 9876543211',
      profileImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    });

    // Create Faculty
    const facultyUser = await User.create({
      name: 'Prof. David Miller',
      email: 'faculty@gist.edu',
      password: 'password123',
      role: 'FACULTY',
      employeeId: 'FAC-304',
      department: 'Computer Science & Engineering',
      phone: '+91 9876543212',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    });

    // Create Students
    const student1 = await User.create({
      name: 'Alex Johnson',
      email: 'student@gist.edu',
      password: 'password123',
      role: 'STUDENT',
      studentId: 'STU-2024-001',
      department: 'Computer Science & Engineering',
      year: '3rd Year',
      phone: '+91 9876543213',
      profileImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
    });

    const student2 = await User.create({
      name: 'Sophia Patel',
      email: 'sophia@gist.edu',
      password: 'password123',
      role: 'STUDENT',
      studentId: 'STU-2024-045',
      department: 'Electronics & Communication',
      year: '2nd Year',
      phone: '+91 9876543214',
      profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    });

    const student3 = await User.create({
      name: 'Marcus Chen',
      email: 'marcus@gist.edu',
      password: 'password123',
      role: 'STUDENT',
      studentId: 'STU-2024-089',
      department: 'Mechanical Engineering',
      year: '4th Year',
      phone: '+91 9876543215',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    });

    console.log(`📚 Inserting ${sampleBooks.length} academic books...`);
    const insertedBooks = await Book.insertMany(sampleBooks);

    console.log('📖 Generating sample book issue records & fines...');
    const now = new Date();

    // Active issue (Alex Johnson - Introduction to Algorithms)
    const issue1DueDate = new Date();
    issue1DueDate.setDate(now.getDate() + 10); // Due in 10 days
    const issue1 = await Issue.create({
      userId: student1._id,
      bookId: insertedBooks[0]._id,
      issueDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      dueDate: issue1DueDate,
      status: 'ISSUED',
      issuedBy: librarianUser._id,
    });

    // Overdue issue (Sophia Patel - Microelectronic Circuits)
    const overdueDueDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // Overdue by 5 days
    const issue2 = await Issue.create({
      userId: student2._id,
      bookId: insertedBooks[5]._id,
      issueDate: new Date(now.getTime() - 19 * 24 * 60 * 60 * 1000),
      dueDate: overdueDueDate,
      status: 'OVERDUE',
      fineAmount: 10, // 5 days * 2
      issuedBy: librarianUser._id,
    });

    // Fine for overdue issue2
    await Fine.create({
      userId: student2._id,
      issueId: issue2._id,
      amount: 10,
      reason: 'Late return overdue fine for "Microelectronic Circuits" (5 days overdue)',
      status: 'UNPAID',
    });

    // Returned issue (Marcus Chen - Thermodynamics)
    const returnedIssue = await Issue.create({
      userId: student3._id,
      bookId: insertedBooks[6]._id,
      issueDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      dueDate: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
      returnDate: new Date(now.getTime() - 11 * 24 * 60 * 60 * 1000),
      status: 'RETURNED',
      fineAmount: 0,
      issuedBy: librarianUser._id,
    });

    // Faculty issue (Prof. David Miller - Artificial Intelligence)
    const facultyDueDate = new Date();
    facultyDueDate.setDate(now.getDate() + 22);
    await Issue.create({
      userId: facultyUser._id,
      bookId: insertedBooks[2]._id,
      issueDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
      dueDate: facultyDueDate,
      status: 'ISSUED',
      issuedBy: librarianUser._id,
    });

    console.log('📌 Creating sample reservations...');
    // Reservation for out-of-stock book "Fluid Mechanics"
    await Reservation.create({
      userId: student1._id,
      bookId: insertedBooks[7]._id, // Fluid Mechanics (0 available)
      reservationDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
      expiryDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    });

    // Approved reservation for "Control Systems"
    await Reservation.create({
      userId: student3._id,
      bookId: insertedBooks[15]._id, // Control Systems (0 available)
      reservationDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      status: 'APPROVED',
      expiryDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    });

    console.log('💻 Inserting Digital Library Resources...');
    await DigitalResource.insertMany([
      {
        title: 'Data Structures & Algorithms Lecture Notes (CS301)',
        author: 'Prof. David Miller',
        category: 'NOTES',
        department: 'Computer Science & Engineering',
        subject: 'Data Structures',
        semester: 'Semester 3',
        description: 'Comprehensive lecture slides and reference notes covering Trees, Graphs, Sorting, and Dynamic Programming.',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSize: '6.4 MB',
        uploadedBy: facultyUser._id,
        downloadsCount: 142,
      },
      {
        title: 'Artificial Intelligence Previous Year Question Papers (2020-2025)',
        author: 'Apex Examination Cell',
        category: 'QUESTION_PAPER',
        department: 'Computer Science & Engineering',
        subject: 'Artificial Intelligence',
        semester: 'Semester 6',
        description: 'Solved university semester examination papers with step-by-step solutions.',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSize: '4.1 MB',
        uploadedBy: librarianUser._id,
        downloadsCount: 289,
      },
      {
        title: 'Digital Signal Processing Lab Manual & MATLAB Code',
        author: 'Dr. Sarah Jenkins',
        category: 'STUDY_MATERIAL',
        department: 'Electronics & Communication',
        subject: 'Digital Signal Processing',
        semester: 'Semester 5',
        description: 'Laboratory practical guidelines, FFT implementation scripts, and digital filter design exercises.',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSize: '8.2 MB',
        uploadedBy: facultyUser._id,
        downloadsCount: 97,
      },
      {
        title: 'IEEE Journal on Robotics & Autonomous Systems (Vol 42)',
        author: 'IEEE Robotics Society',
        category: 'JOURNAL',
        department: 'Mechanical Engineering',
        subject: 'Robotics',
        semester: 'Semester 7',
        description: 'Peer-reviewed research paper on autonomous navigation and path planning for mobile industrial robots.',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSize: '3.8 MB',
        uploadedBy: librarianUser._id,
        downloadsCount: 64,
      },
      {
        title: 'Thermodynamics Quick Formula Handbook',
        author: 'Mechanical Engineering Dept',
        category: 'REFERENCE',
        department: 'Mechanical Engineering',
        subject: 'Thermodynamics',
        semester: 'Semester 4',
        description: 'Essential steam tables, psychrometric charts, and formula sheet for quick revision.',
        fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        fileSize: '2.5 MB',
        uploadedBy: facultyUser._id,
        downloadsCount: 185,
      },
    ]);

    console.log('🔔 Sending initial sample notifications...');
    await Notification.create({
      userId: student1._id,
      title: 'Welcome to Apex Digital Library!',
      message: 'Explore over 20+ academic books, e-books, and digital study materials right from your portal.',
      type: 'SYSTEM',
    });

    await Notification.create({
      userId: student1._id,
      title: 'Book Issued: Introduction to Algorithms',
      message: 'Your issued book is due on ' + issue1DueDate.toLocaleDateString() + '.',
      type: 'ISSUE',
    });

    await Notification.create({
      userId: student2._id,
      title: 'Overdue Book Warning',
      message: '"Microelectronic Circuits" is overdue by 5 days. Fine accumulated: ₹10.',
      type: 'OVERDUE',
    });

    console.log('=======================================================');
    console.log('🎉 Seed Data Population Completed Successfully!');
    console.log('=======================================================');
    console.log('🔑 DEMO CREDENTIALS:');
    console.log(' Admin: admin@gist.edu / password123');
    console.log(' Librarian: librarian@gist.edu / password123');
    console.log(' Faculty: faculty@gist.edu / password123');
    console.log(' Student: student@gist.edu / password123');
    console.log('=======================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seed failed:', error);
    process.exit(1);
  }
};

const addBooksWithoutClearing = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not configured. Set the MongoDB Atlas connection string in backend/.env.');
    }

    const dnsServers = process.env.MONGODB_DNS_SERVERS || '8.8.8.8';
    dns.setServers(dnsServers.split(',').map((server) => server.trim()).filter(Boolean));
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

    const booksCollection = mongoose.connection.collection(Book.collection.name);
    const result = await booksCollection.bulkWrite(
      sampleBooks.map((book) => ({
        updateOne: {
          filter: { $or: [{ ISBN: book.ISBN }, { isbn: book.ISBN }] },
          update: { $setOnInsert: { ...book, isbn: book.ISBN } },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    console.log(`📚 Added ${result.upsertedCount} books; ${result.matchedCount} were already in the catalog.`);
  } catch (error) {
    console.error('❌ Could not add books to the catalog:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

const addDemoUsersWithoutClearing = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not configured. Set the MongoDB Atlas connection string in backend/.env.');
    }

    const dnsServers = process.env.MONGODB_DNS_SERVERS || '8.8.8.8';
    dns.setServers(dnsServers.split(',').map((server) => server.trim()).filter(Boolean));
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

    let addedCount = 0;
    for (const user of demoUsers) {
      const existingUser = await User.findOne({ email: user.email }).select('_id');
      if (!existingUser) {
        await User.create(user);
        addedCount += 1;
      }
    }

    console.log(`👤 Added ${addedCount} demo accounts; ${demoUsers.length - addedCount} already existed and were left unchanged.`);
  } catch (error) {
    console.error('❌ Could not add demo accounts:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

const addCirculationWithoutClearing = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not configured. Set the MongoDB Atlas connection string in backend/.env.');
    }

    const dnsServers = process.env.MONGODB_DNS_SERVERS || '8.8.8.8';
    dns.setServers(dnsServers.split(',').map((server) => server.trim()).filter(Boolean));
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

    const now = new Date();
    let addedIssues = 0;
    let addedFines = 0;
    const librarian = await User.findOne({ email: 'librarian@gist.edu' });
    if (!librarian) {
      throw new Error('Missing librarian@gist.edu. Add demo accounts before importing circulation data.');
    }

    for (const entry of demoCirculation) {
      const user = await User.findOne({ email: entry.email });
      if (!user) {
        throw new Error(`Missing demo account ${entry.email}. Add demo accounts before importing circulation data.`);
      }

      const book = await Book.findOne({ $or: [{ ISBN: entry.ISBN }, { isbn: entry.ISBN }] });
      if (!book) {
        throw new Error(`Missing demo book ISBN ${entry.ISBN}. Add catalog books before importing circulation data.`);
      }

      let issue = await Issue.findOne({
        userId: user._id,
        bookId: book._id,
        status: entry.status,
      }).sort({ createdAt: -1 });

      if (!issue) {
        if (entry.status !== 'RETURNED' && book.availableCopies < 1) {
          throw new Error(`No available copies of "${book.title}" for the demo issue.`);
        }

        const issueDate = new Date(now);
        issueDate.setDate(issueDate.getDate() - entry.issueDaysAgo);
        const dueDate = new Date(now);
        if (entry.dueDaysFromNow !== undefined) {
          dueDate.setDate(dueDate.getDate() + entry.dueDaysFromNow);
        } else {
          dueDate.setDate(dueDate.getDate() - entry.dueDaysAgo);
        }

        const returnDate = entry.returnedDaysAgo === undefined
          ? null
          : new Date(now.getTime() - entry.returnedDaysAgo * 24 * 60 * 60 * 1000);

        issue = await Issue.create({
          userId: user._id,
          bookId: book._id,
          issueDate,
          dueDate,
          returnDate,
          status: entry.status,
          fineAmount: entry.fineAmount || 0,
          issuedBy: librarian._id,
        });
        addedIssues += 1;

        if (entry.status !== 'RETURNED') {
          book.availableCopies -= 1;
          await book.save();
        }
      }

      if (entry.fineAmount && !(await Fine.exists({ issueId: issue._id }))) {
        await Fine.create({
          userId: user._id,
          issueId: issue._id,
          amount: entry.fineAmount,
          reason: entry.fineReason,
          status: 'UNPAID',
        });
        addedFines += 1;
      }
    }

    console.log(`📖 Added ${addedIssues} issues and ${addedFines} fines; existing matching records were left unchanged.`);
  } catch (error) {
    console.error('❌ Could not add circulation data:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

if (process.argv.includes('--users-only')) {
  addDemoUsersWithoutClearing();
} else if (process.argv.includes('--books-only')) {
  addBooksWithoutClearing();
} else if (process.argv.includes('--circulation-only')) {
  addCirculationWithoutClearing();
} else {
  seedDatabase();
}
