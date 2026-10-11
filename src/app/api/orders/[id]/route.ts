import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { updateOrderSchema } from "@/lib/validations";
import { canTransition, orderInclude, releaseTableIfIdle, serializeOrder } from "@/lib/orders";

export const GET = withAuth(async (_req, { restaurantId, params }) => {
    const order = await db.order.findFirst({ where: { id: params.id, restaurantId }, include: orderInclude });
    if (!order) throw new ApiError(404, "Order not found");
    return json(serializeOrder(order));
});

// PATCH /api/orders/:id — move an order through the kitchen workflow.
export const PATCH = withAuth(async (req, { restaurantId, params }) => {
    const { status } = await parseBody(req, updateOrderSchema);

    const existing = await db.order.findFirst({ where: { id: params.id, restaurantId } });
    if (!existing) throw new ApiError(404, "Order not found");
    if (status === "PAID") throw new ApiError(400, "Use the payment endpoint to mark an order as paid");
    if (!canTransition(existing.status, status)) {
        throw new ApiError(409, `Can't move an order from ${existing.status} to ${status}`);
    }

    const order = await db.$transaction(async (tx) => {
        const updated = await tx.order.update({
            where: { id: existing.id },
            data: {
                status,
                readyAt: status === "READY" ? existing.readyAt ?? new Date() : existing.readyAt,
            },
            include: orderInclude,
        });
        if (status === "CANCELLED") await releaseTableIfIdle(tx, existing.tableId);
        return updated;
    });

    return json(serializeOrder(order));
});
