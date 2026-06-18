import { NextRequest, NextResponse } from "next/server";
import { db, vehicles, vehicleLogs, drivers } from "@/db";
import { eq, desc, sql, getTableColumns } from "drizzle-orm";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const [row] = await db
            .select({
                vehicle: vehicles,
                responsibleDriver: {
                    id: drivers.id,
                    firstName: drivers.firstName,
                    lastName: drivers.lastName,
                    phone: drivers.phone,
                },
            })
            .from(vehicles)
            .leftJoin(drivers, eq(vehicles.responsibleDriverId, drivers.id))
            .where(eq(vehicles.id, id));

        if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

        const logs = await db
            .select({
                ...getTableColumns(vehicleLogs),
                driverName: sql<string | null>`nullif(concat_ws(' ', ${drivers.firstName}, ${drivers.lastName}), '')`,
            })
            .from(vehicleLogs)
            .leftJoin(drivers, eq(vehicleLogs.driverId, drivers.id))
            .where(eq(vehicleLogs.vehicleId, id))
            .orderBy(desc(vehicleLogs.checkoutAt))
            .limit(50);

        return NextResponse.json({ vehicle: row.vehicle, responsibleDriver: row.responsibleDriver, logs });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const [updated] = await db.update(vehicles).set({
            plateNumber: body.plateNumber?.trim().toUpperCase(),
            name: body.name?.trim(),
            type: body.type,
            department: body.department ?? null,
            description: body.description ?? null,
            currentOdometer: body.currentOdometer,
            responsibleDriverId: body.responsibleDriverId ?? null,
            isActive: body.isActive,
            updatedAt: new Date(),
        }).where(eq(vehicles.id, id)).returning();

        if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(updated);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await db.update(vehicles)
            .set({ isActive: 0, updatedAt: new Date() })
            .where(eq(vehicles.id, id));
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}