import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { reservationSchema, reservationStatusSchema } from "@/lib/validations";

const updateSchema = reservationSchema.partial().extend({ status: reservationStatusSchema.optional() });

async function findOwned(id: string, restaurantId: string) {
    const reservation = await db.reservation.findFirst({ where: { id, restaurantId } });
    if (!reservation) throw new ApiError(404, "Reservation not found");
    return reservation;
}

export const PATCH = withAuth(
    async (req, { restaurantId, params }) => {
        await findOwned(params.id, restaurantId);
        const input = await parseBody(req, updateSchema);
        const reservation = await db.reservation.update({ where: { id: params.id }, data: input });
        return json(reservation);
    },
    { feature: "reservations" }
);

export const DELETE = withAuth(
    async (_req, { restaurantId, params }) => {
        await findOwned(params.id, restaurantId);
        await db.reservation.delete({ where: { id: params.id } });
        return json({ success: true });
    },
    { roles: ["ADMIN", "MANAGER"], feature: "reservations" }
);
