import React, { useState, useEffect } from 'react';
import API from '../services/api';
import CarLoader from './CarLoader';
import { X, Star, Car, Phone, ShieldCheck, User, Calendar, AlertCircle, FileText, HeartHandshake } from 'lucide-react';

export default function OwnerProfileModal({ isOpen, onClose, userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      fetchPublicProfile();
    }
  }, [isOpen, userId]);

  const fetchPublicProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get(`/profile/public/${userId}`);
      if (res.data.success) {
        setData(res.data);
      } else {
        setError(String(res.data.message || 'ไม่สามารถโหลดข้อมูลโปรไฟล์ได้'));
      }
    } catch (err) {
      console.error('Fetch public profile error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overlay-enter">
      <div className="travel-card modal-enter max-w-lg w-full p-6 sm:p-8 relative space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <CarLoader text="กำลังโหลดโปรไฟล์สมาชิก..." />
        ) : error || !data ? (
          <div className="text-center py-8 space-y-3 text-red-600">
            <AlertCircle className="w-10 h-10 mx-auto" />
            <p className="text-sm font-bold">{error || 'ไม่พบข้อมูลโปรไฟล์'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Avatar & Basic Info */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              {data.owner.avatar_url ? (
                <img src={data.owner.avatar_url} alt={data.owner.name} className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl font-black border-2 border-emerald-500 shadow-md">
                  {data.owner.name ? data.owner.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-xl font-black text-slate-900">{data.owner.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    data.owner.role === 'Driver' ? 'role-driver' :
                    data.owner.role === 'Both' ? 'role-both' : 'role-passenger'
                  }`}>
                    {data.owner.role === 'Driver' ? 'คนขับ (Driver)' : data.owner.role === 'Both' ? 'คนขับ & ผู้โดยสาร' : 'ผู้โดยสาร (Passenger)'}
                  </span>
                </div>

                {data.owner.phone && (
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-xs text-slate-600 font-medium">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{data.owner.phone}</span>
                  </div>
                )}

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-900 font-black border border-amber-200 px-3 py-1 rounded-xl shadow-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{data.avgRating} ({data.reviewCount} รีวิว)</span>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold">
                    สร้างทริป {data.tripsCreatedCount} เที่ยว
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Description Section */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>คำอธิบายตัวตน / Bio</span>
              </div>
              <p className="text-xs text-slate-700 italic leading-relaxed">
                "{data.owner.bio || 'ยังไม่มีคำอธิบายตัวตน'}"
              </p>
            </div>

            {/* Vehicle Details (if driver has cars) */}
            {data.cars && data.cars.length > 0 && (
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-emerald-600" />
                  <span>ข้อมูลรถยนต์ที่ลงทะเบียน ({data.cars.length} คัน)</span>
                </h4>

                <div className="space-y-2">
                  {data.cars.map((c) => (
                    <div key={c.license_plate} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-extrabold text-slate-900">{c.model}</div>
                        <div className="text-[10px] text-slate-500 font-mono font-bold">ทะเบียน: {c.license_plate}</div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {c.capacity} ที่นั่ง
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>รีวิวและความเห็นจากเพื่อนร่วมเดินทาง</span>
              </h4>

              {data.reviews.length === 0 ? (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs text-center font-medium">
                  ยังไม่มีความคิดเห็นจากผู้ร่วมทริป
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {data.reviews.map((rev) => (
                    <div key={rev.review_id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{rev.reviewer_name}</span>
                        <span className="flex items-center gap-0.5 text-amber-600 font-bold text-[10px]">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{rev.rating} / 5</span>
                        </span>
                      </div>
                      {rev.comment && <p className="text-slate-600 text-[11px] italic">"{rev.comment}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
