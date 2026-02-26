"use client";
import React from 'react';
import EnhancedAnalytics from '@/components/vendor/EnhancedAnalytics';
import { Calendar, Users, BarChart3, CreditCard, ShieldCheck, MapPin, Star, Settings } from 'lucide-react';

const mockAnalyticsData = {
  overallStats: {
    totalRevenue: 5250000,
    grossRevenue: 5250000,
    netRevenueBeforeCommission: 4987500,
    totalCommission: 262500,
    totalPayout: 4500000,
    totalRefunded: 50000,
    totalBookingRevenue: 5200000,
    bookingGrossRevenue: 5200000,
    bookingRefundedAmount: 50000,
    bookingRevenue: 5150000,
    totalViews: 12450,
    totalDemoBookings: 85,
    totalBookings: { confirmed: 142, cancelled: 8, pending: 15 },
  },
  breakdownByHall: [
    {
      hallId: "1",
      hallName: "Grand Ballroom",
      overallStats: {
        totalRevenue: 3500000,
        grossRevenue: 3500000,
        netRevenueBeforeCommission: 3325000,
        commissionAmount: 175000,
        payoutAmount: 3000000,
        totalRefunded: 20000,
        totalViews: 8200,
        totalBookings: { confirmed: 84, cancelled: 4, pending: 8 },
        hallRevenue: 3200000,
        facilityRevenue: 300000,
      },
      kpis: {
        bookingConversionRate: '12.5%',
        averageBookingValue: '41666',
        busiestDays: [{ day: 'Sat', count: 45 }, { day: 'Fri', count: 32 }],
        repeatBookingRate: '15%',
        occupancyRate: '85%',
        averageBookingLeadTime: '24 days',
      },
      reservationAnalytics: { new: 12, converted: 8, expired: 2, active: 5 }
    },
    {
      hallId: "2",
      hallName: "Sunset Garden",
      overallStats: {
        totalRevenue: 1750000,
        grossRevenue: 1750000,
        netRevenueBeforeCommission: 1662500,
        commissionAmount: 87500,
        payoutAmount: 1500000,
        totalRefunded: 30000,
        totalViews: 4250,
        totalBookings: { confirmed: 58, cancelled: 4, pending: 7 },
        hallRevenue: 1500000,
        facilityRevenue: 250000,
      },
      kpis: {
        bookingConversionRate: '10.2%',
        averageBookingValue: '30172',
        busiestDays: [{ day: 'Sat', count: 28 }, { day: 'Sun', count: 22 }],
        repeatBookingRate: '10%',
        occupancyRate: '72%',
        averageBookingLeadTime: '18 days',
      },
      reservationAnalytics: { new: 15, converted: 10, expired: 3, active: 8 }
    }
  ],
  recentBookings: {
    bookings: [
      {
        _id: "b1",
        user: { _id: "u1", fullName: "John Doe", email: "john@example.com" },
        venue: { _id: "1", name: "Grand Ballroom" },
        eventDetails: "Wedding Reception",
        bookingDates: [{ startTime: "2023-12-25T14:00:00Z", endTime: "2023-12-25T22:00:00Z" }],
        totalPrice: 150000,
        paymentStatus: "paid",
        status: "confirmed",
        bookingType: "online",
        bookingId: "BK-8821"
      },
      {
        _id: "b2",
        walkInUserDetails: { fullName: "Sarah Smith", email: "sarah@example.com", phone: "08012345678" },
        venue: { _id: "2", name: "Sunset Garden" },
        eventDetails: "Birthday Party",
        bookingDates: [{ startTime: "2023-12-28T10:00:00Z", endTime: "2023-12-28T18:00:00Z" }],
        totalPrice: 85000,
        paymentStatus: "paid",
        status: "confirmed",
        bookingType: "walk-in",
        bookingId: "BK-9942"
      }
    ],
    pagination: { currentPage: 1, totalPages: 1, totalBookings: 2 }
  },
  kpis: {
    bookingConversionRate: '11.8%',
    averageBookingValue: '36971',
    busiestDays: [
        { day: 'Mon', count: 12 },
        { day: 'Tue', count: 15 },
        { day: 'Wed', count: 18 },
        { day: 'Thu', count: 22 },
        { day: 'Fri', count: 45 },
        { day: 'Sat', count: 78 },
        { day: 'Sun', count: 52 },
    ],
    repeatBookingRate: '12.4%',
    occupancyRate: '78.5%',
    averageBookingLeadTime: '21.5 days',
  },
  reservationAnalytics: { new: 27, converted: 18, expired: 5, active: 13 }
};

const MarketingShowcase = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      <style jsx global>{`
        .swal2-container { display: none !important; }
      `}</style>
      {/* Analytics Section */}
      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight uppercase italic">Powerful <span className="text-blue-600 not-italic">Intelligence</span></h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto font-medium">
              Real-time insights into your revenue, bookings, and customer behavior.
              Make data-driven decisions to grow your venue business.
            </p>
          </div>
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden relative">
            <EnhancedAnalytics initialData={mockAnalyticsData} />
          </div>
        </div>
      </section>

      {/* Venue Management Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
               <span className="text-blue-600 font-black uppercase tracking-widest text-sm mb-4 block">Venue Control</span>
               <h2 className="text-5xl font-black text-slate-900 mb-8 leading-tight tracking-tighter">Your Venues, <br/><span className="text-blue-600 italic">Managed Smarter.</span></h2>
               <div className="space-y-8">
                  <div className="flex gap-6">
                     <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                        <Settings size={24}/>
                     </div>
                     <div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">Detailed Configuration</h4>
                        <p className="text-slate-600 leading-relaxed">Customize pricing, capacity, operating hours, and rules for each of your venues with ease.</p>
                     </div>
                  </div>
                  <div className="flex gap-6">
                     <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                        <Users size={24}/>
                     </div>
                     <div>
                        <h4 className="text-xl font-bold text-slate-900 mb-2">Facility Management</h4>
                        <p className="text-slate-600 leading-relaxed">Manage amenities and chargeable add-ons. Set per-unit or per-hour costs for generators, sound systems, and more.</p>
                     </div>
                  </div>
               </div>
            </div>
            <div className="lg:w-1/2">
               <div className="bg-slate-100 rounded-[2rem] p-8 shadow-inner border border-slate-200">
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                     <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h4 className="font-bold text-slate-900">Edit Venue</h4>
                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">Step 2: Pricing & Facilities</span>
                     </div>
                     <div className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Daily Rate</p>
                              <p className="text-lg font-black text-slate-900">₦250,000</p>
                           </div>
                           <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Hourly Rate</p>
                              <p className="text-lg font-black text-slate-900">₦35,000</p>
                           </div>
                        </div>
                        <div className="space-y-3">
                           <p className="text-[10px] font-bold text-slate-400 uppercase">Active Facilities</p>
                           <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white"><Star size={16}/></div>
                                 <span className="text-sm font-bold text-slate-900">Sound System</span>
                              </div>
                              <span className="text-xs font-black text-blue-600">₦15,000 / flat</span>
                           </div>
                           <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 bg-slate-400 rounded-lg flex items-center justify-center text-white"><MapPin size={16}/></div>
                                 <span className="text-sm font-bold text-slate-900">Generator (100kVA)</span>
                              </div>
                              <span className="text-xs font-black text-slate-900">₦5,000 / hour</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6">
                <Calendar size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Smart Scheduling</h3>
              <p className="text-slate-600 leading-relaxed">
                Automated booking management with real-time availability. No more double bookings or manual tracking.
              </p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-6">
                <CreditCard size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Instant Payments</h3>
              <p className="text-slate-600 leading-relaxed">
                Secure online payments and automated payouts. Track every Naira with detailed financial breakdowns.
              </p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all">
              <div className="w-14 h-14 bg-amber-600 rounded-2xl flex items-center justify-center text-white mb-6">
                <Users size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Team Management</h3>
              <p className="text-slate-600 leading-relaxed">
                Assign staff to specific venues and manage roles easily. Keep everyone in your team perfectly synchronized.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Management Preview */}
      <section className="py-20 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="lg:w-1/2">
                    <h2 className="text-5xl font-black mb-8 leading-tight tracking-tighter">Control Your Bookings <br/><span className="text-blue-500 italic">From Anywhere.</span></h2>
                    <div className="space-y-6">
                        {[
                            { icon: ShieldCheck, title: "Verified Bookings", desc: "All online bookings are verified and secured." },
                            { icon: BarChart3, title: "Revenue Optimization", desc: "Set peak and off-peak pricing to maximize earnings." },
                            { icon: Calendar, title: "Easy Cancellations", desc: "Handle cancellation requests and refunds professionally." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="mt-1 text-blue-500"><item.icon size={24}/></div>
                                <div>
                                    <h4 className="text-lg font-bold">{item.title}</h4>
                                    <p className="text-slate-400">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="lg:w-1/2 relative">
                    <div className="bg-white/10 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/20 shadow-2xl transform rotate-2">
                        <div className="bg-white rounded-2xl p-6 text-slate-900">
                             <div className="flex justify-between items-center mb-6">
                                <h4 className="font-black text-slate-900 uppercase tracking-tight italic">Live Activity</h4>
                                <span className="flex items-center gap-1.5 text-[10px] bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-black uppercase">
                                   <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                                   Real-time
                                </span>
                             </div>
                             <div className="space-y-4">
                                {[
                                    { name: "Adewale Chen", event: "Corporate Retreat", price: "₦450,000", status: "Confirmed", colorClass: "text-emerald-600" },
                                    { name: "Blessing Okafor", event: "Art Exhibition", price: "₦120,000", status: "Pending", colorClass: "text-amber-600" },
                                    { name: "Musa Ibrahim", event: "Birthday Bash", price: "₦200,000", status: "Paid", colorClass: "text-blue-600" }
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                                        <div>
                                            <p className="text-sm font-black text-slate-900">{row.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{row.event}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900">{row.price}</p>
                                            <span className={`text-[9px] font-black uppercase tracking-tighter ${row.colorClass}`}>{row.status}</span>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-12 bg-white border-t border-slate-200">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-2xl font-black italic text-slate-900 mb-2">Gobo<span className="text-blue-600 not-italic">kin</span></h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">The Future of Venue Management</p>
         </div>
      </footer>
    </div>
  );
};

export default MarketingShowcase;
