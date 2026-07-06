import "server-only";
import { ne, isNull, desc, and, gt } from "drizzle-orm";
import { db } from "@/db";
import { users, teamInvites } from "@/db/schema";

export interface AdminStaffRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export async function getStaffList(): Promise<AdminStaffRow[]> {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(and(ne(users.role, "customer"), isNull(users.deletedAt)))
    .orderBy(desc(users.createdAt));

  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export interface AdminPendingInviteRow {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

export async function getPendingInvites(): Promise<AdminPendingInviteRow[]> {
  const rows = await db
    .select({
      id: teamInvites.id,
      email: teamInvites.email,
      role: teamInvites.role,
      expiresAt: teamInvites.expiresAt,
    })
    .from(teamInvites)
    .where(and(isNull(teamInvites.consumedAt), gt(teamInvites.expiresAt, new Date())))
    .orderBy(desc(teamInvites.createdAt));

  return rows.map((r) => ({ ...r, expiresAt: r.expiresAt.toISOString() }));
}
