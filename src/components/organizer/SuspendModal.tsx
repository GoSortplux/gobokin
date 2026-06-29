"use client";
import React, { useState } from "react";
import { X, AlertTriangle, Clock, Info, Shield } from "lucide-react";

interface SuspendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; pauseScope: string; resumeAt?: string }) => Promise<void>;
  title: string;
  type: "event" | "ticket";
}

const SuspendModal: React.FC<SuspendModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  type
}) => {
  const [reason, setReason] = useState("Capacity review");
  const [pauseScope, setPauseScope] = useState("ALL_CHANNELS");
  const [resumeAt, setResumeAt] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm({
        reason,
        pauseScope,
        resumeAt: resumeAt ? new Date(resumeAt).toISOString() : undefined,
      });
      onClose();
    } catch (error) {
      console.error("Suspension failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white w-full max-w-md rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-amber-600 p-5 sm:p-7 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">{title}</h2>
              <p className="text-white/70 text-[11px] sm:text-sm font-medium">Suspension Setup</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-6 sm:space-y-7 overflow-y-auto no-scrollbar flex-1">
          <form id="suspend-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Info size={12} className="text-amber-500" />
                Reason for suspension
              </label>
              <textarea
                required
                className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-amber-500 transition-all resize-none"
                placeholder="e.g. Capacity review, Technical maintenance..."
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Shield size={12} className="text-amber-500" />
                Pause Scope
              </label>
              <select
                className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none appearance-none"
                value={pauseScope}
                onChange={(e) => setPauseScope(e.target.value)}
              >
                <option value="ALL_CHANNELS">All Channels</option>
                <option value="ONLINE_ONLY">Online Only</option>
                <option value="WALK_IN_ONLY">Walk-in Only</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Clock size={12} className="text-amber-500" />
                Auto-Resume Date (Optional)
              </label>
              <input
                type="datetime-local"
                className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none"
                value={resumeAt}
                onChange={(e) => setResumeAt(e.target.value)}
              />
              <p className="text-[10px] text-gray-400 font-medium italic ml-1">If left blank, you must resume manually.</p>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-7 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 shrink-0">
          <div className="flex justify-end gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              form="suspend-form"
              type="submit"
              disabled={loading}
              className="px-6 sm:px-10 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-amber-600 text-white font-black text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-xl shadow-amber-900/20 hover:shadow-amber-900/30 hover:-translate-y-0.5 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Suspend ${type === 'event' ? 'Registration' : 'Sales'}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuspendModal;
