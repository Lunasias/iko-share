---
trigger: always_on
---
# Git Branching Strategy & Workflow Rule

สำหรับทุกงานที่มีการเพิ่มฟีเจอร์ ปรับปรุงฟังก์ชัน หรือแก้ไขโค้ดในโปรเจกต์นี้:
1. **ห้าม Commit ลง `main` หรือ `DEV` โดยตรงโดยเด็ดขาด**
2. **ก่อนเริ่มงานทุกครั้ง:** ต้องสลับไปที่ `DEV` และดึงโค้ดล่าสุด (`git checkout DEV && git pull origin DEV`)
3. **แตก Branch เสมอ:** ต้องสร้าง Branch ใหม่ในรูปแบบ `feature/<feature-name>` ทุกครั้ง เช่น `feature/user-avatar-upload` หรือ `feature/filter-trips`
4. **การบันทึกงาน:** ทำงานและ Commit บน branch `feature/...` นั้นๆ
5. **เมื่อฟีเจอร์เสร็จสิ้น:** ตรวจสอบโค้ด แล้วจึง Merge กลับเข้า `DEV` ด้วยคำสั่ง **`git merge --no-ff <feature-branch>`** เสมอ (ห้าม Fast-Forward เพื่อให้ Git Graph วาดกิ่งแยกและจุดผสาน Merge Commit ชัดเจน) และ Push ขึ้น Remote (`origin/DEV`)
6. **การ Release เข้า `main`:** ดำเนินการเฉพาะเมื่อต้องการปล่อยเวอร์ชันจริงเท่านั้น
