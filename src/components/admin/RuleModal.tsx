"use client";
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { SubscriptionRule } from "@/types";

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rule: Partial<SubscriptionRule>) => void;
  rule?: Partial<SubscriptionRule>;
}

const RuleModal: React.FC<RuleModalProps> = ({ isOpen, onClose, onSubmit, rule }) => {
  const [formData, setFormData] = useState<Partial<SubscriptionRule>>({
    name: "",
    key: "",
    type: "number",
    description: "",
    display_text: "",
    singular_text: "",
    plural_text: "",
  });

  useEffect(() => {
    if (rule) {
      setFormData({
        ...rule,
        display_text: rule.display_text || rule.displayText || "",
        singular_text: rule.singular_text || "",
        plural_text: rule.plural_text || "",
      });
    } else {
      setFormData({
        name: "",
        key: "",
        type: "number",
        description: "",
        display_text: "",
        singular_text: "",
        plural_text: "",
      });
    }
  }, [rule]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-black text-gray-800 mb-8 uppercase italic text-center">
          {rule?._id ? "Edit Subscription Rule" : "Add New Rule"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Maximum Staff"
              className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Key</label>
            <input
              type="text"
              name="key"
              required
              value={formData.key}
              onChange={handleChange}
              placeholder="e.g. max_staff"
              className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <p className="mt-1 ml-1 text-[10px] text-gray-400">Used by the backend to identify this rule. Use snake_case.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="string">String</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Display Text</label>
            <input
              type="text"
              name="display_text"
              required
              value={formData.display_text}
              onChange={handleChange}
              placeholder="e.g. Support Level: {{value}}"
              className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <p className="mt-1 ml-1 text-[10px] text-gray-400">
              Default template. Use <code className="font-bold text-primary">{"{{value}}"}</code> as a placeholder for the actual value.
            </p>
          </div>

          {formData.type === "number" && (
            <>
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Singular Text (Value = 1)</label>
                <input
                  type="text"
                  name="singular_text"
                  required={formData.type === "number"}
                  value={formData.singular_text}
                  onChange={handleChange}
                  placeholder="e.g. Manage {{value}} venue"
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <p className="mt-1 ml-1 text-[10px] text-gray-400">
                  Used when value is exactly 1. Use <code className="font-bold text-primary">{"{{value}}"}</code> placeholder.
                </p>
              </div>

              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Plural Text (Value ≠ 1)</label>
                <input
                  type="text"
                  name="plural_text"
                  required={formData.type === "number"}
                  value={formData.plural_text}
                  onChange={handleChange}
                  placeholder="e.g. Manage {{value}} venues"
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <p className="mt-1 ml-1 text-[10px] text-gray-400">
                  Used when value is 0 or &gt; 1. Use <code className="font-bold text-primary">{"{{value}}"}</code> placeholder.
                </p>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what this rule controls..."
              className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              rows={4}
            ></textarea>
          </div>

          <div className="flex justify-end mt-10">
            <button
              type="submit"
              className="w-full sm:w-auto px-10 py-4 rounded-2xl text-white bg-primary font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 uppercase tracking-widest text-xs"
            >
              {rule?._id ? "Save Changes" : "Create Rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RuleModal;
