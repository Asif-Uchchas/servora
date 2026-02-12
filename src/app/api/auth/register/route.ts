import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, password, restaurantName } = body;

        // Validate input
        if (!name || !email || !password || !restaurantName) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 409 }
            );
        }

        // Create Restaurant first
        const restaurant = await db.restaurant.create({
            data: {
                name: restaurantName,
            },
        });

        // Hash password
        const passwordHash = await hash(password, 12);

        // Create User (Admin role by default for new registrations)
        const user = await db.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: "ADMIN",
                restaurantId: restaurant.id,
            },
        });

        // Create default Menu Categories properly
        await db.menuCategory.createMany({
            data: [
                { name: "Appetizers", displayOrder: 1, restaurantId: restaurant.id },
                { name: "Main Course", displayOrder: 2, restaurantId: restaurant.id },
                { name: "Desserts", displayOrder: 3, restaurantId: restaurant.id },
                { name: "Beverages", displayOrder: 4, restaurantId: restaurant.id },
            ],
        });

        // We don't return the password hash
        const { passwordHash: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            {
                user: userWithoutPassword,
                message: "User registered successfully",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
