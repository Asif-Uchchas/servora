import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Fetch all inventory items
export async function GET() {
    try {
        const restaurant = await db.restaurant.findFirst();
        if (!restaurant) {
            return NextResponse.json({ error: "No restaurant found" }, { status: 404 });
        }

        const items = await db.inventoryItem.findMany({
            where: { restaurantId: restaurant.id },
            include: {
                transactions: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(items);
    } catch (error) {
        console.error("Inventory GET error:", error);
        return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
    }
}

// POST - Create inventory item or add transaction
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action } = body;

        if (action === "transaction") {
            // Add inventory transaction
            const { inventoryItemId, type, quantity, notes } = body;

            const transaction = await db.inventoryTransaction.create({
                data: {
                    inventoryItemId,
                    type,
                    quantity: parseFloat(quantity),
                    notes,
                },
            });

            // Update inventory quantity
            const adjustment = type === "ADD" ? parseFloat(quantity) : -parseFloat(quantity);
            await db.inventoryItem.update({
                where: { id: inventoryItemId },
                data: { quantity: { increment: adjustment } },
            });

            return NextResponse.json(transaction, { status: 201 });
        }

        // Create new inventory item
        const restaurant = await db.restaurant.findFirst();
        if (!restaurant) {
            return NextResponse.json({ error: "No restaurant found" }, { status: 404 });
        }

        const item = await db.inventoryItem.create({
            data: {
                name: body.name,
                quantity: parseFloat(body.quantity || "0"),
                unit: body.unit || "pcs",
                minimumQuantity: parseFloat(body.minimumQuantity || "0"),
                costPerUnit: parseFloat(body.costPerUnit || "0"),
                restaurantId: restaurant.id,
            },
            include: {
                transactions: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
            },
        });

        return NextResponse.json(item, { status: 201 });
    } catch (error) {
        console.error("Inventory POST error:", error);
        return NextResponse.json({ error: "Failed to create inventory item" }, { status: 500 });
    }
}

// PUT - Update inventory item
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: "Item ID required" }, { status: 400 });
        }

        const updateData: any = { ...data };
        if (data.quantity !== undefined) updateData.quantity = parseFloat(data.quantity);
        if (data.minimumQuantity !== undefined) updateData.minimumQuantity = parseFloat(data.minimumQuantity);
        if (data.costPerUnit !== undefined) updateData.costPerUnit = parseFloat(data.costPerUnit);

        const item = await db.inventoryItem.update({
            where: { id },
            data: updateData,
            include: {
                transactions: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
            },
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Inventory PUT error:", error);
        return NextResponse.json({ error: "Failed to update inventory item" }, { status: 500 });
    }
}

// DELETE - Delete inventory item
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: "Item ID required" }, { status: 400 });
        }

        await db.inventoryItem.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Inventory DELETE error:", error);
        return NextResponse.json({ error: "Failed to delete inventory item" }, { status: 500 });
    }
}
