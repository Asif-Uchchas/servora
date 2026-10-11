import { db } from "@/lib/db";
import { ApiError, json, parseBody, withErrors } from "@/lib/api";
import { publicReservationSchema } from "@/lib/validations";
import { getEntitlements } from "@/lib/plans";

// POST /api/public/:slug/reservations — a guest requests a table from the public menu page.
export const POST = withErrors(async (req, params) => {
    const restaurant = await db.restaurant.findUnique({ where: { slug: params.slug } });
    if (!restaurant) throw new ApiError(404, "Restaurant not found");
    if (!restaurant.acceptReservations || !getEntitlements(restaurant).features.reservations) {
        throw new ApiError(403, "This restaurant isn't taking online bookings right now");
    }

    const input = await parseBody(req, publicReservationSchema);
    if (input.reservationTime.getTime() < Date.now() - 5 * 60_000) {
        throw new ApiError(400, "Choose a time in the future");
    }
    if (input.guests > 20) throw new ApiError(400, "For groups over 20, please call the restaurant");

    // Light abuse guard: one pending request per phone number per restaurant at a time.
    const duplicate = await db.reservation.findFirst({
        where: { restaurantId: restaurant.id, phone: input.phone, status: "PENDING", reservationTime: { gte: new Date() } },
        select: { id: true },
    });
    if (duplicate) throw new ApiError(409, "You already have a pending request — the restaurant will confirm it shortly");

    await db.reservation.create({
        data: { ...input, restaurantId: restaurant.id, status: "PENDING" },
    });
    return json({ success: true }, 201);
});
