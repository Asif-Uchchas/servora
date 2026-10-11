import { db } from "@/lib/db";
import { ApiError, json, parseBody, withAuth } from "@/lib/api";
import { payOrderSchema } from "@/lib/validations";
import { orderInclude, releaseTableIfIdle, serializeOrder } from "@/lib/orders";
import { roundMoney } from "@/lib/pricing";

// POST /api/orders/:id/pay — settle the bill and free the table.
export const POST = withAuth(async (req, { restaurantId, params }) => {
    const { method, tip } = await parseBody(req, payOrderSchema);

    const existing = await db.order.findFirst({ where: { id: params.id, restaurantId } });
    if (!existing) throw new ApiError(404, "Order not found");
    if (existing.status === "PAID") throw new ApiError(409, "This order is already paid");
    if (existing.status === "CANCELLED") throw new ApiError(409, "This order was cancelled");

    const tipAmount = roundMoney(tip);
    const order = await db.$transaction(async (tx) => {
        const updated = await tx.order.update({
            where: { id: existing.id },
            data: {
                status: "PAID",
                paymentMethod: method,
                paidAt: new Date(),
                tipAmount,
                totalAmount: roundMoney(existing.subtotal + existing.taxAmount + tipAmount),
            },
            include: orderInclude,
        });
        await releaseTableIfIdle(tx, existing.tableId);
        return updated;
    });

    return json(serializeOrder(order));
});
