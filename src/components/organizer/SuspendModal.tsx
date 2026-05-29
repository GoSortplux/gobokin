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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm border border-amber-100">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Suspension Setup</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-300 hover:text-gray-500 transition-colors bg-gray-50 rounded-xl">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="pt-4 flex flex-col gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-amber-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-amber-900/20 hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? "Processing..." : `Suspend ${type === 'event' ? 'Registration' : 'Sales'}`}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-5 bg-gray-50 text-gray-500 font-black text-sm rounded-2xl hover:bg-gray-100 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuspendModal;
