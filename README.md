# ระบบบันทึกการใช้งานยานพาหนะ — โรงพยาบาลสามร้อยยอด

ระบบจัดการและบันทึกการใช้งานยานพาหนะของโรงพยาบาล รองรับการเช็คเอาท์/เช็คอินรถผ่าน QR Code,
จัดการข้อมูลรถและพนักงานขับรถ, ดูบันทึกการใช้งาน และออกรายงานเป็น Excel

## คุณสมบัติหลัก

- 📱 **สแกน QR เช็คเอาท์/เช็คอินรถ** — คนขับสแกน QR ที่ติดบนรถ บันทึกการออก/กลับ + เลขไมล์ได้ทันที (ไม่ต้องล็อกอิน)
- 🚗 **จัดการยานพาหนะ** — เพิ่ม/แก้/ปิดใช้งานรถ, สร้าง QR Code, ระบุผู้รับผิดชอบ
- 👤 **จัดการพนักงานขับรถ**
- 📋 **บันทึกการใช้งาน** — ดู/กรอง/ลบ ประวัติการใช้รถทั้งหมด
- 📊 **รายงาน + Export Excel** — สรุประยะทาง จำนวนทริป พร้อมดาวน์โหลด
- 🔒 **ระบบล็อกอินผู้ดูแล** — ป้องกันส่วน `/admin` ด้วยรหัสผ่าน

## เทคโนโลยี

| ส่วน | เทคโนโลยี |
|------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| ภาษา | TypeScript |
| UI | Ant Design v6 |
| ฐานข้อมูล | PostgreSQL + Drizzle ORM |
| Auth | Session cookie (HMAC-signed) ผ่าน Next.js Proxy |

---

## ความต้องการของระบบ

- **Node.js 20 ขึ้นไป**
- **PostgreSQL 14 ขึ้นไป** (เข้าถึงได้จากเครื่องที่รันแอป)

---

## การติดตั้ง (Development)

```bash
# 1. โคลนโปรเจกต์
git clone https://github.com/sorawit9611/hospital-vehicle-system.git
cd hospital-vehicle-system

# 2. ติดตั้ง dependencies
npm install

# 3. ตั้งค่า environment
cp .env.example .env
# จากนั้นแก้ค่าในไฟล์ .env (ดูตารางด้านล่าง)

# 4. สร้างตารางในฐานข้อมูล (รันครั้งแรกครั้งเดียว)
npm run db:migrate

# 5. รัน development server
npm run dev
# เปิด http://localhost:3000
```

---

## Environment Variables

แก้ในไฟล์ `.env` (ห้าม commit ขึ้น git — มี `.gitignore` กันไว้แล้ว)

| ตัวแปร | จำเป็น | คำอธิบาย |
|--------|:---:|----------|
| `DATABASE_URL` | ✅ | connection string ของ PostgreSQL เช่น `postgresql://user:pass@host:5432/hospital_vehicles` |
| `NEXT_PUBLIC_BASE_URL` | ✅ | URL ของแอปที่ใช้สร้าง QR Code ⚠️ **production ต้องเป็น IP/โดเมนจริง** ที่มือถือเข้าถึงได้ เช่น `http://192.168.101.240:3000` |
| `ADMIN_PASSWORD` | ✅ | รหัสผ่านสำหรับเข้าหน้า `/admin` |
| `AUTH_SECRET` | ✅ | คีย์ลับสำหรับเซ็น session — สุ่มด้วย `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

> ⚠️ **สำคัญ:** ทุกครั้งที่แก้ `NEXT_PUBLIC_BASE_URL` หรือ `AUTH_SECRET` ต้อง `npm run build` ใหม่
> เพราะค่าเหล่านี้ถูกฝังตอน build (proxy อ่าน `AUTH_SECRET` ตอน build, QR ใช้ `BASE_URL` ตอน build)

---

## คำสั่งฐานข้อมูล (Drizzle)

| คำสั่ง | ใช้ทำอะไร |
|--------|-----------|
| `npm run db:migrate` | รัน migration ที่มีอยู่ลงฐานข้อมูล (ใช้ตอนติดตั้งครั้งแรก / อัปเดต schema) |
| `npm run db:generate` | สร้างไฟล์ migration ใหม่ หลังแก้ schema ที่ `src/db/schema/index.ts` |
| `npm run db:push` | ดัน schema ลง DB ตรง ๆ (เหมาะกับ dev เท่านั้น) |
| `npm run db:studio` | เปิด Drizzle Studio ดู/แก้ข้อมูลผ่านเบราว์เซอร์ |

---

## การ Deploy ขึ้น Production

```bash
# 1. ดึงโค้ดล่าสุด + ติดตั้ง
git pull
npm install

# 2. ตั้งค่า .env ให้ครบ (โดยเฉพาะ NEXT_PUBLIC_BASE_URL = ที่อยู่จริง)

# 3. migrate ฐานข้อมูล (ถ้ายังไม่ได้ทำ หรือมี schema ใหม่)
npm run db:migrate

# 4. build
npm run build

# 5. รัน
npm start   # รันที่ port 3000
```

### ให้รันต่อเนื่อง (ไม่ดับเมื่อปิด terminal) ด้วย PM2

แนะนำใช้ [PM2](https://pm2.keymetrics.io/) เพื่อให้แอปรันตลอดและรีสตาร์ทอัตโนมัติ

```bash
npm install -g pm2

# รันแอป
pm2 start npm --name hospital-vehicle -- start

pm2 save              # บันทึกรายการ process
pm2 startup           # ตั้งให้รันอัตโนมัติเมื่อเปิดเครื่อง (ทำตามคำสั่งที่มันแนะนำ)

# คำสั่งที่ใช้บ่อย
pm2 logs hospital-vehicle    # ดู log
pm2 restart hospital-vehicle # รีสตาร์ท (หลัง build ใหม่)
pm2 stop hospital-vehicle    # หยุด
```

> หลังแก้โค้ดหรือ `.env` แล้ว build ใหม่ ต้อง `pm2 restart hospital-vehicle` ทุกครั้ง

---

## ระบบล็อกอิน (สรุปการทำงาน)

- **หน้า `/admin/*`** และ **API ฝั่งผู้ดูแล** ต้องล็อกอินก่อน (รหัสจาก `ADMIN_PASSWORD`)
- **หน้าสแกน QR `/vehicle/[id]`** และ API ที่เกี่ยวข้อง (`POST /api/logs`, `PUT /api/logs/[id]`,
  `GET /api/vehicles/[id]`, `GET /api/drivers`) **เปิดสาธารณะ** — คนขับใช้งานได้โดยไม่ต้องล็อกอิน
- session อายุ 12 ชั่วโมง, ออกจากระบบได้ที่ปุ่มมุมขวาบนของหน้า admin

---

## โครงสร้างโปรเจกต์

```
src/
├── app/
│   ├── admin/          # หน้าผู้ดูแล (dashboard, รถ, พนักงาน, บันทึก, รายงาน)
│   ├── api/            # API routes (vehicles, drivers, logs, export, auth)
│   ├── login/          # หน้าเข้าสู่ระบบ
│   ├── vehicle/[id]/   # หน้าสแกน QR เช็คเอาท์/เช็คอิน (สาธารณะ)
│   └── layout.tsx
├── components/         # VehicleCard (บัตร QR)
├── db/                 # การเชื่อมต่อ + schema (Drizzle)
├── lib/                # auth, utils, constants, types
└── proxy.ts            # middleware ป้องกัน route (Next 16)
```

---

## Troubleshooting

| อาการ | สาเหตุ / วิธีแก้ |
|-------|-----------------|
| ใส่รหัสแล้วไม่เข้า `/admin` | เช็ค `/api/auth/login` ใน DevTools → ถ้า 401 = รหัสไม่ตรง `ADMIN_PASSWORD` / ถ้าไม่มี cookie `session` = ปัญหา cookie |
| login ผ่านแต่เด้งกลับเรื่อย ๆ | แก้ `.env` (`AUTH_SECRET`) หลัง build → ต้อง `npm run build` + รีสตาร์ทใหม่ |
| QR สแกนแล้วเปิดไม่ได้ / ชี้ localhost | `NEXT_PUBLIC_BASE_URL` ยังเป็น localhost → เปลี่ยนเป็น IP/โดเมนจริง แล้ว build ใหม่ |
| `db:migrate` error เรื่อง connection | ตรวจ `DATABASE_URL` และว่า PostgreSQL เข้าถึงได้จากเครื่องนี้ |
