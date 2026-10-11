import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { inventoryItemSchema } from "@/lib/validations";

async function findOwned(id: string, restaurantId: string) {
    const item = await db.inventoryItem.findFirst({ where: { id, restaurantId }, select: { id: true } });
    if (!item) throw new ApiError(404, "Inventory item not found");
}

// Quantity changes go through /transactions so there's an audit trail; this edits the item's setup.
export const PATCH = withAuth(
    async (req, { restaurantId, params }) => {
        await findOwned(params.id, restaurantId);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { quantity: _ignored, ...input } = await parseBody(req, inventoryItemSchema.partial());
        const item = await db.inventoryItem.update({
            where: { id: params.id },
            data: input,
            include: { transactions: { orderBy: { createdAt: "desc" }, take: 10 } },
        });
        return json(item);
    },
    { roles: ["ADMIN", "MANAGER"], feature: "inventory" }
);

export const DELETE = withAuth(
    async (_req, { restaurantId, params }) => {
        await findOwned(params.id, restaurantId);
        await db.inventoryItem.delete({ where: { id: params.id } });
        return json({ success: true });
    },
    { roles: ["ADMIN", "MANAGER"], feature: "inventory" }
);
