import { db } from "@/lib/db";
import { json, withAuth } from "@/lib/api";
import { getEntitlements } from "@/lib/plans";
import { KITCHEN_STATUSES, OPEN_STATUSES, orderInclude, serializeOrder } from "@/lib/orders";
import { roundMoney } from "@/lib/pricing";

const DAY = 86_400_000;

function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

function pctChange(current: number, previous: number) {
    if (previous === 0) return current === 0 ? 0 : null; // null = "new", no meaningful percentage
    return Math.round(((current - previous) / previous) * 1000) / 10;
}

export const GET = withAuth(async (_req, { restaurantId }) => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = new Date(today.getTime() + DAY);
    const lastWeekDay = new Date(today.getTime() - 7 * DAY);
    const lastWeekDayEnd = new Date(lastWeekDay.getTime() + (now.getTime() - today.getTime())); // same time of day
    const weekStart = new Date(today.getTime() - 6 * DAY);

    const sales = { restaurantId, status: { not: "CANCELLED" as const } };

    const restaurant = await db.restaurant.findUniqueOrThrow({ where: { id: restaurantId } });
    const { features } = getEntitlements(restaurant);

    const [todayAgg, lastWeekAgg, weekOrders, liveOrders, kitchenCount, reservations, topItems, inventory] =
        await Promise.all([
            db.order.aggregate({
                where: { ...sales, createdAt: { gte: today, lt: tomorrow } },
                _sum: { totalAmount: true },
                _count: true,
            }),
            db.order.aggregate({
                where: { ...sales, createdAt: { gte: lastWeekDay, lt: lastWeekDayEnd } },
                _sum: { totalAmount: true },
                _count: true,
            }),
            db.order.findMany({
                where: { ...sales, createdAt: { gte: weekStart, lt: tomorrow } },
                select: { createdAt: true, totalAmount: true },
            }),
            db.order.findMany({
                where: { restaurantId, status: { in: OPEN_STATUSES } },
                include: orderInclude,
                orderBy: { createdAt: "asc" },
                take: 6,
            }),
            db.order.count({ where: { restaurantId, status: { in: KITCHEN_STATUSES } } }),
            db.reservation.findMany({
                where: {
                    restaurantId,
                    status: { in: ["CONFIRMED", "PENDING"] },
                    reservationTime: { gte: now, lt: tomorrow },
                },
                select: { guests: true, status: true },
            }),
            db.orderItem.groupBy({
                by: ["menuItemId"],
                where: { order: { ...sales, createdAt: { gte: weekStart } } },
                _sum: { quantity: true },
                orderBy: { _sum: { quantity: "desc" } },
                take: 5,
            }),
            features.inventory
                ? db.inventoryItem.findMany({
                      where: { restaurantId },
                      select: { id: true, name: true, quantity: true, unit: true, minimumQuantity: true },
                  })
                : Promise.resolve([]),
        ]);

    const names = await db.menuItem.findMany({
        where: { id: { in: topItems.map((t) => t.menuItemId) } },
        select: { id: true, name: true, image: true },
    });
    const nameById = new Map(names.map((n) => [n.id, n]));

    const revenueData = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(weekStart.getTime() + i * DAY);
        const next = new Date(day.getTime() + DAY);
        const dayOrders = weekOrders.filter((o) => o.createdAt >= day && o.createdAt < next);
        return {
            date: day.toISOString(),
            revenue: roundMoney(dayOrders.reduce((s, o) => s + o.totalAmount, 0)),
            orders: dayOrders.length,
        };
    });

    const todayRevenue = roundMoney(todayAgg._sum.totalAmount ?? 0);
    const lastWeekRevenue = roundMoney(lastWeekAgg._sum.totalAmount ?? 0);
    const avgTicket = todayAgg._count ? roundMoney(todayRevenue / todayAgg._count) : 0;
    const lastWeekAvg = lastWeekAgg._count ? lastWeekRevenue / lastWeekAgg._count : 0;

    return json({
        currency: restaurant.currency,
        today: {
            revenue: todayRevenue,
            revenueChange: pctChange(todayRevenue, lastWeekRevenue),
            orders: todayAgg._count,
            ordersChange: pctChange(todayAgg._count, lastWeekAgg._count),
            avgTicket,
            avgTicketChange: pctChange(avgTicket, lastWeekAvg),
            covers: reservations.reduce((s, r) => s + r.guests, 0),
            reservations: reservations.length,
        },
        weekRevenue: roundMoney(revenueData.reduce((s, d) => s + d.revenue, 0)),
        revenueData,
        kitchenCount,
        liveOrders: liveOrders.map(serializeOrder),
        topItems: topItems.map((t) => ({
            id: t.menuItemId,
            name: nameById.get(t.menuItemId)?.name ?? "Deleted item",
            image: nameById.get(t.menuItemId)?.image ?? null,
            quantity: t._sum.quantity ?? 0,
        })),
        lowStock: inventory.filter((i) => i.quantity <= i.minimumQuantity),
        features,
    });
});
