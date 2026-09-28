import React, { useState, useRef } from 'react';
import { X, ShieldCheck, Upload, FileText, AlertCircle, CheckCircle2, Lock, Camera, Loader2, ShieldAlert } from 'lucide-react';
import API, { uploadImage } from '../services/api';

export default function VerificationModal({ isOpen, onClose, onSubmitted, currentUserName = '' }) {
  const [documentType, setDocumentType] = useState('id_card');
  const [fullName, setFullName] = useState(currentUserName);
  const [idCardNumber, setIdCardNumber] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedConsent, setAcceptedConsent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 10 MB');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const res = await uploadImage(file);

      const uploadedUrl = res?.url || res?.data?.url;
      if (uploadedUrl) {
        setDocumentUrl(uploadedUrl);
      } else {
        setError(res?.message || 'ไม่สามารถอัปโหลดไฟล์ได้');
      }
    } catch (err) {
      console.error('File upload error:', err);
      setError(err.userFriendlyMessage || err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์');
    } finally {
      setUploading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!documentUrl) {
      setError('กรุณาอัปโหลดรูปภาพหลักฐานยืนยันตัวตน');
      return;
    }
    if (!acceptedConsent) {
      setError('กรุณาทำเครื่องหมายยินยอมข้อตกลงและข้อจำกัดความรับผิดชอบก่อนส่งหลักฐาน');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const res = await API.post('/verification/request', {
        document_type: documentType,
        full_name: fullName,
        id_card_number: idCardNumber,
        document_url: documentUrl,
        additional_notes: additionalNotes,
      });

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onSubmitted) onSubmitted(res.data.request);
          onClose();
        }, 1800);
      }
    } catch (err) {
      console.error('Submit verification error:', err);
      setError(err.response?.data?.message || 'ไม่สามารถส่งคำขอยืนยันตัวตนได้');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                ขอรับตราสัญลักษณ์ความน่าเชื่อถือ (Trust Badge)
              </h3>
              <p className="text-[11px] text-emerald-800 font-semibold">ยืนยันตัวตนเพื่อเพิ่มความมั่นใจให้ผู้ร่วมเดินทาง</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {success ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-black text-slate-900">ส่งหลักฐานยืนยันตัวตนสำเร็จแล้ว!</h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                เจ้าหน้าที่ผู้ดูแลระบบจะตรวจสอบเอกสารและอนุมัติตราสัญลักษณ์ความน่าเชื่อถือให้คุณโดยเร็วที่สุด
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Document Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">ประเภทเอกสารหลักฐาน</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'id_card', label: 'บัตรประชาชน' },
                    { id: 'driving_license', label: 'ใบขับขี่' },
                    { id: 'student_card', label: 'บัตร นศ./พนักงาน' },
                  ].map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setDocumentType(type.id)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition text-center ${
                        documentType === type.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name & ID Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">ชื่อ-นามสกุลจริงตามบัตร</label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น สมชาย ใจดี"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 travel-input text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800">หมายเลขบัตร / เลขประจำตัว</label>
                  <input
                    type="text"
                    placeholder="เช่น 4 หลักท้าย หรือเลขประจำตัว"
                    value={idCardNumber}
                    onChange={(e) => setIdCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 travel-input text-xs"
                  />
                </div>
              </div>

              {/* Upload Proof Document Image */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>รูปถ่ายเอกสารหลักฐาน (หน้าบัตรชัดเจน)</span>
                  <span className="text-[10px] text-slate-500 font-normal">รองรับ JPG, PNG สูงสุด 8MB</span>
                </label>

                {documentUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border border-emerald-300 bg-slate-100 p-2 group">
                    <img
                      src={documentUrl}
                      alt="Uploaded proof"
                      className="w-full h-44 object-contain rounded-xl bg-white"
                    />
                    <div className="absolute top-4 right-4 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-black/70 hover:bg-black text-white text-[11px] font-bold rounded-lg transition"
                      >
                        เปลี่ยนรูป
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocumentUrl('')}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg transition"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition bg-slate-50/70 hover:bg-emerald-50/30 flex flex-col items-center justify-center space-y-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                        <span className="text-xs font-bold text-slate-700">กำลังอัปโหลดรูปภาพ...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-bold text-slate-800">
                          คลิกเพื่อเลือกไฟล์ หรือ ถ่ายรูปหน้าบัตร
                        </div>
                        <p className="text-[11px] text-slate-500">
                          ถ่ายรูปบัตรให้เห็นชื่อ-รูปชัดเจน สามารถปิดบังเลขที่ไม่เกี่ยวข้องได้
                        </p>
                      </>
                    )}
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Additional Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800">หมายเหตุเพิ่มเติม (ถ้ามี)</label>
                <textarea
                  rows="2"
                  placeholder="เช่น ข้อมูลเพิ่มเติมเกี่ยวกับเอกสาร หรือข้อมูลการยืนยันตัวตนอื่น ๆ"
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 travel-input text-xs resize-none"
                />
              </div>

              {/* Legal Consent & Platform Liability Disclaimer */}
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>ข้อกำหนดความยินยอมและข้อจำกัดความรับผิดชอบ (Liability Disclaimer)</span>
                </div>
                <div className="text-[11px] text-amber-950/90 leading-relaxed space-y-1 bg-white/80 p-2.5 rounded-xl border border-amber-100 max-h-28 overflow-y-auto font-medium">
                  <p>
                    1. <strong>ความยินยอมส่งมอบข้อมูล:</strong> ข้าพเจ้ายินยอมส่งมอบภาพถ่ายเอกสารหลักฐานและข้อมูลส่วนบุคคลเพื่อการตรวจสอบความน่าเชื่อถือเบื้องต้นด้วยความสมัครใจ ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
                  </p>
                  <p>
                    2. <strong>สละสิทธิ์เอาผิดเจ้าของเว็บไซต์ (Liability Waiver):</strong> ข้าพเจ้ารับทราบและยินยอมว่า แพลตฟอร์ม Iko Share และเจ้าของเว็บไซต์/ผู้ดูแลระบบ ทำหน้าที่เป็นเพียงสื่อกลางอำนวยความสะดวกในการตรวจสอบเอกสารเบื้องต้นเท่านั้น มิได้รับประกันหรือรับรองพฤติกรรมส่วนบุคคลของผู้ใช้งาน และจะไม่รับผิดชอบต่อความสูญเสีย ความเสียหาย การรั่วไหล อุบัติเหตุ ข้อพิพาท หรือเหตุสุดวิสัยใดๆ ทั้งสิ้นที่เกิดขึ้น ข้าพเจ้าตกลงสละสิทธิ์ในการดำเนินคดี ฟ้องร้อง หรือเรียกร้องค่าเสียหายใดๆ ต่อเจ้าของเว็บไซต์และผู้ดูแลระบบทุกกรณี
                  </p>
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer pt-1 select-none">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedConsent}
                    onChange={(e) => setAcceptedConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300 cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] font-bold text-amber-950 leading-tight">
                    ข้าพเจ้าได้อ่าน เข้าใจ และยอมรับข้อกำหนดการยินยอมส่งข้อมูลและข้อจำกัดความรับผิดชอบข้างต้นทุกประการ (ตกลงสละสิทธิ์เอาผิดเจ้าของเว็บไซต์และผู้ดูแลระบบ)
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading || !documentUrl || !acceptedConsent}
                  className="w-2/3 py-3 travel-btn-primary font-bold rounded-xl text-xs disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังส่งคำขอ...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>ยืนยันและส่งหลักฐาน</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
