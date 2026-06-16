"use client";
import React, { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  Wallet,
  PlusCircle,
  Ticket,
  BarChart3,
  MousePointerClick,
  CheckCircle2,
  ArrowRight,
  ShoppingBag
} from "lucide-react";
import Link from "next/link";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Analytics } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import {
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
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const isStaff = user?.role?.includes('organizer-staff');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (isStaff) {
            const response = await api.get("/events/my-events");
            const events = response.data.data || [];
            // Map raw Event objects to TopEvent-like structure for the table
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mappedEvents = events.map((e: any) => ({
                eventId: e.id,
                title: e.title,
                status: e.status,
                views: e.views || 0,
                registrations: e.registrationCount || 0,
                attendanceRate: e.attendanceRate || 0,
                grossRevenue: 0 // Staff shouldn't see revenue
            }));
            setAnalytics({
                topEvents: mappedEvents
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any);
        } else {
            const response = await api.get("/events/my-organizer-profile/analytics");
            setAnalytics(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isStaff]);

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

  const stats = isStaff ? [
    {
        label: "Total Registrations",
        value: (analytics?.summary?.totalRegistrations || 0).toLocaleString(),
        icon: Ticket,
        color: "text-blue-600",
        bg: "bg-blue-50"
    },
    {
        label: "Checked-in Guests",
        value: (analytics?.summary?.checkedInGuests || 0).toLocaleString(),
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50"
    },
    {
        label: "Attendance Rate",
        value: `${analytics?.summary?.attendanceRate || 0}%`,
        icon: TrendingUp,
        color: "text-purple-600",
        bg: "bg-purple-50"
    },
    {
        label: "Total Events",
        value: (analytics?.summary?.totalEvents || 0).toLocaleString(),
        icon: Calendar,
        color: "text-amber-600",
        bg: "bg-amber-50"
    },
  ] : [
    {
        label: "Gross Revenue",
        value: formatCurrency(analytics?.summary?.grossRevenue || 0),
        icon: Wallet,
        color: "text-emerald-600",
        bg: "bg-emerald-50"
    },
    {
        label: "Total Registrations",
        value: (analytics?.summary?.totalRegistrations || 0).toLocaleString(),
        icon: Ticket,
        color: "text-blue-600",
        bg: "bg-blue-50"
    },
    {
        label: "Total Orders",
        value: (analytics?.summary?.totalOrders || 0).toLocaleString(),
        icon: ShoppingBag,
        color: "text-purple-600",
        bg: "bg-purple-50"
    },
    {
        label: "Conversion Rate",
        value: `${analytics?.summary?.conversionRate || 0}%`,
        icon: MousePointerClick,
        color: "text-amber-600",
        bg: "bg-amber-50"
    },
  ];

  const salesData = analytics?.trends?.map(t => ({
    name: t.date,
    sales: t.revenue,
    registrations: t.registrations,
    views: t.views
  })) || [];

  return (
    <div className="space-y-8 pb-12 px-2 lg:px-4">
      {/* Welcome & Quick Actions */}
      <div id="organizer-dashboard-header" className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Dashboard</h1>
          <p className="text-gray-500 font-medium mt-1">Experience the pulse of your events in real-time.</p>
        </div>
        {!isStaff && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
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
        )}
      </div>

      {/* Stats Grid */}
      {!isStaff && (
      <div id="organizer-stats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                <stat.icon size={22} />
              </div>
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
          </div>
        ))}
      </div>
      )}

      {/* Analytics & Breakdown */}
      {!isStaff && (
      <div className={`grid grid-cols-1 ${isStaff ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8`}>
        {!isStaff && (
            <div id="organizer-revenue-trends" className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Revenue Trends</h2>
                        <p className="text-sm text-gray-400 font-medium">Daily revenue performance</p>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest px-4 py-2.5 bg-gray-50 rounded-xl text-gray-500">
                        Last 7 Days
                    </div>
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
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{fontSize: 10, fontWeight: 600, fill: '#9ca3af'}}
                                dy={10}
                                tickFormatter={(str) => {
                                    try {
                                        return new Date(str).toLocaleDateString('en-US', { weekday: 'short' });
                                    } catch (_e) {
                                        return str;
                                    }
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{fontSize: 10, fontWeight: 600, fill: '#9ca3af'}}
                                tickFormatter={(value) => `₦${value.toLocaleString()}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                itemStyle={{ fontWeight: 800, color: '#295FA7' }}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(value: any) => [`₦${value.toLocaleString()}`, 'Revenue']}
                            />
                            <Area type="monotone" dataKey="sales" stroke="#295FA7" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

        <div id="organizer-event-distribution" className={`bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm ${isStaff ? 'w-full' : ''}`}>
            <h2 className="text-xl font-black text-gray-900 tracking-tight mb-2">Event Distribution</h2>
            <p className="text-sm text-gray-400 font-medium mb-8">Status of your events</p>

            <div className="h-[200px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={[
                                { name: 'Upcoming', value: analytics?.summary?.upcomingEvents || 0, color: '#295FA7' },
                                { name: 'Ongoing', value: analytics?.summary?.ongoingEvents || 0, color: '#10B981' },
                                { name: 'Completed', value: analytics?.summary?.completedEvents || 0, color: '#F59E0B' },
                                { name: 'Draft', value: analytics?.summary?.draftEvents || 0, color: '#9CA3AF' },
                            ]}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {[
                                { color: '#295FA7' },
                                { color: '#10B981' },
                                { color: '#F59E0B' },
                                { color: '#9CA3AF' },
                            ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                    <span className="text-2xl font-black text-gray-900">{analytics?.summary?.totalEvents || 0}</span>
                </div>
            </div>

            <div className="mt-8 space-y-4">
                {[
                    { name: 'Upcoming', value: analytics?.summary?.upcomingEvents || 0, color: '#295FA7' },
                    { name: 'Ongoing', value: analytics?.summary?.ongoingEvents || 0, color: '#10B981' },
                    { name: 'Completed', value: analytics?.summary?.completedEvents || 0, color: '#F59E0B' },
                    { name: 'Draft', value: analytics?.summary?.draftEvents || 0, color: '#9CA3AF' },
                ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm font-bold text-gray-600">{item.name}</span>
                        </div>
                        <span className="text-sm font-black text-gray-900">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>
      )}

      {/* Top Events Table */}
      <div id="organizer-top-events" className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Top Events</h2>
                <p className="text-sm text-gray-400 font-medium">Performance by individual events</p>
            </div>
            <Link href="/organizer/dashboard/events" className="flex items-center gap-1.5 text-primary text-sm font-black hover:gap-2 transition-all group">
                View All Events
                <ArrowRight size={16} className="mt-0.5" />
            </Link>
        </div>

        <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-gray-50">
                        <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                        <th className="pb-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                        <th className="pb-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Views</th>
                        <th className="pb-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Registrations</th>
                        {!isStaff && <th className="pb-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue</th>}
                        {isStaff && <th className="pb-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendance</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {analytics?.topEvents?.map((event) => (
                        <tr key={event.eventId} className="group hover:bg-gray-50 transition-all">
                            <td className="py-5">
                                <p className="font-black text-gray-900 text-sm group-hover:text-primary transition-colors">{event.title}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ID: {event.eventId}</p>
                            </td>
                            <td className="py-5 text-center">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                    event.status === 'UPCOMING' ? 'bg-blue-50 text-blue-600' :
                                    event.status === 'ONGOING' ? 'bg-emerald-50 text-emerald-600' :
                                    event.status === 'COMPLETED' ? 'bg-amber-50 text-amber-600' :
                                    'bg-gray-50 text-gray-600'
                                }`}>
                                    {event.status}
                                </span>
                            </td>
                            <td className="py-5 text-center text-sm font-bold text-gray-600">
                                {(event.views || 0).toLocaleString()}
                            </td>
                            <td className="py-5 text-center text-sm font-bold text-gray-600">
                                {(event.registrations || 0).toLocaleString()}
                            </td>
                            {!isStaff ? (
                                <td className="py-5 text-right font-black text-gray-900 text-sm">
                                    {formatCurrency(event.grossRevenue)}
                                </td>
                            ) : (
                                <td className="py-5 text-right font-black text-gray-900 text-sm">
                                    {event.attendanceRate || 0}%
                                </td>
                            )}
                        </tr>
                    ))}
                    {!analytics?.topEvents?.length && (
                        <tr>
                            <td colSpan={5} className="py-12 text-center text-gray-400 font-bold">
                                No event data available for this period.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* Mobile View: Cards */}
        <div className="md:hidden space-y-4">
            {analytics?.topEvents?.map((event) => (
                <div key={event.eventId} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <p className="font-black text-gray-900 text-base">{event.title}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">ID: {event.eventId}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                            event.status === 'UPCOMING' ? 'bg-blue-100 text-blue-600' :
                            event.status === 'ONGOING' ? 'bg-emerald-100 text-emerald-600' :
                            event.status === 'COMPLETED' ? 'bg-amber-100 text-amber-600' :
                            'bg-gray-200 text-gray-600'
                        }`}>
                            {event.status}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200/50">
                        <div>
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Views</p>
                            <p className="text-sm font-bold text-gray-900">{(event.views || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Registrations</p>
                            <p className="text-sm font-bold text-gray-900">{(event.registrations || 0).toLocaleString()}</p>
                        </div>
                        {!isStaff ? (
                            <div className="col-span-2">
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Revenue</p>
                                <p className="text-base font-black text-primary">{formatCurrency(event.grossRevenue)}</p>
                            </div>
                        ) : (
                            <div className="col-span-2">
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Attendance Rate</p>
                                <p className="text-base font-black text-primary">{event.attendanceRate || 0}%</p>
                            </div>
                        )}
                    </div>
                </div>
            ))}
            {!analytics?.topEvents?.length && (
                <div className="py-12 text-center text-gray-400 font-bold">
                    No event data available for this period.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
