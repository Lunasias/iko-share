import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { X, Star, Car, Phone, ShieldCheck, User, Calendar, AlertCircle, FileText } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="neu-card max-w-lg w-full p-6 sm:p-8 relative space-y-6 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-500 hover:text-[#3D4852] transition-colors">
          <X className="w-6 h-6" />
        </button>

        {loading ? (
          <div className="text-center py-12 space-y-3">
            <div className="inline-block w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#6B7280] text-xs font-semibold">กำลังโหลดโปรไฟล์เจ้าของทริป...</p>
          </div>
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
                <img src={data.owner.avatar_url} alt={data.owner.name} className="w-20 h-20 rounded-full object-cover neu-pill" />
              ) : (
                <div className="w-20 h-20 rounded-full neu-inset text-[#6C63FF] flex items-center justify-center text-2xl font-black">
                  {data.owner.name ? data.owner.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-xl font-black text-[#3D4852] font-['Plus_Jakarta_Sans',sans-serif]">{data.owner.name}</h3>
                  <span className="bg-[#6C63FF]/20 text-[#5A52E0] px-2.5 py-0.5 rounded-full text-[10px] font-bold neu-pill">
                    {data.owner.role}
                  </span>
                </div>

                {data.owner.phone && (
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-xs text-[#6C63FF] font-bold">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{data.owner.phone}</span>
                  </div>
                )}

                <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-1 text-amber-600 font-bold neu-pill px-3 py-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{data.avgRating} ({data.reviewCount} รีวิว)</span>
                  </div>
                  <div className="neu-pill px-3 py-1 text-[#3D4852] font-semibold">
                    สร้างทริปแล้ว <span className="font-bold text-[#6C63FF]">{data.tripsCreatedCount}</span> เที่ยว
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Description Section */}
            <div className="p-4 neu-inset space-y-1.5">
              <div className="text-xs font-bold text-[#6C63FF] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>คำอธิบายตัวตน / Bio</span>
              </div>
              <p className="text-xs text-[#3D4852] italic leading-relaxed">
                "{data.owner.bio || 'ยังไม่มีคำอธิบายตัวตน'}"
              </p>
            </div>

            {/* Vehicle Details */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-extrabold text-[#3D4852] uppercase tracking-wider flex items-center gap-1.5">
                <Car className="w-4 h-4 text-[#38B2AC]" />
                <span>ข้อมูลรถยนต์ที่ลงทะเบียน ({data.cars.length} คัน)</span>
              </h4>

              {data.cars.length === 0 ? (
                <div className="p-3 neu-inset text-[#6B7280] text-xs font-medium">ยังไม่มีข้อมูลรถยนต์</div>
              ) : (
                <div className="space-y-2">
                  {data.cars.map((c) => (
                    <div key={c.license_plate} className="p-3 neu-inset flex items-center justify-between text-xs">
                      <div>
                        <div className="font-extrabold text-[#3D4852]">{c.model}</div>
                        <div className="text-[10px] text-[#6B7280] font-mono">ทะเบียน: {c.license_plate}</div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#38B2AC]/20 text-[#2C7A7B] text-[10px] font-bold neu-pill">
                        {c.capacity} ที่นั่ง
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews List */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-[#3D4852] uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>รีวิวและความเห็นจากผู้โดยสาร</span>
              </h4>

              {data.reviews.length === 0 ? (
                <div className="p-3 neu-inset text-[#6B7280] text-xs font-medium">ยังไม่มีความคิดเห็นจากผู้ใช้งาน</div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {data.reviews.map((rev) => (
                    <div key={rev.review_id} className="p-3 neu-inset space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#6C63FF]">{rev.reviewer_name}</span>
                        <span className="flex items-center gap-0.5 text-amber-600 font-bold text-[10px]">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{rev.rating} / 5</span>
                        </span>
                      </div>
                      {rev.comment && <p className="text-[#3D4852] text-[11px] italic">"{rev.comment}"</p>}
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
