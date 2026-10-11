import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripe, mapSubscriptionStatus, planForPriceId } from "@/lib/stripe";

// POST /api/webhooks/stripe — keep each restaurant's plan in sync with its Stripe subscription.
export async function POST(req: NextRequest) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    const signature = req.headers.get("stripe-signature");
    if (!secret || !signature) {
        return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = getStripe().webhooks.constructEvent(await req.text(), signature, secret);
    } catch (error) {
        console.error("Stripe webhook signature verification failed", error);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                if (session.mode === "subscription" && session.subscription) {
                    const subscription = await getStripe().subscriptions.retrieve(String(session.subscription));
                    await syncSubscription(subscription, session.client_reference_id);
                }
                break;
            }
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
                await syncSubscription(event.data.object);
                break;
        }
    } catch (error) {
        console.error(`Failed to handle Stripe event ${event.type}`, error);
        return NextResponse.json({ error: "Handler failed" }, { status: 500 }); // Stripe will retry
    }

    return NextResponse.json({ received: true });
}

async function syncSubscription(subscription: Stripe.Subscription, fallbackRestaurantId?: string | null) {
    const restaurantId = subscription.metadata?.restaurantId || fallbackRestaurantId;
    const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
    const item = subscription.items.data[0];
    const status = mapSubscriptionStatus(subscription.status);
    const ended = status === "CANCELED";

    const data = {
        stripeCustomerId: customerId,
        stripeSubscriptionId: ended ? null : subscription.id,
        subscriptionStatus: status,
        plan: ended ? ("STARTER" as const) : planForPriceId(item?.price.id),
        currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
        trialEndsAt: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    };

    if (restaurantId) {
        await db.restaurant.update({ where: { id: restaurantId }, data });
    } else {
        await db.restaurant.updateMany({ where: { stripeCustomerId: customerId }, data });
    }
}
