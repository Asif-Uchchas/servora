import { db } from "@/lib/db";
import { json, parseBody, withAuth } from "@/lib/api";
import { reservationSchema } from "@/lib/validations";

// GET /api/reservations?from=ISO&to=ISO
export const GET = withAuth(
    async (req, { restaurantId }) => {
        const from = req.nextUrl.searchParams.get("from");
        const to = req.nextUrl.searchParams.get("to");
        const reservations = await db.reservation.findMany({
            where: {
                restaurantId,
                ...(from || to
                    ? { reservationTime: { ...(from && { gte: new Date(from) }), ...(to && { lte: new Date(to) }) } }
                    : {}),
            },
            orderBy: { reservationTime: "asc" },
        });
        return json(reservations);
    },
    { feature: "reservations" }
);

export const POST = withAuth(
    async (req, { restaurantId }) => {
        const input = await parseBody(req, reservationSchema);
        const reservation = await db.reservation.create({
            data: { ...input, restaurantId, status: "CONFIRMED" },
        });
        return json(reservation, 201);
    },
    { feature: "reservations" }
);
