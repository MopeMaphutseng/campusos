import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiTutorSessions1700000000005 implements MigrationInterface {
  name = 'CreateAiTutorSessions1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "ai_tutor_sessions_mode_enum" AS ENUM ('study', 'exam', 'explain', 'flashcards', 'quiz');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "ai_tutor_sessions_integrity_mode_enum" AS ENUM ('strict', 'normal', 'open');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ai_tutor_sessions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "user_id" UUID NOT NULL,
        "course_id" UUID,
        "course_code" VARCHAR(50),
        "mode" "ai_tutor_sessions_mode_enum" NOT NULL DEFAULT 'study',
        "integrity_mode" "ai_tutor_sessions_integrity_mode_enum" NOT NULL DEFAULT 'normal',
        "messages" JSONB NOT NULL DEFAULT '[]',
        "total_tokens" INT NOT NULL DEFAULT 0,
        "message_count" INT NOT NULL DEFAULT 0,
        "system_prompt" TEXT,
        "sources" JSONB NOT NULL DEFAULT '[]',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "duration_seconds" INT,
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_ai_tutor_sessions_university_user" ON "ai_tutor_sessions" ("university_id", "user_id");
      CREATE INDEX IF NOT EXISTS "idx_ai_tutor_sessions_university_course" ON "ai_tutor_sessions" ("university_id", "course_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_tutor_sessions" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ai_tutor_sessions_mode_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ai_tutor_sessions_integrity_mode_enum"`);
  }
}
