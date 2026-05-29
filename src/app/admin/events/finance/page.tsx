"use client";
import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Activity,
  Layers,
  CreditCard,
  CheckCircle2,
  XCircle,
  Search,
  Filter
} from "lucide-react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import { formatCurrency } from "@/utils/currency";
import Swal from "@/utils/sweetalert";

const FinancePage = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'withdrawals'>('summary');
  const [summary, setSummary] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawFilter, setWithdrawFilter] = useState("PENDING");

  useEffect(() => {
    if (activeTab === 'summary') {
      fetchSummary();
    } else {
      fetchRequests();
    }
  }, [activeTab]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/admin/finance/summary");
      setSummary(response.data.data);
    } catch (error) {
      console.error("Failed to fetch finance summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/admin/withdrawals");
      setRequests(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: "APPROVED" | "REJECTED") => {
    const { isConfirmed, value: notes } = await Swal.fire({
      title: `${status === 'APPROVED' ? 'Approve' : 'Reject'} Withdrawal?`,
      input: 'textarea',
      inputPlaceholder: 'Add admin notes (e.g. Transaction ID)...',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      confirmButtonColor: status === 'APPROVED' ? '#10b981' : '#ef4444',
    });

    if (isConfirmed) {
      try {
        Swal.showLoading();
        await api.post(`/events/admin/withdrawals/${id}/status`, {
          status,
          adminNotes: notes
        });
        Swal.fire("Success!", `Withdrawal request ${status.toLowerCase()}.`, "success");
        fetchRequests();
      } catch (error) {
        Swal.fire("Error", "Failed to update status", "error");
      }
    }
  };

  const stats = [
    {
      title: "Total Gross Volume",
      value: formatCurrency(summary?.totalGrossVolume || 0),
      icon: DollarSign,
      color: "bg-blue-500",
      trend: "+12.5%"
    },
    {
      title: "Platform Revenue",
      value: formatCurrency(summary?.platformRevenue || 0),
      icon: TrendingUp,
      color: "bg-emerald-500",
      trend: "+8.2%"
    },
    {
      title: "Organizer Payouts",
      value: formatCurrency(summary?.organizerPayouts || 0),
      icon: Wallet,
      color: "bg-amber-500",
      trend: "+5.4%"
    },
    {
      title: "Active Subscriptions",
      value: summary?.activeSubscriptions || 0,
      icon: Layers,
      color: "bg-indigo-500",
      trend: "+15%"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Finance <span className="text-primary not-italic">Dashboard</span></h1>
        <p className="text-gray-500 font-medium">Manage platform revenue and process organizer withdrawals.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-100">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-6 py-4 text-sm font-bold transition-all relative ${
            activeTab === 'summary' ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Revenue Summary
          {activeTab === 'summary' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-6 py-4 text-sm font-bold transition-all relative ${
            activeTab === 'withdrawals' ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Withdraw Summary
          {activeTab === 'withdrawals' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
        </button>
      </div>

      {activeTab === 'summary' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.color} text-white`}>
                    <stat.icon size={24} />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                    <ArrowUpRight size={16} />
                    {stat.trend}
                  </div>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.title}</p>
                <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-6">Recent Transactions</h3>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                        <Activity size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Ticket Sale - Tech Conf 2024</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Oct 24, 2024 • 2:30 PM</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-emerald-600">+₦45,000</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-6">Revenue Breakdown</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-gray-600">Ticket Commissions</span>
                    <span className="text-xs font-black text-gray-900">75%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-gray-600">Subscription Plans</span>
                    <span className="text-xs font-black text-gray-900">20%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-bold text-gray-600">Featured Placement</span>
                    <span className="text-xs font-black text-gray-900">5%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '5%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-white p-3 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
             {["ALL", "PENDING", "APPROVED", "REJECTED"].map(filter => (
               <button
                 key={filter}
                 onClick={() => setWithdrawFilter(filter)}
                 className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                   withdrawFilter === filter ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-50"
                 }`}
               >
                 {filter}
               </button>
             ))}
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Organizer</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank Details</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center"><CustomLoader /></td>
                    </tr>
                  ) : requests.length > 0 ? requests.filter(r => withdrawFilter === "ALL" || r.status === withdrawFilter).map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-bold text-gray-900">{req.organizerName || "ID: " + req.organizerId.slice(0,8)}</p>
                        <p className="text-xs text-gray-500 font-medium">{req.organizerEmail}</p>
                      </td>
                      <td className="px-8 py-6 font-black text-primary text-lg">{formatCurrency(req.amount)}</td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-gray-700">{req.bankName}</p>
                        <p className="text-xs text-gray-500 font-medium">{req.accountNumber}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-gray-700">{new Date(req.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {req.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleStatusUpdate(req.id, "REJECTED")}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Reject"
                            >
                              <XCircle size={20} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(req.id, "APPROVED")}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                              title="Approve"
                            >
                              <CheckCircle2 size={20} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                          <CreditCard size={40} />
                        </div>
                        <p className="text-gray-500 font-bold">No withdrawal requests found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinancePage;
