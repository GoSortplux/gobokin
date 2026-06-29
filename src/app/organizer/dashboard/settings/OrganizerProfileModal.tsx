"use client";
import React, { useState, useEffect } from "react";
import { X, Save, Globe, Zap, FileText } from "lucide-react";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { OrganizerProfile } from "@/types";

interface OrganizerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: OrganizerProfile | null;
  onUpdate: () => void;
}

const OrganizerProfileModal = ({ isOpen, onClose, profile, onUpdate }: OrganizerProfileModalProps) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    slug: "",
    bio: "",
    website: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        slug: profile.slug || "",
        bio: profile.bio || "",
        website: profile.website || "",
      });
    }
  }, [profile, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      Swal.showLoading();
      await api.patch("/events/my-organizer-profile", formData);
      Swal.fire('Success!', 'Profile updated successfully.', 'success');
      onUpdate();
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
              <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">
                Edit <span className="text-white not-italic">Organizer Profile</span>
              </h2>
              <p className="text-white/70 text-[11px] sm:text-sm font-medium">Public Information</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-6 sm:space-y-7 overflow-y-auto no-scrollbar flex-1">
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Organizer Slug</label>
                <div className="relative">
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    required
                    className="w-full pl-12 pr-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    placeholder="my-cool-org"
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-medium ml-2">This is your unique handle on the platform.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Website URL</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="url"
                    className="w-full pl-12 pr-6 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Public Biography</label>
              <div className="relative">
                 <textarea
                    rows={4}
                    className="w-full p-6 bg-gray-50 border border-gray-200 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all leading-relaxed placeholder:font-medium"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    placeholder="Tell the world about your organization..."
                 />
                 <FileText className="absolute right-6 top-6 text-gray-100" size={48} />
              </div>
              <p className="text-[10px] text-gray-400 font-medium ml-2 italic">*This biography appears on all your event detail pages.</p>
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
              form="profile-form"
              type="submit"
              disabled={saving}
              className="px-6 sm:px-10 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerProfileModal;
