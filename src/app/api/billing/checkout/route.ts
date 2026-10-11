import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { appUrl, getStripe, isBillingConfigured, priceIdForPlan } from "@/lib/stripe";

const checkoutSchema = z.object({ plan: z.enum(["PRO", "BUSINESS"]) });

// POST /api/billing/checkout — start a Stripe Checkout session for a paid plan.
export const POST = withAuth(
    async (req, { restaurantId, userId }) => {
        if (!isBillingConfigured()) throw new ApiError(503, "Billing isn't configured on this server yet");
        const { plan } = await parseBody(req, checkoutSchema);

        const [restaurant, user] = await Promise.all([
            db.restaurant.findUniqueOrThrow({ where: { id: restaurantId } }),
            db.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } }),
        ]);
        if (restaurant.stripeSubscriptionId && restaurant.subscriptionStatus === "ACTIVE") {
            throw new ApiError(409, "You already have a subscription. Use Manage billing to change plans.");
        }

        const stripe = getStripe();
        let customerId = restaurant.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: restaurant.email ?? user.email,
                name: restaurant.name,
                metadata: { restaurantId },
            });
            customerId = customer.id;
            await db.restaurant.update({ where: { id: restaurantId }, data: { stripeCustomerId: customerId } });
        }

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customerId,
            client_reference_id: restaurantId,
            line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
            subscription_data: { metadata: { restaurantId } },
            allow_promotion_codes: true,
            success_url: `${appUrl()}/dashboard/billing?status=success`,
            cancel_url: `${appUrl()}/dashboard/billing?status=cancelled`,
        });

        return json({ url: session.url });
    },
    { roles: ["ADMIN"] }
);
