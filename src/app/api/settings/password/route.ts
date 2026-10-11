import { compare, hash } from "bcryptjs";
import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { changePasswordSchema } from "@/lib/validations";

export const POST = withAuth(async (req, { userId }) => {
    const { currentPassword, newPassword } = await parseBody(req, changePasswordSchema);
    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } });

    if (!(await compare(currentPassword, user.passwordHash))) {
        throw new ApiError(400, "Your current password is incorrect");
    }
    await db.user.update({ where: { id: userId }, data: { passwordHash: await hash(newPassword, 12) } });
    return json({ success: true });
});
