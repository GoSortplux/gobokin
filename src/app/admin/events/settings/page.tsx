"use client";
import React, { useState, useEffect } from "react";
import {
  Settings,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Hash,
  Info,
  Layers,
  Edit2,
  X
} from "lucide-react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { formatCurrency } from "@/utils/currency";

const SystemSettings = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'categories' | 'packages'>('config');
  const [config, setConfig] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");

  // Package Modal State
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
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'config') {
        const res = await api.get("/events/admin/config");
        setConfig(res.data.data || []);
      } else if (activeTab === 'categories') {
        const res = await api.get("/events/utils/categories");
        setCategories(res.data.data || []);
      } else if (activeTab === 'packages') {
        const res = await api.get("/events/admin/packages");
        setPackages(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (key: string, value: any, description: string) => {
    try {
      Swal.showLoading();
      await api.patch("/events/admin/config", { key, value, description });
      Swal.fire("Success!", "Configuration updated.", "success");
      fetchData();
    } catch (error) {
      Swal.fire("Error", "Failed to update config", "error");
    }
  };

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      Swal.showLoading();
      await api.post("/events/admin/categories", { name: newCategory });
      setNewCategory("");
      Swal.fire("Success!", "Category added.", "success");
      fetchData();
    } catch (error) {
      Swal.fire("Error", "Failed to add category", "error");
    }
  };

  const deleteCategory = async (name: string) => {
    try {
      const result = await Swal.fire({
        title: "Delete Category?",
        text: `Are you sure you want to remove "${name}"?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444"
      });

      if (result.isConfirmed) {
        Swal.showLoading();
        await api.delete("/events/admin/categories", { data: { name } });
        Swal.fire("Deleted!", "Category removed.", "success");
        fetchData();
      }
    } catch (error) {
      Swal.fire("Error", "Failed to remove category", "error");
    }
  };

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      Swal.showLoading();
      await api.post("/events/admin/packages", formData);
      Swal.fire("Success!", "Subscription package created successfully.", "success");
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      Swal.fire("Error", "Failed to create package", "error");
    }
  };

  const addRule = () => {
    setFormData({
      ...formData,
      rules: [...formData.rules, { ruleKey: "", ruleValue: "" }]
    });
  };

  const removeRule = (index: number) => {
    const newRules = formData.rules.filter((_, i) => i !== index);
    setFormData({ ...formData, rules: newRules });
  };

  const updateRule = (index: number, key: 'ruleKey' | 'ruleValue', value: string) => {
    const newRules = [...formData.rules];
    newRules[index][key] = value;
    setFormData({ ...formData, rules: newRules });
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">System <span className="text-primary not-italic">Settings</span></h1>
        <p className="text-gray-500 font-medium">Global configuration, event categories, and subscription tiers.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-6 py-4 text-sm font-bold transition-all relative ${
            activeTab === 'config' ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Platform Config
          {activeTab === 'config' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-4 text-sm font-bold transition-all relative ${
            activeTab === 'categories' ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Event Categories
          {activeTab === 'categories' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-6 py-4 text-sm font-bold transition-all relative ${
            activeTab === 'packages' ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Subscription Packages
          {activeTab === 'packages' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><CustomLoader /></div>
      ) : activeTab === 'config' ? (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm max-w-2xl">
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-6 flex items-center gap-2">
            <Settings size={20} className="text-primary" />
            Platform Configuration
          </h3>
          <div className="space-y-8">
            {config.map((item: any, i: number) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.key.replace(/_/g, ' ')}</label>
                  <button
                    onClick={() => updateConfig(item.key, item.value, item.description)}
                    className="p-1.5 text-primary hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Save size={16} />
                  </button>
                </div>
                <input
                  type="text"
                  className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                  value={item.value}
                  onChange={(e) => {
                    const newConfig = [...config];
                    newConfig[i].value = e.target.value;
                    setConfig(newConfig);
                  }}
                />
                <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                  <Info size={10} />
                  {item.description}
                </p>
              </div>
            ))}
            {config.length === 0 && <p className="text-gray-400 text-sm italic">No configuration keys found.</p>}
          </div>
        </div>
      ) : activeTab === 'categories' ? (
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm max-w-2xl">
          <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-6 flex items-center gap-2">
            <Hash size={20} className="text-primary" />
            Event Categories
          </h3>

          <form onSubmit={addCategory} className="flex gap-2 mb-8">
             <input
               type="text"
               placeholder="Add new category..."
               className="flex-1 px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
               value={newCategory}
               onChange={e => setNewCategory(e.target.value)}
             />
             <button className="p-3 bg-primary text-white rounded-2xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20">
               <Plus size={24} />
             </button>
          </form>

          <div className="grid grid-cols-1 gap-3">
            {categories.map((cat: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl group">
                <span className="text-sm font-bold text-gray-700">{cat.name}</span>
                <button
                  onClick={() => deleteCategory(cat.name)}
                  className="p-2 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-end">
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
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white w-full max-w-2xl my-8 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">New Package</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                    <X size={24} className="text-gray-400" />
                  </button>
                </div>
                <form onSubmit={handlePackageSubmit} className="p-8 space-y-6">
                   <div className="grid grid-cols-2 gap-6">
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
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discount Percentage (%)</label>
                       <input
                         type="number"
                         className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                         value={formData.discountPercentage}
                         onChange={e => setFormData({...formData, discountPercentage: Number(e.target.value)})}
                       />
                     </div>
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

                   <div className="space-y-4">
                     <div className="flex items-center justify-between">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Package Rules</label>
                       <button
                         type="button"
                         onClick={addRule}
                         className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 hover:underline"
                       >
                         <Plus size={12} /> Add Rule
                       </button>
                     </div>
                     <div className="space-y-3">
                       {formData.rules.map((rule, index) => (
                         <div key={index} className="flex gap-3 items-center">
                           <input
                             type="text"
                             placeholder="Rule Key (e.g. MAX_GUESTS)"
                             className="flex-1 px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold"
                             value={rule.ruleKey}
                             onChange={e => updateRule(index, 'ruleKey', e.target.value)}
                           />
                           <input
                             type="text"
                             placeholder="Value"
                             className="flex-1 px-5 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold"
                             value={rule.ruleValue}
                             onChange={e => updateRule(index, 'ruleValue', e.target.value)}
                           />
                           {formData.rules.length > 1 && (
                             <button
                               type="button"
                               onClick={() => removeRule(index)}
                               className="p-3 text-gray-400 hover:text-rose-600 transition-all"
                             >
                               <Trash2 size={18} />
                             </button>
                           )}
                         </div>
                       ))}
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
      )}
    </div>
  );
};

export default SystemSettings;
