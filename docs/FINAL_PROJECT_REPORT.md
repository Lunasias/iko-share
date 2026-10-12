# รายงานโครงงานฉบับสมบูรณ์ (Final Project Report)
**ชื่อโครงงาน:** Iko-Share — แพลตฟอร์มแชร์การเดินทางร่วมกันสู่อีเวนต์และสถานที่ท่องเที่ยว (Eco-Friendly Carpooling Platform)  
**เวอร์ชันระบบ:** 2.3.0 (Production Release)  
**สถาปัตยกรรม:** 3-Tier Architecture (Client - Logic - Data)  
**วันที่จัดทำ:** ตุลาคม 2569  

---

## สารบัญ (Table of Contents)
1. [แนวคิดหรือที่มาของโครงงาน (Project Background & Rationale)](#1-แนวคิดหรือที่มาของโครงงาน)
2. [ภาพรวมของระบบ 3-Tier Architecture ที่ได้ออกแบบเสร็จสมบูรณ์](#2-ภาพรวมของระบบ-3-tier-architecture-ที่ได้ออกแบบเสร็จสมบูรณ์)
3. [Functional & Non-Functional Requirements ที่ได้ออกแบบไว้](#3-functional--non-functional-requirements-ที่ได้ออกแบบไว้)
4. [Use Case Model (Actors, Diagram & Specifications)](#4-use-case-model)
5. [Data Model และ ER Diagram (Database Schema 3NF)](#5-data-model-และ-er-diagram)
6. [Testing & Results (การทดสอบระบบและผลลัพธ์)](#6-testing--results)
7. [Conclusion (ปัญหา อุปสรรค และแนวทางการพัฒนาต่อยอด)](#7-conclusion)

---

## 1. แนวคิดหรือที่มาของโครงงาน

### 1.1 สภาพปัญหาและความสำคัญ (Problem Statement)
การเดินทางไปยังงานกิจกรรมขนาดใหญ่ (Event) เช่น คอนเสิร์ต เทศกาลดนตรี งานรับปริญญา มหกรรมกีฬา ตลอดจนการท่องเที่ยวข้ามจังหวัด ประสบปัญหาสำคัญ 4 ประการ:
1. **ภาระค่าใช้จ่ายในการเดินทางสูง:** ราคาน้ำมันเชื้อเพลิงและค่าผ่านทางปรับตัวสูงขึ้นอย่างต่อเนื่อง การขับรถยนต์ส่วนบุคคลคนเดียวทำให้เกิดต้นทุนเฉลี่ยต่อคนต่อกิโลเมตรสูง
2. **ปัญหาการจราจรและพื้นที่จอดรถไม่เพียงพอ:** ยานพาหนะจำนวนมากหลั่งไหลเข้าสู่สถานที่จัดงานพร้อมกัน ทำให้เกิดการจราจรติดขัดสะสมนับชั่วโมง
3. **ปัญหารถสาธารณะขาดแคลนและการโก่งราคา:** ช่วงเลิกงานอีเวนต์ ผู้โดยสารมักเผชิญกับการปฏิเสธผู้โดยสาร หรือราคาที่พุ่งสูงผิดปกติ (Surge Pricing 200–300%) ของรถรับจ้างสาธารณะ
4. **มลพิษและก๊าซเรือนกระจก ($CO_2$):** การใช้รถยนต์แยกคันปล่อยก๊าซคาร์บอนไดออกไซด์เฉลี่ย 120 กรัม/กิโลเมตร ต่อคัน ซ้ำเติมวิกฤตสภาวะโลกร้อน

### 1.2 นิยามและความแตกต่างระหว่าง Carpooling กับ Ride-Hailing
Iko-Share ถูกออกแบบให้เป็น **True Carpooling Platform (ระบบแบ่งปันการเดินทางตามต้นทุนจริง)** ซึ่งแตกต่างจาก Ride-Hailing เชิงพาณิชย์ (Grab, Bolt):
* **เจตนา:** คนขับมีแผนจะเดินทางไปยังปลายทางนั้นอยู่แล้ว ไม่ได้วิ่งวนหาลูกค้า
* **ราคา:** ใช้โมเดล **Fair Share Pricing** คิดตามค่าน้ำมันและค่าสึกหรอจริง ไม่คิดค่าบริการแสวงหากำไรและไม่มี Surge Pricing
* **กฎหมาย:** ถูกต้องตามหลักการแบ่งเบาภาระค่าใช้จ่าย (Cost-sharing) มิใช่รถรับจ้างสาธารณะ
* **สิ่งแวดล้อม:** ช่วยลดจำนวนรถยนต์บนถนนโดยตรง และแสดงสถิติการลดคาร์บอนฟุตพริ้นท์

### 1.3 วัตถุประสงค์ของโครงงาน (Objectives)
1. พัฒนาระบบคาร์พูลเว็บแอปพลิเคชัน (Carpooling Web App) เชื่อมโยงผู้มีเส้นทางเดียวกัน
2. คำนวณราคาแนะนำที่เป็นธรรม (Fair Share Model) อิงระยะทาง ค่าน้ำมัน และค่าสึกหรอ
3. สร้างความปลอดภัยหลายชั้น (Multi-layer Safety): ยืนยันตัวตน (KYC), ตรวจสอบป้ายทะเบียนรถจริง, และระบบประเมินสองทาง (Mutual Peer Review)
4. สอดคล้องกับกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA 100%): ระบบยินยอมภาพถ่ายรถยนต์, คุกกี้ และหน้าจัดการสิทธิข้อมูลส่วนบุคคล
5. ส่งเสริมการเดินทางสีเขียว (Green Travel & ESG): คำนวณ $CO_2$ ที่ลดได้และเทียบเคียงจำนวนต้นไม้

---

## 2. ภาพรวมของระบบ 3-Tier Architecture ที่ได้ออกแบบเสร็จสมบูรณ์

ระบบแบ่งการทำงานออกเป็น 3 ระดับ (Three-Tier Architecture) ชัดเจน:

```mermaid
flowchart TD
    subgraph ClientTier ["1. Presentation Tier (Client Layer)"]
        UI["React 18 Single Page Application (Vite)"]
        Tailwind["Tailwind CSS (Morning Forest Theme)"]
        GPU["Hardware GPU Acceleration (120 FPS Motion)"]
        Dedupe["In-flight API Request Deduplication"]
        MapClient["Interactive Google Maps & Timeline"]
        SSEClient["EventSource Real-time SSE Client"]
    end

    subgraph AppTier ["2. Application Tier (Logic & Gateway Layer)"]
        VercelGateway["Vercel Serverless Gateway (api/index.js)"]
        ExpressServer["Node.js + Express.js Engine"]
        Security["Security: Helmet CSP + Rate Limit + CORS"]
        AuthRBAC["JWT Stateless Auth + Role-Based Access Control"]
        
        subgraph LogicServices ["Core Business Engines"]
            RouteEngine["Smart Hybrid Route & Fair Price Engine"]
            BookingSM["Booking Lifecycle State Machine"]
            ChatSSEHub["SSE Real-time Messaging Manager"]
            CarPlateVerify["Car Registration & Plate Verification"]
            PDPAService["PDPA Rights & Consent Manager"]
            NotifEngine["In-App Notification Dispatcher"]
        end
    end

    subgraph DataTier ["3. Data Tier (Persistence & Storage Layer)"]
        PostgresDB[("Supabase PostgreSQL 16 (14 Tables in 3NF)")]
        ConnectionPool["Database Connection Pooling (pg.Pool)"]
        BTreeIndex["B-Tree Indexes Optimization"]
        CloudStorage["Supabase S3-Compatible Cloud Storage"]
    end

    UI --> Dedupe --> VercelGateway --> ExpressServer
    ExpressServer --> Security --> AuthRBAC --> LogicServices
    LogicServices --> ConnectionPool --> PostgresDB
    LogicServices -.-> CloudStorage
    ChatSSEHub -.-> SSEClient
```

### รายละเอียดเทคโนโลยีในแต่ละ Tier:
1. **Presentation Tier (Client):** React 18, Vite, Tailwind CSS, React Router DOM v6, Axios พร้อม Request Deduplication, Lucide React และ SSE Client
2. **Application Tier (Logic):** Node.js, Express.js บน Vercel Serverless Functions, Helmet, CORS, express-rate-limit, jsonwebtoken, bcryptjs, multer, compression (บีบอัด Gzip 70-85%)
3. **Data Tier (Storage):** PostgreSQL 16 บน Supabase Cloud, pg.Pool Connection Manager, 14 Tables (3NF), B-Tree Indexes และ Supabase S3 Object Storage

---

## 3. Functional & Non-Functional Requirements ที่ได้ออกแบบไว้

### 3.1 Functional Requirements (10 ฟังก์ชันแกนหลัก)
* **FR-01 (Auth & RBAC):** สมัครสมาชิก, ยืนยันตัวตน, ล็อกอินด้วย JWT, แยก 4 บทบาท (Passenger, Driver, Both, Admin)
* **FR-02 (Vehicle Plate Verification):** คนขับลงทะเบียนรถ แนบภาพป้ายทะเบียนจริง และกดยินยอมข้อตกลง PDPA ให้แอดมินอนุมัติก่อนเปิดทริป
* **FR-03 (Trip Management):** สร้างทริป, ค้นหาทริปตามอีเวนต์/จุดหมาย, ระบุจุดแวะรับส่ง (Waypoints), จำนวนที่นั่ง, สไตล์การขับขี่
* **FR-04 (Smart Fair Price Engine):** ประเมินระยะทางและค่าน้ำมันอัตโนมัติ (น้ำมัน 2.20 บ./กม. + สึกหรอ 1.30 บ./กม.) ปัดเศษหลักสิบ
* **FR-05 (Interactive Google Maps):** แผนที่เส้นทางจริง สภาพจราจร ไทม์ไลน์จุดจอด พร้อมปุ่มเปิด GPS นำทางบนสมาร์ตโฟน
* **FR-06 (Booking State Machine):** ผู้โดยสารส่งคำขอจอง คนขับกดอนุมัติ/ปฏิเสธ หักและคืนที่นั่งอัตโนมัติตาม State Machine
* **FR-07 (PromptPay QR & Slip):** สร้าง QR Code พร้อมเพย์มาตรฐาน BOT EMVCo ตามยอดเงิน แนบสลิป และคนขับกดยืนยันชำระเงิน
* **FR-08 (In-Trip SSE Realtime Chat):** แชทเฉพาะสมาชิกในทริป พุชข้อความด้วย Server-Sent Events พร้อม Fallback Polling 15 วินาที
* **FR-09 (Mutual Peer Review):** ให้คะแนนดาว 1–5 และความคิดเห็นประเมินพฤติกรรมทั้งสองฝ่ายหลังการเดินทางสิ้นสุด
* **FR-10 (PDPA & ESG Analytics):** สิทธิขอรับ/ลบข้อมูลส่วนบุคคล (Data Subject Rights), Cookie Consent, สถิติคาร์บอน $CO_2$ และจำนวนต้นไม้ที่ฟื้นฟู

### 3.2 Non-Functional Requirements (5 คุณสมบัติหลัก)
* **Performance:** FCP < 1.0s, LCP < 1.8s, รองรับ 120 FPS บนหน้าแรกด้วย GPU Hardware Acceleration, Gzip Payload Compression 70–85%
* **Security:** Bcrypt Password Hashing, Parameterized Queries 100% ป้องกัน SQL Injection, Helmet CSP, Rate Limiting
* **Scalability:** Serverless Gateway Auto-Scaling บน Edge CDN, Database Connection Pooling
* **Usability:** Fully Responsive (Mobile/Tablet/Desktop), ธีม Morning Forest, รองรับภาษาไทยและอังกฤษ
* **Reliability:** Self-healing DB Migration Engine, SSE Auto-reconnect

---

## 4. Use Case Model

### 4.1 Actors ในระบบ
1. **Passenger (ผู้โดยสาร):** ค้นหาทริป, ขอจองที่นั่ง, สแกน QR โอนเงิน, ส่งสลิป, แชท, รีวิว
2. **Driver (คนขับรถ):** ลงทะเบียนรถ, ยินยอม PDPA ป้ายทะเบียน, สร้างทริป, อนุมัติการจอง, เช็กสลิป, รีวิว
3. **Admin (ผู้ดูแลระบบ):** ตรวจสอบภาพป้ายทะเบียน, ตรวจเอกสาร KYC, ตรวจสอบข้อความที่ถูกรายงาน, ดำเนินการคำร้อง PDPA
4. **External Services:** Google Maps API, PromptPay EMVCo, Supabase Cloud Storage

### 4.2 วงจรสถานะการจองที่นั่ง (Booking Lifecycle State Machine)
```mermaid
stateDiagram-v2
    [*] --> รอการอนุมัติ: ผู้โดยสารส่งคำขอจอง
    รอการอนุมัติ --> จองแล้ว: คนขับอนุมัติ (หักที่นั่งว่าง)
    รอการอนุมัติ --> ปฏิเสธ: คนขับปฏิเสธ
    รอการอนุมัติ --> ยกเลิกแล้ว: ผู้โดยสารยกเลิกก่อนอนุมัติ
    จองแล้ว --> ยกเลิกแล้ว: ผู้โดยสารยกเลิก (คืนที่นั่ง)
    จองแล้ว --> ถูกนำออกจากตี้: คนขับตัดชื่อออก (คืนที่นั่ง)
    จองแล้ว --> การเดินทางสำเร็จ: จบทริป (เปิดให้รีวิว)
```

---

## 5. Data Model และ ER Diagram

ระบบออกแบบตามมาตรฐาน **Third Normal Form (3NF)** ครอบคลุม 14 ตารางหลัก:
* `users`: ข้อมูลผู้ใช้, รหัสผ่านแฮช, สิทธิ์ (Role), สถานะ KYC, อวตาร
* `cars`: ข้อมูลยานพาหนะ, เลขป้ายทะเบียน (PK), ภาพถ่ายป้ายทะเบียน, สถานะตรวจสอบ, ความยินยอม PDPA
* `trips`: ข้อมูลเที่ยวเดินทาง, ต้นทาง-ปลายทาง, เวลา, ราคาต่อที่นั่ง, ระยะทาง, จำนวนที่นั่งว่าง, สถานะทริป
* `bookings`: ข้อมูลการจอง, สถานะคำขอ, สถานะการชำระเงิน, สลิปโอนเงิน
* `chat_messages` & `chat_reports`: ข้อความแชทประจำทริป และรายงานข้อความไม่เหมาะสม
* `reviews`: คะแนนดาวและความคิดเห็นประเมินเพื่อนร่วมทาง
* `events`: ข้อมูลงานอีเวนต์/คอนเสิร์ตที่ผูกกับเที่ยวเดินทาง
* `notifications`: รายการแจ้งเตือนส่วนบุคคล
* `pdpa_requests` & `verification_requests`: คำร้องขอใช้สิทธิ PDPA และคำขอยืนยันตัวตน KYC

### Database Indexing Optimization:
สร้าง B-Tree Indexes สำหรับคีย์ที่มีความถี่ในการสืบค้นสูง ได้แก่ `idx_trips_departure_time`, `idx_trips_trip_status`, `idx_cars_user_id`, `idx_cars_verification_status`, `idx_bookings_trip_id` และ `idx_notifications_user`

---

## 6. Testing & Results (การทดสอบระบบและผลลัพธ์)

### 6.1 สรุปผลการทดสอบเชิงปริมาณ
* **จำนวนชุดทดสอบทั้งหมด:** 165 Test Cases
* **จำนวนเคสที่ผ่าน (Passed):** 160 เคส
* **อัตราความสำเร็จรวม (Pass Rate):** **97.0%** (สูงกว่าเกณฑ์มาตรฐาน 95.0%)
* **ข้อบกพร่องระดับวิกฤต (Critical / Blocker):** **0 ข้อบกพร่อง (100% แก้ไขแล้ว)**

### 6.2 ตารางสรุปผลรายหมวดหมู่
| ประเภทการทดสอบ | ทั้งหมด | ผ่าน (Pass) | ไม่ผ่าน (Fail) | ข้าม (Skip) | Pass Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Functional Testing** | 110 | 107 | 2 | 1 | 97.3% |
| **Integration Testing** | 30 | 30 | 0 | 0 | 100.0% |
| **Security & PDPA Testing** | 15 | 15 | 0 | 0 | 100.0% |
| **Performance Testing** | 10 | 8 | 1 | 1 | 80.0% |
| **รวมทั้งหมด (Total)** | **165** | **160** | **3** | **2** | **97.0%** |

### 6.3 รายการข้อบกพร่องสำคัญและการแก้ไข (Defect Resolution)
* **BUG-01 (Critical):** Race condition ขณะกดยืนยันจองพร้อมกัน ➔ แก้ไขด้วย Database Atomic Update และ Transaction Lock
* **BUG-02 (High):** รูปถ่ายป้ายทะเบียนเข้าถึงได้โดยตรง ➔ แก้ไขโดยย้ายเข้า Protected Storage และตรวจสิทธิ์ Admin
* **BUG-03 (Medium):** หมุด OpenStreetMap ภาษาไทยคลาดเคลื่อน ➔ เปลี่ยนสถาปัตยกรรมมาใช้ Google Maps Embed API
* **BUG-04 (Low):** อาการกระตุกบนจอ 120Hz ➔ ปรับแต่ง GPU Acceleration ผ่าน `requestAnimationFrame`

---

## 7. Conclusion (ปัญหา อุปสรรค และแนวทางการพัฒนาต่อยอด)

### 7.1 ปัญหาที่พบจริงและวิธีแก้ไข
1. **Geocoding ภาษาไทย:** OSM ปักหมุดชื่อเฉพาะภาษาไทยเพี้ยน ➔ แก้ไขด้วย Google Maps Embed API ครอบคลุม 100%
2. **Serverless กับ Real-time Chat:** ไม่รองรับ Persistent WebSocket ➔ แก้ไขด้วย SSE สตรีมมิ่งร่วมกับ 15s Fallback Polling
3. **ความปลอดภัยป้ายทะเบียนและ PDPA:** เสี่ยงละเมิดข้อมูลส่วนบุคคล ➔ สร้างระบบ Verify ป้ายทะเบียน + Vehicle PDPA Consent Modal
4. **In-Flight API Spams:** เบราว์เซอร์ยิงคำขอซ้ำซ้อน ➔ สร้างระบบ Promise Sharing & Request Deduplication

### 7.2 ทิศทางการพัฒนาต่อยอดในอนาคต (Future Work)
1. **Automated Escrow Payment:** ผสาน Omise / 2C2P พักเงินในระบบกลางและตัดจ่ายอัตโนมัติเมื่อสิ้นสุดทริป
2. **Live GPS Driver Tracking:** ผู้โดยสารติดตามตำแหน่งรถของคนขับแบบ Real-time บนแผนที่วันเดินทาง
3. **AI License Plate OCR:** ใช้ Computer Vision สแกนตัวเลขและหมวดจังหวัดบนป้ายทะเบียนอัตโนมัติ
4. **Mobile PWA & Web Push:** ติดตั้งบนสมาร์ตโฟนเสมือนแอป Native พร้อมพุชแจ้งเตือนผ่านหน้าจอล็อก
