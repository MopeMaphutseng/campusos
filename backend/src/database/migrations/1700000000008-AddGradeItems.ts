import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGradeItems1700000000008 implements MigrationInterface {
  name = 'AddGradeItems1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "grade_items_category_enum" AS ENUM ('quiz', 'assignment', 'practical', 'midterm', 'final', 'project', 'other');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "grade_items" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id") ON DELETE CASCADE,
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "enrollment_id" UUID NOT NULL REFERENCES "enrollments"("id") ON DELETE CASCADE,
        "title" VARCHAR(150) NOT NULL,
        "category" "grade_items_category_enum" NOT NULL DEFAULT 'assignment',
        "score" NUMERIC(5,2) NOT NULL,
        "max_score" NUMERIC(5,2) NOT NULL DEFAULT 100.00,
        "weight" NUMERIC(5,2) NOT NULL DEFAULT 1.00,
        "graded_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_grade_items_enrollment" ON "grade_items" ("university_id", "enrollment_id");
      CREATE INDEX IF NOT EXISTS "idx_grade_items_course" ON "grade_items" ("university_id", "course_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "grade_items" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "grade_items_category_enum"`);
  }
}
