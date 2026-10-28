import "dotenv/config";
import pg from "pg";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
await admin.connect();
const name = "mathforge_test_" + randomBytes(6).toString("hex");
await admin.query(`CREATE DATABASE "${name}"`);
const target = new URL(process.env.DATABASE_URL);
target.pathname = "/" + name;
const client = new pg.Client({ connectionString: target.toString() });
function run(script, success = true) {
  const r = spawnSync(process.execPath, [script], {
    env: { ...process.env, DATABASE_URL: target.toString() },
    encoding: "utf8",
  });
  assert.equal(r.status === 0, success, r.stderr);
}
try {
  run("scripts/migrate.mjs");
  run("scripts/migrate.mjs");
  await client.connect();
  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`,
  );
  assert.deepEqual(
    tables.rows.map((r) => r.table_name).sort(),
    [
      "User",
      "Session",
      "Lesson",
      "Exercise",
      "Attempt",
      "Progress",
      "StudySession",
      "_prisma_migrations",
    ].sort(),
  );
  await client.query(
    `INSERT INTO "User" (id,email,name,"passwordHash") VALUES ('test','test@example.com','Test','testhash')`,
  );
  await client.query(
    `INSERT INTO "Session" (id,"userId","expiresAt") VALUES ('session','test',now()+interval '1 day')`,
  );
  await assert.rejects(
    client.query(
      `INSERT INTO "Session" (id,"userId","expiresAt") VALUES ('orphan','missing',now())`,
    ),
  );
  await assert.rejects(
    client.query(
      `INSERT INTO "User" (id,email,name,"passwordHash") VALUES ('duplicate','test@example.com','Test','testhash')`,
    ),
  );
  await client.query(`DELETE FROM "User" WHERE id='test'`);
  assert.equal((await client.query('SELECT * FROM "Session"')).rowCount, 0);
  await client.query(`UPDATE "_prisma_migrations" SET checksum='tampered'`);
  run("scripts/migrate.mjs", false);
  console.log(
    "Database integration passed: fresh migration, repeatability, FK, uniqueness, session cascade, checksum tamper rejection.",
  );
} finally {
  await client.end();
  await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
  await admin.end();
}
