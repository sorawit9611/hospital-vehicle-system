"use client";
import { QRCodeSVG } from "qrcode.react";
import { getVehicleQrUrl } from "@/lib/utils";
import { VEHICLE_TYPE_LABELS } from "@/lib/constants";

interface Props {
    vehicle: {
        id: string;
        plateNumber: string;
        name: string;
        type: string;
        department?: string | null;
        description?: string | null;
        currentOdometer: number;
        responsibleDriver?: {
            firstName: string;
            lastName: string;
        } | null;
    };
    side?: "front" | "back";
}

const CARD_W = 420;
const CARD_MIN_H = 250;
const HOSPITAL = "โรงพยาบาลสามร้อยยอด";
const ADDRESS = "51 หมู่ 1 ต.ไร่ใหม่ อ.สามร้อยยอด จ.ประจวบคีรีขันธ์ 77180  โทร. 032-688558";

const printColors = { WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as const;

export default function VehicleCard({ vehicle, side = "front" }: Props) {
    const isAmb = vehicle.type === "ambulance";
    const color = isAmb ? "#cf1322" : "#0958d9";

    const shell: React.CSSProperties = {
        width: CARD_W,
        minHeight: CARD_MIN_H,
        borderRadius: 14,
        overflow: "hidden",
        border: `2px solid ${color}33`,
        background: "#fff",
        fontFamily: "Sarabun, sans-serif",
        display: "flex",
        flexDirection: "column",
        ...printColors,
    };

    const header = (title: string) => (
        <div style={{ background: color, padding: "11px 18px", ...printColors }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{title}</div>
            <div style={{ color: "#fff", fontSize: 11.5, opacity: 0.85 }}>
                {HOSPITAL} — {VEHICLE_TYPE_LABELS[vehicle.type]}
            </div>
        </div>
    );

    const footer = (
        <div style={{
            background: "#f8f9fb", padding: "6px 18px", fontSize: 10, color: "#808080",
            textAlign: "center", borderTop: "1px solid #f0f0f0", ...printColors,
        }}>
            {ADDRESS}
        </div>
    );

    if (side === "back") {
        return (
            <div style={shell}>
                {header("วิธีใช้งาน & ข้อควรปฏิบัติ")}
                <div style={{ padding: "14px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color, marginBottom: 5 }}>
                            ขั้นตอนบันทึกการใช้รถ
                        </div>
                        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: "#444", lineHeight: 1.7 }}>
                            <li>สแกน QR Code ที่หน้าบัตรด้วยมือถือ</li>
                            <li>กรอกผู้ขับ / ผู้ขอใช้ / ปลายทาง / เลขไมล์ แล้วกด “บันทึกออกเดินทาง”</li>
                            <li>เมื่อกลับถึง สแกนอีกครั้ง กรอกเลขไมล์ แล้วกด “บันทึกการกลับ”</li>
                        </ol>
                    </div>

                    <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color, marginBottom: 5 }}>
                            ข้อควรปฏิบัติ
                        </div>
                        <div style={{ fontSize: 11.5, color: "#444", lineHeight: 1.7 }}>
                            • ตรวจสภาพรถก่อนออกเดินทาง&nbsp;&nbsp;• คาดเข็มขัดนิรภัยทุกครั้ง<br />
                            • ขับขี่ปลอดภัย ปฏิบัติตามกฎจราจร&nbsp;&nbsp;• เติมน้ำมันเมื่อใช้งานเสร็จ
                        </div>
                    </div>
                </div>
                {footer}
            </div>
        );
    }

    return (
        <div style={shell}>
            {header("บัตรประจำยานพาหนะ")}
            <div style={{ padding: "16px 18px", display: "flex", gap: 18, alignItems: "center", flex: 1 }}>
                <div style={{ background: "#f5f5f5", borderRadius: 10, padding: 10, flexShrink: 0, textAlign: "center", ...printColors }}>
                    <QRCodeSVG value={getVehicleQrUrl(vehicle.id)} size={112} fgColor={color} level="M" />
                    <div style={{ fontSize: 10, color: "#888", marginTop: 5 }}>สแกนเพื่อบันทึก</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: 1 }}>
                        {vehicle.plateNumber}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, color: "#222" }}>
                        {vehicle.name}
                    </div>
                    {vehicle.department && <div style={{ fontSize: 12.5, color: "#666", marginTop: 2 }}>
                        {vehicle.department}
                    </div>}
                    <div style={{ marginTop: 10, fontSize: 11.5, color: "#888", borderTop: "1px dashed #eee", paddingTop: 8 }}>
                        ผู้รับผิดชอบ:{" "}
                        <strong style={{ color: "#222" }}>
                            {vehicle.responsibleDriver
                                ? `${vehicle.responsibleDriver.firstName} ${vehicle.responsibleDriver.lastName}`
                                : "-"}
                        </strong>
                    </div>
                </div>
            </div>
            {footer}
        </div>
    );
}
