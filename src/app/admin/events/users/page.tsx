"use client";

import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Shield, Mail, Phone, Calendar, MoreVertical, CheckCircle, XCircle, Clock, Briefcase, Globe, FileText, AlertCircle, Search as SearchIcon } from 'lucide-react';
import api from '@/services/api';
import Swal from '@/utils/sweetalert';
import { translateError } from '@/utils/errors';
import { formatDate } from '@/utils/date';
import CustomLoader from "@/components/CustomLoader";
import { OrganizerApplication } from "@/types";

interface AdminStaffMember {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  createdAt: string;
  organizerId?: {
    _id: string;
    organizationName: string;
  };
}

const UserManagementPage = () => {
  const [activeTab, setActiveTab] = useState<'staff' | 'applications'>('staff');
  const [loading, setLoading] = useState(true);

  // Staff state
  const [staff, setStaff] = useState<AdminStaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [staffFilter, setStaffFilter] = useState('ALL');

  // Applications state
  const [applications, setApplications] = useState<OrganizerApplication[]>([]);
  const [appFilter, setAppFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");

  useEffect(() => {
    if (activeTab === 'staff') {
      fetchStaff();
    } else {
      fetchApplications();
    }
  }, [activeTab]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events/admin/staff');
      setStaff(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

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

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = staffFilter === 'ALL' || member.status === staffFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredApps = applications.filter(app => appFilter === "ALL" || app.status === appFilter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">User <span className="text-primary not-italic">Management</span></h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Manage platform staff and review organizer applications.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-6 py-4 text-sm font-bold transition-all relative ${
            activeTab === 'staff' ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Staff Pool
          {activeTab === 'staff' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-6 py-4 text-sm font-bold transition-all relative ${
            activeTab === 'applications' ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Organizer Applications
          {activeTab === 'applications' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
        </button>
      </div>

      {activeTab === 'staff' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-primary">
                  <Users size={24} />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Staff</span>
              </div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{staff.length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
                  <CheckCircle size={24} />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active</span>
              </div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{staff.filter(s => s.status === 'ACTIVE').length}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Clock size={24} />
                </div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</span>
              </div>
              <p className="text-3xl font-black text-gray-900 tracking-tight">{staff.filter(s => s.status === 'PENDING').length}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter size={18} className="text-gray-400 ml-2" />
              <select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="bg-gray-50 border-none rounded-2xl text-sm py-3 px-4 focus:ring-2 focus:ring-primary/20 transition-all min-w-[140px]"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Staff Member</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Organization</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-6 py-8">
                          <div className="h-4 bg-gray-100 rounded-full w-full"></div>
                        </td>
                      </tr>
                    ))
                  ) : filteredStaff.length > 0 ? (
                    filteredStaff.map((member) => (
                      <tr key={member._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              {member.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900">{member.fullName}</p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                            {member.organizerId?.organizationName || 'Platform Staff'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {member.role.map(r => (
                              <span key={r} className="text-[10px] font-black text-primary uppercase tracking-tighter bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                                {r.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            member.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-100' :
                            member.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-gray-500">
                          {formatDate(member.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-gray-100 shadow-none hover:shadow-sm transition-all text-gray-400 hover:text-primary">
                            <MoreVertical size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-3xl flex items-center justify-center text-gray-300 mb-4">
                            <Users size={32} />
                          </div>
                          <p className="text-gray-900 font-bold">No staff members found</p>
                          <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default UserManagementPage;
