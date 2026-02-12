import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
    try {
        // Get the first restaurant (for demo)
        const restaurant = await db.restaurant.findFirst();
        if (!restaurant) {
            return NextResponse.json({ error: "No restaurant found" }, { status: 404 });
        }

        const restaurantId = restaurant.id;

        // Today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's orders
        const todayOrders = await db.order.findMany({
            where: {
                restaurantId,
                createdAt: { gte: today, lt: tomorrow },
            },
        });

        const todayRevenue = todayOrders
            .filter((o) => o.status !== "CANCELLED")
            .reduce((sum, o) => sum + o.totalAmount, 0);

        // Get total statistics
        const totalOrders = await db.order.count({ where: { restaurantId } });
        const allOrders = await db.order.findMany({
            where: { restaurantId, status: { not: "CANCELLED" } },
            select: { totalAmount: true },
        });
        const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        // Active reservations
        const activeReservations = await db.reservation.count({
            where: {
                restaurantId,
                status: { in: ["CONFIRMED", "PENDING"] },
                reservationTime: { gte: new Date() },
            },
        });

        // Low stock items
        const lowStockItems = await db.inventoryItem.findMany({
            where: {
                restaurantId,
                quantity: { lte: db.inventoryItem.fields.minimumQuantity as unknown as number },
            },
        });

        // Workaround: fetch all and filter
        const allInventory = await db.inventoryItem.findMany({
            where: { restaurantId },
        });
        const lowStock = allInventory.filter((i) => i.quantity <= i.minimumQuantity);

        // Popular items (top 5 by order count)
        const popularItems = await db.orderItem.groupBy({
            by: ["menuItemId"],
            _count: { id: true },
            _sum: { price: true },
            orderBy: { _count: { id: "desc" } },
            take: 5,
        });

        const popularItemDetails = await Promise.all(
            popularItems.map(async (item) => {
                const menuItem = await db.menuItem.findUnique({
                    where: { id: item.menuItemId },
                    select: { id: true, name: true, image: true },
                });
                return {
                    id: menuItem?.id || "",
                    name: menuItem?.name || "Unknown",
                    image: menuItem?.image || null,
                    totalOrders: item._count.id,
                    revenue: item._sum.price || 0,
                };
            })
        );

        // Revenue data (last 7 days)
        const revenueData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const nextDay = new Date(date);
            nextDay.setDate(nextDay.getDate() + 1);

            const dayOrders = await db.order.findMany({
                where: {
                    restaurantId,
                    createdAt: { gte: date, lt: nextDay },
                    status: { not: "CANCELLED" },
                },
            });

            revenueData.push({
                date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
                orders: dayOrders.length,
            });
        }

        // Recent orders
        const recentOrders = await db.order.findMany({
            where: { restaurantId },
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
            take: 5,
        });

        return NextResponse.json({
            totalRevenue,
            todayRevenue,
            totalOrders,
            todayOrders: todayOrders.length,
            activeReservations,
            lowStockItems: lowStock.length,
            popularItems: popularItemDetails,
            revenueData,
            recentOrders,
            lowStockAlerts: lowStock.map((i) => ({
                id: i.id,
                name: i.name,
                quantity: i.quantity,
                unit: i.unit,
                minimumQuantity: i.minimumQuantity,
            })),
        });
    } catch (error) {
        console.error("Dashboard API error:", error);
        return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
    }
}
