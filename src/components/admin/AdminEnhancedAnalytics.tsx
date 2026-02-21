'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/services/api';
import { format as formatDate } from 'date-fns';
import { DateRange, Range } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import { TrendingUp, TrendingDown, Calendar as CalendarIcon, ChevronDown, DollarSign, Briefcase, Shield, Percent } from 'lucide-react';
import dynamic from 'next/dynamic';

const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false, loading: () => <div className="animate-pulse bg-gray-200 h-[300px] w-full rounded-md" /> });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });

// Type definitions for the analytics data
interface OverallStats {
  systemGrossVolume: number;
  totalOwnerPayouts: number;
  totalPlatformNet: number;
  totalRefunded: number;
  totalViews: number;
  totalDemoBookings: number;
  totalBookings: {
    confirmed: number;
    cancelled: number;
    pending: number;
  };
  totalReservations: {
    new: number;
    converted: number;
    expired: number;
    active: number;
  };
}

interface PlatformRevenue {
  totalPlatformNet: number;
  subscriptionRevenue: number;
  bookingCommissionRevenue: number;
  commissionRate: string;
}

interface VenuePerformance {
  _id: string;
  owner: {
    _id: string;
    fullName: string;
    email: string;
  };
  name: string;
  revenue: number;
  bookingCount: number;
  viewCount: number;
  score: number;
}

interface InactiveVenue {
  hallId: string;
  hallName: string;
  ownerName?: string;
  reason?: string;
}

interface TopCustomer {
  totalSpent: number;
  userId: string;
  fullName: string;
  email: string;
}

interface UserInsights {
  topCustomers: TopCustomer[];
  subscriptionCounts: {
    new: number;
    expired: number;
    totalActive: number;
  };
}

interface DataComparison {
  currentPeriod: {
    from: string;
    to: string;
    bookingRevenue: number;
    subscriptionRevenue: number;
  };
  previousPeriod: {
    from: string;
    to: string;
    bookingRevenue: number;
    subscriptionRevenue: number;
  };
  change: {
    bookingRevenuePercentage: string;
    subscriptionRevenuePercentage: string;
  };
}

interface AdminAnalyticsData {
  overallStats: OverallStats;
  platformRevenue: PlatformRevenue;
  hallPerformance: {
    mostActiveHalls: VenuePerformance[];
    inactiveHalls: InactiveVenue[];
  };
  userInsights: UserInsights;
  dataComparison: DataComparison;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

const TrendIndicator = ({ percentage }: { percentage: string }) => {
    const isPositive = !percentage.startsWith('-');
    return <span className={`flex items-center text-[10px] font-bold mt-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>{isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}{percentage} <span className="text-gray-400 ml-1 font-medium">vs last period</span></span>;
};

const AdminStatCard = ({ title, value, icon: Icon, trend }: { title: string; value: string | number; icon: React.ElementType; trend?: string }) => (
  <div className="bg-white p-4 sm:p-5 lg:p-6 rounded-xl shadow-md flex items-center space-x-3 sm:space-x-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-100 min-w-0">
    <div className="bg-blue-50 p-4 rounded-xl text-primary flex-shrink-0">
      <Icon className="h-6 w-6" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate" title={title}>{title}</p>
      <p className="text-2xl font-black text-gray-900 mt-0.5 truncate" title={String(value)}>{value}</p>
      {trend && <TrendIndicator percentage={trend} />}
    </div>
  </div>
);

const formatDateRange = (start: Date | undefined, end: Date | undefined) => {
    if (!start || !end) return '';
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear === endYear) {
        return `${formatDate(start, "MMM d")} - ${formatDate(end, "MMM d, yyyy")}`;
    }
    return `${formatDate(start, "MMM d, yyyy")} - ${formatDate(end, "MMM d, yyyy")}`;
};

const AdminEnhancedAnalytics = () => {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateRange, setDateRange] = useState<Range[]>([{ startDate: new Date(new Date().setDate(new Date().getDate() - 7)), endDate: new Date(), key: 'selection' }]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [venues, setVenues] = useState<{ _id: string; name: string }[]>([]);
  const [selectedHallId, setSelectedHallId] = useState<string>('');
  const datePickerRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(datePickerRef, () => setShowDatePicker(false));

  const fetchVenues = useCallback(async () => {
    try {
      const response = await api.get('/halls');
      if (response.data?.success) {
        setVenues(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch venues for filter:', err);
    }
  }, []);

  useEffect(() => { fetchVenues(); }, [fetchVenues]);

  const fetchAdminAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const startDateStr = dateRange[0].startDate ? formatDate(dateRange[0].startDate, 'yyyy-MM-dd') : '';
      const endDateStr = dateRange[0].endDate ? formatDate(dateRange[0].endDate, 'yyyy-MM-dd') : '';
      const params = new URLSearchParams({ startDate: startDateStr, endDate: endDateStr });
      if (selectedHallId) params.append('hallId', selectedHallId);
      const response = await api.get(`../v2/analytics/super-admin?${params.toString()}`);
      if (response.data?.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch');
      }
    } catch (err: unknown) { console.error(err); setData(null); }
    finally { setLoading(false); }
  }, [dateRange, selectedHallId]);

  useEffect(() => { fetchAdminAnalytics(); }, [fetchAdminAnalytics]);

  const topHallsData = data?.hallPerformance?.mostActiveHalls.slice(0, 5).map(venue => ({ name: venue.name, Revenue: venue.revenue })) || [];
  const revenueBreakdownData = data ? [
    { name: 'Booking Commission', value: data.platformRevenue.bookingCommissionRevenue },
    { name: 'Subscription Revenue', value: data.platformRevenue.subscriptionRevenue },
  ] : [];
  const COLORS = ['#295FA7', '#B68945'];

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 font-medium">Platform-wide overview and revenue analytics.</p>
        </div>
        <div className="p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-2">
          <select
            value={selectedHallId}
            onChange={(e) => setSelectedHallId(e.target.value)}
            className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none min-w-[180px]"
          >
            <option value="">All Venues</option>
            {venues.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
          </select>

          <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(d => !d)}
                className="min-w-[240px] bg-gray-50 hover:bg-white border border-transparent hover:border-primary/20 rounded-xl px-4 py-2.5 flex items-center justify-between transition-all group"
              >
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-3 text-primary" />
                  <span className="text-sm font-bold text-gray-700">
                    {formatDateRange(dateRange[0].startDate, dateRange[0].endDate)}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showDatePicker ? 'rotate-180' : ''}`} />
              </button>
              {showDatePicker && (
                <div className="absolute right-0 top-full mt-3 z-30 shadow-2xl rounded-2xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-2">
                  <DateRange
                    editableDateInputs={true}
                    onChange={item => setDateRange([item.selection])}
                    moveRangeOnFirstSelection={false}
                    ranges={dateRange}
                    rangeColors={['#295FA7']}
                  />
                </div>
              )}
          </div>
          <button
            onClick={() => setDateRange([{ startDate: new Date(new Date().setDate(new Date().getDate() - 7)), endDate: new Date(), key: 'selection' }])}
            className="p-2.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-colors"
            title="Reset to last 7 days"
          >
            <TrendingUp size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl shadow-sm border border-gray-50">
           <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
           <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Compiling Platform Data...</p>
        </div>
      ) : !data ? (
        <div className="py-20 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
          <p className="text-rose-500 font-bold">Analytics Synchronization Failed</p>
          <p className="text-gray-500 text-sm mt-1">Please check your connection or try a different date range.</p>
          <button onClick={() => fetchAdminAnalytics()} className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all">Retry</button>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Overall Platform Statistics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AdminStatCard title="System Gross Volume" value={formatCurrency(data.overallStats.systemGrossVolume)} icon={DollarSign} />
              <AdminStatCard title="Total Owner Payouts" value={formatCurrency(data.overallStats.totalOwnerPayouts)} icon={Briefcase} />
              <AdminStatCard title="Total Refunded" value={formatCurrency(data.overallStats.totalRefunded)} icon={TrendingDown} />
              <AdminStatCard title="Platform Net" value={formatCurrency(data.overallStats.totalPlatformNet)} icon={TrendingUp} />
              <AdminStatCard title="Total Views" value={data.overallStats.totalViews.toLocaleString()} icon={TrendingUp} />
              <AdminStatCard title="Demo Bookings" value={data.overallStats.totalDemoBookings} icon={Briefcase} />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Gobokin Revenue Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AdminStatCard title="Platform Net Revenue" value={formatCurrency(data.platformRevenue.totalPlatformNet)} icon={DollarSign} />
              <AdminStatCard title="Booking Commission" value={formatCurrency(data.platformRevenue.bookingCommissionRevenue)} icon={Percent} trend={data.dataComparison.change.bookingRevenuePercentage} />
              <AdminStatCard title="Subscription Revenue" value={formatCurrency(data.platformRevenue.subscriptionRevenue)} icon={Shield} trend={data.dataComparison.change.subscriptionRevenuePercentage} />
              <AdminStatCard title="Commission Rate" value={data.platformRevenue.commissionRate} icon={Percent} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">Booking Status Breakdown</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Confirmed</p>
                  <p className="text-2xl font-black text-emerald-700">{data.overallStats.totalBookings.confirmed}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Pending</p>
                  <p className="text-2xl font-black text-amber-700">{data.overallStats.totalBookings.pending}</p>
                </div>
                <div className="bg-rose-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Cancelled</p>
                  <p className="text-2xl font-black text-rose-700">{data.overallStats.totalBookings.cancelled}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">Reservation Status</h3>
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">New</p>
                  <p className="text-xl font-black text-blue-700">{data.overallStats.totalReservations.new}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Active</p>
                  <p className="text-xl font-black text-indigo-700">{data.overallStats.totalReservations.active}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Conv.</p>
                  <p className="text-xl font-black text-emerald-700">{data.overallStats.totalReservations.converted}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">Exp.</p>
                  <p className="text-xl font-black text-gray-700">{data.overallStats.totalReservations.expired}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-8">
                      <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Venue Revenue Performance</h2>
                      <div className="px-3 py-1 bg-blue-50 text-primary text-[10px] font-bold rounded-full uppercase">Top 5 Venues</div>
                  </div>
                  <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={topHallsData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} tickFormatter={(value) => new Intl.NumberFormat('en-NG', { notation: 'compact', compactDisplay: 'short' }).format(value as number)} />
                          <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                          />
                          <Bar dataKey="Revenue" fill="#295FA7" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-8 text-center">Revenue Composition</h2>
                  <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                          <Pie
                            data={revenueBreakdownData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                            labelLine={false}
                            label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                          >
                              {revenueBreakdownData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} formatter={(value) => `${formatCurrency(value as number)}`} />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-6">Market Activity</h2>
                  <div className="overflow-x-auto">
                      <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-50">
                                <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Venue Details</th>
                                <th className="pb-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Earnings</th>
                                <th className="pb-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Bookings</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {data.hallPerformance.mostActiveHalls.map((venue) => (
                                  <tr key={venue._id} className="group hover:bg-gray-50/50 transition-colors">
                                      <td className="py-4">
                                          <div className="text-sm font-bold text-gray-900">{venue.name}</div>
                                          <div className="text-[10px] text-gray-400 font-medium">{venue.owner?.fullName ?? 'Independent Owner'}</div>
                                      </td>
                                      <td className="py-4 text-center text-sm font-black text-gray-900">{formatCurrency(venue.revenue)}</td>
                                      <td className="py-4 text-right">
                                          <span className="inline-block px-3 py-1 bg-gray-100 group-hover:bg-primary group-hover:text-white transition-all text-gray-600 text-xs font-bold rounded-lg">
                                            {venue.bookingCount}
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                              {data.hallPerformance?.mostActiveHalls.length === 0 && (<tr><td colSpan={3} className="text-center py-20 text-gray-400 italic">No activity recorded for this period.</td></tr>)}
                          </tbody>
                      </table>
                  </div>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-6">Inactive Venues</h2>
                  <div className="overflow-x-auto">
                      <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-50">
                                <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Venue Name</th>
                                <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Ownership</th>
                                <th className="pb-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason / Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {data.hallPerformance.inactiveHalls.map((venue) => (
                                  <tr key={venue.hallId} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="py-4 text-sm font-bold text-gray-900">{venue.hallName}</td>
                                      <td className="py-4 text-xs text-gray-500 font-medium">{venue.ownerName ?? 'Unassigned'}</td>
                                      <td className="py-4 text-right">
                                          <span className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-md">
                                            {venue.reason || 'No Recent Bookings'}
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                              {data.hallPerformance?.inactiveHalls.length === 0 && (<tr><td colSpan={3} className="text-center py-20 text-gray-400 italic">All properties are currently active.</td></tr>)}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-6">Top Customers</h2>
                  <div className="overflow-x-auto">
                      <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-50">
                                <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Details</th>
                                <th className="pb-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Spent</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {data.userInsights?.topCustomers.map((customer) => (
                                  <tr key={customer.userId} className="group hover:bg-gray-50/50 transition-colors">
                                      <td className="py-4">
                                          <div className="text-sm font-bold text-gray-900">{customer.fullName}</div>
                                          <div className="text-[10px] text-gray-400 font-medium">{customer.email}</div>
                                      </td>
                                      <td className="py-4 text-right text-sm font-black text-gray-900">
                                          {formatCurrency(customer.totalSpent)}
                                      </td>
                                  </tr>
                              ))}
                              {data.userInsights?.topCustomers.length === 0 && (<tr><td colSpan={2} className="text-center py-10 text-gray-400 italic">No customer data available.</td></tr>)}
                          </tbody>
                      </table>
                  </div>
              </div>
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                  <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-8">Platform Subscriptions</h2>
                  <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl">
                          <div className="flex items-center space-x-3">
                              <div className="bg-primary text-white p-2 rounded-lg">
                                  <Shield size={20} />
                              </div>
                              <span className="text-sm font-bold text-gray-700">Total Active</span>
                          </div>
                          <span className="text-2xl font-black text-primary">{data.userInsights.subscriptionCounts.totalActive}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 border border-gray-100 rounded-2xl">
                              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">New This Period</p>
                              <p className="text-xl font-black text-emerald-600">{data.userInsights.subscriptionCounts.new}</p>
                          </div>
                          <div className="p-4 border border-gray-100 rounded-2xl">
                              <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Expired</p>
                              <p className="text-xl font-black text-rose-600">{data.userInsights.subscriptionCounts.expired}</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminEnhancedAnalytics;
