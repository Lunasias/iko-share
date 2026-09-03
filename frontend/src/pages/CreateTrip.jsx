import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, MapPin, Calendar, Clock, Users, DollarSign, Car, FileText, AlertCircle } from 'lucide-react';

export default function CreateTrip() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState(4);
  const [price, setPrice] = useState(0);
  const [carModel, setCarModel] = useState('');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const departureTime = `${date}T${time}:00`;
      const res = await API.post('/trips', {
        origin,
        destination,
        departure_time: departureTime,
        seats,
        price,
        car_model: carModel,
        notes,
      });

      if (res.data.success) {
        navigate('/my-trips');
      } else {
        setError(String(res.data.message || 'ไม่สามารถเปิดการเดินทางได้'));
      }
    } catch (err) {
      console.error('Create trip error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการสร้างเที่ยวเดินทาง'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-10 px-4">
      <div className="glass-card p-8 rounded-3xl border border-sky-500/20 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-sky-500/20 text-sky-400 mb-2">
            <PlusCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">เปิดการเดินทางใหม่ (คาร์พูล)</h2>
          <p className="text-sm text-slate-400">แชร์ที่นั่งว่างของคุณและต้อนรับเพื่อนร่วมทาง</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">ต้นทาง</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
                <MapPin className="w-5 h-5 text-sky-400 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="เช่น กรุงเทพฯ (อนุสาวรีย์)"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">ปลายทาง</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
                <MapPin className="w-5 h-5 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  required
                  placeholder="เช่น เชียงใหม่ (อาเขต)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">วันที่เดินทาง</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
                <Calendar className="w-5 h-5 text-sky-400 shrink-0" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:outline-none w-full text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">เวลาออกเดินทาง</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:outline-none w-full text-slate-300"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">จำนวนที่นั่งว่าง</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
                <Users className="w-5 h-5 text-emerald-400 shrink-0" />
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">ค่าโดยสาร / ที่นั่ง (บาท)</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
                <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
                <input
                  type="number"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">รุ่น / ยี่ห้อรถยนต์</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl glass-input">
                <Car className="w-5 h-5 text-purple-400 shrink-0" />
                <input
                  type="text"
                  placeholder="เช่น Honda Civic"
                  value={carModel}
                  onChange={(e) => setCarModel(e.target.value)}
                  className="bg-transparent border-none text-white text-sm focus:outline-none w-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">หมายเหตุ หรือรายละเอียดเพิ่มเติม</label>
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl glass-input">
              <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <textarea
                rows="3"
                placeholder="เงื่อนไขการเดินทาง กระเป๋าสัมภาระ สัตว์เลี้ยง จุดนัดพบเพิ่มเติม..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-transparent border-none text-white text-sm focus:outline-none w-full resize-none"
              ></textarea>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
          >
            {loading ? 'กำลังเปิดการเดินทาง...' : 'บันทึกเปิดการเดินทาง'}
          </button>
        </form>
      </div>
    </div>
  );
}
