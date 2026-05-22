"use client";
import React, { useState, useEffect } from "react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import { Ticket } from "lucide-react";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import RegistrationDetailsModal from "./RegistrationDetailsModal";
import EventTicketCard from "./EventTicketCard";

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
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

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
      {selectedRegistration && (
        <RegistrationDetailsModal
          registration={selectedRegistration}
          onClose={() => setSelectedRegistration(null)}
        />
      )}
      <div className="flex items-center justify-between mb-8">
         <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Event Tickets</h2>
         <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-black rounded-full uppercase tracking-widest border border-emerald-100">
            {registrations.length} Total
         </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {registrations.map((reg) => (
          <EventTicketCard
            key={reg.id}
            registration={reg}
            onViewDetails={(r) => setSelectedRegistration(r)}
          />
        ))}
      </div>
    </div>
  );
};

export default EventsView;
