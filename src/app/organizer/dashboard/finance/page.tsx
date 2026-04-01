"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  Download,
  ArrowUpRight,
  CreditCard,
  History,
  ShieldCheck,
  PlusCircle,
  AlertCircle,
  Banknote,
  MoreVertical,
  CheckCircle2,
  Filter,
  Ticket
} from "lucide-react";
import api from "@/services/api";
import { FinanceSummary } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

const FinanceDashboard = () => {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFinanceData();
  }, []);

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
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  return (
    <div className="space-y-8 pb-12 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Financial Overview</h1>
          <p className="text-gray-500 font-medium mt-1">Monitor your earnings, transactions, and payouts.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center gap-2 bg-white text-gray-900 font-bold px-6 py-4 rounded-2xl hover:bg-gray-50 transition-all shadow-sm border border-gray-100">
            <Download size={20} />
            Export History
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
         <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden lg:col-span-2 shadow-2xl shadow-blue-900/20">
            <div className="relative z-10 space-y-8">
               <div className="flex items-center justify-between">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-primary backdrop-blur-md">
                     <Wallet size={28} />
                  </div>
                  <div className="px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                     Available Now
                  </div>
               </div>
               <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Total Wallet Balance</p>
                  <h2 className="text-5xl font-black tracking-tight flex items-baseline gap-2">
                    ₦{(summary?.wallet?.availableBalance || 0).toLocaleString()}
                    <span className="text-xl text-gray-500 font-bold uppercase tracking-widest">NGN</span>
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

         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 group flex flex-col justify-between">
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
                  Commission: 5% (Verified)
               </p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Transaction History */}
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-2xl font-black text-gray-900 tracking-tight">Recent Transactions</h3>
               <div className="flex items-center gap-2">
                  <button className="p-2.5 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-primary transition-all">
                    <Filter size={18} />
                  </button>
                  <button className="text-primary text-sm font-bold hover:underline px-2">View All History</button>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
               {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
                 <div className="divide-y divide-gray-50">
                    {summary.recentTransactions.map((tx, idx) => (
                      <div key={idx} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                         <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                              tx.type === 'TICKET_SALE' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                               {tx.type === 'TICKET_SALE' ? <Ticket size={24} /> : <Banknote size={24} />}
                            </div>
                            <div>
                               <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{tx.type.replace('_', ' ')}</p>
                               <p className="text-xs text-gray-500 font-medium flex items-center gap-2">
                                  <History size={12} />
                                  {new Date(tx.createdAt).toLocaleDateString()} at {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </p>
                            </div>
                         </div>
                         <div className="flex items-center gap-8">
                            <div className="text-right">
                               <p className={`font-black text-lg ${tx.type === 'WITHDRAWAL' ? 'text-red-500' : 'text-emerald-600'}`}>
                                  {tx.type === 'WITHDRAWAL' ? '-' : '+'}₦{(tx.amount || 0).toLocaleString()}
                               </p>
                               <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                  {tx.status}
                               </span>
                            </div>
                            <button className="p-2 text-gray-300 hover:text-primary transition-all">
                               <MoreVertical size={20} />
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
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
         </div>

         {/* Sidebar Tools */}
         <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-8">
               <h3 className="text-xl font-black text-gray-900 tracking-tight">Payout Settings</h3>
               <div className="p-6 bg-gray-50 rounded-3xl space-y-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                          <CreditCard size={20} />
                       </div>
                       <div>
                          <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Primary Payout Bank</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">GTBank PLC</p>
                       </div>
                    </div>
                    <div className="space-y-1">
                       <p className="text-xs text-gray-400 font-medium">Account Number</p>
                       <p className="text-lg font-black text-gray-900">0123****89</p>
                    </div>
                    <button className="mt-6 w-full py-3 bg-white text-primary font-bold rounded-2xl shadow-sm hover:shadow-md transition-all border border-blue-100 text-sm">
                       Manage Bank Accounts
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
            <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white space-y-4 relative overflow-hidden">
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
    </div>
  );
};

export default FinanceDashboard;
