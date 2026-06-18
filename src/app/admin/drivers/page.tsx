"use client";
import { useEffect, useState } from "react";
import {
    Table, Button, Modal, Form, Input, Select,
    Space, Tag, Typography, Popconfirm, message, Tooltip, Card,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";
import { formatThaiDate } from "@/lib/utils";
import type { Driver } from "@/db/schema";

export default function DriversPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Driver | null>(null);
    const [form] = Form.useForm();

    const load = async () => {
        setLoading(true);
        setDrivers(await fetch("/api/drivers?activeOnly=false").then(r => r.json()));
        setLoading(false);
    };
    useEffect(() => {
        let ignore = false;
        (async () => {
            const data = await fetch("/api/drivers?activeOnly=false").then(r => r.json());
            if (ignore) return;
            setDrivers(data);
            setLoading(false);
        })();
        return () => { ignore = true; };
    }, []);

    const handleSave = async () => {
        const values = await form.validateFields();
        const res = await fetch(
            editing ? `/api/drivers/${editing.id}` : "/api/drivers",
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
        await fetch(`/api/drivers/${id}`, { method: "DELETE" });
        message.success("ลบแล้ว");
        load();
    };

    const columns = [
        {
            title: "ชื่อ-นามสกุล", key: "name",
            render: (_: unknown, r: Driver) => (
                <Space>
                    <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "#e6f4ff", display: "flex", alignItems: "center",
                        justifyContent: "center", color: "#1677ff", fontWeight: 700, fontSize: 14, flexShrink: 0
                    }}>
                        <UserOutlined />
                    </div>
                    <Typography.Text strong>{r.firstName} {r.lastName}</Typography.Text>
                </Space>
            ),
        },
        {
            title: "เบอร์โทร", dataIndex: "phone",
            render: (v: string) => v
                ? <a href={`tel:${v}`}>{v}</a>
                : <Typography.Text type="secondary">-</Typography.Text>,
        },
        {
            title: "สถานะ", dataIndex: "isActive", width: 90,
            render: (v: number) => <Tag color={v === 1 ? "green" : "red"}>
                {v === 1 ? "ใช้งาน" : "ปิดใช้งาน"}
            </Tag>,
        },
        {
            title: "วันที่เพิ่ม", dataIndex: "createdAt",
            render: (v: string) => formatThaiDate(v),
        },
        {
            title: "จัดการ", width: 100,
            render: (_: unknown, r: Driver) => (
                <Space>
                    <Tooltip title="แก้ไข">
                        <Button size="small" icon={<EditOutlined />}
                            onClick={() => {
                                setEditing(r);
                                form.setFieldsValue(r);
                                setModalOpen(true);
                            }} />
                    </Tooltip>
                    <Popconfirm title="ยืนยันลบ?" onConfirm={() => handleDelete(r.id)} okText="ลบ" cancelText="ยกเลิก">
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
                    <UserOutlined /> จัดการพนักงานขับรถ
                </Typography.Title>
                <Button type="primary" icon={<PlusOutlined />}
                    onClick={() => {
                        setEditing(null);
                        form.resetFields();
                        setModalOpen(true);
                    }}>
                    เพิ่มพนักงาน
                </Button>
            </div>

            <Card>
                <Table dataSource={drivers} columns={columns} rowKey="id" loading={loading}
                    pagination={{ pageSize: 20, showTotal: t => `ทั้งหมด ${t} คน` }} size="middle" />
            </Card>

            <Modal title={<><UserOutlined /> {editing ? "แก้ไขพนักงานขับรถ" : "เพิ่มพนักงานขับรถ"}</>}
                open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
                okText={editing ? "บันทึก" : "เพิ่ม"} cancelText="ยกเลิก">
                <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="firstName" label="ชื่อ"
                        rules={[{ required: true, message: "กรอกชื่อ" }]}>
                        <Input size="large" placeholder="กรอกชื่อ" />
                    </Form.Item>
                    <Form.Item name="lastName" label="นามสกุล"
                        rules={[{ required: true, message: "กรอกนามสกุล" }]}>
                        <Input size="large" placeholder="กรอกนามสกุล" />
                    </Form.Item>
                    <Form.Item name="phone" label="เบอร์โทร"
                        rules={[{ required: true, message: "กรอกเบอร์โทร" }]}>
                        <Input
                            size="large"
                            placeholder="0XXXXXXXXX"
                            maxLength={10}
                            inputMode="numeric"
                            pattern="[0-9]*"
                        />
                    </Form.Item>
                    {editing && (
                        <Form.Item name="isActive" label="สถานะ">
                            <Select size="large"
                                options={[
                                    { value: 1, label: "ใช้งาน" },
                                    { value: 0, label: "ปิดใช้งาน" }
                                ]} />
                        </Form.Item>
                    )}
                </Form>
            </Modal>
        </div>
    );
}

