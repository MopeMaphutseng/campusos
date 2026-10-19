describe('Module Structure', () => {
  const requiredModules = [
    'academics',
    'admin',
    'ai-tutor',
    'alumni',
    'auth',
    'campus-life',
    'dashboard',
    'health',
    'innovation-hub',
    'jobs',
    'library',
    'marketplace',
    'mentorship',
    'messaging',
    'news',
    'notifications',
    'payments',
    'research-hub',
    'scholarships',
    'sms-ussd',
    'sports',
    'tenants',
    'trust-safety',
    'verifiable-credentials',
  ];

  it('should have all 24 backend modules', () => {
    const fs = require('fs');
    const path = require('path');
    const modulesDir = path.join(__dirname, '..', '..', 'modules');
    const actualModules = fs.readdirSync(modulesDir).filter((f: string) => {
      const stat = fs.statSync(path.join(modulesDir, f));
      return stat.isDirectory();
    });
    expect(actualModules.sort()).toEqual(requiredModules.sort());
  });

  const requiredEntities = [
    'academics/entities/course.entity.ts',
    'academics/entities/enrollment.entity.ts',
    'academics/entities/timetable.entity.ts',
    'admin/entities/analytics-event.entity.ts',
    'ai-tutor/entities/tutor-session.entity.ts',
    'alumni/entities/alumni-profile.entity.ts',
    'campus-life/entities/cafeteria-order.entity.ts',
    'campus-life/entities/campus-map.entity.ts',
    'campus-life/entities/club.entity.ts',
    'campus-life/entities/hostel.entity.ts',
    'campus-life/entities/print-service.entity.ts',
    'campus-life/entities/transport-route.entity.ts',
    'health/entities/health-appointment.entity.ts',
    'innovation-hub/entities/project.entity.ts',
    'jobs/entities/job-listing.entity.ts',
    'library/entities/library-category.entity.ts',
    'library/entities/library-item.entity.ts',
    'marketplace/entities/listing.entity.ts',
    'marketplace/entities/review.entity.ts',
    'mentorship/entities/booking.entity.ts',
    'mentorship/entities/mentor-profile.entity.ts',
    'messaging/entities/conversation.entity.ts',
    'messaging/entities/message.entity.ts',
    'news/entities/news-article.entity.ts',
    'news/entities/startup-hub-entry.entity.ts',
    'notifications/entities/notification.entity.ts',
    'payments/entities/escrow.entity.ts',
    'payments/entities/transaction.entity.ts',
    'research-hub/entities/research-call.entity.ts',
    'scholarships/entities/scholarship.entity.ts',
    'sports/entities/match.entity.ts',
    'tenants/entities/university.entity.ts',
    'tenants/entities/user.entity.ts',
    'tenants/entities/university-module.entity.ts',
    'trust-safety/entities/report.entity.ts',
    'verifiable-credentials/entities/credential.entity.ts',
  ];

  it('should have all entity files', () => {
    const fs = require('fs');
    const path = require('path');
    const missing = requiredEntities.filter((entityPath) => {
      const fullPath = path.join(__dirname, '..', '..', 'modules', entityPath);
      return !fs.existsSync(fullPath);
    });
    expect(missing).toEqual([]);
  });

  const requiredMigrations = [
    '1700000000001-CreateCoreSchema.ts',
    '1700000000002-CreateAcademicModule.ts',
    '1700000000003-CreateAllModuleTables.ts',
    '1700000000004-CreateRemainingModuleTables.ts',
  ];

  it('should have all migration files', () => {
    const fs = require('fs');
    const path = require('path');
    const migrationsDir = path.join(__dirname, '..', '..', 'database', 'migrations');
    const actualMigrations = fs.readdirSync(migrationsDir);
    requiredMigrations.forEach((m) => {
      expect(actualMigrations).toContain(m);
    });
  });
});
