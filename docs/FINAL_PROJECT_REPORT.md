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

ระบบได้รับการออกแบบโครงสร้างสถาปัตยกรรมแบบ **3-Tier Architecture (Components + Tools + 3rd-Party)** โดยปรับปรุงจากโครงร่างเดิมให้ตรงกับฟังก์ชันการทำงานจริงบนเว็บ Iko-Share 100%:

### ตารางแจกแจงจุดที่เพิ่ม แก้ไข และลบออกจากโครงร่างเดิม (Architecture Alignment Matrix)
| ส่วนประกอบ (Component) | สิ่งที่อยู่ในภาพร่างเดิม (Original Draft) | สิ่งที่ปรับปรุง เพิ่มเติม หรือลบออกให้ตรงกับเว็บจริง (Final Version) |
| :--- | :--- | :--- |
| **1. ระดับ Client (Client Tier)** | มี `Web Application`, `Web Browser`, และ `Admin Web server` | **[❌ ลบออก / แก้ไข]** ลบ `Admin Web server` ออก เพราะ Web Server อยู่ใน Backend ส่วน Admin เป็นผู้ใช้ที่เปิดผ่าน Web Browser เหมือนกัน พร้อมระบุ 3 กลุ่มผู้ใช้งาน (Passenger, Driver, Admin) |
| **2. ส่วน App Tier (UI & Runtime)** | มี React, Vite, Admin Dashboard, Node.js, Express.js | **[➕ เพิ่มตามเว็บจริง]** เพิ่ม **Tailwind CSS (120 FPS GPU Motion)**, **In-Flight Request Deduplication**, **EventSource (SSE Client)** สำหรับ Real-time Chat และ **Interactive Google Maps Component** |
| **3. ส่วน Service TIER (API / Logic)** | มีเฉพาะ `Authentication`, `Calculation`, `UI Service` (หรือ CAL) | **[❌ ลบออก]** ลบ `UI Service` ใน Backend ออก<br>**[➕ เพิ่มครบ 10 โมดูล]** เพิ่ม **Booking State Machine**, **Car Plate Verification (PDPA)**, **In-Trip SSE Chat Hub**, **PromptPay QR & Slip Verification**, **Mutual Review**, **In-App Notifications**, และ **Eco $CO_2$ Offset Engine** |
| **4. บริการภายนอก (3rd-Party)** | มีเพียงโลโก้ **Google** | **[➕ เพิ่มตามเว็บจริง]** ระบุเป็น **Google Maps Embed & Directions API** และเพิ่ม **PromptPay BOT EMVCo Standard**, **Vercel Serverless Platform**, **Cloud Storage (S3)**, และ **Web Share API** |
| **5. ส่วน DATA TIER (Storage)** | สะกดผิดว่า `DATA storange`, Neon DB, Environment Variables | **[✏️ แก้คำผิด]** แก้ไขเป็น **DATA Storage**<br>**[➕ เพิ่มตามเว็บจริง]** เพิ่ม **14 Relational Tables (3NF Schema)**, **Connection Pooler (pg.Pool)**, **B-Tree Indexes**, **Protected File Storage (uploaded_images Bytea)**, และ **Auto-Migration Engine** |
| **6. แถบข้าง (Management & Governance)** | Management (Vercel), Data Governance (Schema), Security (JWT, Bcrypt, Helmet, CORS, Rate Limit) | **[➕ เสริมความสมบูรณ์]** เพิ่ม **Foreign Key Cascades**, **PDPA Data Compliance & Encryption**, **Parameterized SQL 100%** ป้องกัน SQL Injection และ **Role-Based Access Control (RBAC Middleware)** |

```mermaid
flowchart TD
    subgraph ClientTier ["Client Tier (Web Browser: Desktop & Mobile)"]
        Users["Actors: Passenger | Driver | Admin"]
        UI["React 18 SPA + Vite"]
        Tailwind["Tailwind CSS + 120 FPS Motion Layer"]
        Dedupe["In-flight API Request Deduplication"]
        MapClient["Interactive Google Maps & Timeline"]
        SSEClient["Browser EventSource (SSE Client)"]
        Users --> UI
    end

    subgraph ThirdParty ["3rd-Party Services & Cloud Platform"]
        GMaps["Google Maps Embed & Directions API"]
        PromptPay["PromptPay BOT EMVCo Thai QR Payment"]
        VercelEdge["Vercel Cloud (Edge CDN & Serverless)"]
        S3Storage["Supabase / Cloudinary Cloud Object Storage"]
        WebShare["Web Share API (LINE, Facebook, X)"]
    end

    subgraph AppTier ["App Tier & Runtime (Node.js & Express.js)"]
        Gateway["api/index.js (Vercel Serverless Gateway)"]
        Compression["HTTP Compression (Gzip / Deflate 75-85%)"]
        SecurityMW["Security: Helmet CSP + Rate Limiter + CORS"]
        AuthMW["JWT Stateless Auth + Role RBAC Middleware"]
    end

    subgraph ServiceTier ["Service TIER (Core Business Engines & APIs)"]
        AuthSvc["1. Authentication & Role RBAC"]
        RouteSvc["2. Smart Route & Fair Price Calculator"]
        BookingSvc["3. Booking Lifecycle State Machine"]
        CarSvc["4. Car Plate Verification & PDPA Consent"]
        ChatSvc["5. In-Trip SSE Real-time Messaging Hub"]
        PaySvc["6. PromptPay QR & Slip Verification"]
        ReviewSvc["7. Mutual Peer Review Engine"]
        PDPASvc["8. PDPA Rights & Data Export Service"]
        NotifSvc["9. In-App Notification Dispatcher"]
        EcoSvc["10. Eco Impact ($CO2 Offset & Trees Saved)"]
    end

    subgraph DataTier ["DATA TIER (Storage & Persistence)"]
        PostgresDB[("Managed PostgreSQL 16 (Neon / Supabase)")]
        Tables["14 Relational Tables (3NF Schema)"]
        ConnPool["Database Connection Pooling (pg.Pool)"]
        BTreeIdx["B-Tree Indexes Optimization"]
        FileTable["Protected File Storage (uploaded_images Bytea)"]
        Replication["Automated Multi-AZ Replication (Managed)"]
        Backup["Point-in-Time Recovery & Auto-Migration Engine"]
    end

    UI --> Dedupe --> Gateway --> Compression --> SecurityMW --> AuthMW
    AuthMW --> ServiceTier
    ServiceTier --> ConnPool --> PostgresDB
    PostgresDB --- Tables --- BTreeIdx --- FileTable
    ServiceTier <--> ThirdParty
    ChatSvc -.-> SSEClient
```

### รายละเอียดเทคโนโลยีในแต่ละ Tier:
1. **Presentation Tier (Client):** React 18, Vite, Tailwind CSS, React Router DOM v6, Axios พร้อม Request Deduplication, Lucide React และ SSE Client
2. **Application Tier (Logic):** Node.js, Express.js บน Vercel Serverless Functions, Helmet, CORS, express-rate-limit, jsonwebtoken, bcryptjs, multer, compression (บีบอัด Gzip 70-85%)
3. **Data Tier (Storage):** PostgreSQL 16 บน Supabase/Neon Cloud, pg.Pool Connection Manager, 14 Tables (3NF), B-Tree Indexes และ Protected Object/Bytea Storage

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
