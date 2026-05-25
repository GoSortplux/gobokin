'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Shield, Lock } from 'lucide-react';

interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: { fullName: string; email: string; role: string; password?: string }) => void;
  loading?: boolean;
}

const OrganizerStaffModal: React.FC<StaffModalProps> = ({ isOpen, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'STAFF',
    password: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: '',
        email: '',
        role: 'STAFF',
        password: '',
      });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
        className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-xl transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X size={20} />
        </button>

        <div className="mb-8">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
            <User size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">
            Add <span className="text-primary not-italic">Staff</span>
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            Invite a new member to your event management pool.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="fullName"
                placeholder="e.g. John Doe"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                placeholder="e.g. john@example.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Assigned Role</label>
            <div className="relative">
              <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none cursor-pointer"
              >
                <option value="STAFF">Staff (Check-in Access)</option>
                <option value="MANAGER">Manager (Admin Access)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Account Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                name="password"
                placeholder="Set a temporary password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all border border-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-primary hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Add to Pool'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizerStaffModal;
