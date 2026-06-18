import { NextRequest, NextResponse } from "next/server";
import { db, drivers } from "@/db";
import { eq, or, ilike, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const s          = new URL(req.url).searchParams;
    const search     = s.get("search");
    const activeOnly = s.get("activeOnly") !== "false";

    const conditions = [];
    if (activeOnly) conditions.push(eq(drivers.isActive, 1));
    if (search) conditions.push(
      or(ilike(drivers.firstName, `%${search}%`), ilike(drivers.lastName, `%${search}%`), ilike(drivers.phone ?? "", `%${search}%`))!
    );

    const result = await db.select().from(drivers)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(drivers.firstName, drivers.lastName);

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, phone } = await req.json();
    if (!firstName || !lastName)
      return NextResponse.json({ error: "กรุณากรอกชื่อและนามสกุล" }, { status: 400 });

    const [driver] = await db.insert(drivers).values({
      firstName: firstName.trim(),
      lastName:  lastName.trim(),
      phone:     phone?.trim() ?? null,
      isActive:  1,
    }).returning();

    return NextResponse.json(driver, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}