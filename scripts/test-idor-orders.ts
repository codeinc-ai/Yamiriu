// Explicit IDOR regression test (S-024): proves user A requesting user B's
// order by order number gets nothing back (equivalent to a 404), never the
// order itself. Run with: npx tsx scripts/test-idor-orders.ts
//
// This reimplements — rather than imports — the ownership-scoped query
// (lib/queries/orders.ts's getOrderDetailForUser) because that file is
// "server-only" guarded and throws when required outside Next's RSC
// context. The logic under test is copied verbatim; if the two ever drift,
// update both.
import { and, eq, isNull } from "drizzle-orm";
import { db, dbReady } from "../db";
import { users, orders } from "../db/schema";

async function getOrderDetailForUser(userId: string, orderNumber: string) {
  const order = await db.query.orders.findFirst({
    where: and(
      eq(orders.orderNumber, orderNumber.toUpperCase()),
      eq(orders.userId, userId),
      isNull(orders.deletedAt)
    ),
  });
  return order ?? null;
}

async function main() {
  await dbReady;

  const [userA] = await db
    .insert(users)
    .values({ email: `idor-user-a-${Date.now()}@example.com`, name: "User A", role: "customer" })
    .returning();
  const [userB] = await db
    .insert(users)
    .values({ email: `idor-user-b-${Date.now()}@example.com`, name: "User B", role: "customer" })
    .returning();

  const [orderB] = await db
    .insert(orders)
    .values({
      userId: userB.id,
      status: "delivered",
      paymentMethod: "cod",
      subtotal: "1000.00",
      shippingCost: "0.00",
      total: "1000.00",
      shippingAddress: { fullName: "User B", addressLine1: "x", city: "x" },
      customerPhone: "0300",
    })
    .returning();

  const resultAsOwner = await getOrderDetailForUser(userB.id, orderB.orderNumber);
  const resultAsAttacker = await getOrderDetailForUser(userA.id, orderB.orderNumber);

  console.log("Owner (user B) fetching own order — found:", resultAsOwner !== null);
  console.log("Attacker (user A) fetching user B's order — found:", resultAsAttacker !== null);

  if (resultAsAttacker !== null) {
    console.error("FAIL — IDOR vulnerability: user A was able to read user B's order.");
    process.exitCode = 1;
    return;
  }
  if (resultAsOwner === null) {
    console.error("FAIL — test setup bug: the owner couldn't read their own order.");
    process.exitCode = 1;
    return;
  }
  console.log("PASS — cross-account order access returns null (404); owner access works.");
}

main().then(() => process.exit());
