import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Car, Image, Save, AlertCircle, CheckCircle, Star, Plus, Trash2, FileText } from 'lucide-react';

export default function Profile() {
  const { user, checkAuth } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [role, setRole] = useState('Passenger');
  const [bio, setBio] = useState('');

  const [stats, setStats] = useState({ tripsCreated: 0, tripsJoined: 0 });
  const [avgRating, setAvgRating] = useState('0.0');
  const [reviewCount, setReviewCount] = useState(0);
  const [reviews, setReviews] = useState([]);

  // Car management state inside profile
  const [cars, setCars] = useState([]);
  const [licensePlate, setLicensePlate] = useState('');
  const [carModel, setCarModel] = useState('');
  const [capacity, setCapacity] = useState(4);

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
        setRole(u.role || 'Passenger');
        setBio(u.bio || 'ยังไม่มีคำอธิบายตัวตน');
        setStats(res.data.stats || { tripsCreated: 0, tripsJoined: 0 });

        const userId = u.user_id || u.id;
        const reviewRes = await API.get(`/reviews/user/${userId}`);
        if (reviewRes.data.success) {
          setAvgRating(reviewRes.data.avgRating);
          setReviewCount(reviewRes.data.reviewCount);
          setReviews(reviewRes.data.reviews || []);
        }

        const carsRes = await API.get('/cars/my');
        if (carsRes.data.success) {
          setCars(carsRes.data.cars || []);
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await API.put('/profile', {
        name,
        phone,
        avatar_url: avatarUrl,
        role,
        bio,
      });

      if (res.data.success) {
        setSuccessMsg(String(res.data.message || 'บันทึกข้อมูลโปรไฟล์สำเร็จ'));
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

  const handleAddCar = async (e) => {
    e.preventDefault();
    if (!licensePlate || !carModel) return;
    setError('');
    setSuccessMsg('');

    try {
      const res = await API.post('/cars', {
        license_plate: licensePlate,
        model: carModel,
        capacity: parseInt(capacity),
      });

      if (res.data.success) {
        setSuccessMsg('เพิ่มรถยนต์เรียบร้อยแล้ว');
        setLicensePlate('');
        setCarModel('');
        setCapacity(4);
        fetchProfileData();
      } else {
        setError(String(res.data.message));
      }
    } catch (err) {
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการเพิ่มรถ'));
    }
  };

  const handleDeleteCar = async (plate) => {
    if (!window.confirm(`ต้องการลบข้อมูลรถทะเบียน ${plate} หรือไม่?`)) return;
    try {
      const res = await API.delete(`/cars/${plate}`);
      if (res.data.success) {
        setSuccessMsg(String(res.data.message));
        fetchProfileData();
      }
    } catch (err) {
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการลบรถ'));
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
      {/* Header Summary */}
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
              {role}
            </span>
          </div>

          <p className="text-sm text-slate-400">{user?.email}</p>
          <p className="text-xs text-sky-200 italic">"{bio}"</p>

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
      </div>

      {/* Profile Form & Role Switcher */}
      <div className="glass-card p-8 rounded-3xl border border-white/10 shadow-2xl space-y-6">
        <h3 className="text-lg font-bold text-white border-b border-slate-700/60 pb-3">ตั้งค่าโปรไฟล์ & สลับบทบาทผู้ใช้งาน</h3>

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

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Role Toggle Switcher */}
          <div className="space-y-1.5 p-4 rounded-2xl glass-panel">
            <label className="text-xs font-bold text-sky-300 uppercase tracking-wider">สลับบทบาทผู้ใช้งาน (Role Switcher)</label>
            <div className="grid grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setRole('Passenger')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  role === 'Passenger' ? 'bg-sky-500/30 border-sky-400 text-sky-200 shadow-lg shadow-sky-500/20' : 'glass-input text-slate-400'
                }`}
              >
                ผู้โดยสาร (Passenger)
              </button>
              <button
                type="button"
                onClick={() => setRole('Driver')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  role === 'Driver' ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-500/20' : 'glass-input text-slate-400'
                }`}
              >
                คนขับรถ (Driver)
              </button>
              <button
                type="button"
                onClick={() => setRole('Both')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  role === 'Both' ? 'bg-purple-500/30 border-purple-400 text-purple-200 shadow-lg shadow-purple-500/20' : 'glass-input text-slate-400'
                }`}
              >
                ทั้งสองอย่าง (Both)
              </button>
            </div>
          </div>

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
            <label className="text-xs font-semibold text-slate-300">คำอธิบายตัวตน / Bio</label>
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl glass-input">
              <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <textarea
                rows="3"
                placeholder="อธิบายสไตล์การขับรถ ความตรงต่อเวลา สิ่งที่ชอบ หรือข้อแนะนำในการเดินทาง..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full resize-none"
              ></textarea>
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

      {/* Integrated Car Management (Shown for Driver or Both) */}
      {(role === 'Driver' || role === 'Both') && (
        <div className="glass-card p-8 rounded-3xl border border-emerald-500/20 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <h3 className="text-lg font-bold text-emerald-300 flex items-center gap-2">
              <Car className="w-5 h-5" />
              <span>จัดการข้อมูลรถยนต์ของคุณ (Car Registration)</span>
            </h3>
          </div>

          <form onSubmit={handleAddCar} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              required
              placeholder="ทะเบียนรถ (เช่น กก-1234)"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="px-3 py-2 rounded-xl glass-input text-xs"
            />
            <input
              type="text"
              required
              placeholder="ยี่ห้อ/รุ่นรถ (เช่น Honda Civic)"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              className="px-3 py-2 rounded-xl glass-input text-xs"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="15"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-20 px-3 py-2 rounded-xl glass-input text-xs"
              />
              <button
                type="submit"
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มรถ</span>
              </button>
            </div>
          </form>

          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-slate-300">รถยนต์ที่ลงทะเบียนแล้ว ({cars.length} คัน):</div>
            {cars.length === 0 ? (
              <div className="p-3 rounded-xl glass-panel text-slate-400 text-xs">ยังไม่มีรถยนต์ที่ลงทะเบียนไว้</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cars.map((c) => (
                  <div key={c.license_plate} className="p-3 rounded-xl glass-panel flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-white">{c.model}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ทะเบียน: {c.license_plate}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                        {c.capacity} ที่นั่ง
                      </span>
                      <button
                        onClick={() => handleDeleteCar(c.license_plate)}
                        className="text-red-400 hover:text-red-300 p-1"
                        title="ลบรถ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
