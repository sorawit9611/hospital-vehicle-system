import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

// API ที่หน้าสแกน QR (สาธารณะ) ต้องเรียกได้โดยไม่ต้อง login
function isPublicApi(method: string, path: string): boolean {
    if (path.startsWith("/api/auth")) return true;                       // login/logout
    if (method === "POST" && path === "/api/logs") return true;          // บันทึกออกเดินทาง
    if (method === "PUT" && /^\/api\/logs\/[^/]+$/.test(path)) return true; // บันทึกกลับมาถึง
    if (method === "GET" && /^\/api\/vehicles\/[^/]+$/.test(path)) return true; // ข้อมูลรถ + log
    if (method === "GET" && path === "/api/drivers") return true;        // dropdown พนักงานขับ
    return false;
}

export async function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const authed = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

    // ── ส่วนผู้ดูแลระบบ (หน้าเว็บ) ──
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        if (authed) return NextResponse.next();
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
    }

    // ── API ──
    if (pathname.startsWith("/api/")) {
        if (isPublicApi(req.method, pathname)) return NextResponse.next();
        if (authed) return NextResponse.next();
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // เข้า /login ทั้งที่ login อยู่แล้ว → ไปหน้า admin
    if (pathname === "/login" && authed) {
        const url = req.nextUrl.clone();
        url.pathname = "/admin";
        url.search = "";
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    // ทำงานทุก path ยกเว้นไฟล์ static / รูป
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
