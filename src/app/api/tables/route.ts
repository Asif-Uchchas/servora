import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { tableSchema } from "@/lib/validations";
import { getEntitlements } from "@/lib/plans";
import { OPEN_STATUSES } from "@/lib/orders";

// GET /api/tables — tables with their open orders' running totals, for the POS floor view.
export const GET = withAuth(async (_req, { restaurantId }) => {
    const tables = await db.diningTable.findMany({
        where: { restaurantId },
        orderBy: [{ area: "asc" }, { label: "asc" }],
        include: {
            orders: {
                where: { status: { in: OPEN_STATUSES } },
                select: { id: true, orderNumber: true, totalAmount: true, createdAt: true, status: true },
            },
        },
    });
    return json(tables);
});

export const POST = withAuth(
    async (req, { restaurantId }) => {
        const input = await parseBody(req, tableSchema);
        const [restaurant, count] = await Promise.all([
            db.restaurant.findUniqueOrThrow({ where: { id: restaurantId } }),
            db.diningTable.count({ where: { restaurantId } }),
        ]);
        const { limits, plan } = getEntitlements(restaurant);
        if (count >= limits.tables) {
            throw new ApiError(402, `The ${plan.name} plan includes up to ${limits.tables} tables. Upgrade to add more.`);
        }
        const table = await db.diningTable.create({ data: { ...input, restaurantId } });
        return json(table, 201);
    },
    { roles: ["ADMIN", "MANAGER"] }
);
