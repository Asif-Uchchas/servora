import { db } from "@/lib/db";
import { ApiError, json, withAuth } from "@/lib/api";
import { appUrl, getStripe, isBillingConfigured } from "@/lib/stripe";

// POST /api/billing/portal — open Stripe's customer portal to change plan, card or cancel.
export const POST = withAuth(
    async (_req, { restaurantId }) => {
        if (!isBillingConfigured()) throw new ApiError(503, "Billing isn't configured on this server yet");
        const restaurant = await db.restaurant.findUniqueOrThrow({ where: { id: restaurantId } });
        if (!restaurant.stripeCustomerId) throw new ApiError(400, "Choose a plan first");

        const session = await getStripe().billingPortal.sessions.create({
            customer: restaurant.stripeCustomerId,
            return_url: `${appUrl()}/dashboard/billing`,
        });
        return json({ url: session.url });
    },
    { roles: ["ADMIN"] }
);
