import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRemainingModuleTables1700000000004 implements MigrationInterface {
  name = 'CreateRemainingModuleTables1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "club_category_enum" AS ENUM ('academic', 'social', 'sports', 'cultural', 'religious', 'professional');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "map_location_type_enum" AS ENUM ('academic', 'residential', 'dining', 'sports', 'library', 'admin', 'parking', 'health', 'transport', 'other');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "cafeteria_order_status_enum" AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "hostel_status_enum" AS ENUM ('available', 'full', 'maintenance', 'closed');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "news_category_enum" AS ENUM ('campus', 'academic', 'sports', 'events', 'achievements', 'international');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "startup_stage_enum" AS ENUM ('idea', 'mvp', 'growth', 'established');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "mentor_status_enum" AS ENUM ('available', 'busy', 'offline', 'paused');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "booking_status_enum" AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "sport_type_enum" AS ENUM ('football', 'basketball', 'cricket', 'rugby', 'volleyball', 'athletics', 'tennis', 'swimming', 'chess', 'other');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "match_status_enum" AS ENUM ('scheduled', 'live', 'completed', 'postponed', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "library_item_type_enum" AS ENUM ('textbook', 'notes', 'video', 'document', 'link', 'ai_generated');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "library_item_access_enum" AS ENUM ('public', 'course_only', 'faculty_only');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "escrow_status_enum" AS ENUM ('held', 'released', 'refunded', 'disputed', 'expired');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "conversation_type_enum" AS ENUM ('direct', 'group', 'channel');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "message_type_enum" AS ENUM ('text', 'image', 'file', 'system', 'audio');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "message_status_enum" AS ENUM ('sent', 'delivered', 'read', 'deleted');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "notification_type_enum" AS ENUM ('push', 'in_app', 'email', 'sms');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "notification_priority_enum" AS ENUM ('low', 'normal', 'high', 'urgent');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "credential_type_enum" AS ENUM ('badge', 'certificate', 'transcript', 'enrollment_proof', 'skill', 'achievement');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "credential_status_enum" AS ENUM ('active', 'revoked', 'expired');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`

      -- ============================================
      -- CLUBS
      -- ============================================
      CREATE TABLE IF NOT EXISTS "clubs" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "category" "club_category_enum" NOT NULL DEFAULT 'social',
        "president_id" UUID,
        "member_count" INT NOT NULL DEFAULT 0,
        "meeting_schedule" VARCHAR(255),
        "meeting_location" VARCHAR(255),
        "contact_email" VARCHAR(255),
        "logo_url" TEXT,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_clubs_university_category" ON "clubs" ("university_id", "category");
      CREATE INDEX IF NOT EXISTS "idx_clubs_university_active" ON "clubs" ("university_id", "is_active");

      -- ============================================
      -- TRANSPORT ROUTES
      -- ============================================
      CREATE TABLE IF NOT EXISTS "transport_routes" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "route_name" VARCHAR(255) NOT NULL,
        "route_number" VARCHAR(50) NOT NULL,
        "start_location" VARCHAR(255) NOT NULL,
        "end_location" VARCHAR(255) NOT NULL,
        "stops" JSONB NOT NULL DEFAULT '[]',
        "schedule" JSONB NOT NULL DEFAULT '{}',
        "vehicle_type" VARCHAR(50),
        "capacity" INT NOT NULL DEFAULT 0,
        "fare" DECIMAL(8,2) NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "current_lat" DECIMAL(10,7),
        "current_lng" DECIMAL(10,7),
        "last_updated" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_transport_university_active" ON "transport_routes" ("university_id", "is_active");

      -- ============================================
      -- PRINT SERVICES
      -- ============================================
      CREATE TABLE IF NOT EXISTS "print_services" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "shop_name" VARCHAR(255) NOT NULL,
        "location" VARCHAR(255),
        "building" VARCHAR(100),
        "services" JSONB NOT NULL DEFAULT '[]',
        "operating_hours" JSONB NOT NULL DEFAULT '{}',
        "contact_phone" VARCHAR(50),
        "estimated_wait_time" VARCHAR(50),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_print_university_active" ON "print_services" ("university_id", "is_active");

      -- ============================================
      -- CAMPUS MAP LOCATIONS
      -- ============================================
      CREATE TABLE IF NOT EXISTS "campus_map_locations" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "type" "map_location_type_enum" NOT NULL,
        "latitude" DECIMAL(10,7) NOT NULL,
        "longitude" DECIMAL(10,7) NOT NULL,
        "address" VARCHAR(255),
        "building" VARCHAR(100),
        "floor" VARCHAR(50),
        "room" VARCHAR(50),
        "image_url" TEXT,
        "opening_hours" JSONB NOT NULL DEFAULT '{}',
        "amenities" JSONB NOT NULL DEFAULT '[]',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_campus_map_university_type" ON "campus_map_locations" ("university_id", "type");

      -- ============================================
      -- CAFETERIA ORDERS
      -- ============================================
      CREATE TABLE IF NOT EXISTS "cafeteria_orders" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "user_id" UUID NOT NULL REFERENCES "users"("id"),
        "cafeteria_name" VARCHAR(255),
        "items" JSONB NOT NULL DEFAULT '[]',
        "total_amount" DECIMAL(10,2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
        "status" "cafeteria_order_status_enum" NOT NULL DEFAULT 'pending',
        "pickup_location" VARCHAR(50),
        "estimated_ready_at" TIMESTAMPTZ,
        "completed_at" TIMESTAMPTZ,
        "special_instructions" TEXT,
        "payment_method" VARCHAR(50),
        "is_paid" BOOLEAN NOT NULL DEFAULT false,
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_cafeteria_university_user" ON "cafeteria_orders" ("university_id", "user_id");
      CREATE INDEX IF NOT EXISTS "idx_cafeteria_university_status" ON "cafeteria_orders" ("university_id", "status");

      -- ============================================
      -- HOSTELS
      -- ============================================
      CREATE TABLE IF NOT EXISTS "hostels" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "status" "hostel_status_enum" NOT NULL DEFAULT 'available',
        "gender" VARCHAR(50),
        "total_beds" INT NOT NULL DEFAULT 0,
        "available_beds" INT NOT NULL DEFAULT 0,
        "price_per_semester" DECIMAL(10,2),
        "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
        "location" VARCHAR(100),
        "latitude" DECIMAL(10,7),
        "longitude" DECIMAL(10,7),
        "amenities" JSONB NOT NULL DEFAULT '[]',
        "image_url" TEXT,
        "images" JSONB NOT NULL DEFAULT '[]',
        "total_rooms" INT NOT NULL DEFAULT 0,
        "room_types" JSONB NOT NULL DEFAULT '{}',
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_hostels_university_status" ON "hostels" ("university_id", "status");

      -- ============================================
      -- ALUMNI PROFILES
      -- ============================================
      CREATE TABLE IF NOT EXISTS "alumni_profiles" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "user_id" UUID NOT NULL REFERENCES "users"("id"),
        "graduation_year" INT NOT NULL,
        "faculty" VARCHAR(255),
        "department" VARCHAR(255) NOT NULL,
        "degree" VARCHAR(255) NOT NULL,
        "current_company" VARCHAR(255),
        "current_position" VARCHAR(255),
        "industry" VARCHAR(255),
        "linkedin_url" TEXT,
        "bio" TEXT,
        "expertise" JSONB NOT NULL DEFAULT '[]',
        "is_mentor" BOOLEAN NOT NULL DEFAULT false,
        "available_for_mentoring" BOOLEAN NOT NULL DEFAULT false,
        "mentorship_capacity" INT NOT NULL DEFAULT 0,
        "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
        "total_mentee_sessions" INT NOT NULL DEFAULT 0,
        "years_of_experience" INT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        UNIQUE ("university_id", "user_id")
      );
      CREATE INDEX IF NOT EXISTS "idx_alumni_university_industry" ON "alumni_profiles" ("university_id", "industry");
      CREATE INDEX IF NOT EXISTS "idx_alumni_university_graduation" ON "alumni_profiles" ("university_id", "graduation_year");
      CREATE INDEX IF NOT EXISTS "idx_alumni_university_mentor" ON "alumni_profiles" ("university_id", "is_mentor");

      -- ============================================
      -- NEWS ARTICLES
      -- ============================================
      CREATE TABLE IF NOT EXISTS "news_articles" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "title" VARCHAR(255) NOT NULL,
        "content" TEXT NOT NULL,
        "summary" TEXT,
        "author_id" UUID NOT NULL REFERENCES "users"("id"),
        "author_name" VARCHAR(255),
        "category" "news_category_enum" NOT NULL DEFAULT 'campus',
        "image_url" TEXT,
        "tags" JSONB NOT NULL DEFAULT '[]',
        "is_published" BOOLEAN NOT NULL DEFAULT false,
        "published_at" TIMESTAMPTZ,
        "view_count" INT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_news_university_category" ON "news_articles" ("university_id", "category");
      CREATE INDEX IF NOT EXISTS "idx_news_university_published" ON "news_articles" ("university_id", "is_published");
      CREATE INDEX IF NOT EXISTS "idx_news_university_published_at" ON "news_articles" ("university_id", "published_at");

      -- ============================================
      -- STARTUP HUB ENTRIES
      -- ============================================
      CREATE TABLE IF NOT EXISTS "startup_hub_entries" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT NOT NULL,
        "founder_id" UUID NOT NULL REFERENCES "users"("id"),
        "founder_name" VARCHAR(255),
        "category" VARCHAR(100),
        "stage" "startup_stage_enum" NOT NULL DEFAULT 'idea',
        "funding_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "team_size" INT NOT NULL DEFAULT 1,
        "website_url" TEXT,
        "logo_url" TEXT,
        "is_featured" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_startup_university_stage" ON "startup_hub_entries" ("university_id", "stage");
      CREATE INDEX IF NOT EXISTS "idx_startup_university_category" ON "startup_hub_entries" ("university_id", "category");

      -- ============================================
      -- MENTOR PROFILES
      -- ============================================
      CREATE TABLE IF NOT EXISTS "mentor_profiles" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "user_id" UUID NOT NULL REFERENCES "users"("id"),
        "bio" TEXT,
        "expertise" JSONB NOT NULL DEFAULT '[]',
        "tags" JSONB NOT NULL DEFAULT '[]',
        "total_sessions" INT NOT NULL DEFAULT 0,
        "average_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
        "review_count" INT NOT NULL DEFAULT 0,
        "availability" JSONB NOT NULL DEFAULT '{}',
        "status" "mentor_status_enum" NOT NULL DEFAULT 'available',
        "max_mentees" INT NOT NULL DEFAULT 10,
        "current_mentees" INT NOT NULL DEFAULT 0,
        "social_links" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        UNIQUE ("university_id", "user_id")
      );
      CREATE INDEX IF NOT EXISTS "idx_mentor_university_status" ON "mentor_profiles" ("university_id", "status");

      -- ============================================
      -- MENTORSHIP BOOKINGS
      -- ============================================
      CREATE TABLE IF NOT EXISTS "mentorship_bookings" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "mentor_id" UUID NOT NULL REFERENCES "users"("id"),
        "mentee_id" UUID NOT NULL REFERENCES "users"("id"),
        "scheduled_at" TIMESTAMPTZ NOT NULL,
        "duration_minutes" INT NOT NULL DEFAULT 60,
        "meeting_type" VARCHAR(50),
        "meeting_link" TEXT,
        "status" "booking_status_enum" NOT NULL DEFAULT 'pending',
        "topic" TEXT,
        "notes" TEXT,
        "cancel_reason" TEXT,
        "mentee_rating" INT,
        "mentee_feedback" TEXT,
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_booking_university_mentor" ON "mentorship_bookings" ("university_id", "mentor_id");
      CREATE INDEX IF NOT EXISTS "idx_booking_university_mentee" ON "mentorship_bookings" ("university_id", "mentee_id");
      CREATE INDEX IF NOT EXISTS "idx_booking_university_status" ON "mentorship_bookings" ("university_id", "status");

      -- ============================================
      -- SPORTS MATCHES
      -- ============================================
      CREATE TABLE IF NOT EXISTS "sports_matches" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "sport" "sport_type_enum" NOT NULL,
        "home_team" VARCHAR(255) NOT NULL,
        "away_team" VARCHAR(255) NOT NULL,
        "home_score" INT,
        "away_score" INT,
        "status" "match_status_enum" NOT NULL DEFAULT 'scheduled',
        "scheduled_at" TIMESTAMPTZ NOT NULL,
        "started_at" TIMESTAMPTZ,
        "completed_at" TIMESTAMPTZ,
        "venue" VARCHAR(100),
        "league" VARCHAR(50),
        "season" VARCHAR(50),
        "round" VARCHAR(50),
        "events" JSONB NOT NULL DEFAULT '[]',
        "is_live_tracked" BOOLEAN NOT NULL DEFAULT false,
        "viewer_count" INT NOT NULL DEFAULT 0,
        "stream_url" TEXT,
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_sports_university_status" ON "sports_matches" ("university_id", "status");
      CREATE INDEX IF NOT EXISTS "idx_sports_university_sport" ON "sports_matches" ("university_id", "sport");
      CREATE INDEX IF NOT EXISTS "idx_sports_university_scheduled" ON "sports_matches" ("university_id", "scheduled_at");

      -- ============================================
      -- LIBRARY CATEGORIES
      -- ============================================
      CREATE TABLE IF NOT EXISTS "library_categories" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "parent_id" UUID,
        "sort_order" INT NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "icon" VARCHAR(50),
        "item_count" INT NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );

      -- ============================================
      -- LIBRARY ITEMS
      -- ============================================
      CREATE TABLE IF NOT EXISTS "library_items" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "type" "library_item_type_enum" NOT NULL,
        "category_id" UUID REFERENCES "library_categories"("id"),
        "course_id" UUID REFERENCES "courses"("id"),
        "course_code" VARCHAR(100),
        "faculty" VARCHAR(100) NOT NULL,
        "topic" VARCHAR(100),
        "file_url" TEXT,
        "external_url" TEXT,
        "content" TEXT,
        "uploaded_by" UUID NOT NULL REFERENCES "users"("id"),
        "view_count" INT NOT NULL DEFAULT 0,
        "download_count" INT NOT NULL DEFAULT 0,
        "upvotes" INT NOT NULL DEFAULT 0,
        "downvotes" INT NOT NULL DEFAULT 0,
        "access" "library_item_access_enum" NOT NULL DEFAULT 'public',
        "is_verified" BOOLEAN NOT NULL DEFAULT false,
        "ai_summary" JSONB NOT NULL DEFAULT '{}',
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_library_university_course" ON "library_items" ("university_id", "course_id");
      CREATE INDEX IF NOT EXISTS "idx_library_university_faculty" ON "library_items" ("university_id", "faculty");
      CREATE INDEX IF NOT EXISTS "idx_library_university_topic" ON "library_items" ("university_id", "topic") WHERE "topic" IS NOT NULL;

      -- ============================================
      -- ESCROW HOLDINGS
      -- ============================================
      CREATE TABLE IF NOT EXISTS "escrow_holdings" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "transaction_id" UUID NOT NULL,
        "buyer_id" UUID NOT NULL REFERENCES "users"("id"),
        "seller_id" UUID NOT NULL REFERENCES "users"("id"),
        "amount" DECIMAL(12,2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'USD',
        "status" "escrow_status_enum" NOT NULL DEFAULT 'held',
        "platform_fee" DECIMAL(12,2) NOT NULL,
        "seller_payout" DECIMAL(12,2) NOT NULL,
        "release_transaction_id" VARCHAR(255),
        "expires_at" TIMESTAMPTZ NOT NULL,
        "released_at" TIMESTAMPTZ,
        "refunded_at" TIMESTAMPTZ,
        "dispute_reason" TEXT,
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ,
        UNIQUE ("university_id", "transaction_id")
      );
      CREATE INDEX IF NOT EXISTS "idx_escrow_university_status" ON "escrow_holdings" ("university_id", "status");
      CREATE INDEX IF NOT EXISTS "idx_escrow_university_buyer" ON "escrow_holdings" ("university_id", "buyer_id");
      CREATE INDEX IF NOT EXISTS "idx_escrow_university_seller" ON "escrow_holdings" ("university_id", "seller_id");
      CREATE INDEX IF NOT EXISTS "idx_escrow_university_expires" ON "escrow_holdings" ("university_id", "expires_at");

      -- ============================================
      -- CONVERSATIONS (recreated with full schema)
      -- ============================================
      CREATE TABLE IF NOT EXISTS "conversations" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "type" "conversation_type_enum" NOT NULL DEFAULT 'direct',
        "name" VARCHAR(255),
        "participant_ids" JSONB NOT NULL DEFAULT '[]',
        "created_by" UUID REFERENCES "users"("id"),
        "last_message_preview" TEXT,
        "last_message_at" TIMESTAMPTZ,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_conversations_university_type" ON "conversations" ("university_id", "type");

      -- ============================================
      -- MESSAGES (recreated with full schema)
      -- ============================================
      CREATE TABLE IF NOT EXISTS "messages" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "conversation_id" UUID NOT NULL REFERENCES "conversations"("id"),
        "sender_id" UUID NOT NULL REFERENCES "users"("id"),
        "type" "message_type_enum" NOT NULL DEFAULT 'text',
        "content" TEXT NOT NULL,
        "status" "message_status_enum" NOT NULL DEFAULT 'sent',
        "file_url" TEXT,
        "file_name" VARCHAR(255),
        "file_size" INT,
        "reply_to_id" UUID,
        "read_by" JSONB NOT NULL DEFAULT '[]',
        "is_edited" BOOLEAN NOT NULL DEFAULT false,
        "edited_at" TIMESTAMPTZ,
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_messages_university_conversation" ON "messages" ("university_id", "conversation_id");
      CREATE INDEX IF NOT EXISTS "idx_messages_university_sender" ON "messages" ("university_id", "sender_id");
      CREATE INDEX IF NOT EXISTS "idx_messages_university_conv_created" ON "messages" ("university_id", "conversation_id", "created_at");

      -- ============================================
      -- NOTIFICATIONS (recreated with full schema)
      -- ============================================
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id"),
        "user_id" UUID NOT NULL REFERENCES "users"("id"),
        "type" "notification_type_enum" NOT NULL DEFAULT 'in_app',
        "title" VARCHAR(255) NOT NULL,
        "body" TEXT NOT NULL,
        "module" VARCHAR(100),
        "action_type" VARCHAR(50),
        "action_url" TEXT,
        "priority" "notification_priority_enum" NOT NULL DEFAULT 'normal',
        "data" JSONB NOT NULL DEFAULT '{}',
        "image_url" TEXT,
        "read" BOOLEAN NOT NULL DEFAULT false,
        "read_at" TIMESTAMPTZ,
        "sent" BOOLEAN NOT NULL DEFAULT false,
        "sent_at" TIMESTAMPTZ,
        "external_id" VARCHAR(255),
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_notifications_university_user" ON "notifications" ("university_id", "user_id");
      CREATE INDEX IF NOT EXISTS "idx_notifications_university_user_read" ON "notifications" ("university_id", "user_id", "read_at");
      CREATE INDEX IF NOT EXISTS "idx_notifications_university_type" ON "notifications" ("university_id", "type");

      -- ============================================
      -- VERIFIABLE CREDENTIALS (recreated with full schema)
      -- ============================================
      CREATE TABLE IF NOT EXISTS "verifiable_credentials" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID REFERENCES "universities"("id"),
        "holder_id" UUID NOT NULL REFERENCES "users"("id"),
        "type" "credential_type_enum" NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "description" TEXT,
        "issuance_date" TEXT NOT NULL,
        "expiration_date" TEXT,
        "status" "credential_status_enum" NOT NULL DEFAULT 'active',
        "credential_subject" TEXT NOT NULL,
        "proof" TEXT,
        "issuer_did" VARCHAR(255) NOT NULL,
        "holder_did" TEXT,
        "credential_url" TEXT,
        "course_code" VARCHAR(100),
        "skill" VARCHAR(100),
        "score" DECIMAL(5,2),
        "metadata" JSONB NOT NULL DEFAULT '{}',
        "qr_code_data" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_vc_university_holder" ON "verifiable_credentials" ("university_id", "holder_id");
      CREATE INDEX IF NOT EXISTS "idx_vc_university_type" ON "verifiable_credentials" ("university_id", "type");
      CREATE INDEX IF NOT EXISTS "idx_vc_university_status" ON "verifiable_credentials" ("university_id", "status");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "verifiable_credentials" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "escrow_holdings" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "library_items" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "library_categories" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sports_matches" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mentorship_bookings" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "mentor_profiles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "startup_hub_entries" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "news_articles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "alumni_profiles" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hostels" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cafeteria_orders" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "campus_map_locations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "print_services" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "transport_routes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clubs" CASCADE`);

    await queryRunner.query(`DROP TYPE IF EXISTS "credential_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "credential_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "message_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "message_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "conversation_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "escrow_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "library_item_access_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "library_item_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "match_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sport_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "booking_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "mentor_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "startup_stage_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "news_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "hostel_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cafeteria_order_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "map_location_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "club_category_enum"`);
  }
}
