'use client';

import { useState, useEffect } from 'react';
import { X, Tag, Percent, Calendar, UserCheck } from 'lucide-react';

interface GlobalDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: { code: string; discountPercentage: number; expiryDate: string; maxUsagePerGuest: number }) => void;
  loading?: boolean;
}

const GlobalDiscountModal: React.FC<GlobalDiscountModalProps> = ({ isOpen, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: 0,
    expiryDate: '',
    maxUsagePerGuest: 1,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        code: '',
        discountPercentage: 0,
        expiryDate: '',
        maxUsagePerGuest: 1,
      });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'discountPercentage' || name === 'maxUsagePerGuest' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure expiryDate is in ISO format if needed, but input type="datetime-local" gives YYYY-MM-DDTHH:mm
    const submissionData = {
        ...formData,
        expiryDate: new Date(formData.expiryDate).toISOString()
    };
    onSubmit(submissionData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 border border-gray-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-all cursor-pointer z-20"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
          <div className="mb-6 sm:mb-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
              <Tag size={28} className="sm:hidden" />
              <Tag size={32} className="hidden sm:block" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-tight">
              Global <span className="text-primary not-italic">Discount</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Create a discount code that applies to all your events.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Discount Code</label>
              <div className="relative">
                <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  name="code"
                  placeholder="e.g. SUMMER2024"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none uppercase"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Discount (%)</label>
                    <div className="relative">
                        <Percent size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="number"
                            name="discountPercentage"
                            placeholder="10"
                            min="1"
                            max="100"
                            value={formData.discountPercentage || ''}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Max Usage Per Guest</label>
                    <div className="relative">
                        <UserCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="number"
                            name="maxUsagePerGuest"
                            placeholder="1"
                            min="1"
                            value={formData.maxUsagePerGuest || ''}
                            onChange={handleChange}
                            className="w-full pl-11 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Expiry Date & Time</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="datetime-local"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 sm:py-4 bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 sm:gap-4 pt-2 sm:pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all border border-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white bg-primary hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
              >
                {loading ? '...' : 'Create Discount'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GlobalDiscountModal;
