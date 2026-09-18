import React, { useState } from 'react';
import API from '../services/api';
import { Star, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReviewModal({ isOpen, onClose, tripId, targetUserId, targetName, existingReview }) {
  const [rating, setRating] = useState(existingReview ? existingReview.rating : 5);
  const [comment, setComment] = useState(existingReview ? (existingReview.comment || '') : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const isEditing = Boolean(existingReview);

  // Reset state when the modal opens again for a different target.
  React.useEffect(() => {
    if (isOpen) {
      setRating(existingReview ? existingReview.rating : 5);
      setComment(existingReview ? (existingReview.comment || '') : '');
      setError('');
      setSuccess(false);
    }
  }, [isOpen, targetUserId, existingReview]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overlay-enter">
      <div className="travel-card modal-enter max-w-md w-full p-6 sm:p-8 relative space-y-4 border border-slate-200 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
          {isEditing ? 'แก้ไขรีวิว' : 'ให้คะแนนและรีวิวเพื่อนร่วมทาง'}
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          แชร์ความประทับใจที่คุณมีต่อ <span className="font-bold text-emerald-700">{targetName}</span>
        </p>

        {success ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
            <span>ขอบคุณสำหรับคะแนนและรีวิวของคุณ!</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Rating Stars */}
            <div className="flex justify-center items-center gap-3 py-3 bg-slate-50 rounded-2xl border border-slate-200">
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
              <label className="text-xs font-bold text-slate-800">ความคิดเห็นเพิ่มเติม (Optional)</label>
              <textarea
                rows="3"
                placeholder="แบ่งปันความประทับใจเกี่ยวกับความตรงต่อเวลา อัธยาศัยดี หรือความปลอดภัย..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 travel-input text-xs resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 travel-btn-primary font-bold text-xs disabled:opacity-50 shadow-sm"
            >
              {submitting ? 'กำลังบันทึกรีวิว...' : isEditing ? 'บันทึกการแก้ไขรีวิว' : 'บันทึกคะแนนรีวิว'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
