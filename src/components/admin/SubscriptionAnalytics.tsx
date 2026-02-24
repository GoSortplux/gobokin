'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Mail,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import CustomLoader from '@/components/CustomLoader';

interface SubscriptionDetails {
  status: string;
  purchaseDate: string;
  expiryDate: string;
  tierDetails: {
    name: string;
  };
}

interface Owner {
  fullName: string;
  email: string;
  latestSubscription: SubscriptionDetails | null;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalOwners: number;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  expired: 'bg-rose-50 text-rose-700 border-rose-100',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  cancelled: 'bg-gray-50 text-gray-700 border-gray-100',
  failed: 'bg-rose-50 text-rose-700 border-rose-100',
  none: 'bg-slate-50 text-slate-700 border-slate-100',
};

const SubscriptionAnalytics = () => {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (status) params.append('status', status);

      const response = await api.get(`../v2/analytics/subscriptions?${params.toString()}`);
      if (response.data?.success) {
        setOwners(response.data.data.owners);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSubscriptions();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [fetchSubscriptions]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return <ShieldCheck className="w-4 h-4" />;
      case 'expired': return <ShieldAlert className="w-4 h-4" />;
      case 'none': return <ShieldQuestion className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Subscription Analytics</h1>
          <p className="text-sm text-gray-500 font-medium">Platform-wide subscription overview for all venue owners.</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <select
            value={status}
            onChange={handleStatusChange}
            className="pl-10 pr-10 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none appearance-none min-w-[200px]"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="upgraded">Upgraded</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="superseded">Superseded</option>
            <option value="none">No Subscription</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Venue Owner</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Plan</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Purchase Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Expiry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <CustomLoader size={40} />
                      <p className="mt-4 text-gray-500 font-bold text-xs uppercase tracking-widest">Loading subscription data...</p>
                    </div>
                  </td>
                </tr>
              ) : owners.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <ShieldAlert className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 font-bold italic">No owners found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                owners.map((owner, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary font-bold text-lg">
                          {owner.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{owner.fullName}</div>
                          <div className="text-[10px] text-gray-400 font-medium flex items-center mt-0.5">
                            <Mail className="w-3 h-3 mr-1" />
                            {owner.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-primary/60" />
                        <span className="text-sm font-bold text-gray-700">
                          {owner.latestSubscription?.tierDetails?.name || 'No Plan'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className={`
                        inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase
                        ${statusColors[owner.latestSubscription?.status?.toLowerCase() || 'none'] || 'bg-gray-50 text-gray-600 border-gray-100'}
                      `}>
                        {getStatusIcon(owner.latestSubscription?.status || 'none')}
                        <span>{owner.latestSubscription?.status || 'None'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center text-xs font-bold text-gray-600">
                        <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />
                        {owner.latestSubscription?.purchaseDate
                          ? format(new Date(owner.latestSubscription.purchaseDate), 'MMM d, yyyy')
                          : 'N/A'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="text-xs font-bold text-gray-900">
                        {owner.latestSubscription?.expiryDate
                          ? format(new Date(owner.latestSubscription.expiryDate), 'MMM d, yyyy')
                          : 'N/A'
                        }
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
              Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalOwners} total owners)
            </p>
            <div className="flex items-center space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-1">
                {(() => {
                  const maxPagesToShow = 5;
                  let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
                  let endPage = startPage + maxPagesToShow - 1;

                  if (endPage > pagination.totalPages) {
                    endPage = pagination.totalPages;
                    startPage = Math.max(1, endPage - maxPagesToShow + 1);
                  }

                  return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                    const pageNum = startPage + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                          page === pageNum
                          ? 'bg-primary text-white shadow-md'
                          : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  });
                })()}
              </div>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionAnalytics;
