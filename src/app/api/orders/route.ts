import { NextRequest } from "next/server";
import type { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { createOrderSchema, orderStatusSchema } from "@/lib/validations";
import { KITCHEN_STATUSES, OPEN_STATUSES, orderInclude, serializeOrder } from "@/lib/orders";
import { computeTotals, effectivePrice, roundMoney } from "@/lib/pricing";

// GET /api/orders?scope=open|kitchen|all&status=PAID&limit=100
export const GET = withAuth(async (req, { restaurantId }) => {
    const { searchParams } = req.nextUrl;
    const scope = searchParams.get("scope") ?? "all";
    const status = searchParams.get("status");
    const limit = Math.min(Number(searchParams.get("limit")) || 200, 500);

    const where: Prisma.OrderWhereInput = { restaurantId };
    if (scope === "open") where.status = { in: OPEN_STATUSES };
    else if (scope === "kitchen") where.status = { in: KITCHEN_STATUSES };
    if (status) where.status = orderStatusSchema.parse(status) as OrderStatus;

    const orders = await db.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: scope === "kitchen" ? "asc" : "desc" },
        take: limit,
    });
    return json(orders.map(serializeOrder));
});

// POST /api/orders — prices and tax are always computed here, never trusted from the client.
export const POST = withAuth(async (req: NextRequest, { restaurantId, userId }) => {
    const input = await parseBody(req, createOrderSchema);

    const ids = [...new Set(input.items.map((i) => i.menuItemId))];
    const menuItems = await db.menuItem.findMany({
        where: { id: { in: ids }, restaurantId },
        include: { discounts: { where: { isActive: true } } },
    });
    const byId = new Map(menuItems.map((m) => [m.id, m]));

    const lines = input.items.map((line) => {
        const item = byId.get(line.menuItemId);
        if (!item) throw new ApiError(400, "One of the items is no longer on the menu");
        if (!item.isAvailable) throw new ApiError(409, `${item.name} is sold out`);
        return { ...line, price: effectivePrice(item) };
    });

    const table = input.tableId
        ? await db.diningTable.findFirst({ where: { id: input.tableId, restaurantId } })
        : null;
    if (input.tableId && !table) throw new ApiError(400, "Table not found");

    const subtotal = roundMoney(lines.reduce((sum, l) => sum + l.price * l.quantity, 0));

    const order = await db.$transaction(async (tx) => {
        const restaurant = await tx.restaurant.update({
            where: { id: restaurantId },
            data: { orderCounter: { increment: 1 } },
            select: { orderCounter: true, taxRate: true },
        });
        const totals = computeTotals(subtotal, restaurant.taxRate, input.payment?.tip ?? 0);

        const created = await tx.order.create({
            data: {
                restaurantId,
                orderNumber: restaurant.orderCounter,
                tableId: table?.id ?? null,
                tableNumber: table?.label ?? null,
                customerName: input.customerName,
                notes: input.notes,
                createdById: userId,
                ...totals,
                ...(input.payment && {
                    status: "PAID",
                    paymentMethod: input.payment.method,
                    paidAt: new Date(),
                }),
                orderItems: {
                    create: lines.map((l) => ({
                        menuItemId: l.menuItemId,
                        quantity: l.quantity,
                        price: l.price,
                        notes: l.notes,
                    })),
                },
            },
            include: orderInclude,
        });

        if (table && !input.payment) {
            await tx.diningTable.update({ where: { id: table.id }, data: { status: "OCCUPIED" } });
        }
        return created;
    });

    return json(serializeOrder(order), 201);
});
