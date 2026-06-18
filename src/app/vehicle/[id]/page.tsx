"use client";
import { useEffect, useState, useCallback } from "react";
import {
    Button, Form, Input, InputNumber, Select, Typography,
    Tag, Alert, Spin, message, Row, Col, Badge, Divider, Radio,
} from "antd";
import { CarOutlined, LoginOutlined, LogoutOutlined, CheckCircleOutlined, TruckOutlined } from "@ant-design/icons";
import { useParams } from "next/navigation";
import { VEHICLE_TYPE_LABELS, DEPARTMENTS } from "@/lib/constants";
import { formatOdometer, formatThaiDate } from "@/lib/utils";
import type { Vehicle, Driver, VehicleLog } from "@/db/schema";

type Mode = "loading" | "error" | "checkout" | "return" | "success-out" | "success-in";

type VehicleLogWithDriver = VehicleLog & { driverName?: string };

export default function VehiclePage() {
    const { id } = useParams<{ id: string }>();
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [openLog, setOpenLog] = useState<VehicleLogWithDriver | null>(null);
    //const [recentLogs, setRecent] = useState<VehicleLogWithDriver[]>([]);
    const [driverList, setDriverList] = useState<Driver[]>([]);
    const [mode, setMode] = useState<Mode>("loading");
    const [submitting, setSubmit] = useState(false);
    const [checkoutForm] = Form.useForm();
    const [returnForm] = Form.useForm();
    const isSelfDriven = Form.useWatch("isSelfDriven", checkoutForm);

    const load = useCallback(async () => {
        const [vRes, dRes] = await Promise.all([
            fetch(`/api/vehicles/${id}`),
            fetch("/api/drivers"),
        ]);
        if (!vRes.ok) { setMode("error"); return; }

        const { vehicle: v, logs } = await vRes.json();
        const dList = await dRes.json();

        setVehicle(v);
        setDriverList(dList);
        //setRecent(logs.slice(0, 5));

        const open = logs.find((l: VehicleLogWithDriver) => l.status === "out") ?? null;
        setOpenLog(open);
        setMode(open ? "return" : "checkout");
        checkoutForm.setFieldValue("odometerOut", v.currentOdometer);
        checkoutForm.setFieldValue("isSelfDriven", false);
        checkoutForm.setFieldValue("requesterType", "department");
    }, [id, checkoutForm]);

    useEffect(() => {
        let ignore = false;
        (async () => {
            const [vRes, dRes] = await Promise.all([
                fetch(`/api/vehicles/${id}`),
                fetch("/api/drivers"),
            ]);
            if (ignore) return;
            if (!vRes.ok) { setMode("error"); return; }

            const { vehicle: v, logs } = await vRes.json();
            const dList = await dRes.json();
            if (ignore) return;

            setVehicle(v);
            setDriverList(dList);
            const open = logs.find((l: VehicleLogWithDriver) => l.status === "out") ?? null;
            setOpenLog(open);
            setMode(open ? "return" : "checkout");
            checkoutForm.setFieldValue("odometerOut", v.currentOdometer);
            checkoutForm.setFieldValue("isSelfDriven", false);
            checkoutForm.setFieldValue("requesterType", "department");
        })();
        return () => { ignore = true; };
    }, [id, checkoutForm]);

    const handleCheckout = async () => {
        const values = await checkoutForm.validateFields();
        setSubmit(true);
        const res = await fetch("/api/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...values, vehicleId: id }),
        });
        const data = await res.json();
        setSubmit(false);
        if (!res.ok) { message.error(data.error); return; }
        setMode("success-out");
        setOpenLog(data);
    };

    const handleReturn = async () => {
        if (!openLog) return;
        let values;
        try {
            values = await returnForm.validateFields();
        } catch {
            const odoIn = returnForm.getFieldValue("odometerIn");
            const odoOut = openLog?.odometerOut ?? 0;
            if (odoIn != null && odoIn < odoOut) {
                message.error(`เลขไมล์ต้องไม่น้อยกว่า ${odoOut.toLocaleString()} กม. กรุณากรอกใหม่`);
            } else {
                message.error("กรุณากรอกเลขไมล์ให้ถูกต้อง");
            }
            return; // ไม่บันทึก
        }
        setSubmit(true);
        const res = await fetch(`/api/logs/${openLog.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
        });
        const data = await res.json();
        setSubmit(false);
        if (!res.ok) { message.error(data.error); return; }
        setMode("success-in");
        load();
    };

    const isAmb = vehicle?.type === "ambulance";
    const accent = isAmb ? "#cf1322" : "#0958d9";

    if (mode === "loading") return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
            <Spin size="large" />
        </div>
    );

    if (mode === "error") return (
        <div style={{ maxWidth: 480, margin: "80px auto", padding: 24 }}>
            <Alert type="error" title="ไม่พบยานพาหนะในระบบ" description="QR Code อาจไม่ถูกต้อง" showIcon />
        </div>
    );

    return (
        <div style={{ minHeight: "100vh", background: `${accent}0d`, padding: "24px 16px" }}>
            <div style={{ maxWidth: 520, margin: "0 auto" }}>

                {/* Header */}
                <div style={{ marginBottom: 16, borderRadius: 16, border: `2px solid ${accent}33`, background: "#fff", overflow: "hidden" }}>
                    <div style={{ background: accent, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isAmb
                                ? <TruckOutlined style={{ color: "#fff", fontSize: 20 }} />
                                : <CarOutlined style={{ color: "#fff", fontSize: 20 }} />}
                        </div>
                        <div>
                            <div style={{ color: "#fff", fontSize: 20, fontWeight: 800, letterSpacing: 1 }}>
                                {vehicle?.plateNumber}
                            </div>
                            <div style={{ color: "rgba(255,255,255,.85)", fontSize: 12 }}>
                                {vehicle?.name}
                            </div>
                        </div>
                        <div style={{ marginLeft: "auto" }}>
                            <Tag style={{ border: "none", background: "rgba(255,255,255,.2)", color: "#fff" }}>
                                {VEHICLE_TYPE_LABELS[vehicle?.type ?? ""]}
                            </Tag>
                        </div>
                    </div>
                    <div style={{ padding: "10px 18px" }}>
                        <Row gutter={16}>
                            {vehicle?.department && (
                                <Col span={12}>
                                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                        แผนก
                                    </Typography.Text>
                                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                                        {vehicle.department}
                                    </div>
                                </Col>
                            )}
                            <Col span={12}>
                                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                    เลขไมล์ปัจจุบัน
                                </Typography.Text>
                                <div style={{ fontWeight: 600, fontSize: 13, color: accent }}>
                                    {formatOdometer(vehicle?.currentOdometer)}
                                </div>
                            </Col>
                            <Col span={12}>
                                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                    สถานะ
                                </Typography.Text>
                                <div>
                                    <Badge status={openLog ? "warning" : "success"}
                                        text={openLog ? "กำลังปฏิบัติงาน" : "พร้อมใช้งาน"} />
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>

                {/* Active trip alert */}
                {openLog && mode === "return" && (
                    <Alert type="warning" showIcon style={{ marginBottom: 14, borderRadius: 12 }}
                        title={
                            <>
                                กำลังใช้งาน
                                {openLog.isSelfDriven ? (
                                    " (ขับเอง)"
                                ) : (
                                    <>
                                        {" โดย: "}
                                        <strong>{openLog.driverName ?? ""}</strong>
                                    </>
                                )}
                            </>
                        }
                        description={
                            <div style={{ fontSize: 14 }}>
                                <div>ผู้ขอใช้รถ: <strong>{openLog.requesterName}</strong></div>
                                <div>ออกเมื่อ: <strong>{formatThaiDate(openLog.checkoutAt)}</strong></div>
                                <div>สถานที่: <strong>{openLog.destination}</strong></div>
                                <div>เลขไมล์ออก: <strong>{formatOdometer(openLog.odometerOut)}</strong></div>
                            </div>
                        }
                    />
                )}

                {mode === "success-out" && (
                    <Alert type="success" showIcon icon={<LogoutOutlined />}
                        title="บันทึกการออกเดินทางเรียบร้อย" style={{ marginBottom: 14, borderRadius: 12 }}
                        action={
                            <Button size="small"
                                onClick={() => {
                                    setMode("return");
                                    load();
                                }}>
                                ไปบันทึกการกลับ
                            </Button>}
                    />
                )}

                {mode === "success-in" && (
                    <Alert type="success" showIcon icon={<CheckCircleOutlined />}
                        title="บันทึกการกลับมาเรียบร้อย" style={{ marginBottom: 14, borderRadius: 12 }}
                    />
                )}

                {/* ── Checkout Form ── */}
                {mode === "checkout" && (
                    <div style={{ background: "#fff", borderRadius: 16, border: `1px solid ${accent}22`, padding: "16px 18px" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: accent, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                            <LogoutOutlined /> บันทึกการออกเดินทาง
                        </div>
                        <Form form={checkoutForm} layout="vertical">

                            {/* ─ ผู้ขับ ─ */}
                            <Form.Item name="isSelfDriven" label="ผู้ขับรถ" initialValue={false}>
                                <Radio.Group
                                    optionType="button"
                                    buttonStyle="solid"
                                    onChange={(e) => {
                                        checkoutForm.setFieldValue("driverId", undefined);
                                        // ผู้ขอใช้ขับเอง → บังคับผู้ขอใช้เป็นระบุบุคคล
                                        if (e.target.value === true) {
                                            checkoutForm.setFieldValue("requesterType", "person");
                                            checkoutForm.setFieldValue("requesterDept", undefined);
                                        }
                                    }}
                                    options={[
                                        { value: false, label: "พนักงานขับรถ" },
                                        { value: true, label: "ผู้ขอใช้ขับเอง" },
                                    ]}
                                />
                            </Form.Item>

                            <Form.Item noStyle shouldUpdate={(p, c) => p.isSelfDriven !== c.isSelfDriven}>
                                {({ getFieldValue }) =>
                                    !getFieldValue("isSelfDriven") && (
                                        <Form.Item name="driverId" label="เลือกพนักงานขับรถ"
                                            rules={[{ required: true, message: "กรุณาเลือกพนักงาน" }]}>
                                            <Select size="large"
                                                showSearch={{ optionFilterProp: "label" }}
                                                placeholder="ค้นหาชื่อพนักงานขับรถ..."
                                                options={driverList.map((d) => ({
                                                    value: d.id,
                                                    label: `${d.firstName} ${d.lastName}${d.phone ? ` (${d.phone})` : ""}`,
                                                }))}
                                            />
                                        </Form.Item>
                                    )
                                }
                            </Form.Item>

                            <Divider style={{ margin: "8px 0" }} />

                            {/* ─ ผู้ขอใช้ ─ */}
                            <Form.Item name="requesterType" label="ผู้ขอใช้รถ" initialValue="department">
                                <Radio.Group
                                    optionType="button"
                                    buttonStyle="solid"
                                    onChange={() => {
                                        checkoutForm.setFieldValue("requesterDept", undefined);
                                        checkoutForm.setFieldValue("requesterName", undefined);
                                        checkoutForm.setFieldValue("requesterPhone", undefined);
                                    }}
                                    options={[
                                        { value: "department", label: "ระบุแผนก", disabled: isSelfDriven === true },
                                        { value: "person", label: "ระบุชื่อบุคคล" },
                                    ]}
                                />
                            </Form.Item>

                            <Form.Item noStyle shouldUpdate={(p, c) => p.requesterType !== c.requesterType}>
                                {({ getFieldValue }) =>
                                    getFieldValue("requesterType") === "department" ? (
                                        <Form.Item name="requesterDept" label="แผนกที่ขอใช้รถ"
                                            rules={[{ required: true, message: "กรุณาเลือกแผนก" }]}>
                                            <Select size="large"
                                                showSearch={{ optionFilterProp: "label" }}
                                                allowClear
                                                placeholder="ค้นหาชื่อแผนก..."
                                                options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
                                        </Form.Item>
                                    ) : (
                                        <>
                                            <Form.Item name="requesterName" label="ชื่อ-นามสกุลผู้ขอใช้"
                                                rules={[{ required: true, message: "กรุณาระบุชื่อ" }]}>
                                                <Input size="large" placeholder="ชื่อ-นามสกุล" />
                                            </Form.Item>
                                            <Form.Item
                                                name="requesterPhone"
                                                label="เบอร์โทรผู้ขอใช้"
                                                rules={[
                                                    {
                                                        pattern: /^[0-9]{10}$/,
                                                        message: "กรุณากรอกเบอร์โทรศัพท์ 10 หลัก",
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    size="large"
                                                    placeholder="0XXXXXXXXX"
                                                    maxLength={10}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                />
                                            </Form.Item>
                                        </>
                                    )
                                }
                            </Form.Item>

                            <Divider style={{ margin: "8px 0" }} />

                            {/* ─ การเดินทาง ─ */}
                            <Form.Item name="destination" label="สถานที่ / วัตถุประสงค์"
                                rules={[{ required: true, message: "กรุณาระบุสถานที่" }]}>
                                <Input.TextArea rows={2} size="large" placeholder="เช่น ออกเยี่ยมบ้าน, ไปรพ..." />
                            </Form.Item>

                            <Form.Item name="odometerOut" label="เลขไมล์ก่อนออก (กม.)"
                                rules={[{ required: true, message: "กรอกเลขไมล์" }]}>
                                <InputNumber
                                    type="numeric"
                                    min={vehicle?.currentOdometer ?? 0}
                                    style={{ width: "100%" }} size="large"
                                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                    parser={v => Number(v?.replace(/,/g, "") ?? 0)}
                                />
                            </Form.Item>

                            <Button type="primary" size="large" block icon={<LogoutOutlined />}
                                onClick={handleCheckout} loading={submitting}
                                style={{ background: accent, borderColor: accent, height: 48, fontSize: 16 }}>
                                บันทึกการออกเดินทาง
                            </Button>
                        </Form>
                    </div>
                )}

                {/* ── Return Form ── */}
                {mode === "return" && (
                    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #52c41a33", padding: "16px 18px" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#3B6D11", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
                            <LoginOutlined /> บันทึกการกลับมาถึง
                        </div>
                        <Form form={returnForm} layout="vertical">
                            <Form.Item name="odometerIn" label="เลขไมล์เมื่อกลับมา (กม.)"
                                rules={[
                                    { required: true, message: "กรอกเลขไมล์" },
                                    { validator: (_, v) => v >= (openLog?.odometerOut ?? 0) ? Promise.resolve() : Promise.reject(`ต้องไม่น้อยกว่า ${openLog?.odometerOut?.toLocaleString()} กม.`) },
                                ]}>
                                <InputNumber
                                    type="numeric"
                                    min={0 as number}
                                    style={{ width: "100%" }} size="large"
                                    formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                    parser={v => Number(v?.replace(/,/g, "") ?? 0)}
                                />
                            </Form.Item>

                            <Button type="primary" size="large" block icon={<LoginOutlined />}
                                onClick={handleReturn} loading={submitting}
                                style={{ background: "#52c41a", borderColor: "#52c41a", height: 48, fontSize: 16 }}>
                                บันทึกการกลับมาถึง
                            </Button>
                        </Form>
                    </div>
                )}

                {/* ── Recent logs ── 
                {recentLogs.length > 0 && (
                    <div style={{ marginTop: 16, background: "#fff", borderRadius: 16, border: "0.5px solid #e0e0e0", padding: "12px 16px" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#555" }}>ประวัติล่าสุด</div>
                        {recentLogs.map((log: any, i: number) => (
                            <div key={log.id} style={{ padding: "7px 0", borderBottom: i < recentLogs.length - 1 ? "1px solid #f5f5f5" : "none" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        {log.isSelfDriven
                                            ? <Tag color="purple" style={{ fontSize: 11 }}>ขับเอง</Tag>
                                            : <Typography.Text strong style={{ fontSize: 12 }}>{log.driverFirstName} {log.driverLastName}</Typography.Text>}
                                        {log.requesterType === "department"
                                            ? <Tag color="blue" style={{ fontSize: 10, marginLeft: 4 }}>{log.requesterDept}</Tag>
                                            : <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>{log.requesterName}</Typography.Text>}
                                    </div>
                                    <Tag color={log.status === "out" ? "orange" : "green"} style={{ fontSize: 11 }}>
                                        {log.status === "out" ? "กำลังออก" : "กลับแล้ว"}
                                    </Tag>
                                </div>
                                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                    {log.destination} · {formatThaiDate(log.checkoutAt)}
                                    {log.distanceTraveled ? ` · ${log.distanceTraveled.toLocaleString()} กม.` : ""}
                                </Typography.Text>
                            </div>
                        ))}
                    </div>
                )}
*/}
            </div>
        </div>
    );
}