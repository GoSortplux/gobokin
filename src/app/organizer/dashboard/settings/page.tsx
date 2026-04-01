"use client";
import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Globe,
  Shield,
  CheckCircle2,
  Zap,
  CreditCard,
  FileText,
  AlertCircle,
  Save,
  ArrowRight,
  MoreVertical,
  ChevronDown
} from "lucide-react";
import api from "@/services/api";
import { OrganizerProfile } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

const OrganizerSettings = () => {
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bio: "",
    website: "",
    defaultRefundType: "PARTIAL" as any,
    defaultRefundPercentage: 80,
    defaultRefundCutoffDays: 7,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/my-organizer-profile");
      setProfile(response.data.data);
      setFormData({
        bio: response.data.data.bio || "",
        website: response.data.data.website || "",
        defaultRefundType: response.data.data.defaultRefundType || "PARTIAL",
        defaultRefundPercentage: response.data.data.defaultRefundPercentage || 80,
        defaultRefundCutoffDays: response.data.data.defaultRefundCutoffDays || 7,
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      Swal.showLoading();
      await api.patch("/events/my-organizer-profile", formData);
      Swal.fire('Success!', 'Organizer profile updated successfully.', 'success');
      fetchProfile();
    } catch (error) {
      Swal.fire('Error', translateError(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 px-2">
      <div>
        <h1 className="text-4xl font-black text-primary tracking-tight">Organizer Settings</h1>
        <p className="text-gray-500 font-medium mt-1">Manage your profile, default policies, and verification status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Profile Summary Card */}
         <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 text-center relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl"></div>
               <div className="w-24 h-24 bg-primary text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-4xl font-black shadow-xl shadow-primary/20">
                  {profile?.bio?.[0] || 'O'}
               </div>
               <h3 className="text-2xl font-black text-gray-900 leading-tight mb-2">Verified Organizer</h3>
               <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                  <Shield size={12} />
                  {profile?.status}
               </div>

               <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-50">
               <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Fee Rate</p>
                     <p className="text-xl font-black text-gray-900">{profile?.commissionRate}%</p>
                  </div>
                  <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Max Staff</p>
                     <p className="text-xl font-black text-gray-900">{profile?.maxStaff}</p>
                  </div>
               </div>
            </div>

            <div className="bg-gray-900 rounded-3xl p-8 text-white space-y-6 shadow-xl">
               <h4 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <Zap size={20} className="text-amber-400" />
                  Upgrade Potential
               </h4>
               <p className="text-blue-100 text-sm leading-relaxed">Achieve <span className="text-white font-bold underline">VERIFIED</span> status to unlock the lowest commission rate (2.5%) and instant T+1 payouts.</p>
               <button className="w-full bg-white text-gray-900 font-black py-4 rounded-[2rem] hover:bg-primary hover:text-white transition-all shadow-lg text-sm flex items-center justify-center gap-2 group">
                  Apply for Verification
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
               </button>
            </div>
         </div>

         {/* Settings Form */}
         <div className="lg:col-span-2 space-y-8">
            <form onSubmit={handleUpdate} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-8 lg:p-10 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center">
                        <User size={24} />
                     </div>
                     <h3 className="text-xl font-black text-gray-900">General Information</h3>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="hidden md:flex items-center gap-2 bg-primary text-white font-black px-6 py-3 rounded-2xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 text-sm disabled:opacity-50"
                  >
                     <Save size={18} />
                     Save Changes
                  </button>
               </div>

               <div className="p-6 md:p-8 lg:p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Organizer Website</label>
                        <div className="relative">
                           <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                           <input
                             type="url"
                             className="w-full pl-12 pr-6 py-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
                             value={formData.website}
                             onChange={(e) => setFormData({...formData, website: e.target.value})}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Public Biography</label>
                     <textarea
                        rows={4}
                        className="w-full p-6 bg-gray-50 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all leading-relaxed placeholder:font-medium"
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                     />
                     <p className="text-[10px] text-gray-400 font-medium ml-2 italic">*This bio appears on your event detail pages for attendees.</p>
                  </div>

                  <div className="pt-8 border-t border-gray-100 space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                           <FileText size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-gray-900">Default Event Policies</h3>
                           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Automatic Refund Settings</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Default Refund Type</label>
                           <div className="relative">
                              <select
                                className="w-full p-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                                value={formData.defaultRefundType}
                                onChange={(e) => setFormData({...formData, defaultRefundType: e.target.value})}
                              >
                                 <option value="FULL">Full Refund</option>
                                 <option value="PARTIAL">Partial Refund</option>
                                 <option value="NONE">No Refunds</option>
                              </select>
                              <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                           </div>
                        </div>
                        {formData.defaultRefundType === 'PARTIAL' && (
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Refund Percentage (%)</label>
                             <input
                               type="number"
                               className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                               value={formData.defaultRefundPercentage}
                               onChange={(e) => setFormData({...formData, defaultRefundPercentage: parseFloat(e.target.value)})}
                             />
                          </div>
                        )}
                        <div className="space-y-3">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cancellation Cutoff (Days)</label>
                           <input
                             type="number"
                             className="w-full p-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                             value={formData.defaultRefundCutoffDays}
                             onChange={(e) => setFormData({...formData, defaultRefundCutoffDays: parseInt(e.target.value)})}
                           />
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-2">Days before event starts</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-8 lg:p-10 bg-gray-50 md:hidden">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-primary text-white font-black py-4 rounded-[2rem] hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                  >
                     <Save size={18} />
                     Save Changes
                  </button>
               </div>
            </form>
         </div>
      </div>
    </div>
  );
};

export default OrganizerSettings;
