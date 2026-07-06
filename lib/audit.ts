import { db } from "@/db";
import { auditLog } from "@/db/schema";

/**
 * Append-only audit trail (PRD S-027). Never store PII in `metadata`
 * (S-023) — ids, provider names, and status transitions only.
 */
export type AuditAction =
  | "account.created"
  | "account.deleted"
  | "account.password_changed"
  | "account.password_reset"
  | "account.sessions_revoked"
  | "user.role_changed"
  | "order.created"
  | "order.status_changed"
  | "order.refunded"
  | "order.shipment_created"
  | "product.created"
  | "product.updated"
  | "product.deleted"
  | "customer.banned"
  | "customer.unbanned"
  | "team.invited"
  | "team.deactivated"
  | "team.reactivated"
  | "discount.created"
  | "discount.updated"
  | "discount.deleted"
  | "gift_card.issued"
  | "gift_card.deactivated"
  | "content.created"
  | "content.updated"
  | "content.deleted"
  | "return.requested"
  | "review.submitted"
  | "admin.action";

export interface AuditEntry {
  actorUserId?: string | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

/** Best-effort audit write; failures are logged but never block the caller. */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata,
    });
  } catch (error) {
    console.error("[audit] failed to write audit log entry", entry.action, error);
  }
}
