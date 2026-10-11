import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { restaurantSettingsSchema } from "@/lib/validations";
import { isReservedSlug } from "@/lib/slug";

const select = {
    id: true,
    name: true,
    slug: true,
    description: true,
    email: true,
    phone: true,
    address: true,
    openingHours: true,
    currency: true,
    timezone: true,
    taxRate: true,
    acceptReservations: true,
};

export const GET = withAuth(async (_req, { restaurantId }) => {
    return json(await db.restaurant.findUniqueOrThrow({ where: { id: restaurantId }, select }));
});

export const PATCH = withAuth(
    async (req, { restaurantId }) => {
        const input = await parseBody(req, restaurantSettingsSchema);
        if (isReservedSlug(input.slug)) throw new ApiError(400, "That menu address is reserved");

        const taken = await db.restaurant.findFirst({
            where: { slug: input.slug, NOT: { id: restaurantId } },
            select: { id: true },
        });
        if (taken) throw new ApiError(409, "That menu address is already taken");

        const restaurant = await db.restaurant.update({ where: { id: restaurantId }, data: input, select });
        return json(restaurant);
    },
    { roles: ["ADMIN"] }
);
