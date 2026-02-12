import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

// POST - Complete order (mark as paid)
export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const orderId = params.id;

        const order = await db.order.update({
            where: { id: orderId },
            data: {
                status: "PAID" as OrderStatus
            },
        });

        return NextResponse.json({
            id: order.id,
            status: order.status,
            message: "Order completed successfully"
        });
    } catch (error) {
        console.error("POS complete error:", error);
        return NextResponse.json({ error: "Failed to complete order" }, { status: 500 });
    }
}