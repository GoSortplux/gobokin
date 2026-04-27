"use client";
import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { formatCurrency } from "@/utils/currency";

const SubscriptionPackages = () => {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    durationDays: 30,
    type: "SUBSCRIPTION",
    discountPercentage: 0,
    rules: [{ ruleKey: "MAX_GUESTS", ruleValue: "1000" }]
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/admin/packages");
      setPackages(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      Swal.showLoading();
      await api.post("/events/admin/packages", formData);
      Swal.fire("Success!", "Subscription package created successfully.", "success");
      setIsModalOpen(false);
      fetchPackages();
    } catch (error) {
      Swal.fire("Error", "Failed to create package", "error");
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Subscription Packages</h1>
          <p className="text-gray-500 font-medium mt-1">Manage event organizer subscription tiers and pricing rules.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20"
        >
          <Plus size={20} />
          Create Package
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all duration-500 group">
            <div className="p-8 bg-gray-50/50 border-b border-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {pkg.type}
                </span>
                <div className="flex gap-2">
                   <button className="p-2 text-gray-400 hover:text-primary transition-all"><Edit2 size={16} /></button>
                   <button className="p-2 text-gray-400 hover:text-rose-600 transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">{pkg.name}</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-primary">{formatCurrency(pkg.price)}</span>
                <span className="text-gray-400 text-sm font-bold">/ {pkg.durationDays} days</span>
              </div>
            </div>
            <div className="p-8 flex-1 space-y-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Package Rules</p>
              {pkg.rules.map((rule: any, i: number) => (
                <div key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={14} />
                  </div>
                  <span>{rule.ruleKey}: <span className="text-primary">{rule.ruleValue}</span></span>
                </div>
              ))}
              {pkg.discountPercentage > 0 && (
                <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                  <AlertCircle className="text-amber-600" size={20} />
                  <p className="text-sm font-bold text-amber-700">Includes {pkg.discountPercentage}% discount</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">New Package</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Package Name</label>
                 <input
                   type="text"
                   required
                   className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                 />
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price (NGN)</label>
                   <input
                     type="number"
                     required
                     className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                     value={formData.price}
                     onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration (Days)</label>
                   <input
                     type="number"
                     required
                     className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                     value={formData.durationDays}
                     onChange={e => setFormData({...formData, durationDays: Number(e.target.value)})}
                   />
                 </div>
               </div>
               <button className="w-full bg-primary text-white font-black py-5 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-sm">
                 Create Subscription Package
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPackages;
