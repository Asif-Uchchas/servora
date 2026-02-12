import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

// POST - Complete order (mark as paid)
export async function POST(
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