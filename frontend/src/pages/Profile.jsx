import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Car, Image, Save, AlertCircle, CheckCircle, Star, ShieldCheck } from 'lucide-react';

export default function Profile() {
  const { user, checkAuth } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [stats, setStats] = useState({ tripsCreated: 0, tripsJoined: 0 });
  const [avgRating, setAvgRating] = useState('0.0');
  const [reviewCount, setReviewCount] = useState(0);
  const [reviews, setReviews] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/profile');
      if (res.data.success) {
        const u = res.data.user;
        setName(u.name || '');
        setPhone(u.phone || '');
        setAvatarUrl(u.avatar_url || '');
        setStats(res.data.stats || { tripsCreated: 0, tripsJoined: 0 });

        const userId = u.user_id || u.id;
        const reviewRes = await API.get(`/reviews/user/${userId}`);
        if (reviewRes.data.success) {
          setAvgRating(reviewRes.data.avgRating);
          setReviewCount(reviewRes.data.reviewCount);
          setReviews(reviewRes.data.reviews || []);
        }
      } else {
        setError(String(res.data.message || 'ไม่สามารถดึงข้อมูลโปรไฟล์ได้'));
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดโปรไฟล์'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await API.put('/profile', {
        name,
        phone,
        avatar_url: avatarUrl,
      });

      if (res.data.success) {
        setSuccessMsg(String(res.data.message || 'บันทึกข้อมูลสำเร็จ'));
        if (checkAuth) checkAuth();
      } else {
        setError(String(res.data.message || 'ไม่สามารถบันทึกข้อมูลได้'));
      }
    } catch (err) {
      console.error('Save profile error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการบันทึก'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">กำลังโหลดโปรไฟล์...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      {/* Header Profile Summary */}
      <div className="glass-card p-8 rounded-3xl border border-sky-500/20 shadow-2xl flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-24 h-24 rounded-full object-cover border-2 border-sky-400 shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h2 className="text-2xl font-bold text-white">{name}</h2>
            <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {user?.role}
            </span>
          </div>

          <p className="text-sm text-slate-400">{user?.email}</p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs">
            <div className="flex items-center gap-1 text-amber-400 font-bold glass-panel px-3 py-1 rounded-xl">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>{avgRating} ({reviewCount} รีวิว)</span>
            </div>
            <div className="px-3 py-1 rounded-xl glass-panel text-sky-300">
              สร้างทริป <span className="font-bold text-white">{stats.tripsCreated}</span> เที่ยว
            </div>
            <div className="px-3 py-1 rounded-xl glass-panel text-indigo-300">
              ร่วมทริป <span className="font-bold text-white">{stats.tripsJoined}</span> เที่ยว
            </div>
          </div>
        </div>

        <Link
          to="/cars"
          className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Car className="w-4 h-4" />
          <span>การจัดการรถยนต์</span>
        </Link>
      </div>

      {/* Edit Profile Form */}
      <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-slate-700/60 pb-3">แก้ไขข้อมูลโปรไฟล์</h3>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">ชื่อ - นามสกุล</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
              <User className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">เบอร์โทรศัพท์ติดต่อ</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
              <Phone className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="tel"
                placeholder="0812345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">ลิงก์รูปโปรไฟล์ (Avatar URL)</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
              <Image className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="url"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</span>
          </button>
        </form>
      </div>

      {/* Received Reviews Section */}
      {reviews.length > 0 && (
        <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>รีวิวที่คุณได้รับจากเพื่อนร่วมทาง ({reviews.length})</span>
          </h3>

          <div className="space-y-3">
            {reviews.map((rev) => (
              <div key={rev.review_id} className="p-4 rounded-2xl glass-panel space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="font-bold text-sky-200">{rev.reviewer_name}</div>
                  <div className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{rev.rating} / 5</span>
                  </div>
                </div>
                {rev.comment && <p className="text-xs text-slate-300 italic">"{rev.comment}"</p>}
                <div className="text-[10px] text-slate-500">{new Date(rev.created_at).toLocaleDateString('th-TH')}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
