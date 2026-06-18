import { NextRequest, NextResponse } from "next/server";
import { db, vehicles, vehicleLogs } from "@/db";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }       = await params;
    const { odometerIn } = await req.json();

    const [log] = await db.select().from(vehicleLogs).where(eq(vehicleLogs.id, id));
    if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (log.status === "returned") return NextResponse.json({ error: "บันทึกนี้กลับมาแล้ว" }, { status: 409 });
    if (odometerIn == null || odometerIn < log.odometerOut)
      return NextResponse.json({ error: `เลขไมล์กลับต้องไม่น้อยกว่า ${log.odometerOut.toLocaleString()} กม.` }, { status: 400 });

    const [updated] = await db.update(vehicleLogs).set({
      status:           "returned",
      odometerIn,
      returnedAt:       new Date(),
      distanceTraveled: odometerIn - log.odometerOut,
      updatedAt:        new Date(),
    }).where(eq(vehicleLogs.id, id)).returning();

    await db.update(vehicles)
      .set({ currentOdometer: odometerIn, updatedAt: new Date() })
      .where(eq(vehicles.id, log.vehicleId));

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
    await db.delete(vehicleLogs).where(eq(vehicleLogs.id, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}