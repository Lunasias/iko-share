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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-sky-500/30 shadow-2xl relative space-y-4">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white">ให้คะแนนและรีวิวผู้ร่วมเดินทาง</h3>
        <p className="text-xs text-slate-300">ให้คะแนนประสบการณ์เดินทางของคุณกับ <span className="font-bold text-sky-300">{targetName}</span></p>

        {success ? (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm text-center flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8" />
            <span>ขอบคุณสำหรับคะแนนและรีวิวของคุณ!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Rating Stars */}
            <div className="flex justify-center items-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star className={`w-8 h-8 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">ความคิดเห็นเพิ่มเติม (Optional)</label>
              <textarea
                rows="3"
                placeholder="แบ่งปันความประทับใจเกี่ยวกับความตรงต่อเวลา อัธยาศัย หรือความปลอดภัย..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
            >
              {submitting ? 'กำลังส่งรีวิว...' : 'บันทึกคะแนนรีวิว'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
