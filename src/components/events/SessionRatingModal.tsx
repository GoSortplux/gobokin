"use client";
import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import api from '@/services/api';
import Swal from "@/utils/sweetalert";
import { translateError } from '@/utils/errors';
import CustomLoader from '@/components/CustomLoader';

interface SessionRatingModalProps {
  sessionId: string;
  sessionTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onRatingSubmitted: (rating: number, feedback?: string) => void;
}

const SessionRatingModal: React.FC<SessionRatingModalProps> = ({
  sessionId,
  sessionTitle,
  isOpen,
  onClose,
  onRatingSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      Swal.fire('Rating Required', 'Please select a star rating between 1 and 5.', 'warning');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/events/sessions/${sessionId}/rating`, {
        rating,
        feedback: feedback.trim() || undefined
      });

      Swal.fire('Thank You!', 'Your rating has been submitted successfully.', 'success');
      onRatingSubmitted(rating, feedback.trim());
      onClose();
    } catch (error) {
      console.error('Error submitting session rating:', error);
      Swal.fire('Submission Failed', translateError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 transform transition-all">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-md">
              Session Rating
            </span>
            <h3 className="text-xl font-bold text-gray-900 mt-1 line-clamp-1">
              {sessionTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-9 h-9 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="text-center space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              How would you rate this session?
            </label>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((starValue) => {
                const active = starValue <= (hover || rating);
                return (
                  <button
                    type="button"
                    key={starValue}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHover(starValue)}
                    onMouseLeave={() => setHover(0)}
                    disabled={loading}
                    className="p-1.5 focus:outline-none transition-transform hover:scale-125 active:scale-95"
                  >
                    <Star
                      size={36}
                      className={`${
                        active ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                      } transition-colors duration-200`}
                    />
                  </button>
                );
              })}
            </div>
            {(hover || rating) > 0 && (
              <p className="text-sm font-bold text-amber-600 animate-in fade-in">
                {hover || rating} out of 5 Stars
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="feedback" className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Feedback Comments <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="feedback"
              rows={4}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 text-gray-800 text-sm font-medium outline-none transition-all resize-none"
              placeholder="Share your thoughts about the presentation, speakers, or key takeaways..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={loading}
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0}
              className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:brightness-110 transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
            >
              {loading ? <CustomLoader size={18} /> : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SessionRatingModal;
