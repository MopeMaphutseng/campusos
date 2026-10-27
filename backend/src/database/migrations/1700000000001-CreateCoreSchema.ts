import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoreSchema1700000000001 implements MigrationInterface {
  name = 'CreateCoreSchema1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "university_status_enum" AS ENUM ('active', 'suspended', 'onboarding', 'trial'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN CREATE TYPE "user_role_enum" AS ENUM ('student', 'faculty', 'staff', 'alumni', 'admin', 'super_admin', 'mentor', 'employer'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN CREATE TYPE "verification_status_enum" AS ENUM ('unverified', 'pending', 'verified', 'rejected'); EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "universities" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" VARCHAR(255) NOT NULL UNIQUE,
        "slug" VARCHAR(100) NOT NULL UNIQUE,
        "domain" VARCHAR(255),
        "country_code" VARCHAR(10),
        "city" VARCHAR(100),
        "logo_url" TEXT,
        "cover_image_url" TEXT,
        "status" "university_status_enum" NOT NULL DEFAULT 'onboarding',
        "branding" JSONB NOT NULL DEFAULT '{}',
        "sso_config" JSONB NOT NULL DEFAULT '{}',
        "feature_flags" JSONB NOT NULL DEFAULT '{}',
        "subscription_tier" VARCHAR(50) NOT NULL DEFAULT 'free',
        "default_language" VARCHAR(20) NOT NULL DEFAULT 'en',
        "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "email" VARCHAR(255) NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "first_name" VARCHAR(100) NOT NULL,
        "last_name" VARCHAR(100) NOT NULL,
        "student_id" VARCHAR(50),
        "avatar_url" TEXT,
        "role" "user_role_enum" NOT NULL DEFAULT 'student',
        "verification_status" "verification_status_enum" NOT NULL DEFAULT 'unverified',
        "enabled_modules" JSONB NOT NULL DEFAULT '[]',
        "preferences" JSONB NOT NULL DEFAULT '{}',
        "academic_profile" JSONB NOT NULL DEFAULT '{}',
        "phone_number" VARCHAR(20),
        "phone_country_code" VARCHAR(10),
        "phone_verified" BOOLEAN NOT NULL DEFAULT false,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "last_login_at" TIMESTAMPTZ,
        "sensitive_operation_cooldown_until" TIMESTAMPTZ,
        "failed_login_attempts" INT NOT NULL DEFAULT 0,
        "locked_until" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        UNIQUE ("university_id", "email")
      );
      CREATE INDEX IF NOT EXISTS "idx_users_university_email" ON "users" ("university_id", "email");
      CREATE INDEX IF NOT EXISTS "idx_users_university_student_id" ON "users" ("university_id", "student_id") WHERE "student_id" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "university_modules" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "module_key" VARCHAR(100) NOT NULL,
        "enabled" BOOLEAN NOT NULL DEFAULT true,
        "config" JSONB NOT NULL DEFAULT '{}',
        "limits" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        UNIQUE ("university_id", "module_key")
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "university_modules"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "universities"`);
    await queryRunner.query(`DROP TYPE "verification_status_enum"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
    await queryRunner.query(`DROP TYPE "university_status_enum"`);
  }
}
