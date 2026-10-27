import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMarketplaceModule1700000000003 implements MigrationInterface {
  name = 'CreateMarketplaceModule1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN CREATE TYPE "listing_status_enum" AS ENUM ('active', 'sold', 'reserved', 'removed', 'flagged'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN CREATE TYPE "listing_condition_enum" AS ENUM ('new', 'like_new', 'good', 'fair', 'poor'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      DO $$ BEGIN CREATE TYPE "report_status_enum" AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed'); EXCEPTION WHEN duplicate_object THEN null; END $$;

      CREATE TABLE IF NOT EXISTS "marketplace_listings" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "seller_id" UUID NOT NULL REFERENCES "users"("id"),
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "category" VARCHAR(50) NOT NULL,
        "price" DECIMAL(10,2) NOT NULL,
        "currency" VARCHAR(3) NOT NULL DEFAULT 'LSL',
        "condition" "listing_condition_enum" NOT NULL DEFAULT 'good',
        "images" JSONB NOT NULL DEFAULT '[]',
        "status" "listing_status_enum" NOT NULL DEFAULT 'active',
        "views" INT NOT NULL DEFAULT 0,
        "is_negotiable" BOOLEAN NOT NULL DEFAULT true,
        "location_detail" VARCHAR(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_listings_university" ON "marketplace_listings" ("university_id");
      CREATE INDEX IF NOT EXISTS "idx_listings_category" ON "marketplace_listings" ("university_id", "category");

      CREATE TABLE IF NOT EXISTS "marketplace_reviews" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "reviewer_id" UUID NOT NULL REFERENCES "users"("id"),
        "reviewed_id" UUID NOT NULL REFERENCES "users"("id"),
        "listing_id" UUID REFERENCES "marketplace_listings"("id"),
        "rating" INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        "comment" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "reports" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "reporter_id" UUID NOT NULL REFERENCES "users"("id"),
        "target_type" VARCHAR(50) NOT NULL,
        "target_id" UUID NOT NULL,
        "reason" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "status" "report_status_enum" NOT NULL DEFAULT 'pending',
        "assigned_to" UUID REFERENCES "users"("id"),
        "resolved_at" TIMESTAMPTZ,
        "resolution_notes" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "scholarships" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "title" VARCHAR(255) NOT NULL,
        "provider" VARCHAR(200) NOT NULL,
        "country" VARCHAR(100),
        "degree_level" VARCHAR(50),
        "funding_percentage" INT,
        "amount" DECIMAL(12,2),
        "currency" VARCHAR(3) DEFAULT 'USD',
        "deadline" TIMESTAMPTZ,
        "faculty" VARCHAR(100),
        "description" TEXT,
        "requirements" TEXT,
        "application_url" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "job_listings" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "employer_id" UUID REFERENCES "users"("id"),
        "title" VARCHAR(255) NOT NULL,
        "company" VARCHAR(200) NOT NULL,
        "description" TEXT,
        "location" VARCHAR(200),
        "type" VARCHAR(30) NOT NULL DEFAULT 'full_time',
        "salary_min" DECIMAL(10,2),
        "salary_max" DECIMAL(10,2),
        "currency" VARCHAR(3) DEFAULT 'USD',
        "skills" JSONB NOT NULL DEFAULT '[]',
        "is_remote" BOOLEAN NOT NULL DEFAULT false,
        "deadline" TIMESTAMPTZ,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "innovation_projects" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "owner_id" UUID NOT NULL REFERENCES "users"("id"),
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "category" VARCHAR(50) NOT NULL,
        "media" JSONB NOT NULL DEFAULT '[]',
        "team_members" JSONB NOT NULL DEFAULT '[]',
        "funding_ask" DECIMAL(12,2),
        "currency" VARCHAR(3) DEFAULT 'USD',
        "status" VARCHAR(30) NOT NULL DEFAULT 'active',
        "is_featured" BOOLEAN NOT NULL DEFAULT false,
        "stars_count" INT NOT NULL DEFAULT 0,
        "verified_badge" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "research_calls" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "supervisor_id" UUID REFERENCES "users"("id"),
        "title" VARCHAR(255) NOT NULL,
        "field" VARCHAR(100) NOT NULL,
        "description" TEXT,
        "type" VARCHAR(30) NOT NULL DEFAULT 'research_assistant',
        "deadline" TIMESTAMPTZ,
        "is_open" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "tutor_sessions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "user_id" UUID NOT NULL REFERENCES "users"("id"),
        "course_id" UUID REFERENCES "courses"("id"),
        "integrity_mode" VARCHAR(30) NOT NULL DEFAULT 'full_assist',
        "messages" JSONB NOT NULL DEFAULT '[]',
        "total_tokens_used" INT NOT NULL DEFAULT 0,
        "provider" VARCHAR(20),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "health_appointments" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "patient_id" UUID NOT NULL REFERENCES "users"("id"),
        "provider_name" VARCHAR(200),
        "appointment_type" VARCHAR(50) NOT NULL,
        "scheduled_at" TIMESTAMPTZ NOT NULL,
        "status" VARCHAR(20) NOT NULL DEFAULT 'scheduled',
        "notes" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "analytics_events" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "event_type" VARCHAR(100) NOT NULL,
        "user_id" UUID REFERENCES "users"("id"),
        "module" VARCHAR(50),
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS "idx_analytics_university" ON "analytics_events" ("university_id", "event_type");

      CREATE TABLE IF NOT EXISTS "transactions" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "user_id" UUID NOT NULL REFERENCES "users"("id"),
        "amount" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(3) NOT NULL DEFAULT 'LSL',
        "provider" VARCHAR(30) NOT NULL,
        "provider_txn_id" VARCHAR(255),
        "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
        "type" VARCHAR(30) NOT NULL,
        "description" TEXT,
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TABLE "analytics_events"`);
    await queryRunner.query(`DROP TABLE "health_appointments"`);
    await queryRunner.query(`DROP TABLE "tutor_sessions"`);
    await queryRunner.query(`DROP TABLE "research_calls"`);
    await queryRunner.query(`DROP TABLE "innovation_projects"`);
    await queryRunner.query(`DROP TABLE "job_listings"`);
    await queryRunner.query(`DROP TABLE "scholarships"`);
    await queryRunner.query(`DROP TABLE "reports"`);
    await queryRunner.query(`DROP TABLE "marketplace_reviews"`);
    await queryRunner.query(`DROP TABLE "marketplace_listings"`);
    await queryRunner.query(`DROP TYPE "report_status_enum"`);
    await queryRunner.query(`DROP TYPE "listing_condition_enum"`);
    await queryRunner.query(`DROP TYPE "listing_status_enum"`);
  }
}
