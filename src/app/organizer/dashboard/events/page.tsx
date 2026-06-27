"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Calendar,
  Search,
  MapPin,
  ArrowRight,
  PlusCircle,
  MoreVertical,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  Eye,
  MousePointer2,
  Trash2,
  ExternalLink,
  Edit,
  Settings
} from "lucide-react";
import Image from "next/image";
import api from "@/services/api";
import { Event } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { useAuth } from "@/context/AuthContext";
import WalkInRegistrationModal from "@/components/organizer/WalkInRegistrationModal";
import useOnClickOutside from "@/hooks/useOnClickOutside";

const MyEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED">("ALL");
  const [selectedEventForWalkIn, setSelectedEventForWalkIn] = useState<Event | null>(null);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(menuRef, () => setActiveMenu(null));

  const isStaff = user?.role?.includes('organizer-staff');

  const toggleMenu = (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveMenu(activeMenu === eventId ? null : eventId);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/my-events");
      setEvents(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      Swal.fire("Error", translateError(error), "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this event deletion!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        Swal.showLoading();
        await api.delete(`/events/${eventId}`);
        setEvents(events.filter(e => e.id !== eventId));
        Swal.fire("Deleted!", "Your event has been deleted.", "success");
      } catch (error) {
        Swal.fire("Error", translateError(error), "error");
      }
    }
  };

  const getEffectiveStatus = (event: Event) => {
    if (event.status === "CANCELLED") return "CANCELLED";

    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    if (now < start) return "UPCOMING";
    if (now >= start && now <= end) return "ONGOING";
    return "COMPLETED";
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase());
    const effectiveStatus = getEffectiveStatus(event);
    const matchesFilter = activeFilter === "ALL" || effectiveStatus === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING": return "bg-blue-50 text-blue-600 border border-blue-100";
      case "ONGOING": return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "COMPLETED": return "bg-gray-50 text-gray-600 border border-gray-100";
      case "CANCELLED": return "bg-rose-50 text-rose-600 border border-rose-100";
      default: return "bg-gray-50 text-gray-600 border border-gray-100";
    }
  };

  const handleWalkIn = async (event: Event) => {
    if (!event.tickets || event.tickets.length === 0) {
      try {
        Swal.showLoading();
        const response = await api.get(`/events/${event.id}`);
        const fullEvent = response.data.data;
        setSelectedEventForWalkIn(fullEvent);
        Swal.close();
      } catch (error) {
        console.error("Failed to fetch event tickets:", error);
        Swal.fire("Error", "Could not load ticket categories for this event.", "error");
        return;
      }
    } else {
      setSelectedEventForWalkIn(event);
    }
    setIsWalkInModalOpen(true);
  };

  const renderDropdown = (event: Event) => {
    if (activeMenu !== event.id) return null;

    const status = getEffectiveStatus(event);

    return (
      <div
        ref={menuRef}
        className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[100] animate-in fade-in zoom-in duration-200"
      >
        {!isStaff && (
          <>
            <Link
              href={`/organizer/dashboard/events/${event.id}`}
              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings size={18} className="text-primary" />
              Manage Event
            </Link>
            <Link
              href={`/organizer/dashboard/events/${event.id}/edit`}
              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit size={18} className="text-secondary" />
              Edit Event
            </Link>
          </>
        )}

        <Link
          href={`/events/${event.organizer?.slug || 'organizer'}/${event.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ExternalLink size={18} className="text-blue-500" />
          View Public Page
        </Link>

        {(status === "ONGOING" || status === "UPCOMING") && (
          <>
            <Link
              href={`/organizer/dashboard/events/${event.id}/check-in`}
              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <CheckCircle2 size={18} className="text-emerald-500" />
              Check-in Portal
            </Link>
            <button
              onClick={() => {
                handleWalkIn(event);
                setActiveMenu(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <PlusCircle size={18} className="text-purple-500" />
              Walk-in Registration
            </button>
          </>
        )}

        {!isStaff && (
          <button
            onClick={() => {
              deleteEvent(event.id);
              setActiveMenu(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors mt-1 border-t border-gray-50"
          >
            <Trash2 size={18} />
            Delete Event
          </button>
        )}
      </div>
    );
  };

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  return (
    <div className="space-y-8 pb-12 px-2 lg:px-4">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">My Events</h1>
          <p className="text-gray-500 font-medium mt-1">{isStaff ? "View and manage check-ins for your assigned events." : "Manage and monitor all your events in one place."}</p>
        </div>
        {!isStaff && (
          <Link
            href="/organizer/dashboard/events/create"
            className="flex items-center justify-center gap-2 bg-primary text-white font-bold px-6 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 w-full md:w-auto"
          >
            <PlusCircle size={20} />
            Create New Event
          </Link>
        )}
      </div>

      {/* Toolbar */}
      <div id="organizer-events-toolbar" className="bg-white p-2 md:p-3 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search events by title..."
            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar py-1 scroll-smooth">
          {["ALL", "UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"].map((filter) => (
            <button
              key={filter}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onClick={() => setActiveFilter(filter as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === filter
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="h-10 w-[1px] bg-gray-100 hidden lg:block mx-2"></div>

        <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
           <button
             onClick={() => setViewMode("grid")}
             className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
           >
             <LayoutGrid size={18} />
           </button>
           <button
             onClick={() => setViewMode("list")}
             className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
           >
             <List size={18} />
           </button>
        </div>
      </div>

      {/* Content */}
      {filteredEvents.length > 0 ? (
        viewMode === "grid" ? (
          <div id="organizer-events-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative">
                {/* Menu Button - Placed outside overflow-hidden container to prevent clipping */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={(e) => toggleMenu(e, event.id)}
                      className={`w-10 h-10 backdrop-blur-md rounded-xl flex items-center justify-center transition-all ${activeMenu === event.id ? 'bg-white text-primary shadow-lg' : 'bg-white/20 text-white hover:bg-white hover:text-primary'}`}
                    >
                      <MoreVertical size={20} />
                    </button>
                    {renderDropdown(event)}
                  </div>
                </div>

                <div className="relative h-44 w-full rounded-t-3xl overflow-hidden">
                  {event.bannerUrl ? (
                    <Image src={event.bannerUrl} alt={event.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                       <Calendar size={48} className="text-primary/20" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${getStatusColor(getEffectiveStatus(event))}`}>
                      {getEffectiveStatus(event)}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-black text-gray-900 mb-2 line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h3>

                  {event.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                      {event.description}
                    </p>
                  )}

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                          <Clock size={16} />
                        </div>
                        {new Date(event.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50/50 px-2 py-1 rounded-lg">
                        <Eye size={14} className="text-primary" />
                        {(event.analytics?.impressions || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                          <MapPin size={16} />
                        </div>
                        <span className="line-clamp-1">{event.location || "Virtual Event"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50/50 px-2 py-1 rounded-lg">
                        <MousePointer2 size={14} className="text-secondary" />
                        {(event.analytics?.clicks || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-4">
                    {!isStaff ? (
                      <>
                        <Link
                            href={`/organizer/dashboard/events/${event.id}`}
                            className="flex-1 bg-gray-50 text-gray-900 font-black py-4 rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 group/btn shadow-sm text-sm uppercase tracking-widest"
                        >
                            Manage Event
                            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                        <button
                            onClick={() => deleteEvent(event.id)}
                            className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                        >
                            <Trash2 size={20} />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 w-full">
                        <Link
                            href={`/organizer/dashboard/events/${event.id}/check-in`}
                            className="flex-1 bg-primary text-white font-black py-3 rounded-xl hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 group/btn shadow-md shadow-primary/20 text-[10px] uppercase tracking-wider"
                        >
                            <CheckCircle2 size={16} />
                            Check-in
                        </Link>
                        <button
                            onClick={() => handleWalkIn(event)}
                            className="flex-1 bg-emerald-50 text-emerald-600 font-black py-3 rounded-xl hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2 group/btn border border-emerald-100 text-[10px] uppercase tracking-wider"
                        >
                            <PlusCircle size={16} />
                            Walk-in
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Event Details</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Impressions</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Clicks</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registrations</th>
                    {!isStaff && <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Revenue</th>}
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden relative border-2 border-transparent group-hover:border-primary transition-all">
                            {event.bannerUrl ? (
                              <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary bg-primary/10 font-bold">
                                {event.title[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{event.title}</p>
                            <p className="text-xs text-gray-500 font-medium">{event.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusColor(getEffectiveStatus(event))}`}>
                          {getEffectiveStatus(event)}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <p className="text-sm font-black text-gray-900">{new Date(event.startDate).toLocaleDateString()}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Starts 09:00 AM</p>
                      </td>
                      <td className="px-6 py-5 font-black text-gray-600 text-sm">
                        {(event.analytics?.impressions || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-5 font-black text-gray-600 text-sm">
                        {(event.analytics?.clicks || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-5">
                         <div className="space-y-1">
                            <p className="text-sm font-black text-gray-900">{event._count?.registrations ?? event.soldQuantity ?? event.registrationCount ?? 0} / {event.capacity}</p>
                            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                               <div className="w-full h-full bg-primary rounded-full" style={{ width: `${Math.min(100, ((event._count?.registrations ?? event.soldQuantity ?? event.registrationCount ?? 0) / event.capacity) * 100)}%` }}></div>
                            </div>
                         </div>
                      </td>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {!isStaff && <td className="px-6 py-5 font-black text-emerald-600 text-sm">₦{((event as any).totalRevenue || 0).toLocaleString()}</td>}
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                            {!isStaff ? (
                              <>
                                <Link
                                    href={`/organizer/dashboard/events/${event.id}`}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                    title="Manage Event"
                                >
                                    <Eye size={18} />
                                </Link>
                                <button
                                    onClick={() => deleteEvent(event.id)}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                    title="Delete Event"
                                >
                                    <Trash2 size={18} />
                                </button>
                              </>
                            ) : (
                              <>
                                <Link
                                    href={`/organizer/dashboard/events/${event.id}/check-in`}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white hover:bg-opacity-90 transition-all shadow-sm"
                                    title="Check-in"
                                >
                                    <CheckCircle2 size={18} />
                                </Link>
                                <button
                                    onClick={() => handleWalkIn(event)}
                                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                    title="Walk-in Registration"
                                >
                                    <PlusCircle size={18} />
                                </button>
                              </>
                            )}
                            <div className="relative">
                              <button
                                onClick={(e) => toggleMenu(e, event.id)}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${activeMenu === event.id ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                              >
                                <MoreVertical size={18} />
                              </button>
                              {renderDropdown(event)}
                            </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden divide-y divide-gray-50">
                {filteredEvents.map((event) => (
                    <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden relative border border-gray-100 shrink-0">
                                    {event.bannerUrl ? (
                                        <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-primary bg-primary/10 font-bold">
                                            {event.title[0]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm leading-tight mb-1">{event.title}</p>
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${getStatusColor(getEffectiveStatus(event))}`}>
                                        {getEffectiveStatus(event)}
                                    </span>
                                </div>
                            </div>
                            <div className="relative">
                                <button
                                    onClick={(e) => toggleMenu(e, event.id)}
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${activeMenu === event.id ? 'bg-primary text-white' : 'bg-gray-50 text-gray-400'}`}
                                >
                                    <MoreVertical size={16} />
                                </button>
                                {renderDropdown(event)}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                            <div>
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Date</p>
                                <p className="text-xs font-bold text-gray-700">{new Date(event.startDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Registrations</p>
                                <p className="text-xs font-bold text-gray-700">{event._count?.registrations ?? event.soldQuantity ?? event.registrationCount ?? 0} / {event.capacity}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Impressions</p>
                                <p className="text-xs font-bold text-gray-700">{(event.analytics?.impressions || 0).toLocaleString()}</p>
                            </div>
                            {!isStaff && (
                                <div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Revenue</p>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    <p className="text-xs font-bold text-emerald-600">₦{((event as any).totalRevenue || 0).toLocaleString()}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mt-6">
                            {!isStaff ? (
                                <>
                                    <Link
                                        href={`/organizer/dashboard/events/${event.id}`}
                                        className="flex-1 bg-blue-50 text-primary font-black py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                                    >
                                        <Eye size={16} />
                                        Manage
                                    </Link>
                                    <button
                                        onClick={() => deleteEvent(event.id)}
                                        className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href={`/organizer/dashboard/events/${event.id}/check-in`}
                                        className="flex-1 bg-primary text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                                    >
                                        <CheckCircle2 size={16} />
                                        Check-in
                                    </Link>
                                    <button
                                        onClick={() => handleWalkIn(event)}
                                        className="flex-1 bg-emerald-50 text-emerald-600 border border-emerald-100 font-black py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest"
                                    >
                                        <PlusCircle size={16} />
                                        Walk-in
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )
      ) : (
        <div className="bg-white p-20 text-center rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <Calendar size={48} />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500 max-w-sm mx-auto mb-8">
            {searchTerm || activeFilter !== "ALL"
              ? "We couldn't find any events matching your current filters."
              : "You haven't created any events yet. Ready to start your next big thing?"}
          </p>
          <div className="flex items-center justify-center gap-4">
             {(searchTerm || activeFilter !== "ALL") && (
               <button
                onClick={() => { setSearchTerm(""); setActiveFilter("ALL"); }}
                className="px-6 py-3 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
               >
                 Clear Filters
               </button>
             )}
             {!isStaff && (
               <Link
                href="/organizer/dashboard/events/create"
                className="bg-primary text-white font-bold px-8 py-4 rounded-2xl hover:bg-opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center gap-2"
              >
                <PlusCircle size={20} />
                Create New Event
              </Link>
             )}
          </div>
        </div>
      )}

      {selectedEventForWalkIn && (
        <WalkInRegistrationModal
          isOpen={isWalkInModalOpen}
          onClose={() => {
            setIsWalkInModalOpen(false);
            setSelectedEventForWalkIn(null);
          }}
          eventId={selectedEventForWalkIn.id}
          tickets={selectedEventForWalkIn.tickets || []}
          onSuccess={() => {
            fetchEvents();
          }}
        />
      )}
    </div>
  );
};

export default MyEvents;
