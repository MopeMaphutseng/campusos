import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCourseMaterials1700000000011 implements MigrationInterface {
  name = 'AddCourseMaterials1700000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "course_materials" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id") ON DELETE CASCADE,
        "course_id" UUID NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
        "course_code" VARCHAR(20) NOT NULL,
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "category" VARCHAR(50) NOT NULL DEFAULT 'other',
        "file_name" VARCHAR(255) NOT NULL,
        "file_url" TEXT NOT NULL,
        "mime_type" VARCHAR(120),
        "size_bytes" INTEGER NOT NULL DEFAULT 0,
        "checksum" VARCHAR(64),
        "uploaded_by" UUID REFERENCES "users"("id") ON DELETE SET NULL,
        "download_count" INTEGER NOT NULL DEFAULT 0,
        "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );

      CREATE INDEX IF NOT EXISTS "idx_course_materials_course"
        ON "course_materials" ("university_id", "course_id");
      CREATE INDEX IF NOT EXISTS "idx_course_materials_category"
        ON "course_materials" ("university_id", "category");
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_course_materials_checksum"
        ON "course_materials" ("university_id", "checksum")
        WHERE "deleted_at" IS NULL AND "checksum" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "course_materials" CASCADE`);
  }
}
