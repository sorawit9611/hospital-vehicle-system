import { NextRequest, NextResponse } from "next/server";
import { db, vehicles, drivers } from "@/db";
import { eq, desc, or, ilike, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const s          = new URL(req.url).searchParams;
    const type       = s.get("type");
    const search     = s.get("search");
    const activeOnly = s.get("activeOnly") !== "false";

    const conditions = [];
    if (activeOnly) conditions.push(eq(vehicles.isActive, 1));
    if (type === "general" || type === "ambulance") conditions.push(eq(vehicles.type, type));
    if (search) conditions.push(
      or(ilike(vehicles.plateNumber, `%${search}%`), ilike(vehicles.name, `%${search}%`))!
    );

    const rows = await db
      .select({
        vehicle:           vehicles,
        responsibleDriver: {
          id:        drivers.id,
          firstName: drivers.firstName,
          lastName:  drivers.lastName,
          phone:     drivers.phone,
        },
      })
      .from(vehicles)
      .leftJoin(drivers, eq(vehicles.responsibleDriverId, drivers.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(vehicles.createdAt));

    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plateNumber, name, type, department, description, currentOdometer, responsibleDriverId } = body;

    if (!plateNumber || !name || !type)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const [vehicle] = await db.insert(vehicles).values({
      plateNumber:         plateNumber.trim().toUpperCase(),
      name:                name.trim(),
      type,
      department:          department ?? null,
      description:         description ?? null,
      currentOdometer:     currentOdometer || 0,
      responsibleDriverId: responsibleDriverId ?? null,
      isActive:            1,
    }).returning();

    return NextResponse.json(vehicle, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "23505")
      return NextResponse.json({ error: "ทะเบียนรถซ้ำในระบบ" }, { status: 409 });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}