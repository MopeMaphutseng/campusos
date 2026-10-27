import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The academic entities were expanded after the original schema migration
 * (course levels/status/metadata, enrollment sections/letter grades, etc.).
 * Some environments picked these up through a synchronize run, but a freshly
 * migrated database was missing them. This migration makes the two paths
 * converge without touching existing data.
 */
export class EnsureAcademicColumns1700000000012 implements MigrationInterface {
  name = 'EnsureAcademicColumns1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "courses"
        ADD COLUMN IF NOT EXISTS "level" VARCHAR(50),
        ADD COLUMN IF NOT EXISTS "max_capacity" INTEGER DEFAULT 60,
        ADD COLUMN IF NOT EXISTS "academic_year" VARCHAR(20),
        ADD COLUMN IF NOT EXISTS "instructor_id" UUID,
        ADD COLUMN IF NOT EXISTS "status" VARCHAR(50) DEFAULT 'published',
        ADD COLUMN IF NOT EXISTS "prerequisites" JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}'::jsonb;

      ALTER TABLE "courses" ALTER COLUMN "credits" SET DEFAULT 3;

      ALTER TABLE "enrollments"
        ADD COLUMN IF NOT EXISTS "section" VARCHAR(50),
        ADD COLUMN IF NOT EXISTS "letter_grade" VARCHAR(5),
        ADD COLUMN IF NOT EXISTS "completed_at" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;
    `);
  }

  public async down(): Promise<void> {
    // Additive, data-preserving migration: intentionally no-op.
  }
}
