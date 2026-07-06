import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { addresses, type Address } from "@/db/schema";

export async function getUserAddresses(userId: string): Promise<Address[]> {
  return db
    .select()
    .from(addresses)
    .where(and(eq(addresses.userId, userId), isNull(addresses.deletedAt)))
    .orderBy(desc(addresses.isDefault), desc(addresses.createdAt));
}
