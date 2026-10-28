import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Production databases created before the checksum index was added to
 * AddCourseMaterials accumulated duplicate imported materials on every boot.
 * Collapse those duplicates and enforce the missing uniqueness constraint.
 */
export class DeduplicateCourseMaterials1700000000013
  implements MigrationInterface
{
  name = 'DeduplicateCourseMaterials1700000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "course_materials" a
      USING "course_materials" b
      WHERE a.ctid > b.ctid
        AND a."university_id" = b."university_id"
        AND a."checksum" = b."checksum"
        AND a."checksum" IS NOT NULL
        AND a."deleted_at" IS NULL
        AND b."deleted_at" IS NULL;

      CREATE UNIQUE INDEX IF NOT EXISTS "uq_course_materials_university_checksum"
        ON "course_materials" ("university_id", "checksum")
        WHERE "deleted_at" IS NULL AND "checksum" IS NOT NULL;
    `);
  }

  public async down(): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "uq_course_materials_university_checksum"`,
    );
  }
}
