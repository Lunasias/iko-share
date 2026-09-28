import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Cookie, CheckCircle2, ChevronRight, Lock, HeartHandshake } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function TermsModal({ isOpen, onClose, initialTab = 'terms' }) {
  const { language } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  const isTh = language === 'th';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {isTh ? 'ข้อกำหนดและนโยบายความเป็นส่วนตัว' : 'Terms & Privacy Policy'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Iko Share Community Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            title="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'terms'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isTh ? 'ข้อกำหนดการใช้งาน' : 'Terms of Service'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pdpa')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'pdpa'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>{isTh ? 'นโยบายความเป็นส่วนตัว (PDPA)' : 'Privacy Policy (PDPA)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cookie')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'cookie'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cookie className="w-4 h-4" />
            <span>{isTh ? 'นโยบายคุกกี้' : 'Cookie Policy'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 font-medium leading-relaxed">
          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl text-emerald-900 space-y-1">
                <div className="font-black text-sm flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-600" />
                  <span>{isTh ? 'หลักการของชุมชน Iko Share' : 'Iko Share Community Principles'}</span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  {isTh
                    ? 'แพลตฟอร์มนี้เป็นสื่อกลางสนับสนุนการแชร์การเดินทางร่วมกันสู่งานอีเวนต์ เทศกาล และการท่องเที่ยว เพื่อแบ่งปันค่าใช้จ่ายอย่างยุติธรรมและสร้างมิตรภาพ ไม่ใช่บริการรถรับจ้างสาธารณะเชิงพาณิชย์'
                    : 'This platform connects travelers heading to events, festivals, and destinations to split travel expenses fairly and build friendship, not as a commercial taxi service.'}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-sm">
                  {isTh ? '1. ข้อตกลงสำหรับผู้ขับขี่ (Driver Terms)' : '1. Driver Obligations'}
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>{isTh ? 'ผู้ขับขี่ต้องมีใบอนุญาตขับขี่รถยนต์ที่ยังไม่หมดอายุตามกฎหมาย' : 'Drivers must hold a valid driver license according to law.'}</li>
                  <li>{isTh ? 'ยานพาหนะต้องมี พ.ร.บ. คุ้มครองผู้ประสบภัยจากรถและมีสภาพพร้อมใช้งานอย่างปลอดภัย' : 'Vehicles must be insured and roadworthy in safe conditions.'}</li>
                  <li>{isTh ? 'การกำหนดค่าใช้จ่ายต้องเป็นไปเพื่อการแบ่งปันค่าน้ำมันและค่าผ่านทางจริงอย่างสมเหตุสมผล' : 'Cost sharing must reflect fair compensation for fuel and tolls.'}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-sm">
                  {isTh ? '2. ข้อตกลงสำหรับผู้ร่วมเดินทาง (Passenger Terms)' : '2. Passenger Obligations'}
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>{isTh ? 'ตรงต่อเวลาตามจุดนัดพบที่ตกลงกันไว้กับผู้ขับขี่' : 'Be punctual at the agreed pickup location.'}</li>
                  <li>{isTh ? 'ให้เกียรติและเคารพกฎระเบียบภายในรถของผู้ขับขี่ (เช่น การสูบบุหรี่ หรือการนำสัตว์เลี้ยงขึ้นรถ)' : 'Respect vehicle etiquette and agreed rules (such as no smoking or pets).'}</li>
                  <li>{isTh ? 'ชำระค่าแชร์การเดินทางตามจำนวนที่ตกลงไว้ในระบบ' : 'Fulfill agreed travel cost contributions.'}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-sm">
                  {isTh ? '3. ความปลอดภัยและระบบตรวจสอบ (Safety & Moderation)' : '3. Safety & Community Standards'}
                </h4>
                <p>
                  {isTh
                    ? 'ห้ามใช้คำหยาบคาย ข่มขู่ คุกคามทางเพศ หรือกระทำการใด ๆ ที่ขัดต่อกฎหมายในห้องแชทและระหว่างเดินทาง ระบบมีระบบรายงานข้อความ (Report) และผู้ดูแลระบบมีสิทธิ์ระงับบัญชีผู้ใช้ทันทีหากพบการละเมิด'
                    : 'Harassment, hate speech, threats, and illegal activities in trip chat or during rides are strictly prohibited and subject to immediate suspension by admins.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'pdpa' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-sm">
                  {isTh ? '1. ข้อมูลส่วนบุคคลที่เราจัดเก็บ (Data We Collect)' : '1. Personal Data We Collect'}
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>{isTh ? 'ข้อมูลบัญชีผู้ใช้: ชื่อผู้ใช้ (User), อีเมล, หมายเลขโทรศัพท์ และรูปภาพโปรไฟล์' : 'Account details: User name, email address, phone number, and profile avatar.'}</li>
                  <li>{isTh ? 'ข้อมูลการเดินทาง: รายละเอียดการเปิดทริป, ประวัติการจอง, ข้อมูลยานพาหนะ (รุ่นและทะเบียนรถ)' : 'Trip details: Created trips, booking history, vehicle model, and license plate.'}</li>
                  <li>{isTh ? 'ข้อมูลการสื่อสาร: ข้อความในห้องแชทของทริป และข้อคิดเห็นการให้คะแนนรีวิว' : 'Communications: In-trip chat messages and mutual review ratings.'}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-sm">
                  {isTh ? '2. วัตถุประสงค์ในการประมวลผลข้อมูล (Purpose of Processing)' : '2. Purpose of Processing'}
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>{isTh ? 'เพื่อให้บริการระบบคาร์พูล ยืนยันตัวตน และจับคู่ผู้ร่วมเดินทาง' : 'To facilitate ride sharing, authentication, and member coordination.'}</li>
                  <li>{isTh ? 'เพื่อการติดต่อสื่อสารและการนัดพบระหว่างผู้ขับขี่และผู้โดยสาร' : 'For pickup coordination between drivers and passengers.'}</li>
                  <li>{isTh ? 'เพื่อความปลอดภัยและการตรวจสอบกรณีเกิดข้อร้องเรียนหรือพฤติกรรมไม่เหมาะสม' : 'For member safety, moderation, and handling reports.'}</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-sm">
                  {isTh ? '3. สิทธิของเจ้าของข้อมูลส่วนบุคคล (Your Rights)' : '3. Your Data Rights'}
                </h4>
                <p>
                  {isTh
                    ? 'คุณมีสิทธิ์เข้าถึง แก้ไข หรือขอลบข้อมูลบัญชีผู้ใช้ของคุณได้ตลอดเวลา โดยสามารถส่งคำขอผ่านหน้าบริการช่วยเหลือ (Support / Forgot Password) ในระบบ ซึ่งทีมงานจะดำเนินการลบข้อมูลของคุณออกจากฐานข้อมูลอย่างปลอดภัย'
                    : 'You have the right to access, rectify, or request deletion of your account at any time via our Help & Support portal.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'cookie' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-black text-slate-900 text-sm">
                  {isTh ? '1. คุกกี้คืออะไร? (What Are Cookies)' : '1. What Are Cookies?'}
                </h4>
                <p>
                  {isTh
                    ? 'คุกกี้คือไฟล์ข้อความขนาดเล็กที่จัดเก็บบนอุปกรณ์ของคุณ เพื่อช่วยให้ระบบจดจำสถานะการเข้าใช้งานและมอบประสบการณ์ที่ดีที่สุดในการใช้งานเว็บไซต์'
                    : 'Cookies are small text files stored on your device that remember your session and preferences to improve your experience.'}
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isTh ? 'คุกกี้ที่จำเป็นอย่างยิ่ง (Strictly Necessary Cookies)' : 'Strictly Necessary Cookies'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isTh
                      ? 'จำเป็นต่อการรักษาความปลอดภัย การเข้าสู่ระบบ (JWT Token) และการยืนยันตัวตนในระบบ ไม่สามารถปิดการใช้งานได้'
                      : 'Essential for authentication tokens (JWT) and platform security. Cannot be disabled.'}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isTh ? 'คุกกี้จดจำการตั้งค่า (Preference Cookies)' : 'Preference Cookies'}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isTh
                      ? 'ใช้จดจำภาษาที่เลือก (ไทย/อังกฤษ) และการยินยอมคุกกี้ เพื่อให้คุณไม่ต้องเลือกใหม่ทุกครั้งที่เข้าชม'
                      : 'Remembers your preferred language and cookie choices so you don’t have to re-select each visit.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 travel-btn-primary text-xs font-bold shadow-sm"
          >
            {isTh ? 'รับทราบและเข้าใจแล้ว' : 'I Understand'}
          </button>
        </div>
      </div>
    </div>
  );
}
