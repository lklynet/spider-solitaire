import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db.js';

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const migrationsDir = path.resolve(currentDir, '../../../../db/migrations');

const run = async () => {
  await pool.query(`
    create table if not exists schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const files = (await readdir(migrationsDir))
    .filter((file) => file.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right));

  for (const file of files) {
    const existing = await pool.query('select 1 from schema_migrations where id = $1', [file]);
    if (existing.rowCount) {
      continue;
    }

    const sql = await readFile(path.join(migrationsDir, file), 'utf8');
    await pool.query('begin');

    try {
      await pool.query(sql);
      await pool.query('insert into schema_migrations (id) values ($1)', [file]);
      await pool.query('commit');
      console.log(`applied migration ${file}`);
    } catch (error) {
      await pool.query('rollback');
      throw error;
    }
  }
};

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
