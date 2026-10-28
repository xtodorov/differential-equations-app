// Small transactional PostgreSQL SQL migration runner for restricted/offline
// environments. Keeps Prisma-compatible history; never resets or overwrites data.
import "dotenv/config";
import pg from "pg";
import { readdir, readFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(6520261022)");
  await client.query(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
 "id" VARCHAR(36) PRIMARY KEY, "checksum" VARCHAR(64) NOT NULL, "finished_at" TIMESTAMPTZ,
 "migration_name" VARCHAR(255) NOT NULL, "logs" TEXT, "rolled_back_at" TIMESTAMPTZ,
 "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(), "applied_steps_count" INTEGER NOT NULL DEFAULT 0)`);
  const migrations = (
    await readdir("prisma/migrations", { withFileTypes: true })
  )
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  for (const name of migrations) {
    const sql = await readFile(
      `prisma/migrations/${name}/migration.sql`,
      "utf8",
    );
    const checksum = createHash("sha256").update(sql).digest("hex");
    const { rows } = await client.query(
      'SELECT * FROM "_prisma_migrations" WHERE migration_name=$1 AND rolled_back_at IS NULL',
      [name],
    );
    if (rows.length) {
      if (
        rows.length !== 1 ||
        !rows[0].finished_at ||
        rows[0].checksum !== checksum
      )
        throw new Error(`Migration history mismatch: ${name}`);
      console.log(`Already applied: ${name}`);
      continue;
    }
    await client.query(sql);
    await client.query(
      'INSERT INTO "_prisma_migrations" (id,checksum,migration_name,finished_at,applied_steps_count) VALUES ($1,$2,$3,now(),1)',
      [randomUUID(), checksum, name],
    );
    console.log(`Applied: ${name}`);
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
