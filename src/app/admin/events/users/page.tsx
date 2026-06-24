"use client";

import React, { useState, useEffect } from 'react';
import { Briefcase, Globe, FileText, AlertCircle, Clock, MoreVertical, Search, Edit2, X, Shield, Percent, Users, Save } from 'lucide-react';
import api from '@/services/api';
import Swal from '@/utils/sweetalert';
import { translateError } from '@/utils/errors';
import CustomLoader from "@/components/CustomLoader";
import { OrganizerApplication, Organizer } from "@/types";

const EditOrganizerModal = ({ isOpen, onClose, organizer, onUpdate }: { isOpen: boolean; onClose: () => void; organizer: Organizer | null; onUpdate: () => void }) => {
  const [formData, setFormData] = useState({
    status: "",
    isVerified: false,
    commissionRate: 0,
    payoutPolicy: "",
    maxStaff: 0,
    autoPromotionEligible: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (organizer) {
      setFormData({
        status: organizer.status || "PENDING",
        isVerified: organizer.isVerified || false,
        commissionRate: Number(organizer.commissionRate) || 0,
        payoutPolicy: organizer.payoutPolicy || "",
        maxStaff: organizer.maxStaff || 10,
        autoPromotionEligible: organizer.autoPromotionEligible || false
      });
    }
  }, [organizer]);

  if (!isOpen || !organizer) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/events/admin/organizers/${organizer.id}`, formData);
      Swal.fire('Success', 'Organizer profile updated successfully', 'success');
      onUpdate();
      onClose();
    } catch (error) {
      Swal.fire('Error', translateError(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-2xl my-8 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">Edit <span className="text-primary not-italic">Organizer</span></h3>
            <p className="text-gray-500 text-xs font-bold mt-1 uppercase tracking-widest">ID: {organizer.id}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-xl transition-all">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Shield size={12} /> Status
              </label>
              <select
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="PENDING">PENDING</option>
                <option value="ESTABLISHED">ESTABLISHED</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Percent size={12} /> Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                value={formData.commissionRate}
                onChange={e => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Users size={12} /> Max Staff
              </label>
              <input
                type="number"
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                value={formData.maxStaff}
                onChange={e => setFormData({ ...formData, maxStaff: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <FileText size={12} /> Payout Policy
              </label>
              <input
                type="text"
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
                placeholder="e.g. Weekly"
                value={formData.payoutPolicy}
                onChange={e => setFormData({ ...formData, payoutPolicy: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-4 p-5 bg-gray-50 rounded-[2rem] cursor-pointer hover:bg-gray-100 transition-all border-2 border-transparent has-[:checked]:border-primary/20 has-[:checked]:bg-blue-50/30">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.isVerified}
                  onChange={e => setFormData({ ...formData, isVerified: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-900 uppercase">Verified Organizer</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Enable verified badge</span>
              </div>
            </label>

            <label className="flex items-center gap-4 p-5 bg-gray-50 rounded-[2rem] cursor-pointer hover:bg-gray-100 transition-all border-2 border-transparent has-[:checked]:border-primary/20 has-[:checked]:bg-blue-50/30">
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.autoPromotionEligible}
                  onChange={e => setFormData({ ...formData, autoPromotionEligible: e.target.checked })}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-900 uppercase">Auto Promotion</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Eligible for promotion</span>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-black py-5 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-sm flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
            Save Profile Changes
          </button>
        </form>
      </div>
    </div>
  );
};

const UserManagementPage = () => {
  const [loading, setLoading] = useState(true);

  // Applications state
  const [applications, setApplications] = useState<OrganizerApplication[]>([]);
  const [appFilter, setAppFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [searchTerm, setSearchTerm] = useState("");

  // Edit Organizer State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/admin/organizer-applications");
      setApplications(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizerDetails = async (organizerId: string) => {
    try {
      Swal.showLoading();
      // Since we don't have a direct GET for organizer details yet, we'll try to find it in the applications list
      // Or we can try to fetch it if there's an endpoint.
      // For now, let's look for it in the apps.
      const app = applications.find(a => a.organizerId === organizerId);
      if (app) {
        // If there's a dedicated endpoint for organizer details, use it.
        // Let's check if the app object has enough info.
        // Actually, we'll need to fetch the full organizer object for editing.
        try {
          const response = await api.get(`/events/admin/organizers/${organizerId}`);
          setSelectedOrganizer(response.data.data);
          setIsEditModalOpen(true);
          Swal.close();
        } catch (err) {
          // Fallback if GET details fails, create a partial organizer from app data
          const organizerMock: Partial<Organizer> = {
            id: app.organizerId,
            status: app.status,
            // Add other defaults
          };
          setSelectedOrganizer(organizerMock as Organizer);
          setIsEditModalOpen(true);
          Swal.close();
        }
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to fetch organizer details', 'error');
    }
  };

  const handleAppAction = async (id: string, action: "approve" | "reject") => {
    const { isConfirmed, value: notes } = await Swal.fire({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Application?`,
      text: `Are you sure you want to ${action} this organizer?`,
      input: 'textarea',
      inputPlaceholder: 'Add admin notes (optional)...',
      icon: action === 'approve' ? 'success' : 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${action}`,
      confirmButtonColor: action === 'approve' ? '#10b981' : '#ef4444',
    });

    if (isConfirmed) {
      try {
        Swal.showLoading();
        await api.post(`/events/admin/organizer-applications/${id}/${action}`, {
           adminNotes: notes
        });
        Swal.fire('Success!', `Application has been ${action}d.`, 'success');
        fetchApplications();
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  const filteredApps = applications.filter(app => {
    const matchesFilter = appFilter === "ALL" || app.status === appFilter;
    const matchesSearch =
      app.organizerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.data?.portfolio || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.data?.experience || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">User <span className="text-primary not-italic">Management</span></h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Review and verify organizer applications.</p>
        </div>

        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by ID or portfolio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white p-3 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
         {["ALL", "PENDING", "APPROVED", "REJECTED"].map(filter => (
           <button
             key={filter}
             onClick={() => setAppFilter(filter as "ALL" | "PENDING" | "APPROVED" | "REJECTED")}
             className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
               appFilter === filter ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-50"
             }`}
           >
             {filter}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center"><CustomLoader /></div>
        ) : filteredApps.length > 0 ? (
          filteredApps.map((app) => (
            <div key={app.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden p-8 flex flex-col lg:flex-row gap-8 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 group">
               <div className="w-full lg:w-48 h-48 rounded-3xl bg-gray-50 flex items-center justify-center text-primary relative overflow-hidden group-hover:bg-primary/5 transition-colors">
                  <Briefcase size={64} className="opacity-20" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                     <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
                     <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                       app.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                       app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                     }`}>
                        {app.status}
                     </span>
                  </div>
               </div>

               <div className="flex-1 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                     <div>
                        <h3 className="text-2xl font-black text-gray-900 leading-tight">Organizer ID: {app.organizerId.slice(0, 8)}...</h3>
                        <p className="text-gray-400 font-bold flex items-center gap-2 mt-1">
                           <Clock size={14} />
                           Applied on {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                     </div>
                     <div className="flex items-center gap-3">
                        {app.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleAppAction(app.id, "reject")}
                              className="px-6 py-3 rounded-2xl bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100 transition-all border border-rose-100"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleAppAction(app.id, "approve")}
                              className="px-6 py-3 rounded-2xl bg-primary text-white font-black text-sm hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
                            >
                              Approve Organizer
                            </button>
                          </>
                        )}
                        {app.status === 'APPROVED' && (
                          <button
                            onClick={() => fetchOrganizerDetails(app.organizerId)}
                            className="px-6 py-3 rounded-2xl bg-blue-50 text-primary font-black text-sm hover:bg-blue-100 transition-all border border-blue-100 flex items-center gap-2"
                          >
                            <Edit2 size={16} />
                            Edit Profile
                          </button>
                        )}
                        <button className="p-3 text-gray-400 hover:text-primary transition-all rounded-xl hover:bg-blue-50">
                           <MoreVertical size={20} />
                        </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-50">
                     <div className="space-y-4">
                        <div className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary">
                              <Globe size={18} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Portfolio/Website</p>
                              <a href={app.data?.portfolio} target="_blank" className="text-sm font-bold text-primary hover:underline">{app.data?.portfolio || "N/A"}</a>
                           </div>
                        </div>
                        <div className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary">
                              <Briefcase size={18} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Experience</p>
                              <p className="text-sm font-bold text-gray-700">{app.data?.experience || "N/A"}</p>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <div className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary">
                              <FileText size={18} />
                           </div>
                           <div className="flex-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">References</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                 {app.data?.references?.map((ref: string, i: number) => (
                                   <span key={i} className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-xs font-medium text-gray-600">{ref}</span>
                                 ))}
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {app.adminNotes && (
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                          <AlertCircle size={12} />
                          Admin Notes
                       </p>
                       <p className="text-sm text-gray-700 italic font-medium">{app.adminNotes}</p>
                    </div>
                  )}
               </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[3rem] p-20 text-center border border-gray-100 shadow-sm">
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                <Search size={48} />
             </div>
             <h3 className="text-2xl font-black text-gray-900 mb-2">No applications found</h3>
             <p className="text-gray-500 max-w-sm mx-auto">There are no organizer applications matching your current criteria.</p>
          </div>
        )}
      </div>

      <EditOrganizerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        organizer={selectedOrganizer}
        onUpdate={fetchApplications}
      />
    </div>
  );
};

export default UserManagementPage;
