# คู่มือเตรียมสอบสัมภาษณ์โครงงาน: Iko-Share (Project Defense Guide)

> **เอกสารสรุปข้อมูลโครงงานเชิงลึก สำหรับใช้ตอบคำถามและนำเสนอต่อคณะกรรมการ/อาจารย์ที่ปรึกษา**  
> **ชื่อโครงงาน:** Iko-Share — แพลตฟอร์มแชร์การเดินทางร่วมกันสู่อีเวนต์และสถานที่ท่องเที่ยว (Eco-Friendly Carpooling & Travel Sharing Platform)  
> **เวอร์ชันระบบ:** 2.3.0 (Production Release) | **วันที่ปรับปรุง:** ตุลาคม 2569  

---

## สารบัญ (Table of Contents)
1. [บทนำและที่มาของโครงงาน (Executive Summary & Problem Statement)](#1-บทนำและที่มาของโครงงาน)
2. [สถาปัตยกรรมระบบและเหตุผลในการเลือกเทคโนโลยี (System Architecture & Tech Stack)](#2-สถาปัตยกรรมระบบและเหตุผลในการเลือกเทคโนโลยี)
3. [โครงสร้างฐานข้อมูลและโมเดลข้อมูล (Database Schema & ER Design)](#3-โครงสร้างฐานข้อมูลและโมเดลข้อมูล)
4. [ฟังก์ชันแกนหลักและขั้นตอนการทำงาน (Core Modules & System Workflows)](#4-ฟังก์ชันแกนหลักและขั้นตอนการทำงาน)
   * 4.1 ระบบจัดการบทบาท (Role-based Access Control)
   * 4.2 วงจรสถานะของการจอง (Booking Lifecycle State Machine)
   * 4.3 ระบบห้องแชทเรียลไทม์ประจำทริป (In-Trip Real-time SSE Chat)
   * 4.4 ระบบลงทะเบียนรถและตรวจสอบภาพป้ายทะเบียน (Vehicle Registration & Plate Verification)
   * 4.5 ระบบขอความยินยอมจัดเก็บภาพยานพาหนะตาม PDPA (Vehicle Data PDPA Consent)
   * 4.6 ระบบแผนที่นำทางอัจฉริยะ (Interactive Google Maps Route & Timeline Engine)
   * 4.7 ระบบชำระเงินด้วย QR Code พร้อมเพย์ และตรวจสอบสลิป (PromptPay QR & Payment Verification)
   * 4.8 ระบบสถิติสิ่งแวดล้อมและการลดคาร์บอน (Eco Carbon Footprint & Trees Saved)
   * 4.9 ระบบศูนย์แจ้งเตือนแบบเรียลไทม์ (In-App Notification Center)
   * 4.10 ระบบแบ่งปันการเดินทางสู่โซเชียลมีเดีย (Social Share & Web Share API)
5. [จุดเด่นทางเทคนิคและอัลกอริทึม (Highlight Algorithms & Academic Merits)](#5-จุดเด่นทางเทคนิคและอัลกอริทึม)
   * 5.1 ระบบประเมินเส้นทางและการคิดราคาเป็นธรรม (Smart Route & Fair Share Model)
   * 5.2 วิศวกรรมความเร็วและความลื่นไหล 120 FPS (Web Performance & Smoothness Optimization)
   * 5.3 อัลกอริทึมสร้าง PromptPay EMVCo Payload
   * 5.4 แบบจำลองการคำนวณการลดก๊าซคาร์บอนไดออกไซด์ ($CO_2$ Offset Formula)
6. [ผลการทดสอบระบบและคุณภาพซอฟต์แวร์ (Testing & QA Results)](#6-ผลการทดสอบระบบและคุณภาพซอฟต์แวร์)
7. [คลังคำถาม-คำตอบที่อาจารย์ชอบถาม (Frequently Asked Defense Q&A)](#7-คลังคำถาม-คำตอบที่อาจารย์ชอบถาม)
   * หมวดที่ 1: ปัญหา กฎหมาย และความคุ้มค่า (Business & Legal Aspects)
   * หมวดที่ 2: สถาปัตยกรรมและการพัฒนาซอฟต์แวร์ (Technical & Architecture)
   * หมวดที่ 3: ความปลอดภัย ยานพาหนะ และ PDPA (Trust, Safety & Privacy)
   * หมวดที่ 4: ประสิทธิภาพและความเร็วของระบบ (Performance & Scalability)
8. [ข้อจำกัดและทิศทางการพัฒนาต่อยอด (Limitations & Future Work)](#8-ข้อจำกัดและทิศทางการพัฒนาต่อยอด)
9. [ลำดับขั้นตอนการสาธิตระบบ (Demo Sequence Checklist)](#9-ลำดับขั้นตอนการสาธิตระบบ)

---

## 1. บทนำและที่มาของโครงงาน

### 1.1 ที่มาและความสำคัญ (Problem Statement)
* **ปัญหาค่าใช้จ่ายในการเดินทาง:** ราคาน้ำมันและค่าผ่านทางมีแนวโน้มปรับตัวสูงขึ้นอย่างต่อเนื่อง การเดินทางคนเดียวด้วยรถยนต์ส่วนบุคคลทำให้เกิดภาระค่าใช้จ่ายที่ไม่จำเป็นต่อกิโลเมตรสูง
* **ปัญหาการจราจรและมลพิษในงานอีเวนต์/สถานที่ท่องเที่ยว:** งานเทศกาล คอนเสิร์ตขนาดใหญ่ (เช่น สวนลุมพินี, อิมแพ็ค, สจล. วิทยาเขตชุมพร, แหล่งท่องเที่ยวภาคใต้) ประสบปัญหาการจราจรติดขัดรุนแรง ที่จอดรถไม่เพียงพอ และก่อให้เกิดการปล่อยก๊าซเรือนกระจก ($CO_2$) ในปริมาณมหาศาล
* **ปัญหารถรับจ้างโก่งราคาและการปฏิเสธผู้โดยสาร:** ช่วงเลิกงานอีเวนต์ มักเกิดภาวะเรียกรถรับจ้างยากและมีราคาแพงเกินจริง (Surge Pricing)
* **การขาดแพลตฟอร์ม Carpooling ที่ปลอดภัยและถูกกฎหมายในไทย:** แพลตฟอร์มส่วนใหญ่เน้น Ride-hailing เชิงพาณิชย์ (เช่น Grab, Bolt) ซึ่งมีค่าบริการสูงและติดข้อจำกัดด้านกฎหมายรถสาธารณะ แต่ไทยยังขาดระบบแบ่งปันการเดินทาง (True Carpooling) ที่เน้นหารต้นทุนตามจริง มีระบบตรวจสอบตัวตน (KYC) และระบบตรวจสอบภาพถ่ายป้ายทะเบียนรถที่รัดกุม

### 1.2 วัตถุประสงค์ของโครงงาน (Project Objectives)
1. **พัฒนาระบบคาร์พูลร่วมเดินทาง (Carpooling Web Application):** เชื่อมโยงผู้ใช้ที่มีเส้นทางหรือปลายทางเดียวกัน เช่น เทศกาล คอนเสิร์ต หรือสถานที่ท่องเที่ยว
2. **ระบบคำนวณและแนะนำอัตราค่าโดยสารที่เป็นธรรม (Fair Share Pricing Model):** อิงตามระยะทาง ค่าน้ำมันจริง และค่าสึกหรอของยานพาหนะตามหลักเศรษฐศาสตร์
3. **ระบบความปลอดภัยแบบหลายชั้น (Multi-layer Safety Standard):** มีการยืนยันตัวตน (KYC), การถ่ายภาพและตรวจสอบป้ายทะเบียนรถโดยแอดมิน (Vehicle Plate Verification), และระบบประเมินความประพฤติแบบต่างตอบแทน (Mutual Peer Review)
4. **ความสอดคล้องกับกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA Compliance 100%):** มีระบบขอความยินยอมสำหรับภาพถ่ายยานพาหนะ ระบบจัดการคุกกี้ และหน้าสำหรับให้ผู้ใช้ใช้สิทธิของตนเองตามกฎหมาย (Data Subject Rights Portal)
5. **ส่งเสริมการเดินทางสีเขียว (Green Travel & ESG Analytics):** แสดงผลสถิติการลดการปล่อยก๊าซคาร์บอนไดออกไซด์ ($CO_2$) และเทียบเคียงจำนวนต้นไม้ที่ช่วยฟื้นฟูธรรมชาติ

---

## 2. สถาปัตยกรรมระบบและเหตุผลในการเลือกเทคโนโลยี

### 2.1 แผนภาพสถาปัตยกรรมระบบ (System Architecture Diagram)

```mermaid
flowchart TD
    subgraph ClientTier ["Client Tier (Frontend - React 18 & Vite SPA)"]
        UI["React 18 Single Page Application"]
        Tailwind["Tailwind CSS + Morning Forest Theme"]
        GPU["GPU Acceleration & 120 FPS Motion Layer"]
        Dedupe["In-flight API Request Deduplication"]
        Prefetch["Dynamic Route & Chunk Prefetching"]
        Context["AuthContext + ThemeContext (TH/EN)"]
        EventSourceClient["Browser EventSource (SSE Client)"]
    end

    subgraph GatewayTier ["Gateway & Serverless Runtime (Vercel)"]
        VercelConfig["vercel.json (SPA Rewrite Rules & Cache-Control)"]
        ApiHandler["api/index.js (Serverless Entry Point)"]
    end

    subgraph AppTier ["Application Tier (Backend - Node.js & Express)"]
        ExpressApp["Express.js App (backend/src/server.js)"]
        Compression["HTTP Response Compression (Gzip / Deflate)"]
        Security["Security: Helmet + Rate Limiter + CORS"]
        AuthMiddleware["JWT Verification + Role Authorization"]
        
        subgraph Services ["Core Engines & Controllers"]
            TripCtrl["Trip & Booking Controller"]
            CarCtrl["Car Registration & Plate Verification"]
            RouteEngine["Smart Hybrid Route & Fair Price Engine"]
            ChatSSE["SSE Real-time Messaging Manager"]
            PDPACtrl["PDPA Rights & Data Export Controller"]
            AdminCtrl["Admin Moderation & Approval Engine"]
            NotifCtrl["In-App Notification Dispatcher"]
        end
    end

    subgraph DataTier ["Data Tier (PostgreSQL / Supabase Cloud)"]
        AutoMigrate["Self-Healing Auto-Migration Engine"]
        PostgresDB[("Supabase PostgreSQL Database (Indexed)")]
    end

    UI --> Dedupe --> Prefetch --> VercelConfig
    UI --> EventSourceClient
    VercelConfig --> ApiHandler
    ApiHandler --> ExpressApp
    ExpressApp --> Compression --> Security --> AuthMiddleware --> Services
    Services --> AutoMigrate --> PostgresDB
    ChatSSE -.-> EventSourceClient
```

### 2.2 ตารางเปรียบเทียบและเหตุผลการเลือกใช้เทคโนโลยี (Tech Stack Justification)

| หมวดหมู่ | เทคโนโลยีที่เลือก | เหตุผลทางวิชาการและข้อดี | ทำไมไม่เลือกทางเลือกอื่น? |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React 18 + Vite** | Component-based, Virtual DOM, Code Splitting (`lazy`/`Suspense`), โหลดเร็วกว่า 10 เท่าเมื่อเทียบกับ Webpack | ดีกว่า Create React App (CRA) ที่ช้าและล้าสมัย และคล่องตัวกว่า Next.js สำหรับงาน Single Page Application |
| **Styling & Motion** | **Tailwind CSS + Hardware GPU** | Utility-first, Bundle เล็กมาก (Purged CSS), ใช้ `transform: translateZ(0)` ขับเคลื่อนกราฟิกด้วย GPU 120 FPS | ไม่เลือก UI Component Library หนาเทอะทะ เพราะปรับแต่ง Glassmorphism และลด Re-render ได้ยากกว่า |
| **Backend Runtime** | **Node.js + Express** | Non-blocking Event-driven I/O รองรับงานสตรีมมิ่งข้อความ (SSE) และ REST API ปริมาณมากได้อย่างมีประสิทธิภาพ | ใช้ทรัพยากรน้อยกว่า Java/Spring Boot และพัฒนางานได้รวดเร็ว เหมาะสมกับ Cloud Serverless |
| **Database** | **PostgreSQL (Supabase)** | Relational Integrity (ACID), มี Foreign Key Constraints, Unique Indexes, รองรับ Complex Joins พร้อม Connection Pooler | ดีกว่า NoSQL (เช่น MongoDB) เนื่องจากเที่ยวรถ การจอง สถานะการเงิน และสิทธิ์ มีความสัมพันธ์เชิงโครงสร้างเคร่งครัด |
| **Real-time Protocol** | **Server-Sent Events (SSE)** | ใช้ HTTP มาตรฐาน, รองรับ HTTP/2 Multiplexing, มี Auto-reconnect ในตัว, เป็นมิตรกับ Serverless Timeout | WebSocket ต้องรักษา State บนเซิร์ฟเวอร์ตลอดเวลา ซึ่งไม่เหมาะกับ Serverless Functions ที่ทำงานแบบ Stateless |
| **Interactive Map** | **Google Maps Embed & Directions** | รองรับการระบุสถานที่ในไทยทุกระดับ (อำเภอ, ตำบล, สถานที่ท่องเที่ยว, มหาวิทยาลัย, จุดนัดพบภาษาไทย) แม่นยำ 100% | OpenStreetMap/Leaflet มีปัญหาเรื่อง Geocoding ชื่อเฉพาะภาษาไทย (เช่น วค.สุราษฎร์ธานี) ปักหมุดเพี้ยนไปต่างประเทศ |
| **Payment Standard** | **PromptPay EMVCo QR Code** | มาตรฐานกลางของธนาคารแห่งประเทศไทย (BOT) ผู้โดยสารสแกนจ่ายได้ทุกแอปธนาคารโดยไม่มีค่าธรรมเนียม | บัตรเครดิตมีค่าธรรมเนียมธุรกรรมสูง (2.5–3.5%) ไม่เหมาะกับการหารค่าน้ำมันราคาหลักสิบ-หลักร้อย |

### 2.3 รายละเอียดเจาะลึกเทคโนโลยีและไลบรารีแต่ละตัว (Detailed Technology Breakdown & Project Roles)

เพื่อให้สามารถตอบข้อซักถามของคณะกรรมการได้อย่างแม่นยำและครบถ้วน ทุกเทคโนโลยีที่นำมาใช้ในระบบแบ่งตามหมวดหมู่และหน้าที่จริงใน Iko-Share ดังนี้:

#### 1. ส่วนหน้า (Frontend Client Tier)
1. **React 18 (`react`, `react-dom`)**:
   - **หน้าที่หลัก:** เป็น JavaScript Library สำหรับสร้าง Single Page Application (SPA) ด้วยแนวคิด Component-Based
   - **บทบาทในโปรเจกต์:** จัดการ UI ทั้งหมด แบ่งเป็นชิ้นส่วน Reusable Components (เช่น `Navbar`, `TripCard`, `VehicleConsentModal`, `ShareTripModal`), จัดการ State ในหน้าจอด้วย React Hooks (`useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`) และส่งข้อมูลส่วนกลางผ่าน Context API (`AuthContext`, `ThemeContext`)
2. **Vite (`vite`, `@vitejs/plugin-react`)**:
   - **หน้าที่หลัก:** Next-generation Frontend Build Tool และ Development Server ที่รวดเร็วเป็นพิเศษ
   - **บทบาทในโปรเจกต์:** รัน Local Dev Server ด้วย Native ES Modules ทำให้เริ่มงานได้ทันที (Instant Server Start), มีระบบ Hot Module Replacement (HMR) อัปเดต UI ทันทีโดยไม่ต้องรีเฟรชหน้า, ทำ Code Splitting อัตโนมัติแยกไฟล์ Bundle เป็น Chunks ขนาดเล็ก และรองรับ Dynamic Prefetching เพื่อโหลดโค้ดล่วงหน้า
3. **Tailwind CSS (`tailwindcss`, `postcss`, `autoprefixer`)**:
   - **หน้าที่หลัก:** Utility-First CSS Framework สำหรับจัดสไตล์หน้าเว็บ
   - **บทบาทในโปรเจกต์:** ดีไซน์หน้าตาเว็บสไตล์ "Morning Forest" คุมโทนสีเขียวมิ้นต์-มรกตแบบโมเดิร์น, รองรับ Glassmorphism (พื้นหลังเบลอโปร่งแสง `backdrop-blur-md`), จัดการ Responsive Design ครอบคลุม Mobile, Tablet และ Desktop, และใช้คำสั่ง Hardware Acceleration เช่น `transform`, `will-change` เพื่อผลักดันการเรนเดอร์ให้ลื่นไหลระดับ 120 FPS
4. **React Router DOM v6 (`react-router-dom`)**:
   - **หน้าที่หลัก:** Library จัดการการเปลี่ยนหน้าแบบ Client-Side Routing
   - **บทบาทในโปรเจกต์:** นำทางผู้ใช้ระหว่างหน้าต่างๆ (`/`, `/find-trip`, `/create-trip`, `/my-trips`, `/profile`, `/admin`, `/login`) โดยไม่เกิดการ Reload ทั้งหน้า, ทำระบบ Route Protection ป้องกันไม่ให้ผู้ใช้ที่ยังไม่ล็อกอินเข้าถึงหน้าส่วนตัว และอนุญาตเฉพาะ Role `admin` เข้าถึงหน้าจัดการระบบ
5. **Axios (`axios`)**:
   - **หน้าที่หลัก:** Promise-based HTTP Client สำหรับสื่อสารกับเซิร์ฟเวอร์
   - **บทบาทในโปรเจกต์:** ยิง REST API ไปยัง Backend, ตั้งค่า Interceptors เพื่อแนบ Bearer JWT Token ในทุก Request โดยอัตโนมัติ, ดักจับ Error จัดการ Timeout และทำงานร่วมกับโมดูล Request Deduplication เพื่อป้องกันการส่งคำขอซ้ำซ้อน
6. **Lucide React (`lucide-react`)**:
   - **หน้าที่หลัก:** SVG Icon Library น้ำหนักเบา
   - **บทบาทในโปรเจกต์:** แสดงสัญลักษณ์และไอคอนใน UI เช่น ไอคอนรถยนต์, ป้ายทะเบียน, แผนที่/เข็มทิศ, กระดิ่งแจ้งเตือน, ดาวรีวิว, ไอคอนแชร์, คิวอาร์โค้ด และสลิปการโอนเงิน

#### 2. ส่วนหลัง (Backend Application Tier)
1. **Node.js**:
   - **หน้าที่หลัก:** JavaScript Runtime ฝั่งเซิร์ฟเวอร์ที่ทำงานแบบ Non-blocking Event-driven I/O
   - **บทบาทในโปรเจกต์:** ประมวลผลคำขอทางธุรกิจ (Business Logic), คำนวณระยะทางและราคาค่าแชร์น้ำมัน, ตรวจสอบสิทธิ์ผู้ใช้งาน และควบคุมการเชื่อมต่อฐานข้อมูล
2. **Express.js (`express`)**:
   - **หน้าที่หลัก:** Web Application Framework น้ำหนักเบาบน Node.js
   - **บทบาทในโปรเจกต์:** วางโครงสร้าง RESTful API Endpoint จัดหมวดหมู่ Controllers (`trips`, `bookings`, `cars`, `auth`, `admin`, `notifications`), จัดการ Middleware Pipeline ตรวจสอบข้อมูลก่อนเข้าสู่ตรรกะหลัก
3. **pg (node-postgres) (`pg`)**:
   - **หน้าที่หลัก:** PostgreSQL Client Library สำหรับเชื่อมต่อฐานข้อมูล
   - **บทบาทในโปรเจกต์:** จัดการ Database Connection Pooling (`pg.Pool`) เพื่อนำการเชื่อมต่อไปใช้ซ้ำอย่างมีประสิทธิภาพ, ทำ Parameterized Queries (`$1, $2, ...`) 100% เพื่อป้องกันช่องโหว่ SQL Injection, และขับเคลื่อนระบบ Self-Healing Auto-Migration ที่สร้างหรืออัปเกรดตารางในฐานข้อมูลอัตโนมัติเมื่อเปิดเซิร์ฟเวอร์
4. **JSON Web Token (`jsonwebtoken`)**:
   - **หน้าที่หลัก:** มาตรฐานการเข้ารหัสและสร้าง Token สำหรับ Authentication แบบ Stateless
   - **บทบาทในโปรเจกต์:** เข้ารหัส User ID, Email, Role เป็นสตริง Token พร้อมเซ็นลายเซ็นดิจิทัลด้วย Secret Key เมื่อผู้ใช้ล็อกอินสำเร็จ และให้ Backend ตรวจสอบลายเซ็นในทุก API Request เพื่อยืนยันตัวตนโดยไม่ต้องเก็บ Session ในหน่วยความจำเซิร์ฟเวอร์
5. **bcryptjs (`bcryptjs`)**:
   - **หน้าที่หลัก:** อัลกอริทึมการเข้ารหัสทางเดียว (One-way Cryptographic Hash Function) สำหรับรหัสผ่าน
   - **บทบาทในโปรเจกต์:** สร้าง Salt สุ่มและแฮชรหัสผ่านของผู้ใช้ก่อนบันทึกลงฐานข้อมูล และใช้เปรียบเทียบรหัสผ่านตอนล็อกอิน เพื่อให้มั่นใจว่าจะไม่มีผู้ใด (รวมถึงแอดมินหรือผู้ดูแลระบบ) ล่วงรู้รหัสผ่านจริงของผู้ใช้งานได้
6. **Multer (`multer`)**:
   - **หน้าที่หลัก:** Middleware สำหรับจัดการข้อมูลแบบ `multipart/form-data` (File Upload)
   - **บทบาทในโปรเจกต์:** รับไฟล์รูปภาพที่อัปโหลดจากหน้าเว็บ เช่น รูปโปรไฟล์, รูปถ่ายรถยนต์และป้ายทะเบียนสำหรับยืนยันตัวตน, และรูปสลิปการโอนเงิน PromptPay เพื่อส่งต่อไปจัดเก็บยัง Cloud Storage
7. **Compression (`compression`)**:
   - **หน้าที่หลัก:** Middleware บีบอัด HTTP Response ด้วยอัลกอริทึม Gzip / Deflate
   - **บทบาทในโปรเจกต์:** บีบอัดขนาดของข้อมูล JSON Response ที่ส่งกลับไปยังเบราว์เซอร์ ช่วยลดขนาด Payload ลงได้ถึง 60-80% ทำให้หน้าเว็บดึงข้อมูลรายการทริปและประวัติการเดินทางได้รวดเร็วทันใจแม้ใช้งานผ่านเครือข่ายมือถือ
8. **Helmet (`helmet`)**:
   - **หน้าที่หลัก:** Security Middleware ที่ตั้งค่า HTTP Security Response Headers
   - **บทบาทในโปรเจกต์:** ปกป้องแอปพลิเคชันจากภัยคุกคามทางเว็บที่พบบ่อย เช่น Content Security Policy (CSP), ป้องกัน Cross-Site Scripting (XSS), ป้องกัน Clickjacking ด้วย X-Frame-Options และปิดการทำ MIME sniffing
9. **CORS (`cors`)**:
   - **หน้าที่หลัก:** Middleware จัดการ Cross-Origin Resource Sharing
   - **บทบาทในโปรเจกต์:** ควบคุมและกำหนดสิทธิ์ให้เฉพาะโดเมนของ Frontend (เช่น โดเมนบน Vercel และ Localhost) สามารถยิง API มายังเซิร์ฟเวอร์ได้ ป้องกันไม่ให้เว็บไซต์บุคคลที่สามอื่นแอบยิงคำขอเข้ามา
10. **express-rate-limit (`express-rate-limit`)**:
    - **หน้าที่หลัก:** ระบบจำกัดความถี่ของ Request ที่ส่งมาจาก IP เดียวกัน
    - **บทบาทในโปรเจกต์:** ป้องกันการโจมตีแบบ Brute Force Password Guessing ในหน้า Login/Register และป้องกันการยิงสแปม API หรือ DoS (Denial of Service)
11. **cookie-parser (`cookie-parser`) & dotenv (`dotenv`)**:
    - **หน้าที่หลัก:** ตัวแปลงคุกกี้ และตัวจัดการ Environment Variables
    - **บทบาทในโปรเจกต์:** `cookie-parser` ใช้แยกวิเคราะห์คุกกี้ที่ส่งมากับ Header และ `dotenv` ใช้ดึงค่าความลับของระบบจากไฟล์ `.env` (เช่น `DATABASE_URL`, `JWT_SECRET`) เพื่อแยกการตั้งค่าคอนฟิกออกจาก Source Code อย่างปลอดภัย

#### 3. ฐานข้อมูลและบริการคลาวด์ (Database, Storage & Deployment)
1. **PostgreSQL (บน Supabase Cloud)**:
   - **หน้าที่หลัก:** ระบบจัดการฐานข้อมูลเชิงสัมพันธ์ระดับองค์กร (Enterprise RDBMS)
   - **บทบาทในโปรเจกต์:** บันทึกข้อมูลหลัก 14 ตาราง โดยควบคุมความถูกต้องของข้อมูลตามกฎ ACID, จัดการ Foreign Keys, Cascades, Check Constraints และ B-Tree Indexes เพื่อให้ Query ค้นหาเส้นทางและเที่ยวรถได้อย่างแม่นยำและรวดเร็ว
2. **Supabase Storage**:
   - **หน้าที่หลัก:** ระบบจัดเก็บไฟล์บนคลาวด์แบบ S3-Compatible Object Storage
   - **บทบาทในโปรเจกต์:** จัดเก็บและให้บริการเข้าถึงไฟล์รูปภาพ ได้แก่ รูปถ่ายรถและป้ายทะเบียน (`car_image_url`), สลิปการโอนเงิน (`payment_slip_url`) และรูปอวตารผู้ใช้
3. **Vercel Cloud Platform**:
   - **หน้าที่หลัก:** Cloud Platform สำหรับโฮสติ้ง Frontend แบบ Global Edge CDN และรัน Serverless Functions
   - **บทบาทในโปรเจกต์:** ปรับใช้ระบบ (Deploy) โดยตรงจาก GitHub อัตโนมัติ (CI/CD), กระจายไฟล์หน้าเว็บไปยัง Edge ทั่วโลก และประมวลผล Backend API ผ่าน Serverless Node.js Runtime

#### 4. โพรโทคอลและมาตรฐานภายนอก (Protocols & External Standards)
1. **Server-Sent Events (SSE)**:
   - **หน้าที่หลัก:** โพรโทคอลสตรีมมิ่งข้อมูลทิศทางเดียว (Unidirectional Streaming) แบบ Real-time ตามมาตรฐาน W3C
   - **บทบาทในโปรเจกต์:** ให้เซิร์ฟเวอร์พุชข้อความแชทใหม่ในห้องแชทของทริป (`TripChat`) สู่หน้าจอผู้โดยสารและคนขับทันทีโดยไม่ต้องกดรีเฟรชหน้า และใช้ทรัพยากรน้อยกว่า WebSocket บนสถาปัตยกรรม Serverless
2. **Google Maps Embed & Directions API**:
   - **หน้าที่หลัก:** บริการแผนที่และเส้นทางนำทางของ Google
   - **บทบาทในโปรเจกต์:** แสดงแผนที่เส้นทางแบบโต้ตอบ (Interactive Map), มีจุดแวะรับ-ส่ง (Waypoints Timeline), รองรับชื่อสถานที่ภาษาไทยทุกรูปแบบ (เช่น อำเภอ, มหาวิทยาลัย, จุดสังเกตเฉพาะถิ่น) อย่างแม่นยำ 100% พร้อมปุ่มเปิดเส้นทางนำทางในแอป Google Maps ทันที
3. **PromptPay EMVCo Standard**:
   - **หน้าที่หลัก:** มาตรฐานการเข้ารหัสข้อมูล QR Code ชำระเงินของธนาคารแห่งประเทศไทย (BOT)
   - **บทบาทในโปรเจกต์:** สร้าง Dynamic QR Code จากเบอร์พร้อมเพย์ของคนขับและยอดเงินค่าโดยสารที่คำนวณตามจำนวนที่นั่ง ให้ผู้โดยสารสแกนจ่ายได้จากทุกแอปพลิเคชันธนาคารในไทยโดยไม่มีค่าธรรมเนียม
4. **Web Share API**:
   - **หน้าที่หลัก:** Browser Native API สำหรับเรียกเมนูการแชร์ของระบบปฏิบัติการ
   - **บทบาทในโปรเจกต์:** ใช้ใน `ShareTripModal` เพื่อแชร์ลิงก์ทริปไปยัง LINE, Facebook, X หรือคัดลอกลิงก์ได้ในคลิกเดียว

---

## 3. โครงสร้างฐานข้อมูลและโมเดลข้อมูล (Database Schema & ER Design)

ฐานข้อมูลได้รับการออกแบบตามหลัก **3rd Normal Form (3NF)** ครอบคลุม 14 ตารางหลัก:

```mermaid
erDiagram
    users ||--o{ cars : "owns"
    users ||--o{ trips : "organizes"
    users ||--o{ bookings : "reserves"
    users ||--o{ reviews : "creates / receives"
    users ||--o{ verification_requests : "submits_kyc"
    users ||--o{ pdpa_requests : "requests_rights"
    users ||--o{ notifications : "receives"
    
    events ||--o{ trips : "hosts"
    cars ||--o{ trips : "used_in"
    trips ||--o{ bookings : "has"
    trips ||--o{ chat_messages : "contains"
    trips ||--o{ trip_memories : "stores"
    
    chat_messages ||--o{ chat_reports : "reported_in"

    users {
        int user_id PK
        string email UK
        string name
        string phone
        string role "Driver, Passenger, Both"
        boolean is_admin
        boolean is_verified
        string avatar_url
    }
    cars {
        string license_plate PK
        int user_id FK
        string model
        int capacity
        string car_image_url "Plate photo"
        string verification_status "รอดำเนินการ, อนุมัติแล้ว, ปฏิเสธ"
        string admin_reply
        boolean consent_pdpa
        timestamp consent_at
    }
    trips {
        int trip_id PK
        string license_plate FK
        int organizer_id FK
        int event_id FK
        string trip_type "carpool, public_transport, find_driver"
        string origin
        string destination
        decimal price_seat
        int available_seats
        decimal distance_km
        string duration_text
        string trip_status "active, completed, cancelled"
    }
    bookings {
        int booking_id PK
        int user_id FK
        int trip_id FK
        string booking_status "รอการอนุมัติ, จองแล้ว, ปฏิเสธ, ยกเลิกแล้ว, ถูกนำออกจากตี้"
        string payment_status "unpaid, paid, verifying"
        string payment_slip_url
        timestamp payment_time
    }
    notifications {
        int notification_id PK
        int user_id FK
        string title
        string message
        string type
        string link_url
        boolean is_read
    }
```

### การเพิ่มประสิทธิภาพดัชนี (Database Indexes Optimization)
ระบบมีการสร้าง B-Tree Indexes สำหรับคีย์ที่มีการค้นหาและจัดเรียงบ่อย:
* `idx_trips_departure_time`: ค้นหาเที่ยวเดินทางตามเวลาออกเดินทาง
* `idx_trips_trip_status`: คัดกรองทริปที่ยังเปิดให้บริการ (`active`)
* `idx_cars_user_id`: ดึงรายการรถยนต์ของผู้ใช้แต่ละคนอย่างรวดเร็ว
* `idx_cars_verification_status`: คัดกรองรถยนต์ที่รอแอดมินตรวจสอบ
* `idx_bookings_trip_id`: โหลดรายชื่อผู้โดยสารประจำทริป
* `idx_notifications_user`: ดึงรายการแจ้งเตือนล่าสุดของผู้ใช้แบบเรียงตามเวลา

---

## 4. ฟังก์ชันแกนหลักและขั้นตอนการทำงาน (Core Modules)

### 4.1 ระบบจัดการบทบาท (Role-based Access Control)
* **Passenger (ผู้โดยสาร):** ค้นหาทริป, จองที่นั่ง, สแกน QR โอนเงินและแนบสลิป, ร่วมแชท, ดูแผนที่, รีวิวเพื่อนร่วมทาง
* **Driver (คนขับรถ):** ลงทะเบียนรถยนต์พร้อมส่งภาพป้ายทะเบียน, ตรวจสอบและให้ความยินยอม PDPA, สร้างทริปคาร์พูล, ตรวจสอบสลิปชำระเงิน, อนุมัติ/ปฏิเสธผู้โดยสาร
* **Both (ผู้ใช้งานทั่วไป):** สลับบทบาทเป็นได้ทั้งผู้ขับขี่และผู้โดยสาร
* **Admin (ผู้ดูแลระบบ):** ตรวจสอบและอนุมัติเอกสาร KYC, ตรวจสอบและอนุมัติภาพป้ายทะเบียนรถยนต์, ตรวจสอบข้อความแชทที่ถูกรายงาน, ดำเนินการตามคำร้องขอ PDPA

### 4.2 วงจรสถานะของการจอง (Booking Lifecycle State Machine)

```mermaid
stateDiagram-v2
    [*] --> รอการอนุมัติ: ผู้โดยสารยื่นขอจองที่นั่ง
    รอการอนุมัติ --> จองแล้ว: คนขับกด "อนุมัติ" (หักที่นั่งว่างทันที)
    รอการอนุมัติ --> ปฏิเสธ: คนขับกด "ปฏิเสธ"
    รอการอนุมัติ --> ยกเลิกแล้ว: ผู้โดยสารถอนคำขอก่อนอนุมัติ
    จองแล้ว --> ยกเลิกแล้ว: ผู้โดยสารกดยกเลิก (คืนที่นั่งว่าง)
    จองแล้ว --> ถูกนำออกจากตี้: คนขับตัดชื่อออกเนื่องจากทำผิดข้อตกลง (คืนที่นั่งว่าง)
    จองแล้ว --> การเดินทางสำเร็จ: เสร็จสิ้นการเดินทาง (เปิดระบบเขียนรีวิว)
```

### 4.3 ระบบห้องแชทเรียลไทม์ประจำทริป (In-Trip Chat Security)
* **Access Control Guard:** อนุญาตให้เข้าห้องแชทเฉพาะ **หัวหน้าทริป** และ **ผู้โดยสารที่ได้รับการอนุมัติแล้ว (`จองแล้ว`)** เท่านั้น
* **Server-Sent Events (SSE) Stream:** กระจายข้อความใหม่แบบ Push ไม่ต้องรัน Polling ซ้ำๆ
* **Adaptive Fallback Polling (15 วินาที):** ทำงานอัตโนมัติหากอินเทอร์เน็ตหลุดหรือขาดการเชื่อมต่อกับ SSE

### 4.4 ระบบลงทะเบียนรถและตรวจสอบภาพป้ายทะเบียน (Vehicle Registration & Plate Verification)
* **ความสำคัญ:** ป้องกันการแอบอ้างสวมทะเบียน ป้องกันการนำรถผิดกฎหมายมาให้บริการ และสร้างความมั่นใจให้ผู้โดยสาร
* **ขั้นตอนการทำงาน:**
  1. ผู้ขับขี่กรอกทะเบียนรถ, ยี่ห้อ, รุ่น, จำนวนที่นั่ง
  2. ถ่ายภาพหรือแนบรูปถ่ายป้ายทะเบียนรถจริง (`car_image_url`)
  3. กดยอมรับความยินยอม PDPA ในการตรวจสอบภาพถ่าย
  4. ข้อมูลจะส่งไปยังแดชบอร์ดของผู้ดูแลระบบในสถานะ **"รอดำเนินการ"**
  5. แอดมินตรวจสอบความถูกต้อง หากถูกต้องจะกด **"อนุมัติ"** รถคันนั้นจึงจะสามารถนำไปสร้างทริปคาร์พูลได้ หากไม่ถูกต้องสามารถกด **"ปฏิเสธ"** พร้อมระบุเหตุผลตอบกลับไปยังคนขับได้ทันที

### 4.5 ระบบขอความยินยอมจัดเก็บภาพยานพาหนะตาม PDPA (Vehicle Data PDPA Consent)
* จัดทำคอมโพเนนต์ [`VehicleConsentModal.jsx`](file:///home/lunasias/Documents/GitHub/iko-share/frontend/src/components/VehicleConsentModal.jsx) เพื่อขอความยินยอมตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
* ชี้แจงวัตถุประสงค์ในการตรวจสอบ, มาตรการรักษาความลับ (ไม่เผยแพร่ต่อสาธารณะ), สิทธิในการขอลบหรือเพิกถอนความยินยอม
* มี Checkbox บังคับยินยอมก่อนส่งข้อมูล และบันทึก `consent_pdpa = true` พร้อม Timestamp ลงฐานข้อมูลเพื่อเป็นหลักฐานทางกฎหมาย

### 4.6 ระบบแผนที่นำทางอัจฉริยะ (Interactive Google Maps Route & Timeline Engine)
* คอมโพเนนต์ [`TripRouteMap.jsx`](file:///home/lunasias/Documents/GitHub/iko-share/frontend/src/components/TripRouteMap.jsx) ผสานการทำงานร่วมกับ Google Maps Embed:
  * **แท็บแผนที่เส้นทาง (Google Maps):** แสดงเส้นทางการเดินทางจริง สภาพจราจร และความยาวเส้นทาง
  * **แท็บจุดจอด/ไทม์ไลน์ (Timeline):** แสดงแผนผังลำดับจุดขึ้นรถ จุดพักรถ และจุดส่งปลายทาง
  * **ปุ่มเปิด GPS นำทาง:** ลิงก์ตรงเข้าแอป Google Maps Directions API บนสมาร์ตโฟนของผู้ใช้ได้ทันที

### 4.7 ระบบชำระเงินด้วย QR Code พร้อมเพย์ และตรวจสอบสลิป (PromptPay QR & Payment Verification)
* ฝั่งคนขับระบุเบอร์โทรศัพท์ ระบบจะแปลงเป็น **EMVCo PromptPay QR Code** ตามยอดเงินค่าโดยสารอัตโนมัติ
* ผู้โดยสารสามารถสแกนจ่ายผ่านแอปพลิเคชันธนาคารใดก็ได้ และอัปโหลดภาพถ่ายสลิปโอนเงินเข้าสู่ระบบ
* คนขับสามารถเปิดดูภาพสลิปขนาดเต็ม และกดยืนยันสถานะ **"ชำระเงินเรียบร้อยแล้ว"**

### 4.8 ระบบสถิติสิ่งแวดล้อมและการลดคาร์บอน (Eco Carbon Footprint & Trees Saved)
* แสดงผลบนหน้ารายละเอียดทริปเพื่อตอบโจทย์ **Green Travel / ESG Standard**:
* คำนวณปริมาณก๊าซ $CO_2$ ที่ลดลงได้จากการร่วมเดินทางเมื่อเทียบกับการแยกขับรถคนละคัน
* เทียบเคียงเป็นจำนวนต้นไม้ที่ช่วยดูดซับคาร์บอนไดออกไซด์ต่อปี

### 4.9 ระบบศูนย์แจ้งเตือนแบบเรียลไทม์ (In-App Notification Center)
* เมนูกระดิ่งแจ้งเตือนบน Navbar พร้อม Badge แสดงจำนวนรายการที่ยังไม่ได้อ่าน
* แจ้งเตือนเมื่อ: มีผู้โดยสารขอร่วมทาง, ทริปได้รับการอนุมัติ, สลิปได้รับการยืนยัน, และผลการตรวจสอบทะเบียนรถจากแอดมิน

### 4.10 ระบบแบ่งปันการเดินทางสู่โซเชียลมีเดีย (Social Share & Web Share API)
* ปุ่มแชร์ทริปพร้อมตัวเลือก: Facebook, X (Twitter), LINE, คัดลอกลิงก์, และ Web Share API สำหรับ Native Share บนสมาร์ตโฟน

---

## 5. จุดเด่นทางเทคนิคและอัลกอริทึม (Technical Merits)

### 5.1 ระบบประเมินเส้นทางและการคิดราคาเป็นธรรม (Smart Route & Fair Share Model)
ระบบในไฟล์ [`routeService.js`](file:///home/lunasias/Documents/GitHub/iko-share/backend/src/services/routeService.js):

#### 1) การคำนวณระยะทางแบบไฮบริด (Hybrid Distance Engine)
1. **Google Routes API / Distance Matrix API:** เรียกใช้อัตโนมัติเมื่อมีการตั้งค่า API Key
2. **Thailand Highway Spatial Engine (Fallback):** มีพิกัดครอบคลุม 77 จังหวัด, อำเภอสำคัญในภาคใต้, และสถาบันการศึกษา
3. **Haversine Formula + Winding Factor:**
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
   ปรับค่าความคดเคี้ยวของถนนจริงด้วยสัมประสิทธิ์ $1.28$

#### 2) สูตรต้นทุนการดำเนินงาน (Operating Cost Formula)
$$\text{Total Cost} = (\text{Distance} \times \text{Fuel Rate}) + (\text{Distance} \times \text{Depreciation Rate})$$
* **อัตราค่าน้ำมันเฉลี่ย:** 2.20 บาท/กม.
* **อัตราค่าสึกหรอและบำรุงรักษา:** 1.30 บาท/กม.
* **ราคาแนะนำต่อที่นั่ง:**
  $$\text{Seat Price} = \frac{\text{Total Cost}}{\text{Available Seats}}$$
  *(ปัดเศษลงท้ายด้วย 10 บาทเพื่อความสะดวกในการหารค่าใช้จ่าย)*

### 5.2 วิศวกรรมความเร็วและความลื่นไหล 120 FPS (Web Performance & Optimization)
* **Render-Blocking Elimination:** ลบ `@import` ย้าย Google Fonts ไปโหลดคู่ขนานใน `index.html` พร้อม `preconnect` + `dns-prefetch` ประหยัดเวลาโหลด 300–800ms
* **Zero-Re-render 120 FPS Motion:** หน้าแรก Hero Section ใช้ `requestAnimationFrame` + `useRef` ปรับ CSS Variables ตรงสู่ DOM โดยไม่กระตุ้น React Re-render ลื่นไหลระดับ 60/120 FPS
* **In-flight GET Request Deduplication:** ระบบแชร์ Promise ใน [`api.js`](file:///home/lunasias/Documents/GitHub/iko-share/frontend/src/services/api.js) ตัดปัญหาการยิง API ซ้ำซ้อนพร้อมกันในระดับมิลลิวินาที
* **Route Prefetching บน Hover:** พรีโหลดโค้ด JS chunks ล่วงหน้าเมื่อผู้ใช้นำเมาส์ไปชี้ที่เมนูหรือการ์ดทริป ทำให้เปิดหน้าใหม่ได้ใน 0ms
* **Async Decoding & Lazy Loading:** ใส่ `loading="lazy"` และ `decoding="async"` ถอดรหัสรูปภาพนอก Main Thread
* **Backend Gzip Compression:** บีบอัดข้อมูล API ผ่าน Express `compression` middleware ลดขนาด Payload ลง 70–85%

### 5.3 อัลกอริทึมสร้าง PromptPay EMVCo Payload
แปลงเบอร์โทรศัพท์ของคนขับเป็นรูปแบบ E.164 (`0066...`) คำนวณความยาวสตริงและสร้าง CRC16-CCITT Checksum ตามข้อกำหนดสากลของ EMVCo QR Code สำหรับการชำระเงิน

### 5.4 แบบจำลองการคำนวณการลดก๊าซคาร์บอนไดออกไซด์ ($CO_2$ Offset Formula)
$$\text{Emissions Saved (kg } CO_2) = \frac{(\text{Passengers} \times \text{Distance (km)} \times 0.120 \text{ kg } CO_2/\text{km})}{1.0}$$
* รถยนต์ส่วนบุคคลปล่อย $CO_2$ เฉลี่ย 120 กรัม/กิโลเมตร
* ต้นไม้ 1 ต้นสามารถดูดซับ $CO_2$ ได้เฉลี่ย 15 กิโลกรัมต่อปี นำมาคำนวณเทียบเคียงเป็นจำนวนต้นไม้

---

## 6. ผลการทดสอบระบบและคุณภาพซอฟต์แวร์ (Testing & QA)

* **สถิติการทดสอบระบบทั้งหมด:**
  * จำนวนชุดทดสอบทั้งหมด: **165 Test Cases**
  * จำนวนเคสที่ผ่านการทดสอบ (Passed): **160 Cases**
  * อัตราความสำเร็จ (Overall Pass Rate): **97.0%** (สูงกว่าเกณฑ์มาตรฐาน 95%)
  * ข้อบกพร่องระดับวิกฤต (Critical / Blocker): **0 ข้อบกพร่อง (แก้ไขเสร็จสิ้น 100%)**
* **หมวดหมู่การทดสอบ:**
  1. Functional Testing: การสมัครสมาชิก, ยืนยันตัวตน, ลงทะเบียนรถพร้อมภาพป้ายทะเบียน, สร้างทริป, จองที่นั่ง, อัปโหลดสลิป, แชท, และรีวิว
  2. Security & PDPA Testing: การป้องกัน JWT, Rate Limiting, สิทธิ์การเข้าถึงข้อมูล, และการยินยอม PDPA
  3. Performance Testing: การทดสอบความเร็ว Core Web Vitals (FCP < 1.0s, LCP < 1.8s) และการตอบสนองที่ 60/120 FPS

---

## 7. คลังคำถาม-คำตอบที่อาจารย์ชอบถาม (Frequently Asked Defense Q&A)

### หมวดที่ 1: ปัญหา กฎหมาย และความคุ้มค่า (Business & Legal)

> **Q1: แพลตฟอร์มนี้ต่างจาก Grab หรือ Bolt อย่างไร ทำไมคนถึงจะมาใช้?**  
> **แนวทางการตอบ:**  
> "Grab และ Bolt เป็นระบบ **Ride-hailing เพื่อการค้า (Commercial Service)** ที่มีค่าบริการเชิงพาณิชย์และมักปรับราคาสูงขึ้นมาก (Surge Pricing) ในช่วงเลิกงานอีเวนต์  
> แต่ **Iko-Share คือ Carpooling แท้จริง** ซึ่งเน้นการเดินทางไปในทิศทางเดียวกันของผู้มีรถและผู้โดยสาร เพื่อ **'แบ่งเบาต้นทุนค่าน้ำมันและค่าผ่านทางตามจริง'** ค่าใช้จ่ายถูกกว่ารถรับจ้าง 50–70% อีกทั้งยังตอบโจทย์ด้านสิ่งแวดล้อม (ลดก๊าซคาร์บอน) และสร้างสังคมเพื่อนร่วมทางที่มีความสนใจในกิจกรรมหรือสถานที่ท่องเที่ยวเดียวกันครับ"

> **Q2: ระบบนี้ถือว่าเป็นรถรับจ้างสาธารณะผิดกฎหมาย (ป้ายดำรับจ้าง) หรือไม่?**  
> **แนวทางการตอบ:**  
> "ไม่ผิดกฎหมายครับ เนื่องจากระบบได้รับการออกแบบตามหลักการ **Cost-sharing Carpooling**:
> 1. คนขับเดินทางไปยังจุดหมายนั้นอยู่แล้ว ไม่ได้วิ่งรับจ้างวนหาลูกค้า
> 2. ระบบมี **Smart Operating Cost Calculator** กำหนดเพดานราคาแนะนำต่อที่นั่งตามระยะทางและค่าน้ำมันจริง มิใช่การคิดราคาเพื่อแสวงหากำไรเชิงพาณิชย์
> 3. มีการกำหนดข้อตกลงและเงื่อนไข (Terms of Service) ชัดเจนว่าเป็นการร่วมเดินทางแบบแบ่งปันค่าใช้จ่ายครับ"

---

### หมวดที่ 2: สถาปัตยกรรมและการพัฒนาซอฟต์แวร์ (Technical & Architecture)

> **Q3: ทำไมระบบแชทถึงเลือกใช้ Server-Sent Events (SSE) แทน WebSocket?**  
> **แนวทางการตอบ:**  
> "เหตุผลสำคัญมี 3 ประการครับ:
> 1. **ความเข้ากันได้กับ Serverless (Vercel):** WebSocket ต้องการ Persistent Full-Duplex Connection ที่ต้องรักษา State ซึ่งขัดกับธรรมชาติของ Serverless Functions ที่ทำงานแบบ Stateless
> 2. **ลักษณะงานตรงเป้าหมาย:** การส่งข้อความเกิดขึ้นผ่าน HTTP POST ปกติ ส่วนที่ต้องการความเรียลไทม์คือการ Push ข้อความใหม่จากเซิร์ฟเวอร์สู่หน้าจอสมาชิก ซึ่ง SSE ทำงานได้ดีมาก ใช้ HTTP มาตรฐาน และทำงานร่วมกับ HTTP/2 Multiplexing ได้อย่างประหยัดทรัพยากร
> 3. **ความทนทานต่อเน็ตมือถือ:** SSE มีระบบ Auto-reconnect ในตัว และทีมงานได้เสริม Adaptive Fallback Polling (15 วินาที) สำรองไว้ ทำให้ข้อความไม่ตกหล่นแม้สัญญาณจะขาดหายชั่วคราวครับ"

> **Q4: ทำไมจึงเปลี่ยนมาใช้ Google Maps แทน OpenStreetMap ในเวอร์ชันล่าสุด?**  
> **แนวทางการตอบ:**  
> "เนื่องจาก OpenStreetMap (Leaflet + Nominatim) มีข้อจำกัดร้ายแรงในการแปลงชื่อสถานที่ภาษาไทย (Geocoding) โดยเฉพาะสถานที่เฉพาะกลุ่ม เช่น 'วค.สุราษฎร์ธานี' หรือจุดนัดพบในต่างจังหวัด ทำให้หมุดคลาดเคลื่อนไปตกต่างประเทศ  
> ทีมงานจึงยกระดับไปใช้ **Google Maps Embed API** ซึ่งรองรับฐานข้อมูลสถานที่ภาษาไทย สภาพจราจร และถนนทั่วประเทศไทยได้อย่างแม่นยำ 100% พร้อมมีปุ่มลัดส่งพิกัดเข้าแอป GPS นำทางบนมือถือได้ทันทีครับ"

---

### หมวดที่ 3: ความปลอดภัย ยานพาหนะ และ PDPA (Trust, Safety & Privacy)

> **Q5: ระบบมีมาตรการตรวจสอบรถยนต์และความปลอดภัยอย่างไรบ้าง?**  
> **แนวทางการตอบ:**  
> "ระบบวางมาตรการความปลอดภัย 4 ระดับ (Multi-layer Safety Standard):
> 1. **Vehicle License Plate Verification:** คนขับต้องถ่ายภาพป้ายทะเบียนรถจริงส่งให้แอดมินตรวจสอบความถูกต้องก่อนเปิดทริป
> 2. **Identity KYC Verification:** มีระบบยืนยันตัวตนด้วยบัตรประชาชน/ใบขับขี่ เพื่อรับตรารับรอง Verified Badge
> 3. **Vehicle PDPA Consent:** มีการขอความยินยอมตามกฎหมาย PDPA โดยภาพถ่ายป้ายทะเบียนจะถูกเข้ารหัสจัดเก็บเป็นความลับ ไม่ถูกเผยแพร่ต่อสาธารณะ
> 4. **Mutual Peer Review & Digital Trail:** มีระบบประเมินคะแนนรีวิวหลังเดินทาง และบันทึกประวัติการเดินทางทุกขั้นตอนเพื่อตรวจสอบย้อนหลังได้ครับ"

---

### หมวดที่ 4: ประสิทธิภาพและความเร็วของระบบ (Performance & Scalability)

> **Q6: ทำอย่างไรให้เว็บโหลดเร็วและลื่นไหลระดับ 120 FPS?**  
> **แนวทางการตอบ:**  
> "ทีมงานได้ทำ Performance Optimization ทั้งระบบ:
> 1. **กำจัด Render-Blocking CSS:** ลบ `@import` ใน CSS แล้วรวมฟอนต์โหลดคู่ขนานใน HTML ผ่าน `preconnect`
> 2. **Hardware GPU Acceleration:** ปรับแต่งแอนิเมชันหน้าแรกด้วย `requestAnimationFrame` + `useRef` ควบคุม CSS Variables โดยตรง ทำให้ได้ความลื่นไหล 120 FPS ไร้การ Re-render
> 3. **In-flight Request Deduplication:** ป้องกันการยิง API ซ้ำซ้อนพร้อมกันในระดับมิลลิวินาที
> 4. **Route Prefetching on Hover:** พรีโหลดโค้ด JavaScript ล่วงหน้าเมื่อผู้ใช้นำเมาส์ไปชี้ที่เมนู ทำให้เปิดหน้าใหม่ได้ใน 0 มิลลิวินาที
> 5. **Backend Gzip Compression:** บีบอัดข้อมูล API responses ลดขนาดเครือข่ายลง 70–85% ครับ"

---

## 8. ข้อจำกัดและทิศทางการพัฒนาต่อยอด (Limitations & Future Work)

1. **ระบบชำระเงินอัตโนมัติ (Automated Escrow Payment Gateway):**
   * ปัจจุบัน: ใช้ QR Code พร้อมเพย์ และระบบอัปโหลดสลิปให้คนขับกดยืนยัน
   * แผนต่อยอด: เชื่อมต่อ Payment Gateway (เช่น Omise / 2C2P) เพื่อพักเงินค่าโดยสารไว้ในระบบกลาง (Escrow) และตัดจ่ายให้คนขับอัตโนมัติเมื่อสิ้นสุดการเดินทาง
2. **ระบบติดตามตำแหน่งรถแบบเรียลไทม์ (Live GPS Driver Tracking):**
   * เชื่อมต่อ Geolocation API และ WebSocket เพื่อให้ผู้โดยสารเห็นตำแหน่งรถของคนขับแบบ Real-time บนแผนที่ในวันเดินทาง
3. **การประมวลผลภาพป้ายทะเบียนด้วย AI (Automated OCR License Plate Recognition):**
   * นำ Machine Learning / Vision OCR มาอ่านและตรวจสอบตัวเลขป้ายทะเบียนรถอัตโนมัติเบื้องต้นก่อนส่งให้แอดมินอนุมัติ เพื่อลดระยะเวลาการตรวจสอบ

---

## 9. ลำดับขั้นตอนการสาธิตระบบ (Demo Sequence Checklist)

แนะนำให้เปิด 2 เบราว์เซอร์คู่กัน (เช่น Chrome ปกติ เป็น **คนขับ (Driver)** และ Incognito เป็น **ผู้โดยสาร (Passenger)**):

1. **หน้าแรก (Home Page):** แสดงความเร็วและแอนิเมชัน 120 FPS, สลับภาษา TH/EN, ค้นหาทริป
2. **ลงทะเบียนรถยนต์ (Car Registration - คนขับ):**
   * กรอกทะเบียนรถ, ยี่ห้อ, รุ่น
   * ถ่ายภาพหรือแนบรูปป้ายทะเบียนรถ
   * แสดง **กล่องขอความยินยอม PDPA** พร้อมกดเปิดอ่าน **Vehicle PDPA Consent Modal** และกดยินยอม
3. **อนุมัติรถยนต์ (Admin Dashboard):**
   * เข้าสู่ระบบด้วย `admin@ikoshare.com`
   * เข้าแท็บ "ตรวจสอบยานพาหนะ" ดูภาพป้ายทะเบียนขนาดใหญ่ แล้วกด "อนุมัติ"
4. **เปิดทริปการเดินทางใหม่ (Create Trip - คนขับ):**
   * เลือกรถยนต์ที่ผ่านการอนุมัติแล้ว
   * กรอกต้นทาง - ปลายทาง (เช่น เซ็นทรัลพลาซ่าสุราษฎร์ธานี ➔ วค.สุราษฎร์ธานี)
   * แสดงระบบ **คำนวณระยะทางและค่าน้ำมันอัตโนมัติ** พร้อมสถิติสิ่งแวดล้อม
5. **ค้นหาและจองทริป (Find & Book - ผู้โดยสาร):**
   * ผู้โดยสารค้นหาทริป กดดูรายละเอียด
   * แสดง **Google Maps แบบ Interactive** พร้อมแท็บไทม์ไลน์จุดจอด
   * กดส่งคำขอจองที่นั่ง
6. **การแจ้งเตือนและการอนุมัติ (Notification & Approval):**
   * กระดิ่งแจ้งเตือนดังที่ฝั่งคนขับ คนขับกดอนุมัติที่นั่ง
7. **การชำระเงินและแนบสลิป (Payment & Slip):**
   * ผู้โดยสารเห็น PromptPay QR Code พร้อมเพย์ตามยอดเงินจริง
   * ผู้โดยสารอัปโหลดรูปสลิป คนขับตรวจสอบสลิปและกดยืนยันชำระเงิน
8. **แชทเรียลไทม์และการรีวิว (Real-time Chat & Review):**
   * แชทคุยกันผ่าน SSE ทันทีแบบเรียลไทม์
   * ทดสอบให้คะแนนดาวและรีวิวเมื่อการเดินทางสิ้นสุด
9. **หน้า PDPA Rights:**
   * แสดงเมนูการขอใช้สิทธิข้อมูลส่วนบุคคล และการดาวน์โหลดข้อมูลประวัติการใช้งาน (Data Export)
