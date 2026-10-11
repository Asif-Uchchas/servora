-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('POS', 'QR');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "created_by_id" TEXT,
ADD COLUMN     "paid_at" TIMESTAMP(3),
ADD COLUMN     "payment_method" "PaymentMethod",
ADD COLUMN     "ready_at" TIMESTAMP(3),
ADD COLUMN     "source" "OrderSource" NOT NULL DEFAULT 'POS',
ADD COLUMN     "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "table_id" TEXT,
ADD COLUMN     "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "tip_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "order_number" DROP DEFAULT;
DROP SEQUENCE "orders_order_number_seq";

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "accept_reservations" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "current_period_end" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "opening_hours" TEXT,
ADD COLUMN     "order_counter" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "plan" "Plan" NOT NULL DEFAULT 'STARTER',
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "stripe_customer_id" TEXT,
ADD COLUMN     "stripe_subscription_id" TEXT,
ADD COLUMN     "subscription_status" "SubscriptionStatus" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "trial_ends_at" TIMESTAMP(3);

-- Backfill: give every existing restaurant a unique URL slug.
UPDATE "restaurants" r SET "slug" = sub.slug
FROM (
  SELECT id,
         COALESCE(NULLIF(trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''), 'restaurant')
           || CASE WHEN row_number() OVER (PARTITION BY lower(name) ORDER BY created_at) > 1
                   THEN '-' || right(id, 6) ELSE '' END AS slug
  FROM "restaurants"
) sub
WHERE r.id = sub.id;
ALTER TABLE "restaurants" ALTER COLUMN "slug" SET NOT NULL;

-- Backfill: continue each restaurant's ticket numbering from its highest existing order number.
UPDATE "restaurants" r SET "order_counter" = COALESCE((SELECT MAX(o."order_number") FROM "orders" o WHERE o."restaurant_id" = r.id), 0);

-- Backfill: restaurants created before billing existed start on a 14-day Pro trial.
UPDATE "restaurants" SET "plan" = 'PRO', "subscription_status" = 'TRIALING', "trial_ends_at" = NOW() + INTERVAL '14 days';

-- Backfill: historical orders had no tax breakdown; treat the stored total as the subtotal.
UPDATE "orders" SET "subtotal" = "total_amount";
UPDATE "orders" SET "paid_at" = "updated_at", "payment_method" = 'CASH' WHERE "status" = 'PAID';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "dining_tables" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "area" TEXT,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "restaurant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dining_tables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dining_tables_restaurant_id_label_key" ON "dining_tables"("restaurant_id", "label");

-- CreateIndex
CREATE INDEX "inventory_items_restaurant_id_idx" ON "inventory_items"("restaurant_id");

-- CreateIndex
CREATE INDEX "menu_categories_restaurant_id_idx" ON "menu_categories"("restaurant_id");

-- CreateIndex
CREATE INDEX "menu_items_restaurant_id_idx" ON "menu_items"("restaurant_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "orders_restaurant_id_created_at_idx" ON "orders"("restaurant_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_restaurant_id_status_idx" ON "orders"("restaurant_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_restaurant_id_order_number_key" ON "orders"("restaurant_id", "order_number");

-- CreateIndex
CREATE INDEX "reservations_restaurant_id_reservation_time_idx" ON "reservations"("restaurant_id", "reservation_time");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_slug_key" ON "restaurants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_stripe_customer_id_key" ON "restaurants"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_stripe_subscription_id_key" ON "restaurants"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "users_restaurant_id_idx" ON "users"("restaurant_id");

-- AddForeignKey
ALTER TABLE "dining_tables" ADD CONSTRAINT "dining_tables_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "dining_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill: create dining tables from the free-text table numbers used so far, and link orders to them.
INSERT INTO "dining_tables" ("id", "label", "capacity", "restaurant_id", "updated_at")
SELECT 'tbl_' || md5(o."restaurant_id" || ':' || o."table_number"), o."table_number", 4, o."restaurant_id", NOW()
FROM (SELECT DISTINCT "restaurant_id", trim("table_number") AS "table_number" FROM "orders"
      WHERE "table_number" IS NOT NULL AND trim("table_number") <> '') o
ON CONFLICT DO NOTHING;

UPDATE "orders" o SET "table_id" = t.id
FROM "dining_tables" t
WHERE t."restaurant_id" = o."restaurant_id" AND t."label" = trim(o."table_number");
