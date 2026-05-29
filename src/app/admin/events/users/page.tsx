"use client";

import React, { useState, useEffect } from 'react';
import { Search, Filter, Briefcase, Globe, FileText, AlertCircle, Clock, MoreVertical, Search as SearchIcon } from 'lucide-react';
import api from '@/services/api';
import Swal from '@/utils/sweetalert';
import { translateError } from '@/utils/errors';
import CustomLoader from "@/components/CustomLoader";
import { OrganizerApplication } from "@/types";

const UserManagementPage = () => {
  const [loading, setLoading] = useState(true);

  // Applications state
  const [applications, setApplications] = useState<OrganizerApplication[]>([]);
  const [appFilter, setAppFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");

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

  const filteredApps = applications.filter(app => appFilter === "ALL" || app.status === appFilter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">User <span className="text-primary not-italic">Management</span></h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Review and verify organizer applications.</p>
        </div>
      </div>

      <div className="bg-white p-3 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
         {["ALL", "PENDING", "APPROVED", "REJECTED"].map(filter => (
           <button
             key={filter}
             onClick={() => setAppFilter(filter as any)}
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
                              <a href={app.data.portfolio} target="_blank" className="text-sm font-bold text-primary hover:underline">{app.data.portfolio || "N/A"}</a>
                           </div>
                        </div>
                        <div className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-primary">
                              <Briefcase size={18} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Experience</p>
                              <p className="text-sm font-bold text-gray-700">{app.data.experience || "N/A"}</p>
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
                                 {app.data.references?.map((ref: string, i: number) => (
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
                <SearchIcon size={48} />
             </div>
             <h3 className="text-2xl font-black text-gray-900 mb-2">No applications found</h3>
             <p className="text-gray-500 max-w-sm mx-auto">There are no organizer applications matching your current criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
