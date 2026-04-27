"use client";
import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar,
  Layers,
  Users
} from "lucide-react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import { formatCurrency } from "@/utils/currency";

const FinanceSummary = () => {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

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

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

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
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financial Summary</h1>
        <p className="text-gray-500 font-medium">Platform-wide financial performance and revenue metrics.</p>
      </div>

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
    </div>
  );
};

export default FinanceSummary;
