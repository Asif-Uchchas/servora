import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

// PATCH - Update order status
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // TODO: Add authentication back when frontend properly sends session
        // const session = await auth();
        // if (!session?.user) {
        //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        // }

        const orderId = params.id;
        const { status } = await req.json();

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        const order = await db.order.update({
            where: { id: orderId },
            data: { status: status as OrderStatus },
        });

        return NextResponse.json({
            id: order.id,
            status: order.status
        });
    } catch (error) {
        console.error("POS PATCH error:", error);
        return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
    }
}