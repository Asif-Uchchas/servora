import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Fetch all reservations
export async function GET() {
    try {
        const restaurant = await db.restaurant.findFirst();
        if (!restaurant) {
            return NextResponse.json({ error: "No restaurant found" }, { status: 404 });
        }

        const reservations = await db.reservation.findMany({
            where: { restaurantId: restaurant.id },
            orderBy: { reservationTime: "asc" },
        });

        return NextResponse.json(reservations);
    } catch (error) {
        console.error("Reservations GET error:", error);
        return NextResponse.json({ error: "Failed to fetch reservations" }, { status: 500 });
    }
}

// POST - Create a new reservation
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const restaurant = await db.restaurant.findFirst();
        if (!restaurant) {
            return NextResponse.json({ error: "No restaurant found" }, { status: 404 });
        }

        const reservation = await db.reservation.create({
            data: {
                restaurantId: restaurant.id,
                customerName: body.customerName,
                phone: body.phone,
                email: body.email,
                guests: parseInt(body.guests),
                reservationTime: new Date(body.reservationTime),
                tableNumber: body.tableNumber,
                notes: body.notes,
                status: "CONFIRMED",
            },
        });

        return NextResponse.json(reservation, { status: 201 });
    } catch (error) {
        console.error("Reservations POST error:", error);
        return NextResponse.json({ error: "Failed to create reservation" }, { status: 500 });
    }
}

// PUT - Update reservation status
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: "Reservation ID required" }, { status: 400 });
        }

        const updateData: any = { ...data };
        if (data.guests) updateData.guests = parseInt(data.guests);
        if (data.reservationTime) updateData.reservationTime = new Date(data.reservationTime);

        const reservation = await db.reservation.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(reservation);
    } catch (error) {
        console.error("Reservations PUT error:", error);
        return NextResponse.json({ error: "Failed to update reservation" }, { status: 500 });
    }
}

// DELETE - Delete a reservation
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: "Reservation ID required" }, { status: 400 });
        }

        await db.reservation.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Reservations DELETE error:", error);
        return NextResponse.json({ error: "Failed to delete reservation" }, { status: 500 });
    }
}
