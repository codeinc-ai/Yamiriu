import { Pool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { env } from "@/lib/env";
import * as schema from "./schema";

const PGLITE_PREFIX = "pglite://";

/**
 * Local-development fallback: when DATABASE_URL uses the `pglite://` scheme,
 * queries run against an embedded, in-memory real-Postgres engine
 * (@electric-sql/pglite) instead of Neon. This lets `npm run dev`/`build` work
 * end-to-end without a live Neon project. Production must always use a real
 * `postgresql://...sslmode=require` URL — this branch never touches Neon.
 *
 * Deliberately in-memory (not file-backed): PGlite doesn't support concurrent
 * multi-process access to a shared data directory, and Next's build fans SSG
 * out across several worker processes. An in-memory instance gives every
 * process its own private, independently-migrated-and-seeded copy — safe, at
 * the cost of not persisting data between separate `dev`/`build` runs (fine
 * for a dev-only fallback; every process boots with the same seed data).
 *
 * `dbReady` resolves once migrations + the seed have applied; it is awaited
 * once at server startup in instrumentation.ts.
 */
function createPgliteDb() {
  const client = new PGlite();
  const instance = drizzlePglite({ client, schema });

  const ready = (async () => {
    await migratePglite(instance, { migrationsFolder: "./db/migrations" });
    const { seedDatabase } = await import("./seed-runner");
    await seedDatabase(instance);
  })();

  return { db: instance, pool: undefined, ready };
}

function createNeonDb(connectionString: string) {
  if (!connectionString.includes("sslmode=require")) {
    throw new Error(
      "DATABASE_URL must include sslmode=require. All DB connections must use SSL (PRD S-025)."
    );
  }
  const pool = new Pool({ connectionString });
  const instance = drizzleNeon({ client: pool, schema });
  return { db: instance, pool, ready: Promise.resolve() };
}

const isPglite = env.DATABASE_URL.startsWith(PGLITE_PREFIX);

const {
  db,
  pool,
  ready: dbReady,
} = isPglite ? createPgliteDb() : createNeonDb(env.DATABASE_URL);

export { db, pool, dbReady };
