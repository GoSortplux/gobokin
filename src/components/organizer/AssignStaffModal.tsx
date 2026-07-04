'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Mail, Search, CheckCircle2 } from 'lucide-react';
import { StaffMember } from '@/types';
import api from '@/services/api';
import CustomLoader from '@/components/CustomLoader';

interface AssignStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (staffId: string) => Promise<void>;
  assignedStaffIds: string[];
}

const AssignStaffModal: React.FC<AssignStaffModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  assignedStaffIds,
}) => {
  const [staffPool, setStaffPool] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchStaffPool();
    }
  }, [isOpen]);

  const fetchStaffPool = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events/my-organizer-profile/staff');
      setStaffPool(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch staff pool:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staffPool.filter(
    (member) =>
      member.fullName?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = async (staffId: string) => {
    setAssigningId(staffId);
    try {
      await onAssign(staffId);
    } finally {
      setAssigningId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white w-full max-w-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary p-5 sm:p-7 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">
                Assign <span className="text-white not-italic">Staff to Event</span>
              </h2>
              <p className="text-white/70 text-[11px] sm:text-sm font-medium">Select staff members from your pool to assign to this event.</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-6 sm:space-y-7 overflow-y-auto no-scrollbar flex-1">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
            />
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-20 flex justify-center">
                <CustomLoader />
              </div>
            ) : filteredStaff.length > 0 ? (
              filteredStaff.map((member) => {
                const isAssigned = assignedStaffIds.includes(member.id);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:border-primary/20 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white text-primary flex items-center justify-center font-black text-lg border border-gray-100 group-hover:bg-primary group-hover:text-white transition-colors">
                        {member.fullName?.[0] || <Users size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">
                          {member.fullName || member.email?.split('@')[0] || 'Staff'}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Mail size={12} className="text-gray-400" />
                          <span className="text-[11px] text-gray-500 font-medium">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          member.role === 'MANAGER'
                            ? 'bg-amber-50 text-amber-600 border border-amber-100'
                            : 'bg-white text-gray-500 border border-gray-100'
                        }`}
                      >
                        {member.role}
                      </span>

                      {isAssigned ? (
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100">
                          <CheckCircle2 size={14} />
                          Assigned
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAssign(member.id)}
                          disabled={assigningId === member.id}
                          className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/10 hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          {assigningId === member.id ? (
                            <>
                              <CustomLoader className="w-3 h-3" />
                              Assigning...
                            </>
                          ) : 'Assign'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <Users className="mx-auto mb-3 text-gray-300" size={40} />
                <p className="text-gray-500 font-medium italic">No staff members found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-7 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 shrink-0">
          <div className="flex justify-end gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignStaffModal;
