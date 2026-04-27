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
  Info
} from "lucide-react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";

const SystemSettings = () => {
  const [config, setConfig] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configRes, categoriesRes] = await Promise.all([
        api.get("/events/admin/config"),
        api.get("/events/categories")
      ]);
      setConfig(configRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
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

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Settings</h1>
        <p className="text-gray-500 font-medium">Global configuration and platform-wide event categories.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
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
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
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
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
