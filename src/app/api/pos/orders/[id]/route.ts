import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { OrderStatus } from "@prisma/client";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params;

        const { status } = await req.json();

        if (!status) {
            return NextResponse.json(
                { error: "Status is required" },
                { status: 400 }
            );
        }

        const order = await db.order.update({
            where: { id: orderId },
            data: { status: status as OrderStatus },
        });

        return NextResponse.json(order);
    } catch (error) {
        console.error("POS PATCH error:", error);
        return NextResponse.json(
            { error: "Failed to update order" },
            { status: 500 }
        );
    }
}