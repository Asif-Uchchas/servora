import type { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const orderInclude = {
    orderItems: {
        include: { menuItem: { select: { id: true, name: true, image: true, category: { select: { name: true } } } } },
    },
    createdBy: { select: { name: true } },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export function serializeOrder(order: OrderWithRelations) {
    return {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        source: order.source,
        tableId: order.tableId,
        tableNumber: order.tableNumber,
        customerName: order.customerName,
        notes: order.notes,
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        tipAmount: order.tipAmount,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paidAt: order.paidAt?.toISOString() ?? null,
        readyAt: order.readyAt?.toISOString() ?? null,
        createdAt: order.createdAt.toISOString(),
        createdBy: order.createdBy?.name ?? null,
        items: order.orderItems.map((item) => ({
            id: item.id,
            menuItemId: item.menuItemId,
            name: item.menuItem?.name ?? "Deleted item",
            image: item.menuItem?.image ?? null,
            category: item.menuItem?.category?.name ?? null,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
        })),
    };
}

export type SerializedOrder = ReturnType<typeof serializeOrder>;

export const OPEN_STATUSES: OrderStatus[] = ["PENDING", "PREPARING", "READY", "SERVED"];
export const KITCHEN_STATUSES: OrderStatus[] = ["PENDING", "PREPARING", "READY"];

/** Status changes allowed through the status endpoint. Paying goes through /pay. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["PREPARING", "READY", "SERVED", "CANCELLED"],
    PREPARING: ["PENDING", "READY", "SERVED", "CANCELLED"],
    READY: ["PREPARING", "SERVED", "CANCELLED"],
    SERVED: ["READY", "CANCELLED"],
    CANCELLED: [],
    PAID: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
    return from === to || TRANSITIONS[from].includes(to);
}

/** Free a table once it has no open orders left. */
export async function releaseTableIfIdle(tx: Prisma.TransactionClient | typeof db, tableId: string | null) {
    if (!tableId) return;
    const open = await tx.order.count({ where: { tableId, status: { in: OPEN_STATUSES } } });
    if (open === 0) {
        await tx.diningTable.update({ where: { id: tableId }, data: { status: "AVAILABLE" } });
    }
}
