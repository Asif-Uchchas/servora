import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

interface MenuItemSelect {
    id: string;
    name: string;
    price: number;
    category: { name: string } | null;
}

// GET - Fetch all orders for POS
export async function GET(req: NextRequest) {
    try {
        const orders = await db.order.findMany({
            include: {
                orderItems: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                category: {
                                    select: {
                                        name: true
                                    }
                                }
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Transform the data to match the expected format
        const transformedOrders = orders.map(order => ({
            id: order.id,
            orderNumber: `ORD${String(order.orderNumber).padStart(5, '0')}`,
            customerName: order.customerName || "Guest",
            tableNumber: order.tableNumber,
            status: order.status,
            totalAmount: order.totalAmount,
            paymentMethod: "CASH", // Default for now
            paymentStatus: (order.status as string) === "PAID" ? "PAID" : "PENDING",
            subtotal: order.totalAmount * 0.9, // Approximate
            tax: order.totalAmount * 0.1, // Approximate
            tip: 0,
            notes: order.notes,
            createdAt: order.createdAt.toISOString(),
            items: order.orderItems.map(item => ({
                id: item.id,
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.price * item.quantity,
                specialInstructions: item.notes,
                menuItem: {
                    id: (item.menuItem as MenuItemSelect | null)?.id || "",
                    name: (item.menuItem as MenuItemSelect | null)?.name || "Unknown Item",
                    price: (item.menuItem as MenuItemSelect | null)?.price || 0,
                    category: (item.menuItem as MenuItemSelect | null)?.category
                }
            }))
        }));

        // Mock tables data since we don't have a Table model
        const mockTables = [
            { id: "1", number: "T1", status: "AVAILABLE", capacity: 4, location: "Main" },
            { id: "2", number: "T2", status: "OCCUPIED", capacity: 4, location: "Main" },
            { id: "3", number: "T3", status: "AVAILABLE", capacity: 2, location: "Patio" },
            { id: "4", number: "T4", status: "AVAILABLE", capacity: 6, location: "Main" },
        ];

        return NextResponse.json({
            orders: transformedOrders,
            tables: mockTables
        });
    } catch (error) {
        console.error("POS GET error:", error);
        return NextResponse.json({ error: "Failed to fetch POS data" }, { status: 500 });
    }
}

// POST - Create new order
export async function POST(req: NextRequest) {
    try {
        // TODO: Add authentication back when frontend properly sends session
        // const session = await auth();
        // if (!session?.user) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        const body = await req.json();
        const {
            customerName,
            customerPhone,
            customerEmail,
            tableNumber,
            items,
            notes
        } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
        }

        // Get the first restaurant (for simplicity)
        const restaurant = await db.restaurant.findFirst();
        if (!restaurant) {
            return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
        }

        // Create order
        const order = await db.order.create({
            data: {
                customerName,
                tableNumber,
                status: "PENDING",
                totalAmount: items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0),
                notes,
                restaurantId: restaurant.id,
                orderItems: {
                    create: items.map((item: any) => ({
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                        price: item.unitPrice,
                        notes: item.specialInstructions
                    }))
                }
            },
            include: {
                orderItems: {
                    include: {
                        menuItem: {
                            select: {
                                id: true,
                                name: true,
                                price: true,
                                category: {
                                    select: {
                                        name: true
                                    }
                                }
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            id: order.id,
            orderNumber: `ORD${String(order.orderNumber).padStart(5, '0')}`,
            customerName: order.customerName,
            tableNumber: order.tableNumber,
            status: order.status,
            totalAmount: order.totalAmount,
            items: order.orderItems.map(item => ({
                id: item.id,
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.price * item.quantity,
                menuItem: {
                    id: (item.menuItem as MenuItemSelect | null)?.id || "",
                    name: (item.menuItem as MenuItemSelect | null)?.name || "Unknown Item",
                    price: (item.menuItem as MenuItemSelect | null)?.price || 0,
                    category: (item.menuItem as MenuItemSelect | null)?.category
                }
            }))
        });
    } catch (error) {
        console.error("POS POST error:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}