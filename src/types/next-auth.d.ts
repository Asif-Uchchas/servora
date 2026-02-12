import "next-auth";

declare module "next-auth" {
    interface User {
        role?: string;
        restaurantId?: string;
        restaurantName?: string;
    }

    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
            image?: string | null;
            role: string;
            restaurantId: string;
            restaurantName: string;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string;
        restaurantId?: string;
        restaurantName?: string;
    }
}
