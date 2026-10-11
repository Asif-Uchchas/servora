import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { inventoryTransactionSchema } from "@/lib/validations";

// POST /api/inventory/:id/transactions — record stock in/out and adjust the quantity atomically.
export const POST = withAuth(
    async (req, { restaurantId, params }) => {
        const { type, quantity, notes } = await parseBody(req, inventoryTransactionSchema);

        const item = await db.inventoryItem.findFirst({ where: { id: params.id, restaurantId } });
        if (!item) throw new ApiError(404, "Inventory item not found");

        const delta = type === "ADD" ? quantity : -quantity;
        if (item.quantity + delta < 0) {
            throw new ApiError(409, `Only ${item.quantity} ${item.unit} of ${item.name} in stock`);
        }

        const [transaction, updated] = await db.$transaction([
            db.inventoryTransaction.create({ data: { inventoryItemId: item.id, type, quantity, notes } }),
            db.inventoryItem.update({
                where: { id: item.id },
                data: { quantity: { increment: delta } },
                include: { transactions: { orderBy: { createdAt: "desc" }, take: 10 } },
            }),
        ]);
        return json({ transaction, item: updated }, 201);
    },
    { feature: "inventory" }
);
