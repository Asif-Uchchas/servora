import { db } from "@/lib/db";
import { json, withAuth } from "@/lib/api";
import { getEntitlements } from "@/lib/plans";
import type { NotificationItem } from "@/types";

// GET /api/notifications — things that need someone's attention right now.
export const GET = withAuth(async (_req, { restaurantId }) => {
    const restaurant = await db.restaurant.findUniqueOrThrow({ where: { id: restaurantId } });
    const { features } = getEntitlements(restaurant);

    const [newOrders, readyOrders, pendingReservations, inventory] = await Promise.all([
        db.order.findMany({
            where: { restaurantId, status: "PENDING" },
            select: { id: true, orderNumber: true, tableNumber: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 5,
        }),
        db.order.findMany({
            where: { restaurantId, status: "READY" },
            select: { id: true, orderNumber: true, tableNumber: true, readyAt: true, createdAt: true },
            orderBy: { readyAt: "desc" },
            take: 5,
        }),
        features.reservations
            ? db.reservation.findMany({
                  where: { restaurantId, status: "PENDING", reservationTime: { gte: new Date() } },
                  select: { id: true, customerName: true, guests: true, reservationTime: true, createdAt: true },
                  orderBy: { reservationTime: "asc" },
                  take: 5,
              })
            : Promise.resolve([]),
        features.inventory
            ? db.inventoryItem.findMany({
                  where: { restaurantId },
                  select: { id: true, name: true, quantity: true, minimumQuantity: true, unit: true, updatedAt: true },
              })
            : Promise.resolve([]),
    ]);

    const items: NotificationItem[] = [
        ...readyOrders.map((o) => ({
            id: `ready-${o.id}`,
            kind: "order" as const,
            title: `Order #${o.orderNumber} is ready`,
            detail: o.tableNumber ? `Table ${o.tableNumber}` : "Takeaway",
            href: "/kitchen",
            at: (o.readyAt ?? o.createdAt).toISOString(),
        })),
        ...newOrders.map((o) => ({
            id: `new-${o.id}`,
            kind: "order" as const,
            title: `New order #${o.orderNumber}`,
            detail: o.tableNumber ? `Table ${o.tableNumber}` : "Takeaway",
            href: "/kitchen",
            at: o.createdAt.toISOString(),
        })),
        ...pendingReservations.map((r) => ({
            id: `res-${r.id}`,
            kind: "reservation" as const,
            title: `Booking request from ${r.customerName}`,
            detail: `${r.guests} guests · ${r.reservationTime.toISOString()}`,
            href: "/dashboard/reservations",
            at: r.createdAt.toISOString(),
        })),
        ...inventory
            .filter((i) => i.quantity <= i.minimumQuantity)
            .map((i) => ({
                id: `stock-${i.id}`,
                kind: "stock" as const,
                title: `${i.name} is running low`,
                detail: `${i.quantity} ${i.unit} left (min ${i.minimumQuantity})`,
                href: "/dashboard/inventory",
                at: i.updatedAt.toISOString(),
            })),
    ].sort((a, b) => b.at.localeCompare(a.at));

    return json({ items, count: items.length });
});
