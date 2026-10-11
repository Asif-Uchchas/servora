import { z } from "zod";
import { db } from "@/lib/db";
import { json, parseBody, withAuth } from "@/lib/api";

const bulkSchema = z.object({
    ids: z.array(z.string().min(1)).min(1).max(500),
    action: z.enum(["delete", "available", "unavailable"]),
});

// POST /api/menu/bulk — act on several items at once. Only touches items owned by this restaurant.
export const POST = withAuth(
    async (req, { restaurantId }) => {
        const { ids, action } = await parseBody(req, bulkSchema);
        const where = { id: { in: ids }, restaurantId };

        const result =
            action === "delete"
                ? await db.menuItem.deleteMany({ where })
                : await db.menuItem.updateMany({ where, data: { isAvailable: action === "available" } });

        return json({ count: result.count });
    },
    { roles: ["ADMIN", "MANAGER"] }
);
