"use client";
import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  CheckCircle2,
  Zap,
  CreditCard,
  FileText,
  Save,
  ArrowRight,
  ChevronDown,
  Globe,
  User,
  ExternalLink,
  Clock
} from "lucide-react";
import api from "@/services/api";
import { OrganizerProfile } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import OrganizerProfileModal from "./OrganizerProfileModal";

const OrganizerSettings = () => {
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    defaultRefundType: "PARTIAL" as "FULL" | "PARTIAL" | "NONE",
    defaultRefundPercentage: 80,
    defaultRefundCutoffDays: 7,
  });

  useEffect(() => {
    fetchProfile();
    fetchSubscriptions();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/my-organizer-profile");
      const data = response.data.data;
      setProfile(data);
      setFormData({
        defaultRefundType: data.defaultRefundType || "PARTIAL",
        defaultRefundPercentage: data.defaultRefundPercentage || 80,
        defaultRefundCutoffDays: data.defaultRefundCutoffDays || 7,
      });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const response = await api.get("/events/my-subscriptions");
      setSubscriptions(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      Swal.showLoading();
      await api.patch("/events/my-organizer-profile", formData);
      Swal.fire('Success!', 'Default policies updated successfully.', 'success');
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
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Fee Rate</p>
                     <p className="text-lg font-black text-gray-900">{profile?.commissionRate}%</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                     <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Max Staff</p>
                     <p className="text-lg font-black text-gray-900">{profile?.maxStaff}</p>
                  </div>
               </div>

               <div className="mt-4 space-y-3">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                     <div className="text-left">
                        <p className="text-[8px] text-emerald-600 font-black uppercase tracking-widest mb-1">Available</p>
                        <p className="text-lg font-black text-emerald-700">
                           {profile?.wallet?.currency === 'NGN' ? '₦' : (profile?.wallet?.currency || '₦')}
                           {profile?.wallet?.availableBalance.toLocaleString() || '0'}
                        </p>
                     </div>
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                        <CreditCard size={18} />
                     </div>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                     <div className="text-left">
                        <p className="text-[8px] text-amber-600 font-black uppercase tracking-widest mb-1">Pending</p>
                        <p className="text-lg font-black text-amber-700">
                           {profile?.wallet?.currency === 'NGN' ? '₦' : (profile?.wallet?.currency || '₦')}
                           {profile?.wallet?.pendingBalance.toLocaleString() || '0'}
                        </p>
                     </div>
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm">
                        <Clock size={18} />
                     </div>
                  </div>
               </div>

               <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="mt-8 w-full bg-primary/5 text-primary font-black py-4 rounded-2xl hover:bg-primary hover:text-white transition-all border border-primary/10 flex items-center justify-center gap-2 group shadow-sm"
               >
                  <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                  Edit Profile Information
               </button>
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
            {/* Profile Preview Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-8 lg:p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center">
                        <User size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-gray-900">Public Profile</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">What your audience sees</p>
                     </div>
                  </div>
                  <button
                     onClick={() => setIsEditModalOpen(true)}
                     className="flex items-center gap-2 text-primary font-black px-4 py-2 rounded-xl hover:bg-primary/5 transition-all text-sm"
                  >
                     <Settings size={16} />
                     Edit Profile
                  </button>
               </div>
               <div className="p-8 lg:p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Profile URL / Slug</p>
                        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-md">
                           <Zap size={16} className="text-gray-400" />
                           <span className="text-sm font-bold text-gray-900">gobokin.com/organizer/{profile?.slug || '...'}</span>
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Website</p>
                        {profile?.website ? (
                           <a
                              href={profile.website}
                              target="_blank"
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-md"
                           >
                              <div className="flex items-center gap-2">
                                 <Globe size={16} className="text-gray-400" />
                                 <span className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{profile.website}</span>
                              </div>
                              <ExternalLink size={14} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                           </a>
                        ) : (
                           <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm font-bold text-gray-400 italic">
                              No website added
                           </div>
                        )}
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Public Biography</p>
                     <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 min-h-[100px]">
                        <p className="text-sm font-medium text-gray-600 leading-relaxed whitespace-pre-wrap">
                           {profile?.bio || "You haven't added a biography yet. Tell your audience about your organization to build trust."}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            <form onSubmit={handleUpdate} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-8 lg:p-10 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <FileText size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-gray-900">Event Policies</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Global Default Settings</p>
                     </div>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="hidden md:flex items-center gap-2 bg-primary text-white font-black px-6 py-3 rounded-2xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 text-sm disabled:opacity-50"
                  >
                     <Save size={18} />
                     Save Policies
                  </button>
               </div>

               <div className="p-6 md:p-8 lg:p-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Default Refund Type</label>
                        <div className="relative">
                           <select
                              className="w-full p-5 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                              value={formData.defaultRefundType}
                              onChange={(e) => setFormData({...formData, defaultRefundType: e.target.value as "FULL" | "PARTIAL" | "NONE"})}
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

               <div className="p-8 lg:p-10 bg-gray-50 md:hidden">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-primary text-white font-black py-4 rounded-[2rem] hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                  >
                     <Save size={18} />
                     Save Policies
                  </button>
               </div>
            </form>

            {/* Subscriptions Section */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-8 lg:p-10 border-b border-gray-50">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                        <CreditCard size={24} />
                     </div>
                     <h3 className="text-xl font-black text-gray-900">Active Subscriptions</h3>
                  </div>
               </div>
               <div className="p-6 md:p-8 lg:p-10">
                  {subscriptions.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subscriptions.map((sub, index) => (
                           <div key={index} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4 group hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform">
                                 <CheckCircle2 size={20} />
                              </div>
                              <span className="font-bold text-gray-900">{sub}</span>
                           </div>
                        ))}
                     </div>
                  ) : (
                     <div className="text-center py-12 space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                           <CreditCard size={32} />
                        </div>
                        <p className="text-gray-500 font-medium">No active subscriptions found.</p>
                        <button className="text-primary font-bold hover:underline text-sm">Explore Subscription Plans</button>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>

      <OrganizerProfileModal
         isOpen={isEditModalOpen}
         onClose={() => setIsEditModalOpen(false)}
         profile={profile}
         onUpdate={fetchProfile}
      />
    </div>
  );
};

export default OrganizerSettings;
