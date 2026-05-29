"use client";
import React, { useState, useEffect } from "react";
import {
  Ticket,
  Search,
  Filter,
  Download,
  Eye,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import withAuth from "@/components/auth/withAuth";

const OrdersView = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const isStaff = user?.role?.includes('organizer-staff');

  useEffect(() => {
    const init = async () => {
        setLoading(true);
        try {
            // Both roles can benefit from filtering by event
            const res = await api.get("/events/my-events");
            const eventList = res.data.data || [];
            setEvents(eventList);

            if (isStaff && eventList.length > 0) {
                setSelectedEventId(eventList[0].id);
            } else {
                // For regular organizer, start with global view (empty event id)
                await fetchOrders();
            }
        } catch (error) {
            console.error("Failed to initialize orders view", error);
            if (!isStaff) await fetchOrders();
        }
        setLoading(false);
    }
    init();
  }, [isStaff]);

  useEffect(() => {
    if (selectedEventId) {
        fetchOrders();
    }
  }, [selectedEventId]);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      const endpoint = selectedEventId
        ? `/events/${selectedEventId}/orders`
        : "/events/orders";

      const response = await api.get(endpoint);
      const rawData = response.data.data;
      const orderList = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);

      // Flatten orders into individual registrations to display ticket numbers
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

      setOrders(flattened);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCheckIn = async (ticketNumber: string, attendeeName: string) => {
    try {
        const result = await Swal.fire({
            title: 'Confirm Check-in',
            text: `Are you sure you want to check in ${attendeeName}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Check-in',
            confirmButtonColor: '#10b981',
        });

        if (result.isConfirmed) {
            Swal.showLoading();
            await api.post("/events/check-in", { ticketNumber });
            await Swal.fire('Success', 'Attendee checked in successfully', 'success');
            fetchOrders();
        }
    } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
    }
  };

  const handleExport = async () => {
    if (!selectedEventId && isStaff) {
        Swal.fire("Selection Required", "Please select an event to export attendance.", "warning");
        return;
    }

    try {
        Swal.showLoading();
        // Assuming the endpoint returns a blob or triggers a download
        const url = selectedEventId
            ? `/events/${selectedEventId}/export-attendance`
            : "/events/orders/export"; // Fallback for global

        const response = await api.get(url, { responseType: 'blob' });

        const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = downloadUrl;
        const filename = `attendance-${selectedEventId || 'global'}-${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();

        Swal.close();
    } catch (error) {
        Swal.fire('Export Failed', translateError(error), 'error');
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  return (
    <div className="space-y-8 pb-12 px-2">
      <div>
        <h1 className="text-4xl font-black text-primary tracking-tight">Orders & Registrations</h1>
        <p className="text-gray-500 font-medium mt-1">Track ticket sales and attendee registration data across all your events.</p>
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
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full lg:w-64">
            <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
            >
                {!isStaff && <option value="">All Events</option>}
                {events.map(event => (
                    <option key={event.id} value={event.id}>{event.title}</option>
                ))}
                {events.length === 0 && isStaff && <option value="">No events assigned</option>}
            </select>
        </div>

        <button
            onClick={handleExport}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-gray-700 font-black text-sm border border-gray-100 hover:bg-gray-50 transition-all shadow-sm whitespace-nowrap"
        >
          <Download size={18} />
          {isStaff ? 'Export Attendance' : 'Export All'}
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px] relative">
         {ordersLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                <CustomLoader />
            </div>
         )}
         <div className="overflow-x-auto">
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
                  {orders.length > 0 ? (
                    orders.map((order) => (
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
                                {order.checkInStatus ? (
                                    <span className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">
                                        <CheckCircle2 size={10} />
                                        Checked-in
                                    </span>
                                ) : (
                                    <button
                                        onClick={() => handleCheckIn(order.ticketNumber, order.attendeeName)}
                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 font-bold text-[10px] rounded-lg border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all uppercase tracking-widest"
                                    >
                                        Check-in
                                    </button>
                                )}
                                <button className="p-2 text-gray-400 hover:text-primary transition-all">
                                    <Eye size={18} />
                                </button>
                           </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
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
      </div>
    </div>
  );
};

export default withAuth(OrdersView, ["organizer", "organizer-staff"]);
