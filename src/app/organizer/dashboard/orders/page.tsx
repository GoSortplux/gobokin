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
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

const OrdersView = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get("/events/orders/all"); // Assuming an endpoint for all organizer orders
      setOrders(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Orders & Registrations</h1>
        <p className="text-gray-500 font-medium">Track ticket sales and attendee registration data across all your events.</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search orders by ID or attendee name..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-gray-700 font-bold text-sm border border-gray-100 hover:bg-gray-50 transition-all">
          <Download size={18} />
          Export All
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Info</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Event</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendee</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-5">
                           <p className="font-bold text-gray-900">ORD-{order.id.slice(0, 8)}</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1">
                              <Clock size={10} />
                              {new Date(order.createdAt).toLocaleDateString()}
                           </p>
                        </td>
                        <td className="px-6 py-5">
                           <p className="text-sm font-bold text-gray-700 max-w-[150px] truncate">{order.eventTitle}</p>
                           <p className="text-[10px] text-gray-400 font-medium">Ticket: {order.ticketName}</p>
                        </td>
                        <td className="px-6 py-5">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                                 {order.attendeeName?.[0] || 'G'}
                              </div>
                              <p className="text-sm font-bold text-gray-900">{order.attendeeName}</p>
                           </div>
                        </td>
                        <td className="px-6 py-5">
                           <p className="text-sm font-black text-gray-900">₦{order.amountPaid.toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-5">
                           <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                             order.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                           }`}>
                             {order.status}
                           </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                           <button className="p-2 text-gray-400 hover:text-primary transition-all">
                              <Eye size={18} />
                           </button>
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

export default OrdersView;
