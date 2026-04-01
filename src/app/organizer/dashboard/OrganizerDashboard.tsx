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
  Zap,
  Target,
  ArrowRight,
  ShieldCheck,
  Star,
  Activity,
  Bell
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import api from "@/services/api";
import { Analytics, Event } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import { motion } from "framer-motion";

const OrganizerDashboard = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, eventsRes] = await Promise.all([
          api.get("/events/my-organizer-profile/finance"),
          api.get("/events?limit=5")
        ]);

        setRecentEvents(eventsRes.data.data || []);
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

  const activeEvent = recentEvents[0]; // Assume first is most active for this UI demo

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-20">
      {/* 1. Hero Command Section */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 relative group">
           <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
           <div className="relative bg-white rounded-[3rem] p-10 lg:p-14 border border-gray-100 shadow-2xl shadow-blue-900/5 overflow-hidden flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6 text-center md:text-left">
                 <div className="inline-flex items-center gap-2 bg-blue-50 text-primary px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest">
                    <Zap size={14} className="fill-primary" />
                    Organizer Command Center
                 </div>
                 <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
                    Scale your events <br/>
                    <span className="text-primary underline decoration-blue-100 underline-offset-8">to the moon.</span>
                 </h1>
                 <p className="text-gray-500 text-lg font-medium max-w-md">
                    Manage ticketing, track attendees, and analyze growth with our enterprise-grade toolkit.
                 </p>
                 <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
                    <Link
                      href="/organizer/dashboard/events/create"
                      className="bg-primary text-white font-black px-10 py-5 rounded-[2rem] hover:scale-105 hover:shadow-xl hover:shadow-primary/30 transition-all flex items-center gap-3"
                    >
                      <PlusCircle size={22} />
                      Create New Event
                    </Link>
                    <Link
                      href="/organizer/dashboard/events"
                      className="bg-gray-900 text-white font-black px-10 py-5 rounded-[2rem] hover:bg-gray-800 transition-all flex items-center gap-3"
                    >
                      My Events
                    </Link>
                 </div>
              </div>
              <div className="w-full md:w-72 lg:w-96 aspect-square relative flex items-center justify-center">
                 <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse"></div>
                 <div className="w-4/5 h-4/5 bg-white rounded-[3rem] shadow-2xl border border-gray-50 p-6 flex flex-col justify-between transform -rotate-6 group-hover:rotate-0 transition-transform duration-700">
                    <div className="flex items-center justify-between">
                       <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                          <TrendingUp size={24} />
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Rank</p>
                          <p className="text-xl font-black text-gray-900">#124</p>
                       </div>
                    </div>
                    <div>
                       <p className="text-xs font-bold text-gray-500 mb-1">Total Impact</p>
                       <p className="text-3xl font-black text-gray-900">12.5k</p>
                       <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">+18% this month</p>
                    </div>
                    <div className="flex -space-x-3">
                       {[1,2,3,4].map(i => (
                         <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-gray-200 overflow-hidden relative shadow-sm">
                            <Image src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" fill className="object-cover" />
                         </div>
                       ))}
                       <div className="w-10 h-10 rounded-full border-4 border-white bg-primary text-white flex items-center justify-center text-[10px] font-black shadow-sm">+8</div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* 2. Wallet Card - Distinct Style */}
        <div className="bg-gray-900 rounded-[3rem] p-10 flex flex-col justify-between text-white relative overflow-hidden shadow-2xl shadow-blue-900/20">
           <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                 <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center text-primary backdrop-blur-xl border border-white/10">
                    <Wallet size={32} />
                 </div>
                 <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors border border-white/5">
                    <MoreVertical size={20} />
                 </button>
              </div>
              <div>
                 <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Available for withdrawal</p>
                 <h2 className="text-5xl font-black tracking-tight leading-none">
                    ₦{analytics?.totalRevenue.toLocaleString()}
                 </h2>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/10">
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lifetime</p>
                    <p className="text-xl font-black">₦2.4M</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Growth</p>
                    <p className="text-xl font-black text-emerald-400">+₦120k</p>
                 </div>
              </div>
           </div>
           <Link
             href="/organizer/dashboard/finance"
             className="relative z-10 w-full mt-10 py-5 bg-white text-gray-900 font-black rounded-3xl hover:bg-primary hover:text-white transition-all text-center flex items-center justify-center gap-2 group"
           >
              Manage Wallet
              <ArrowUpRight size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
           </Link>
           {/* Decor */}
           <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* 3. Metrics Ribbon */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: "Active Attendees", value: "842", icon: Users, color: "bg-blue-500" },
           { label: "Check-in Rate", value: "94.2%", icon: Target, color: "bg-emerald-500" },
           { label: "Direct Traffic", value: "6.8k", icon: Activity, color: "bg-amber-500" },
           { label: "Satisfaction", value: "4.9/5", icon: Star, color: "bg-rose-500" },
         ].map((m, i) => (
           <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:shadow-blue-900/5 transition-all">
              <div className={`w-16 h-16 ${m.color} rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform`}>
                 <m.icon size={28} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{m.label}</p>
                 <h4 className="text-2xl font-black text-gray-900">{m.value}</h4>
              </div>
           </div>
         ))}
      </section>

      {/* 4. Live Focus & Recent History */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Live Event Widget */}
         <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between px-4">
               <h3 className="text-2xl font-black text-gray-900 tracking-tight">Active Event Spotlight</h3>
               <Link href="/organizer/dashboard/events" className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
                  View All Events <ChevronRight size={16} />
               </Link>
            </div>

            {activeEvent ? (
              <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-blue-900/5 overflow-hidden group">
                 <div className="relative h-72 w-full overflow-hidden">
                    {activeEvent.bannerUrl ? (
                      <Image src={activeEvent.bannerUrl} alt={activeEvent.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                         <Calendar size={64} className="text-primary/20" />
                      </div>
                    )}
                    <div className="absolute top-6 left-6 flex gap-2">
                       <span className="px-4 py-2 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                          Live Now
                       </span>
                    </div>
                    <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 flex items-center justify-between">
                       <div className="text-white">
                          <h4 className="text-2xl font-black truncate max-w-[300px]">{activeEvent.title}</h4>
                          <p className="text-blue-50/80 font-bold text-sm flex items-center gap-2 mt-1">
                             <Users size={14} />
                             {activeEvent.capacity} Total Registered
                          </p>
                       </div>
                       <Link
                         href={`/organizer/dashboard/events/${activeEvent.id}`}
                         className="w-14 h-14 bg-white text-primary rounded-2xl flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                       >
                          <ArrowRight size={24} />
                       </Link>
                    </div>
                 </div>

                 <div className="p-10 grid grid-cols-3 gap-8">
                    <div className="text-center space-y-1">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Conversion</p>
                       <p className="text-2xl font-black text-gray-900">24%</p>
                    </div>
                    <div className="text-center space-y-1 border-x border-gray-50">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Check-ins</p>
                       <p className="text-2xl font-black text-emerald-600">412</p>
                    </div>
                    <div className="text-center space-y-1">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Waitlist</p>
                       <p className="text-2xl font-black text-amber-500">18</p>
                    </div>
                 </div>
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-gray-200">
                 <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
                 <h4 className="text-xl font-bold text-gray-900">No active events</h4>
                 <p className="text-gray-500 mt-2 max-w-xs mx-auto">Launch an event today to see live metrics and attendee flow.</p>
              </div>
            )}
         </div>

         {/* Transactions / Feed */}
         <div className="lg:col-span-5 space-y-6">
            <div className="flex items-center justify-between px-4">
               <h3 className="text-2xl font-black text-gray-900 tracking-tight">Recent Activity</h3>
               <button className="text-primary font-bold text-sm hover:underline">View Log</button>
            </div>

            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-4 space-y-4">
               {[
                 { title: "VIP Ticket Sale #8912", user: "Adeola Jones", time: "2 mins ago", amount: "+₦45k", icon: Ticket, color: "text-blue-600", bg: "bg-blue-50" },
                 { title: "Staff Check-in Confirmed", user: "Main Entrance", time: "15 mins ago", amount: "Guest #214", icon: ShieldCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
                 { title: "Broadcast Sent", user: "Email & App", time: "1 hour ago", amount: "842 People", icon: Bell, color: "text-amber-600", bg: "bg-amber-50" },
                 { title: "Withdrawal Successful", user: "Bank Transfer", time: "4 hours ago", amount: "-₦120k", icon: Wallet, color: "text-rose-600", bg: "bg-rose-50" },
               ].map((act, idx) => (
                 <div key={idx} className="flex items-center justify-between p-5 hover:bg-gray-50 rounded-[2rem] transition-colors group cursor-pointer">
                    <div className="flex items-center gap-5">
                       <div className={`w-14 h-14 ${act.bg} ${act.color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                          <act.icon size={24} />
                       </div>
                       <div>
                          <h5 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{act.title}</h5>
                          <p className="text-xs text-gray-400 font-medium">{act.user} • {act.time}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-gray-900">{act.amount}</p>
                       <ArrowRight size={14} className="ml-auto mt-1 text-gray-300 group-hover:text-primary transition-colors" />
                    </div>
                 </div>
               ))}
               <Link href="/organizer/dashboard/finance" className="block text-center py-5 bg-gray-50 rounded-[2rem] text-sm font-black text-gray-500 hover:bg-primary hover:text-white transition-all uppercase tracking-widest mx-4 my-2">
                  Full Financial Report
               </Link>
            </div>
         </div>
      </section>
    </div>
  );
};

export default OrganizerDashboard;
