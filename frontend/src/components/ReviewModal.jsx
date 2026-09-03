import React, { useState } from 'react';
import API from '../services/api';
import { Star, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReviewModal({ isOpen, onClose, tripId, targetUserId, targetName }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await API.post('/reviews', {
        trip_id: tripId,
        target_user_id: targetUserId,
        rating: parseInt(rating),
        comment,
      });

      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      } else {
        setError(String(res.data.message || 'ไม่สามารถส่งรีวิวได้'));
      }
    } catch (err) {
      console.error('Review submit error:', err);
      setError(String(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการส่งรีวิว'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="neu-card max-w-md w-full p-6 sm:p-8 relative space-y-4">
        <button onClick={onClose} className="absolute top-5 right-5 text-slate-500 hover:text-[#3D4852]">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-black text-[#3D4852] font-['Plus_Jakarta_Sans',sans-serif]">ให้คะแนนและรีวิวผู้ร่วมเดินทาง</h3>
        <p className="text-xs text-[#6B7280]">ให้คะแนนประสบการณ์เดินทางของคุณกับ <span className="font-bold text-[#6C63FF]">{targetName}</span></p>

        {success ? (
          <div className="p-4 rounded-2xl bg-[#38B2AC]/10 border border-[#38B2AC]/20 text-[#2C7A7B] text-xs font-bold text-center flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8" />
            <span>ขอบคุณสำหรับคะแนนและรีวิวของคุณ!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Rating Stars */}
            <div className="flex justify-center items-center gap-3 py-3 neu-inset">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star className={`w-7 h-7 ${star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#3D4852]">ความคิดเห็นเพิ่มเติม (Optional)</label>
              <textarea
                rows="3"
                placeholder="แบ่งปันความประทับใจเกี่ยวกับความตรงต่อเวลา อัธยาศัย หรือความปลอดภัย..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 neu-input text-xs resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 neu-button-primary font-bold text-xs disabled:opacity-50"
            >
              {submitting ? 'กำลังส่งรีวิว...' : 'บันทึกคะแนนรีวิว'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
