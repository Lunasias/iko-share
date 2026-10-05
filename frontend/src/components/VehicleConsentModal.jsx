import React from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2, X, AlertTriangle, EyeOff, UserCheck } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function VehicleConsentModal({ isOpen, onClose, onAccept, isAccepted }) {
  const { isTh } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                {isTh
                  ? 'หนังสือขอความยินยอมจัดเก็บและตรวจสอบข้อมูลยานพาหนะ'
                  : 'Vehicle Verification & Data Processing Consent'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isTh
                  ? 'ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA Notice)'
                  : 'In compliance with Personal Data Protection Act (PDPA)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            title={isTh ? "ปิด" : "Close"}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 leading-relaxed font-normal">
          {/* Highlight Badge */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-amber-950 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isTh
                  ? 'ทำไมแพลตฟอร์มจึงต้องขอภาพถ่ายป้ายทะเบียนรถ?'
                  : 'Why do we require a photo of your vehicle license plate?'}
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-normal">
              {isTh
                ? 'เนื่องจาก Iko Share เป็นแพลตฟอร์มร่วมเดินทาง (Carpool) เพื่อสร้างความปลอดภัยและความมั่นใจสูงสุดให้แก่เพื่อนร่วมทางทุกคน ระบบจึงจำเป็นต้องตรวจสอบว่ารถยนต์ที่นำมาลงทะเบียนมีอยู่จริง ไม่มีการสวมทะเบียน และตรงกับข้อมูลที่ระบุไว้ในระบบ'
                : 'Because Iko Share connects travelers sharing rides, we verify vehicle license plates to ensure vehicle authenticity, eliminate forged plates, and protect passenger safety.'}
            </p>
          </div>

          {/* Section 1: Purpose */}
          <div className="space-y-2">
            <h4 className="font-black text-slate-900 flex items-center gap-2 text-xs">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>{isTh ? '1. วัตถุประสงค์ในการเก็บรวบรวมและประมวลผล' : '1. Purposes of Data Processing'}</span>
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
              <li>
                {isTh
                  ? 'ตรวจสอบความถูกต้องของหมายเลขทะเบียน ยี่ห้อ รุ่น และลักษณะของยานพาหนะ โดยทีมงานผู้ดูแลระบบ (Admin Review)'
                  : 'Verify vehicle license plate, make, model, and physical specifications by authorized administrators'}
              </li>
              <li>
                {isTh
                  ? 'ป้องกันการแอบอ้าง การลงทะเบียนข้อมูลเท็จ หรือการนำรถยนต์ที่ไม่ถูกต้องตามกฎหมายมาให้บริการร่วมเดินทาง'
                  : 'Prevent identity theft, falsified vehicle details, or unauthorized vehicles on the platform'}
              </li>
              <li>
                {isTh
                  ? 'สร้างความปลอดภัยและความน่าเชื่อถือให้แก่ผู้โดยสารที่ทำการจองร่วมเดินทางในทริปนั้นๆ'
                  : 'Provide safety assurance and verification trust badges to passengers'}
              </li>
            </ul>
          </div>

          {/* Section 2: Data Collected */}
          <div className="space-y-2">
            <h4 className="font-black text-slate-900 flex items-center gap-2 text-xs">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>{isTh ? '2. รายการข้อมูลที่ขอจัดเก็บ' : '2. Information Collected'}</span>
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
              <li>
                {isTh
                  ? 'ข้อมูลตัวอักษร: เลขทะเบียนรถ, หมวดจังหวัด, ยี่ห้อ, รุ่น และจำนวนที่นั่งรองรับ'
                  : 'Text details: License plate number, province, make, model, and passenger capacity'}
              </li>
              <li>
                {isTh
                  ? 'ข้อมูลรูปภาพ: ภาพถ่ายป้ายทะเบียนรถยนต์จริง และ/หรือ ภาพถ่ายตัวรถที่แสดงทะเบียนชัดเจน'
                  : 'Image data: Actual photograph of vehicle license plate and exterior'}
              </li>
              <li>
                {isTh
                  ? 'ประวัติและวันเวลาการลงทะเบียน ตลอดจนสถานะการอนุมัติโดยแอดมิน'
                  : 'Timestamp of submission and administrative verification status logs'}
              </li>
            </ul>
          </div>

          {/* Section 3: Privacy & Security */}
          <div className="space-y-2">
            <h4 className="font-black text-slate-900 flex items-center gap-2 text-xs">
              <EyeOff className="w-4 h-4 text-emerald-600" />
              <span>{isTh ? '3. การเก็บรักษาความลับและความปลอดภัยของภาพถ่าย' : '3. Confidentiality & Security Measures'}</span>
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 space-y-1 text-[11px]">
              <p className="font-bold flex items-center gap-1.5 text-emerald-700">
                <Lock className="w-3.5 h-3.5" />
                <span>{isTh ? 'ภาพถ่ายทะเบียนรถจะไม่ถูกเผยแพร่ต่อสาธารณะ' : 'Plate photos are strictly confidential'}</span>
              </p>
              <p>
                {isTh
                  ? 'ภาพถ่ายป้ายทะเบียนที่ท่านอัปโหลดจะถูกเก็บรักษาในระบบคลาวด์ที่มีการเข้ารหัสข้อมูล (Encryption) และถูกนำไปแสดงเฉพาะบนหน้าจอตรวจสอบของแอดมินผู้มีอำนาจเท่านั้น บนหน้าเว็บสำหรับผู้โดยสารทั่วไปจะเห็นเพียงข้อมูลยี่ห้อและเลขทะเบียนที่จำเป็นในการนัดพบ'
                  : 'Your uploaded photos are stored in encrypted cloud storage and accessible solely to authorized administrators. Public users only see verified text plates for meetup identification.'}
              </p>
            </div>
          </div>

          {/* Section 4: Rights */}
          <div className="space-y-2">
            <h4 className="font-black text-slate-900 flex items-center gap-2 text-xs">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>{isTh ? '4. สิทธิของเจ้าของข้อมูลส่วนบุคคล (Your Rights)' : '4. Your Legal PDPA Rights'}</span>
            </h4>
            <p className="text-[11px] text-slate-600">
              {isTh
                ? 'ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ท่านมีสิทธิในการขอเข้าถึง ขอแก้ไข ขอคัดค้าน ขอให้ระงับการใช้ ขอให้ลบหรือทำลายภาพถ่ายยานพาหนะ หรือเพิกถอนความยินยอมได้ทุกเมื่อ โดยสามารถลบรถยนต์คันดังกล่าวออกจากระบบด้วยตนเอง หรือยื่นคำร้องผ่านเมนู "ขอใช้สิทธิข้อมูลส่วนบุคคล (PDPA Rights)"'
                : 'Under the PDPA, you retain the right to access, rectify, erase, object to, or withdraw consent at any time through our PDPA Rights portal or by removing the car from your profile.'}
            </p>
          </div>

          {/* Section 5: Owner Warranty */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 space-y-1 text-[11px]">
            <span className="font-black flex items-center gap-1.5 text-emerald-950">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {isTh ? 'คำรับรองของผู้ลงทะเบียน' : 'Owner Statement'}
            </span>
            <p className="text-emerald-800">
              {isTh
                ? 'ข้าพเจ้ารับรองว่าตนเป็นเจ้าของยานพาหนะ หรือเป็นผู้ครอบครองที่ได้รับความยินยอมอย่างถูกต้องตามกฎหมายในการนำรถยนต์คันนี้มาให้บริการเดินทาง และข้อมูลภาพถ่ายที่แนบมาเป็นภาพจริงของรถยนต์คันที่ใช้ในการเดินทาง'
                : 'I certify that I am the legal owner or authorized operator of this vehicle, and the submitted photo is authentic and accurate.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {isTh
                ? 'การกดยินยอมมีผลผูกพันสำหรับการลงทะเบียนรถยนต์คันนี้'
                : 'Your consent applies specifically to this vehicle registration'}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              {isTh ? 'ปิดหน้าต่าง' : 'Close'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (onAccept) onAccept();
                onClose();
              }}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isTh ? 'ฉันเข้าใจและยินยอมตามเงื่อนไข' : 'I Understand & Agree'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
