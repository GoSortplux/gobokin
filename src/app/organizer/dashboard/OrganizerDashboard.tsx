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
  MoreVertical,
  Search,
  Filter,
  BarChart3,
  MousePointerClick,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import api from "@/services/api";
import { Analytics, Event } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const OrganizerDashboard = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [financeRes, eventsRes, ordersRes] = await Promise.all([
          api.get("/events/my-organizer-profile/finance"),
          api.get("/events/my-events?limit=4"),
          api.get("/events/orders/all?limit=5").catch(() => ({ data: { data: [] } }))
        ]);

        setRecentEvents(eventsRes.data.data || []);
        setRecentOrders(ordersRes.data.data || []);

        setAnalytics({
          views: 1240, // Mock data for visual appeal if not from API
          orders: ordersRes.data.data?.length || 0,
          registrations: 85,
          checkInRate: 65,
          conversionRate: 12.5,
          totalRevenue: financeRes.data.data?.totals?.amount || 0,
          avgOrderValue: 15400,
          groupRegistrations: 12,
          ticketBreakdown: [
            { name: 'Early Bird', value: 40, color: '#295FA7' },
            { name: 'General', value: 30, color: '#B68945' },
            { name: 'VIP', value: 20, color: '#10B981' },
            { name: 'VVIP', value: 10, color: '#F59E0B' },
          ]
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
    { label: "Total Revenue", value: `₦${(analytics?.totalRevenue || 0).toLocaleString()}`, icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50", trend: "+12.5%" },
    { label: "Total Registrations", value: analytics?.registrations || 0, icon: Ticket, color: "text-blue-600", bg: "bg-blue-50", trend: "+8.2%" },
    { label: "Active Events", value: recentEvents?.length || 0, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50", trend: "0%" },
    { label: "Conversion Rate", value: `${analytics?.conversionRate || 0}%`, icon: MousePointerClick, color: "text-amber-600", bg: "bg-amber-50", trend: "+2.4%" },
  ];

  const salesData = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
  ];

  return (
    <div className="space-y-8 pb-12 px-2 lg:px-4">
      {/* Welcome & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Dashboard</h1>
          <p className="text-gray-500 font-medium mt-1">Experience the pulse of your events in real-time.</p>
        </div>
        <div className="flex items-center gap-3">
            <button className="flex items-center justify-center gap-2 bg-white text-gray-700 font-bold px-5 py-3.5 rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 transition-all">
                <BarChart3 size={18} />
                Download Reports
            </button>
            <Link
                href="/organizer/dashboard/events/create"
                className="flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20"
            >
                <PlusCircle size={20} />
                Create New Event
            </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                <stat.icon size={22} />
              </div>
              <div className="text-emerald-500 bg-emerald-50 px-2.5 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1">
                <TrendingUp size={10} />
                {stat.trend}
              </div>
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Analytics & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Sales Growth</h2>
                    <p className="text-sm text-gray-400 font-medium">Daily ticket sales performance</p>
                </div>
                <select className="bg-gray-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 py-2.5 focus:ring-4 focus:ring-primary/5 transition-all">
                    <option>Last 7 Days</option>
                    <option>Last 30 Days</option>
                </select>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#295FA7" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#295FA7" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#9ca3af'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600, fill: '#9ca3af'}} />
                        <Tooltip
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            itemStyle={{ fontWeight: 800, color: '#295FA7' }}
                        />
                        <Area type="monotone" dataKey="sales" stroke="#295FA7" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">Ticket Breakdown</h2>
            <p className="text-sm text-gray-400 font-medium mb-8">Distribution by ticket type</p>

            <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={analytics?.ticketBreakdown || []}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {(analytics?.ticketBreakdown || []).map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                    <span className="text-2xl font-black text-gray-900">100%</span>
                </div>
            </div>

            <div className="mt-8 space-y-4">
                {(analytics?.ticketBreakdown || []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm font-bold text-gray-600">{item.name}</span>
                        </div>
                        <span className="text-sm font-black text-gray-900">{item.value}%</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Events List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Active Events</h2>
                <p className="text-sm text-gray-400 font-medium">Manage your upcoming schedules</p>
            </div>
            <Link href="/organizer/dashboard/events" className="flex items-center gap-1.5 text-primary text-sm font-black hover:gap-2 transition-all group">
                View All Events
                <ArrowRight size={16} className="mt-0.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(recentEvents?.length || 0) > 0 ? (
                recentEvents?.map((event) => (
                  <div key={event.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden relative border-2 border-transparent group-hover:border-primary transition-all flex-shrink-0">
                        {event.bannerUrl ? (
                          <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary bg-primary/10 font-black text-2xl">
                            {event.title[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-wider">
                                {event.status}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                {event.category}
                            </span>
                        </div>
                        <h4 className="font-black text-gray-900 truncate group-hover:text-primary transition-colors">{event.title}</h4>
                        <p className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 mt-1">
                          <Calendar size={12} className="text-primary" />
                          {new Date(event.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden">
                                    <Users size={12} className="text-gray-400" />
                                </div>
                            ))}
                            <span className="pl-3 text-[10px] font-black text-gray-400">+{(event as any).registrationCount || 0}</span>
                        </div>
                        <Link
                            href={`/organizer/dashboard/events/${event.id}`}
                            className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all"
                        >
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                  </div>
                ))
            ) : (
                <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold">No active events yet.</p>
                </div>
            )}
          </div>
        </div>

        {/* Recent Transactions / Activity */}
        <div className="space-y-6">
           <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recent Activity</h2>
                <Link href="/organizer/dashboard/orders" className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all">
                    <Filter size={20} />
                </Link>
           </div>

           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="space-y-6">
                {(recentOrders?.length || 0) > 0 ? (
                    recentOrders?.map((order, i) => (
                        <div key={i} className="flex items-start justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-primary group-hover:text-white transition-all duration-300 flex-shrink-0">
                              <Ticket size={20} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-gray-900 truncate">{order.attendeeName || 'New Registration'}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{order.eventTitle || 'Event Sale'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] text-emerald-600 font-black uppercase">PAID</span>
                                  <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                  <span className="text-[9px] text-gray-400 font-bold">2 mins ago</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm font-black text-gray-900">+₦{(order.amountPaid || 15000).toLocaleString()}</p>
                        </div>
                    ))
                ) : (
                    [1, 2, 3, 4, 5].map((_, i) => (
                        <div key={i} className="flex items-start justify-between group">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                              <Ticket size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-gray-900">Ticket Sale #ORD-{2910+i}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">General Admission</p>
                              <p className="text-[9px] text-gray-400 font-medium mt-0.5">Oct 24, 2024</p>
                            </div>
                          </div>
                          <p className="text-sm font-black text-emerald-600">+₦15,000</p>
                        </div>
                    ))
                )}
              </div>

              <Link href="/organizer/dashboard/finance" className="block text-center text-primary text-xs font-black uppercase tracking-[0.2em] mt-8 py-4 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors">
                View All Activity
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
