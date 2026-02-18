'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { Building, Briefcase } from 'lucide-react';
import { format as formatDate } from 'date-fns';

interface Booking {
  _id: string;
  user: {
    fullName: string;
    email: string;
  } | null;
  walkInUserDetails?: {
    fullName: string;
    email: string;
    phone: string;
  };
  hall: {
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
  isRecurring?: boolean;
  recurringBookingId?: string;
  bookingType?: string;
}

interface AnalyticsData {
  overallStats: {
    totalBookings: {
      confirmed: number;
    };
  };
  recentBookings: {
    bookings: Booking[];
  };
}

const StatCard = ({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className="bg-gray-100 p-3 rounded-full"><Icon className="h-6 w-6 text-primary" /></div>
    <div><p className="text-sm text-gray-500">{title}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div>
  </div>
);

const StaffDashboard = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [hallsCount, setHallsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const groupedRecentBookings = React.useMemo(() => {
    if (!data?.recentBookings?.bookings) return [];

    const groups: Record<string, Booking[]> = {};
    const result: (Booking & { isGroup?: boolean; groupBookings?: Booking[] })[] = [];

    data.recentBookings.bookings.forEach(booking => {
      if (booking.isRecurring && booking.recurringBookingId) {
        if (!groups[booking.recurringBookingId]) {
          groups[booking.recurringBookingId] = [];
        }
        groups[booking.recurringBookingId].push(booking);
      } else {
        result.push({ ...booking, isGroup: false });
      }
    });

    Object.entries(groups).forEach(([_recurringId, groupBookings]) => {
      groupBookings.sort((a, b) => new Date(a.bookingDates[0].startTime).getTime() - new Date(b.bookingDates[0].startTime).getTime());

      const first = groupBookings[0];
      const last = groupBookings[groupBookings.length - 1];
      const totalSum = groupBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      result.push({
        ...first,
        isGroup: true,
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

    result.sort((a, b) => {
      const dateA = new Date(a.bookingDates[0].startTime).getTime();
      const dateB = new Date(b.bookingDates[0].startTime).getTime();
      return dateB - dateA;
    });

    return result;
  }, [data?.recentBookings?.bookings]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [analyticsRes, hallsRes] = await Promise.all([
        api.get('../v2/analytics/hall-owner?limit=5'),
        api.get('/halls/by-owner')
      ]);

      if (analyticsRes.data?.success) setData(analyticsRes.data.data);
      if (hallsRes.data?.success) setHallsCount(hallsRes.data.data.length);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Staff Dashboard</h1>
        <p className="text-gray-500">Welcome! Here is an overview of the venues and bookings you manage.</p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-200 h-24 rounded-lg"></div>
            <div className="bg-gray-200 h-24 rounded-lg"></div>
          </div>
          <div className="bg-gray-200 h-96 rounded-lg"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard title="Total Managed Venues" value={hallsCount} icon={Building} />
            <StatCard title="Confirmed Bookings" value={data?.overallStats?.totalBookings?.confirmed || 0} icon={Briefcase} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Bookings</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Venue</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {groupedRecentBookings.map((booking) => (
                    <tr key={booking._id}>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-gray-900">{booking.user?.fullName || booking.walkInUserDetails?.fullName || 'Owner'}</div>
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
                      <td className="p-3 whitespace-nowrap text-sm text-gray-800">
                        {booking.hall?.name}
                      </td>
                      <td className="p-3 whitespace-nowrap text-sm text-gray-600">
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
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {booking.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {groupedRecentBookings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-500">No bookings found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StaffDashboard;
