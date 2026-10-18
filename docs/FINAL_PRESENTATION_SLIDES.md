# สไลด์นำเสนองานโครงงาน (Final Presentation Slides Deck)
**ชื่อโครงงาน:** Iko-Share — แพลตฟอร์มแชร์การเดินทางร่วมกันสู่อีเวนต์และสถานที่ท่องเที่ยว (Eco-Friendly Carpooling Platform)  
**เวอร์ชันระบบ:** 2.3.0 (Production Release)  
**สถาปัตยกรรม:** 3-Tier Architecture  
**วันที่จัดทำ:** ตุลาคม 2569  

---

## Slide 1: Cover Slide
# Iko-Share
### แพลตฟอร์มแชร์การเดินทางร่วมกันสู่อีเวนต์และสถานที่ท่องเที่ยว
**Eco-Friendly Carpooling & Smart Fair-Share Platform บนสถาปัตยกรรม 3-Tier พร้อมมาตรฐานความปลอดภัย และ PDPA Compliance**
* สถาปัตยกรรม: 3-Tier Architecture (Client - Logic - Data)
* สถานะ: Production Release 2.3.0
* ผลการทดสอบ: 165 Test Cases (Pass Rate 97.0%)

---

## Slide 2: Agenda
### หัวข้อหลักในการนำเสนองาน (Presentation Agenda)
1. **แนวคิดหรือที่มาของโครงงาน (Project Background & Problem Statement)**
2. **ภาพรวมของระบบ 3-Tier Architecture ที่ได้ออกแบบเสร็จสมบูรณ์**
3. **Functional & Non-Functional Requirements ที่ได้ออกแบบไว้**
4. **Use Case Model (Actors, Diagram & Booking State Machine)**
5. **Data Model หรือ ER Diagram (14 Relational Tables in 3NF)**
6. **Testing & Results (Test Strategy, 97.0% Pass Rate & Defect Resolution)**
7. **Conclusion (Problems Encountered & Future Development Guidelines)**

---

## Slide 3: Background & Problem Statement
### 1. สภาพปัญหาและความสำคัญ (Problem Statement)
* **ภาระค่าใช้จ่ายในการเดินทางสูง:** ราคาน้ำมันเชื้อเพลิงและค่าผ่านทางปรับตัวสูงขึ้น การขับรถยนต์คนเดียวทำให้เกิดภาระค่าใช้จ่ายต่อกิโลเมตรสูง
* **วิกฤตจราจรในงานอีเวนต์/คอนเสิร์ต:** รถยนต์หลั่งไหลเข้ามาพร้อมกัน ที่จอดรถไม่เพียงพอ การจราจรติดขัดสะสมนับชั่วโมง
* **รถรับจ้างสาธารณะขาดแคลนและโก่งราคา:** ช่วงเลิกงานอีเวนต์ มักพบการปฏิเสธผู้โดยสาร หรือ Surge Pricing สูงเกินจริง 200–300%
* **มลพิษคาร์บอนฟุตพริ้นท์ ($CO_2$):** รถยนต์ปล่อยก๊าซเรือนกระจกเฉลี่ย 120 กรัม/กม. ต่อคัน เร่งปัญหาสภาวะโลกร้อน

---

## Slide 4: Carpooling vs Ride-Hailing & Objectives
### 1. เปรียบเทียบความแตกต่าง และ 5 วัตถุประสงค์หลัก
| มิติเปรียบเทียบ | Ride-Hailing เชิงพาณิชย์ (Grab, Bolt) | Iko-Share Carpooling |
| :--- | :--- | :--- |
| **เจตนาเดินทาง** | วิ่งรถวนเพื่อหารายได้เชิงพาณิชย์ | เดินทางไปทิศทางเดียวกันอยู่แล้ว |
| **โครงสร้างราคา** | แสวงหากำไร + Surge Pricing | หารต้นทุนจริง (Fair Share Model) |
| **สถานะกฎหมาย** | ต้องจดทะเบียนรถรับจ้างสาธารณะ | แบ่งปันค่าใช้จ่ายถูกต้องตามกฎหมาย |
| **สิ่งแวดล้อม** | เพิ่มจำนวนเที่ยววิ่งบนถนน | ลดจำนวนรถ + คำนวณ $CO_2$ Offset |

**5 วัตถุประสงค์หลัก:**
1. พัฒนาเว็บแอปพลิเคชันคาร์พูลเชื่อมโยงผู้มีเส้นทางเดียวกัน
2. คำนวณราคาแนะนำที่เป็นธรรม (Fair Share) จากระยะทางจริง
3. ความปลอดภัยหลายชั้น: ยืนยันตัวตน KYC + แอดมินตรวจภาพป้ายทะเบียนรถจริง + รีวิวสองทาง
4. ปฏิบัติตามกฎหมาย PDPA 100% พร้อมหน้าขอใช้สิทธิข้อมูลส่วนบุคคล
5. ส่งเสริมการเดินทางสีเขียว (Green Travel & ESG)

---

## Slide 5: 3-Tier Architecture Overview
### 2. ภาพรวมของระบบ 3-Tier Architecture ที่ออกแบบเสร็จสมบูรณ์
* **Components + Tools + 3rd-Party Diagram (Final Aligned Version):**
  * **Client Tier:** Web Browser (Passenger, Driver, Admin) เข้าสู่ React 18 SPA (ตัด Admin Web server ออก)
  * **App Tier (UI & Runtime):** React 18, Vite, Tailwind CSS (120 FPS), Admin Dashboard, Node.js + Express.js API Gateway บน Vercel
  * **Service TIER (Core Engines):** Auth RBAC, Smart Route & Fair Price Calculator, Booking State Machine, Plate Verification & PDPA, In-Trip SSE Chat, PromptPay EMVCo QR, Reviews, Notifications, Eco $CO_2$ Engine (ตัด UI Service ออก)
  * **DATA TIER (Storage):** PostgreSQL 16 (Neon / Supabase), 14 Tables (3NF), Connection Pooler, B-Tree Indexes, Protected File Storage (Bytea), Multi-AZ Replication, Auto-Migration
  * **3rd-Party Integrations:** Google Maps Platform, PromptPay BOT EMVCo QR, Vercel Serverless, Cloud Storage, Web Share API
  * **Sidebars:** Management (Vercel + Admin), Data Governance (3NF + PDPA), Security (JWT, Bcrypt, Helmet, CORS, Rate Limit, Parameterized SQL 100%)

---

## Slide 5B: Architecture Gap Analysis (สิ่งที่เพิ่ม/แก้ไข/ลบออก)
### 2. ตารางสรุปจุดที่เพิ่ม แก้ไข และลบออกจากภาพร่างเดิมให้ตรงกับเว็บจริง
| ส่วนประกอบ | ภาพร่างเดิม (Draft Layout) | สิ่งที่แก้ไข ลบออก หรือเพิ่มให้ตรงกับระบบจริง (Final Version) |
| :--- | :--- | :--- |
| **Client Tier** | Web App, Web Browser, Admin Web server | **[❌ ลบออก]** ลบ Admin Web server (แอดมินเป็น User ผ่าน Browser ไม่ใช่ Server)<br>**[🟢 เพิ่ม]** ระบุ 3 กลุ่มผู้ใช้: Passenger, Driver, Admin |
| **App Tier** | React, Vite, Admin Dashboard, Node, Express | **[🟢 เพิ่ม]** Tailwind CSS (120 FPS GPU), In-Flight Request Deduplication, EventSource (SSE Client), Google Maps UI Component |
| **Service TIER** | Authentication, Calculation, UI Service (CAL) | **[❌ ลบออก]** ลบ UI Service ใน Backend ออก<br>**[🟢 เพิ่มครบ 10 โมดูล]** Booking State Machine, Car Plate Verify (PDPA), In-Trip SSE Chat, PromptPay QR & Slip, Mutual Review, Notifications, Eco $CO_2$ |
| **3rd-Party** | มีเพียง Google logo อย่างเดียว | **[🟢 เพิ่มให้ครบ]** Google Maps Embed & Directions, PromptPay BOT EMVCo QR, Vercel Serverless Platform, Cloud Storage, Web Share API |
| **DATA TIER** | สะกดผิดว่า `DATA storange`, Neon DB, Env | **[✏️ แก้คำผิด]** DATA Storage<br>**[🟢 เพิ่ม]** 14 ตาราง (3NF), Connection Pooler, B-Tree Indexes, Protected File Storage, Auto-Migration |
| **Sidebars** | Management, Governance, Security | **[🟢 เสริมความสมบูรณ์]** Foreign Key Cascades, PDPA Data Compliance, Parameterized SQL 100% ป้องกัน SQL Injection, RBAC Middleware |


---

## Slide 6: Tech Stack Justification
### 2. เหตุผลเชิงวิชาการในการคัดเลือกเทคโนโลยี
* **React 18 + Vite:** Virtual DOM ประสิทธิภาพสูง โหลดเร็วกว่า CRA 10 เท่า และ Code Splitting อัตโนมัติ
* **Tailwind CSS (120 FPS):** จัดสไตล์ได้ยืดหยุ่น Bundle เล็ก ขับเคลื่อนแอนิเมชันผ่าน GPU โดยตรง ไร้การ Re-render ซ้ำซ้อน
* **Node.js & Express:** Non-blocking I/O เหมาะกับ REST API และ Streaming SSE ประหยัดทรัพยากรบน Serverless
* **PostgreSQL (Supabase):** รักษาความถูกต้องของข้อมูลตามกฎ ACID เหมาะกับเที่ยวรถ การจอง และสลิปการโอนเงิน
* **Server-Sent Events (SSE):** ใช้ HTTP มาตรฐาน ทำงานร่วมกับ Serverless ได้ดีกว่า WebSocket และมี Auto-reconnect ในตัว
* **Google Maps Embed API:** รองรับสถานที่ภาษาไทยทั่วประเทศแม่นยำ 100% แก้ปัญหา Geocoding หลุดของ OpenStreetMap

---

## Slide 7: Functional Requirements
### 3. ข้อกำหนดเชิงหน้าที่ (10 ฟังก์ชันแกนหลัก)
1. **FR-01 (Auth & RBAC):** ลงทะเบียน, ล็อกอินด้วย JWT, จัดการ 4 บทบาท (Passenger, Driver, Both, Admin)
2. **FR-02 (Vehicle Plate Verification):** ลงทะเบียนรถ แนบภาพป้ายทะเบียนจริง ยินยอม PDPA ให้แอดมินอนุมัติก่อนเปิดทริป
3. **FR-03 (Trip Engine):** สร้างทริปคาร์พูล กำหนดจุดแวะรับส่ง (Waypoints), เวลา, สไตล์การขับขี่
4. **FR-04 (Smart Fair Price Calculator):** ประเมินราคาแนะนำจากระยะทางจริง (น้ำมัน 2.20 บ./กม. + สึกหรอ 1.30 บ./กม.)
5. **FR-05 (Interactive Route Map):** แผนที่ Google Maps สภาพจราจร จุดจอด พร้อมปุ่มเปิด GPS นำทาง
6. **FR-06 (Booking State Machine):** ผู้โดยสารขอจอง คนขับกดอนุมัติ/ปฏิเสธ หักและคืนที่นั่งว่างอัตโนมัติ
7. **FR-07 (PromptPay QR & Slip):** สร้าง QR Code พร้อมเพย์ EMVCo อัตโนมัติ แนบสลิป และคนขับกดยืนยันชำระเงิน
8. **FR-08 (In-Trip SSE Chat):** แชทเฉพาะสมาชิกในทริป สตรีมข้อความเรียลไทม์ผ่าน SSE พร้อม Fallback Polling 15 วิ
9. **FR-09 (Mutual Peer Review):** ให้คะแนนดาว 1–5 และความคิดเห็นประเมินเพื่อนร่วมทางหลังสิ้นสุดการเดินทาง
10. **FR-10 (PDPA & ESG Analytics):** สิทธิขอรับ/ลบข้อมูลส่วนบุคคล (Data Subject Rights), Cookie Consent และสถิติคาร์บอน $CO_2$

---

## Slide 8: Non-Functional Requirements & Performance
### 3. ข้อกำหนดเชิงคุณภาพ และวิศวกรรมความเร็ว
* **First Contentful Paint (FCP):** 0.8 วินาที (เกณฑ์มาตรฐาน < 1.8s)
* **Largest Contentful Paint (LCP):** 1.4 วินาที (เกณฑ์มาตรฐาน < 2.5s)
* **Motion Rendering:** ลื่นไหลระดับ 120 FPS ด้วย GPU Hardware Acceleration
* **Payload Compression:** บีบอัดข้อมูล API ด้วย Gzip ลดขนาดทราฟฟิกลง 75–85%
* **Security & Privacy:** รหัสผ่านแฮชด้วย Bcrypt, ป้องกัน SQL Injection 100%, Helmet CSP, Rate Limiting, และ PDPA 100%

---

## Slide 9: Use Case Model
### 4. แผนภาพ Use Case Model และบทบาทผู้ใช้งานในระบบ
* **ผู้โดยสาร (Passenger):** ค้นหาทริป, ดูแผนที่ Google Maps, ขอจองที่นั่ง, สแกน QR พร้อมเพย์, แนบสลิป, แชท, รีวิว
* **คนขับรถ (Driver):** ลงทะเบียนรถ, ยินยอม PDPA ภาพป้ายทะเบียน, สร้างทริป, อนุมัติการจอง, เช็กสลิป, รีวิว
* **ผู้ดูแลระบบ (Admin):** ตรวจสอบภาพถ่ายป้ายทะเบียนรถจริง, ตรวจเอกสาร KYC, ตรวจสอบข้อความแชทที่ถูกรายงาน, ดำเนินการตามสิทธิ PDPA

---

## Slide 10: Booking Lifecycle State Machine
### 4. วงจรสถานะการจองที่นั่ง (Booking Workflow)
* **รอการอนุมัติ (Pending):** ผู้โดยสารส่งคำขอจอง
* **จองแล้ว (Confirmed):** คนขับอนุมัติคำขอจอง ระบบหักที่นั่งว่างทันที และปลดล็อกห้องแชท
* **ปฏิเสธ (Rejected):** คนขับปฏิเสธคำขอ
* **ยกเลิกแล้ว (Cancelled):** ผู้โดยสารกดยกเลิก (ระบบคืนที่นั่งว่างอัตโนมัติ)
* **ถูกนำออกจากตี้ (Removed):** คนขับตัดชื่อออกเนื่องจากทำผิดเงื่อนไข (ระบบคืนที่นั่งว่างอัตโนมัติ)
* **การเดินทางสำเร็จ (Completed):** สิ้นสุดการเดินทาง และเปิดให้เขียนรีวิวประเมินเพื่อนร่วมทาง

---

## Slide 11: Data Model & ER Diagram
### 5. โครงสร้างฐานข้อมูลเชิงสัมพันธ์ 14 ตาราง (3NF)
* `users`: ข้อมูลสมาชิก, รหัสผ่านแฮช, สิทธิ์ Role, สถานะ KYC
* `cars`: ข้อมูลยานพาหนะ, ทะเบียนรถ (PK), ภาพถ่ายป้ายทะเบียน, สถานะการตรวจสอบ, ความยินยอม PDPA
* `trips`: ข้อมูลเที่ยวเดินทาง, ต้นทาง-ปลายทาง, เวลา, ราคาต่อที่นั่ง, จำนวนที่นั่งว่าง, สถานะทริป
* `bookings`: ข้อมูลการจอง, สถานะคำขอ, สถานะการชำระเงิน, สลิปโอนเงิน
* `chat_messages` & `chat_reports`: ข้อความแชทประจำทริป และรายงานข้อความไม่เหมาะสม
* `reviews`: คะแนนดาว 1–5 และคอมเมนต์รีวิวสองทาง
* **Database Indexing:** สร้าง B-Tree Indexes เพื่อเร่งความเร็วในการค้นหาทริป, ตรวจสอบรถ และแจ้งเตือนในระดับ Sub-millisecond

---

## Slide 12: Testing Strategy & Results
### 6. สรุปผลการทดสอบระบบและคุณภาพซอฟต์แวร์
* **ชุดทดสอบทั้งหมด:** 165 Test Cases
* **ผ่านการทดสอบ (Passed):** 160 Cases
* **อัตราความสำเร็จรวม (Pass Rate):** **97.0%** (สูงกว่าเกณฑ์มาตรฐาน 95.0%)
* **ข้อบกพร่องระดับวิกฤต (Critical/Blocker):** **0 ข้อบกพร่อง (100% แก้ไขแล้ว)**

| ประเภทการทดสอบ | ทั้งหมด | ผ่าน (Pass) | ไม่ผ่าน (Fail) | ข้าม (Skip) | Pass Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Functional Testing | 110 | 107 | 2 | 1 | 97.3% |
| Integration Testing | 30 | 30 | 0 | 0 | 100.0% |
| Security & PDPA Testing | 15 | 15 | 0 | 0 | 100.0% |
| Performance Testing | 10 | 8 | 1 | 1 | 80.0% |

---

## Slide 13: Defect Resolution Matrix
### 6. รายงานข้อบกพร่องและการแก้ไข
* **BUG-01 (Critical):** Race Condition การจองพร้อมกันจนที่นั่งติดลบ ➔ แก้ไขด้วย Atomic UPDATE SQL และ DB Row Locks
* **BUG-02 (High):** รูปป้ายทะเบียนรถเข้าถึงได้โดยตรง ➔ แก้ไขโดยย้ายเข้า Protected Storage และตรวจสิทธิ์ Admin
* **BUG-03 (Medium):** หมุด OpenStreetMap ภาษาไทยคลาดเคลื่อน ➔ เปลี่ยนมาใช้ Google Maps Embed API แทน 100%
* **BUG-04 (Low):** อาการกระตุกบนจอ 120Hz ➔ ขับเคลื่อน CSS Variables ผ่าน GPU ด้วย `requestAnimationFrame`

---

## Slide 14: Problems Encountered & Resolutions
### 7. ปัญหา อุปสรรคในการพัฒนา และแนวทางแก้ไขที่สำเร็จ
1. **ข้อจำกัด Geocoding ภาษาไทย:** OSM ปักหมุดชื่อเฉพาะภาษาไทยเพี้ยน ➔ ปรับใช้ Google Maps Embed API แสดงผลแม่นยำ 100%
2. **Serverless กับ Real-time Chat:** ไม่รองรับ WebSocket แบบค้าง State ➔ ประยุกต์ใช้ Server-Sent Events (SSE) + Fallback Polling 15 วิ
3. **ความปลอดภัยป้ายทะเบียนและ PDPA:** เสี่ยงละเมิดข้อมูลส่วนบุคคล ➔ สร้างระบบ Verify ป้ายทะเบียน + Vehicle PDPA Consent Modal
4. **In-Flight API Request Spams:** กดย้ำส่งคำขอซ้ำซ้อน ➔ สร้างระบบ Request Deduplication & Promise Sharing

---

## Slide 15: Future Development Guidelines
### 7. ทิศทางการพัฒนาต่อยอดในอนาคต (Future Work)
1. **Automated Escrow Payment Gateway:** เชื่อมต่อ Omise/2C2P พักเงินในระบบกลาง และตัดจ่ายให้คนขับเมื่อสิ้นสุดทริปอัตโนมัติ
2. **Live GPS Driver Tracking:** ผู้โดยสารติดตามตำแหน่งรถของคนขับแบบ Real-Time บนแผนที่ในวันเดินทาง
3. **AI License Plate OCR:** ใช้ Machine Learning ตรวจจับและอ่านตัวอักษรป้ายทะเบียนอัตโนมัติก่อนส่งให้แอดมิน
4. **Mobile PWA & Push Notifications:** ติดตั้งบนหน้าจอมือถือได้เสมือนแอป Native พร้อมพุชแจ้งเตือนผ่านหน้าจอล็อก

---

## Slide 16: Closing & Q&A
# ขอขอบคุณคณะกรรมการและอาจารย์ที่ปรึกษา
### Iko-Share พร้อมสำหรับการสาธิตระบบและตอบข้อซักถามครับ
* 🌐 Live Production: Iko-Share (Vercel + Supabase)
* 🌱 ESG & Green Travel Carpooling
* 🛡️ PDPA Compliance 100%
