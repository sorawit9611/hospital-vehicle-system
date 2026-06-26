"use client";
import { useEffect, useState } from "react";
import {
    Table, Tag, Typography, Space, Badge, Card,
    DatePicker, Select, Button, Popconfirm, message, Row, Col,
} from "antd";
import { DeleteOutlined, FileSearchOutlined, LinkOutlined, ReloadOutlined } from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPE_COLORS, LOG_STATUS_LABELS } from "@/lib/constants";
import { formatOdometer, formatThaiDate } from "@/lib/utils";
import type { LogRow } from "@/lib/types";

export default function LogsPage() {
    const [logs, setLogs] = useState<LogRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
    const [status, setStatus] = useState("");

    const load = async () => {
        setLoading(true);
        const p = new URLSearchParams({ limit: "200" });
        if (status) p.append("status", status);
        if (dateRange[0]) p.append("from", dateRange[0].toISOString());
        if (dateRange[1]) p.append("to", dateRange[1].toISOString());
        setLogs(await fetch(`/api/logs?${p}`).then(r => r.json()));
        setLoading(false);
    };

    useEffect(() => {
        let ignore = false;
        (async () => {
            const p = new URLSearchParams({ limit: "200" });
            if (status) p.append("status", status);
            if (dateRange[0]) p.append("from", dateRange[0].toISOString());
            if (dateRange[1]) p.append("to", dateRange[1].toISOString());
            const data = await fetch(`/api/logs?${p}`).then(r => r.json());
            if (ignore) return;
            setLogs(data);
            setLoading(false);
        })();
        return () => { ignore = true; };
    }, [status, dateRange]);

    const columns = [
        {
            title: "ทะเบียน", key: "plate",
            render: (_: unknown, r: LogRow) => (
                <Link href={`/vehicle/${r.log.vehicleId}`} target="_blank">
                    <Tag color={VEHICLE_TYPE_COLORS[r.vehicle?.type ?? "general"]}>
                        {r.vehicle?.plateNumber}
                    </Tag>
                    <LinkOutlined style={{ fontSize: 11, marginLeft: 4, color: "#1677ff" }} />
                </Link>
            ),
        },
        {
            title: "ชื่อรถ / ประเภท", key: "vinfo",
            render: (_: unknown, r: LogRow) => (
                <Space vertical size={0}>
                    <Typography.Text strong>{r.vehicle?.name}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {VEHICLE_TYPE_LABELS[r.vehicle?.type ?? ""]}
                    </Typography.Text>
                </Space>
            ),
        },
        {
            title: "ผู้ขับ", key: "driver",
            render: (_: unknown, r: LogRow) =>
                r.log.isSelfDriven
                    ? <Tag color="purple">ขับเอง</Tag>
                    : r.driver
                        ? <Space vertical size={0}>
                            <span style={{ fontWeight: 600 }}>{r.driver.firstName} {r.driver.lastName}</span>
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                                {r.driver.phone}
                            </Typography.Text>
                        </Space>
                        : "-",
        },
        {
            title: "ผู้ขอใช้รถ", key: "requester",
            render: (_: unknown, r: LogRow) =>
                r.log.requesterType === "department"
                    ? <Tag color="blue">{r.log.requesterDept}</Tag>
                    : <Space vertical size={0}>
                        <span style={{ fontWeight: 600 }}>{r.log.requesterName}</span>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            {r.log.requesterPhone}
                        </Typography.Text>
                    </Space>,
        },
        {
            title: "สถานที่", key: "dest",
            dataIndex: ["log", "destination"],
            ellipsis: true,
        },
        {
            title: "ไมล์ออก", key: "odoOut",
            render: (_: unknown, r: LogRow) => formatOdometer(r.log.odometerOut),
        },
        {
            title: "เวลาออก", key: "checkout",
            render: (_: unknown, r: LogRow) => formatThaiDate(r.log.checkoutAt),
        },
        {
            title: "ไมล์กลับ", key: "odoIn",
            render: (_: unknown, r: LogRow) => r.log.odometerIn ? formatOdometer(r.log.odometerIn) : "-",
        },
        {
            title: "ระยะทาง", key: "dist",
            render: (_: unknown, r: LogRow) => r.log.distanceTraveled ? `${r.log.distanceTraveled.toLocaleString()} กม.` : "-",
        },
        {
            title: "สถานะ", key: "status",
            render: (_: unknown, r: LogRow) => (
                <Badge status={r.log.status === "out" ? "warning" : "success"} text={LOG_STATUS_LABELS[r.log.status]} />
            ),
        },
        {
            title: "", width: 50,
            render: (_: unknown, r: LogRow) => (
                <Popconfirm title="ลบบันทึกนี้?"
                    onConfirm={
                        async () => {
                            await fetch(`/api/logs/${r.log.id}`, { method: "DELETE" });
                            message.success("ลบแล้ว"); load();
                        }}
                    okText="ลบ"
                    cancelText="ยกเลิก">
                    <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                    <FileSearchOutlined /> บันทึกการใช้งานยานพาหนะ
                </Typography.Title>
                <Button icon={<ReloadOutlined />} onClick={load}>รีเฟรช</Button>
            </div>

            <Card style={{ marginBottom: 12 }}>
                <Row gutter={[12, 8]} align="middle">
                    <Col>
                        <DatePicker.RangePicker
                            onChange={d => setDateRange([d?.[0] ?? null, d?.[1] ?? null])}
                            format="DD/MM/BBBB"
                        />
                    </Col>
                    <Col>
                        <Select value={status} onChange={setStatus} style={{ width: 160 }}
                            options={[
                                { value: "", label: "ทุกสถานะ" },
                                { value: "out", label: "กำลังปฏิบัติงาน" },
                                { value: "returned", label: "กลับมาแล้ว" }
                            ]} />
                    </Col>
                </Row>
            </Card>

            <Card>
                <Table dataSource={logs} columns={columns} rowKey={r => r.log.id} loading={loading}
                    pagination={{ pageSize: 25, showTotal: t => `ทั้งหมด ${t} รายการ` }}
                    scroll={{ x: 1300 }} size="small" />
            </Card>
        </div>
    );
}