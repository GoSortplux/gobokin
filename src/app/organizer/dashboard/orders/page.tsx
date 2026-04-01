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
    <div className="space-y-8 pb-12 px-2">
      <div>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Orders & Registrations</h1>
        <p className="text-gray-500 font-medium mt-1">Track ticket sales and attendee registration data across all your events.</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center gap-4">
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
        <button className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-gray-700 font-black text-sm border border-gray-100 hover:bg-gray-50 transition-all shadow-sm">
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
                        <td className="px-6 py-6">
                           <p className="font-black text-gray-900">ORD-{order.id.slice(0, 8)}</p>
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
                        <td className="px-6 py-6">
                           <p className="text-base font-black text-gray-900">₦{order.amountPaid.toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-6">
                           <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                             order.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
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
