# 🦷 Warong Dental Scheduler — ระบบนัดหมายคนไข้

ระบบนัดหมายทันตกรรมออนไลน์ สร้างด้วย React + Firebase + Netlify

---

## ✅ Features

- 📅 ตารางนัดรายวัน พร้อมแทรกคิว Walk-in
- 🔄 สถานะคนไข้ real-time: รอวัด BP → วัดเสร็จ → เข้าห้อง → เสร็จ
- 🔔 เสียงแจ้งเตือนทุกครั้งที่สถานะเปลี่ยน
- 📸 AI อ่าน screenshot จาก FD 9net อัตโนมัติ
- 🔍 ค้นหาคนไข้จาก HN / ชื่อ / นามสกุล / เบอร์โทร
- 👨‍⚕️ เลือกทันตแพทย์ + ห้องฟัน
- 📋 หมอบันทึกงานครั้งถัดไป → เคาท์เตอร์นัดต่อ
- 🔁 Recall อัตโนมัติ 3/6/12 เดือน
- ⚙️ Admin จัดการ: ทันตแพทย์, ห้อง, รายการงาน, ผู้ใช้

---

## 🚀 ขั้นตอน Deploy

### 1. สร้าง Firebase Project

1. ไปที่ https://console.firebase.google.com
2. กด **Add project** → ตั้งชื่อ เช่น `warong-dental-scheduler`
3. ปิด Google Analytics (ไม่จำเป็น) → Create project

### 2. เปิดใช้ Authentication

1. ใน Firebase Console → **Authentication** → Get started
2. เลือก **Email/Password** → Enable → Save

### 3. สร้าง Firestore Database

1. Firebase Console → **Firestore Database** → Create database
2. เลือก **Start in test mode** (แก้ rules ทีหลัง)
3. เลือก Region: **asia-southeast1** (Singapore)

### 4. อัปโหลด Firestore Rules

1. Firebase Console → Firestore → **Rules** tab
2. Copy เนื้อหาจาก `firestore.rules` แล้ว Paste → Publish

### 5. สร้าง Admin User คนแรก

1. Firebase Console → Authentication → **Add user**
2. กรอกอีเมลและรหัสผ่านสำหรับ Admin
3. Copy **User UID** ที่ได้
4. ไปที่ Firestore → **users** collection → Add document
   - Document ID = UID ที่ copy มา
   - Fields:
     - `name` (string): ชื่อ Admin
     - `email` (string): อีเมล
     - `role` (string): `admin`

### 6. เอา Firebase Config

1. Firebase Console → Project Settings (⚙️) → **Your apps**
2. กด **Web** icon → Register app → ชื่อ `dental-scheduler`
3. Copy config ที่ได้

### 7. ตั้งค่า .env

```bash
cp .env.example .env
```

แก้ไข `.env` ใส่ค่าจาก Firebase config:

```
REACT_APP_FIREBASE_API_KEY=AIza...
REACT_APP_FIREBASE_AUTH_DOMAIN=warong-dental.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=warong-dental-scheduler
REACT_APP_FIREBASE_STORAGE_BUCKET=warong-dental.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123:web:abc
```

### 8. Deploy บน Netlify

#### วิธีที่ 1: ผ่าน GitHub (แนะนำ)

```bash
# Push โค้ดขึ้น GitHub ก่อน
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR/dental-scheduler.git
git push -u origin main
```

จากนั้น:
1. ไปที่ https://app.netlify.com → **Add new site** → Import from Git
2. เลือก repo → Branch: `main`
3. Build command: `npm run build`
4. Publish directory: `build`
5. **Environment variables** → เพิ่มทุก `REACT_APP_*` จาก `.env`
6. Deploy!

#### วิธีที่ 2: Drag & Drop

```bash
npm install
npm run build
```

ลาก folder `build/` ไปวางที่ https://app.netlify.com/drop

---

## 👥 Roles

| Role | สิทธิ์ |
|------|--------|
| `admin` | ทุกอย่าง + ตั้งค่าระบบ |
| `counter` | นัดหมาย, ค้นหาคนไข้, อัปเดตสถานะ |
| `room` | ดูตาราง, อัปเดตสถานะ, บันทึกผลการรักษา |

---

## 📸 การใช้งาน Screenshot AI

1. ไปที่ https://console.anthropic.com → API Keys → Create key
2. Copy key (ขึ้นต้นด้วย `sk-ant-`)
3. ในระบบ → เพิ่มคนไข้ → แท็บ Screenshot
4. วาง API Key (บันทึกไว้ในเบราว์เซอร์ครั้งเดียว)
5. อัปโหลด screenshot จาก FD 9net → กด **AI อ่านข้อมูล**
6. ตรวจสอบและกดยืนยัน

---

## 🔧 โครงสร้างโปรเจกต์

```
src/
├── firebase/
│   ├── config.js          # Firebase init
│   └── firestore.js       # DB functions
├── contexts/
│   └── AuthContext.js     # Login state
├── pages/
│   ├── LoginPage.js       # หน้า login
│   ├── SchedulerPage.js   # ตารางนัดหลัก
│   └── SettingsPage.js    # ตั้งค่า (admin)
├── components/
│   ├── AppointmentCard.js # การ์ดคนไข้ + สถานะ
│   ├── AppointmentModal.js # ฟอร์มนัดหมาย
│   ├── NextVisitModal.js  # บันทึกผลการรักษา
│   └── PatientModal.js    # ค้นหา/เพิ่มคนไข้
└── utils/
    └── defaults.js        # ข้อมูลเริ่มต้น + เสียง
```
