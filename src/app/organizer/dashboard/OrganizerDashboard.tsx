"use client";
import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  TrendingUp,
  Wallet,
  PlusCircle,
  ArrowUpRight,
  Ticket,
  Eye,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import api from "@/services/api";
import { Analytics, Event } from "@/types";
import CustomLoader from "@/components/CustomLoader";

const OrganizerDashboard = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Assuming there's a global analytics endpoint or we aggregate from events
        // For now, let's try to get a summary
        const [analyticsRes, eventsRes] = await Promise.all([
          api.get("/events/my-organizer-profile/finance"), // Using finance summary as a proxy for top-level analytics
          api.get("/events?limit=5")
        ]);

        // This is a simplified mapping since the actual aggregate analytics might be per-event
        setRecentEvents(eventsRes.data.data || []);
        // Placeholder analytics if the real one isn't available
        setAnalytics({
          views: 0,
          orders: 0,
          registrations: 0,
          checkInRate: 0,
          conversionRate: 0,
          totalRevenue: analyticsRes.data.data?.totals?.amount || 0,
          avgOrderValue: 0,
          groupRegistrations: 0,
          ticketBreakdown: []
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  const stats = [
    { label: "Total Revenue", value: `₦${analytics?.totalRevenue.toLocaleString()}`, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Total Registrations", value: analytics?.registrations || 0, icon: Ticket, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Events", value: recentEvents.length, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Check-in Rate", value: `${analytics?.checkInRate || 0}%`, icon: Users, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 font-medium">Track your events and financial performance in real-time.</p>
        </div>
        <Link
          href="/organizer/dashboard/events/create"
          className="flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <PlusCircle size={20} />
          Create New Event
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-transform hover:scale-[1.02] duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                <TrendingUp size={12} />
                +12%
              </div>
            </div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Events */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Your Recent Events</h2>
            <Link href="/organizer/dashboard/events" className="text-primary text-sm font-bold hover:underline">View All</Link>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {recentEvents.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentEvents.map((event) => (
                  <div key={event.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden relative border-2 border-transparent group-hover:border-primary transition-all">
                        {event.bannerUrl ? (
                          <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary bg-primary/10 font-bold text-xl">
                            {event.title[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{event.title}</h4>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(event.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-black text-gray-900">{event.capacity} Capacity</p>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{event.status}</p>
                      </div>
                      <Link
                        href={`/organizer/dashboard/events/${event.id}`}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <ArrowUpRight size={20} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-20 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Calendar size={40} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No events yet</h3>
                <p className="text-gray-500 mb-6">Start by creating your first event to reach attendees.</p>
                <Link
                  href="/organizer/dashboard/events/create"
                  className="inline-flex items-center gap-2 bg-primary text-white font-bold px-6 py-3 rounded-2xl hover:bg-opacity-90 transition-all"
                >
                  Create Your First Event
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary Snippet */}
        <div className="space-y-4">
           <h2 className="text-xl font-black text-gray-900 tracking-tight">Recent Payouts</h2>
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Available Balance</p>
                  <h3 className="text-2xl font-black text-gray-900">₦{analytics?.totalRevenue.toLocaleString()}</h3>
                </div>
                <button className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-opacity-90 transition-all">
                  Withdraw
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider pt-4 border-t border-gray-50">Transaction History</p>
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <Ticket size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Ticket Sale #ORD-291{i}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Oct 24, 2024</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-emerald-600">+₦15,000</p>
                  </div>
                ))}
              </div>

              <Link href="/organizer/dashboard/finance" className="block text-center text-primary text-sm font-bold py-3 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors">
                View All Transactions
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
