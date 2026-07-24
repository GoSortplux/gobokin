"use client";
import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  Layers,
  CreditCard,
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import { formatCurrency } from "@/utils/currency";
import Swal from "@/utils/sweetalert";
import { OrganizerBankAccount } from "@/types";
import OrganizerStatusBadge from "@/components/shared/OrganizerStatusBadge";

interface AdminFinanceSummary {
  totals: {
    amount: string | number;
    commission: string | number;
    netAmount: string | number;
  };
  totalWithdrawals: string | number;
  organizerCount: number;
  topOrganizers: Array<{
    id: string;
    organizerId: string;
    pendingBalance: string | number;
    availableBalance: string | number;
    withdrawnBalance: string | number;
    currency: string;
    updatedAt: string;
    organizer: {
      id: string;
      mongoUserId: string;
      slug: string;
      status: string;
      isVerified: boolean;
      bio: string | null;
      website: string | null;
      socialLinks: Record<string, string> | null;
      commissionRate: string | number;
      payoutPolicy: string;
      createdAt: string;
      updatedAt: string;
    };
  }>;
}

interface AdminWithdrawalRequest {
  id: string;
  organizer: {
    fullName: string;
    email: string;
  };
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  createdAt: string;
  adminNotes?: string;
}

interface Subaccount {
  _id: string;
  user?: {
    _id: string;
    fullName: string;
    email: string;
  };
  subAccountCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface AdminLedgerBatch {
  id: string;
  transactionId: string;
  source: string;
  reference: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  currency: string;
  createdAt: string;
  entries: Array<{
    id: string;
    debit: number;
    credit: number;
    memo: string;
    account: {
      name: string;
      code: string;
      type: string;
    };
  }>;
}

const FinancePage = () => {
  const [activeTab, setActiveTab] = useState<'summary' | 'withdrawals' | 'verifications' | 'ledger'>('summary');
  const [summary, setSummary] = useState<AdminFinanceSummary | null>(null);
  const [requests, setRequests] = useState<AdminWithdrawalRequest[]>([]);
  const [bankAccounts, setBankAccounts] = useState<OrganizerBankAccount[]>([]);
  const [subaccounts, setSubaccounts] = useState<Subaccount[]>([]);
  const [ledgers, setLedgers] = useState<AdminLedgerBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [subaccountsLoading, setSubaccountsLoading] = useState(false);
  const [withdrawFilter, setWithdrawFilter] = useState("PENDING");
  const [verificationFilter, setVerificationFilter] = useState("PENDING");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (activeTab === 'summary') {
      fetchSummary();
    } else if (activeTab === 'withdrawals') {
      fetchRequests();
    } else if (activeTab === 'verifications') {
      fetchBankAccounts();
    } else if (activeTab === 'ledger') {
      fetchLedgers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, verificationFilter]);

  useEffect(() => {
    if (activeTab === 'verifications') {
      fetchSubaccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/admin/finance/summary");
      setSummary(response.data.data);
    } catch (_error) {
      console.error("Failed to fetch finance summary:", _error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedgers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/admin/finance/ledger");
      setLedgers(response.data.data || []);
    } catch (_error) {
      console.error("Failed to fetch platform ledgers:", _error);
      setLedgers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/admin/withdrawals");
      setRequests(response.data.data || []);
    } catch (_error) {
      console.error("Failed to fetch withdrawals:", _error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      if (verificationFilter === "ALL") {
        const [pendingRes, verifiedRes, rejectedRes] = await Promise.all([
          api.get("/events/admin/bank-accounts"),
          api.get("/events/admin/bank-accounts?status=VERIFIED"),
          api.get("/events/admin/bank-accounts?status=REJECTED"),
        ]);
        const pendingList = pendingRes.data.data || [];
        const verifiedList = verifiedRes.data.data || [];
        const rejectedList = rejectedRes.data.data || [];
        setBankAccounts([...pendingList, ...verifiedList, ...rejectedList]);
      } else if (verificationFilter === "APPROVED") {
        const response = await api.get("/events/admin/bank-accounts?status=VERIFIED");
        setBankAccounts(response.data.data || []);
      } else if (verificationFilter === "REJECTED") {
        const response = await api.get("/events/admin/bank-accounts?status=REJECTED");
        setBankAccounts(response.data.data || []);
      } else {
        const response = await api.get("/events/admin/bank-accounts");
        setBankAccounts(response.data.data || []);
      }
    } catch (_error) {
      console.error("Failed to fetch bank accounts:", _error);
      setBankAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubaccounts = async () => {
    try {
      setSubaccountsLoading(true);
      const response = await api.get("/subaccounts");
      setSubaccounts(response.data.data || []);
    } catch (_error) {
      console.error("Failed to fetch sub-accounts:", _error);
      setSubaccounts([]);
    } finally {
      setSubaccountsLoading(false);
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
      } catch (_error) {
        Swal.fire("Error", "Failed to update status", "error");
      }
    }
  };

  const handleVerification = async (id: string, status: "APPROVED" | "REJECTED") => {
    const { isConfirmed, value: notes } = await Swal.fire({
      title: `${status === 'APPROVED' ? 'Approve' : 'Reject'} Bank Account?`,
      input: 'textarea',
      inputPlaceholder: 'Add admin notes...',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      confirmButtonColor: status === 'APPROVED' ? '#10b981' : '#ef4444',
    });

    if (isConfirmed) {
      try {
        Swal.showLoading();
        const endpoint = status === 'APPROVED' ? 'approve' : 'reject';
        await api.post(`/events/admin/bank-accounts/${id}/${endpoint}`, {
          adminNotes: notes
        });
        Swal.fire("Success!", `Bank account ${status.toLowerCase()}.`, "success");
        fetchBankAccounts();
      } catch (_error) {
        Swal.fire("Error", "Failed to process verification", "error");
      }
    }
  };

  const parseFloatSafe = (val: string | number | undefined): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === "number") return val;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const stats = [
    {
      title: "Total Gross Volume",
      value: formatCurrency(parseFloatSafe(summary?.totals?.amount)),
      icon: DollarSign,
      color: "bg-blue-500"
    },
    {
      title: "Platform Revenue",
      value: formatCurrency(parseFloatSafe(summary?.totals?.commission)),
      icon: TrendingUp,
      color: "bg-emerald-500"
    },
    {
      title: "Net Amount / Earnings",
      value: formatCurrency(parseFloatSafe(summary?.totals?.netAmount)),
      icon: Wallet,
      color: "bg-amber-500"
    },
    {
      title: "Total Withdrawals",
      value: formatCurrency(parseFloatSafe(summary?.totalWithdrawals)),
      icon: CreditCard,
      color: "bg-rose-500"
    },
    {
      title: "Total Organizers",
      value: summary?.organizerCount || 0,
      icon: Layers,
      color: "bg-indigo-500"
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic">Finance <span className="text-primary not-italic">Dashboard</span></h1>
          <p className="text-gray-500 font-medium">Manage platform revenue and process organizer withdrawals.</p>
        </div>

        {(activeTab === 'withdrawals' || activeTab === 'verifications') && (
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={activeTab === 'withdrawals' ? "Search by name or email..." : "Search account or details..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm shadow-sm"
            />
          </div>
        )}
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
        <button
          onClick={() => setActiveTab('verifications')}
          className={`px-6 py-4 text-sm font-bold transition-all relative ${
            activeTab === 'verifications' ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Bank Verifications
          {activeTab === 'verifications' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-6 py-4 text-sm font-bold transition-all relative ${
            activeTab === 'ledger' ? "text-primary" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          Audit Ledger
          {activeTab === 'ledger' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
        </button>
      </div>

      {activeTab === 'summary' ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.color} text-white`}>
                    <stat.icon size={24} />
                  </div>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.title}</p>
                <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mt-8">
            <div className="p-8 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Top Organizers &amp; Wallets</h3>
              <p className="text-gray-500 text-sm font-medium mt-1">Detailed overview of the leading organizers, split payout rules, and current wallet balances.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Organizer</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Payout Policy</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Available Balance</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Balance</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Withdrawn Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {summary?.topOrganizers && summary.topOrganizers.length > 0 ? (
                    summary.topOrganizers.map((orgItem) => {
                      const displaySlug = orgItem.organizer?.slug || "N/A";
                      const displayTitle = displaySlug
                        .split("-")
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ");

                      return (
                        <tr key={orgItem.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex flex-col gap-1.5 items-start">
                              <span className="font-bold text-gray-900 text-sm">{displayTitle}</span>
                              <div className="flex items-center gap-2">
                                <OrganizerStatusBadge
                                  status={orgItem.organizer?.status}
                                  isVerified={orgItem.organizer?.isVerified}
                                  size="small"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="font-bold text-gray-700 text-sm">
                              {parseFloatSafe(orgItem.organizer?.commissionRate)}%
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700">
                              {orgItem.organizer?.payoutPolicy?.replace("_", " ") || "N/A"}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="font-black text-emerald-600 text-sm">
                              {formatCurrency(parseFloatSafe(orgItem.availableBalance))}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="font-bold text-amber-600 text-sm">
                              {formatCurrency(parseFloatSafe(orgItem.pendingBalance))}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="font-bold text-rose-600 text-sm">
                              {formatCurrency(parseFloatSafe(orgItem.withdrawnBalance))}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                          <Wallet size={40} />
                        </div>
                        <p className="text-gray-500 font-bold">No top organizers data available.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : activeTab === 'withdrawals' ? (
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
                  ) : requests.length > 0 ? requests.filter(r => {
                    const matchesFilter = withdrawFilter === "ALL" || r.status === withdrawFilter;
                    const matchesSearch =
                      r.organizer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.organizer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      r.id?.toLowerCase().includes(searchTerm.toLowerCase());
                    return matchesFilter && matchesSearch;
                  }).map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-bold text-gray-900">{req.organizer.fullName || "ID: " + req.id.slice(0,8)}</p>
                        <p className="text-xs text-gray-500 font-medium">{req.organizer.email}</p>
                      </td>
                      <td className="px-8 py-6 font-black text-primary text-lg">{formatCurrency(req.amount)}</td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-gray-700">{req.bankAccount.bankName}</p>
                        <p className="text-xs text-gray-500 font-medium">{req.bankAccount.accountNumber}</p>
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
      ) : activeTab === 'verifications' ? (
        <>
          <div className="bg-white p-3 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
             {["ALL", "PENDING", "APPROVED", "REJECTED"].map(filter => (
               <button
                 key={filter}
                 onClick={() => setVerificationFilter(filter)}
                 className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                   verificationFilter === filter ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-50"
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
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank Details</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Name</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center"><CustomLoader /></td>
                    </tr>
                  ) : bankAccounts.length > 0 ? bankAccounts.filter(acc => {
                    const matchesFilter =
                      verificationFilter === "ALL" ||
                      (acc.status as string) === verificationFilter ||
                      (verificationFilter === "APPROVED" && ((acc.status as string) === "APPROVED" || (acc.status as string) === "VERIFIED"));
                    const matchesSearch =
                      acc.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      acc.verifiedAccountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      acc.bankName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      acc.accountNumber?.includes(searchTerm);
                    return matchesFilter && matchesSearch;
                  }).map((acc) => (
                    <tr key={acc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-6">
                         <p className="font-bold text-gray-900">ID: {acc.organizerId.slice(0,8)}</p>
                         <p className="text-[10px] text-gray-400 font-medium">
                            {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : "N/A"}
                         </p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-gray-700">{acc.bankName}</p>
                        <p className="text-xs text-gray-500 font-medium">{acc.accountNumber}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-gray-900">{acc.accountName}</p>
                        <p className="text-xs text-emerald-600 font-medium italic">Verified: {acc.verifiedAccountName}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          (acc.status as string) === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          ((acc.status as string) === 'APPROVED' || (acc.status as string) === 'VERIFIED') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {acc.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {acc.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleVerification(acc.id, "REJECTED")}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Reject"
                            >
                              <XCircle size={20} />
                            </button>
                            <button
                              onClick={() => handleVerification(acc.id, "APPROVED")}
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
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                          <ShieldCheck size={40} />
                        </div>
                        <p className="text-gray-500 font-bold">No bank verifications found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Sub-Accounts Section */}
          <div className="mt-12 space-y-4">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">
                System <span className="text-primary not-italic">Sub-Accounts</span>
              </h2>
              <p className="text-gray-500 text-sm font-medium">List of all split-payment sub-accounts on the system.</p>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Venue Owner / User</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank Details</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Name</th>
                      <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subaccount Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {subaccountsLoading ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center"><CustomLoader /></td>
                      </tr>
                    ) : subaccounts.length > 0 ? (
                      subaccounts.filter(sub => {
                        const searchLower = searchTerm.toLowerCase();
                        return (
                          !searchTerm ||
                          sub.accountName?.toLowerCase().includes(searchLower) ||
                          sub.bankName?.toLowerCase().includes(searchLower) ||
                          sub.accountNumber?.includes(searchTerm) ||
                          sub.subAccountCode?.toLowerCase().includes(searchLower) ||
                          sub.user?.fullName?.toLowerCase().includes(searchLower) ||
                          sub.user?.email?.toLowerCase().includes(searchLower)
                        );
                      }).map((sub) => (
                        <tr key={sub._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-6">
                            <p className="font-bold text-gray-900">{sub.user?.fullName || "N/A"}</p>
                            <p className="text-xs text-gray-500 font-medium">{sub.user?.email || "N/A"}</p>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-bold text-gray-700">{sub.bankName}</p>
                            <p className="text-xs text-gray-500 font-medium">{sub.accountNumber}</p>
                          </td>
                          <td className="px-8 py-6 font-bold text-gray-900 text-sm">
                            {sub.accountName}
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {sub.subAccountCode}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <CreditCard size={40} />
                          </div>
                          <p className="text-gray-500 font-bold">No system sub-accounts found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">
              Platform <span className="text-primary not-italic">Ledger Audit Trail</span>
            </h2>
            <p className="text-gray-500 text-sm font-medium">Balanced double-entry ledger batches across all platform organizers for audit and reconciliation.</p>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
             {loading ? (
               <div className="px-8 py-20 text-center"><CustomLoader /></div>
             ) : ledgers.length > 0 ? (
               <div className="divide-y divide-gray-100">
                  {ledgers.map((batch) => (
                    <div key={batch.id} className="p-8 space-y-4 hover:bg-gray-50/50 transition-colors">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                             <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg">
                                {batch.source.replace('_', ' ')}
                             </span>
                             <h4 className="text-lg font-bold text-gray-900 mt-2">{batch.description}</h4>
                             <p className="text-xs text-gray-400 font-medium mt-1">
                                Ref: {batch.reference} • Batch ID: {batch.id.slice(0, 8)} • Transaction ID: {batch.transactionId.slice(0, 8)} • {new Date(batch.createdAt).toLocaleDateString()}
                             </p>
                          </div>
                          <div className="text-left sm:text-right">
                             <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Balanced Amount</p>
                             <p className="text-xl font-black text-emerald-600">
                                {formatCurrency(batch.totalDebit)}
                             </p>
                             <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                                Balanced Ledger
                             </span>
                          </div>
                       </div>

                       {/* Ledger Entries Table */}
                       <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden mt-4">
                          <table className="w-full text-left text-xs">
                             <thead className="bg-gray-100/50 border-b border-gray-200">
                                <tr>
                                   <th className="px-6 py-3 font-bold text-gray-500 uppercase tracking-wider">Account Scope / Code</th>
                                   <th className="px-6 py-3 font-bold text-gray-500 uppercase tracking-wider">Memo</th>
                                   <th className="px-6 py-3 font-bold text-gray-500 uppercase tracking-wider text-right">Debit</th>
                                   <th className="px-6 py-3 font-bold text-gray-500 uppercase tracking-wider text-right">Credit</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                {batch.entries?.map((entry) => (
                                   <tr key={entry.id} className="hover:bg-gray-100/30">
                                      <td className="px-6 py-3.5">
                                         <p className="font-bold text-gray-900">{entry.account?.name}</p>
                                         <p className="text-[10px] text-gray-400 font-mono">{entry.account?.code}</p>
                                      </td>
                                      <td className="px-6 py-3.5 text-gray-600 font-medium">
                                         {entry.memo}
                                      </td>
                                      <td className="px-6 py-3.5 text-right font-black text-emerald-600 text-sm">
                                         {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                                      </td>
                                      <td className="px-6 py-3.5 text-right font-black text-rose-600 text-sm">
                                         {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="p-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                     <Layers size={32} />
                  </div>
                  <div>
                     <h4 className="text-lg font-black text-gray-900">No ledger entries</h4>
                     <p className="text-gray-500 font-medium max-w-xs mx-auto">No platform-wide double-entry ledger batches found yet.</p>
                  </div>
               </div>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
