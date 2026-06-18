"use client";
import { useEffect, useState } from "react";
import { Card, Row, Col, Typography, DatePicker, Select, Button, Table, Tag, Statistic, Space } from "antd";
import { DownloadOutlined, BarChartOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPE_COLORS, LOG_STATUS_LABELS } from "@/lib/constants";
import { formatOdometer, formatThaiDate } from "@/lib/utils";
import type { LogRow, VehicleRow } from "@/lib/types";

export default function ReportsPage() {
    const [logs, setLogs] = useState<LogRow[]>([]);
    const [vehicles, setVehicles] = useState<VehicleRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().startOf("month"), dayjs()]);
    const [vehicleId, setVehicleId] = useState("");

    useEffect(() => {
        let ignore = false;
        (async () => {
            const p = new URLSearchParams({ limit: "500" });
            p.append("from", dayjs().startOf("month").toISOString());
            p.append("to", dayjs().toISOString());
            const [vData, lData] = await Promise.all([
                fetch("/api/vehicles").then(r => r.json()),
                fetch(`/api/logs?${p}`).then(r => r.json()),
            ]);
            if (ignore) return;
            setVehicles(vData);
            setLogs(lData);
        })();
        return () => { ignore = true; };
    }, []);

    const load = async () => {
        setLoading(true);
        const p = new URLSearchParams({ limit: "500" });
        if (vehicleId) p.append("vehicleId", vehicleId);
        if (range[0]) p.append("from", range[0].toISOString());
        if (range[1]) p.append("to", range[1].toISOString());
        setLogs(await fetch(`/api/logs?${p}`).then(r => r.json()));
        setLoading(false);
    };

    const done = logs.filter((l) => l.log.status === "returned");
    const totalKm = done.reduce((s, l) => s + (l.log.distanceTraveled || 0), 0);
    const avgKm = done.length ? Math.round(totalKm / done.length) : 0;

    const handleExport = () => {
        const p = new URLSearchParams();
        if (vehicleId) p.append("vehicleId", vehicleId);
        if (range[0]) p.append("from", range[0].toISOString());
        if (range[1]) p.append("to", range[1].toISOString());
        window.open(`/api/export?${p}`, "_blank");
    };

    const columns = [
        {
            title: "ทะเบียน", key: "plate",
            render: (_: unknown, r: LogRow) => <Tag color={VEHICLE_TYPE_COLORS[r.vehicle?.type ?? "general"]}>
                {r.vehicle?.plateNumber}
            </Tag>,
        },
        { title: "ประเภท", key: "type", render: (_: unknown, r: LogRow) =><Tag color={VEHICLE_TYPE_COLORS[r.vehicle?.type ?? "general"]}>
            {VEHICLE_TYPE_LABELS[r.vehicle?.type ?? ""]}
        </Tag> },
        { title: "ชื่อรถ", dataIndex: ["vehicle", "name"] },
        {
            title: "ผู้ขับ", key: "driver",
            render: (_: unknown, r: LogRow) =>
                r.log.isSelfDriven ? <Tag color="purple">ขับเอง</Tag>
                    : r.driver ? `${r.driver.firstName} ${r.driver.lastName}` : "-",
        },
        {
            title: "ผู้ขอใช้รถ", key: "requester",
            render: (_: unknown, r: LogRow) =>
                r.log.requesterType === "department"
                    ? <Tag color="blue">{r.log.requesterDept}</Tag>
                    : <Space vertical size={0}>
                        <span>
                            {r.log.requesterName}
                        </span>
                        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            {r.log.requesterPhone}
                        </Typography.Text>
                    </Space>,
        },
        { title: "สถานที่ / วัตถุประสงค์", dataIndex: ["log", "destination"], ellipsis: true },
        { title: "เวลาออก", key: "out", render: (_: unknown, r: LogRow) => formatThaiDate(r.log.checkoutAt) },
        { title: "เวลากลับ", key: "in", render: (_: unknown, r: LogRow) => r.log.returnedAt ? formatThaiDate(r.log.returnedAt) : "-" },
        { title: "ไมล์ออก", key: "odoOut", render: (_: unknown, r: LogRow) => formatOdometer(r.log.odometerOut) },
        { title: "ไมล์กลับ", key: "odoIn", render: (_: unknown, r: LogRow) => r.log.odometerIn ? formatOdometer(r.log.odometerIn) : "-" },
        {
            title: "ระยะทาง", key: "dist",
            render: (_: unknown, r: LogRow) => r.log.distanceTraveled ? `${r.log.distanceTraveled.toLocaleString()} กม.` : "-",
            sorter: (a: LogRow, b: LogRow) => (a.log.distanceTraveled || 0) - (b.log.distanceTraveled || 0),
        },
        {
            title: "สถานะ", key: "status",
            render: (_: unknown, r: LogRow) => <Tag color={r.log.status === "out" ? "orange" : "green"}>
                {LOG_STATUS_LABELS[r.log.status]}
            </Tag>,
        },
    ];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <Typography.Title level={4} style={{ margin: 0 }}>
                    <BarChartOutlined /> รายงานการใช้งานยานพาหนะ
                </Typography.Title>
                <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
                    Export Excel
                </Button>
            </div>

            <Card style={{ marginBottom: 12 }}>
                <Space wrap>
                    <DatePicker.RangePicker value={range}
                        onChange={d => d && setRange([d[0]!, d[1]!])}
                        format="DD/MM/BBBB" />
                    <Select value={vehicleId}
                        onChange={setVehicleId}
                        style={{ width: 220 }}
                        allowClear
                        placeholder="ทุกคัน"
                        showSearch={{ optionFilterProp: "label" }}
                        options={vehicles.map((v) => ({
                            label: `${v.vehicle.plateNumber} — ${v.vehicle.name}`,
                            value: v.vehicle.id,
                        }))} />

                    <Button type="primary" onClick={load} loading={loading}>
                        ดูรายงาน
                    </Button>
                </Space>
            </Card>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic title="ทริปทั้งหมด" value={logs.length} suffix="ครั้ง" />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic title="เสร็จสิ้น" value={done.length} suffix="ครั้ง"
                            styles={{ content: { color: "#52c41a" } }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic title="รวมระยะทาง" value={totalKm.toLocaleString()} suffix="กม."
                            styles={{ content: { color: "#1677ff" } }} />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card>
                        <Statistic title="เฉลี่ย/ทริป" value={avgKm.toLocaleString()} suffix="กม."
                            styles={{ content: { color: "#faad14" } }} />
                    </Card>
                </Col>
            </Row>

            <Card>
                <Table dataSource={logs} columns={columns} rowKey={r => r.log.id} loading={loading}
                    pagination={{ pageSize: 25, showTotal: t => `ทั้งหมด ${t} รายการ` }}
                    scroll={{ x: 1400 }} size="small" />
            </Card>
        </div>
    );
}