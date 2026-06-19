import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const expected = process.env.ADMIN_PASSWORD;
        if (!expected) {
            return NextResponse.json({ error: "ระบบยังไม่ได้ตั้งรหัสผ่าน (ADMIN_PASSWORD)" }, { status: 500 });
        }

        const { password } = await req.json();
        if (typeof password !== "string" || password !== expected) {
            return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง" }, { status: 401 });
        }

        // ตั้ง secure ตามโปรโตคอลจริง — ถ้าบังคับ secure บน HTTP เบราว์เซอร์จะไม่เก็บ cookie
        const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
        const isHttps = proto === "https";

        const token = await createSessionToken();
        (await cookies()).set(SESSION_COOKIE, token, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: isHttps,
            maxAge: SESSION_MAX_AGE,
        });

        return NextResponse.json({ ok: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
