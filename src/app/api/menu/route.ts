import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { menuItemSchema } from "@/lib/validations";
import { getEntitlements } from "@/lib/plans";
import { menuItemInclude } from "@/lib/menu";

// GET /api/menu — categories and items for the signed-in restaurant.
export const GET = withAuth(async (_req, { restaurantId }) => {
    const [categories, menuItems] = await Promise.all([
        db.menuCategory.findMany({
            where: { restaurantId },
            orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
            include: { _count: { select: { menuItems: true } } },
        }),
        db.menuItem.findMany({
            where: { restaurantId },
            include: menuItemInclude,
            orderBy: [{ category: { displayOrder: "asc" } }, { name: "asc" }],
        }),
    ]);
    return json({ categories, menuItems });
});

export const POST = withAuth(
    async (req, { restaurantId }) => {
        const input = await parseBody(req, menuItemSchema);

        const [restaurant, count, category] = await Promise.all([
            db.restaurant.findUniqueOrThrow({ where: { id: restaurantId } }),
            db.menuItem.count({ where: { restaurantId } }),
            db.menuCategory.findFirst({ where: { id: input.categoryId, restaurantId } }),
        ]);
        if (!category) throw new ApiError(400, "Category not found");

        const { limits, plan } = getEntitlements(restaurant);
        if (count >= limits.menuItems) {
            throw new ApiError(402, `The ${plan.name} plan includes up to ${limits.menuItems} menu items. Upgrade to add more.`);
        }

        const menuItem = await db.menuItem.create({
            data: { ...input, restaurantId },
            include: menuItemInclude,
        });
        return json(menuItem, 201);
    },
    { roles: ["ADMIN", "MANAGER"] }
);
