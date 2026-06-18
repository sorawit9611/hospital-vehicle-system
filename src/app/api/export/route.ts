import { NextRequest, NextResponse } from "next/server";
import { db, vehicles, vehicleLogs, drivers } from "@/db";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
    try {
        const s = new URL(req.url).searchParams;
        const conditions = [];
        if (s.get("vehicleId")) conditions.push(eq(vehicleLogs.vehicleId, s.get("vehicleId")!));
        if (s.get("from")) conditions.push(gte(vehicleLogs.checkoutAt, new Date(s.get("from")!)));
        if (s.get("to")) {
            const t = new Date(s.get("to")!);
            t.setHours(23, 59, 59, 999);
            conditions.push(lte(vehicleLogs.checkoutAt, t));
        }

        const logs = await db
            .select({
                log: vehicleLogs,
                vehicle: { plateNumber: vehicles.plateNumber, name: vehicles.name, type: vehicles.type },
                driver: { firstName: drivers.firstName, lastName: drivers.lastName, phone: drivers.phone },
            })
            .from(vehicleLogs)
            .leftJoin(vehicles, eq(vehicleLogs.vehicleId, vehicles.id))
            .leftJoin(drivers, eq(vehicleLogs.driverId, drivers.id))
            .where(conditions.length ? and(...conditions) : undefined)
            .orderBy(desc(vehicleLogs.checkoutAt));

        const TYPE = { general: "รถยนต์ทั่วไป", ambulance: "รถพยาบาล" } as Record<string, string>;
        const STATUS = { out: "กำลังปฏิบัติงาน", returned: "กลับมาแล้ว" } as Record<string, string>;
        const fmt = (d: Date | null | undefined) => d ? new Date(d).toLocaleString("th-TH") : "-";

        const rows = logs.map((r, i) => ({
            "ลำดับ": i + 1,
            "ทะเบียนรถ": r.vehicle?.plateNumber ?? "-",
            "ประเภทรถ": TYPE[r.vehicle?.type ?? ""] ?? "-",
            "ชื่อรถ": r.vehicle?.name ?? "-",
            "ผู้ขับ": r.log.isSelfDriven ? "ขับเอง" : r.driver ? `${r.driver.firstName} ${r.driver.lastName}` : "-",
            "เบอร์โทรผู้ขับ": r.log.isSelfDriven ? "-" : (r.driver?.phone ?? "-"),
            "ประเภทผู้ขอใช้": r.log.requesterType === "department" ? "แผนก" : "บุคคล",
            "ผู้ขอใช้รถ": r.log.requesterType === "department" ? (r.log.requesterDept ?? "-") : (r.log.requesterName ?? "-"),
            "เบอร์โทรผู้ขอใช้": r.log.requesterType === "person" ? (r.log.requesterPhone ?? "-") : "-",
            "สถานที่/วัตถุประสงค์": r.log.destination,
            "เลขไมล์ออก": r.log.odometerOut,
            "เวลาออก": fmt(r.log.checkoutAt),
            "เลขไมล์กลับ": r.log.odometerIn ?? "-",
            "เวลากลับ": fmt(r.log.returnedAt),
            "ระยะทาง (กม.)": r.log.distanceTraveled ?? "-",
            "สถานะ": STATUS[r.log.status],
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        ws["!cols"] = [
            { wch: 6 }, { wch: 14 }, { wch: 14 }, { wch: 22 }, { wch: 22 },
            { wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 16 }, { wch: 30 },
            { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 22 }, { wch: 14 }, { wch: 16 },
        ];
        XLSX.utils.book_append_sheet(wb, ws, "รายงานการใช้รถ");
        const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="vehicle-service-report-${new Date().toISOString().slice(0, 10)}.xlsx"`,
            },
        });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}