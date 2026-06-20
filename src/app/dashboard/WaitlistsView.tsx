"use client";
import React, { useState, useEffect } from "react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import { ListOrdered, Clock, MapPin, Calendar, ArrowRight } from "lucide-react";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import Image from "next/image";
import Link from "next/link";
import { WaitlistEntry } from "@/types";

const WaitlistsView = () => {
  const [waitlists, setWaitlists] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWaitlists = async () => {
      try {
        setLoading(true);
        // Using a general my-waitlists if available
        const response = await api.get("/events/my-waitlists");

        // Handle cases where the server returns HTML instead of JSON (common if endpoint doesn't exist)
        if (typeof response.data === 'string' && response.data.trim().startsWith('<!DOCTYPE html>')) {
          console.warn("Received HTML instead of JSON from /events/my-waitlists. Treating as empty.");
          setWaitlists([]);
          return;
        }

        const data = response.data.data || response.data;
        setWaitlists(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch waitlists:", error);
        // If 404, might just mean no waitlists or endpoint not yet public
        setWaitlists([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWaitlists();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><CustomLoader /></div>;

  if (waitlists.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-300">
          <ListOrdered size={40} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">No waitlists joined</h3>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto font-medium">You haven&apos;t joined any event waitlists yet. When a ticket tier is sold out, you can join the waitlist to be notified when a spot opens up.</p>
        <button
           onClick={() => window.location.href = '/events'}
           className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all"
        >
          Discover Events
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
         <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Waitlists</h2>
         <span className="px-4 py-2 bg-rose-50 text-rose-600 text-xs font-black rounded-full uppercase tracking-widest border border-rose-100">
            {waitlists.length} Active
         </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {waitlists.map((entry) => (
          <div key={entry.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-500">
             <div className="relative aspect-[16/9]">
                {entry.event?.bannerUrl ? (
                  <Image src={entry.event.bannerUrl} alt={entry.event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                    <Calendar size={48} />
                  </div>
                )}
                <div className="absolute top-4 left-4">
                   <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-white flex items-center gap-2">
                      <Clock size={12} className="text-rose-500" />
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Waitlist Only</span>
                   </div>
                </div>
             </div>

             <div className="p-6 space-y-6">
                <div>
                   <h3 className="text-xl font-black text-gray-900 line-clamp-1 mb-2 group-hover:text-primary transition-colors">{entry.event?.title || 'Unknown Event'}</h3>
                   <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-gray-500 font-medium text-xs">
                         <Calendar size={14} className="text-primary" />
                         {entry.event?.startDate ? new Date(entry.event.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date TBD'}
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 font-medium text-xs">
                         <MapPin size={14} className="text-primary" />
                         <span className="truncate">{entry.event?.location || "Virtual Event"}</span>
                      </div>
                   </div>
                </div>

                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                   <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Your Position</p>
                      <div className="flex items-center gap-2">
                         <span className="text-2xl font-black text-rose-600">#{entry.position}</span>
                         <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                           entry.status === 'NOTIFIED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                         }`}>
                           {entry.status}
                         </span>
                      </div>
                   </div>
                   <Link
                    href={
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (entry.event as any)?.organizer?.slug && (entry.event as any)?.slug
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ? `/events/${(entry.event as any).organizer.slug}/${(entry.event as any).slug}`
                        : `/events/${entry.event?.id}`
                    }
                    className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-all group/btn"
                   >
                      <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                   </Link>
                </div>

                {entry.ticketType && (
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Interested in</p>
                     <p className="text-xs font-bold text-gray-700">{entry.ticketType.name}</p>
                  </div>
                )}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WaitlistsView;
