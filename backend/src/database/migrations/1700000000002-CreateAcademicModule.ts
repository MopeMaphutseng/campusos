import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAcademicModule1700000000002 implements MigrationInterface {
  name = 'CreateAcademicModule1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "courses" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "code" VARCHAR(20) NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "faculty" VARCHAR(100),
        "department" VARCHAR(100),
        "credits" INT NOT NULL DEFAULT 3,
        "semester" VARCHAR(20),
        "year" INT,
        "professor_name" VARCHAR(200),
        "professor_id" UUID,
        "schedule" JSONB NOT NULL DEFAULT '{}',
        "capacity" INT DEFAULT 60,
        "enrolled_count" INT DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        UNIQUE ("university_id", "code")
      );
      CREATE INDEX "idx_courses_university" ON "courses" ("university_id");

      CREATE TABLE "enrollments" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "user_id" UUID NOT NULL REFERENCES "users"("id"),
        "course_id" UUID NOT NULL REFERENCES "courses"("id"),
        "status" VARCHAR(20) NOT NULL DEFAULT 'enrolled',
        "enrolled_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "dropped_at" TIMESTAMPTZ,
        "grade" VARCHAR(5),
        "grade_points" DECIMAL(4,2),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("university_id", "user_id", "course_id")
      );

      CREATE TABLE "timetable_entries" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "course_id" UUID NOT NULL REFERENCES "courses"("id"),
        "day_of_week" INT NOT NULL,
        "start_time" TIME NOT NULL,
        "end_time" TIME NOT NULL,
        "room" VARCHAR(50),
        "building" VARCHAR(100),
        "type" VARCHAR(20) NOT NULL DEFAULT 'lecture',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "timetable_entries"`);
    await queryRunner.query(`DROP TABLE "enrollments"`);
    await queryRunner.query(`DROP TABLE "courses"`);
  }
}
