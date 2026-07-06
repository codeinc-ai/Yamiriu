import type { NeonDatabase } from "drizzle-orm/neon-serverless";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import bcrypt from "bcryptjs";
import * as schema from "./schema";
import {
  users,
  products,
  productVariants,
  discounts,
  reviews,
  orders,
  orderItems,
} from "./schema";
import { seedProducts } from "./seed-data";

type AppDatabase = NeonDatabase<typeof schema> | PgliteDatabase<typeof schema>;

/**
 * Core seed logic shared by the CLI script (`npm run db:seed`, against a real
 * Neon database) and the local PGlite dev fallback's first-run auto-seed
 * (db/index.ts). Accepts either concrete drizzle instance used in this app.
 */
export async function seedDatabase(database: AppDatabase): Promise<void> {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);

  await database.transaction(async (tx) => {
    const [admin1] = await tx
      .insert(users)
      .values({
        email: "admin1@yamiriu.com",
        name: "Amina Rahman",
        role: "admin",
        passwordHash,
        emailVerified: new Date(),
      })
      .returning();

    await tx.insert(users).values({
      email: "admin2@yamiriu.com",
      name: "Bilal Siddiqui",
      role: "admin",
      passwordHash,
      emailVerified: new Date(),
    });

    const [demoCustomer] = await tx
      .insert(users)
      .values({
        email: "demo@yamiriu.com",
        name: "Sara Khan",
        role: "customer",
        passwordHash,
        emailVerified: new Date(),
      })
      .returning();

    const insertedBySlug = new Map<string, string>();
    const variantIdBySku = new Map<string, string>();

    for (const seedProduct of seedProducts) {
      const [product] = await tx
        .insert(products)
        .values({
          slug: seedProduct.slug,
          name: seedProduct.name,
          description: seedProduct.description,
          price: seedProduct.price,
          category: seedProduct.category,
          itemType: seedProduct.itemType,
          hasModel: seedProduct.hasModel,
          modelUrl: seedProduct.modelUrl,
          salesCount: seedProduct.salesCount,
          published: true,
        })
        .returning();

      insertedBySlug.set(seedProduct.slug, product.id);

      const insertedVariants = await tx
        .insert(productVariants)
        .values(
          seedProduct.variants.map((variant) => ({
            productId: product.id,
            size: variant.size,
            color: variant.color,
            stock: variant.stock,
            sku: variant.sku,
          }))
        )
        .returning();

      for (const variant of insertedVariants) {
        variantIdBySku.set(variant.sku, variant.id);
      }
    }

    // A handful of demo reviews so the PDP reviews section + aggregateRating
    // JSON-LD have real data to render.
    const milanoId = insertedBySlug.get("milano-linen-shirt");
    const firenzeId = insertedBySlug.get("firenze-silk-blouse");
    const napoliId = insertedBySlug.get("napoli-leather-loafers");

    if (milanoId) {
      await tx.insert(reviews).values([
        {
          productId: milanoId,
          userId: admin1.id,
          rating: 5,
          title: "Beautifully tailored",
          body: "The linen is genuinely breathable and the cut runs true to size. Wore it in 40°C heat and stayed comfortable all day.",
          photoUrls: [
            "review-photo:milano-linen-shirt:1",
            "review-photo:milano-linen-shirt:2",
          ],
        },
        {
          productId: milanoId,
          userId: demoCustomer.id,
          rating: 4,
          title: "Great quality, runs slightly large",
          body: "Lovely fabric and stitching. I'd size down if you're between sizes.",
          photoUrls: null,
        },
      ]);
    }

    if (firenzeId) {
      await tx.insert(reviews).values({
        productId: firenzeId,
        userId: demoCustomer.id,
        rating: 5,
        title: "Elegant and comfortable",
        body: "The silk drapes beautifully and the color is exactly as pictured.",
        photoUrls: ["review-photo:firenze-silk-blouse:1"],
      });
    }

    if (napoliId) {
      await tx.insert(reviews).values({
        productId: napoliId,
        userId: admin1.id,
        rating: 4,
        title: "Classic and well-made",
        body: "Handsome loafers, needed a short break-in period before they felt fully comfortable.",
        photoUrls: null,
      });
    }

    await tx.insert(discounts).values([
      {
        code: "WELCOME10",
        type: "percent",
        value: "10.00",
        minOrderValue: "3000.00",
        usageLimit: 500,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
      },
      // Fixtures covering each discount-validation rejection path.
      {
        code: "EXPIRED5",
        type: "flat",
        value: "500.00",
        expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // expired yesterday
      },
      {
        code: "MAXEDOUT",
        type: "percent",
        value: "15.00",
        usageLimit: 10,
        usedCount: 10,
      },
      {
        code: "BIGORDER",
        type: "flat",
        value: "2000.00",
        minOrderValue: "50000.00",
      },
    ]);

    // Demo order (guest checkout) so /track-order has something real to find.
    const milanoVariantId = variantIdBySku.get("MLS-M-WHT");
    const napoliVariantId = variantIdBySku.get("NLL-44-BLK");

    if (milanoVariantId && napoliVariantId) {
      const [demoOrder] = await tx
        .insert(orders)
        .values({
          orderNumber: "YAM-DEMO01",
          guestEmail: "demo.guest@yamiriu.com",
          status: "shipped",
          paymentMethod: "cod",
          subtotal: "19000.00",
          discountAmount: "0.00",
          shippingCost: "0.00",
          total: "19000.00",
          customerPhone: "+92 300 1234567",
          shippingAddress: {
            fullName: "Demo Guest",
            phone: "+92 300 1234567",
            addressLine1: "House 12, Street 4, F-8/3",
            city: "Islamabad",
            province: "Islamabad Capital Territory",
            postalCode: "44000",
            country: "PK",
          },
          trackingNumber: "TCS123456789",
          courierProvider: "TCS",
        })
        .returning();

      await tx.insert(orderItems).values([
        {
          orderId: demoOrder.id,
          productVariantId: milanoVariantId,
          quantity: 1,
          priceAtPurchase: "6500.00",
        },
        {
          orderId: demoOrder.id,
          productVariantId: napoliVariantId,
          quantity: 1,
          priceAtPurchase: "12500.00",
        },
      ]);
    }
  });

  console.log(
    `Seeded ${seedProducts.length} products, 3 users (2 admin, 1 customer), 4 discount codes, 1 demo order.`
  );
}
