import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Fetch all orders
export async function GET(req: NextRequest) {
    try {
        const restaurant = await db.restaurant.findFirst();
        if (!restaurant) {
            return NextResponse.json({ error: "No restaurant found" }, { status: 404 });
        }

        const orders = await db.order.findMany({
            where: { restaurantId: restaurant.id },
            include: {
                orderItems: {
                    include: {
                        menuItem: {
                            select: { id: true, name: true, image: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(orders);
    } catch (error) {
        console.error("Orders GET error:", error);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}

// POST - Create a new order
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { restaurantId, tableNumber, customerName, notes, items } = body;

        // Calculate total amount
        let totalAmount = 0;
        const orderItemsData = [];

        for (const item of items) {
            const menuItem = await db.menuItem.findUnique({ where: { id: item.menuItemId } });
            if (!menuItem) continue;

            const price = menuItem.offerPrice || menuItem.price;
            totalAmount += price * item.quantity;
            orderItemsData.push({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: price,
                notes: item.notes,
            });
        }

        const order = await db.order.create({
            data: {
                restaurantId,
                tableNumber,
                customerName,
                notes,
                totalAmount,
                orderItems: {
                    create: orderItemsData,
                },
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: {
                            select: { id: true, name: true, image: true },
                        },
                    },
                },
            },
        });

        return NextResponse.json(order, { status: 201 });
    } catch (error) {
        console.error("Orders POST error:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}

// PUT - Update order status
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, status } = body;

        if (!id || !status) {
            return NextResponse.json({ error: "Order ID and status required" }, { status: 400 });
        }

        const order = await db.order.update({
            where: { id },
            data: { status },
            include: {
                orderItems: {
                    include: {
                        menuItem: {
                            select: { id: true, name: true, image: true },
                        },
                    },
                },
            },
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("Orders PUT error:", error);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}
