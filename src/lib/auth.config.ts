import type { NextAuthConfig } from "next-auth";

const PROTECTED_PREFIXES = ["/dashboard", "/pos", "/kitchen"];
const AUTH_PAGES = ["/login", "/register"];

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    session: { strategy: "jwt" },
    providers: [],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isProtected = PROTECTED_PREFIXES.some((p) => nextUrl.pathname.startsWith(p));

            if (isProtected) return isLoggedIn; // false → redirect to /login with callbackUrl
            if (isLoggedIn && AUTH_PAGES.includes(nextUrl.pathname)) {
                return Response.redirect(new URL("/dashboard", nextUrl));
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.role = user.role;
                token.restaurantId = user.restaurantId;
                token.restaurantName = user.restaurantName;
                token.restaurantSlug = user.restaurantSlug;
            }
            // Client calls `useSession().update({...})` after editing profile or restaurant settings.
            if (trigger === "update" && session) {
                if (typeof session.name === "string") token.name = session.name;
                if (typeof session.restaurantName === "string") token.restaurantName = session.restaurantName;
                if (typeof session.restaurantSlug === "string") token.restaurantSlug = session.restaurantSlug;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!;
                session.user.role = (token.role as string | undefined) ?? "STAFF";
                session.user.restaurantId = (token.restaurantId as string | undefined) ?? "";
                session.user.restaurantName = (token.restaurantName as string | undefined) ?? "";
                session.user.restaurantSlug = (token.restaurantSlug as string | undefined) ?? "";
            }
            return session;
        },
    },
} satisfies NextAuthConfig;
