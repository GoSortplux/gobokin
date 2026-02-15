"use client";
import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import api from "@/services/api";
import { LicenseTier, SubscriptionRule } from "@/types";

interface TierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tier: LicenseTier) => void;
  tier?: Partial<LicenseTier>;
}

const TierModal: React.FC<TierModalProps> = ({ isOpen, onClose, onSubmit, tier }) => {
  const [formData, setFormData] = useState<Partial<LicenseTier>>({
    name: "",
    price: 0,
    durationInDays: 0,
    minHalls: 1,
    maxHalls: 1,
    features: [],
    rules: [],
    isPublic: false,
    discount: {
      type: 'percentage',
      value: 0,
      description: "",
      expiryDate: new Date().toISOString().split('T')[0],
    }
  });

  const [availableRules, setAvailableRules] = useState<SubscriptionRule[]>([]);
  const [showDiscount, setShowDiscount] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchRules();
    }
  }, [isOpen]);

  const fetchRules = async () => {
    try {
      const response = await api.get("/subscription-rules");
      setAvailableRules(response.data.data);
    } catch (error) {
      console.error("Error fetching rules:", error);
    }
  };

  useEffect(() => {
    if (tier) {
      // Ensure rules are formatted correctly for the form
      const formattedRules = tier.rules?.map(r => ({
        rule: typeof r.rule === 'object' ? r.rule._id : r.rule,
        value: r.value
      })) || [];

      setFormData({
        ...tier,
        isPublic: tier.isPublic ?? false,
        rules: formattedRules,
        discount: tier.discount || {
          type: 'percentage',
          value: 0,
          description: "",
          expiryDate: new Date().toISOString().split('T')[0],
        }
      });
      setShowDiscount(!!tier.discount && tier.discount.value > 0);
    } else {
      setFormData({
        name: "",
        price: 0,
        durationInDays: 0,
        minHalls: 1,
        maxHalls: 1,
        features: [],
        rules: [],
        isPublic: false,
        discount: {
          type: 'percentage',
          value: 0,
          description: "",
          expiryDate: new Date().toISOString().split('T')[0],
        }
      });
      setShowDiscount(false);
    }
  }, [tier, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof LicenseTier] as Record<string, unknown>),
          [child]: val
        }
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: val }));
    }
  };

  const handleFeaturesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, features: value.split('\n').filter(f => f.trim() !== '') }));
  };

  const handleAddRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...(prev.rules || []), { rule: availableRules[0]?._id || '', value: 0 }]
    }));
  };

  const handleRemoveRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: (prev.rules || []).filter((_, i) => i !== index)
    }));
  };

  const handleRuleChange = (index: number, field: 'rule' | 'value', value: string | number) => {
    setFormData(prev => {
      const updatedRules = [...(prev.rules || [])];
      updatedRules[index] = { ...updatedRules[index], [field]: value };
      return { ...prev, rules: updatedRules };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!showDiscount) {
      delete payload.discount;
    }
    onSubmit(payload as LicenseTier);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-black text-gray-800 mb-8 uppercase italic text-center">
          {tier?._id ? "Edit License Tier" : "Add New License Tier"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Tier Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Premium"
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Price (₦)</label>
              <input
                type="number"
                name="price"
                required
                value={formData.price}
                onChange={handleChange}
                placeholder="Enter Price"
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Duration (days)</label>
              <input
                type="number"
                name="durationInDays"
                required
                value={formData.durationInDays}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Min Venues</label>
              <input
                type="number"
                name="minHalls"
                required
                value={formData.minHalls}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Max Venues</label>
              <input
                type="number"
                name="maxHalls"
                required
                value={formData.maxHalls}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Features (one per line)</label>
            <textarea
              name="features"
              value={formData.features?.join("\n")}
              onChange={handleFeaturesChange}
              placeholder="Enter Features (one per line)"
              className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              rows={4}
            ></textarea>
          </div>

          {/* Rules Section */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Subscription Rules</label>
              {availableRules.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddRule}
                  className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} /> Add Rule
                </button>
              )}
            </div>
            <div className="space-y-3">
              {formData.rules?.map((ruleItem, index) => (
                <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <select
                    value={typeof ruleItem.rule === 'object' ? (ruleItem.rule as SubscriptionRule)._id : ruleItem.rule}
                    onChange={(e) => handleRuleChange(index, 'rule', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="" disabled>Select a rule</option>
                    {availableRules.map(r => (
                      <option key={r._id} value={r._id}>{r.name} ({r.key})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={ruleItem.value}
                    onChange={(e) => handleRuleChange(index, 'value', parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Value"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(index)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {formData.rules?.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-2 italic">
                  {availableRules.length > 0
                    ? "No rules assigned to this tier."
                    : "Create subscription rules first to assign them here."}
                </p>
              )}
            </div>
          </div>

          {/* Visibility Section */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-blue-900 uppercase italic">Make Public</span>
                <span className="text-[10px] text-blue-700 font-medium">Determine if this tier is visible to Venue Owners</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>

          {/* Discount Section */}
          <div className="border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="showDiscount"
                checked={showDiscount}
                onChange={(e) => setShowDiscount(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="showDiscount" className="text-xs font-bold text-gray-400 uppercase tracking-widest cursor-pointer">
                Enable Discount
              </label>
            </div>

            {showDiscount && (
              <div className="bg-green-50/50 p-6 rounded-3xl border border-green-100 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1 ml-1">Type</label>
                    <select
                      name="discount.type"
                      value={formData.discount?.type}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-white border border-green-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (₦)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1 ml-1">Value</label>
                    <input
                      type="number"
                      name="discount.value"
                      value={formData.discount?.value}
                      onChange={handleChange}
                      className="w-full px-4 py-2 bg-white border border-green-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1 ml-1">Expiry Date</label>
                  <input
                    type="date"
                    name="discount.expiryDate"
                    value={formData.discount?.expiryDate ? new Date(formData.discount.expiryDate).toISOString().split('T')[0] : ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white border border-green-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-green-700 uppercase tracking-widest mb-1 ml-1">Description</label>
                  <input
                    type="text"
                    name="discount.description"
                    value={formData.discount?.description}
                    onChange={handleChange}
                    placeholder="e.g. Early bird special"
                    className="w-full px-4 py-2 bg-white border border-green-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-10">
            <button
              type="submit"
              className="w-full sm:w-auto px-10 py-4 rounded-2xl text-white bg-primary font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest text-xs"
            >
              {tier?._id ? "Save Changes" : "Create Tier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TierModal;
