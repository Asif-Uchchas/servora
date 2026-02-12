import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Fetch all menu items with categories and discounts
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const restaurantId = searchParams.get("restaurantId");

        if (!restaurantId) {
            // Get the first restaurant
            const restaurant = await db.restaurant.findFirst();
            if (!restaurant) {
                return NextResponse.json({ error: "No restaurant found" }, { status: 404 });
            }

            const [categories, menuItems] = await Promise.all([
                db.menuCategory.findMany({
                    where: { restaurantId: restaurant.id },
                    orderBy: { displayOrder: "asc" },
                }),
                db.menuItem.findMany({
                    where: { restaurantId: restaurant.id },
                    include: {
                        category: { select: { id: true, name: true } },
                        discounts: {
                            where: { isActive: true },
                        },
                        _count: {
                            select: { orderItems: true },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                }),
            ]);

            return NextResponse.json({ categories, menuItems, restaurantId: restaurant.id });
        }

        const [categories, menuItems] = await Promise.all([
            db.menuCategory.findMany({
                where: { restaurantId },
                orderBy: { displayOrder: "asc" },
            }),
            db.menuItem.findMany({
                where: { restaurantId },
                include: {
                    category: { select: { id: true, name: true } },
                    discounts: {
                        where: { isActive: true },
                    },
                    _count: {
                        select: { orderItems: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
        ]);

        return NextResponse.json({ categories, menuItems, restaurantId });
    } catch (error) {
        console.error("Menu GET error:", error);
        return NextResponse.json({ error: "Failed to fetch menu data" }, { status: 500 });
    }
}

// POST - Create a new menu item
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            name,
            description,
            image,
            price,
            offerPrice,
            costPrice,
            sku,
            preparationTime,
            calories,
            isAvailable,
            isFeatured,
            categoryId,
            restaurantId,
        } = body;

        const menuItem = await db.menuItem.create({
            data: {
                name,
                description,
                image,
                price: parseFloat(price),
                offerPrice: offerPrice ? parseFloat(offerPrice) : null,
                costPrice: costPrice ? parseFloat(costPrice) : null,
                sku,
                preparationTime: preparationTime ? parseInt(preparationTime) : null,
                calories: calories ? parseInt(calories) : null,
                isAvailable: isAvailable ?? true,
                isFeatured: isFeatured ?? false,
                categoryId,
                restaurantId,
            },
            include: {
                category: { select: { id: true, name: true } },
                discounts: true,
                _count: { select: { orderItems: true } },
            },
        });

        return NextResponse.json(menuItem, { status: 201 });
    } catch (error) {
        console.error("Menu POST error:", error);
        return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
    }
}

// PUT - Update a menu item
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: "Menu item ID required" }, { status: 400 });
        }

        const updateData: any = { ...data };
        if (data.price !== undefined) updateData.price = parseFloat(data.price);
        if (data.offerPrice !== undefined) updateData.offerPrice = data.offerPrice ? parseFloat(data.offerPrice) : null;
        if (data.costPrice !== undefined) updateData.costPrice = data.costPrice ? parseFloat(data.costPrice) : null;
        if (data.preparationTime !== undefined) updateData.preparationTime = data.preparationTime ? parseInt(data.preparationTime) : null;
        if (data.calories !== undefined) updateData.calories = data.calories ? parseInt(data.calories) : null;

        const menuItem = await db.menuItem.update({
            where: { id },
            data: updateData,
            include: {
                category: { select: { id: true, name: true } },
                discounts: true,
                _count: { select: { orderItems: true } },
            },
        });

        return NextResponse.json(menuItem);
    } catch (error) {
        console.error("Menu PUT error:", error);
        return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
    }
}

// DELETE - Delete menu items (supports bulk)
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: "Item IDs required" }, { status: 400 });
        }

        await db.menuItem.deleteMany({
            where: { id: { in: ids } },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Menu DELETE error:", error);
        return NextResponse.json({ error: "Failed to delete menu items" }, { status: 500 });
    }
}
