// ระบบ session แบบรหัสผ่านเดียว (เครื่องมือภายใน) — เซ็นด้วย HMAC-SHA256
// ใช้ Web Crypto API จึงทำงานได้ทั้งใน proxy (edge) และ route handler (node)

export const SESSION_COOKIE = "session";
const SESSION_TTL_SEC = 60 * 60 * 12; // 12 ชั่วโมง

const encoder = new TextEncoder();

function toHex(buf: ArrayBuffer): string {
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

async function hmacKey(secret: string): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
}

/** สร้าง token รูปแบบ `<exp>.<hmac>` (exp = เวลาหมดอายุเป็น ms) */
export async function createSessionToken(): Promise<string> {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET is not set");
    const payload = String(Date.now() + SESSION_TTL_SEC * 1000);
    const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload));
    return `${payload}.${toHex(sig)}`;
}

/** ตรวจ token: ลายเซ็นถูกต้องและยังไม่หมดอายุ */
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
    const secret = process.env.AUTH_SECRET;
    if (!token || !secret) return false;

    const [payload, sig] = token.split(".");
    if (!payload || !sig) return false;

    const exp = Number(payload);
    if (!Number.isFinite(exp) || Date.now() > exp) return false;

    const expected = toHex(await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(payload)));
    if (expected.length !== sig.length) return false;

    // เทียบแบบ constant-time
    let diff = 0;
    for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
    return diff === 0;
}

export const SESSION_MAX_AGE = SESSION_TTL_SEC;
