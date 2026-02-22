'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { BarChart as BarChartIcon, Eye, Briefcase, TrendingUp, TrendingDown, Target, CalendarCheck, Calendar as CalendarIcon, ChevronDown, Search, ChevronLeft, ChevronRight, Clock, RotateCcw } from 'lucide-react';
import { DateRange, Range } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { format as formatDate } from 'date-fns';
import useOnClickOutside from '@/hooks/useOnClickOutside';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Sector } from 'recharts';
interface OverallStats {
  totalRevenue: number;
  grossRevenue: number;
  netRevenueBeforeCommission: number;
  totalCommission: number;
  totalPayout: number;
  totalRefunded: number;
  totalBookingRevenue: number;
  bookingGrossRevenue: number;
  bookingRefundedAmount: number;
  bookingRevenue: number;
  totalViews: number;
  totalDemoBookings: number;
  totalBookings: {
    confirmed: number;
    cancelled: number;
    pending: number;
  };
}

interface RevenueBreakdown {
  hallId: string;
  hallName: string;
  overallStats: {
    totalRevenue: number;
    grossRevenue: number;
    netRevenueBeforeCommission: number;
    commissionAmount: number;
    payoutAmount: number;
    totalRefunded: number;
    totalViews: number;
    totalBookings: {
      confirmed: number;
      cancelled: number;
      pending: number;
    };
    hallRevenue: number;
    facilityRevenue: number;
  };
  kpis: KPIs;
  reservationAnalytics: {
    new: number;
    converted: number;
    expired: number;
    active: number;
  };
}

interface Booking {
  _id: string;
  user: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  walkInUserDetails?: {
    fullName: string;
    email: string;
    phone: string;
  };
  venue: {
    _id: string;
    name: string;
  };
  eventDetails: string;
  bookingDates: {
    startTime: string;
    endTime: string;
  }[];
  totalPrice: number;
  paymentStatus: string;
  status: string;
  bookingType: string;
  isRecurring?: boolean;
  recurringBookingId?: string;
  bookingId?: string;
}

interface KPIs {
  bookingConversionRate: string;
  averageBookingValue: string;
  busiestDays: {
    day: string;
    count: number;
  }[];
  repeatBookingRate: string;
  occupancyRate: string;
  averageBookingLeadTime: string;
}

interface AnalyticsData {
  overallStats: OverallStats;
  breakdownByHall: RevenueBreakdown[];
  recentBookings: {
    bookings: Booking[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalBookings: number;
    };
  };
  kpis: KPIs;
  reservationAnalytics: {
    new: number;
    converted: number;
    expired: number;
    active: number;
  };
}
interface Venue {
  _id: string;
  name: string;
}


const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
  <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-100">
    <div className="bg-blue-50 p-4 rounded-xl text-[#295FA7]"><Icon className="h-6 w-6" /></div>
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-gray-900 mt-0.5">{value}</p>
    </div>
  </div>
);

interface ActiveShapeProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: { hallName: string };
  percent: number;
  value: number;
}

const renderActiveShape = (props: unknown) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props as ActiveShapeProps;
    const sin = Math.sin(-RADIAN * midAngle); const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos; const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos; const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22; const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
        <g>
            <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold">{payload.hallName}</text>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
            <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
            <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
            <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`Revenue ${formatCurrency(value)}`}</text>
            <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">{`( ${(percent * 100).toFixed(2)}% )`}</text>
        </g>
    );
};
const formatCurrency = (amount: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

const formatDateRange = (start: Date | undefined, end: Date | undefined) => {
    if (!start || !end) return '';
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear === endYear) {
        return `${formatDate(start, "MMM d")} - ${formatDate(end, "MMM d, yyyy")}`;
    }
    return `${formatDate(start, "MMM d, yyyy")} - ${formatDate(end, "MMM d, yyyy")}`;
};


const DEFAULT_DATA: AnalyticsData = {
  overallStats: {
    totalRevenue: 0,
    grossRevenue: 0,
    netRevenueBeforeCommission: 0,
    totalCommission: 0,
    totalPayout: 0,
    totalRefunded: 0,
    totalBookingRevenue: 0,
    bookingGrossRevenue: 0,
    bookingRefundedAmount: 0,
    bookingRevenue: 0,
    totalViews: 0,
    totalDemoBookings: 0,
    totalBookings: { confirmed: 0, cancelled: 0, pending: 0 },
  },
  breakdownByHall: [],
  recentBookings: {
    bookings: [],
    pagination: { currentPage: 1, totalPages: 1, totalBookings: 0 },
  },
  kpis: {
    bookingConversionRate: '0.00%',
    averageBookingValue: '0.00',
    busiestDays: [],
    repeatBookingRate: '0.00%',
    occupancyRate: '0.00%',
    averageBookingLeadTime: '0.0 days',
  },
  reservationAnalytics: {
    new: 0,
    converted: 0,
    expired: 0,
    active: 0,
  },
};

const EnhancedAnalytics = ({ initialData }: { initialData?: AnalyticsData | null }) => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [hallsLoading, setHallsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<Range[]>([{ startDate: new Date(new Date().setDate(new Date().getDate() - 7)), endDate: new Date(), key: 'selection' }]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showHallPicker, setShowHallPicker] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const datePickerRef = useRef<HTMLDivElement>(null);
  const hallPickerRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(datePickerRef, () => setShowDatePicker(false));
  useOnClickOutside(hallPickerRef, () => setShowHallPicker(false));

  const onPieEnter = (_: unknown, index: number) => setActiveIndex(index);

  const fetchAnalytics = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const startDateStr = dateRange[0].startDate ? formatDate(dateRange[0].startDate, 'yyyy-MM-dd') : '';
      const endDateStr = dateRange[0].endDate ? formatDate(dateRange[0].endDate, 'yyyy-MM-dd') : '';
      const params = new URLSearchParams({
        startDate: startDateStr,
        endDate: endDateStr,
        page: page.toString(),
        limit: '10'
      });
      if (selectedVenue) {
        params.append('hallId', selectedVenue._id);
      } else if (user?.activeRole === 'staff' && venues.length > 0) {
        // Explicitly pass all assigned venue IDs for staff if no specific venue is selected
        venues.forEach(h => params.append('hallId', h._id));
      }

      const response = await api.get(`../v2/analytics/hall-owner?${params.toString()}`);
      if (response.data?.success) {
        setData(response.data.data || DEFAULT_DATA);
      } else {
        throw new Error(response.data.message || 'Failed to fetch');
      }
    } catch (err: unknown) {
      console.error(err);
      // We don't show an error state in the UI for analytics to avoid breaking the layout,
      // but we could use translateError(err) if we had an error state.
      setData(DEFAULT_DATA);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedVenue, user?.activeRole, venues]);

  useEffect(() => {
    if (!initialData) {
      // For staff, wait for assigned venues to load before fetching analytics to ensure correct filtering
      if (user?.activeRole === 'staff' && hallsLoading) return;

      fetchAnalytics(currentPage);
    }
  }, [fetchAnalytics, currentPage, initialData, user?.activeRole, hallsLoading]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, selectedVenue]);

  useEffect(() => {
    setHallsLoading(true);
    api.get('/halls/by-owner')
      .then(res => res.data?.success && setVenues(res.data.data))
      .catch(err => console.error("Failed to fetch venues", err))
      .finally(() => setHallsLoading(false));
  }, []);

  const handleClearFilters = () => {
    setSelectedVenue(null);
    setDateRange([{ startDate: new Date(new Date().setDate(new Date().getDate() - 7)), endDate: new Date(), key: 'selection' }]);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const analyticsData = {
    ...DEFAULT_DATA,
    ...data,
    overallStats: { ...DEFAULT_DATA.overallStats, ...data?.overallStats },
    kpis: { ...DEFAULT_DATA.kpis, ...data?.kpis },
    recentBookings: { ...DEFAULT_DATA.recentBookings, ...data?.recentBookings },
    reservationAnalytics: { ...DEFAULT_DATA.reservationAnalytics, ...data?.reservationAnalytics },
  };
  const { overallStats, kpis, breakdownByHall, recentBookings, reservationAnalytics } = analyticsData;

  const groupedRecentBookings = React.useMemo(() => {
    const groups: Record<string, Booking[]> = {};
    const result: (Booking & { isGroup?: boolean; groupBookings?: Booking[] })[] = [];

    recentBookings.bookings.forEach(booking => {
      if (booking.isRecurring && booking.recurringBookingId) {
        if (!groups[booking.recurringBookingId]) {
          groups[booking.recurringBookingId] = [];
        }
        groups[booking.recurringBookingId].push(booking);
      } else {
        result.push({ ...booking, isGroup: false });
      }
    });

    Object.entries(groups).forEach(([recurringId, groupBookings]) => {
      groupBookings.sort((a, b) => new Date(a.bookingDates[0].startTime).getTime() - new Date(b.bookingDates[0].startTime).getTime());

      const first = groupBookings[0];
      const last = groupBookings[groupBookings.length - 1];
      const totalSum = groupBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      result.push({
        ...first,
        isGroup: true,
        bookingId: recurringId,
        totalPrice: totalSum,
        bookingDates: [
          {
            startTime: first.bookingDates[0].startTime,
            endTime: last.bookingDates[0].endTime
          }
        ],
        groupBookings: groupBookings
      });
    });

    // Re-sort by date descending as the default for "recent"
    result.sort((a, b) => {
      const dateA = new Date(a.bookingDates[0].startTime).getTime();
      const dateB = new Date(b.bookingDates[0].startTime).getTime();
      return dateB - dateA;
    });

    return result;
  }, [recentBookings.bookings]);

  const COLORS = ['#295FA7', '#B68945', '#4A90E2', '#D0021B', '#F5A623'];

  return (
    <div id="vendor-analytics" className="p-6 bg-gray-50 min-h-screen space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 font-medium">An overview of your business performance.</p>
          </div>
          <div className="p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-2">
              <div className="relative flex-grow md:flex-grow-0" ref={datePickerRef}>
                  <button
                      onClick={() => setShowDatePicker(d => !d)}
                      className="w-full md:w-72 bg-gray-50 hover:bg-white border border-transparent hover:border-primary/20 rounded-xl px-4 py-2.5 flex items-center justify-between transition-all group cursor-pointer"
                  >
                      <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-3 text-[#295FA7]"/>
                          <span className="text-sm font-bold text-gray-700">
                              {formatDateRange(dateRange[0].startDate, dateRange[0].endDate)}
                          </span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showDatePicker ? 'rotate-180' : ''}`}/>
                  </button>
                  {showDatePicker && (<div className="absolute right-0 top-full mt-3 z-30 shadow-2xl rounded-2xl overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-top-2"><DateRange editableDateInputs={true} onChange={item => setDateRange([item.selection])} moveRangeOnFirstSelection={false} ranges={dateRange} rangeColors={['#295FA7']} /></div>)}
              </div>
              <div className="relative flex-grow md:flex-grow-0" ref={hallPickerRef}>
                  <button
                      onClick={() => setShowHallPicker(d => !d)}
                      className="w-full md:w-64 bg-gray-50 hover:bg-white border border-transparent hover:border-primary/20 rounded-xl px-4 py-2.5 flex items-center justify-between transition-all group cursor-pointer"
                  >
                      <div className="flex items-center">
                          <Search className="h-4 w-4 mr-3 text-[#295FA7]"/>
                          <span className="text-sm font-bold text-gray-700">{selectedVenue ? selectedVenue.name : 'All Venues'}</span>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showHallPicker ? 'rotate-180' : ''}`}/>
                  </button>
                  {showHallPicker && (<div className="absolute right-0 top-full mt-3 z-30 bg-white border border-gray-100 rounded-2xl shadow-2xl w-full md:w-64 overflow-hidden animate-in fade-in slide-in-from-top-2"><div className="p-2 border-b bg-gray-50"><input type="text" placeholder="Search venues..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-2 text-sm border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 bg-white"/></div><ul className="max-h-60 overflow-y-auto">{venues.filter(h => h.name.toLowerCase().includes(searchTerm.toLowerCase())).map(venue => (<li key={venue._id} onClick={() => { setSelectedVenue(venue); setShowHallPicker(false); }} className="p-3 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-0 font-medium">{venue.name}</li>))}</ul></div>)}
              </div>
              <button
                  onClick={handleClearFilters}
                  className="p-2.5 text-gray-400 hover:text-[#295FA7] hover:bg-blue-50 rounded-xl transition-colors"
                  title="Clear Filters"
              >
                  <RotateCcw size={20} />
              </button>
          </div>
        </div>

        {loading ? ( <div className="animate-pulse space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{[...Array(12)].map((_, i) => ( <div key={i} className="bg-gray-200 p-6 rounded-xl h-28"></div> ))}</div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="bg-gray-200 rounded-3xl h-96"></div><div className="bg-gray-200 rounded-3xl h-96"></div></div><div className="bg-gray-200 rounded-3xl h-96"></div></div>)
        : ( <>
            <div className="space-y-2">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Financial Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <StatCard title="Gross Revenue" value={formatCurrency(overallStats.grossRevenue)} icon={BarChartIcon} />
                    <StatCard title="Net Rev (Pre-Comm)" value={formatCurrency(overallStats.netRevenueBeforeCommission)} icon={TrendingUp} />
                    <StatCard title="Total Commission" value={formatCurrency(overallStats.totalCommission)} icon={TrendingDown} />
                    <StatCard title="Total Payout" value={formatCurrency(overallStats.totalPayout)} icon={TrendingUp} />
                    <StatCard title="Total Refunded" value={formatCurrency(overallStats.totalRefunded)} icon={TrendingDown} />
                    <StatCard title="Avg. Booking Value" value={formatCurrency(Number(kpis.averageBookingValue))} icon={Target} />
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Engagement & Conversion</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <StatCard title="Total Venue Views" value={overallStats.totalViews.toLocaleString()} icon={Eye} />
                    <StatCard title="Booking Conversion" value={kpis.bookingConversionRate} icon={Target} />
                    <StatCard title="Repeat Booking Rate" value={kpis.repeatBookingRate} icon={TrendingUp} />
                    <StatCard title="Occupancy Rate" value={kpis.occupancyRate} icon={Briefcase} />
                    <StatCard title="Avg. Lead Time" value={kpis.averageBookingLeadTime} icon={Clock} />
                    <StatCard title="Demo Bookings" value={overallStats.totalDemoBookings} icon={CalendarCheck} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">Booking Status</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-emerald-50 p-4 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Confirmed</p>
                            <p className="text-2xl font-black text-emerald-700">{overallStats.totalBookings.confirmed}</p>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">Pending</p>
                            <p className="text-2xl font-black text-amber-700">{overallStats.totalBookings.pending}</p>
                        </div>
                        <div className="bg-rose-50 p-4 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">Cancelled</p>
                            <p className="text-2xl font-black text-rose-700">{overallStats.totalBookings.cancelled}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider mb-4">Reservation Status</h3>
                    <div className="grid grid-cols-4 gap-2">
                        <div className="bg-blue-50 p-4 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">New</p>
                            <p className="text-xl font-black text-blue-700">{reservationAnalytics.new}</p>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Active</p>
                            <p className="text-xl font-black text-indigo-700">{reservationAnalytics.active}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Conv.</p>
                            <p className="text-xl font-black text-emerald-700">{reservationAnalytics.converted}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-gray-600 uppercase mb-1">Exp.</p>
                            <p className="text-xl font-black text-gray-700">{reservationAnalytics.expired}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter">Busiest Days</h2>
                      <div className="px-3 py-1 bg-blue-50 text-[#295FA7] text-[10px] font-bold rounded-full uppercase">Activity</div>
                    </div>
                    {kpis.busiestDays && kpis.busiestDays.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={kpis.busiestDays}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#295FA7" name="Bookings" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full min-h-[300px] text-gray-500">No data available for this period.</div>
                    )}
                </div>
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-8 text-center">Revenue by Venue</h2>
                    {breakdownByHall && breakdownByHall.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                {/* @ts-expect-error - activeIndex and activeShape are supported by recharts but may not be in the current type definitions */}
                                <Pie
                                  activeIndex={activeIndex}
                                  activeShape={renderActiveShape}
                                  data={breakdownByHall.map(h => ({ ...h, totalRevenue: h.overallStats.totalRevenue }))}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  fill="#295FA7"
                                  dataKey="totalRevenue"
                                  onMouseEnter={onPieEnter}
                                >
                                    {breakdownByHall.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full min-h-[300px] text-gray-500">No data available for this period.</div>
                    )}
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-6">Venue Performance Details</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Venue Name</th>
                                <th className="pb-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue (Hall/Facility)</th>
                                <th className="pb-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Commission</th>
                                <th className="pb-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Payout</th>
                                <th className="pb-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Conversion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {breakdownByHall.map((hall) => (
                                <tr key={hall.hallId} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">{hall.hallName}</div>
                                        <div className="text-[10px] text-gray-400 font-medium">{hall.overallStats.totalBookings.confirmed} Confirmed Bookings</div>
                                    </td>
                                    <td className="py-4 text-center">
                                        <div className="text-sm font-black text-gray-900">{formatCurrency(hall.overallStats.totalRevenue)}</div>
                                        <div className="text-[10px] text-gray-400">
                                            {formatCurrency(hall.overallStats.hallRevenue)} / {formatCurrency(hall.overallStats.facilityRevenue)}
                                        </div>
                                    </td>
                                    <td className="py-4 text-center text-sm font-medium text-rose-500">
                                        -{formatCurrency(hall.overallStats.commissionAmount)}
                                    </td>
                                    <td className="py-4 text-center text-sm font-black text-emerald-600">
                                        {formatCurrency(hall.overallStats.payoutAmount)}
                                    </td>
                                    <td className="py-4 text-right">
                                        <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg">
                                            {hall.kpis.bookingConversionRate}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-black text-gray-900 uppercase tracking-tighter mb-6">Recent Bookings</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-50">
                            <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User</th>
                            <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                            <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                            <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                            <th className="pb-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment</th>
                            <th className="pb-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {groupedRecentBookings.map((booking) => (
                                <tr key={booking._id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <div>
                                                <div className="text-sm font-bold text-gray-900">{booking.user?.fullName || booking.walkInUserDetails?.fullName || 'Owner'}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">{booking.user?.email || booking.walkInUserDetails?.email || ''}</div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {booking.isRecurring && (
                                                    <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-blue-100 text-blue-800 uppercase text-center">Rec</span>
                                                )}
                                                {booking.bookingType?.toLowerCase() === 'online' && (
                                                    <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-green-100 text-green-800 uppercase text-center">Online</span>
                                                )}
                                                {booking.bookingType?.toLowerCase() === 'walk-in' && (
                                                    <span className="px-1.5 py-0.5 text-[8px] font-bold rounded-full bg-purple-100 text-purple-800 uppercase text-center">Walk-in</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                                        {booking.eventDetails}
                                    </td>
                                    <td className="py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                        {booking.isGroup ? (
                                            <div>
                                                <span>{formatDate(new Date(booking.bookingDates[0].startTime), 'MMM d')}</span>
                                                <span className="mx-1">-</span>
                                                <span>{formatDate(new Date(booking.bookingDates[0].endTime), 'MMM d, yyyy')}</span>
                                                <div className="text-[10px] text-blue-600 font-bold">({booking.groupBookings?.length} sessions)</div>
                                            </div>
                                        ) : (
                                            formatDate(new Date(booking.bookingDates[0].startTime), 'MMM d, yyyy')
                                        )}
                                    </td>
                                    <td className="py-4 whitespace-nowrap text-sm font-black text-gray-900">{formatCurrency(booking.totalPrice)}</td>
                                    <td className="py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-[10px] font-black uppercase rounded-md ${booking.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {booking.paymentStatus}
                                        </span>
                                    </td>
                                    <td className="py-4 whitespace-nowrap text-right">
                                        <span className={`px-2 py-1 inline-flex text-[10px] font-black uppercase rounded-md ${booking.status === 'confirmed' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {recentBookings.bookings.length === 0 && (<tr><td colSpan={5} className="text-center py-20 text-gray-400 font-black uppercase text-[10px] tracking-widest italic">No bookings recorded for this period.</td></tr>)}
                        </tbody>
                    </table>
                </div>
                {recentBookings.pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-50">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2.5 text-gray-400 hover:text-[#295FA7] hover:bg-blue-50 rounded-xl transition-colors border border-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ChevronLeft size={20}/>
                    </button>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Page {currentPage} of {recentBookings.pagination.totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(recentBookings.pagination.totalPages, p + 1))}
                      disabled={currentPage === recentBookings.pagination.totalPages}
                      className="p-2.5 text-gray-400 hover:text-[#295FA7] hover:bg-blue-50 rounded-xl transition-colors border border-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ChevronRight size={20}/>
                    </button>
                  </div>
                )}
            </div>
        </>)}
    </div>
  );
};

export default EnhancedAnalytics;
