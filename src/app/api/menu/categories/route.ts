import { db } from "@/lib/db";
import { json, parseBody, withAuth } from "@/lib/api";
import { categorySchema } from "@/lib/validations";

export const GET = withAuth(async (_req, { restaurantId }) => {
    const categories = await db.menuCategory.findMany({
        where: { restaurantId },
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { menuItems: true } } },
    });
    return json(categories);
});

export const POST = withAuth(
    async (req, { restaurantId }) => {
        const input = await parseBody(req, categorySchema);
        const last = await db.menuCategory.aggregate({ where: { restaurantId }, _max: { displayOrder: true } });
        const category = await db.menuCategory.create({
            data: {
                ...input,
                displayOrder: input.displayOrder ?? (last._max.displayOrder ?? 0) + 1,
                restaurantId,
            },
            include: { _count: { select: { menuItems: true } } },
        });
        return json(category, 201);
    },
    { roles: ["ADMIN", "MANAGER"] }
);
