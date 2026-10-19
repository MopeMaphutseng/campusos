import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailVerifications1700000000006 implements MigrationInterface {
  name = 'CreateEmailVerifications1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "email_verifications_purpose_enum" AS ENUM ('email_verification', 'password_reset');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "email_verifications" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "user_id" UUID NOT NULL,
        "email" VARCHAR(254) NOT NULL,
        "purpose" "email_verifications_purpose_enum" NOT NULL DEFAULT 'email_verification',
        "code_hash" VARCHAR(128) NOT NULL,
        "attempts" INT NOT NULL DEFAULT 0,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "last_sent_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_email_verifications_user_purpose"
        ON "email_verifications" ("user_id", "purpose");
      CREATE INDEX IF NOT EXISTS "idx_email_verifications_university_email"
        ON "email_verifications" ("university_id", "email");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "email_verifications" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "email_verifications_purpose_enum"`);
  }
}
