import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContentTargets1700000000007 implements MigrationInterface {
  name = 'CreateContentTargets1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "content_targets" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "content_type" VARCHAR(40) NOT NULL,
        "content_id" UUID NOT NULL,
        "course_codes" TEXT[] NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_content_targets_unique"
        ON "content_targets" ("content_type", "content_id")
        WHERE "deleted_at" IS NULL;
      CREATE INDEX IF NOT EXISTS "idx_content_targets_type"
        ON "content_targets" ("university_id", "content_type");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "content_targets"`);
  }
}
