import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCafeteriaMenus1700000000009 implements MigrationInterface {
  name = 'AddCafeteriaMenus1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "cafeteria_menus_meal_type_enum" AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cafeteria_menus" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "university_id" UUID NOT NULL REFERENCES "universities"("id") ON DELETE CASCADE,
        "shop_id" UUID,
        "shop_name" VARCHAR(255),
        "date" DATE NOT NULL,
        "meal_type" "cafeteria_menus_meal_type_enum" NOT NULL DEFAULT 'lunch',
        "item_name" VARCHAR(150) NOT NULL,
        "description" TEXT,
        "price" NUMERIC(8,2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'LSL',
        "category" VARCHAR(80),
        "dietary_flags" JSONB NOT NULL DEFAULT '[]',
        "is_available" BOOLEAN NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS "idx_cafeteria_menus_date" ON "cafeteria_menus" ("university_id", "date", "meal_type");
      CREATE INDEX IF NOT EXISTS "idx_cafeteria_menus_shop" ON "cafeteria_menus" ("university_id", "shop_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "cafeteria_menus" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "cafeteria_menus_meal_type_enum"`);
  }
}
