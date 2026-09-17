import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import CarLoader from '../components/CarLoader';
import { User, Phone, Car, Camera, Save, AlertCircle, ShieldAlert, CheckCircle, Star, Plus, Trash2, FileText, Upload, Sparkles } from 'lucide-react';

export default function Profile() {
  const { user, checkAuth } = useAuth();

  const isAdminAccount = !!user && (user.email === 'admin@ikoshare.com' || user.is_admin);

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

  const fileInputRef = useRef(null);

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
        setBio(u.bio === 'ยังไม่มีคำอธิบายตัวตน' ? '' : (u.bio || ''));
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

  // Direct image file upload to Base64 (User request: "ภาพโปรไฟล์ อยากใส่ภาพได้เลยไม่ต้องแปลงเป็น URL")
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('ขนาดไฟล์ภาพต้องไม่เกิน 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result);
      setSuccessMsg('เลือกรูปโปรไฟล์เรียบร้อยแล้ว กดบันทึกเพื่ออัปเดต');
    };
    reader.readAsDataURL(file);
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
        bio: bio || 'ยังไม่มีคำอธิบายตัวตน',
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
    return <CarLoader text="กำลังโหลดโปรไฟล์นักเดินทางของคุณ..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Fun Travel Profile Hero Banner */}
      <div className="travel-card p-6 sm:p-8 profile-hero text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 text-center sm:text-left">
          {/* Avatar with Direct Photo Upload Button */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl" />
            ) : (
              <div className="w-28 h-28 rounded-full bg-white text-emerald-700 flex items-center justify-center text-4xl font-black border-4 border-white shadow-xl">
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">เปลี่ยนรูป</span>
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 p-2 bg-white text-emerald-700 rounded-full shadow-md hover:scale-110 transition-transform"
              title="อัปโหลดรูปภาพโปรไฟล์จากเครื่อง"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white">{name || 'นักเดินทาง Iko Share'}</h2>
              <span className="bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-0.5 rounded-full text-xs font-bold">
                {role === 'Driver' ? '🚗 คนขับรถ' : role === 'Both' ? '🌟 คนขับ & ผู้โดยสาร' : '🎒 ผู้โดยสาร'}
              </span>
            </div>

            <p className="text-sm text-emerald-100 font-medium">{user?.email}</p>
            <p className="text-xs text-white/90 italic max-w-lg">
              "{bio || 'แชร์การเดินทาง สร้างมิตรภาพท่องเที่ยวไปด้วยกัน'}"
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs">
              <div className="flex items-center gap-1 bg-amber-400 text-amber-950 font-black px-3 py-1 rounded-xl shadow-sm">
                <Star className="w-4 h-4 fill-amber-950" />
                <span>{avgRating} ({reviewCount} รีวิว)</span>
              </div>
              <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl text-white font-bold border border-white/20">
                เปิดทริปแล้ว {stats.tripsCreated} เที่ยว
              </div>
              <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl text-white font-bold border border-white/20">
                ร่วมทริปแล้ว {stats.tripsJoined} เที่ยว
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-3 shadow-sm">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Edit Profile Form (High Contrast & Clear Placeholders) */}
      <div className="travel-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-4">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-black text-slate-900">แก้ไขข้อมูลโปรไฟล์ & สลับบทบาท (Settings)</h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Role Toggle Switcher */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">สลับบทบาทของคุณ (Role Switcher)</label>
            <div className="grid grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setRole('Passenger')}
                className={`py-3 px-3 rounded-xl font-bold text-xs transition-all border ${
                  role === 'Passenger' ? 'role-passenger shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                ผู้โดยสาร (Passenger)
              </button>
              <button
                type="button"
                onClick={() => setRole('Driver')}
                className={`py-3 px-3 rounded-xl font-bold text-xs transition-all border ${
                  role === 'Driver' ? 'role-driver shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                คนขับรถ (Driver)
              </button>
              <button
                type="button"
                onClick={() => setRole('Both')}
                className={`py-3 px-3 rounded-xl font-bold text-xs transition-all border ${
                  role === 'Both' ? 'role-both shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                ทั้งสองอย่าง (Both)
              </button>
            </div>
            {isAdminAccount && (
              <p className="text-[11px] text-amber-700 font-bold flex items-center gap-1.5 pt-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>สิทธิ์ผู้ดูแลระบบแยกจากบทบาทการเดินทาง และจัดการได้จากหน้า Admin</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">ชื่อผู้ใช้ (USER)</label>
              <div className="flex items-center gap-2 px-4 py-3 travel-input">
                <User className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="เช่น สมชาย ใจดี หรือ Somchai_Traveler"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">เบอร์โทรศัพท์ติดต่อ</label>
              <div className="flex items-center gap-2 px-4 py-3 travel-input">
                <Phone className="w-5 h-5 text-slate-400 shrink-0" />
                <input
                  type="tel"
                  placeholder="เช่น 081-234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Bio Description (Placeholder guidance) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">ประวัติส่วนตัว / คำอธิบายตัวตน (Bio)</label>
            <div className="flex items-start gap-2 px-4 py-3 travel-input">
              <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <textarea
                rows="3"
                placeholder="เช่น สายชิล ชอบฟังเพลงแจ๊ส ตรงต่อเวลา ชอบแวะถ่ายรูประหว่างทาง..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-transparent border-none text-slate-900 text-sm focus:outline-none w-full resize-none placeholder:text-slate-400 font-medium"
              ></textarea>
            </div>
          </div>

          {/* Direct File Photo Upload Option */}
          <div className="space-y-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>อัปโหลดรูปภาพโปรไฟล์จากเครื่องโดยตรง (ไม่ต้องแปลงเป็น URL)</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-300 text-xs shadow-sm flex items-center gap-2"
              >
                <Camera className="w-4 h-4 text-emerald-600" />
                <span>เลือกรูปถ่ายจากเครื่อง</span>
              </button>
              {avatarUrl && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> ได้เลือกรูปภาพแล้ว
                </span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 travel-btn-primary font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'กำลังบันทึกข้อมูล...' : 'บันทึกการเปลี่ยนแปลง'}</span>
          </button>
        </form>
      </div>

      {/* Integrated Car Management (Shown for Driver or Both) */}
      {(role === 'Driver' || role === 'Both') && (
        <div className="travel-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-600" />
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
              className="px-4 py-3 travel-input text-xs"
            />
            <input
              type="text"
              required
              placeholder="ยี่ห้อ/รุ่นรถ (เช่น Honda Civic)"
              value={carModel}
              onChange={(e) => setCarModel(e.target.value)}
              className="px-4 py-3 travel-input text-xs"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="15"
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-24 px-3 py-3 travel-input text-xs font-bold text-center"
              />
              <button
                type="submit"
                className="flex-1 travel-btn-primary text-xs flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มรถ</span>
              </button>
            </div>
          </form>

          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-slate-700">รถยนต์ที่ลงทะเบียนไว้ ({cars.length} คัน):</div>
            {cars.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs text-center font-medium">
                ยังไม่มีรถยนต์ที่ลงทะเบียนไว้ กรุณาเพิ่มรถยนต์เพื่อสร้างเที่ยวเดินทาง
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cars.map((c) => (
                  <div key={c.license_plate} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-extrabold text-slate-900">{c.model}</div>
                      <div className="text-xs text-slate-600 font-mono font-bold">ทะเบียน: {c.license_plate}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                        {c.capacity} ที่นั่ง
                      </span>
                      <button
                        onClick={() => handleDeleteCar(c.license_plate)}
                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50"
                        title="ลบรถ"
                      >
                        <Trash2 className="w-4 h-4" />
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
