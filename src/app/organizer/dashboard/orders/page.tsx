"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ticket,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  Users
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import withAuth from "@/components/auth/withAuth";
import RegistrationDetailsModal from "@/components/organizer/RegistrationDetailsModal";

const OrdersView = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [sectionFilter, setSectionFilter] = useState<string>(searchParams.get("Section") || searchParams.get("section") || "");
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination States
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit] = useState(10);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPages, setOrdersPages] = useState(1);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedRegistration, setSelectedRegistration] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isStaff = user?.role?.includes('organizer-staff');

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return (
      order.ticketNumber?.toLowerCase().includes(searchLower) ||
      order.attendeeName?.toLowerCase().includes(searchLower) ||
      order.eventTitle?.toLowerCase().includes(searchLower) ||
      order.attendeeEmail?.toLowerCase().includes(searchLower) ||
      order.orderId?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        try {
            const res = await api.get("/events/my-events");
            const eventList = res.data.data || [];
            setEvents(eventList);

            if (eventList.length > 0) {
                setSelectedEventId(eventList[0].id);
            }
        } catch (error) {
            console.error("Failed to initialize orders view", error);
        }
        setLoading(false);
    }
    init();
  }, [isStaff]);

  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const endpoint = selectedEventId
        ? `/events/${selectedEventId}/orders`
        : "/events/orders";

      const params: Record<string, string | number> = {
        page: ordersPage,
        limit: ordersLimit,
      };

      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      if (sectionFilter.trim()) {
        params.Section = sectionFilter.trim();
        params.section = sectionFilter.trim();
      }

      const response = await api.get(endpoint, { params });
      const rawData = response.data.data;
      const orderList = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);

      // Flatten orders into individual registrations to display ticket numbers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const flattened = orderList.flatMap((order: any) => {
        const registrations = order.registrations || [];
        if (registrations.length === 0) {
           return [{
             ...order,
             id: order.id,
             ticketNumber: `ORD-${order.id.slice(0, 8)}`,
             attendeeName: order.buyerInfo?.fullName || "Guest",
             eventTitle: order.event?.title || order.eventTitle || "N/A",
             amountPaid: order.amountPaid || 0,
             status: order.status || "PENDING"
           }];
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return registrations.map((reg: any) => ({
          ...order,
          ...reg,
          id: reg.id,
          orderId: order.id,
          createdAt: reg.createdAt || order.createdAt,
          eventTitle: order.event?.title || order.eventTitle || "N/A",
          ticketName: reg.ticketId?.name || order.ticketName || "Ticket",
          ticketNumber: reg.ticketNumber || `ORD-${order.id.slice(0, 8)}`,
          attendeeName: reg.attendeeData?.fullName || reg.attendeeData?.['full-name'] || order.buyerInfo?.fullName || "Guest",
          amountPaid: Number(reg.pricePaid || order.amountPaid || 0),
          status: reg.paymentStatus || order.status || "PAID",
          checkedInBy: reg.checkedInBy
        }));
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filteredFlattened = flattened.filter((item: any) => {
         const s = String(item.status || "").toUpperCase();
         return s !== "PENDING" && s !== "FAILED";
      });

      setOrders(filteredFlattened);

      const pagination = response.data.pagination;
      const total = pagination?.total ?? pagination?.totalResults ?? (Array.isArray(orderList) ? orderList.length : 0);
      const pages = pagination?.pages ?? pagination?.totalPages ?? (Math.ceil(total / ordersLimit) || 1);
      setOrdersTotal(total);
      setOrdersPages(pages);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [selectedEventId, ordersPage, ordersLimit, searchTerm, sectionFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isMultiDayEvent = (eventObj?: any) => {
    if (!eventObj?.startDate || !eventObj?.endDate) return false;
    const start = new Date(eventObj.startDate);
    const end = new Date(eventObj.endDate);
    const sDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const eDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return totalDays > 1;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCheckIn = async (ticketNumber: string, attendeeName: string, eventObj?: any) => {
    try {
        let selectedDay = 1;
        let totalDays = 1;

        if (eventObj?.startDate && eventObj?.endDate) {
          const start = new Date(eventObj.startDate);
          const end = new Date(eventObj.endDate);
          const sDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
          const eDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
          const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
          totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }

        if (totalDays > 1) {
          const inputOptions: Record<number, string> = {};
          for (let d = 1; d <= totalDays; d++) {
            inputOptions[d] = `Day ${d}`;
          }
          const { value: dayVal } = await Swal.fire({
            title: 'Select Check-in Day',
            input: 'select',
            inputOptions,
            inputPlaceholder: 'Select day',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
          });
          if (!dayVal) return; // cancelled
          selectedDay = parseInt(dayVal);
        }

        const result = await Swal.fire({
            title: 'Confirm Check-in',
            text: totalDays > 1
              ? `Are you sure you want to check in ${attendeeName} for Day ${selectedDay}?`
              : `Are you sure you want to check in ${attendeeName}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Check-in',
            confirmButtonColor: '#10b981',
        });

        if (result.isConfirmed) {
            Swal.showLoading();
            const response = await api.post("/events/check-in", {
              ticketNumber,
              day: totalDays > 1 ? selectedDay : undefined
            });
            const responseData = response.data?.data || response.data || {};

            if (responseData.alreadyCheckedIn) {
                const checkInTimeStr = responseData.checkInTime || responseData.checkedInAt;
                const formattedTime = checkInTimeStr
                  ? new Date(checkInTimeStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                  : '';

                await Swal.fire({
                  title: "Duplicate Scan!",
                  text: `Duplicate Scan! Checked in at ${formattedTime || "earlier today"}.`,
                  icon: "warning",
                  confirmButtonColor: "#f59e0b"
                });
            } else {
                await Swal.fire('Success', totalDays > 1 ? `Checked in successfully for Day ${selectedDay}` : 'Attendee checked in successfully', 'success');
            }
            fetchOrders();
        }
    } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
    }
  };


  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="space-y-8 pb-12 px-2 lg:px-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-primary tracking-tight">Orders & Registrations</h1>
          <p className="text-gray-500 font-medium mt-1">Track ticket sales and attendee registration data across all your events.</p>
        </div>
        {selectedEventId && (
          <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2.5 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-wider shrink-0 w-fit shadow-sm">
            <Users size={16} />
            <span>{selectedEvent?._count?.registrations ?? selectedEvent?.soldQuantity ?? ordersTotal} Registered</span>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white p-2 md:p-3 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search orders by ID or attendee name..."
            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all placeholder:font-medium"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setOrdersPage(1);
            }}
          />
        </div>

        <div className="w-full lg:w-64">
            <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setOrdersPage(1);
                }}
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            >
                {!isStaff && <option value="">All Events</option>}
                {events.map(event => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                ))}
                {events.length === 0 && isStaff && <option value="">No events assigned</option>}
            </select>
        </div>

        <div className="w-full lg:w-48 flex items-center gap-2">
            <select
                value={sectionFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSectionFilter(val);
                  setOrdersPage(1);
                  const p = new URLSearchParams(window.location.search);
                  if (val) {
                    p.set("Section", val);
                    p.set("section", val);
                  } else {
                    p.delete("Section");
                    p.delete("section");
                  }
                  router.push(`?${p.toString()}`);
                }}
                className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none cursor-pointer"
            >
                <option value="">Section: All</option>
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
                <option value="VIP">VIP</option>
                <option value="General">General</option>
            </select>
            {sectionFilter && (
              <button
                onClick={() => {
                  setSectionFilter("");
                  setOrdersPage(1);
                  const p = new URLSearchParams(window.location.search);
                  p.delete("Section");
                  p.delete("section");
                  router.push(`?${p.toString()}`);
                }}
                className="px-3 py-4 bg-rose-50 text-rose-600 font-bold text-xs rounded-2xl hover:bg-rose-100 transition-all border border-rose-100 shrink-0"
              >
                Clear
              </button>
            )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px] relative">
         {ordersLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <CustomLoader />
            </div>
         )}

         {/* Desktop Table */}
         <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Info</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendee</th>
                    {!isStaff && <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>}
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Checked In By</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-6">
                           <p className="font-black text-gray-900">{order.ticketNumber}</p>
                           <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1 mt-1.5">
                              <Clock size={10} />
                              {new Date(order.createdAt).toLocaleDateString()}
                           </p>
                        </td>
                        <td className="px-6 py-6">
                           <p className="text-sm font-bold text-gray-700 max-w-[150px] truncate group-hover:text-primary transition-colors">{order.eventTitle}</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ticket: {order.ticketName}</p>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                                 {order.attendeeName?.[0] || 'G'}
                              </div>
                              <p className="text-sm font-bold text-gray-900">{order.attendeeName}</p>
                           </div>
                        </td>
                        {!isStaff && (
                          <td className="px-6 py-6">
                             <p className="text-base font-black text-gray-900">₦{order.amountPaid.toLocaleString()}</p>
                          </td>
                        )}
                        <td className="px-6 py-6">
                           <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                             order.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                           }`}>
                             {order.status}
                           </span>
                        </td>
                        <td className="px-6 py-6">
                           {order.checkedInBy ? (
                              <div className="flex flex-col">
                                 <p className="text-xs font-bold text-gray-900">{order.checkedInBy.fullName}</p>
                                 <p className="text-[10px] text-gray-400 font-medium">{order.checkedInBy.email}</p>
                              </div>
                           ) : (
                              <span className="text-[10px] text-gray-300 font-bold italic uppercase">Not checked in</span>
                           )}
                        </td>
                        <td className="px-6 py-5 text-right">
                           <div className="flex items-center justify-end gap-2">
                                {order.checkInStatus && !isMultiDayEvent(order.event) ? (
                                    <span className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">
                                        <CheckCircle2 size={10} />
                                        Checked-in
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleCheckIn(order.ticketNumber, order.attendeeName, order.event)}
                                        disabled={order.status === 'PENDING' || order.status === 'FAILED'}
                                        title={order.status === 'PENDING' || order.status === 'FAILED' ? `Cannot check in a ${order.status.toLowerCase()} ticket` : ''}
                                        className={`px-3 py-1.5 font-bold text-[10px] rounded-lg border transition-all uppercase tracking-widest ${
                                            order.status === 'PENDING' || order.status === 'FAILED'
                                                ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-60'
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                                        }`}
                                    >
                                        Check-in
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setSelectedRegistration(order);
                                        setIsModalOpen(true);
                                    }}
                                    className="p-2 text-gray-400 hover:text-primary transition-all"
                                >
                                    <Eye size={18} />
                                </button>
                           </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                         <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <Ticket size={32} />
                         </div>
                         <h4 className="text-lg font-bold text-gray-900">No orders found</h4>
                         <p className="text-gray-500 text-sm">You haven&apos;t received any ticket registrations yet.</p>
                      </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>

         {/* Mobile Card Layout */}
         <div className="lg:hidden divide-y divide-gray-50">
            {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                    <div key={order.id} className="p-5 hover:bg-gray-50 transition-colors space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
                                    {order.attendeeName?.[0] || 'G'}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900 leading-tight">{order.attendeeName}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{order.ticketNumber}</p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                order.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>
                                {order.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Event</p>
                                <p className="text-xs font-bold text-gray-700 truncate max-w-full">{order.eventTitle}</p>
                                <p className="text-[8px] text-gray-400 font-bold mt-0.5 italic">{order.ticketName}</p>
                            </div>
                            <div>
                                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Date</p>
                                <p className="text-xs font-bold text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                            {!isStaff && (
                                <div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Amount</p>
                                    <p className="text-sm font-black text-gray-900">₦{order.amountPaid.toLocaleString()}</p>
                                </div>
                            )}
                            {order.checkedInBy && (
                                <div>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Checked-in By</p>
                                    <p className="text-[10px] font-bold text-gray-700 leading-tight">{order.checkedInBy.fullName}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            {order.checkInStatus && !isMultiDayEvent(order.event) ? (
                                <div className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 py-3 rounded-xl border border-blue-100">
                                    <CheckCircle2 size={14} />
                                    Checked-in
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleCheckIn(order.ticketNumber, order.attendeeName, order.event)}
                                    disabled={order.status === 'PENDING' || order.status === 'FAILED'}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 font-bold text-[10px] rounded-xl border transition-all uppercase tracking-widest ${
                                        order.status === 'PENDING' || order.status === 'FAILED'
                                            ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-60'
                                            : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'
                                    }`}
                                >
                                    Check-in Attendee
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    setSelectedRegistration(order);
                                    setIsModalOpen(true);
                                }}
                                className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl hover:text-primary transition-all shrink-0"
                            >
                                <Eye size={20} />
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <Ticket size={32} />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">No orders found</h4>
                    <p className="text-gray-500 text-sm">You haven&apos;t received any ticket registrations yet.</p>
                </div>
            )}
         </div>

         {/* Pagination Controls */}
         {ordersPages > 1 && (
            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
               <p className="text-xs text-gray-500 font-bold">
                  Showing Page {ordersPage} of {ordersPages} ({ordersTotal} Total Orders/Registrations)
               </p>
               <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setOrdersPage(p => Math.max(1, p - 1))}
                    disabled={ordersPage === 1}
                    className="px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                  >
                     Previous
                  </button>

                  {(() => {
                    const pages: (number | string)[] = [];
                    if (ordersPages <= 7) {
                      for (let i = 1; i <= ordersPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      if (ordersPage > 3) pages.push("...");
                      const start = Math.max(2, ordersPage - 1);
                      const end = Math.min(ordersPages - 1, ordersPage + 1);
                      for (let i = start; i <= end; i++) pages.push(i);
                      if (ordersPage < ordersPages - 2) pages.push("...");
                      pages.push(ordersPages);
                    }

                    return pages.map((p, idx) => {
                      if (p === "...") {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 text-xs font-bold text-gray-400">
                            ...
                          </span>
                        );
                      }
                      const isCurrent = p === ordersPage;
                      return (
                        <button
                          key={`page-${p}`}
                          onClick={() => setOrdersPage(Number(p))}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                            isCurrent
                              ? "bg-primary text-white shadow-sm"
                              : "bg-white border border-gray-100 text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      );
                    });
                  })()}

                  <button
                    onClick={() => setOrdersPage(p => Math.min(ordersPages, p + 1))}
                    disabled={ordersPage === ordersPages}
                    className="px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                  >
                     Next
                  </button>
               </div>
            </div>
         )}
      </div>

      {selectedRegistration && (
          <RegistrationDetailsModal
            isOpen={isModalOpen}
            onClose={() => {
                setIsModalOpen(false);
                setSelectedRegistration(null);
            }}
            eventId={selectedRegistration.eventId || selectedRegistration.event?.id || selectedEventId}
            ticketNumber={selectedRegistration.ticketNumber}
            onCheckInSuccess={fetchOrders}
          />
      )}
    </div>
  );
};

export default withAuth(OrdersView, ["organizer", "organizer-staff"]);
