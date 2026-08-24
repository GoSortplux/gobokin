"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Star, X, User, MessageSquare, ChevronLeft, ChevronRight, BarChart2 } from "lucide-react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import { translateError } from "@/utils/errors";

interface SessionRatingsSummary {
  sessionId: string;
  sessionTitle: string;
  averageRating: number;
  totalRatings: number;
  relevantAttendees: number;
  eventTotalAttendees: number;
  responseRate: number;
  attendanceBasis: string;
  ratingDistribution: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
}

interface RatingFeedbackItem {
  id?: string;
  rating: number;
  feedback?: string;
  createdAt?: string;
  user?: {
    fullName?: string;
    email?: string;
  };
}

interface SessionRatingsModalProps {
  sessionId: string;
  sessionTitle: string;
  isOpen: boolean;
  onClose: () => void;
  summary?: SessionRatingsSummary | null;
}

const SessionRatingsModal: React.FC<SessionRatingsModalProps> = ({
  sessionId,
  sessionTitle,
  isOpen,
  onClose,
  summary: initialSummary
}) => {
  const [summary, setSummary] = useState<SessionRatingsSummary | null>(initialSummary || null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Paginated Ratings & Feedback
  const [ratings, setRatings] = useState<RatingFeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchRatings = useCallback(async () => {
    if (!sessionId || !isOpen) return;
    try {
      setLoading(true);
      const res = await api.get(`/events/organizer/sessions/${sessionId}/ratings`, {
        params: { page, limit }
      });
      const data = res.data?.data || res.data || [];
      const pagination = res.data?.pagination || {};

      if (Array.isArray(data)) {
        setRatings(data);
      } else if (data && Array.isArray(data.items || data.ratings)) {
        setRatings(data.items || data.ratings);
      } else {
        setRatings([]);
      }

      setTotalPages(pagination.pages || pagination.totalPages || 1);
      setTotalCount(pagination.total || pagination.totalResults || (Array.isArray(data) ? data.length : 0));
    } catch (err) {
      console.error("Failed to fetch session ratings:", err);
      setRatings([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId, isOpen, page, limit]);

  useEffect(() => {
    if (isOpen) {
      if (!initialSummary) {
        setSummaryLoading(true);
        api.get(`/events/organizer/sessions/${sessionId}/ratings/summary`)
          .then(res => {
            setSummary(res.data?.data || res.data);
          })
          .catch(err => {
            console.error("Failed to fetch summary:", err);
          })
          .finally(() => setSummaryLoading(false));
      } else {
        setSummary(initialSummary);
      }
      fetchRatings();
    }
  }, [isOpen, sessionId, initialSummary, fetchRatings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2.5 py-1 rounded-md">
              Session Ratings Analytics
            </span>
            <h3 className="text-xl font-bold text-gray-900 mt-1 line-clamp-1">
              {summary?.sessionTitle || sessionTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1">
          {/* Summary Cards and Star Breakdown */}
          {summaryLoading ? (
            <div className="py-12 flex justify-center"><CustomLoader /></div>
          ) : summary ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Average Rating Box */}
                <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-100 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                    <Star size={28} className="fill-amber-400" />
                    <span className="text-3xl font-black text-amber-700">{summary.averageRating?.toFixed(1) || "0.0"}</span>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-600/80">Average Star Rating</p>
                </div>

                {/* Total Ratings */}
                <div className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-blue-700 mb-1">{summary.totalRatings || 0}</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600/80">Total Ratings Submitted</p>
                </div>

                {/* Response Rate */}
                <div className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-emerald-700 mb-1">{summary.responseRate?.toFixed(1) || "0"}%</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80">
                    Response Rate ({summary.relevantAttendees || 0} Attended)
                  </p>
                </div>
              </div>

              {/* Rating Distribution Bar Charts */}
              {summary.ratingDistribution && (
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3 flex items-center gap-2">
                    <BarChart2 size={16} className="text-primary" />
                    Rating Distribution Breakdown
                  </h4>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = summary.ratingDistribution[String(stars) as keyof typeof summary.ratingDistribution] || 0;
                    const percent = summary.totalRatings > 0 ? (count / summary.totalRatings) * 100 : 0;
                    return (
                      <div key={stars} className="flex items-center gap-3 text-xs font-semibold">
                        <div className="flex items-center gap-1 w-12 shrink-0 text-gray-700">
                          <span>{stars}</span>
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                        </div>
                        <div className="flex-1 h-3 bg-gray-200/80 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <span className="w-12 text-right text-gray-500 text-[11px] font-medium">{count} ({percent.toFixed(0)}%)</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}

          {/* Guest Feedback Comments List */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <MessageSquare size={16} className="text-primary" />
              Guest Ratings & Comments
            </h4>

            {loading ? (
              <div className="py-12 flex justify-center"><CustomLoader /></div>
            ) : ratings.length > 0 ? (
              <div className="space-y-3">
                {ratings.map((item, index) => (
                  <div key={item.id || index} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {item.user?.fullName?.[0] || <User size={14} />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{item.user?.fullName || "Verified Guest"}</p>
                          {item.createdAt && (
                            <p className="text-[10px] text-gray-400 font-medium">{new Date(item.createdAt).toLocaleString()}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-amber-700">{item.rating} / 5</span>
                      </div>
                    </div>

                    {item.feedback && (
                      <p className="text-xs text-gray-700 font-medium pl-10 leading-relaxed italic">
                        &quot;{item.feedback}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <MessageSquare className="mx-auto mb-2 text-gray-300" size={32} />
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">No ratings or feedback comments yet</p>
                <p className="text-[11px] text-gray-400 mt-1">Ratings submitted by checked-in attendees will appear here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs font-medium shrink-0">
            <span className="text-gray-500">
              Page {page} of {totalPages} ({totalCount} Ratings)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionRatingsModal;
