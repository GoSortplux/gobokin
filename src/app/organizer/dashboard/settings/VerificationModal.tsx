"use client";
import React, { useState } from "react";
import { X, Save, Globe, Award, Calendar, Users, Briefcase, Share2, CheckSquare, Square } from "lucide-react";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const VerificationModal = ({ isOpen, onClose, onSuccess }: VerificationModalProps) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    experience: "",
    eventCount: 0,
    maxCapacity: 0,
    specialization: "",
    website: "",
    socialMedia: "",
    isIndependent: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (formData.eventCount < 0 || formData.maxCapacity < 0) {
      Swal.fire('Error', 'Event count and capacity must be positive numbers.', 'error');
      return;
    }

    setSaving(true);
    try {
      Swal.showLoading();
      await api.post("/events/become-an-organizer", formData);
      Swal.fire('Success!', 'Your verification application has been submitted successfully.', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      Swal.fire('Error', translateError(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white w-full max-w-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary p-5 sm:p-7 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">
                Organizer <span className="text-white not-italic">Verification</span>
              </h2>
              <p className="text-white/70 text-[11px] sm:text-sm font-medium">Apply to become a verified organizer</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-6 sm:space-y-7 overflow-y-auto no-scrollbar flex-1">
          <form id="verify-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Event Count */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Events Organized</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full pl-12 pr-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
                    value={formData.eventCount}
                    onChange={(e) => setFormData({...formData, eventCount: parseInt(e.target.value) || 0})}
                    placeholder="e.g. 10"
                  />
                </div>
              </div>

              {/* Max Capacity */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Largest Event Capacity</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="number"
                    required
                    min="0"
                    className="w-full pl-12 pr-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
                    value={formData.maxCapacity}
                    onChange={(e) => setFormData({...formData, maxCapacity: parseInt(e.target.value) || 0})}
                    placeholder="e.g. 500"
                  />
                </div>
              </div>

              {/* Website */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Portfolio/Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="url"
                    required
                    className="w-full pl-12 pr-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              {/* Social Media */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Primary Social Handle</label>
                <div className="relative">
                  <Share2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
                    value={formData.socialMedia}
                    onChange={(e) => setFormData({...formData, socialMedia: e.target.value})}
                    placeholder="@yourhandle"
                  />
                </div>
              </div>
            </div>

            {/* Specialization */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Specialization</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-5 text-gray-400" size={18} />
                <textarea
                  rows={2}
                  required
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  placeholder="e.g. Corporate Events, Weddings, Concerts"
                />
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Detailed Experience</label>
              <textarea
                rows={4}
                required
                className="w-full p-6 bg-gray-50 border border-gray-200 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all leading-relaxed placeholder:font-medium"
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                placeholder="Tell us about your background and experience as an event organizer..."
              />
            </div>

            {/* Independent Checkbox */}
            <div
              className="p-6 bg-gray-50 rounded-2xl border border-transparent hover:border-primary/10 transition-all cursor-pointer flex items-center justify-between group"
              onClick={() => setFormData({...formData, isIndependent: !formData.isIndependent})}
            >
              <div className="flex items-center gap-4">
                <div className="text-primary group-hover:scale-110 transition-transform">
                  {formData.isIndependent ? <CheckSquare size={24} /> : <Square size={24} />}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Independent Organizer</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Are you applying as an individual or organization?</p>
                </div>
              </div>
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
              form="verify-form"
              type="submit"
              disabled={saving}
              className="px-6 sm:px-10 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? "Submitting..." : "Apply Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;
