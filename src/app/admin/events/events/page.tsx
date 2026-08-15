"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Search,
  MapPin,
  ArrowRight,
  Clock,
  LayoutGrid,
  List,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import api from "@/services/api";
import { Event } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

interface OrganizerOption {
  id: string;
  userProfile?: {
    fullName?: string;
    email?: string;
  };
  slug?: string;
}

const AllEventsAdmin = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [organizers, setOrganizers] = useState<OrganizerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED">("ALL");
  const [selectedOrganizerId, setSelectedOrganizerId] = useState<string>("");

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  // Fetch Organizers list for filtering
  useEffect(() => {
    const fetchOrganizers = async () => {
      try {
        const res = await api.get("/events/admin/organizers?limit=100");
        setOrganizers(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch organizers:", error);
      }
    };
    fetchOrganizers();
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page,
        limit,
      };

      if (selectedOrganizerId) {
        params.organizerId = selectedOrganizerId;
      }

      const response = await api.get("/events/my-events", { params });
      setEvents(response.data.data || []);
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.pages || 1);
        setTotalEvents(response.data.pagination.total || (response.data.data || []).length);
      } else {
        setTotalPages(1);
        setTotalEvents((response.data.data || []).length);
      }
    } catch (error) {
      console.error("Failed to fetch events from /events/my-events:", error);
      Swal.fire("Error", translateError(error), "error");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, selectedOrganizerId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const deleteEvent = async (eventId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You are about to delete this event platform-wide!",
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
        Swal.fire("Deleted!", "The event has been deleted.", "success");
        fetchEvents();
      } catch (error) {
        Swal.fire("Error", translateError(error), "error");
      }
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.organizer?.userProfile?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === "ALL" || event.status === activeFilter;
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

  return (
    <div className="space-y-8 pb-12 px-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Platform Events</h1>
          <p className="text-gray-500 font-medium mt-1">Monitor and manage all events across the Gobokin platform.</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search platform events or organizers..."
              className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full lg:w-72">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <Filter size={18} />
            </div>
            <select
              value={selectedOrganizerId}
              onChange={(e) => {
                setSelectedOrganizerId(e.target.value);
                setPage(1);
              }}
              className="w-full pl-11 pr-8 py-4 bg-gray-50 border-none rounded-2xl text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none cursor-pointer appearance-none text-gray-700"
            >
              <option value="">Filter by Organizer: All</option>
              {organizers.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.userProfile?.fullName || org.slug || org.id} ({org.userProfile?.email || "No Email"})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-2xl self-end lg:self-center">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 rounded-xl transition-all ${viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              title="Grid View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-3 rounded-xl transition-all ${viewMode === "list" ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-50 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 py-1">
            {["ALL", "UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"].map((filter) => (
              <button
                key={filter}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={() => setActiveFilter(filter as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeFilter === filter
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <p className="text-xs font-bold text-gray-400 whitespace-nowrap hidden sm:block">
            Showing {filteredEvents.length} of {totalEvents} Platform Events
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex items-center justify-center"><CustomLoader /></div>
      ) : filteredEvents.length > 0 ? (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredEvents.map((event) => (
                <div key={event.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-500 group relative flex flex-col justify-between">
                  <div>
                    <div className="relative h-48 w-full overflow-hidden">
                      {event.bannerUrl ? (
                        <Image src={event.bannerUrl} alt={event.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                           <Calendar size={48} className="text-primary/20" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      {event.organizer && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                            {event.organizer.userProfile?.fullName?.[0] || 'O'}
                          </div>
                          <span className="text-xs font-bold text-gray-500 truncate">{event.organizer.userProfile?.fullName || event.organizer.slug}</span>
                        </div>
                      )}

                      <h3 className="text-xl font-black text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">{event.title}</h3>

                      <div className="space-y-2 text-sm text-gray-500 font-medium">
                        <div className="flex items-center gap-3">
                          <Clock size={16} className="text-primary shrink-0" />
                          <span>{new Date(event.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin size={16} className="text-primary shrink-0" />
                          <span className="line-clamp-1">{event.location || "Virtual Event"}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Users size={16} className="text-primary shrink-0" />
                          <span>{event._count?.registrations ?? event.soldQuantity ?? 0} / {event.capacity} Registrations</span>
                        </div>
                      </div>

                      {event.analytics && (
                        <div className="pt-3 border-t border-gray-50 grid grid-cols-3 gap-2 text-center bg-gray-50/50 p-3 rounded-2xl">
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase">Views</p>
                            <p className="text-xs font-bold text-gray-900">{event.analytics.detailViews || 0}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase">Clicks</p>
                            <p className="text-xs font-bold text-gray-900">{event.analytics.clicks || 0}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-gray-400 uppercase">CTR</p>
                            <p className="text-xs font-bold text-gray-900">{(event.analytics.ctr || 0).toFixed(1)}%</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0 flex items-center gap-3">
                    <Link
                        href={`/admin/events/events/${event.id}`}
                        className="flex-1 bg-gray-50 text-gray-900 font-black py-3.5 rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 group/btn shadow-sm text-xs uppercase tracking-widest"
                    >
                        Manage Event
                        <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                    <button
                        onClick={() => deleteEvent(event.id)}
                        className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm shrink-0"
                    >
                        <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Event Details</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Organizer</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registrations</th>
                      <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden relative shrink-0 border border-gray-100">
                              {event.bannerUrl ? (
                                <Image src={event.bannerUrl} alt={event.title} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary bg-primary/10 font-black text-lg">
                                  {event.title[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{event.title}</p>
                              <p className="text-xs text-gray-500 font-medium">{event.category} • {event.type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          {event.organizer ? (
                            <div>
                              <p className="text-sm font-bold text-gray-900">{event.organizer.userProfile?.fullName || event.organizer.slug}</p>
                              <p className="text-xs text-gray-400">{event.organizer.userProfile?.email}</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${getStatusColor(event.status)}`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="px-6 py-6">
                          <p className="text-sm font-black text-gray-900">{new Date(event.startDate).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-5">
                           <div className="space-y-1">
                              <p className="text-sm font-black text-gray-900">{event._count?.registrations ?? event.soldQuantity ?? 0} / {event.capacity}</p>
                           </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                              <Link
                                  href={`/admin/events/events/${event.id}`}
                                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 text-gray-900 font-bold text-xs hover:bg-primary hover:text-white transition-all shadow-sm"
                              >
                                  <Eye size={16} />
                                  Manage
                              </Link>
                              <button
                                  onClick={() => deleteEvent(event.id)}
                                  className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                              >
                                  <Trash2 size={16} />
                              </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs font-bold text-gray-500">
                Page {page} of {totalPages} ({totalEvents} total events)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-3 bg-gray-50 text-gray-700 rounded-2xl hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:hover:bg-gray-50 disabled:hover:text-gray-700"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-3 bg-gray-50 text-gray-700 rounded-2xl hover:bg-primary hover:text-white transition-all disabled:opacity-40 disabled:hover:bg-gray-50 disabled:hover:text-gray-700"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white p-20 text-center rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
            <Calendar size={48} />
          </div>
          <h3 className="text-2xl font-black text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">Try adjusting your search query, status filter, or selected organizer.</p>
        </div>
      )}
    </div>
  );
};

export default AllEventsAdmin;
