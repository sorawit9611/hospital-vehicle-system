"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Typography, Alert } from "antd";
import { LockOutlined, CarOutlined } from "@ant-design/icons";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onFinish = async ({ password }: { password: string }) => {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });
        setLoading(false);
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
            return;
        }
        const next = new URLSearchParams(window.location.search).get("next");
        router.replace(next && next.startsWith("/admin") ? next : "/admin");
        router.refresh();
    };

    return (
        <div style={{
            minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
            background: "#0a1628", padding: 16,
        }}>
            <Card style={{ width: 380, maxWidth: "100%", borderRadius: 16 }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 14, background: "#0a1628",
                        display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 12,
                    }}>
                        <CarOutlined style={{ color: "#fff", fontSize: 26 }} />
                    </div>
                    <Typography.Title level={4} style={{ margin: 0 }}>ระบบงานยานพาหนะ</Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        โรงพยาบาลสามร้อยยอด — เข้าสู่ระบบผู้ดูแล
                    </Typography.Text>
                </div>

                {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}

                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item name="password" label="รหัสผ่าน"
                        rules={[{ required: true, message: "กรุณากรอกรหัสผ่าน" }]}>
                        <Input.Password size="large" prefix={<LockOutlined />} placeholder="รหัสผ่านผู้ดูแล"
                            autoFocus />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" size="large" block loading={loading}
                        style={{ height: 46 }}>
                        เข้าสู่ระบบ
                    </Button>
                </Form>
            </Card>
        </div>
    );
}
