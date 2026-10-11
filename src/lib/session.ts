import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntitlements } from "@/lib/plans";

/**
 * The signed-in member and their restaurant, for server components and layouts.
 * Cached per request. Redirects to /login when there's no valid session.
 */
export const getWorkspace = cache(async () => {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await db.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            restaurant: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    currency: true,
                    taxRate: true,
                    plan: true,
                    subscriptionStatus: true,
                    trialEndsAt: true,
                    currentPeriodEnd: true,
                },
            },
        },
    });
    if (!user) redirect("/login");

    const { restaurant, ...member } = user;
    return { user: member, restaurant, entitlements: getEntitlements(restaurant) };
});

export type Workspace = Awaited<ReturnType<typeof getWorkspace>>;
