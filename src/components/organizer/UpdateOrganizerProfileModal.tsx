"use client";
import React, { useState } from "react";
import { X, User, Globe, FileText, ShieldCheck, ArrowRight, Percent, Clock } from "lucide-react";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

interface UpdateOrganizerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const UpdateOrganizerProfileModal: React.FC<UpdateOrganizerProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    slug: "",
    bio: "",
    website: "",
    defaultRefundType: "PARTIAL",
    defaultRefundPercentage: 50,
    defaultRefundCutoffDays: 3
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Percentage') || name.includes('Days') ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch("/events/my-organizer-profile", formData);
      await Swal.fire({
        title: "Profile Updated!",
        text: "Your organizer profile and default policies have been saved.",
        icon: "success",
        confirmButtonColor: "#295FA7",
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Profile update failed:", error);
      Swal.fire("Error", translateError(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
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
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Complete Your Profile</h2>
              <p className="text-white/70 text-[11px] sm:text-sm font-medium">Organizer Setup</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-6 sm:space-y-7 overflow-y-auto no-scrollbar flex-1">
          <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl">
             <p className="text-sm text-blue-700 font-medium leading-relaxed">
                Welcome to the organizer community! Please take a moment to set up your public profile and default refund policies for your future events.
             </p>
          </div>

          <form id="profile-form" onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <User size={12} className="text-primary" />
                  Organizer Slug (URL)
                </label>
                <input
                  type="text"
                  name="slug"
                  required
                  placeholder="my-cool-org"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all"
                  value={formData.slug}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Globe size={12} className="text-primary" />
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  placeholder="https://newsite.com"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all"
                  value={formData.website}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <FileText size={12} className="text-primary" />
                Bio
              </label>
              <textarea
                name="bio"
                required
                className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all resize-none"
                placeholder="Tell us about your organization..."
                rows={3}
                value={formData.bio}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-6 pt-4 border-t border-gray-100">
               <div>
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Default Refund Policy</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <ShieldCheck size={12} className="text-primary" />
                        Refund Type
                      </label>
                      <select
                        name="defaultRefundType"
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none appearance-none"
                        value={formData.defaultRefundType}
                        onChange={handleChange}
                      >
                        <option value="FULL">Full Refund</option>
                        <option value="PARTIAL">Partial Refund</option>
                        <option value="NONE">No Refund</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Percent size={12} className="text-primary" />
                        Percentage
                      </label>
                      <input
                        type="number"
                        name="defaultRefundPercentage"
                        disabled={formData.defaultRefundType === 'NONE'}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary disabled:opacity-50"
                        value={formData.defaultRefundPercentage}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Clock size={12} className="text-primary" />
                        Cutoff Days
                      </label>
                      <input
                        type="number"
                        name="defaultRefundCutoffDays"
                        disabled={formData.defaultRefundType === 'NONE'}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary disabled:opacity-50"
                        value={formData.defaultRefundCutoffDays}
                        onChange={handleChange}
                      />
                    </div>
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
              Skip for now
            </button>
            <button
              form="profile-form"
              type="submit"
              disabled={loading}
              className="px-6 sm:px-10 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? "Saving..." : "Save and Continue"}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateOrganizerProfileModal;
