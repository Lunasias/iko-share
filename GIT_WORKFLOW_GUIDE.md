# คู่มือแนวทางการทำงานแบบแยก Branch (Git Branching Workflow Guide)

> **มาตรฐานการจัดการ Source Control สำหรับโครงงาน Iko-Share ตามหลัก Git Flow**  
> เหมาะสำหรับใช้ตอบคำถามอาจารย์ และเป็นแนวทางปฏิบัติร่วมกันของทีมพัฒนา

---

## 1. โครงสร้าง Branch ในโปรเจกต์ (Branch Hierarchy)

โปรเจกต์ Iko-Share กำหนดสถาปัตยกรรม Branch ออกเป็น 3 ระดับหลัก:

```mermaid
gitGraph
   commit id: "Initial"
   branch DEV
   checkout DEV
   commit id: "Setup DEV"
   
   branch feature/connect-google-map
   checkout feature/connect-google-map
   commit id: "feat: Google Routes API"
   commit id: "feat: Distance Calculator"
   checkout DEV
   merge feature/connect-google-map id: "Merge feature"
   
   branch feature/supabase-sync
   checkout feature/supabase-sync
   commit id: "docs: Supabase PostgreSQL"
   checkout DEV
   merge feature/supabase-sync id: "Merge feature"
   
   checkout main
   merge DEV id: "Release v1.0.0"
   commit id: "Tag v1.0.0"
```

### หน้าที่ของแต่ละ Branch:
1. **`main` (Production Branch):**
   * เป็นโค้ดเวอร์ชันที่เสถียรที่สุด (Production-ready)
   * ใช้สำหรับการ Deploy ขึ้น Vercel จริง และใช้นำเสนอต่ออาจารย์/เปิดให้บุคคลทั่วไปใช้งาน
   * **ข้อห้าม:** ห้าม commit งานใหม่หรือทดลองโค้ดลง `main` โดยตรงเด็ดขาด โค้ดจะเข้า `main` ได้ผ่านการ merge มาจาก `DEV` เท่านั้น
2. **`DEV` (Development / Integration Branch):**
   * เป็นศูนย์กลางการรวมโค้ด (Integration Hub) ของทีม
   * ใช้สำหรับทดสอบฟังก์ชันต่างๆ ร่วมกันก่อนขึ้น Production
   * ทุก Feature Branch จะต้องแตกออกมาจาก `DEV` และ merge กลับเข้า `DEV`
3. **`feature/<ชื่อฟีเจอร์>` (Feature Branches):**
   * กิ่งสำหรับพัฒนาฟังก์ชันเฉพาะเรื่อง (เช่น `feature/connect-google-map`, `feature/booking-approval`, `feature/realtime-sse-chat`)
   * มีอายุสั้น เมื่อพัฒนาและทดสอบเสร็จจะ merge กลับเข้า `DEV` แล้วสามารถลบ branch ทิ้งได้

---

## 2. ขั้นตอนการทำงานจริง (Step-by-Step Practical Workflow)

### ขั้นตอนที่ 1: ก่อนเริ่มพัฒนาฟังก์ชันใหม่ (Start a Feature)
ทุกครั้งที่จะเริ่มเขียนฟีเจอร์ใหม่ ให้ดึงโค้ดล่าสุดจาก `DEV` มาก่อนเสมอ:

```bash
# สลับไปที่ DEV และดึงโค้ดล่าสุดจากเซิร์ฟเวอร์
git checkout DEV
git pull origin DEV

# แตก branch ใหม่ตามชื่อฟีเจอร์ที่กำลังจะทำ (ใช้ตัวพิมพ์เล็กและขีดกลาง)
git checkout -b feature/your-feature-name
```
*ตัวอย่างการตั้งชื่อ:*
* `feature/connect-google-map` (พัฒนาระบบคำนวณเส้นทาง Google Maps)
* `feature/kyc-verification` (พัฒนาระบบยืนยันตัวตนบัตรประชาชน)
* `feature/trip-review-system` (พัฒนาระบบรีวิวเพื่อนร่วมทาง)

---

### ขั้นตอนที่ 2: ระหว่างพัฒนาโค้ด (Coding & Committing)
บันทึกงานเป็นระยะๆ พร้อมข้อความ Commit ที่สื่อความหมายชัดเจน:

```bash
# ดูสถานะไฟล์ที่มีการแก้ไข
git status

# สเตจไฟล์และบันทึก commit
git add .
git commit -m "feat: implement route duration estimation"

# นำขึ้นรีโมต GitHub
git push -u origin feature/your-feature-name
```

---

### ขั้นตอนที่ 3: นำฟังก์ชันกลับเข้า `DEV` เมื่องานเสร็จสมบูรณ์ (Merge to DEV)
เมื่อพัฒนาฟีเจอร์นั้นเสร็จสิ้นและทดสอบผ่านแล้ว ให้นำกลับมารวมที่ `DEV`:

```bash
# 1. สลับกลับมาที่ DEV
git checkout DEV

# 2. ดึงโค้ดล่าสุดของ DEV เผื่อมีเพื่อนอัปเดต
git pull origin DEV

# 3. รวม feature เข้า DEV
git merge feature/your-feature-name

# 4. ส่ง DEV ขึ้น GitHub
git push origin DEV
```

*(หมายเหตุ: บน GitHub สามารถเปิด Pull Request จาก `feature/...` เข้า `DEV` เพื่อตรวจเช็คความถูกต้องก่อน Merge ได้)*

---

### ขั้นตอนที่ 4: การปล่อยเวอร์ชันขึ้นจริงสู่ `main` (Release to Production)
เมื่อ `DEV` ผ่านการทดสอบครบถ้วน (Functional, Integration, UAT) และพร้อมเปิดใช้งานจริง:

```bash
# 1. สลับไปที่ main
git checkout main

# 2. ดึง main ล่าสุด
git pull origin main

# 3. รวม DEV เข้า main
git merge DEV

# 4. ส่ง main ขึ้น GitHub (Vercel จะจับไป Build และ Deploy ทันที)
git push origin main
```

---

## 3. คำสั่งลัดที่มีประโยชน์ (Helpful Git Commands)

| คำสั่ง | คำอธิบาย |
| :--- | :--- |
| `git branch -a` | ดูรายชื่อ branch ทั้งหมดทั้งในเครื่องและบน GitHub |
| `git checkout DEV` | สลับไปทำงานที่ branch `DEV` |
| `git log --oneline --graph -n 10` | ดูแผนภาพประวัติการ commit และการแตก branch 10 อันดับล่าสุด |
| `git merge --abort` | ยกเลิกการ merge ทันทีเมื่อเกิด Conflict โดยไม่ทำให้โค้ดเสียหาย |
| `git branch -d feature/name` | ลบ feature branch ในเครื่องหลัง merge เสร็จแล้ว |
| `git push origin --delete feature/name` | ลบ feature branch บน GitHub หลัง merge เสร็จแล้ว |

---

## 4. สิ่งที่ใช้ตอบอาจารย์เมื่อถูกถามเรื่องการจัดการ Git

> **คำถาม:** โครงงานนี้มีการแบ่งการทำงานและจัดการ Source Code อย่างไร?  
> **แนวทางการตอบ:**  
> "ทีมเรานำหลักการ **Git Flow Architecture** มาประยุกต์ใช้ครับ โดยแยก Branch เป็น:
> 1. **`main`** เก็บโค้ดเสถียรที่สุดสำหรับ Production ซึ่งเชื่อมต่อกับ Vercel ให้ Deploy อัตโนมัติ
> 2. **`DEV`** เป็น Integration Hub สำหรับรวบรวมฟังก์ชันใหม่ๆ และใช้ทดสอบร่วมกันในทีม
> 3. มีการแตก **`feature/<name>`** เป็นอิสระสำหรับแต่ละงาน เช่น `feature/connect-google-map` เมื่อพัฒนาเสร็จจึงทำ Code Review และ Merge กลับเข้า `DEV` เพื่อลดปัญหา Merge Conflict และไม่ส่งผลกระทบต่อระบบที่เปิดใช้งานจริงบน `main` ครับ"
