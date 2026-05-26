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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Edit Organizer Profile</h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Public Information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white hover:shadow-md rounded-2xl text-gray-400 hover:text-gray-900 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Organizer Slug</label>
              <div className="relative">
                <Zap className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  className="w-full pl-12 pr-6 py-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
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
                  className="w-full pl-12 pr-6 py-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
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
                  className="w-full p-6 bg-gray-50 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all leading-relaxed placeholder:font-medium"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell the world about your organization..."
               />
               <FileText className="absolute right-6 top-6 text-gray-100" size={48} />
            </div>
            <p className="text-[10px] text-gray-400 font-medium ml-2 italic">*This biography appears on all your event detail pages.</p>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
             <button
                type="button"
                onClick={onClose}
                className="px-8 py-4 text-sm font-black text-gray-500 hover:text-gray-900 transition-all"
             >
                Cancel
             </button>
             <button
                type="submit"
                disabled={saving}
                className="bg-primary text-white font-black px-10 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
             >
                <Save size={18} />
                {saving ? "Saving..." : "Save Profile"}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizerProfileModal;
