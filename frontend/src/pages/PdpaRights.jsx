import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import API, { uploadImage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Download, FileText, CheckCircle2, AlertCircle,
  HelpCircle, Lock, Clock, Send, ChevronRight, User, Mail, Phone,
  FileCheck, Trash2, Edit3, PauseCircle, Ban, ArrowRightLeft, Undo2, Loader2, ExternalLink
} from 'lucide-react';

const PDPA_RIGHTS = [
  {
    id: 'access_copy',
    title: '1. สิทธิขอเข้าถึงและรับสำเนาข้อมูล',
    subtitle: 'Right of Access & Copy (มาตรา 30)',
    desc: 'ขอเข้าถึงและรับสำเนาข้อมูลส่วนบุคคลของคุณที่อยู่ในความรับผิดชอบของ Iko Share',
    icon: FileCheck,
    color: 'emerald',
  },
  {
    id: 'erasure',
    title: '2. สิทธิขอให้ลบหรือทำลายข้อมูล',
    subtitle: 'Right to Erasure / Deletion (มาตรา 33)',
    desc: 'ขอลบ ทำลาย หรือทำให้ข้อมูลส่วนบุคคลไม่สามารถระบุตัวตนได้ (เช่น ลบบัญชีผู้ใช้ ประวัติการเดินทาง)',
    icon: Trash2,
    color: 'rose',
  },
  {
    id: 'rectification',
    title: '3. สิทธิขอแก้ไขข้อมูลให้ถูกต้อง',
    subtitle: 'Right to Rectification (มาตรา 35)',
    desc: 'ขอแก้ไขข้อมูลส่วนบุคคลที่ไม่ถูกต้อง ไม่สมบูรณ์ หรือล้าสมัย ให้เป็นปัจจุบันและสมบูรณ์',
    icon: Edit3,
    color: 'amber',
  },
  {
    id: 'restriction',
    title: '4. สิทธิขอให้ระงับการใช้ข้อมูล',
    subtitle: 'Right to Restriction of Processing (มาตรา 34)',
    desc: 'ขอให้ระงับการใช้ข้อมูลส่วนบุคคลชั่วคราวระหว่างการตรวจสอบความถูกต้องหรือการคัดค้าน',
    icon: PauseCircle,
    color: 'slate',
  },
  {
    id: 'objection',
    title: '5. สิทธิคัดค้านการประมวลผลข้อมูล',
    subtitle: 'Right to Object (มาตรา 32)',
    desc: 'คัดค้านการเก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคลของคุณในกรณีที่กฎหมายอนุญาต',
    icon: Ban,
    color: 'red',
  },
  {
    id: 'portability',
    title: '6. สิทธิขอให้โอนย้ายข้อมูลส่วนบุคคล',
    subtitle: 'Right to Data Portability (มาตรา 31)',
    desc: 'ขอรับข้อมูลส่วนบุคคลในรูปแบบที่อ่านได้ด้วยเครื่องคอมพิวเตอร์ และขอให้ส่งโอนไปยังผู้ควบคุมอื่น',
    icon: ArrowRightLeft,
    color: 'teal',
  },
  {
    id: 'withdraw_consent',
    title: '7. สิทธิในการถอนความยินยอม',
    subtitle: 'Right to Withdraw Consent (มาตรา 19)',
    desc: 'ถอนความยินยอมที่คุณเคยให้ไว้ในการเก็บ รวบรวม หรือใช้ข้อมูลส่วนบุคคลได้ตลอดเวลา',
    icon: Undo2,
    color: 'purple',
  },
];

export default function PdpaRights() {
  const { user } = useAuth();

  // Form State
  const [selectedRight, setSelectedRight] = useState('access_copy');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [details, setDetails] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [agreePdpa, setAgreePdpa] = useState(true);

  // Status & Requests
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [downloadingExport, setDownloadingExport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const proofInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      if (!name) setName(user.name || '');
      if (!email) setEmail(user.email || '');
      if (!phone) setPhone(user.phone || '');
      fetchMyRequests();
    }
  }, [user]);

  const fetchMyRequests = async () => {
    try {
      setLoadingRequests(true);
      const res = await API.get('/pdpa/my-requests');
      if (res.data.success) {
        setMyRequests(res.data.requests || []);
      }
    } catch (e) {
      // Ignored for guests
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleExportData = async () => {
    try {
      setDownloadingExport(true);
      setError('');

      const res = await API.get('/pdpa/my-data-export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `iko-share-personal-data-user-${user?.user_id || 'me'}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('ดาวน์โหลดสำเนาข้อมูลส่วนบุคคล (.JSON) สำเร็จเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Export data error:', err);
      setError('ไม่สามารถดาวน์โหลดสำเนาข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setDownloadingExport(false);
    }
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('ขนาดไฟล์ต้องไม่เกิน 10 MB');
      return;
    }

    try {
      setUploadingProof(true);
      setError('');

      const res = await uploadImage(file);

      const uploadedUrl = res?.url || res?.data?.url;
      if (uploadedUrl) {
        setProofUrl(uploadedUrl);
      } else {
        setError(res?.message || 'ไม่สามารถอัปโหลดเอกสารได้');
      }
    } catch (err) {
      console.error('Proof upload error:', err);
      setError(err.userFriendlyMessage || err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการอัปโหลดเอกสารยืนยันตัวตน');
    } finally {
      setUploadingProof(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!agreePdpa) {
      setError('กรุณายินยอมรับทราบเงื่อนไขและกรอบเวลาดำเนินการตามกฎหมาย PDPA');
      return;
    }

    try {
      setSubmitting(true);
      const res = await API.post('/pdpa/requests', {
        requester_name: name,
        requester_email: email,
        requester_phone: phone,
        right_type: selectedRight,
        details,
        identification_proof: proofUrl,
      });

      if (res.data.success) {
        setMessage(res.data.message || 'บันทึกคำร้องขอใช้สิทธิตามกฎหมาย PDPA สำเร็จแล้ว');
        setDetails('');
        setProofUrl('');
        if (user) fetchMyRequests();
      }
    } catch (err) {
      console.error('Submit PDPA request error:', err);
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งคำร้อง');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRightObj = PDPA_RIGHTS.find((r) => r.id === selectedRight) || PDPA_RIGHTS[0];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Page Title & Legal Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>ศูนย์บริหารจัดการสิทธิข้อมูลส่วนบุคคล (PDPA Portal)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          คำร้องขอใช้สิทธิของเจ้าของข้อมูลส่วนบุคคล
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA B.E. 2562) มาตรา 30–36
          ท่านสามารถยื่นคำร้องเพื่อใช้สิทธิทางกฎหมาย หรือดาวน์โหลดสำเนาข้อมูลส่วนบุคคลของท่านได้ทันที
        </p>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-bold flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Instant One-Click Data Export */}
      <div className="travel-card p-6 sm:p-7 border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black tracking-wider uppercase text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
              สิทธิเข้าถึง & โอนย้ายข้อมูลทันที (มาตรา 30 & 31)
            </span>
            <h3 className="text-lg font-black text-slate-900">
              ดาวน์โหลดสำเนาข้อมูลส่วนบุคคลของคุณ (Export My Data)
            </h3>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              รับสำเนาข้อมูลบัญชี, ยานพาหนะ, ประวัติการเปิดทริป, การจองที่นั่ง, ข้อความแชท และรีวิวทั้งหมดของคุณ
              ในรูปแบบไฟล์มาตรฐาน JSON ที่เปิดและโอนย้ายได้ทันที
            </p>
          </div>

          {user ? (
            <button
              type="button"
              onClick={handleExportData}
              disabled={downloadingExport}
              className="inline-flex items-center gap-2 px-5 py-3 travel-btn-primary font-bold text-xs rounded-xl shadow-md shrink-0 disabled:opacity-50"
            >
              {downloadingExport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังรวบรวมข้อมูล...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดสำเนาข้อมูล (.JSON)</span>
                </>
              )}
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-emerald-300 text-emerald-800 font-bold text-xs rounded-xl hover:bg-emerald-50 transition shadow-2xs shrink-0"
            >
              <span>เข้าสู่ระบบเพื่อดาวน์โหลด</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Section 2: Formal Data Subject Request Form (DSAR) */}
      <div className="travel-card p-6 sm:p-8 space-y-6 border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>แบบฟอร์มยื่นคำร้องขอใช้สิทธิตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (DSAR Form)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            โปรดเลือกสิทธิที่ท่านประสงค์จะใช้ และระบุรายละเอียดเพื่อให้เจ้าหน้าที่ดำเนินการตามขั้นตอนกฎหมาย
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Right */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">
              ขั้นตอนที่ 1: เลือกสิทธิของเจ้าของข้อมูลส่วนบุคคลที่ต้องการใช้ *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {PDPA_RIGHTS.map((r) => {
                const IconComponent = r.icon;
                const isSelected = selectedRight === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRight(r.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex items-start gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="text-xs font-black text-slate-900 truncate">{r.title}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">{r.subtitle}</div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-tight">{r.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Selection Highlight */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <selectedRightObj.icon className="w-4 h-4 text-emerald-600" />
              <span>สิทธิที่เลือก: {selectedRightObj.title} ({selectedRightObj.subtitle})</span>
            </div>
            <p className="text-xs text-slate-600">{selectedRightObj.desc}</p>
          </div>

          {/* Step 2: Requester Details */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">
              ขั้นตอนที่ 2: ข้อมูลผู้ยื่นคำร้อง (เจ้าของข้อมูลส่วนบุคคล) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>ชื่อ-นามสกุลจริง *</span>
                </span>
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย ใจดี"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 travel-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>อีเมลติดต่อกลับ *</span>
                </span>
                <input
                  type="email"
                  required
                  placeholder="เช่น yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 travel-input text-xs"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>หมายเลขโทรศัพท์</span>
                </span>
                <input
                  type="tel"
                  placeholder="เช่น 0812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 travel-input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Request Details & Identification */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800">
                ขั้นตอนที่ 3: ระบุรายละเอียดของข้อมูลและคำร้องขอ *
              </label>
              <textarea
                required
                rows="3"
                placeholder="โปรดระบุรายละเอียดของข้อมูลที่ต้องการใช้สิทธิ เช่น ต้องการให้ลบข้อมูลบัญชีและประวัติการเดินทางทั้งหมด, ต้องการแก้ไขหมายเลขโทรศัพท์เป็นหมายเลขใหม่, หรือเหตุผลในการขอใช้สิทธิ"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full px-4 py-3 travel-input text-xs resize-none"
              />
            </div>

            {/* Proof of Identity Upload */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">เอกสารยืนยันตัวตนเจ้าของข้อมูล (ถ้ามี / ไม่บังคับ)</span>
                <span className="text-[10px] text-slate-500">สามารถปิดบังข้อมูลที่ไม่เกี่ยวข้องได้</span>
              </div>

              {proofUrl ? (
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                  <span className="text-emerald-800 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>แนบหลักฐานยืนยันตัวตนเรียบร้อยแล้ว</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setProofUrl('')}
                    className="text-red-600 hover:text-red-800 font-bold"
                  >
                    ลบเอกสาร
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => proofInputRef.current?.click()}
                    disabled={uploadingProof}
                    className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                  >
                    {uploadingProof ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังอัปโหลด...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>แนบสำเนาบัตรยืนยันตัวตน</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-slate-500">เพื่อความถูกต้องในการระบุตัวตนเจ้าของบัญชี</span>
                  <input
                    type="file"
                    ref={proofInputRef}
                    onChange={handleProofUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Legal Acknowledgement Checkbox */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreePdpa}
                onChange={(e) => setAgreePdpa(e.target.checked)}
                className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="leading-relaxed">
                ข้าพเจ้าขอยืนยันว่าเป็นเจ้าของข้อมูลส่วนบุคคลที่ระบุไว้จริง และรับทราบว่า Iko Share จะดำเนินการพิจารณาคำร้องตามเงื่อนไขของพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ภายในระยะเวลาไม่เกิน 30 วันนับแต่วันที่ได้รับคำร้องขอที่ถูกต้องครบถ้วน และตกลงสละสิทธิ์เอาผิดหรือเรียกร้องค่าเสียหายต่อเจ้าของแพลตฟอร์มในทุกกรณี
              </span>
            </label>
          </div>


          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || !agreePdpa}
              className="w-full sm:w-auto px-8 py-3.5 travel-btn-primary font-bold text-xs rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังส่งคำร้อง...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ส่งคำร้องขอใช้สิทธิข้อมูลส่วนบุคคล</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: User's Request History */}
      {user && (
        <div className="travel-card p-6 space-y-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>ประวัติคำร้องขอใช้สิทธิของฉัน</span>
            </h3>
            <button
              type="button"
              onClick={fetchMyRequests}
              className="text-xs text-emerald-700 hover:underline font-bold"
            >
              รีเฟรชสถานะ
            </button>
          </div>

          {loadingRequests ? (
            <div className="p-6 text-center text-xs text-slate-500">กำลังโหลดรายการคำร้อง...</div>
          ) : myRequests.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
              <p className="text-xs text-slate-500 font-medium">ยังไม่มีประวัติการยื่นคำร้องขอใช้สิทธิ</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="py-2.5 px-3">รหัสคำร้อง</th>
                    <th className="py-2.5 px-3">สิทธิที่ขอใช้</th>
                    <th className="py-2.5 px-3">รายละเอียด</th>
                    <th className="py-2.5 px-3">วันที่ยื่น</th>
                    <th className="py-2.5 px-3">สถานะ</th>
                    <th className="py-2.5 px-3">ข้อความตอบกลับจากแอดมิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {myRequests.map((req) => (
                    <tr key={req.request_id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-500">#{req.request_id}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{req.right_title}</td>
                      <td className="py-3 px-3 max-w-xs truncate text-slate-600">{req.details}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                        {new Date(req.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'ดำเนินการแล้วเสร็จ'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : req.status === 'กำลังดำเนินการ'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : req.status === 'ปฏิเสธคำขอ'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {req.admin_reply ? (
                          <span className="text-emerald-800 font-medium">{req.admin_reply}</span>
                        ) : (
                          <span className="text-slate-400 italic">อยู่ระหว่างการดำเนินการ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Section 4: Educational Guide & Rights Breakdown */}
      <div className="travel-card p-6 border border-slate-200 space-y-4 shadow-xs">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          <span>ข้อมูลและกรอบเวลาในการดำเนินการตามกฎหมาย PDPA</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-800">กรอบระยะเวลาในการดำเนินการ</h4>
            <p>
              Iko Share จะพิจารณาและตอบสนองต่อคำร้องของท่านภายใน <strong>30 วัน</strong> นับแต่วันที่ได้รับคำร้องขอที่ครบถ้วนสมบูรณ์ตามที่กฎหมายกำหนด
            </p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-800">การยืนยันตัวตนของผู้ยื่นคำร้อง</h4>
            <p>
              เพื่อความปลอดภัยของข้อมูลเจ้าของบัญชี ระบบอาจขอให้ท่านยืนยันตัวตนเพิ่มเติมก่อนดำเนินการลบหรือเปิดเผยข้อมูลส่วนบุคคล
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
