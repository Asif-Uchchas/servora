import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { discountSchema } from "@/lib/validations";

// POST /api/menu/discounts — schedule a discount on one of this restaurant's items.
export const POST = withAuth(
    async (req, { restaurantId }) => {
        const input = await parseBody(req, discountSchema);
        const item = await db.menuItem.findFirst({ where: { id: input.menuItemId, restaurantId } });
        if (!item) throw new ApiError(404, "Menu item not found");

        const discount = await db.menuItemDiscount.create({ data: { ...input, isActive: true } });
        return json(discount, 201);
    },
    { roles: ["ADMIN", "MANAGER"] }
);
