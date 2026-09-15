import React, { useState, useEffect } from 'react';
import API from '../services/api';
import CarLoader from '../components/CarLoader';
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
    return <CarLoader text="กำลังโหลดข้อมูลยานพาหนะ..." />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
          <Car className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            ระบบลงทะเบียนรถยนต์ (Car Registration)
          </h2>
          <p className="text-xs text-slate-500 font-medium">ลงทะเบียนรถของคุณเพื่อปลดล็อกการสร้างเที่ยวเดินทางในฐานะคนขับ</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-3 font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Register New Car Form */}
      <div className="travel-card p-6 sm:p-8 space-y-4 border border-slate-200 shadow-xs">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Plus className="w-5 h-5 text-emerald-600" />
          <span>เพิ่มข้อมูลรถยนต์คันใหม่</span>
        </h3>

        <form onSubmit={handleAddCar} className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">เลขทะเบียนรถ</label>
            <input
              type="text"
              required
              placeholder="เช่น กก-1234 กทม"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="w-full px-4 py-3 travel-input text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">ยี่ห้อ / รุ่นรถ</label>
            <input
              type="text"
              required
              placeholder="เช่น Honda Civic"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-3 travel-input text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">ความจุที่นั่งสูงสุด</label>
            <input
              type="number"
              min="1"
              max="15"
              required
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-4 py-3 travel-input text-xs font-bold text-center"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 travel-btn-primary font-bold text-xs disabled:opacity-50 shadow-sm"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกรถยนต์'}
            </button>
          </div>
        </form>
      </div>

      {/* Car List */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
          รายการรถยนต์ที่ลงทะเบียนแล้ว ({cars.length} คัน)
        </h3>

        {cars.length === 0 ? (
          <div className="travel-card p-8 text-center text-slate-500 text-xs space-y-2 border border-slate-200">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="font-bold text-slate-900 text-sm">ยังไม่มีข้อมูลรถยนต์ในระบบ</p>
            <p className="text-xs">คุณต้องลงทะเบียนรถยนต์อย่างน้อย 1 คันก่อน จึงจะสามารถเปิดเส้นทางให้บริการได้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cars.map((car) => (
              <div key={car.license_plate} className="travel-card p-5 space-y-3 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="font-mono text-base font-bold text-slate-900">{car.license_plate}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteCar(car.license_plate)}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 text-xs flex items-center gap-1 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบ</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-2 border-t border-slate-200 font-medium">
                  <div>รุ่นรถ: <span className="font-bold text-slate-900">{car.model}</span></div>
                  <div>ความจุ: <span className="font-bold text-emerald-700">{car.capacity} ที่นั่ง</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
