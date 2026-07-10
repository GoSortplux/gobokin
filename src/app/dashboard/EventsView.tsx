"use client";
import React, { useState, useEffect } from "react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import { Ticket, ListOrdered, History, User, Users } from "lucide-react";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { Registration } from "@/types";
import RegistrationDetailsModal from "./RegistrationDetailsModal";
import EventTicketCard from "./EventTicketCard";
import WaitlistsView from "./WaitlistsView";
import RefundsView from "./RefundsView";

const EventsView = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [activeSubTab, setActiveSubTab] = useState("tickets");
  const [ticketFilter, setTicketFilter] = useState<"personal" | "guest">("personal");

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoading(true);
        const response = await api.get("/events/my-registrations");
        // API might return data directly or nested
        const data = response.data.data || response.data;
        const sortedData = Array.isArray(data)
          ? [...data].sort((a, b) => new Date(a.event.startDate).getTime() - new Date(b.event.startDate).getTime())
          : [];
        setRegistrations(sortedData);
      } catch (error) {
        console.error("Failed to fetch registrations:", error);
        Swal.fire("Error", translateError(error), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchRegistrations();
  }, []);

  const personalTickets = registrations.filter(reg => reg.isAttendeeTicket === true);
  const guestTickets = registrations.filter(reg => reg.isPurchasedByMe === true && reg.isAttendeeTicket === false);

  useEffect(() => {
    if (personalTickets.length === 0 && guestTickets.length > 0) {
      setTicketFilter("guest");
    } else {
      setTicketFilter("personal");
    }
  }, [registrations.length]);

  const filteredRegistrations = ticketFilter === "personal" ? personalTickets : guestTickets;

  return (
    <div className="space-y-8">
      {/* Sub-tabs Navigation */}
      <div id="customer-events-tabs" className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-2xl border border-gray-100 w-full overflow-x-auto no-scrollbar sm:w-fit">
        {[
          { id: "tickets", label: "My Tickets", icon: Ticket, tourId: "customer-events-tickets" },
          { id: "waitlists", label: "Waitlists", icon: ListOrdered, tourId: "customer-events-waitlists" },
          { id: "refunds", label: "Refund History", icon: History, tourId: "customer-events-refunds" },
        ].map((tab) => (
          <button
            key={tab.id}
            id={tab.tourId}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${
              activeSubTab === tab.id
                ? "bg-white text-primary shadow-sm border border-gray-100 scale-105"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {activeSubTab === "tickets" && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-20"><CustomLoader /></div>
            ) : (
              <>
            {selectedRegistration && (
              <RegistrationDetailsModal
                registration={selectedRegistration}
                onClose={() => setSelectedRegistration(null)}
              />
            )}

            {registrations.length === 0 ? (
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
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">My Event Tickets</h2>
                    <p className="text-sm text-gray-500 font-medium">Manage your event registrations and guest tickets</p>
                  </div>

                  {personalTickets.length > 0 && guestTickets.length > 0 && (
                    <div className="flex items-center p-1 bg-gray-100 rounded-xl w-fit">
                      <button
                        onClick={() => setTicketFilter("personal")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          ticketFilter === "personal"
                            ? "bg-white text-primary shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <User size={14} />
                        Personal ({personalTickets.length})
                      </button>
                      <button
                        onClick={() => setTicketFilter("guest")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          ticketFilter === "guest"
                            ? "bg-white text-primary shadow-sm"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <Users size={14} />
                        Group Tickets ({guestTickets.length})
                      </button>
                    </div>
                  )}

                  {(personalTickets.length === 0 || guestTickets.length === 0) && registrations.length > 0 && (
                    <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-xs font-black rounded-full uppercase tracking-widest border border-emerald-100">
                      {registrations.length} Total
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredRegistrations.map((reg) => (
                    <EventTicketCard
                      key={reg.id}
                      registration={reg}
                      onViewDetails={(r) => setSelectedRegistration(r)}
                    />
                  ))}
                </div>
              </>
            )}
            </>
            )}
          </div>
        )}

        {activeSubTab === "waitlists" && <WaitlistsView />}
        {activeSubTab === "refunds" && <RefundsView />}
      </div>
    </div>
  );
};

export default EventsView;
