import { DataSource } from 'typeorm';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { University, UniversityStatus } from '../../modules/tenants/entities/university.entity';
import { User, UserRole, VerificationStatus } from '../../modules/tenants/entities/user.entity';
import { UniversityModule } from '../../modules/tenants/entities/university-module.entity';
import { LibraryItem, LibraryItemType, LibraryItemAccess } from '../../modules/library/entities/library-item.entity';
import { LibraryCategory } from '../../modules/library/entities/library-category.entity';
import { Listing, ListingCategory, CurrencyCode, ListingStatus } from '../../modules/marketplace/entities/listing.entity';
import { FoodShop, ShopType, ShopStatus } from '../../modules/marketplace/entities/food-shop.entity';
import { Course, CourseStatus } from '../../modules/academics/entities/course.entity';
import { TimetableEntry, DayOfWeek } from '../../modules/academics/entities/timetable.entity';
import { Enrollment, EnrollmentStatus } from '../../modules/academics/entities/enrollment.entity';
import { GradeItem, GradeItemCategory } from '../../modules/academics/entities/grade-item.entity';
import { CafeteriaMenu, MealType } from '../../modules/campus-life/entities/cafeteria-menu.entity';
import { TransportRoute } from '../../modules/campus-life/entities/transport-route.entity';

const UNIVERSITIES = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'National University of Lesotho',
    slug: 'nul',
    domain: 'nul.ls',
    countryCode: 'LS',
    city: 'Roma',
    status: UniversityStatus.ACTIVE,
    defaultLanguage: 'st',
    timezone: 'Africa/Maseru',
    subscriptionTier: 'enterprise',
  },
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
    name: 'Limkokwing University of Creative Technology',
    slug: 'limkokwing',
    domain: 'limkokwing.ls',
    countryCode: 'LS',
    city: 'Maseru',
    status: UniversityStatus.ACTIVE,
    defaultLanguage: 'en',
    timezone: 'Africa/Maseru',
    subscriptionTier: 'pro',
  },
  {
    id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
    name: 'University of Botswana',
    slug: 'ub',
    domain: 'ub.bw',
    countryCode: 'BW',
    city: 'Gaborone',
    status: UniversityStatus.ACTIVE,
    defaultLanguage: 'en',
    timezone: 'Africa/Gaborone',
    subscriptionTier: 'enterprise',
  },
];

const DEFAULT_MODULES = [
  'academics', 'library', 'dashboard', 'marketplace', 'messaging',
  'mentorship', 'scholarships', 'jobs', 'innovation-hub', 'research-hub',
  'campus-life', 'health', 'sports', 'news', 'ai-tutor',
  'notifications', 'verifiable-credentials',
];

const FACULTIES = [
  'Faculty of Science and Technology',
  'Faculty of Humanities',
  'Faculty of Business and Economics',
  'Faculty of Health Sciences',
  'Faculty of Education',
  'Faculty of Engineering',
  'Faculty of Law',
];

const DEMO_USERS = [
  { firstName: 'Thabo', lastName: 'Mokoena', role: UserRole.STUDENT, yearOfStudy: 2 },
  { firstName: 'Lineo', lastName: 'Ranthimo', role: UserRole.STUDENT, yearOfStudy: 3 },
  { firstName: 'Mohapi', lastName: 'Tau', role: UserRole.STUDENT, yearOfStudy: 1 },
  { firstName: 'Karabo', lastName: 'Molefe', role: UserRole.STUDENT, yearOfStudy: 4 },
  { firstName: 'Nthabiseng', lastName: 'Khetho', role: UserRole.FACULTY, yearOfStudy: null },
  { firstName: 'Dr. Sipho', lastName: 'Nkosi', role: UserRole.FACULTY, yearOfStudy: null },
  { firstName: 'Admin', lastName: 'User', role: UserRole.ADMIN, yearOfStudy: null },
];

async function seed() {
  console.log('🌱 Seeding CampusOS database...');

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'campusos',
    password: process.env.DB_PASSWORD || 'campusos_dev',
    database: process.env.DB_NAME || 'campusos',
    schema: process.env.DB_SCHEMA || 'public',
    entities: [
      University, User, UniversityModule, LibraryItem, LibraryCategory,
      Listing, FoodShop, Course, TimetableEntry, Enrollment, GradeItem,
      CafeteriaMenu,
      TransportRoute,
    ],
    // Ensure the schema exists before seeding (safe on an empty host DB).
    migrations: [path.join(__dirname, '..', 'migrations', '*{.ts,.js}')],
    migrationsRun:
      process.env.DB_SYNCHRONIZE === 'true'
        ? false
        : process.env.DB_MIGRATIONS_RUN !== 'false',
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  await dataSource.initialize();
  console.log('Database connected.');

  const uniRepo = dataSource.getRepository(University);
  const userRepo = dataSource.getRepository(User);
  const moduleRepo = dataSource.getRepository(UniversityModule);
  const itemRepo = dataSource.getRepository(LibraryItem);
  const listingRepo = dataSource.getRepository(Listing);
  const foodShopRepo = dataSource.getRepository(FoodShop);

  // Seed universities
  for (const uniData of UNIVERSITIES) {
    const existing = await uniRepo.findOne({ where: { slug: uniData.slug } });
    if (!existing) {
      const uni = uniRepo.create(uniData);
      await uniRepo.save(uni);
      console.log(`  ✅ Created university: ${uniData.name}`);
    }
  }

  // Seed modules for each university
  for (const uniData of UNIVERSITIES) {
    for (const moduleKey of DEFAULT_MODULES) {
      const existing = await moduleRepo.findOne({
        where: { universityId: uniData.id, moduleKey },
      });
      if (!existing) {
        const mod = moduleRepo.create({
          universityId: uniData.id,
          moduleKey,
          enabled: true,
          config: {},
          limits: {},
        });
        await moduleRepo.save(mod);
      }
    }
    console.log(`  ✅ Modules configured for ${uniData.slug}`);
  }

  // Seed demo users
  const passwordHash = await bcrypt.hash('CampusOS2024!', 12);
  const primaryUniId = UNIVERSITIES[0].id;
  const createdUsers: User[] = [];

  for (const userData of DEMO_USERS) {
    const email = `${userData.firstName.toLowerCase()}.${userData.lastName.toLowerCase()}@nul.ls`;
    let user = await userRepo.findOne({
      where: { email, universityId: primaryUniId },
    });
    if (!user) {
      const faculty = FACULTIES[Math.floor(Math.random() * FACULTIES.length)];
      user = userRepo.create({
        email,
        passwordHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        universityId: primaryUniId,
        role: userData.role,
        verificationStatus: VerificationStatus.VERIFIED,
        enabledModules: DEFAULT_MODULES,
        academicProfile: {
          faculty,
          department: 'Computer Science',
          program: 'B.Sc. Computer Science',
          yearOfStudy: userData.yearOfStudy,
          enrollmentDate: '2023-09-01',
          expectedGraduation: '2027-06-30',
        },
        preferences: {
          language: 'en',
          theme: 'system',
          notifications: { push: true, email: true, sms: false },
        },
      });
      await userRepo.save(user);
      console.log(`  ✅ Created user: ${userData.firstName} ${userData.lastName} (${userData.role})`);
    }
    createdUsers.push(user);
  }

  // Dedicated admin account for the hosted demo (matches the README).
  const demoAdminEmail = 'admin@campusos.ls';
  let demoAdmin = await userRepo.findOne({
    where: { email: demoAdminEmail, universityId: primaryUniId },
  });
  if (!demoAdmin) {
    demoAdmin = userRepo.create({
      email: demoAdminEmail,
      passwordHash: await bcrypt.hash('AdminCampus2026', 12),
      firstName: 'CampusOS',
      lastName: 'Admin',
      universityId: primaryUniId,
      role: UserRole.ADMIN,
      verificationStatus: VerificationStatus.VERIFIED,
      enabledModules: DEFAULT_MODULES,
      preferences: {
        language: 'en',
        theme: 'system',
        notifications: { push: true, email: true, sms: false },
      },
    });
    await userRepo.save(demoAdmin);
    console.log('  ✅ Created admin: admin@campusos.ls');
  }

  // ---- Academics: courses, timetable, enrollments, grades ------------------
  const courseRepo = dataSource.getRepository(Course);
  const timetableRepo = dataSource.getRepository(TimetableEntry);
  const enrollmentRepo = dataSource.getRepository(Enrollment);
  const gradeItemRepo = dataSource.getRepository(GradeItem);

  const demoStudent = createdUsers.find(
    (u) => u.email === 'thabo.mokoena@nul.ls',
  );

  const courseSeed = [
    {
      code: 'CS201',
      name: 'Data Structures & Algorithms',
      description: 'Arrays, linked lists, trees, graphs, sorting and searching.',
      credits: 4,
      department: 'Computer Science',
      faculty: 'Faculty of Science and Technology',
      level: '200',
      semester: 'Semester 1',
      academicYear: '2025/2026',
      instructorName: 'Dr. Sipho Nkosi',
      grade: 88.5,
      letter: 'A',
    },
    {
      code: 'CS202',
      name: 'Database Systems',
      description: 'Relational modelling, SQL, transactions and indexing.',
      credits: 3,
      department: 'Computer Science',
      faculty: 'Faculty of Science and Technology',
      level: '200',
      semester: 'Semester 1',
      academicYear: '2025/2026',
      instructorName: 'Dr. Sipho Nkosi',
      grade: 76,
      letter: 'B+',
    },
    {
      code: 'MATH201',
      name: 'Linear Algebra',
      description: 'Vectors, matrices, eigenvalues and linear transformations.',
      credits: 3,
      department: 'Mathematics',
      faculty: 'Faculty of Science and Technology',
      level: '200',
      semester: 'Semester 1',
      academicYear: '2025/2026',
      instructorName: 'Nthabiseng Khetho',
      grade: 68,
      letter: 'B-',
    },
  ];

  const timetableSeed = [
    { code: 'CS201', day: DayOfWeek.MONDAY, start: '08:30', end: '10:30', venue: 'Lab 3, Science Block', building: 'Science Block', type: 'Lecture' },
    { code: 'CS202', day: DayOfWeek.MONDAY, start: '11:00', end: '12:30', venue: 'Room 204, Science Block', building: 'Science Block', type: 'Lecture' },
    { code: 'MATH201', day: DayOfWeek.TUESDAY, start: '09:00', end: '10:30', venue: 'Lecture Hall A', building: 'Main Building', type: 'Lecture' },
    { code: 'CS201', day: DayOfWeek.WEDNESDAY, start: '14:00', end: '16:00', venue: 'Lab 1, Science Block', building: 'Science Block', type: 'Practical' },
    { code: 'CS202', day: DayOfWeek.THURSDAY, start: '08:30', end: '10:00', venue: 'Room 204, Science Block', building: 'Science Block', type: 'Tutorial' },
    { code: 'MATH201', day: DayOfWeek.FRIDAY, start: '10:00', end: '11:30', venue: 'Lecture Hall B', building: 'Main Building', type: 'Lecture' },
  ];

  const savedCourses: Record<string, Course> = {};
  for (const c of courseSeed) {
    let course = await courseRepo.findOne({
      where: { code: c.code, universityId: primaryUniId },
    });
    if (!course) {
      course = await courseRepo.save(
        courseRepo.create({
          universityId: primaryUniId,
          code: c.code,
          name: c.name,
          description: c.description,
          credits: c.credits,
          department: c.department,
          faculty: c.faculty,
          level: c.level,
          semester: c.semester,
          academicYear: c.academicYear,
          status: CourseStatus.PUBLISHED,
          enrolledCount: 1,
        }),
      );
      console.log(`  ✅ Created course: ${c.code}`);
    }
    savedCourses[c.code] = course;
  }

  for (const t of timetableSeed) {
    const course = savedCourses[t.code];
    if (!course) continue;
    const exists = await timetableRepo.findOne({
      where: {
        universityId: primaryUniId,
        courseId: course.id,
        dayOfWeek: t.day,
        startTime: t.start,
      },
    });
    if (exists) continue;
    await timetableRepo.save(
      timetableRepo.create({
        universityId: primaryUniId,
        courseId: course.id,
        courseCode: course.code,
        courseName: course.name,
        dayOfWeek: t.day,
        startTime: t.start,
        endTime: t.end,
        venue: t.venue,
        building: t.building,
        instructorName: courseSeed.find((c) => c.code === t.code)?.instructorName,
        type: t.type,
      }),
    );
  }
  console.log('  ✅ Timetable seeded');

  if (demoStudent) {
    for (const c of courseSeed) {
      const course = savedCourses[c.code];
      if (!course) continue;
      let enrollment = await enrollmentRepo.findOne({
        where: {
          universityId: primaryUniId,
          userId: demoStudent.id,
          courseId: course.id,
        },
      });
      if (!enrollment) {
        enrollment = await enrollmentRepo.save(
          enrollmentRepo.create({
            universityId: primaryUniId,
            userId: demoStudent.id,
            courseId: course.id,
            status: EnrollmentStatus.ENROLLED,
            grade: c.grade as any,
            letterGrade: c.letter,
            enrolledAt: new Date('2025-09-01T00:00:00Z'),
          }),
        );
      }

      const existingGrades = await gradeItemRepo.count({
        where: { universityId: primaryUniId, enrollmentId: enrollment.id },
      });
      if (existingGrades === 0) {
        const items = [
          { title: 'Midterm Exam', category: GradeItemCategory.MIDTERM, score: Math.round(c.grade), weight: 30 },
          { title: 'Assignment 1', category: GradeItemCategory.ASSIGNMENT, score: Math.min(100, Math.round(c.grade + 5)), weight: 20 },
          { title: 'Final Project', category: GradeItemCategory.PROJECT, score: Math.round(c.grade), weight: 50 },
        ];
        for (const item of items) {
          await gradeItemRepo.save(
            gradeItemRepo.create({
              universityId: primaryUniId,
              courseId: course.id,
              enrollmentId: enrollment.id,
              title: item.title,
              category: item.category,
              score: item.score as any,
              maxScore: 100 as any,
              weight: item.weight as any,
              gradedAt: new Date('2025-11-15T00:00:00Z'),
            }),
          );
        }
      }
    }
    console.log('  ✅ Enrollments & grades seeded for demo student');
  }

  const now = new Date();
  const librarySeed = [
    { title: 'Introduction to Computer Science', type: LibraryItemType.TEXTBOOK, topic: 'programming', content: 'Comprehensive guide to CS fundamentals covering algorithms, data structures, and computational thinking.' },
    { title: 'Data Structures & Algorithms', type: LibraryItemType.TEXTBOOK, topic: 'algorithms', content: 'In-depth coverage of arrays, linked lists, trees, graphs, and sorting algorithms with implementations.' },
    { title: 'Linear Algebra for Machine Learning', type: LibraryItemType.TEXTBOOK, topic: 'mathematics', content: 'Vectors, matrices, eigenvalues, and their applications in machine learning and AI.' },
    { title: 'Research Paper: Neural Networks 2026', type: LibraryItemType.DOCUMENT, topic: 'ai', content: 'A survey of recent advances in deep neural network architectures and training techniques.' },
    { title: 'Conference Paper: Distributed Systems', type: LibraryItemType.DOCUMENT, topic: 'systems', content: 'Analysis of consensus algorithms, replication strategies, and fault tolerance in modern distributed systems.' },
    { title: 'Journal: Quantum Computing Primer', type: LibraryItemType.DOCUMENT, topic: 'quantum', content: 'Introduction to qubits, quantum gates, and quantum algorithms including Shor and Grover.' },
    { title: 'Calculus I Lecture Notes', type: LibraryItemType.NOTES, topic: 'mathematics', content: 'Limits, derivatives, integrals, and the Fundamental Theorem of Calculus with worked examples.' },
    { title: 'Database Systems Notes', type: LibraryItemType.NOTES, topic: 'databases', content: 'SQL, normalization, indexing, query optimization, and NoSQL database concepts.' },
    { title: 'Operating Systems Notes', type: LibraryItemType.NOTES, topic: 'systems', content: 'Process management, memory management, file systems, and I/O handling.' },
    { title: 'Past Exam: Data Structures 2025', type: LibraryItemType.NOTES, topic: 'past_exam', content: 'Final exam questions covering all major data structures topics with model answers.' },
    { title: 'Past Exam: Algorithms 2025', type: LibraryItemType.NOTES, topic: 'past_exam', content: 'Comprehensive exam on algorithm design paradigms including divide-and-conquer, DP, and greedy.' },
    { title: 'Past Exam: Computer Networks 2024', type: LibraryItemType.NOTES, topic: 'past_exam', content: 'Exam covering OSI model, TCP/IP, routing protocols, and network security fundamentals.' },
    { title: 'Software Engineering Lecture Videos', type: LibraryItemType.VIDEO, topic: 'software', content: 'Video series on SDLC, agile methodologies, design patterns, and testing strategies.' },
    { title: 'Python Programming Tutorials', type: LibraryItemType.VIDEO, topic: 'programming', content: 'Step-by-step video tutorials from Python basics to advanced topics like decorators and async.' },
    { title: 'Web Development Resources', type: LibraryItemType.LINK, topic: 'web', content: 'Curated collection of online resources for HTML, CSS, JavaScript, React, and Node.js.' },
    { title: 'Open Source Contribution Guide', type: LibraryItemType.LINK, topic: 'tools', content: 'Links to Git workflows, PR best practices, and how to find beginner-friendly open source projects.' },
  ];

  for (const item of librarySeed) {
    const exists = await itemRepo.findOne({ where: { title: item.title, universityId: primaryUniId } });
    if (exists) continue;
    const faculty = FACULTIES[['programming', 'algorithms', 'software', 'web', 'tools'].includes(item.topic) ? 5 : 0];
    await itemRepo.save(itemRepo.create({
      universityId: primaryUniId,
      title: item.title,
      description: item.content.substring(0, 120),
      type: item.type,
      faculty,
      topic: item.topic,
      content: item.content,
                  uploadedBy: createdUsers[0].id,
      viewCount: Math.floor(Math.random() * 500),
      downloadCount: Math.floor(Math.random() * 100),
      upvotes: Math.floor(Math.random() * 50),
      isVerified: true,
      access: LibraryItemAccess.PUBLIC,
      courseCode: item.topic === 'past_exam' ? 'CS' + Math.floor(Math.random() * 4000 + 1000) : null,
      createdAt: new Date(now.getTime() - Math.random() * 90 * 86400000),
    }));
  }
  console.log('  ✅ Library items seeded');

  const listings = [
    { title: 'Calculus Textbook - Stewart 8th Ed', cat: ListingCategory.TEXTBOOKS, price: 45, condition: 'good', sellerIdx: 0 },
    { title: 'MacBook Air M2 - 2025', cat: ListingCategory.ELECTRONICS, price: 850, condition: 'like_new', sellerIdx: 1 },
    { title: 'Desk Lamp LED USB', cat: ListingCategory.ELECTRONICS, price: 15, condition: 'good', sellerIdx: 0 },
    { title: 'Dorm Room Desk', cat: ListingCategory.FURNITURE, price: 60, condition: 'fair', sellerIdx: 2 },
    { title: 'Python Tutoring (Hourly)', cat: ListingCategory.SERVICES, price: 20, condition: 'new', sellerIdx: 3 },
    { title: 'Linear Algebra Textbook', cat: ListingCategory.TEXTBOOKS, price: 35, condition: 'good', sellerIdx: 1 },
    { title: 'Ergonomic Office Chair', cat: ListingCategory.FURNITURE, price: 120, condition: 'good', sellerIdx: 0 },
    { title: 'TI-84 Calculator', cat: ListingCategory.ELECTRONICS, price: 40, condition: 'good', sellerIdx: 2 },
    { title: 'Physics for Scientists & Engineers', cat: ListingCategory.TEXTBOOKS, price: 50, condition: 'like_new', sellerIdx: 3 },
    { title: 'Essay Proofreading (per page)', cat: ListingCategory.SERVICES, price: 5, condition: 'new', sellerIdx: 1 },
  ];
  const listingDescriptions: Record<string, string> = {
    'Calculus Textbook - Stewart 8th Ed': 'James Stewart Calculus 8th Edition. Excellent condition, minimal highlighting. Includes access code for online resources.',
    'MacBook Air M2 - 2025': 'Silver MacBook Air M2 13-inch 2025 model. 16GB RAM, 256GB SSD. Includes charger and case. Lightly used for 3 months.',
    'Desk Lamp LED USB': 'Adjustable LED desk lamp with USB charging port. 3 brightness levels. Perfect for late night study sessions.',
    'Dorm Room Desk': 'Simple white desk, 120cm x 60cm. Some minor scratches on top. Easy to disassemble and move.',
    'Python Tutoring (Hourly)': '3rd year CS student offering Python tutoring. Covers basics to advanced topics including data structures and web dev.',
    'Linear Algebra Textbook': 'Linear Algebra and Its Applications by Strang. 5th Edition. Clean copy with no markings.',
    'Ergonomic Office Chair': 'Mesh back ergonomic chair with lumbar support. Height adjustable. Used for one semester.',
    'TI-84 Calculator': 'TI-84 Plus graphing calculator. Working perfectly. Includes manual and charging cable.',
    'Physics for Scientists & Engineers': 'Serway & Jewett 10th Edition. Like new condition. Covers mechanics, E&M, and modern physics.',
    'Essay Proofreading (per page)': 'English major offering proofreading and editing services. Fast turnaround. References available.',
  };

  for (const item of listings) {
    const exists = await listingRepo.findOne({ where: { title: item.title, universityId: primaryUniId } });
    if (exists) continue;
    const seller = createdUsers[item.sellerIdx];
    await listingRepo.save(listingRepo.create({
      universityId: primaryUniId,
      sellerId: seller.id,
      title: item.title,
      description: listingDescriptions[item.title] ?? '',
      price: item.price,
      currency: CurrencyCode.LSL,
      category: item.cat,
      condition: item.condition,
      images: [],
      status: ListingStatus.ACTIVE,
      negotiable: true,
      location: { building: 'Science Block', area: 'Main Campus' },
      viewCount: Math.floor(Math.random() * 200),
      bookmarkCount: Math.floor(Math.random() * 20),
      createdAt: new Date(now.getTime() - Math.random() * 30 * 86400000),
    }));
  }
  console.log('  ✅ Marketplace listings seeded');

  const foodShops = [
    { name: 'Cafeteria', type: ShopType.INCAMP, location: 'Student Centre, Ground Floor', desc: 'Main campus cafeteria serving breakfast, lunch and dinner. Affordable meal plans available.', phone: '+266 2232 0601', hours: '07:00-20:00', rating: 4.0, delivery: false, fee: 0, menu: [{ name: 'Full Breakfast', price: 45 }, { name: 'Lunch Special', price: 35 }, { name: 'Veggie Wrap', price: 28 }] },
    { name: 'Mzalas', type: ShopType.INCAMP, location: 'Science Block, Room 101', desc: 'Popular student hangout serving quick meals, snacks, and beverages. Known for generous portions.', phone: '+266 5834 2211', hours: '08:00-18:00', rating: 4.5, delivery: false, fee: 0, menu: [{ name: 'Burger & Chips', price: 35 }, { name: 'Chicken Kota', price: 28 }, { name: 'Cold Drink', price: 12 }] },
    { name: "Ntate Moruti Kitchen", type: ShopType.INCAMP, location: 'Library Annex', desc: 'Home-style cooked meals by Ntate Moruti. Traditional Lesotho dishes made with love.', phone: '+266 5723 8890', hours: '06:30-22:00', rating: 4.3, delivery: false, fee: 0, menu: [{ name: 'Papa & Moroho', price: 25 }, { name: 'Chicken Stew', price: 40 }, { name: 'Vetkoek', price: 15 }] },
    { name: 'The Nile', type: ShopType.INCAMP, location: 'Sports Complex', desc: 'Continental and African cuisine. A relaxing spot for students to grab a bite between lectures.', phone: '+266 5912 3344', hours: '09:00-19:00', rating: 3.8, delivery: false, fee: 0, menu: [{ name: 'Grilled Chicken', price: 45 }, { name: 'Fried Rice', price: 30 }, { name: 'Fresh Juice', price: 18 }] },
    { name: 'OB Joint', type: ShopType.INCAMP, location: 'Near Main Gate', desc: 'The go-to spot for students. Famous for affordable meals and late-night study fuel.', phone: '+266 5912 4455', hours: '08:00-22:00', rating: 4.2, delivery: false, fee: 0, menu: [{ name: 'Kota Special', price: 30 }, { name: 'Russian Footlong', price: 25 }, { name: 'Smiley & Pap', price: 35 }] },
    { name: 'Pizza Roma', type: ShopType.OFFCAMP, location: 'Main Road, Roma Town', desc: 'Authentic Italian pizza baked in a wood-fired oven. Dine-in, takeaway, and delivery.', phone: '+266 2234 0505', hours: '10:00-22:00', rating: 4.6, delivery: true, fee: 15, menu: [{ name: 'Margherita', price: 55 }, { name: 'Pepperoni', price: 65 }, { name: 'Pasta Alfredo', price: 50 }] },
    { name: 'Taste of India', type: ShopType.OFFCAMP, location: 'Shop 4, Roma Mall', desc: 'Authentic Indian cuisine with both vegetarian and non-vegetarian options. Free delivery on orders over M100.', phone: '+266 5833 7766', hours: '11:00-21:30', rating: 4.4, delivery: true, fee: 0, menu: [{ name: 'Butter Chicken', price: 60 }, { name: 'Biryani', price: 55 }, { name: 'Naan Bread', price: 10 }] },
    { name: 'Healthy Bowl', type: ShopType.OFFCAMP, location: 'University Avenue', desc: 'Fresh salads, smoothie bowls, and health-conscious meals. Organic ingredients sourced locally.', phone: '+266 5722 4455', hours: '08:00-20:00', rating: 4.2, delivery: true, fee: 10, menu: [{ name: 'Acai Bowl', price: 45 }, { name: 'Caesar Salad', price: 38 }, { name: 'Green Smoothie', price: 25 }] },
    { name: 'Burgers & Co.', type: ShopType.OFFCAMP, location: 'Opposite Main Gate', desc: 'Gourmet burgers, loaded fries, and craft milkshakes. Student discounts every Wednesday!', phone: '+266 5911 2233', hours: '10:00-23:00', rating: 4.1, delivery: true, fee: 10, menu: [{ name: 'Double Cheeseburger', price: 50 }, { name: 'Loaded Fries', price: 25 }, { name: 'Chocolate Shake', price: 22 }] },
  ];

  for (const shop of foodShops) {
    const exists = await foodShopRepo.findOne({ where: { name: shop.name, universityId: primaryUniId } });
    if (exists) continue;
    await foodShopRepo.save(foodShopRepo.create({
      universityId: primaryUniId,
      name: shop.name,
      description: shop.desc,
      type: shop.type,
      location: shop.location,
      contactPhone: shop.phone,
      images: [],
      menu: shop.menu,
      rating: shop.rating,
      openingHours: shop.hours,
      status: ShopStatus.ACTIVE,
      deliveryAvailable: shop.delivery,
      deliveryFee: shop.fee,
    }));
  }
  console.log('  ✅ Food shops seeded');

  // ---- Cafeteria daily menus (next 7 days) ---------------------------------
  const menuRepo = dataSource.getRepository(CafeteriaMenu);
  const seededShops = await foodShopRepo.find({ where: { universityId: primaryUniId } });
  const menuTemplates: Record<string, Array<{ name: string; price: number; meal: MealType; category: string; flags: string[]; desc: string }>> = {
    cafeteria: [
      { name: 'Full Breakfast', price: 45, meal: MealType.BREAKFAST, category: 'Breakfast', flags: [], desc: 'Eggs, toast, beans and coffee' },
      { name: 'Lunch Special', price: 35, meal: MealType.LUNCH, category: 'Meals', flags: [], desc: 'Rice, chicken and vegetables' },
      { name: 'Veggie Wrap', price: 28, meal: MealType.LUNCH, category: 'Meals', flags: ['vegetarian'], desc: 'Grilled vegetables in a tortilla' },
      { name: 'Dinner Platter', price: 42, meal: MealType.DINNER, category: 'Meals', flags: [], desc: 'Papa, moroho and beef stew' },
    ],
    mzalas: [
      { name: 'Burger & Chips', price: 35, meal: MealType.LUNCH, category: 'Meals', flags: [], desc: 'Beef burger with fries' },
      { name: 'Chicken Kota', price: 28, meal: MealType.LUNCH, category: 'Meals', flags: [], desc: 'Quarter loaf with chips and chicken' },
      { name: 'Cold Drink', price: 12, meal: MealType.SNACK, category: 'Drinks', flags: [], desc: 'Chilled soft drink 330ml' },
    ],
    'ntate moruti kitchen': [
      { name: 'Papa & Moroho', price: 25, meal: MealType.LUNCH, category: 'Meals', flags: ['vegetarian'], desc: 'Traditional maize meal with greens' },
      { name: 'Chicken Stew', price: 40, meal: MealType.DINNER, category: 'Meals', flags: [], desc: 'Slow-cooked chicken stew with rice' },
      { name: 'Vetkoek', price: 15, meal: MealType.SNACK, category: 'Snacks', flags: [], desc: 'Fried dough bun' },
    ],
    'ob joint': [
      { name: 'Kota Special', price: 30, meal: MealType.LUNCH, category: 'Meals', flags: [], desc: 'Loaded quarter loaf' },
      { name: 'Russian Footlong', price: 25, meal: MealType.LUNCH, category: 'Meals', flags: [], desc: 'Russian sausage with chips' },
      { name: 'Smiley & Pap', price: 35, meal: MealType.DINNER, category: 'Meals', flags: [], desc: 'Sheep head with pap' },
    ],
  };

  let menuCreated = 0;
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    const dateIso = d.toISOString().slice(0, 10);
    for (const shop of seededShops) {
      const key = shop.name.toLowerCase();
      let template: Array<{ name: string; price: number; meal: MealType; category: string; flags: string[]; desc: string }> | undefined;
      for (const tk of Object.keys(menuTemplates)) {
        if (key.includes(tk.split(' ')[0])) {
          template = menuTemplates[tk];
          break;
        }
      }
      if (!template) continue;
      for (const item of template) {
        const exists = await menuRepo.findOne({
          where: {
            universityId: primaryUniId,
            shopId: shop.id,
            date: dateIso,
            mealType: item.meal,
            itemName: item.name,
          },
        });
        if (exists) continue;
        await menuRepo.save(
          menuRepo.create({
            universityId: primaryUniId,
            shopId: shop.id,
            shopName: shop.name,
            date: dateIso,
            mealType: item.meal,
            itemName: item.name,
            description: item.desc,
            price: item.price as any,
            currency: 'LSL',
            category: item.category,
            dietaryFlags: item.flags,
            isAvailable: true,
          }),
        );
        menuCreated++;
      }
    }
  }
  console.log(`  ✅ Cafeteria menus seeded (${menuCreated} items over 7 days)`);

  // ---- Transport / shuttle routes -----------------------------------------
  const transportRepo = dataSource.getRepository(TransportRoute);
  // NUL campus (Roma, Lesotho) approximate coordinates.
  const campusStops = [
    { name: 'Main Gate', lat: -29.4499, lng: 27.7333, order: 1 },
    { name: 'Library', lat: -29.4506, lng: 27.7351, order: 2 },
    { name: 'Science Block', lat: -29.4515, lng: 27.7368, order: 3 },
    { name: 'Student Residences', lat: -29.4528, lng: 27.7380, order: 4 },
    { name: 'Sports Complex', lat: -29.4510, lng: 27.7395, order: 5 },
    { name: 'Main Gate', lat: -29.4499, lng: 27.7333, order: 6 },
  ];
  const townStops = [
    { name: 'Campus Main Gate', lat: -29.4499, lng: 27.7333, order: 1 },
    { name: 'Roma Taxi Rank', lat: -29.4465, lng: 27.7290, order: 2 },
    { name: 'Roma Market', lat: -29.4438, lng: 27.7255, order: 3 },
    { name: 'Campus Main Gate', lat: -29.4499, lng: 27.7333, order: 4 },
  ];
  const routeSeeds = [
    {
      routeNumber: 'C1',
      routeName: 'Campus Loop',
      startLocation: 'Main Gate',
      endLocation: 'Main Gate',
      stops: campusStops,
      schedule: { weekdays: ['07:00', '07:30', '08:00', '12:00', '13:00', '17:00'], weekends: ['09:00', '15:00'] },
      vehicleType: 'Minibus',
      capacity: 22,
      fare: 0,
    },
    {
      routeNumber: 'T1',
      routeName: 'Campus ↔ Roma Town',
      startLocation: 'Campus Main Gate',
      endLocation: 'Roma Market',
      stops: townStops,
      schedule: { weekdays: ['07:15', '08:15', '12:30', '16:30', '18:00'], weekends: [] },
      vehicleType: 'Bus',
      capacity: 45,
      fare: 8,
    },
    {
      routeNumber: 'R1',
      routeName: 'Residence Express',
      startLocation: 'Student Residences',
      endLocation: 'Academic Block',
      stops: [
        { name: 'Student Residences', lat: -29.4528, lng: 27.7380, order: 1 },
        { name: 'Cafeteria', lat: -29.4512, lng: 27.7360, order: 2 },
        { name: 'Academic Block', lat: -29.4502, lng: 27.7348, order: 3 },
        { name: 'Student Residences', lat: -29.4528, lng: 27.7380, order: 4 },
      ],
      schedule: { weekdays: ['07:00', '07:20', '07:40', '08:00', '13:00'], weekends: [] },
      vehicleType: 'Shuttle',
      capacity: 14,
      fare: 0,
    },
  ];

  let routesCreated = 0;
  for (const r of routeSeeds) {
    const exists = await transportRepo.findOne({
      where: { universityId: primaryUniId, routeNumber: r.routeNumber },
    });
    if (exists) continue;
    await transportRepo.save(
      transportRepo.create({
        universityId: primaryUniId,
        routeName: r.routeName,
        routeNumber: r.routeNumber,
        startLocation: r.startLocation,
        endLocation: r.endLocation,
        stops: r.stops,
        schedule: r.schedule,
        vehicleType: r.vehicleType,
        capacity: r.capacity,
        fare: r.fare as any,
        isActive: true,
        currentLat: r.stops[0].lat as any,
        currentLng: r.stops[0].lng as any,
        lastUpdated: new Date(),
      }),
    );
    routesCreated++;
  }
  console.log(`  ✅ Transport routes seeded (${routesCreated} routes)`);

  console.log('🎉 Seed complete!');
  console.log('\nDemo credentials:');
  console.log('  Email: thabo.mokoena@nul.ls');
  console.log('  Password: CampusOS2024!');
  console.log(`  University ID: ${primaryUniId}`);

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
