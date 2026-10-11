import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { ApiError, json, parseBody, withErrors } from "@/lib/api";
import { registerSchema } from "@/lib/validations";
import { uniqueRestaurantSlug } from "@/lib/slug";
import { TRIAL_DAYS } from "@/lib/plans";

const STARTER_CATEGORIES = ["Starters", "Mains", "Desserts", "Drinks"];
const STARTER_TABLES = ["T1", "T2", "T3", "T4", "T5", "T6"];

// POST /api/auth/register — create a workspace: restaurant + admin user, on a Pro trial.
export const POST = withErrors(async (req) => {
    const input = await parseBody(req, registerSchema);

    const existing = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
    if (existing) throw new ApiError(409, "An account with this email already exists");

    const [passwordHash, slug] = await Promise.all([hash(input.password, 12), uniqueRestaurantSlug(input.restaurantName)]);

    const user = await db.$transaction(async (tx) => {
        const restaurant = await tx.restaurant.create({
            data: {
                name: input.restaurantName,
                slug,
                plan: "PRO",
                subscriptionStatus: "TRIALING",
                trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000),
                menuCategories: {
                    create: STARTER_CATEGORIES.map((name, i) => ({ name, displayOrder: i + 1 })),
                },
                tables: {
                    create: STARTER_TABLES.map((label) => ({ label, capacity: 4, area: "Main room" })),
                },
            },
        });
        return tx.user.create({
            data: {
                name: input.name,
                email: input.email,
                passwordHash,
                role: "ADMIN",
                restaurantId: restaurant.id,
            },
            select: { id: true, name: true, email: true, role: true, restaurantId: true },
        });
    });

    return json({ user, message: "Workspace created" }, 201);
});
