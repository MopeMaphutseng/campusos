#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(__dirname, 'material-manifest.json');
const DEFAULT_UNIVERSITY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const DEFAULT_DEMO_EMAIL = 'thabo.mokoena@nul.ls';

function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return null;
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function dbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'campusos',
    password: process.env.DB_PASSWORD || 'campusos_dev',
    database: process.env.DB_NAME || 'campusos',
  };
}

async function ensureCourse(client, universityId, code, course, importedAt) {
  const metadata = JSON.stringify({
    source: 'first semester archive',
    importedAt,
  });
  const result = await client.query(
    `INSERT INTO courses
       (university_id, code, name, description, credits, department, faculty, level,
        enrolled_count, max_capacity, semester, academic_year, status, prerequisites, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,120,'Semester 1','2026/2027','published','[]'::jsonb,$9::jsonb)
     ON CONFLICT (university_id, code) DO UPDATE SET
       name = EXCLUDED.name,
       description = EXCLUDED.description,
       credits = EXCLUDED.credits,
       department = EXCLUDED.department,
       faculty = EXCLUDED.faculty,
       level = EXCLUDED.level,
       semester = EXCLUDED.semester,
       academic_year = EXCLUDED.academic_year,
       status = 'published',
       metadata = EXCLUDED.metadata
     RETURNING id`,
    [
      universityId,
      code,
      course.name,
      course.description,
      course.credits,
      course.department,
      course.faculty,
      course.level,
      metadata,
    ],
  );
  return result.rows[0].id;
}

async function main() {
  const manifest = readManifest();
  if (!manifest) {
    console.log('[materials] No manifest found; skipping.');
    return;
  }

  const universityId =
    process.env.IMPORT_UNIVERSITY_ID || manifest.universityId || DEFAULT_UNIVERSITY_ID;
  const demoEmail = process.env.IMPORT_DEMO_EMAIL || DEFAULT_DEMO_EMAIL;
  const client = new Client(dbConfig());
  await client.connect();

  try {
    const userResult = await client.query(
      'SELECT id FROM users WHERE university_id = $1 AND email = $2 AND deleted_at IS NULL',
      [universityId, demoEmail],
    );
    const uploadedBy = userResult.rows[0]?.id || null;

    const courseIds = {};
    for (const [code, course] of Object.entries(manifest.courses)) {
      courseIds[code] = await ensureCourse(
        client,
        universityId,
        code,
        course,
        manifest.generatedAt,
      );
    }

    const stats = { inserted: 0, existing: 0, missing: 0, errors: 0 };
    const missing = [];

    for (const material of manifest.materials) {
      try {
        const courseId = courseIds[material.courseCode];
        if (!courseId) {
          stats.errors += 1;
          continue;
        }

        const relativePath = decodeURIComponent(material.fileUrl).replace(/^\/+/, '');
        const absolutePath = path.join(BACKEND_ROOT, relativePath);
        if (!fs.existsSync(absolutePath)) {
          stats.missing += 1;
          if (missing.length < 10) missing.push(relativePath);
          continue;
        }

        const result = await client.query(
          `INSERT INTO course_materials
             (university_id, course_id, course_code, title, description, category,
              file_name, file_url, mime_type, size_bytes, checksum, uploaded_by, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [
            universityId,
            courseId,
            material.courseCode,
            material.title,
            material.description,
            material.category,
            material.fileName,
            material.fileUrl,
            material.mimeType || 'application/octet-stream',
            material.sizeBytes,
            material.checksum,
            uploadedBy,
            JSON.stringify(material.metadata || {}),
          ],
        );

        if (result.rowCount > 0) {
          stats.inserted += 1;
        } else {
          stats.existing += 1;
        }
      } catch (error) {
        stats.errors += 1;
        console.error(`[materials] Failed ${material.fileUrl}: ${error.message}`);
      }
    }

    await client.query(
      `UPDATE courses c
       SET enrolled_count = (
         SELECT COUNT(*) FROM enrollments e
         WHERE e.course_id = c.id AND e.status = 'enrolled' AND e.deleted_at IS NULL
       )
       WHERE c.university_id = $1 AND c.code = ANY($2::text[])`,
      [universityId, Object.keys(manifest.courses)],
    );

    console.log(
      `[materials] courses=${Object.keys(manifest.courses).length} inserted=${stats.inserted} existing=${stats.existing} missing=${stats.missing} errors=${stats.errors}`,
    );
    if (missing.length) {
      console.log('[materials] Missing samples:', missing.join(', '));
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('[materials] Import failed:', error);
  process.exit(1);
});
