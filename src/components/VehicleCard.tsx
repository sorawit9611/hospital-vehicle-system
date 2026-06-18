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
        currentOdometer: number;
        responsibleDriver?: {
            firstName: string;
            lastName: string;
        } | null;
    };
}

export default function VehicleCard({ vehicle }: Props) {
    const isAmb = vehicle.type === "ambulance";
    const color = isAmb ? "#cf1322" : "#0958d9";

    return (
        <div style={{ width: 340, borderRadius: 12, overflow: "hidden", border: `2px solid ${color}33`, background: "#fff", fontFamily: "Sarabun, sans-serif" }}>
            <div style={{ background: color, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ color: "#fff", flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>
                        บัตรประจำยานพาหนะ
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.8 }}>
                        โรงพยาบาลสามร้อยยอด — {VEHICLE_TYPE_LABELS[vehicle.type]}
                    </div>
                </div>
            </div>
            <div style={{ padding: "14px 16px", display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ background: "#f5f5f5", borderRadius: 8, padding: 8, flexShrink: 0 }}>
                    <QRCodeSVG value={getVehicleQrUrl(vehicle.id)} size={90} fgColor={color} level="M" />
                    <div style={{ fontSize: 9, textAlign: "center", color: "#888", marginTop: 4 }}>
                        สแกนเพื่อบันทึก
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: 1 }}>
                        {vehicle.plateNumber}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: "#222" }}>
                        {vehicle.name}
                    </div>
                    {vehicle.department && <div style={{ fontSize: 12, color: "#666" }}>
                        {vehicle.department}
                    </div>}
                    <div style={{ marginTop: 8, fontSize: 11, color: "#888", borderTop: "1px dashed #eee", paddingTop: 6 }}>
                        ผู้รับผิดชอบ: <strong style={{ color: "#222" }}>{vehicle.responsibleDriver ? `${vehicle.responsibleDriver.firstName} ${vehicle.responsibleDriver.lastName}` : "-"}</strong><br />
                        {/*  เลขไมล์: <strong style={{ color: "#222" }}>{vehicle.currentOdometer.toLocaleString()} กม.</strong>*/}
                    </div>
                </div>
            </div>
            <div style={{ background: "#f8f9fb", padding: "5px 16px", fontSize: 10, color: "#aaa", textAlign: "center", borderTop: "1px solid #f0f0f0" }}>
                {/* ID: {vehicle.id.slice(0, 8).toUpperCase()} */}
                ID: {vehicle.id.toUpperCase()}
            </div>
        </div>
    );
}