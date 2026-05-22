"use client";
import React, { useState, useEffect } from "react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import { Ticket, Calendar, MapPin, Tag, QrCode, Download } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

interface Registration {
  id: string;
  ticketNumber: string;
  paymentStatus: string;
  createdAt: string;
  event: {
    id: string;
    title: string;
    startDate: string;
    location: string;
    bannerUrl: string;
  };
  ticket: {
    name: string;
    type: string;
    price: number;
  };
}

const EventsView = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);
        const response = await api.get("/events/my-registrations");
        // API might return data directly or nested
        const data = response.data.data || response.data;
        setRegistrations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch registrations:", error);
        Swal.fire("Error", translateError(error), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><CustomLoader /></div>;

  if (registrations.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-gray-300">
          <Ticket size={40} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">No tickets found</h3>
        <p className="text-gray-500 mb-8 max-w-sm mx-auto font-medium">You haven&apos;t registered for any events yet. Explore our marketplace to find your next experience.</p>
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
         <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Event Tickets</h2>
         <span className="px-4 py-2 bg-primary/10 text-primary text-xs font-black rounded-full uppercase tracking-widest">
            {registrations.length} Total
         </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {registrations.map((reg) => (
          <div key={reg.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 group overflow-hidden">
            <div className="flex flex-col sm:flex-row h-full">
               {/* Left: Event Banner */}
               <div className="relative w-full sm:w-48 h-48 sm:h-auto bg-gray-100 flex-shrink-0">
                  {reg.event.bannerUrl ? (
                    <Image
                      src={reg.event.bannerUrl}
                      alt={reg.event.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                       <Calendar size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                     <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm flex flex-col items-center leading-none">
                        <span className="text-[10px] font-black text-primary uppercase">{format(new Date(reg.event.startDate), "MMM")}</span>
                        <span className="text-lg font-black text-gray-900">{format(new Date(reg.event.startDate), "d")}</span>
                     </div>
                  </div>
               </div>

               {/* Right: Ticket Details */}
               <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-2">
                       <h3 className="font-black text-gray-900 text-lg leading-tight line-clamp-1">{reg.event.title}</h3>
                       <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${reg.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {reg.paymentStatus}
                       </div>
                    </div>

                    <div className="space-y-2 mb-6">
                       <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                          <MapPin size={14} className="text-primary/60" />
                          <span className="line-clamp-1">{reg.event.location || "Virtual Event"}</span>
                       </div>
                       <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                          <Tag size={14} className="text-primary/60" />
                          <span>{reg.ticket.name} • {reg.ticket.type}</span>
                       </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                     <div className="space-y-0.5">
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Ticket Number</p>
                        <p className="text-sm font-black text-gray-900">{reg.ticketNumber}</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <button
                           className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-primary hover:bg-blue-50 transition-all flex items-center justify-center"
                           title="View QR Code"
                        >
                           <QrCode size={18} />
                        </button>
                        <button
                           className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-primary hover:bg-blue-50 transition-all flex items-center justify-center"
                           title="Download PDF"
                        >
                           <Download size={18} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventsView;
