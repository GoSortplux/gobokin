"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Ticket,
  Search,
  Eye,
  Hash,
  Users
} from "lucide-react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import { formatCurrency } from "@/utils/currency";

interface AdminOrderFlattened {
  id: string;
  orderId: string;
  createdAt: string;
  eventTitle: string;
  ticketNumber: string;
  buyerName: string;
  buyerEmail: string;
  totalAmount: number;
  status: string;
  ticketCount: number;
}

interface AdminEvent {
  id: string;
  title: string;
  soldQuantity?: number;
  _count?: { registrations?: number };
}

const AllOrdersAdmin = () => {
  const [orders, setOrders] = useState<AdminOrderFlattened[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination States
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersLimit] = useState(10);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPages, setOrdersPages] = useState(1);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get("/events/my-events");
        setEvents(response.data.data || []);
      } catch {
        try {
          const fallbackRes = await api.get("/events");
          setEvents(fallbackRes.data.data || []);
        } catch {
          setEvents([]);
        }
      }
    };
    fetchEvents();
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
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

      const response = await api.get(endpoint, { params });
      const rawData = response.data.data;
      const orderList = Array.isArray(rawData) ? rawData : (Array.isArray(rawData?.data) ? rawData.data : []);

      // Flatten orders into individual registrations to display ticket numbers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const flattened = orderList.flatMap((order: any): AdminOrderFlattened[] => {
        const registrations = order.registrations || [];
        if (registrations.length === 0) {
           return [{
             ...order,
             id: order.id,
             ticketNumber: `ORD-${order.id.slice(0, 8)}`,
             buyerName: order.buyerInfo?.fullName || "Guest",
             buyerEmail: order.buyerInfo?.email || "N/A",
             eventTitle: order.event?.title || order.eventTitle || "N/A",
             totalAmount: order.amountPaid || 0,
             status: order.status || "PENDING",
             ticketCount: 0
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
          ticketNumber: reg.ticketNumber || `ORD-${order.id.slice(0, 8)}`,
          buyerName: reg.attendeeData?.fullName || reg.attendeeData?.['full-name'] || order.buyerInfo?.fullName || "Guest",
          buyerEmail: reg.attendeeData?.email || order.buyerInfo?.email || "N/A",
          totalAmount: Number(reg.pricePaid || order.amountPaid || 0),
          status: reg.paymentStatus || order.status || "PAID",
          ticketCount: 1
        }));
      });

      setOrders(flattened);

      const pagination = response.data.pagination;
      const total = pagination?.total ?? pagination?.totalResults ?? (Array.isArray(orderList) ? orderList.length : 0);
      const pages = pagination?.pages ?? pagination?.totalPages ?? (Math.ceil(total / ordersLimit) || 1);
      setOrdersTotal(total);
      setOrdersPages(pages);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, ordersPage, ordersLimit, searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.ticketNumber && order.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.buyerName && order.buyerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.eventTitle && order.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Orders</h1>
          <p className="text-gray-500 font-medium mt-1">Track and manage all ticket sales and registrations platform-wide.</p>
        </div>
        {selectedEventId && (
          <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2.5 rounded-2xl flex items-center gap-2 font-black text-xs uppercase tracking-wider shrink-0 w-fit shadow-sm">
            <Users size={16} />
            <span>{selectedEvent?._count?.registrations ?? selectedEvent?.soldQuantity ?? ordersTotal} Registered</span>
          </div>
        )}
      </div>

      <div className="bg-white p-3 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search orders by ID, buyer, or event..."
            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setOrdersPage(1);
            }}
          />
        </div>

        <div className="w-full md:w-64">
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setOrdersPage(1);
            }}
            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none cursor-pointer"
          >
            <option value="">All Events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>{event.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket Number</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Buyer</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tickets</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-gray-900 flex items-center gap-2">
                       <Hash size={14} className="text-primary" />
                       {order.ticketNumber}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{order.eventTitle}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-gray-700">{order.buyerName}</p>
                    <p className="text-xs text-gray-500">{order.buyerEmail}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-black text-gray-600">{order.ticketCount} Tickets</span>
                  </td>
                  <td className="px-8 py-6 font-black text-gray-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all">
                      <Eye size={20} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <Ticket size={40} />
                    </div>
                    <p className="text-gray-500 font-bold">No orders found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
    </div>
  );
};

export default AllOrdersAdmin;
