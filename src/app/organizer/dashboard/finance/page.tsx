"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  ArrowUpRight,
  CreditCard,
  History,
  ShieldCheck,
  AlertCircle,
  Banknote,
  Coins,
  MoreVertical,
  CheckCircle2,
  Filter,
  Ticket,
  RotateCcw,
  Clock,
  ExternalLink,
  Download,
  X,
  Search,
  Calendar
} from "lucide-react";
import api from "@/services/api";
import { FinanceSummary, RefundRequest, Transaction, OrganizerBankAccount } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import ProcessRefundModal from "@/components/ProcessRefundModal";
import ManageBankModal from "@/components/organizer/ManageBankModal";
import DownloadReportModal from "@/components/organizer/DownloadReportModal";
import withAuth from "@/components/auth/withAuth";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

interface OrganizerWithdrawal {
  id: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  createdAt: string;
  processedAt?: string;
  adminNotes?: string;
}

interface LedgerEntry {
  id: string;
  debit: number;
  credit: number;
  memo: string;
  account: {
    code: string;
    name: string;
    type: string;
  };
}

interface OrganizerLedgerBatch {
  id: string;
  transactionId: string;
  source: string;
  reference: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  currency: string;
  createdAt: string;
  entries: LedgerEntry[];
}

const FinanceDashboardContent = () => {
  const searchParams = useSearchParams();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [bankAccount, setBankAccount] = useState<OrganizerBankAccount | null>(null);
  const [withdrawals, setWithdrawals] = useState<OrganizerWithdrawal[]>([]);
  const [ledgers, setLedgers] = useState<OrganizerLedgerBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'transactions' | 'refunds' | 'withdrawals' | 'ledger'>('transactions');
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [organizerProfile, setOrganizerProfile] = useState<{
    commissionRate?: string | number;
    status?: string;
    isVerified?: boolean;
  } | null>(null);

  // State for Filter Drawer
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Transactions states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [txType, setTxType] = useState<string>("");
  const [txStatus, setTxStatus] = useState<string>("");
  const [txPage, setTxPage] = useState<number>(1);
  const [txLimit] = useState<number>(20);
  const [txTotalPages, setTxTotalPages] = useState<number>(1);
  const [txTotalResults, setTxTotalResults] = useState<number>(0);

  // Refund states
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [refStatus, setRefStatus] = useState<string>("");
  const [refPage, setRefPage] = useState<number>(1);
  const [refLimit] = useState<number>(20);
  const [refTotalPages, setRefTotalPages] = useState<number>(1);
  const [refTotalResults, setRefTotalResults] = useState<number>(0);

  // Withdrawal states
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [withStatus, setWithStatus] = useState<string>("");
  const [withPage, setWithPage] = useState<number>(1);
  const [withLimit] = useState<number>(20);
  const [withTotalPages, setWithTotalPages] = useState<number>(1);
  const [withTotalResults, setWithTotalResults] = useState<number>(0);

  // Ledger states
  const [loadingLedgers, setLoadingLedgers] = useState(false);
  const [ledgSource, setLedgSource] = useState<string>("");
  const [ledgTxId, setLedgTxId] = useState<string>("");
  const [ledgRef, setLedgRef] = useState<string>("");
  const [ledgStartDate, setLedgStartDate] = useState<string>("");
  const [ledgEndDate, setLedgEndDate] = useState<string>("");
  const [ledgPage, setLedgPage] = useState<number>(1);
  const [ledgLimit] = useState<number>(20);
  const [ledgTotalPages, setLedgTotalPages] = useState<number>(1);
  const [ledgTotalResults, setLedgTotalResults] = useState<number>(0);

  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "refunds" || view === "transactions" || view === "withdrawals" || view === "ledger") {
      setActiveView(view);
    }
  }, [searchParams]);

  const fetchOrganizerProfile = async () => {
    try {
      const response = await api.get("/events/my-organizer-profile");
      setOrganizerProfile(response.data.data);
    } catch (error) {
      console.error("Failed to fetch organizer profile:", error);
    }
  };

  useEffect(() => {
    fetchFinanceData();
    fetchBankAccount();
    fetchOrganizerProfile();
  }, []);

  // Reactively fetch Transactions
  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txPage, txType, txStatus]);

  // Reactively fetch Refunds
  useEffect(() => {
    fetchRefundRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refPage, refStatus]);

  // Reactively fetch Withdrawals
  useEffect(() => {
    fetchWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withPage, withStatus]);

  // Reactively fetch Ledger Audit
  useEffect(() => {
    fetchLedgers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ledgPage, ledgSource, ledgTxId, ledgRef, ledgStartDate, ledgEndDate]);

  // Intermediate/temporary filter states for the Drawer
  const [tempTxType, setTempTxType] = useState<string>("");
  const [tempTxStatus, setTempTxStatus] = useState<string>("");

  const [tempRefStatus, setTempRefStatus] = useState<string>("");

  const [tempWithStatus, setTempWithStatus] = useState<string>("");

  const [tempLedgSource, setTempLedgSource] = useState<string>("");
  const [tempLedgTxId, setTempLedgTxId] = useState<string>("");
  const [tempLedgRef, setTempLedgRef] = useState<string>("");
  const [tempLedgStartDate, setTempLedgStartDate] = useState<string>("");
  const [tempLedgEndDate, setTempLedgEndDate] = useState<string>("");

  const openFilterDrawer = () => {
    setTempTxType(txType);
    setTempTxStatus(txStatus);
    setTempRefStatus(refStatus);
    setTempWithStatus(withStatus);
    setTempLedgSource(ledgSource);
    setTempLedgTxId(ledgTxId);
    setTempLedgRef(ledgRef);
    setTempLedgStartDate(ledgStartDate);
    setTempLedgEndDate(ledgEndDate);
    setIsFilterOpen(true);
  };

  const applyFilters = () => {
    if (activeView === 'transactions') {
      setTxType(tempTxType);
      setTxStatus(tempTxStatus);
      setTxPage(1); // reset page
    } else if (activeView === 'refunds') {
      setRefStatus(tempRefStatus);
      setRefPage(1); // reset page
    } else if (activeView === 'withdrawals') {
      setWithStatus(tempWithStatus);
      setWithPage(1); // reset page
    } else if (activeView === 'ledger') {
      setLedgSource(tempLedgSource);
      setLedgTxId(tempLedgTxId);
      setLedgRef(tempLedgRef);
      setLedgStartDate(tempLedgStartDate);
      setLedgEndDate(tempLedgEndDate);
      setLedgPage(1); // reset page
    }
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    if (activeView === 'transactions') {
      setTempTxType("");
      setTempTxStatus("");
      setTxType("");
      setTxStatus("");
      setTxPage(1);
    } else if (activeView === 'refunds') {
      setTempRefStatus("");
      setRefStatus("");
      setRefPage(1);
    } else if (activeView === 'withdrawals') {
      setTempWithStatus("");
      setWithStatus("");
      setWithPage(1);
    } else if (activeView === 'ledger') {
      setTempLedgSource("");
      setTempLedgTxId("");
      setTempLedgRef("");
      setTempLedgStartDate("");
      setTempLedgEndDate("");
      setLedgSource("");
      setLedgTxId("");
      setLedgRef("");
      setLedgStartDate("");
      setLedgEndDate("");
      setLedgPage(1);
    }
    setIsFilterOpen(false);
  };

  const isFilterActive = () => {
    if (activeView === 'transactions') return !!txType || !!txStatus;
    if (activeView === 'refunds') return !!refStatus;
    if (activeView === 'withdrawals') return !!withStatus;
    if (activeView === 'ledger') return !!ledgSource || !!ledgTxId || !!ledgRef || !!ledgStartDate || !!ledgEndDate;
    return false;
  };

  const fetchBankAccount = async () => {
    try {
      const response = await api.get("/events/my-organizer-profile/bank-account");
      setBankAccount(response.data.data);
    } catch (error) {
      console.error("Failed to fetch bank account:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const params: Record<string, string | number> = {
        page: txPage,
        limit: txLimit,
      };
      if (txType) params.type = txType;
      if (txStatus) params.status = txStatus;

      const response = await api.get("/events/my-organizer-profile/finance/transactions", { params });
      setTransactions(response.data.data || []);
      if (response.data.pagination) {
        setTxTotalPages(response.data.pagination.totalPages || response.data.pagination.pages || 1);
        setTxTotalResults(response.data.pagination.totalResults || response.data.pagination.total || 0);
      } else {
        setTxTotalPages(1);
        setTxTotalResults((response.data.data || []).length);
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoadingWithdrawals(true);
      const params: Record<string, string | number> = {
        page: withPage,
        limit: withLimit,
      };
      if (withStatus) params.status = withStatus;

      const response = await api.get("/events/my-organizer-profile/withdrawals", { params });
      setWithdrawals(response.data.data || []);
      if (response.data.pagination) {
        setWithTotalPages(response.data.pagination.totalPages || response.data.pagination.pages || 1);
        setWithTotalResults(response.data.pagination.totalResults || response.data.pagination.total || 0);
      } else {
        setWithTotalPages(1);
        setWithTotalResults((response.data.data || []).length);
      }
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error);
      setWithdrawals([]);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const fetchLedgers = async () => {
    try {
      setLoadingLedgers(true);
      const params: Record<string, string | number> = {
        page: ledgPage,
        limit: ledgLimit,
      };
      if (ledgSource) params.source = ledgSource;
      if (ledgTxId) params.transactionId = ledgTxId;
      if (ledgRef) params.reference = ledgRef;
      if (ledgStartDate) params.startDate = ledgStartDate;
      if (ledgEndDate) params.endDate = ledgEndDate;

      const response = await api.get("/events/my-organizer-profile/finance/ledger", { params });
      setLedgers(response.data.data || []);
      if (response.data.pagination) {
        setLedgTotalPages(response.data.pagination.totalPages || response.data.pagination.pages || 1);
        setLedgTotalResults(response.data.pagination.totalResults || response.data.pagination.total || 0);
      } else {
        setLedgTotalPages(1);
        setLedgTotalResults((response.data.data || []).length);
      }
    } catch (error) {
      console.error("Failed to fetch double-entry ledger:", error);
      setLedgers([]);
    } finally {
      setLoadingLedgers(false);
    }
  };

  const fetchRefundRequests = async () => {
    try {
      setLoadingRefunds(true);
      const params: Record<string, string | number> = {
        page: refPage,
        limit: refLimit,
      };
      if (refStatus) params.status = refStatus;

      const response = await api.get("/events/my-organizer-profile/refund-requests", { params });
      setRefundRequests(response.data.data || []);
      if (response.data.pagination) {
        setRefTotalPages(response.data.pagination.totalPages || response.data.pagination.pages || 1);
        setRefTotalResults(response.data.pagination.totalResults || response.data.pagination.total || 0);
      } else {
        setRefTotalPages(1);
        setRefTotalResults((response.data.data || []).length);
      }
    } catch (error) {
      console.error("Failed to fetch refund requests:", error);
      setRefundRequests([]);
    } finally {
      setLoadingRefunds(false);
    }
  };

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/my-organizer-profile/finance");
      setSummary(response.data.data);
    } catch (error) {
      console.error("Failed to fetch finance data:", error);
      // Fallback data for preview/development
      setSummary({
        wallet: { id: "1", pendingBalance: 0, availableBalance: 0, withdrawnBalance: 0, currency: "NGN" },
        totals: { amount: 0, commission: 0, netAmount: 0 },
        transactionCount: 0,
        recentTransactions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const { value: amount, isConfirmed } = await Swal.fire({
      title: 'Top up Wallet',
      text: 'Enter the amount you would like to add to your wallet balance.',
      input: 'number',
      inputPlaceholder: 'Enter amount (e.g. 5000)',
      showCancelButton: true,
      confirmButtonText: 'Initialize Payment',
      confirmButtonColor: '#295FA7',
      inputValidator: (value) => {
        if (!value || parseFloat(value) <= 0) {
          return 'Please enter a valid amount';
        }
      }
    });

    if (isConfirmed && amount) {
      try {
        Swal.showLoading();
        const response = await api.post("/events/wallet/top-up", {
          amount: parseFloat(amount)
        });

        // Assuming the response contains a payment URL for Paystack/Flutterwave
        if (response.data.data?.authorization_url) {
          window.location.href = response.data.data.authorization_url;
        } else {
          Swal.fire('Success', 'Top-up request initialized. Please follow the instructions to complete payment.', 'success');
          fetchFinanceData();
        }
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  const handleWithdraw = async () => {
    if (!summary || summary.wallet.availableBalance <= 0) {
      Swal.fire("Ineligible", "No available balance for withdrawal.", "info");
      return;
    }

    const { value: amount, isConfirmed } = await Swal.fire({
      title: 'Withdraw Funds',
      text: `Available Balance: ₦${summary.wallet.availableBalance.toLocaleString()}`,
      input: 'number',
      inputPlaceholder: 'Enter amount to withdraw...',
      showCancelButton: true,
      confirmButtonText: 'Submit Request',
      confirmButtonColor: '#295FA7',
    });

    if (isConfirmed && amount) {
      try {
        Swal.showLoading();
        await api.post("/events/withdrawals", {
           amount: parseFloat(amount),
           bankDetails: {
              bankName: "Default Bank", // This would normally come from profile/settings
              accountNumber: "0000000000",
              accountName: "Organizer Name"
           }
        });
        Swal.fire('Success!', 'Your withdrawal request has been submitted.', 'success');
        fetchFinanceData();
        fetchWithdrawals();
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  return (
    <div className="space-y-8 pb-12 px-2 lg:px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Financial Overview</h1>
          <p className="text-gray-500 font-medium mt-1">Monitor your earnings, transactions, and payouts.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsDownloadModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white text-gray-900 font-bold px-6 py-4 rounded-2xl hover:bg-gray-50 transition-all shadow-sm border border-gray-100"
          >
            <Download size={20} className="text-primary" />
            Download Report
          </button>
          <button
            onClick={handleTopUp}
            className="flex items-center justify-center gap-2 bg-white text-gray-900 font-bold px-6 py-4 rounded-2xl hover:bg-gray-50 transition-all shadow-sm border border-gray-100"
          >
            <Coins size={20} className="text-primary" />
            Top Up Wallet
          </button>
          <button
            onClick={handleWithdraw}
            className="flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20"
          >
            <Banknote size={20} />
            Withdraw Funds
          </button>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-gray-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden lg:col-span-2 shadow-2xl shadow-blue-900/20">
            <div className="relative z-10 space-y-8">
               <div className="flex items-center justify-between">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary backdrop-blur-md">
                     <Wallet size={24} className="md:w-7 md:h-7" />
                  </div>
                  <div className="px-3 md:px-4 py-1 md:py-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                     Available Now
                  </div>
               </div>
               <div>
                  <p className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Total Wallet Balance</p>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight flex flex-wrap items-baseline gap-2">
                    ₦{(summary?.wallet?.availableBalance || 0).toLocaleString()}
                    <span className="text-sm md:text-xl text-gray-500 font-bold uppercase tracking-widest">NGN</span>
                  </h2>
               </div>
               <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Pending Funds</p>
                    <p className="text-xl font-bold">₦{(summary?.wallet?.pendingBalance || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Total Withdrawn</p>
                    <p className="text-xl font-bold">₦{(summary?.wallet?.withdrawnBalance || 0).toLocaleString()}</p>
                  </div>
               </div>
            </div>
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
         </div>

         <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group flex flex-col justify-between">
            <div className="w-14 h-14 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
               <TrendingUp size={28} />
            </div>
            <div>
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Gross Revenue</p>
               <h3 className="text-3xl font-black text-gray-900 leading-tight">₦{(summary?.totals?.amount || 0).toLocaleString()}</h3>
               <p className="text-xs text-emerald-500 font-bold flex items-center gap-1 mt-2">
                  <ArrowUpRight size={14} />
                  +15% from last month
               </p>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group flex flex-col justify-between">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
               <ShieldCheck size={28} />
            </div>
            <div>
               <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5">Platform Fees</p>
               <h3 className="text-3xl font-black text-gray-900 leading-tight">₦{(summary?.totals?.commission || 0).toLocaleString()}</h3>
               <p className="text-xs text-gray-400 font-bold flex items-center gap-1 mt-2">
                  Commission: {organizerProfile?.commissionRate !== undefined && organizerProfile?.commissionRate !== null ? organizerProfile.commissionRate : 5}% {organizerProfile?.status === 'VERIFIED' || organizerProfile?.isVerified ? '(Verified)' : ''}
               </p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
               <div className="flex items-center p-1 bg-gray-50 rounded-2xl border border-gray-100">
                 <button
                   onClick={() => setActiveView('transactions')}
                   className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all ${
                     activeView === 'transactions' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                   }`}
                 >
                   Transactions
                 </button>
                 <button
                   onClick={() => setActiveView('refunds')}
                   className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2 ${
                     activeView === 'refunds' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                   }`}
                 >
                   Refunds
                   {refundRequests.filter(r => r.status === 'PENDING').length > 0 && (
                     <span className="w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">
                       {refundRequests.filter(r => r.status === 'PENDING').length}
                     </span>
                   )}
                 </button>
                 <button
                   onClick={() => setActiveView('withdrawals')}
                   className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2 ${
                     activeView === 'withdrawals' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                   }`}
                 >
                   Withdrawals
                 </button>
                 <button
                   onClick={() => setActiveView('ledger')}
                   className={`flex-1 sm:flex-none px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all flex items-center justify-center gap-2 ${
                     activeView === 'ledger' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'
                   }`}
                 >
                   Ledger Audit
                 </button>
               </div>

               <div className="flex items-center gap-2">
                  <button
                    onClick={openFilterDrawer}
                    className={`p-2.5 bg-white rounded-xl border transition-all relative ${
                      isFilterActive()
                        ? "text-primary border-primary bg-blue-50/50 hover:bg-blue-100"
                        : "text-gray-400 hover:text-primary border-gray-100"
                    }`}
                    title="Filter Results"
                  >
                    <Filter size={18} />
                    {isFilterActive() && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse" />
                    )}
                  </button>
               </div>
            </div>

            {activeView === 'transactions' ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
                 {loadingTransactions ? (
                   <div className="py-20 flex justify-center"><CustomLoader /></div>
                 ) : transactions && transactions.length > 0 ? (
                   <>
                     <div className="divide-y divide-gray-50">
                      {transactions.map((tx: Transaction, idx: number) => (
                        <div key={tx.id || idx} className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors group gap-4">
                             <div className="flex items-center gap-4 md:gap-5">
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
                                  tx.type === 'TICKET_SALE' || tx.type === 'TICKET_PURCHASE' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                                }`}>
                                   {tx.type === 'TICKET_SALE' || tx.type === 'TICKET_PURCHASE' ? <Ticket size={20} className="md:w-6 md:h-6" /> : <Banknote size={20} className="md:w-6 md:h-6" />}
                                </div>
                                <div>
                                 <p className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm md:text-base">{(tx.type || '').replace('_', ' ')}</p>
                                   <p className="text-[10px] md:text-xs text-gray-500 font-medium flex items-center gap-2 mt-0.5">
                                      <History size={10} className="md:w-3 md:h-3" />
                                      {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </p>
                                </div>
                             </div>
                             <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-8">
                                <div className="text-left sm:text-right">
                                   <p className={`font-black text-base md:text-lg ${
                                      tx.type === 'WITHDRAWAL' ||
                                      ['FAILED', 'REJECTED', 'CANCELLED'].includes(String(tx.status || "").toUpperCase())
                                         ? 'text-red-500'
                                         : 'text-emerald-600'
                                   }`}>
                                      {tx.type === 'WITHDRAWAL' ? '-' : '+'}₦{(tx.amount || 0).toLocaleString()}
                                   </p>
                                   <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl ${
                                      ['FAILED', 'REJECTED', 'CANCELLED'].includes(String(tx.status || "").toUpperCase())
                                         ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                         : 'bg-gray-100 text-gray-500'
                                   }`}>
                                      {tx.status}
                                   </span>
                                </div>
                                <button className="p-2 text-gray-300 hover:text-primary transition-all">
                                   <MoreVertical size={18} className="md:w-5 md:h-5" />
                                </button>
                             </div>
                          </div>
                        ))}
                     </div>

                     {txTotalPages > 1 && (
                       <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <p className="text-xs text-gray-500 font-bold">
                             Showing Page {txPage} of {txTotalPages} ({txTotalResults} Total Transactions)
                          </p>
                          <div className="flex items-center gap-2">
                             <button
                               onClick={() => setTxPage(p => Math.max(1, p - 1))}
                               disabled={txPage === 1}
                               className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                             >
                                Previous
                             </button>
                             <button
                               onClick={() => setTxPage(p => Math.min(txTotalPages, p + 1))}
                               disabled={txPage === txTotalPages}
                               className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                             >
                                Next
                             </button>
                          </div>
                       </div>
                     )}
                   </>
                 ) : (
                   <div className="p-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                         <History size={32} />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-gray-900">No transactions yet</h4>
                         <p className="text-gray-500 font-medium max-w-xs mx-auto">All your ticket sales and withdrawal requests will appear here once your event starts selling.</p>
                      </div>
                   </div>
                 )}
              </div>
            ) : activeView === 'refunds' ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                 {loadingRefunds ? (
                   <div className="py-20 flex justify-center"><CustomLoader /></div>
                 ) : refundRequests && refundRequests.length > 0 ? (
                   <>
                     <div className="divide-y divide-gray-50">
                        {refundRequests.map((req) => (
                          <div key={req.id} className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors group gap-4">
                             <div className="flex items-center gap-4 md:gap-5">
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
                                  req.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                                  req.status === 'APPROVED' || req.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                  'bg-red-50 text-red-600'
                                }`}>
                                   {req.status === 'PENDING' ? <Clock size={20} className="md:w-6 md:h-6" /> : <RotateCcw size={20} className="md:w-6 md:h-6" />}
                                </div>
                                <div>
                                   <div className="flex flex-wrap items-center gap-2">
                                     <p className="font-bold text-gray-900 text-sm md:text-base">{req.registration?.attendeeData?.fullName || "Guest"}</p>
                                     <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-1.5 md:px-2 py-0.5 rounded-full ${
                                        req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                        req.status === 'APPROVED' || req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-red-100 text-red-700'
                                     }`}>
                                        {req.status}
                                     </span>
                                   </div>
                                   <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-0.5">
                                      {req.registration?.event?.title || "N/A"} • Ticket: {req.registration?.ticketNumber || "N/A"}
                                   </p>
                                </div>
                             </div>
                             <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-8">
                                <div className="text-left sm:text-right">
                                   <p className="font-black text-base md:text-lg text-gray-900">
                                      ₦{(req.registration?.pricePaid || 0).toLocaleString()}
                                   </p>
                                   <p className="text-[9px] md:text-[10px] text-gray-400 font-medium">
                                      {new Date(req.createdAt).toLocaleDateString()}
                                   </p>
                                </div>
                                {req.status === 'PENDING' && (
                                  <button
                                    onClick={() => setSelectedRequest(req)}
                                    className="bg-primary text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-3 md:px-4 py-2 rounded-xl shadow-lg shadow-primary/10 hover:brightness-110 transition-all"
                                  >
                                    Process
                                  </button>
                                )}
                             </div>
                          </div>
                        ))}
                     </div>

                     {refTotalPages > 1 && (
                       <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <p className="text-xs text-gray-500 font-bold">
                             Showing Page {refPage} of {refTotalPages} ({refTotalResults} Total Refund Requests)
                          </p>
                          <div className="flex items-center gap-2">
                             <button
                               onClick={() => setRefPage(p => Math.max(1, p - 1))}
                               disabled={refPage === 1}
                               className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                             >
                                Previous
                             </button>
                             <button
                               onClick={() => setRefPage(p => Math.min(refTotalPages, p + 1))}
                               disabled={refPage === refTotalPages}
                               className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                             >
                                Next
                             </button>
                          </div>
                       </div>
                     )}
                   </>
                 ) : (
                   <div className="p-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                         <RotateCcw size={32} />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-gray-900">No refund requests</h4>
                         <p className="text-gray-500 font-medium max-w-xs mx-auto">Guest refund requests will appear here for your review and processing.</p>
                      </div>
                   </div>
                 )}
              </div>
            ) : activeView === 'withdrawals' ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                 {loadingWithdrawals ? (
                   <div className="py-20 flex justify-center"><CustomLoader /></div>
                 ) : withdrawals && withdrawals.length > 0 ? (
                   <>
                     <div className="divide-y divide-gray-50">
                        {withdrawals.map((w) => (
                          <div key={w.id} className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors group gap-4">
                             <div className="flex items-center gap-4 md:gap-5">
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${
                                  w.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                                  w.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' :
                                  'bg-red-50 text-red-600'
                                }`}>
                                   {w.status === 'PENDING' ? <Clock size={20} className="md:w-6 md:h-6" /> : <CheckCircle2 size={20} className="md:w-6 md:h-6" />}
                                </div>
                                <div>
                                   <div className="flex flex-wrap items-center gap-2">
                                     <p className="font-bold text-gray-900 text-sm md:text-base">
                                       {w.bankDetails?.bankName || 'Bank Payout'}
                                     </p>
                                     <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-1.5 md:px-2 py-0.5 rounded-full ${
                                        w.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                        w.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                                        'bg-red-100 text-red-700'
                                     }`}>
                                        {w.status}
                                     </span>
                                   </div>
                                   <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-0.5">
                                      Account: {w.bankDetails?.accountNumber || 'N/A'} • {w.bankDetails?.accountName || 'N/A'}
                                   </p>
                                   {w.adminNotes && (
                                     <div className="mt-2 text-xs bg-gray-50 border border-gray-100 rounded-xl p-3 text-gray-600 font-medium">
                                       <span className="font-bold text-gray-800">Admin Notes:</span> {w.adminNotes}
                                     </div>
                                   )}
                                </div>
                             </div>
                             <div className="flex items-center justify-between sm:justify-end gap-4 md:gap-8">
                                <div className="text-left sm:text-right">
                                   <p className="font-black text-base md:text-lg text-red-500">
                                      -₦{(w.amount || 0).toLocaleString()}
                                   </p>
                                   <p className="text-[9px] md:text-[10px] text-gray-400 font-medium">
                                      Requested: {new Date(w.createdAt).toLocaleDateString()}
                                   </p>
                                   {w.processedAt && (
                                     <p className="text-[8px] md:text-[9px] text-gray-400 font-medium">
                                        Processed: {new Date(w.processedAt).toLocaleDateString()}
                                     </p>
                                   )}
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>

                     {withTotalPages > 1 && (
                       <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <p className="text-xs text-gray-500 font-bold">
                             Showing Page {withPage} of {withTotalPages} ({withTotalResults} Total Withdrawals)
                          </p>
                          <div className="flex items-center gap-2">
                             <button
                               onClick={() => setWithPage(p => Math.max(1, p - 1))}
                               disabled={withPage === 1}
                               className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                             >
                                Previous
                             </button>
                             <button
                               onClick={() => setWithPage(p => Math.min(withTotalPages, p + 1))}
                               disabled={withPage === withTotalPages}
                               className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                             >
                                Next
                             </button>
                          </div>
                       </div>
                     )}
                   </>
                 ) : (
                   <div className="p-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                         <Banknote size={32} />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-gray-900">No withdrawals yet</h4>
                         <p className="text-gray-500 font-medium max-w-xs mx-auto">Your withdrawal requests and payout history will appear here once processed.</p>
                      </div>
                   </div>
                 )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                 {loadingLedgers ? (
                   <div className="py-20 flex justify-center"><CustomLoader /></div>
                 ) : ledgers && ledgers.length > 0 ? (
                   <>
                     <div className="divide-y divide-gray-100">
                        {ledgers.map((batch) => (
                          <div key={batch.id} className="p-6 space-y-4">
                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                   <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg">
                                      {batch.source?.replace('_', ' ') || "GENERAL"}
                                   </span>
                                   <h4 className="text-base font-bold text-gray-900 mt-2">{batch.description || "No Description"}</h4>
                                   <p className="text-xs text-gray-400 font-medium mt-1">
                                      Ref: {batch.reference || "N/A"} • ID: {batch.id?.slice(0, 8) || "N/A"} • {batch.createdAt ? new Date(batch.createdAt).toLocaleDateString() : "N/A"}
                                   </p>
                                </div>
                                <div className="text-left sm:text-right">
                                   <p className="text-sm font-black text-gray-900">Total Balanced Volume</p>
                                   <p className="text-lg font-black text-emerald-600">
                                      ₦{(batch.totalDebit || 0).toLocaleString()}
                                   </p>
                                   <span className="text-[9px] md:text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                      Balanced Ledger
                                   </span>
                                </div>
                             </div>

                             <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden mt-3">
                                <table className="w-full text-left text-xs">
                                   <thead className="bg-gray-100/50 border-b border-gray-200">
                                      <tr>
                                         <th className="px-4 py-2.5 font-bold text-gray-500">Account</th>
                                         <th className="px-4 py-2.5 font-bold text-gray-500">Memo</th>
                                         <th className="px-4 py-2.5 font-bold text-gray-500 text-right">Debit</th>
                                         <th className="px-4 py-2.5 font-bold text-gray-500 text-right">Credit</th>
                                      </tr>
                                   </thead>
                                   <tbody className="divide-y divide-gray-100">
                                      {batch.entries?.map((entry) => (
                                         <tr key={entry.id} className="hover:bg-gray-100/30">
                                            <td className="px-4 py-2.5">
                                               <p className="font-bold text-gray-900">{entry.account?.name}</p>
                                               <p className="text-[10px] text-gray-400 font-mono">{entry.account?.code}</p>
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-600 font-medium">
                                               {entry.memo}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-bold text-emerald-600">
                                               {entry.debit > 0 ? `₦${entry.debit.toLocaleString()}` : '—'}
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-bold text-rose-600">
                                               {entry.credit > 0 ? `₦${entry.credit.toLocaleString()}` : '—'}
                                            </td>
                                         </tr>
                                      ))}
                                   </tbody>
                                </table>
                             </div>
                          </div>
                        ))}
                     </div>

                     {ledgTotalPages > 1 && (
                       <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <p className="text-xs text-gray-500 font-bold">
                             Showing Page {ledgPage} of {ledgTotalPages} ({ledgTotalResults} Total Ledger Batches)
                          </p>
                          <div className="flex items-center gap-2">
                             <button
                               onClick={() => setLedgPage(p => Math.max(1, p - 1))}
                               disabled={ledgPage === 1}
                               className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                             >
                                Previous
                             </button>
                             <button
                               onClick={() => setLedgPage(p => Math.min(ledgTotalPages, p + 1))}
                               disabled={ledgPage === ledgTotalPages}
                               className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                             >
                                Next
                             </button>
                          </div>
                       </div>
                     )}
                   </>
                 ) : (
                   <div className="p-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                         <History size={32} />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-gray-900">No ledger entries</h4>
                         <p className="text-gray-500 font-medium max-w-xs mx-auto">Balanced double-entry ledger batches for auditing will appear here once your transactions begin.</p>
                      </div>
                   </div>
                 )}
              </div>
            )}
         </div>

         {/* Sidebar Tools */}
         <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-8">
               <h3 className="text-xl font-black text-gray-900 tracking-tight">Payout Settings</h3>
               <div className="p-6 bg-gray-50 rounded-3xl space-y-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                            <CreditCard size={20} />
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Primary Payout Bank</p>
                            <p className="text-sm font-bold text-gray-900 mt-1">{bankAccount?.bankName || "No Bank Added"}</p>
                        </div>
                      </div>
                      {bankAccount?.status === 'PENDING' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-600 text-[9px] font-black uppercase rounded-full border border-amber-200">
                          Pending Approval
                        </span>
                      )}
                      {bankAccount?.status === 'APPROVED' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase rounded-full border border-emerald-200">
                          Verified
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                       <p className="text-xs text-gray-400 font-medium">Account Number</p>
                       <p className="text-lg font-black text-gray-900">
                        {bankAccount?.accountNumber
                          ? `${bankAccount.accountNumber.slice(0, 4)}****${bankAccount.accountNumber.slice(-2)}`
                          : "XXXX****XX"}
                       </p>
                    </div>
                    <button
                      onClick={() => setIsBankModalOpen(true)}
                      className="mt-6 w-full py-3 bg-white text-primary font-bold rounded-2xl shadow-sm hover:shadow-md transition-all border border-blue-100 text-sm flex items-center justify-center gap-2"
                    >
                       <ExternalLink size={14} />
                       {bankAccount ? "Manage Bank Account" : "Add Bank Account"}
                    </button>
                  </div>
                  {/* Subtle background icon */}
                  <ShieldCheck className="absolute -bottom-4 -right-4 w-24 h-24 text-gray-200/50" />
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                        <CheckCircle2 size={20} />
                     </div>
                     <div>
                        <p className="text-xs font-black text-emerald-900 uppercase tracking-widest">Payout Frequency</p>
                        <p className="text-sm font-bold text-emerald-700">T+1 (Instant Payout)</p>
                     </div>
                  </div>

                  <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                     <p className="text-sm font-black text-primary uppercase tracking-widest mb-3">Verification Badge</p>
                     <p className="text-xs text-blue-800 font-medium leading-relaxed">You are a <span className="font-bold">Verified Organizer</span>. Enjoy the lowest transaction fees and fastest settlement times on Gobokin.</p>
                  </div>
               </div>
            </div>

            {/* Need Help? */}
            <div className="bg-gray-900 rounded-3xl p-8 text-white space-y-4 relative overflow-hidden">
               <div className="relative z-10">
                  <h4 className="text-lg font-black tracking-tight">Need financial help?</h4>
                  <p className="text-blue-100/60 text-sm leading-relaxed mb-6">Our dedicated finance team is available 24/7 to resolve any payment or withdrawal issues.</p>
                  <Link href="/support" className="flex items-center gap-2 text-white font-bold hover:gap-3 transition-all">
                     Chat with Finance Support
                     <ArrowUpRight size={18} />
                  </Link>
               </div>
               <AlertCircle className="absolute -top-6 -right-6 w-24 h-24 text-white/5" />
            </div>
         </div>
      </div>

      {selectedRequest && (
        <ProcessRefundModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={() => {
            fetchRefundRequests();
            fetchFinanceData();
          }}
        />
      )}

      <ManageBankModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onSuccess={fetchBankAccount}
        initialData={bankAccount}
      />

      <DownloadReportModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        initialReportType="finance"
      />

      {/* Slide-over Filter Drawer (Option C) */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-[150] overflow-hidden">
          {/* Backdrop overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
            onClick={() => setIsFilterOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col z-[160] animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary text-white">
              <div className="flex items-center gap-3">
                <Filter size={20} />
                <h3 className="text-xl font-black tracking-tight capitalize">
                  Filter {activeView === 'ledger' ? 'Ledger Audit' : activeView}
                </h3>
              </div>
              <button
                onClick={() => setIsFilterOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {activeView === 'transactions' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Ticket size={12} className="text-primary" />
                      Transaction Type
                    </label>
                    <select
                      value={tempTxType}
                      onChange={(e) => setTempTxType(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all cursor-pointer"
                    >
                      <option value="">All Types</option>
                      <option value="TICKET_PURCHASE">Ticket Purchase</option>
                      <option value="COMMISSION">Commission</option>
                      <option value="REFUND">Refund</option>
                      <option value="WITHDRAWAL">Withdrawal</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle2 size={12} className="text-primary" />
                      Status
                    </label>
                    <select
                      value={tempTxStatus}
                      onChange={(e) => setTempTxStatus(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all cursor-pointer"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="SUCCESSFUL">Successful</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>
                </>
              )}

              {activeView === 'refunds' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-primary" />
                    Refund Status
                  </label>
                  <select
                    value={tempRefStatus}
                    onChange={(e) => setTempRefStatus(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              )}

              {activeView === 'withdrawals' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-primary" />
                    Withdrawal Status
                  </label>
                  <select
                    value={tempWithStatus}
                    onChange={(e) => setTempWithStatus(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>
              )}

              {activeView === 'ledger' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <History size={12} className="text-primary" />
                      Postings Source
                    </label>
                    <select
                      value={tempLedgSource}
                      onChange={(e) => setTempLedgSource(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all cursor-pointer"
                    >
                      <option value="">All Sources</option>
                      <option value="TICKET_PURCHASE">Ticket Purchase</option>
                      <option value="REFUND">Refund</option>
                      <option value="WALLET_TOPUP">Wallet Topup</option>
                      <option value="WITHDRAWAL_REQUEST">Withdrawal Request</option>
                      <option value="SETTLEMENT">Settlement</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Search size={12} className="text-primary" />
                      Transaction ID (UUID)
                    </label>
                    <input
                      type="text"
                      placeholder="Enter transaction UUID"
                      value={tempLedgTxId}
                      onChange={(e) => setTempLedgTxId(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <History size={12} className="text-primary" />
                      Reference
                    </label>
                    <input
                      type="text"
                      placeholder="Enter reference string"
                      value={tempLedgRef}
                      onChange={(e) => setTempLedgRef(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} className="text-primary" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={tempLedgStartDate}
                      onChange={(e) => setTempLedgStartDate(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={12} className="text-primary" />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={tempLedgEndDate}
                      onChange={(e) => setTempLedgEndDate(e.target.value)}
                      className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 shrink-0">
              <div className="flex items-center gap-4">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 font-bold rounded-2xl text-xs uppercase tracking-widest transition-all"
                >
                  Clear Filters
                </button>
                <button
                  onClick={applyFilters}
                  className="flex-1 py-3.5 bg-primary text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-opacity-95 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FinanceDashboard = () => (
  <Suspense fallback={<div className="h-full flex items-center justify-center"><CustomLoader /></div>}>
    <FinanceDashboardContent />
  </Suspense>
);

export default withAuth(FinanceDashboard, ["organizer", "organizer-staff"]);
