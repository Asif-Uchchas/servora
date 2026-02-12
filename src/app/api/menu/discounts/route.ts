import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST - Create a discount for a menu item
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { menuItemId, discountType, discountValue, startDate, endDate } = body;

        if (!menuItemId || !discountType || !discountValue || !startDate || !endDate) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const discount = await db.menuItemDiscount.create({
            data: {
                menuItemId,
                discountType,
                discountValue: parseFloat(discountValue),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive: true,
            },
        });

        return NextResponse.json(discount, { status: 201 });
    } catch (error) {
        console.error("Discount POST error:", error);
        return NextResponse.json({ error: "Failed to create discount" }, { status: 500 });
    }
}
