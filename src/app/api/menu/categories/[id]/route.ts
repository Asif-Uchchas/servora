import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { categorySchema } from "@/lib/validations";

async function findOwned(id: string, restaurantId: string) {
    const category = await db.menuCategory.findFirst({
        where: { id, restaurantId },
        include: { _count: { select: { menuItems: true } } },
    });
    if (!category) throw new ApiError(404, "Category not found");
    return category;
}

export const PATCH = withAuth(
    async (req, { restaurantId, params }) => {
        await findOwned(params.id, restaurantId);
        const input = await parseBody(req, categorySchema.partial());
        const category = await db.menuCategory.update({
            where: { id: params.id },
            data: input,
            include: { _count: { select: { menuItems: true } } },
        });
        return json(category);
    },
    { roles: ["ADMIN", "MANAGER"] }
);

export const DELETE = withAuth(
    async (_req, { restaurantId, params }) => {
        const category = await findOwned(params.id, restaurantId);
        if (category._count.menuItems > 0) {
            throw new ApiError(409, "Move or delete the items in this category first");
        }
        await db.menuCategory.delete({ where: { id: params.id } });
        return json({ success: true });
    },
    { roles: ["ADMIN", "MANAGER"] }
);
