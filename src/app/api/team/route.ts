import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { teamMemberSchema } from "@/lib/validations";
import { getEntitlements } from "@/lib/plans";

const select = { id: true, name: true, email: true, role: true, phone: true, createdAt: true };

export const GET = withAuth(
    async (_req, { restaurantId }) => {
        const members = await db.user.findMany({ where: { restaurantId }, select, orderBy: { createdAt: "asc" } });
        return json(members);
    },
    { roles: ["ADMIN", "MANAGER"] }
);

// POST /api/team — add a staff account. The admin shares the temporary password with them.
export const POST = withAuth(
    async (req, { restaurantId }) => {
        const input = await parseBody(req, teamMemberSchema);

        const [restaurant, count, existing] = await Promise.all([
            db.restaurant.findUniqueOrThrow({ where: { id: restaurantId } }),
            db.user.count({ where: { restaurantId } }),
            db.user.findUnique({ where: { email: input.email }, select: { id: true } }),
        ]);
        if (existing) throw new ApiError(409, "Someone already uses this email");

        const { limits, plan } = getEntitlements(restaurant);
        if (count >= limits.staff) {
            throw new ApiError(402, `The ${plan.name} plan includes up to ${limits.staff} team members. Upgrade to add more.`);
        }

        const member = await db.user.create({
            data: {
                name: input.name,
                email: input.email,
                role: input.role,
                passwordHash: await hash(input.password, 12),
                restaurantId,
            },
            select,
        });
        return json(member, 201);
    },
    { roles: ["ADMIN"] }
);
