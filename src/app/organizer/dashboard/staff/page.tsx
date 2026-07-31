"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  Search,
  Mail,
  Trash2,
  ShieldCheck,
  UserPlus,
  MoreVertical,
  Settings2
} from "lucide-react";
import api from "@/services/api";
import { StaffMember } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { useOrganizerRules } from "@/hooks/useOrganizerRules";
import { useRouter } from "next/navigation";
import OrganizerStaffModal from "@/components/organizer/OrganizerStaffModal";
import useOnClickOutside from "@/hooks/useOnClickOutside";

const StaffPool = () => {
  const router = useRouter();
  const { getRule, openUpgradeModal } = useOrganizerRules();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(menuRef, () => setActiveMenu(null));

  const filteredStaff = staff.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.fullName?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/my-organizer-profile/staff");
      setStaff(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch staff pool:", error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaffSubmit = async (formData: { fullName: string; email: string; phone?: string; role: string; password?: string }) => {
    try {
      setModalLoading(true);
      Swal.showLoading();
      await api.post("/events/my-organizer-profile/staff", formData);
      Swal.fire('Invited!', 'Staff member has been added to your pool.', 'success');
      setIsModalOpen(false);
      fetchStaff();
    } catch (error) {
      Swal.fire('Error', translateError(error), 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    setActiveMenu(null);
    const result = await Swal.fire({
      title: 'Remove Staff?',
      text: 'This staff member will lose access to all your events.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove them',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      try {
        Swal.showLoading();
        await api.delete(`/events/my-organizer-profile/staff/${staffId}`);
        Swal.fire('Removed!', 'Staff member removed successfully.', 'success');
        fetchStaff();
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  const handleUpdatePermissions = async (member: StaffMember) => {
    setActiveMenu(null);
    const result = await Swal.fire({
      title: 'Update Permissions',
      text: `Change guest registration permission for ${member.fullName || member.email}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: member.canRegisterGuests ? 'Revoke Access' : 'Grant Access',
      confirmButtonColor: member.canRegisterGuests ? '#ef4444' : '#10b981',
    });

    if (result.isConfirmed) {
      try {
        Swal.showLoading();
        await api.patch(`/events/my-organizer-profile/staff/${member.id}/permissions`, {
          canRegisterGuests: !member.canRegisterGuests
        });
        Swal.fire('Updated!', 'Permissions have been updated successfully.', 'success');
        fetchStaff();
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  const checkMaxStaffRule = () => {
    const maxStaffRule = getRule('MAX_STAFF');
    if (maxStaffRule && maxStaffRule.isRestricted) {
      const limit = parseInt(maxStaffRule.value as string);
      if (limit !== -1 && staff.length >= limit) {
        openUpgradeModal('MAX_STAFF');
        return true;
      }
    }
    return false;
  };

  return (
    <div className="space-y-8 pb-12 px-2 lg:px-4">
      <div className="flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Staff Pool</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your global pool of event staff and managers.</p>
        </div>
        <button
          onClick={() => {
            if (checkMaxStaffRule()) return;
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 w-full md:w-auto"
        >
          <UserPlus size={20} />
          Add New Staff
        </button>
      </div>

      {/* Staff Modal */}
      <OrganizerStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddStaffSubmit}
        loading={modalLoading}
      />

      {/* Toolbar */}
      <div className="bg-white p-2 md:p-3 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search staff by name or email..."
            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.length > 0 ? (
          filteredStaff.map((member) => (
            <div key={member.id} className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 group relative overflow-hidden">
               <div className="absolute -top-12 -right-12 w-32 h-32 bg-gray-50 rounded-full group-hover:bg-primary/5 transition-colors duration-500"></div>

               <div className="flex items-center gap-5 relative z-10">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary flex items-center justify-center font-black text-xl group-hover:bg-primary group-hover:text-white transition-all duration-300">
                     {member.fullName?.[0] || <Users size={28} />}
                  </div>
                  <div>
                     <h3 className="text-xl font-black text-gray-900 leading-tight mb-1 group-hover:text-primary transition-colors">{member.fullName || member.email.split('@')[0]}</h3>
                     <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                       member.role === 'MANAGER' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-gray-50 text-gray-500 border border-gray-100'
                     }`}>
                        {member.role}
                     </span>
                  </div>
               </div>

               <div className="mt-8 space-y-4 pt-6 border-t border-gray-50 relative z-10">
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                     <Mail size={16} className="text-primary" />
                     {member.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                     <ShieldCheck size={16} className={member.canRegisterGuests ? "text-emerald-500" : "text-amber-500"} />
                     {member.canRegisterGuests ? "Full Registration Access" : "Check-in Access Only"}
                  </div>
               </div>

               <div className="absolute top-4 right-4 z-20">
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     setActiveMenu(activeMenu === member.id ? null : member.id);
                   }}
                   className={`p-2.5 rounded-xl transition-all border shadow-sm ${
                     activeMenu === member.id
                       ? 'bg-primary text-white border-primary'
                       : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                   }`}
                 >
                   <MoreVertical size={16} />
                 </button>

                 {activeMenu === member.id && (
                   <div
                     ref={menuRef}
                     className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                     onClick={(e) => e.stopPropagation()}
                   >
                     <button
                       onClick={() => handleUpdatePermissions(member)}
                       className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                     >
                       <Settings2 size={16} className="text-primary" />
                       Edit Permissions
                     </button>
                     <div className="h-px bg-gray-50 my-1"></div>
                     <button
                       onClick={() => handleRemoveStaff(member.id)}
                       className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                     >
                       <Trash2 size={16} />
                       Remove Staff
                     </button>
                   </div>
                 )}
               </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white p-20 text-center rounded-3xl border border-gray-100 shadow-sm">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                <Users size={48} />
             </div>
             <h3 className="text-2xl font-black text-gray-900 mb-2">No staff in pool</h3>
             <p className="text-gray-500 max-w-sm mx-auto mb-8">
               Build your team to help manage attendees and ensure smooth event operations.
             </p>
             <button
                onClick={() => {
                  if (checkMaxStaffRule()) return;
                  setIsModalOpen(true);
                }}
                className="bg-primary text-white font-bold px-8 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2 mx-auto"
              >
                <UserPlus size={20} />
                Invite Your First Staff
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffPool;
