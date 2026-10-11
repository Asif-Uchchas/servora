import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { menuItemSchema } from "@/lib/validations";
import { menuItemInclude } from "@/lib/menu";

const updateSchema = menuItemSchema.partial();

async function findOwned(id: string, restaurantId: string) {
    const item = await db.menuItem.findFirst({ where: { id, restaurantId }, select: { id: true } });
    if (!item) throw new ApiError(404, "Menu item not found");
    return item;
}

export const PATCH = withAuth(
    async (req, { restaurantId, params }) => {
        await findOwned(params.id, restaurantId);
        const input = await parseBody(req, updateSchema);

        if (input.categoryId) {
            const category = await db.menuCategory.findFirst({ where: { id: input.categoryId, restaurantId } });
            if (!category) throw new ApiError(400, "Category not found");
        }

        const menuItem = await db.menuItem.update({
            where: { id: params.id },
            data: input,
            include: menuItemInclude,
        });
        return json(menuItem);
    },
    { roles: ["ADMIN", "MANAGER"] }
);

export const DELETE = withAuth(
    async (_req, { restaurantId, params }) => {
        await findOwned(params.id, restaurantId);
        await db.menuItem.delete({ where: { id: params.id } });
        return json({ success: true });
    },
    { roles: ["ADMIN", "MANAGER"] }
);
