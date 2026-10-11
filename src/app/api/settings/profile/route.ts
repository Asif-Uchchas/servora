import { db } from "@/lib/db";
import { json, parseBody, withAuth } from "@/lib/api";
import { profileSchema } from "@/lib/validations";

const select = { id: true, name: true, email: true, phone: true, role: true };

export const GET = withAuth(async (_req, { userId }) => {
    return json(await db.user.findUniqueOrThrow({ where: { id: userId }, select }));
});

export const PATCH = withAuth(async (req, { userId }) => {
    const input = await parseBody(req, profileSchema);
    return json(await db.user.update({ where: { id: userId }, data: input, select }));
});
