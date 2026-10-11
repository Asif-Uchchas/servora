import { db } from "@/lib/db";
import { json, parseBody, withAuth } from "@/lib/api";
import { inventoryItemSchema } from "@/lib/validations";

const inventoryInclude = {
    transactions: { orderBy: { createdAt: "desc" as const }, take: 10 },
};

export const GET = withAuth(
    async (_req, { restaurantId }) => {
        const items = await db.inventoryItem.findMany({
            where: { restaurantId },
            include: inventoryInclude,
            orderBy: { name: "asc" },
        });
        return json(items);
    },
    { feature: "inventory" }
);

export const POST = withAuth(
    async (req, { restaurantId }) => {
        const input = await parseBody(req, inventoryItemSchema);
        const item = await db.inventoryItem.create({
            data: { ...input, restaurantId },
            include: inventoryInclude,
        });
        return json(item, 201);
    },
    { roles: ["ADMIN", "MANAGER"], feature: "inventory" }
);
