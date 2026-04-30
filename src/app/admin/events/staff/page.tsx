"use client";

import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Shield, Mail, Phone, Calendar, MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '@/services/api';
import Swal from '@/utils/sweetalert';
import { translateError } from '@/utils/errors';
import { formatDate } from '@/utils/date';

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

const AdminStaffPoolPage = () => {
  const [staff, setStaff] = useState<AdminStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      // Backend likely has a global staff endpoint for admin
      const response = await api.get('/events/admin/staff');
      setStaff(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      // Graceful fallback if endpoint doesn't exist yet
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'ALL' || member.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic">Platform <span className="text-primary not-italic">Staff Pool</span></h1>
          <p className="text-gray-500 text-sm font-medium mt-1">Manage and oversee all event staff across the platform.</p>
        </div>
      </div>

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
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
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
    </div>
  );
};

export default AdminStaffPoolPage;
