import "next-auth";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface User {
        role?: string;
        restaurantId?: string;
        restaurantName?: string;
        restaurantSlug?: string;
    }

    interface Session {
        user: {
            id: string;
            role: string;
            restaurantId: string;
            restaurantName: string;
            restaurantSlug: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string;
        restaurantId?: string;
        restaurantName?: string;
        restaurantSlug?: string;
    }
}
