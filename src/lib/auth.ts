import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const credentialsSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = credentialsSchema.safeParse(credentials);
                if (!parsed.success) return null;

                const user = await db.user.findUnique({
                    where: { email: parsed.data.email },
                    include: { restaurant: { select: { name: true, slug: true } } },
                });
                if (!user) return null;

                const isValid = await compare(parsed.data.password, user.passwordHash);
                if (!isValid) return null;

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    restaurantId: user.restaurantId,
                    restaurantName: user.restaurant.name,
                    restaurantSlug: user.restaurant.slug,
                    image: user.avatar,
                };
            },
        }),
    ],
});
