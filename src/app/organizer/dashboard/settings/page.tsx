"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Clock,
  Tag,
  PlusCircle,
  Trash2,
  AlertCircle,
  Info,
  Calendar
} from "lucide-react";
import api from "@/services/api";
import { OrganizerProfile, GlobalDiscount, Event, SubscriptionPackage, PackageRule } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import OrganizerProfileModal from "./OrganizerProfileModal";
import GlobalDiscountModal from "./GlobalDiscountModal";

type TabType = 'profile' | 'subscriptions' | 'discounts';

const OrganizerSettings = () => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [discounts, setDiscounts] = useState<GlobalDiscount[]>([]);
  const [events, setEvents] = useState<Record<string, string>>({});
  const [rawEvents, setRawEvents] = useState<Event[]>([]);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountsLoading, setDiscountsLoading] = useState(false);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    profile: true,
    policies: true,
  });

  const [formData, setFormData] = useState({
    defaultRefundType: "PARTIAL" as "FULL" | "PARTIAL" | "NONE",
    defaultRefundPercentage: 80,
    defaultRefundCutoffDays: 7,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    await Promise.all([
        fetchProfile(),
        fetchSubscriptions(),
        fetchDiscounts(),
        fetchEvents(),
        fetchPackages()
    ]);
    setLoading(false);
  };

  const fetchPackages = async () => {
    try {
      setPackagesLoading(true);
      const response = await api.get("/events/admin/packages");
      setPackages(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
    } finally {
      setPackagesLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get("/events/my-events");
      const eventsMap: Record<string, string> = {};
      const eventsData = response.data.data || [];
      setRawEvents(eventsData);
      eventsData.forEach((event: Event) => {
        eventsMap[event.id] = event.title;
      });
      setEvents(eventsMap);
      if (eventsData.length > 0) {
          setSelectedEventId(eventsData[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const fetchDiscounts = async () => {
    try {
      setDiscountsLoading(true);
      const response = await api.get("/events/my-organizer-profile/global-discounts");
      setDiscounts(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch discounts:", error);
    } finally {
      setDiscountsLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
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

  const handleCreateDiscount = async (discountData: {
    code: string;
    discountPercentage: number;
    expiryDate: string;
    maxUsagePerGuest: number;
    maxUsage: number;
    applicableEventIds: string[];
  }) => {
    try {
        setDiscountsLoading(true);
        Swal.showLoading();
        await api.post("/events/my-organizer-profile/global-discounts", discountData);
        Swal.fire('Created!', 'Global discount code created successfully.', 'success');
        setIsDiscountModalOpen(false);
        fetchDiscounts();
    } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
    } finally {
        setDiscountsLoading(false);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    const result = await Swal.fire({
      title: 'Delete Discount?',
      text: 'This code will no longer be valid for use.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      try {
        Swal.showLoading();
        await api.delete(`/events/my-organizer-profile/global-discounts/${id}`);
        Swal.fire('Deleted!', 'Discount code removed successfully.', 'success');
        fetchDiscounts();
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  const handlePurchase = async (packageId: string) => {
    if (!selectedEventId) {
        Swal.fire('Error', 'Please select an event for the subscription.', 'error');
        return;
    }

    try {
        setPurchasingId(packageId);
        Swal.showLoading();
        const response = await api.post("/events/subscriptions/initialize", {
            packageId,
            eventId: selectedEventId
        });

        if (response.data.success && response.data.data.paymentUrl) {
            window.location.href = response.data.data.paymentUrl;
        } else {
            throw new Error("Failed to initialize payment");
        }
    } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
    } finally {
        setPurchasingId(null);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile & Policies', icon: User },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'discounts', label: 'Global Discounts', icon: Tag },
  ];

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 px-2">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
            <h1 className="text-4xl font-black text-primary tracking-tight">Organizer Settings</h1>
            <p className="text-gray-500 font-medium mt-1">Manage your profile, subscriptions, and global discounts.</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex p-1 bg-gray-100 rounded-2xl md:w-fit">
        {tabs.map((tab) => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${
                    activeTab === tab.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
                <tab.icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Profile Summary Card - Persistent on Left? No, following tabbed structure */}
         {/* Actually, let's keep the summary card on the left for all tabs to provide context */}
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
               </div>

               <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="mt-8 w-full bg-primary/5 text-primary font-black py-4 rounded-2xl hover:bg-primary hover:text-white transition-all border border-primary/10 flex items-center justify-center gap-2 group shadow-sm"
               >
                  <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                  Edit Profile
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

         {/* Tab Content */}
         <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                    <motion.div
                        key="profile"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Profile Preview Card */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div
                                onClick={() => toggleSection('profile')}
                                className="p-8 lg:p-10 border-b border-gray-50 flex items-center justify-between bg-gray-50/30 cursor-pointer hover:bg-gray-50/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 text-primary rounded-2xl flex items-center justify-center">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-gray-900">Public Profile</h3>
                                            <ChevronDown
                                                size={20}
                                                className={`text-gray-400 transition-transform duration-300 ${expandedSections.profile ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">What your audience sees</p>
                                    </div>
                                </div>
                            </div>
                            <AnimatePresence>
                                {expandedSections.profile && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
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
                                                        rel="noopener noreferrer"
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
                                </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <form onSubmit={handleUpdate} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div
                                onClick={() => toggleSection('policies')}
                                className="p-8 lg:p-10 border-b border-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-black text-gray-900">Event Policies</h3>
                                            <ChevronDown
                                                size={20}
                                                className={`text-gray-400 transition-transform duration-300 ${expandedSections.policies ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Global Default Settings</p>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    onClick={(e) => e.stopPropagation()}
                                    className="hidden md:flex items-center gap-2 bg-primary text-white font-black px-6 py-3 rounded-2xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 text-sm disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    Save Policies
                                </button>
                            </div>

                            <AnimatePresence>
                                {expandedSections.policies && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                >
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
                                </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </motion.div>
                )}

                {activeTab === 'subscriptions' && (
                    <motion.div
                        key="subscriptions"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Current Active Subscriptions */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                                <Shield className="text-emerald-500" />
                                Active Event Subscriptions
                            </h3>
                            {subscriptions.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {subscriptions.map((sub, index) => (
                                        <div key={index} className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4 group hover:shadow-lg transition-all">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <span className="font-bold text-emerald-900">{sub}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                                    <p className="text-gray-500 font-medium italic">No active subscriptions found. Select a package below to get started.</p>
                                </div>
                            )}
                        </div>

                        {/* Event Selection for Purchase */}
                        <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h4 className="text-lg font-black text-primary flex items-center gap-2">
                                        <Calendar size={20} />
                                        Target Event
                                    </h4>
                                    <p className="text-xs text-primary/60 font-bold uppercase tracking-widest mt-1">Select an event to apply a subscription to</p>
                                </div>
                                <div className="relative flex-1 max-w-md">
                                    <select
                                        className="w-full p-4 bg-white border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                                        value={selectedEventId}
                                        onChange={(e) => setSelectedEventId(e.target.value)}
                                    >
                                        <option value="" disabled>Select an event...</option>
                                        {rawEvents.map(event => (
                                            <option key={event.id} value={event.id}>{event.title}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Available Packages */}
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Available Packages</h3>
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-4 py-2 rounded-full">
                                    <Zap size={14} className="text-amber-500" />
                                    Powered by Monnify
                                </div>
                            </div>

                            {packagesLoading ? (
                                <div className="flex justify-center py-20"><CustomLoader /></div>
                            ) : packages.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {packages.map((pkg) => (
                                        <div key={pkg.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col group hover:border-primary/20 transition-all">
                                            <div className="p-8">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <h4 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">{pkg.name}</h4>
                                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{pkg.durationDays} Days Duration</p>
                                                    </div>
                                                    {pkg.discountPercentage > 0 && (
                                                        <div className="bg-rose-50 text-rose-600 text-[10px] font-black px-3 py-1.5 rounded-full border border-rose-100 uppercase tracking-widest">
                                                            {pkg.discountPercentage}% OFF
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mb-8">
                                                    <p className="text-4xl font-black text-primary tracking-tighter italic">
                                                        ₦{pkg.price.toLocaleString()}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">One-time payment</p>
                                                </div>

                                                <div className="space-y-4 mb-8">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Included Rules & Features</p>
                                                    {pkg.rules.map((rule: PackageRule, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                                                            <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                                                <CheckCircle2 size={14} />
                                                            </div>
                                                            <div className="flex justify-between w-full">
                                                                <span className="text-gray-500 uppercase text-[10px] tracking-tight">{rule.ruleKey.replace(/_/g, ' ')}</span>
                                                                <span className="text-gray-900 italic font-black">{rule.ruleValue}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => handlePurchase(pkg.id)}
                                                    disabled={purchasingId === pkg.id || !selectedEventId}
                                                    className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl hover:bg-primary transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
                                                >
                                                    {purchasingId === pkg.id ? 'Processing...' : 'Subscribe Now'}
                                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                                </button>
                                                {!selectedEventId && (
                                                    <p className="text-[9px] text-rose-500 font-bold uppercase text-center mt-3 tracking-widest animate-pulse">
                                                        Select an event above to purchase
                                                    </p>
                                                )}
                                            </div>
                                            <div className="bg-gray-50 p-4 border-t border-gray-50 flex items-center gap-2">
                                                <Info size={14} className="text-gray-400" />
                                                <p className="text-[10px] text-gray-400 font-medium">Auto-activated upon successful payment.</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 space-y-4 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto text-gray-300 shadow-sm">
                                        <Zap size={40} />
                                    </div>
                                    <p className="text-gray-500 font-medium">No subscription packages available at the moment.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'discounts' && (
                    <motion.div
                        key="discounts"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        {/* Global Discounts Section */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div
                                className="p-8 lg:p-10 border-b border-gray-50 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                        <Tag size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900">Global Discounts</h3>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">Codes valid for your events</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDiscountModalOpen(true)}
                                    className="flex items-center gap-2 bg-primary text-white font-black px-4 py-2 rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 text-xs"
                                >
                                    <PlusCircle size={16} />
                                    Create Code
                                </button>
                            </div>

                            <div className="p-6 md:p-8 lg:p-10">
                                {discountsLoading && discounts.length === 0 ? (
                                    <div className="flex justify-center py-10"><CustomLoader /></div>
                                ) : discounts.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {discounts.map((discount) => (
                                            <div key={discount.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm group-hover:scale-110 transition-transform font-black">
                                                        {discount.discountPercentage}%
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-gray-900 text-lg uppercase tracking-tight">{discount.code}</span>
                                                            {!discount.isActive && (
                                                                <span className="bg-rose-50 text-rose-600 text-[8px] font-black px-1.5 py-0.5 rounded border border-rose-100 uppercase">Inactive</span>
                                                            )}
                                                            {new Date(discount.expiryDate) < new Date() && (
                                                                <span className="bg-amber-50 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded border border-amber-100 uppercase">Expired</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                                                            Expires: {new Date(discount.expiryDate).toLocaleDateString()} • {discount.usedCount || discount.usageCount || 0} / {discount.maxUsage || '∞'} uses
                                                        </p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {(!discount.applicableEventIds || discount.applicableEventIds.length === 0) ? (
                                                                <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">All Events</span>
                                                            ) : (
                                                                discount.applicableEventIds.map(id => (
                                                                    <span key={id} className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                                                                        {events[id] || 'Specific Event'}
                                                                    </span>
                                                                ))
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteDiscount(discount.id)}
                                                    className="p-3 bg-white text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-gray-100 self-end md:self-auto"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 space-y-4">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                            <Tag size={32} />
                                        </div>
                                        <p className="text-gray-500 font-medium">No global discount codes found.</p>
                                        <button
                                            onClick={() => setIsDiscountModalOpen(true)}
                                            className="text-primary font-bold hover:underline text-sm"
                                        >
                                            Create your first discount code
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
         </div>
      </div>

      <OrganizerProfileModal
         isOpen={isEditModalOpen}
         onClose={() => setIsEditModalOpen(false)}
         profile={profile}
         onUpdate={fetchProfile}
      />

      <GlobalDiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        onSubmit={handleCreateDiscount}
        loading={discountsLoading}
      />
    </div>
  );
};

export default OrganizerSettings;
