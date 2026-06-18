"use client";
import { useState } from "react";
import { Avatar, Layout, Menu, Typography, theme } from "antd";
import {
    DashboardOutlined, CarOutlined, FileSearchOutlined,
    BarChartOutlined, UserOutlined,
    MenuFoldOutlined, MenuUnfoldOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const { Sider, Header, Content } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const { token } = theme.useToken();

    const items = [
        { key: "/admin", icon: <DashboardOutlined />, label: <Link href="/admin">Dashboard</Link> },
        { key: "/admin/vehicles", icon: <CarOutlined />, label: <Link href="/admin/vehicles">ยานพาหนะ</Link> },
        { key: "/admin/drivers", icon: <UserOutlined />, label: <Link href="/admin/drivers">พนักงานขับรถ</Link> },
        { key: "/admin/logs", icon: <FileSearchOutlined />, label: <Link href="/admin/logs">บันทึกการใช้งาน</Link> },
        { key: "/admin/reports", icon: <BarChartOutlined />, label: <Link href="/admin/reports">รายงาน</Link> },
    ];

    const selectedKey =
        items.map(i => i.key)
            .filter(k => pathname === k || pathname.startsWith(k + "/"))
            .sort((a, b) => b.length - a.length)[0] ?? "/admin";

    return (
        <Layout style={{ minHeight: "100vh" }}>
            <Sider
                collapsible collapsed={collapsed} onCollapse={setCollapsed} trigger={null}
                style={{ background: "#0a1628", position: "fixed", height: "100vh", left: 0, top: 0, zIndex: 100 }}
                width={240}
            >
                <div style={{
                    padding: collapsed ? "18px 8px" : "18px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", gap: 10, minHeight: 64
                }}>
                    <CarOutlined style={{ color: "#fff", fontSize: 22, flexShrink: 0 }} />
                    {!collapsed && (
                        <div>
                            <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>
                                ระบบงานยานพาหนะ
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                                โรงพยาบาลสามร้อยยอด
                            </div>
                        </div>
                    )}
                </div>
                <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={items}
                    style={{ background: "transparent", marginTop: 8, border: "none" }} />
            </Sider>

            <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: "margin-left .2s" }}>
                <Header style={{
                    background: "#fff", padding: "0 24px", display: "flex",
                    alignItems: "center", gap: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    position: "sticky", top: 0, zIndex: 99
                }}>
                    {collapsed
                        ? <MenuUnfoldOutlined onClick={() => setCollapsed(false)} style={{ fontSize: 18, cursor: "pointer" }} />
                        : <MenuFoldOutlined onClick={() => setCollapsed(true)} style={{ fontSize: 18, cursor: "pointer" }} />}
                    <Typography.Title level={5} style={{ margin: 0, color: token.colorTextHeading }}>
                        ระบบบันทึกการใช้งานยานพาหนะ — โรงพยาบาลสามร้อยยอด
                    </Typography.Title>
                    <span style={{ marginLeft: "auto" }}>
                        {/*  <Avatar icon={<UserOutlined />} />*/}
                    </span>
                </Header>
                <Content style={{ padding: 24 }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}