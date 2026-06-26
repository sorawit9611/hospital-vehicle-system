import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบบันทึกการใช้งานยานพาหนะ | โรงพยาบาลสามร้อยยอด",
  icons: { icon: "/icon_sry.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body suppressHydrationWarning>
        <AntdRegistry>{children}</AntdRegistry>
      </body>
    </html>
  );
}