"use client";
import { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Table, Tag, Typography, Space, Badge, Spin, Alert, Button } from "antd";
import { CarOutlined, ClockCircleOutlined, WarningOutlined, ArrowRightOutlined, UserOutlined, TruckOutlined, LinkOutlined } from "@ant-design/icons";
import Link from "next/link";
import { VEHICLE_TYPE_COLORS, LOG_STATUS_LABELS } from "@/lib/constants";
import { formatThaiDate } from "@/lib/utils";
import type { LogRow, VehicleRow } from "@/lib/types";
import type { Driver } from "@/db/schema";

export default function AdminDashboard() {
    const [logs, setLogs] = useState<LogRow[]>([]);
    const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch("/api/logs?limit=20").then(r => r.json()),
            fetch("/api/vehicles?activeOnly=false").then(r => r.json()),
            fetch("/api/drivers").then(r => r.json()),
        ]).then(([l, v, d]) => {
            setLogs(l);
            setVehicles(v);
            setDrivers(d);
        }).finally(() => setLoading(false));
    }, []);

    if (loading) return <div style={{ textAlign: "center", padding: 80 }}>
        <Spin size="large" />
    </div>;

    const outCount = logs.filter((l) => l.log.status === "out").length;
    const ambulance = vehicles.filter((v) => v.vehicle.type === "ambulance").length;
    const general = vehicles.filter((v) => v.vehicle.type === "general").length;

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
            title: "ผู้ขับ", key: "driver",
            render: (_: unknown, r: LogRow) =>
                r.log.isSelfDriven
                    ? <Tag color="purple">ขับเอง</Tag>
                    : r.driver
                        ? <Space vertical size={0}>
                            <span style={{ fontWeight: 600 }}>{r.driver.firstName} {r.driver.lastName}
                            </span><Typography.Text type="secondary" style={{ fontSize: 11 }}>
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
            title: "เวลาออก", key: "time",
            render: (_: unknown, r: LogRow) => formatThaiDate(r.log.checkoutAt),
        },
        {
            title: "สถานะ", key: "status",
            render: (_: unknown, r: LogRow) => (
                <Badge status={r.log.status === "out" ? "warning" : "success"}
                    text={LOG_STATUS_LABELS[r.log.status]} />
            ),
        },
    ];

    return (
        <div>
            <Typography.Title level={4} style={{ marginBottom: 24 }}>
                ภาพรวมระบบ
            </Typography.Title>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic title="ยานพาหนะทั้งหมด" value={vehicles.length}
                            prefix={<CarOutlined />} suffix="คัน"
                            styles={{ content: { color: "#808080" } }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic title="รถพยาบาล" value={ambulance}
                            prefix={<TruckOutlined />} suffix="คัน"
                            styles={{ content: { color: "#f5222d" } }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic title="รถยนต์ทั่วไป" value={general}
                            prefix={<CarOutlined />} suffix="คัน"
                            styles={{ content: { color: "#1677ff" } }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic title="พนักงานขับรถ" value={drivers.length}
                            prefix={<UserOutlined />} suffix="คน" />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic title="กำลังปฏิบัติงาน" value={outCount}
                            prefix={<ClockCircleOutlined />} suffix="คัน"
                            styles={{
                                content:
                                    { color: outCount > 0 ? "#fa8c16" : "#52c41a" }
                            }} />
                    </Card>
                </Col>
            </Row>

            {outCount > 0 && (
                <Alert title={`มียานพาหนะ ${outCount} คันกำลังปฏิบัติงานอยู่ในขณะนี้`} type="warning"
                    showIcon icon={<WarningOutlined />} style={{ marginBottom: 16 }} />
            )}

            <Card title="บันทึกล่าสุด"
                extra={<Link href="/admin/logs">
                    <Button type="link" icon={<ArrowRightOutlined />}>
                        ดูทั้งหมด
                    </Button>
                </Link>}>
                <Table dataSource={logs} columns={columns} rowKey={r => r.log.id}
                    pagination={false} size="small" scroll={{ x: 900 }} />
            </Card>
        </div>
    );
}