import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeviceTokens1700000000010 implements MigrationInterface {
  name = 'AddDeviceTokens1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "device_tokens_platform_enum" AS ENUM ('ios', 'android', 'web');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "device_tokens" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id") ON DELETE CASCADE,
        "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token" VARCHAR(512) NOT NULL,
        "platform" "device_tokens_platform_enum" NOT NULL DEFAULT 'web',
        "last_used_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_device_tokens_user" ON "device_tokens" ("university_id", "user_id");
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_device_tokens_token" ON "device_tokens" ("token") WHERE "deleted_at" IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "device_tokens" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "device_tokens_platform_enum"`);
  }
}
