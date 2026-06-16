"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  PlusCircle,
  Mail,
  Phone,
  Trash2,
  ShieldCheck,
  UserPlus,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import api from "@/services/api";
import { StaffMember } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import OrganizerStaffModal from "@/components/organizer/OrganizerStaffModal";

const StaffPool = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  return (
    <div className="space-y-8 pb-12 px-2 lg:px-4">
      <div className="flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Staff Pool</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your global pool of event staff and managers.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
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
        {staff.length > 0 ? (
          staff.map((member) => (
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
                     <ShieldCheck size={16} className="text-emerald-500" />
                     {member.canRegisterGuests ? "Can Register Guests" : "Check-in Access Only"}
                  </div>
               </div>

               <button
                 onClick={() => handleRemoveStaff(member.id)}
                 className="absolute top-4 right-4 p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all border border-rose-100 z-20 shadow-sm"
                 title="Remove Staff"
               >
                  <Trash2 size={16} />
               </button>
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
                onClick={() => setIsModalOpen(true)}
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
