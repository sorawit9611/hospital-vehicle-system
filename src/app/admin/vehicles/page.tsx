"use client";
import { useEffect, useState } from "react";
import {
    Table, Button, Modal, Form, Input, Select, InputNumber,
    Space, Tag, Typography, Popconfirm, message, Tooltip,
    Card, Row, Col, Segmented,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, QrcodeOutlined, PrinterOutlined, CarOutlined } from "@ant-design/icons";
import VehicleCard from "@/components/VehicleCard";
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPE_COLORS, DEPARTMENTS } from "@/lib/constants";
import { formatOdometer, formatThaiDate } from "@/lib/utils";
import type { VehicleRow } from "@/lib/types";
import type { Vehicle, Driver } from "@/db/schema";

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
    const [driverList, setDriverList] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [editing, setEditing] = useState<Vehicle | null>(null);
    const [selected, setSelected] = useState<Vehicle | null>(null);
    const [filterType, setFilterType] = useState("all");
    const [form] = Form.useForm();

    const load = async () => {
        setLoading(true);
        const url = filterType !== "all"
            ? `/api/vehicles?type=${filterType}&activeOnly=false`
            : "/api/vehicles?activeOnly=false";
        setVehicles(await fetch(url).then(r => r.json()));
        setLoading(false);
    };

    useEffect(() => {
        let ignore = false;
        (async () => {
            const url = filterType !== "all"
                ? `/api/vehicles?type=${filterType}&activeOnly=false`
                : "/api/vehicles?activeOnly=false";
            const [vData, dData] = await Promise.all([
                fetch(url).then(r => r.json()),
                fetch("/api/drivers").then(r => r.json()),
            ]);
            if (ignore) return;
            setVehicles(vData);
            setDriverList(dData);
            setLoading(false);
        })();
        return () => { ignore = true; };
    }, [filterType]);

    const openAdd = () => {
        setEditing(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEdit = (row: VehicleRow) => {
        setEditing(row.vehicle);
        form.setFieldsValue({
            ...row.vehicle,
            responsibleDriverId: row.vehicle.responsibleDriverId ?? undefined,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        const values = await form.validateFields();
        const res = await fetch(
            editing ? `/api/vehicles/${editing.id}` : "/api/vehicles",
            {
                method: editing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values)
            }
        );
        const data = await res.json();
        if (!res.ok) { message.error(data.error); return; }
        message.success(editing ? "อัปเดตแล้ว" : "เพิ่มแล้ว");
        setModalOpen(false);
        load();
    };

    const handleDelete = async (id: string) => {
        await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
        message.success("ลบแล้ว");
        load();
    };

    const columns = [
        {
            title: "ทะเบียน", dataIndex: ["vehicle", "plateNumber"],
            render: (v: string, r: VehicleRow) => <Tag color={VEHICLE_TYPE_COLORS[r.vehicle.type]}>
                {v}
            </Tag>,
        },
        {
            title: "ชื่อรถ", dataIndex: ["vehicle", "name"],
            render: (v: string) => <Typography.Text strong>
                {v}
            </Typography.Text>,
        },
        {
            title: "ประเภท", dataIndex: ["vehicle", "type"],
            render: (v: string) => <Tag color={VEHICLE_TYPE_COLORS[v]}>
                {VEHICLE_TYPE_LABELS[v]}
            </Tag>,
        },
        {
            title: "แผนก", dataIndex: ["vehicle", "department"],
            render: (v: string) => v || "-",
        },
        {
            title: "ผู้รับผิดชอบ", key: "responsible",
            render: (_: unknown, r: VehicleRow) =>
                r.responsibleDriver
                    ? <span>{r.responsibleDriver.firstName} {r.responsibleDriver.lastName}</span>
                    : <Typography.Text type="secondary">-</Typography.Text>,
        },
        {
            title: "เลขไมล์", dataIndex: ["vehicle", "currentOdometer"],
            render: (v: number) => formatOdometer(v),
        },
        {
            title: "สถานะ", dataIndex: ["vehicle", "isActive"],
            render: (v: number) => <Tag color={v === 1 ? "success" : "default"}>
                {v === 1 ? "ใช้งาน" : "ปิดใช้"}
            </Tag>,
        },
        {
            title: "วันที่เพิ่ม", dataIndex: ["vehicle", "createdAt"],
            render: (v: string) => formatThaiDate(v),
        },
        {
            title: "จัดการ", width: 140,
            render: (_: unknown, r: VehicleRow) => (
                <Space>
                    <Tooltip title="QR Code">
                        <Button size="small" icon={<QrcodeOutlined />}
                            onClick={() => {
                                setSelected(r.vehicle);
                                setQrModalOpen(true);
                            }} />
                    </Tooltip>
                    <Tooltip title="แก้ไข">
                        <Button size="small" icon={<EditOutlined />}
                            onClick={() => openEdit(r)} />
                    </Tooltip>
                    <Popconfirm title="ยืนยันลบ?"
                        onConfirm={() => handleDelete(r.vehicle.id)}
                        okText="ลบ"
                        cancelText="ยกเลิก">
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                    <CarOutlined /> จัดการยานพาหนะ
                </Typography.Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
                    เพิ่มยานพาหนะ
                </Button>
            </div>

            <Card style={{ marginBottom: 12 }}>
                <Segmented value={filterType} onChange={v => setFilterType(v as string)}
                    options={[
                        { label: "ทั้งหมด", value: "all" },
                        { label: "รถยนต์ทั่วไป", value: "general" },
                        { label: "รถพยาบาล", value: "ambulance" }]}
                />
            </Card>

            <Card>
                <Table dataSource={vehicles} columns={columns} rowKey={r => r.vehicle.id} loading={loading}
                    pagination={{ pageSize: 20, showTotal: t => `ทั้งหมด ${t} คัน` }}
                    scroll={{ x: 1000 }} size="middle" />
            </Card>

            {/* Add/Edit Modal */}
            <Modal title={<><CarOutlined />  {editing ? "แก้ไขยานพาหนะ" : "เพิ่มยานพาหนะ"}</>}
                open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
                okText={editing ? "บันทึก" : "เพิ่ม"} cancelText="ยกเลิก" width={560}>
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="plateNumber" label="ทะเบียนรถ" rules={[{ required: true }]}>
                                <Input placeholder="เช่น กข-1234" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="type" label="ประเภท" rules={[{ required: true }]}>
                                <Select options={[
                                    { value: "general", label: "รถยนต์ทั่วไป" },
                                    { value: "ambulance", label: "รถพยาบาล" }
                                ]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="name" label="ชื่อรถ" rules={[{ required: true }]}>
                        <Input placeholder="เช่น Toyota Fortuner 001" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="department" label="แผนก">
                                <Select
                                    options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
                                    showSearch
                                    allowClear />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="currentOdometer" label="เลขไมล์ปัจจุบัน (กม.)">
                                <InputNumber min={0} style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="responsibleDriverId" label="ผู้รับผิดชอบรถ">
                        <Select showSearch={{ optionFilterProp: "label" }} allowClear
                            placeholder="เลือกพนักงาน (ถ้ามี)"
                            options={driverList.map((d) => ({
                                value: d.id,
                                label: `${d.firstName} ${d.lastName}${d.phone ? ` — ${d.phone}` : ""}`,
                            }))} />
                    </Form.Item>
                    <Form.Item name="description" label="หมายเหตุ">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    {editing && (
                        <Form.Item name="isActive" label="สถานะ">
                            <Select options={[
                                { value: 1, label: "ใช้งาน" },
                                { value: 0, label: "ปิดใช้งาน" }
                            ]} />
                        </Form.Item>
                    )}
                </Form>
            </Modal>

            {/* QR Modal */}
            <Modal title={`บัตรประจำรถ — ${selected?.plateNumber}`}
                open={qrModalOpen} onCancel={() => setQrModalOpen(false)} centered
                footer={[
                    <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => window.print()}>
                        พิมพ์บัตร
                    </Button>,
                    <Button key="close" onClick={() => setQrModalOpen(false)}>
                        ปิด
                    </Button>,
                ]}>
                <div style={{ display: "flex", justifyContent: "center", padding: "16px 0" }}>
                    {selected && <div className="print-area">
                        <VehicleCard vehicle={selected} />
                    </div>}
                </div>
                <Typography.Paragraph type="secondary" style={{ textAlign: "center", fontSize: 12 }}>
                    สแกน QR Code เพื่อเข้าสู่หน้าบันทึกการใช้งานของรถคันนี้
                </Typography.Paragraph>
            </Modal>
        </div>
    );
}