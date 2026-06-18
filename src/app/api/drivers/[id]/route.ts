import { NextRequest, NextResponse } from "next/server";
import { db, drivers } from "@/db";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { firstName, lastName, phone, isActive } = await req.json();

    const [updated] = await db.update(drivers).set({
      firstName: firstName?.trim(),
      lastName:  lastName?.trim(),
      phone:     phone?.trim() ?? null,
      isActive,
      updatedAt: new Date(),
    }).where(eq(drivers.id, id)).returning();

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
    await db.update(drivers)
      .set({ isActive: 0, updatedAt: new Date() })
      .where(eq(drivers.id, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}