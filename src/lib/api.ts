import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { Prisma, type Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntitlements, type Feature } from "@/lib/plans";

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public details?: unknown
    ) {
        super(message);
    }
}

export interface AuthContext {
    userId: string;
    restaurantId: string;
    role: Role;
}

type RouteContext = { params: Promise<Record<string, string>> };

interface HandlerOptions {
    /** Roles allowed to call this handler. Omit to allow any signed-in member. */
    roles?: Role[];
    /** Plan feature the restaurant must have. */
    feature?: Feature;
}

type Handler = (
    req: NextRequest,
    ctx: AuthContext & { params: Record<string, string> }
) => Promise<Response>;

/**
 * Wraps a route handler with authentication, tenant scoping, role checks and
 * uniform error handling. The user's role and restaurant are re-read from the
 * database on every call so role changes and removals take effect immediately,
 * not when the JWT expires.
 */
export function withAuth(handler: Handler, options: HandlerOptions = {}) {
    return async (req: NextRequest, route: RouteContext) => {
        try {
            const session = await auth();
            if (!session?.user?.id) throw new ApiError(401, "Unauthorized");

            const user = await db.user.findUnique({
                where: { id: session.user.id },
                select: { id: true, role: true, restaurantId: true },
            });
            if (!user) throw new ApiError(401, "Unauthorized");

            if (options.roles && !options.roles.includes(user.role)) {
                throw new ApiError(403, "You don't have permission to do that");
            }

            if (options.feature) await requireFeature(user.restaurantId, options.feature);

            const params = route?.params ? await route.params : {};
            return await handler(req, {
                userId: user.id,
                restaurantId: user.restaurantId,
                role: user.role,
                params,
            });
        } catch (error) {
            return errorResponse(error);
        }
    };
}

/** Same error handling as `withAuth`, for public endpoints. */
export function withErrors(handler: (req: NextRequest, params: Record<string, string>) => Promise<Response>) {
    return async (req: NextRequest, route: RouteContext) => {
        try {
            const params = route?.params ? await route.params : {};
            return await handler(req, params);
        } catch (error) {
            return errorResponse(error);
        }
    };
}

export async function requireFeature(restaurantId: string, feature: Feature) {
    const restaurant = await db.restaurant.findUniqueOrThrow({
        where: { id: restaurantId },
        select: { plan: true, subscriptionStatus: true, trialEndsAt: true },
    });
    if (!getEntitlements(restaurant).features[feature]) {
        throw new ApiError(402, "Upgrade your plan to use this feature", { feature });
    }
}

export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
    let json: unknown;
    try {
        json = await req.json();
    } catch {
        throw new ApiError(400, "Request body must be valid JSON");
    }
    return schema.parse(json);
}

export function json<T>(data: T, status = 200) {
    return NextResponse.json(data, { status });
}

export function errorResponse(error: unknown) {
    if (error instanceof ApiError) {
        return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
    }
    if (error instanceof ZodError) {
        const first = error.issues[0];
        const message = first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input";
        return NextResponse.json({ error: message, details: error.issues }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (error.code === "P2002") return NextResponse.json({ error: "That already exists" }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
