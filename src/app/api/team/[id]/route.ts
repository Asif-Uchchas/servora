import { z } from "zod";
import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";

const updateSchema = z.object({ role: z.enum(["ADMIN", "MANAGER", "STAFF"]) });

async function findMember(id: string, restaurantId: string) {
    const member = await db.user.findFirst({ where: { id, restaurantId }, select: { id: true, role: true } });
    if (!member) throw new ApiError(404, "Team member not found");
    return member;
}

/** Never let a workspace end up without an admin. */
async function assertAnotherAdmin(restaurantId: string, excludingId: string) {
    const admins = await db.user.count({ where: { restaurantId, role: "ADMIN", NOT: { id: excludingId } } });
    if (admins === 0) throw new ApiError(409, "A workspace needs at least one admin");
}

export const PATCH = withAuth(
    async (req, { restaurantId, params }) => {
        const member = await findMember(params.id, restaurantId);
        const { role } = await parseBody(req, updateSchema);
        if (member.role === "ADMIN" && role !== "ADMIN") await assertAnotherAdmin(restaurantId, member.id);

        const updated = await db.user.update({
            where: { id: member.id },
            data: { role },
            select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
        });
        return json(updated);
    },
    { roles: ["ADMIN"] }
);

export const DELETE = withAuth(
    async (_req, { restaurantId, userId, params }) => {
        const member = await findMember(params.id, restaurantId);
        if (member.id === userId) throw new ApiError(400, "You can't remove yourself");
        if (member.role === "ADMIN") await assertAnotherAdmin(restaurantId, member.id);

        await db.user.delete({ where: { id: member.id } });
        return json({ success: true });
    },
    { roles: ["ADMIN"] }
);
