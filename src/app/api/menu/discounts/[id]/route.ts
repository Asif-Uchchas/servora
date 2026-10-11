import { db } from "@/lib/db";
import { ApiError, json, withAuth } from "@/lib/api";

export const DELETE = withAuth(
    async (_req, { restaurantId, params }) => {
        const discount = await db.menuItemDiscount.findFirst({
            where: { id: params.id, menuItem: { restaurantId } },
        });
        if (!discount) throw new ApiError(404, "Discount not found");
        await db.menuItemDiscount.delete({ where: { id: discount.id } });
        return json({ success: true });
    },
    { roles: ["ADMIN", "MANAGER"] }
);
