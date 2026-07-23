'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { translateError } from '@/utils/errors';
import Swal from "@/utils/sweetalert";
import { format as formatDate } from 'date-fns';
import { DateRange, Range } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import { TrendingUp, TrendingDown, Calendar as CalendarIcon, ChevronDown, DollarSign, Briefcase, Shield, Percent, Wallet, ArrowRight, Ticket, Users, MousePointerClick, ShoppingBag, Eye, LayoutDashboard, BarChart3 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Analytics } from '@/types';

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
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });

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

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

const safeFormatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return 'N/A';
    return formatCurrency(amount);
};

const safeFormatNumber = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    return value.toLocaleString();
};

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

const AdminEnhancedAnalytics = ({ defaultView = 'venues' }: { defaultView?: 'venues' | 'events' }) => {
  const { user, fetchUserProfile } = useAuth();
  const [activeView, setActiveView] = useState<'venues' | 'events'>(defaultView);
  const [venueData, setVenueData] = useState<AdminAnalyticsData | null>(null);
  const [eventAnalytics, setEventAnalytics] = useState<Analytics | null>(null);
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

      if (activeView === 'venues') {
        const params = new URLSearchParams({ startDate: startDateStr, endDate: endDateStr });
        if (selectedHallId) params.append('hallId', selectedHallId);
        const response = await api.get(`../v2/analytics/super-admin?${params.toString()}`);
        if (response.data?.success) {
          setVenueData(response.data.data);
        }
      } else {
        const params = new URLSearchParams({ startDate: startDateStr, endDate: endDateStr });
        const response = await api.get(`/events/my-organizer-profile/analytics?${params.toString()}`);
        if (response.data?.success) {
          setEventAnalytics(response.data.data);
        }
      }
    } catch (err: unknown) {
        console.error(err);
        if (activeView === 'venues') setVenueData(null);
        else setEventAnalytics(null);
    } finally { setLoading(false); }
  }, [dateRange, selectedHallId, activeView]);

  useEffect(() => { fetchAdminAnalytics(); }, [fetchAdminAnalytics]);

  const handleSettleCommission = async () => {
    const amount = user?.outstandingReferralCommission || 0;
    if (amount <= 0) {
      Swal.fire('No Balance', 'You do not have any personal outstanding commission to settle.', 'info');
      return;
    }

    const { value: settleAmount } = await Swal.fire({
      title: 'Settle Your Commission',
      text: `Your personal outstanding balance is ${formatCurrency(amount)}. How much would you like to pay?`,
      input: 'number',
      inputValue: amount,
      inputAttributes: {
        min: '1',
        max: String(amount),
        step: '1'
      },
      showCancelButton: true,
      confirmButtonText: 'Pay Now',
      confirmButtonColor: '#295FA7',
      inputValidator: (value) => {
        if (!value || Number(value) <= 0) return 'Please enter a valid amount';
        if (Number(value) > amount) return 'Amount cannot exceed your outstanding balance';
      }
    });

    if (settleAmount) {
      try {
        Swal.showLoading();
        const response = await api.post('/payments/settle-commission', { amount: Number(settleAmount) });
        const { checkoutUrl } = response.data.data;
        if (checkoutUrl) {
          fetchUserProfile().catch(console.error);
          window.location.href = checkoutUrl;
        } else {
          throw new Error('Failed to generate payment link');
        }
      } catch (err) {
        console.error('Failed to settle commission:', err);
        Swal.fire('Error', translateError(err), 'error');
      }
    }
  };

  const topHallsData = venueData?.hallPerformance?.mostActiveHalls.slice(0, 5).map(venue => ({ name: venue.name, Revenue: venue.revenue || 0 })) || [];
  const revenueBreakdownData = venueData ? [
    { name: 'Booking Commission', value: venueData.platformRevenue.bookingCommissionRevenue || 0 },
    { name: 'Subscription Revenue', value: venueData.platformRevenue.subscriptionRevenue || 0 },
  ] : [];
  const COLORS = ['#295FA7', '#B68945'];

  const eventTrendData = eventAnalytics?.trends?.map(t => ({
    name: t.date,
    revenue: t.revenue || 0,
    registrations: t.registrations || 0,
    views: t.views || 0
  })) || [];

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 font-medium">Platform-wide overview and {activeView} analytics.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-2">
            {activeView === 'venues' && (
                <select
                    value={selectedHallId}
                    onChange={(e) => setSelectedHallId(e.target.value)}
                    className="bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none min-w-[180px]"
                >
                    <option value="">All Venues</option>
                    {venues.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
            )}

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
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-3xl shadow-sm border border-gray-50">
           <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
           <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Compiling Platform Data...</p>
        </div>
      ) : (activeView === 'venues' && !venueData) || (activeView === 'events' && !eventAnalytics) ? (
        <div className="py-20 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
          <p className="text-rose-500 font-bold">Analytics Synchronization Failed</p>
          <p className="text-gray-500 text-sm mt-1">Please check your connection or try a different date range.</p>
          <button onClick={() => fetchAdminAnalytics()} className="mt-4 px-6 py-2 bg-primary text-white rounded-xl font-bold shadow-lg shadow-blue-200 active:scale-95 transition-all">Retry</button>
        </div>
      ) : activeView === 'venues' && venueData ? (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Overall Platform Statistics</h2>
                {(user?.outstandingReferralCommission || 0) > 0 ? (
                    <div className="animate-pulse bg-rose-50 border border-rose-100 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-sm">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-rose-400 uppercase">Your Outstanding Debt</span>
                            <span className="text-sm font-black text-rose-600">{formatCurrency(user?.outstandingReferralCommission || 0)}</span>
                        </div>
                        <button
                            onClick={handleSettleCommission}
                            className="bg-rose-600 text-white text-[10px] font-black px-3 py-1.5 rounded-xl uppercase hover:bg-rose-700 transition-all flex items-center gap-1 shadow-lg shadow-rose-200"
                        >
                            Settle <ArrowRight size={12} />
                        </button>
                    </div>
                ) : null}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AdminStatCard title="System Gross Volume" value={safeFormatCurrency(venueData.overallStats.systemGrossVolume)} icon={DollarSign} />
              <AdminStatCard title="Total Owner Payouts" value={safeFormatCurrency(venueData.overallStats.totalOwnerPayouts)} icon={Briefcase} />
              <AdminStatCard title="Total Refunded" value={safeFormatCurrency(venueData.overallStats.totalRefunded)} icon={TrendingDown} />
              <AdminStatCard title="Platform Net" value={safeFormatCurrency(venueData.overallStats.totalPlatformNet)} icon={TrendingUp} />
              <AdminStatCard title="Total Views" value={safeFormatNumber(venueData.overallStats.totalViews)} icon={TrendingUp} />
              <AdminStatCard title="Contact Attempts" value={safeFormatNumber(venueData.overallStats.totalDemoBookings)} icon={Briefcase} />
              {user?.outstandingReferralCommission !== undefined && (
                  <div className={`p-6 rounded-xl shadow-md flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border ${user.outstandingReferralCommission > 0 ? 'bg-rose-50 border-rose-100' : 'bg-white border-gray-100'}`}>
                      <div className="flex items-center space-x-4">
                          <div className={`p-4 rounded-xl ${user.outstandingReferralCommission > 0 ? 'bg-white text-rose-600 shadow-sm' : 'bg-blue-50 text-primary'}`}><Wallet className="h-6 w-6" /></div>
                          <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Referral Debt</p>
                              <p className={`text-2xl font-black mt-0.5 ${user.outstandingReferralCommission > 0 ? 'text-rose-700' : 'text-gray-900'}`}>{safeFormatCurrency(user.outstandingReferralCommission)}</p>
                          </div>
                      </div>
                      {user.outstandingReferralCommission > 0 && (
                          <button
                              onClick={handleSettleCommission}
                              className="p-2 bg-white rounded-lg text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                              title="Settle Your Balance"
                          >
                              <ArrowRight size={20} />
                          </button>
                      )}
                  </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Gobokin Revenue Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AdminStatCard title="Platform Net Revenue" value={safeFormatCurrency(venueData.platformRevenue.totalPlatformNet)} icon={DollarSign} />
              <AdminStatCard title="Booking Commission" value={safeFormatCurrency(venueData.platformRevenue.bookingCommissionRevenue)} icon={Percent} trend={venueData.dataComparison.change.bookingRevenuePercentage} />
              <AdminStatCard title="Subscription Revenue" value={safeFormatCurrency(venueData.platformRevenue.subscriptionRevenue)} icon={Shield} trend={venueData.dataComparison.change.subscriptionRevenuePercentage} />
              <AdminStatCard title="Commission Rate" value={(venueData.platformRevenue.commissionRate !== undefined && venueData.platformRevenue.commissionRate !== null) ? venueData.platformRevenue.commissionRate : 'N/A'} icon={Percent} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">Booking Status Breakdown</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Confirmed</p>
                  <p className="text-2xl font-black text-emerald-700">{safeFormatNumber(venueData.overallStats.totalBookings.confirmed)}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Pending</p>
                  <p className="text-2xl font-black text-amber-700">{safeFormatNumber(venueData.overallStats.totalBookings.pending)}</p>
                </div>
                <div className="bg-rose-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Cancelled</p>
                  <p className="text-2xl font-black text-rose-700">{safeFormatNumber(venueData.overallStats.totalBookings.cancelled)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">Reservation Status</h3>
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                <div className="bg-blue-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">New</p>
                  <p className="text-xl font-black text-blue-700">{safeFormatNumber(venueData.overallStats.totalReservations.new)}</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Active</p>
                  <p className="text-xl font-black text-indigo-700">{safeFormatNumber(venueData.overallStats.totalReservations.active)}</p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Conv.</p>
                  <p className="text-xl font-black text-emerald-700">{safeFormatNumber(venueData.overallStats.totalReservations.converted)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">Exp.</p>
                  <p className="text-xl font-black text-gray-700">{safeFormatNumber(venueData.overallStats.totalReservations.expired)}</p>
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
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} tickFormatter={(value) => new Intl.NumberFormat('en-NG', { notation: 'compact', compactDisplay: 'short' }).format((value || 0) as number)} />
                          <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            formatter={(value) => [safeFormatCurrency(value as number), 'Revenue']}
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
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} formatter={(value) => `${safeFormatCurrency(value as number)}`} />
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 600 }} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>
        </>
      ) : activeView === 'events' && eventAnalytics ? (
        <>
          <div className="space-y-2">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Platform Event Metrics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <AdminStatCard title="Gross Revenue" value={safeFormatCurrency(eventAnalytics.summary.grossRevenue)} icon={DollarSign} />
              <AdminStatCard title="Net Revenue" value={safeFormatCurrency(eventAnalytics.summary.netRevenue)} icon={Wallet} />
              <AdminStatCard title="Total Commission" value={safeFormatCurrency(eventAnalytics.summary.totalCommission)} icon={Percent} />
              <AdminStatCard title="Published Events" value={safeFormatNumber(eventAnalytics.summary.publishedEvents)} icon={Ticket} />
              <AdminStatCard title="Total Registrations" value={safeFormatNumber(eventAnalytics.summary.totalRegistrations)} icon={Users} />
              <AdminStatCard title="Total Orders" value={safeFormatNumber(eventAnalytics.summary.totalOrders)} icon={ShoppingBag} />
              <AdminStatCard title="Total Platform Views" value={safeFormatNumber(eventAnalytics.summary.totalViews)} icon={Eye} />
              <AdminStatCard title="Attendance Rate" value={(eventAnalytics.summary.attendanceRate !== undefined && eventAnalytics.summary.attendanceRate !== null) ? `${eventAnalytics.summary.attendanceRate}%` : 'N/A'} icon={BarChart3} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-8">Revenue & Registration Trends</h2>
                <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={eventTrendData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#295FA7" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#295FA7" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                                tickFormatter={(value) => `₦${(value || 0).toLocaleString()}`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                formatter={(value: any) => [`₦${(value || 0).toLocaleString()}`, 'Revenue']}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#295FA7" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-8 text-center">Event Status Distribution</h2>
                <div className="h-[250px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Upcoming', value: eventAnalytics.summary.upcomingEvents || 0, color: '#295FA7' },
                                    { name: 'Ongoing', value: eventAnalytics.summary.ongoingEvents || 0, color: '#10B981' },
                                    { name: 'Completed', value: eventAnalytics.summary.completedEvents || 0, color: '#F59E0B' },
                                    { name: 'Cancelled', value: eventAnalytics.summary.cancelledEvents || 0, color: '#EF4444' },
                                ]}
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {[
                                    { color: '#295FA7' },
                                    { color: '#10B981' },
                                    { color: '#F59E0B' },
                                    { color: '#EF4444' },
                                ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</span>
                        <span className="text-2xl font-black text-gray-900">{safeFormatNumber(eventAnalytics.summary.totalEvents)}</span>
                    </div>
                </div>
                <div className="mt-8 space-y-3">
                    {[
                        { name: 'Upcoming', value: eventAnalytics.summary.upcomingEvents || 0, color: '#295FA7' },
                        { name: 'Ongoing', value: eventAnalytics.summary.ongoingEvents || 0, color: '#10B981' },
                        { name: 'Completed', value: eventAnalytics.summary.completedEvents || 0, color: '#F59E0B' },
                        { name: 'Cancelled', value: eventAnalytics.summary.cancelledEvents || 0, color: '#EF4444' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-xs font-bold text-gray-600">{item.name}</span>
                            </div>
                            <span className="text-xs font-black text-gray-900">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-6">Top Performing Events (Platform-wide)</h2>
              <div className="overflow-x-auto">
                  <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-50">
                            <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Event Title</th>
                            <th className="pb-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Views</th>
                            <th className="pb-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Orders</th>
                            <th className="pb-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Registrations</th>
                            <th className="pb-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Paid Registrations</th>
                            <th className="pb-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Gross Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                          {eventAnalytics.topEvents.map((event) => (
                              <tr key={event.eventId} className="group hover:bg-gray-50/50 transition-colors">
                                  <td className="py-4">
                                      <div className="text-sm font-bold text-gray-900">{event.title}</div>
                                      <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{event.status}</div>
                                  </td>
                                  <td className="py-4 text-center text-sm font-bold text-gray-600">{safeFormatNumber(event.detailViews !== undefined ? event.detailViews : event.views)}</td>
                                  <td className="py-4 text-center text-sm font-bold text-gray-600">{safeFormatNumber(event.orders)}</td>
                                  <td className="py-4 text-center text-sm font-bold text-gray-600">{safeFormatNumber(event.registrations)}</td>
                                  <td className="py-4 text-center text-sm font-bold text-gray-600">{safeFormatNumber(event.paidRegistrations)}</td>
                                  <td className="py-4 text-right text-sm font-black text-gray-900">
                                      {safeFormatCurrency(event.grossRevenue)}
                                  </td>
                              </tr>
                          ))}
                          {eventAnalytics.topEvents.length === 0 && (<tr><td colSpan={6} className="text-center py-20 text-gray-400 italic">No event activity recorded for this period.</td></tr>)}
                      </tbody>
                  </table>
              </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminEnhancedAnalytics;
