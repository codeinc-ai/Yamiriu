import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, dbReady } from "@/db";

/** Uptime-check target — actually round-trips to the database rather than
 * unconditionally reporting healthy, since a stale/unreachable DB is exactly
 * the failure mode an uptime monitor needs to catch. */
export async function GET() {
  try {
    await dbReady;
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok", db: "ok", ts: new Date().toISOString() });
  } catch (error) {
    console.error("[health] database check failed", error);
    return NextResponse.json(
      { status: "error", db: "unreachable", ts: new Date().toISOString() },
      { status: 503 }
    );
  }
}
