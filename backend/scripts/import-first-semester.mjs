#!/usr/bin/env node
/**
 * Imports the "first semester" academic archive into CampusOS.
 *
 * - Creates/updates the real course records and enrols the demo student.
 * - Copies curated files into backend/uploads/academics/<CODE>/<category>/.
 * - Registers each file in course_materials (idempotent, content-hash deduped).
 * - Skips Windows junk, temp files, browser-cache pages and duplicates.
 *
 * Usage: node scripts/import-first-semester.mjs [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, '..');
const ARCHIVE_ROOT = path.resolve(BACKEND_ROOT, '..', 'first semester');
const UPLOAD_ROOT = path.join(BACKEND_ROOT, 'uploads', 'academics');
const DRY_RUN = process.argv.includes('--dry-run');

dotenv.config({ path: path.join(BACKEND_ROOT, '.env.development') });

const UNIVERSITY_ID = process.env.IMPORT_UNIVERSITY_ID || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const DEMO_EMAIL = process.env.IMPORT_DEMO_EMAIL || 'thabo.mokoena@nul.ls';

const COURSES = {
  CS3520: {
    name: 'Computer Systems',
    description: 'Computer abstractions, RISC-V instruction sets, processor design and performance analysis.',
    department: 'Computer Science',
    faculty: 'Faculty of Science and Technology',
    level: '300',
    credits: 3,
  },
  CS3541: {
    name: 'Computer Networks',
    description: 'Network fundamentals, Cisco IOS, switching, routing and Packet Tracer laboratories.',
    department: 'Computer Science',
    faculty: 'Faculty of Science and Technology',
    level: '300',
    credits: 3,
  },
  CS3400: {
    name: 'Data Structures and Algorithms',
    description: 'Data structures, algorithm analysis and the CS3400 mini project.',
    department: 'Computer Science',
    faculty: 'Faculty of Science and Technology',
    level: '300',
    credits: 3,
  },
  EE3400: {
    name: 'Electronic Measurements and Instrumentation',
    description: 'Sensors, strain gauges, instrumentation amplifiers, active filters and measurement reports.',
    department: 'Electrical Engineering',
    faculty: 'Faculty of Science and Technology',
    level: '300',
    credits: 3,
  },
  EE3404: {
    name: 'Electric Circuit Theory',
    description: 'Circuit elements, nodal and mesh analysis, transients and RLC circuits.',
    department: 'Electrical Engineering',
    faculty: 'Faculty of Science and Technology',
    level: '300',
    credits: 3,
  },
  EE3408: {
    name: 'Analogue Communications',
    description: 'Analogue modulation, analogue-to-digital conversion, ACM laboratories and reports.',
    department: 'Electrical Engineering',
    faculty: 'Faculty of Science and Technology',
    level: '300',
    credits: 3,
  },
  M3503: {
    name: 'Engineering Mathematics III',
    description: 'Differential equations, higher engineering mathematics, tutorials and the M3503 mini project.',
    department: 'Mathematics',
    faculty: 'Faculty of Science and Technology',
    level: '300',
    credits: 3,
  },
};

const COURSE_ORDER = ['CS3520', 'CS3541', 'CS3400', 'EE3400', 'EE3404', 'EE3408', 'M3503'];

const ALLOWED_EXT = new Set([
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.rtf', '.csv',
  '.zip', '.rar', '.7z', '.tar', '.gz',
  '.cpp', '.c', '.h', '.hpp', '.asm', '.s', '.m', '.py', '.java', '.js', '.sql',
  '.pka', '.ms10', '.ms11', '.ms14', '.drawio', '.ppm', '.ino',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.heic',
]);

const MIME = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
  '.rtf': 'application/rtf',
  '.csv': 'text/csv',
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.heic': 'image/heic',
  '.cpp': 'text/x-c++src',
  '.c': 'text/x-csrc',
  '.h': 'text/x-chdr',
  '.py': 'text/x-python',
  '.java': 'text/x-java-source',
  '.js': 'text/javascript',
  '.sql': 'application/sql',
  '.m': 'text/plain',
  '.asm': 'text/plain',
};

const CODE_FILE_EXT = new Set(['.cpp', '.c', '.h', '.hpp', '.asm', '.s', '.m', '.py', '.java', '.js', '.sql', '.pka', '.ms10', '.ms11', '.ms14', '.drawio', '.ppm', '.ino']);

function isJunk(relPath) {
  const parts = relPath.split(path.sep);
  const base = parts[parts.length - 1];
  const lower = relPath.toLowerCase();

  if (parts.some((p) => p.startsWith('.') || p.toLowerCase() === '__macosx')) return true;
  if (parts.some((p) => p.toLowerCase().endsWith('_files'))) return true;
  if (/\.html?$/i.test(base)) return true;
  if (/zone\.identifier$/i.test(base)) return true;
  if (base.startsWith('~$')) return true;
  if (/\.(exe|bkp|dtmp|ini|download|url|lnk|tmp|log)$/i.test(base)) return true;
  if (/^loaded(_\d+)?$/i.test(base)) return true;
  if (/security copy/i.test(base)) return true;
  if (/^thumbs\.db$/i.test(base)) return true;
  if (lower.includes(path.sep + 'system volume information' + path.sep)) return true;
  return false;
}

function detectCourse(relPath) {
  const parts = relPath.split(path.sep);
  const base = parts[parts.length - 1];
  const lowerBase = base.toLowerCase();

  const codeMatch = base.match(/\b(CS|EE|M)\s?(\d{4})\b/i);
  if (codeMatch) {
    const code = `${codeMatch[1].toUpperCase()}${codeMatch[2]}`;
    if (COURSES[code]) return code;
  }

  for (const part of parts.slice(0, -1)) {
    const dirMatch = part.match(/^(CS|EE|M)\s?(\d{4})$/i);
    if (dirMatch) {
      const code = `${dirMatch[1].toUpperCase()}${dirMatch[2]}`;
      if (COURSES[code]) return code;
    }
  }

  const top = parts[0];
  if (COURSES[top]) {
    if (top === 'EE3408' && /sensor|strain gauge|instrumentation|emi/.test(lowerBase)) {
      return 'EE3400';
    }
    if (top === 'EE3400' && /data structures|mini project/.test(lowerBase)) {
      return 'CS3400';
    }
    return top;
  }

  if (lowerBase.endsWith('.m')) return 'M3503';
  if (/data structures/.test(lowerBase)) return 'CS3400';
  if (/tlotliso/.test(lowerBase)) return 'EE3404';
  return null;
}

function detectCategory(relPath, courseCode, ext) {
  const lower = relPath.toLowerCase();
  const base = path.basename(lower);

  if (/past ?paper|class test|exam|(^|[\/_\- ])tests?([\/_\- .]|$)/.test(lower)) return 'past_papers';
  if (/lab|practical/.test(lower)) return 'labs';
  if (/tutorial|(^|[^a-z])tut[0-9]?([^a-z]|$)/.test(lower)) return 'tutorials';
  if (/project|projerct|mini ?project/.test(lower)) return 'projects';
  if (/assign|take-home|homework/.test(lower)) return 'assignments';
  if (/course outline|syllabus|schedule/.test(lower)) return 'course_info';
  if (/notes?|notebook/.test(lower)) return 'notes';
  if (/slide|lecture|lec[-_ ]|module|week|unit|section/.test(lower)) return 'lectures';
  if (/book|textbook|higher engineering|fundamentals|basic engineering|analog communications|de_complete|to read|reading/.test(lower)) return 'readings';

  if (CODE_FILE_EXT.has(ext)) return 'code';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.heic'].includes(ext)) return 'images';
  if (courseCode === 'EE3400' && /emi|sensor|strain|amplifier|filter|measurement/.test(base)) return 'notes';
  return 'other';
}

function safeFileName(name, hash) {
  const ext = path.extname(name);
  let stem = name.slice(0, name.length - ext.length);
  stem = stem
    .normalize('NFKD')
    .replace(/[^\w.\-() ]+/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!stem) stem = 'material';
  return `${stem}${ext.toLowerCase()}`;
}

function prettyTitle(originalName) {
  const ext = path.extname(originalName);
  return originalName
    .slice(0, originalName.length - ext.length)
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function collectFiles() {
  const files = [];
  const skipped = { junk: 0, unsupported: 0, empty: 0 };

  function walk(dir, relative) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      const rel = relative ? path.join(relative, entry.name) : entry.name;
      if (entry.isDirectory()) {
        if (isJunk(rel + path.sep)) {
          skipped.junk += 1;
          continue;
        }
        walk(abs, rel);
        continue;
      }
      if (!entry.isFile()) continue;
      if (isJunk(rel)) {
        skipped.junk += 1;
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!ALLOWED_EXT.has(ext)) {
        skipped.unsupported += 1;
        continue;
      }
      const stat = fs.statSync(abs);
      if (stat.size === 0) {
        skipped.empty += 1;
        continue;
      }
      const courseCode = detectCourse(rel);
      if (!courseCode) {
        skipped.unsupported += 1;
        continue;
      }
      files.push({
        abs,
        rel,
        size: stat.size,
        ext,
        courseCode,
        category: detectCategory(rel, courseCode, ext),
      });
    }
  }

  walk(ARCHIVE_ROOT, '');
  files.sort((a, b) => a.rel.localeCompare(b.rel));
  return { files, skipped };
}

async function ensureCourse(client, code) {
  const c = COURSES[code];
  const metadata = JSON.stringify({ source: 'first semester archive', importedAt: new Date().toISOString() });
  const res = await client.query(
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
      UNIVERSITY_ID, code, c.name, c.description, c.credits, c.department,
      c.faculty, c.level, metadata,
    ],
  );
  return res.rows[0].id;
}

async function ensureEnrollment(client, userId, courseId) {
  await client.query(
    `INSERT INTO enrollments (university_id, user_id, course_id, status, enrolled_at)
     VALUES ($1,$2,$3,'enrolled',NOW())
     ON CONFLICT (university_id, user_id, course_id) DO UPDATE SET
       status = 'enrolled',
       dropped_at = NULL,
       deleted_at = NULL`,
    [UNIVERSITY_ID, userId, courseId],
  );
}

async function main() {
  if (!fs.existsSync(ARCHIVE_ROOT)) {
    throw new Error(`Archive not found: ${ARCHIVE_ROOT}`);
  }

  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'campusos',
    password: process.env.DB_PASSWORD || 'campusos_dev',
    database: process.env.DB_NAME || 'campusos',
  });
  await client.connect();

  try {
    const userRes = await client.query(
      'SELECT id FROM users WHERE university_id = $1 AND email = $2 AND deleted_at IS NULL',
      [UNIVERSITY_ID, DEMO_EMAIL],
    );
    if (userRes.rowCount === 0) throw new Error(`Demo user not found: ${DEMO_EMAIL}`);
    const userId = userRes.rows[0].id;

    const courseIds = {};
    for (const code of COURSE_ORDER) {
      if (DRY_RUN) {
        courseIds[code] = null;
        continue;
      }
      courseIds[code] = await ensureCourse(client, code);
      await ensureEnrollment(client, userId, courseIds[code]);
    }

    const { files, skipped } = collectFiles();
    const seenHashes = new Set();
    const stats = {
      copied: 0,
      deduped: 0,
      alreadyRegistered: 0,
      bytes: 0,
      byCourse: {},
      byCategory: {},
      errors: [],
    };

    for (const file of files) {
      try {
        const hash = await sha256(file.abs);
        if (seenHashes.has(hash)) {
          stats.deduped += 1;
          continue;
        }
        seenHashes.add(hash);

        const existing = await client.query(
          `SELECT id FROM course_materials
           WHERE university_id = $1 AND checksum = $2 AND deleted_at IS NULL
           LIMIT 1`,
          [UNIVERSITY_ID, hash],
        );
        if (existing.rowCount > 0) {
          stats.alreadyRegistered += 1;
          continue;
        }

        const courseId = courseIds[file.courseCode];
        if (!DRY_RUN && !courseId) throw new Error(`No course id for ${file.courseCode}`);

        let fileName = safeFileName(path.basename(file.rel), hash);
        const destDir = path.join(UPLOAD_ROOT, file.courseCode, file.category);
        let dest = path.join(destDir, fileName);
        if (fs.existsSync(dest)) {
          const existingHash = await sha256(dest);
          if (existingHash !== hash) {
            const ext = path.extname(fileName);
            fileName = `${fileName.slice(0, fileName.length - ext.length)}-${hash.slice(0, 8)}${ext}`;
            dest = path.join(destDir, fileName);
          }
        }

        if (!DRY_RUN) {
          fs.mkdirSync(destDir, { recursive: true });
          if (!fs.existsSync(dest)) fs.copyFileSync(file.abs, dest);
        }

        const fileUrl = `/uploads/academics/${encodeURIComponent(file.courseCode)}/${encodeURIComponent(file.category)}/${encodeURIComponent(fileName)}`;
        const title = prettyTitle(path.basename(file.rel)) || fileName;
        const mimeType = MIME[file.ext] || 'application/octet-stream';
        const metadata = JSON.stringify({ originalPath: file.rel, extension: file.ext, source: 'first semester archive' });

        if (!DRY_RUN) {
          await client.query(
            `INSERT INTO course_materials
               (university_id, course_id, course_code, title, description, category,
                file_name, file_url, mime_type, size_bytes, checksum, uploaded_by, metadata)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb)`,
            [
              UNIVERSITY_ID, courseId, file.courseCode, title,
              `Imported from ${file.rel}`, file.category, path.basename(file.rel),
              fileUrl, mimeType, file.size, hash, userId, metadata,
            ],
          );
        }

        stats.copied += 1;
        stats.bytes += file.size;
        stats.byCourse[file.courseCode] = (stats.byCourse[file.courseCode] || 0) + 1;
        stats.byCategory[file.category] = (stats.byCategory[file.category] || 0) + 1;
      } catch (err) {
        stats.errors.push(`${file.rel}: ${err.message}`);
      }
    }

    if (!DRY_RUN) {
      await client.query(
        `UPDATE courses c
         SET enrolled_count = (
           SELECT COUNT(*) FROM enrollments e
           WHERE e.course_id = c.id AND e.status = 'enrolled' AND e.deleted_at IS NULL
         )
         WHERE c.university_id = $1 AND c.code = ANY($2::text[])`,
        [UNIVERSITY_ID, COURSE_ORDER],
      );
    }

    console.log(`\nArchive: ${ARCHIVE_ROOT}`);
    console.log(`Mode:    ${DRY_RUN ? 'DRY RUN (no writes)' : 'IMPORT'}`);
    console.log(`Files:   ${files.length} curated candidates`);
    console.log(`Skipped: ${skipped.junk} junk/cache, ${skipped.unsupported} unsupported/unmapped, ${skipped.empty} empty`);
    console.log(`Copied/registered: ${stats.copied}`);
    console.log(`Duplicate content skipped: ${stats.deduped}`);
    console.log(`Already registered: ${stats.alreadyRegistered}`);
    console.log(`Bytes:   ${(stats.bytes / 1024 / 1024).toFixed(1)} MB`);
    console.log('By course:', stats.byCourse);
    console.log('By category:', stats.byCategory);
    if (stats.errors.length) {
      console.log(`Errors (${stats.errors.length}):`);
      for (const e of stats.errors.slice(0, 20)) console.log('  -', e);
    } else {
      console.log('Errors: none');
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
