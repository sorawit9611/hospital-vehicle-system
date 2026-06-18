import { NextRequest, NextResponse } from "next/server";
import { db, vehicles, vehicleLogs, drivers } from "@/db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const s     = new URL(req.url).searchParams;
    const limit = parseInt(s.get("limit") ?? "100");

    const conditions = [];
    if (s.get("vehicleId")) conditions.push(eq(vehicleLogs.vehicleId, s.get("vehicleId")!));
    if (s.get("driverId"))  conditions.push(eq(vehicleLogs.driverId,  s.get("driverId")!));
    if (s.get("status") === "out" || s.get("status") === "returned")
      conditions.push(eq(vehicleLogs.status, s.get("status") as "out" | "returned"));
    if (s.get("from")) conditions.push(gte(vehicleLogs.checkoutAt, new Date(s.get("from")!)));
    if (s.get("to")) {
      const t = new Date(s.get("to")!);
      t.setHours(23, 59, 59, 999);
      conditions.push(lte(vehicleLogs.checkoutAt, t));
    }

    const logs = await db
      .select({
        log: vehicleLogs,
        vehicle: {
          id:          vehicles.id,
          plateNumber: vehicles.plateNumber,
          name:        vehicles.name,
          type:        vehicles.type,
        },
        driver: {
          id:        drivers.id,
          firstName: drivers.firstName,
          lastName:  drivers.lastName,
          phone:     drivers.phone,
        },
      })
      .from(vehicleLogs)
      .leftJoin(vehicles, eq(vehicleLogs.vehicleId, vehicles.id))
      .leftJoin(drivers,  eq(vehicleLogs.driverId,  drivers.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(vehicleLogs.checkoutAt))
      .limit(limit);

    return NextResponse.json(logs);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      vehicleId, isSelfDriven, driverId,
      requesterType, requesterDept, requesterName, requesterPhone,
      destination, odometerOut,
    } = body;

    if (!vehicleId || !requesterType || !destination || odometerOut == null)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    if (requesterType === "department" && !requesterDept)
      return NextResponse.json({ error: "กรุณาระบุแผนก" }, { status: 400 });
    if (requesterType === "person" && !requesterName)
      return NextResponse.json({ error: "กรุณาระบุชื่อผู้ขอใช้" }, { status: 400 });
    if (!isSelfDriven && !driverId)
      return NextResponse.json({ error: "กรุณาเลือกพนักงานขับรถ" }, { status: 400 });

    const [openLog] = await db.select().from(vehicleLogs)
      .where(and(eq(vehicleLogs.vehicleId, vehicleId), eq(vehicleLogs.status, "out")));
    if (openLog)
      return NextResponse.json({ error: "รถคันนี้ยังไม่ได้กลับมาจากการใช้งานครั้งก่อน" }, { status: 409 });

    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId));
    if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    if (odometerOut < vehicle.currentOdometer)
      return NextResponse.json({ error: `เลขไมล์ต้องไม่น้อยกว่า ${vehicle.currentOdometer.toLocaleString()} กม.` }, { status: 400 });

    const [log] = await db.insert(vehicleLogs).values({
      vehicleId,
      status:        "out",
      isSelfDriven:  Boolean(isSelfDriven),
      driverId:      isSelfDriven ? null : driverId,
      requesterType,
      requesterDept:  requesterType === "department" ? requesterDept  : null,
      requesterName:  requesterType === "person"     ? requesterName  : null,
      requesterPhone: requesterType === "person"     ? (requesterPhone ?? null) : null,
      destination,
      odometerOut,
    }).returning();

    await db.update(vehicles)
      .set({ currentOdometer: odometerOut, updatedAt: new Date() })
      .where(eq(vehicles.id, vehicleId));

    return NextResponse.json(log, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}