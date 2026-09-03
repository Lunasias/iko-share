import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Car, Plus, Trash2, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [licensePlate, setLicensePlate] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState(4);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/cars/my');
      if (res.data.success) {
        setCars(res.data.cars || []);
      } else {
        setError(String(res.data.message || 'ไม่สามารถโหลดข้อมูลรถได้'));
      }
    } catch (err) {
      console.error('Fetch cars error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลรถ'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await API.post('/cars', {
        license_plate: licensePlate,
        model,
        capacity: parseInt(capacity),
      });

      if (res.data.success) {
        setSuccessMsg(String(res.data.message || 'เพิ่มข้อมูลรถสำเร็จ'));
        setLicensePlate('');
        setModel('');
        setCapacity(4);
        fetchCars();
      } else {
        setError(String(res.data.message || 'ไม่สามารถลงทะเบียนรถได้'));
      }
    } catch (err) {
      console.error('Add car error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการลงทะเบียนรถ'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCar = async (plate) => {
    if (!window.confirm(`คุณต้องการลบข้อมูลรถทะเบียน ${plate} หรือไม่?`)) return;
    try {
      const res = await API.delete(`/cars/${plate}`);
      if (res.data.success) {
        setSuccessMsg(String(res.data.message));
        fetchCars();
      } else {
        setError(String(res.data.message));
      }
    } catch (err) {
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการลบข้อมูลรถ'));
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 space-y-3">
        <div className="inline-block w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm">กำลังโหลดข้อมูลยานพาหนะ...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-400">
          <Car className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">ระบบลงทะเบียนรถยนต์ (Car Verification)</h2>
          <p className="text-sm text-slate-400">ลงทะเบียนรถของคุณเพื่อปลดล็อกการสร้างเที่ยวเดินทางในฐานะคนขับ</p>
        </div>
      </div>

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

      {/* Register New Car Form */}
      <div className="glass-card p-6 rounded-3xl border border-sky-500/20 shadow-xl space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Plus className="w-5 h-5 text-sky-400" />
          <span>เพิ่มข้อมูลรถยนต์คันใหม่</span>
        </h3>

        <form onSubmit={handleAddCar} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">เลขทะเบียนรถ</label>
            <input
              type="text"
              required
              placeholder="เช่น กก-1234 กทม"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">ยี่ห้อ / รุ่นรถ</label>
            <input
              type="text"
              required
              placeholder="เช่น Honda Civic"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">ความจุที่นั่งสูงสุด</label>
            <input
              type="number"
              min="1"
              max="15"
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl glass-input text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกรถยนต์'}
            </button>
          </div>
        </form>
      </div>

      {/* Car List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-sky-300 border-b border-slate-700/60 pb-2">
          รายการรถยนต์ที่ลงทะเบียนแล้ว ({cars.length} คัน)
        </h3>

        {cars.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center text-slate-400 text-sm space-y-2">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="font-semibold text-amber-300">ยังไม่มีข้อมูลรถยนต์ในระบบ</p>
            <p className="text-xs">คุณต้องลงทะเบียนรถยนต์อย่างน้อย 1 คันก่อน จึงจะสามารถเปิดเส้นทางให้บริการได้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cars.map((car) => (
              <div key={car.license_plate} className="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="font-mono text-lg font-bold text-white">{car.license_plate}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCar(car.license_plate)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบ</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <div>รุ่นรถ: <span className="font-semibold text-white">{car.model}</span></div>
                  <div>ความจุ: <span className="font-semibold text-emerald-400">{car.capacity} ที่นั่ง</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
