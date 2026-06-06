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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="p-8 md:p-10 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-sm border border-primary/20">
                <User size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Complete Your Profile</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Organizer Setup</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-300 hover:text-gray-500 transition-colors bg-gray-50 rounded-xl">
              <X size={24} />
            </button>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl">
             <p className="text-sm text-blue-700 font-medium leading-relaxed">
                Welcome to the organizer community! Please take a moment to set up your public profile and default refund policies for your future events.
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
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

            <div className="pt-4 flex flex-col md:flex-row gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-5 bg-primary text-white font-black text-sm rounded-2xl shadow-xl shadow-primary/20 hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                {loading ? "Saving..." : "Save and Continue"}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-5 px-10 bg-gray-50 text-gray-500 font-black text-sm rounded-2xl hover:bg-gray-100 transition-all"
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateOrganizerProfileModal;
