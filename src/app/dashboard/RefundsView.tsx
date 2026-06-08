"use client";
import React, { useState, useEffect } from "react";
import { History, Filter, AlertCircle, Clock, CheckCircle2, XCircle, Info } from "lucide-react";
import api from "@/services/api";
import { RefundRequest } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import { format } from "date-fns";

const RefundsView = () => {
  const [requests, setRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    fetchRefundRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchRefundRequests = async () => {
    try {
      setLoading(true);
      const params = status ? { status } : {};
      const response = await api.get("/events/my-refund-requests", { params });
      setRequests(response.data.data);
    } catch (error) {
      console.error("Failed to fetch refund requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'APPROVED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      case 'COMPLETED': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={14} />;
      case 'APPROVED': return <CheckCircle2 size={14} />;
      case 'REJECTED': return <XCircle size={14} />;
      case 'COMPLETED': return <CheckCircle2 size={14} />;
      default: return <Info size={14} />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Refund History</h2>
          <p className="text-gray-500 font-medium mt-1">Track your refund requests and their status.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="pl-11 pr-8 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none appearance-none cursor-pointer shadow-sm min-w-[160px]"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><CustomLoader /></div>
      ) : requests.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm hover:shadow-md transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                   <div className="w-16 h-16 rounded-2xl bg-gray-50 flex flex-col items-center justify-center border border-gray-100">
                      <span className="text-[10px] font-black text-emerald-600 uppercase leading-none mb-1">{format(new Date(request.createdAt), "MMM")}</span>
                      <span className="text-xl font-black text-gray-900 leading-none">{format(new Date(request.createdAt), "d")}</span>
                   </div>
                   <div className="space-y-1">
                      <h4 className="font-black text-gray-900 group-hover:text-primary transition-colors">{request.registration.event.title}</h4>
                      <p className="text-xs text-gray-500 font-medium flex items-center gap-2">
                         Ticket: {request.registration.ticketNumber} • ₦{request.registration.pricePaid.toLocaleString()}
                      </p>
                   </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border flex items-center gap-2 ${getStatusStyle(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {request.status}
                  </div>

                  <div className="h-10 w-px bg-gray-100 hidden md:block" />

                  <div className="max-w-xs">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reason</p>
                    <p className="text-xs text-gray-600 font-medium line-clamp-1 italic">&quot;{request.reason}&quot;</p>
                  </div>
                </div>
              </div>

              {request.adminNotes && (
                <div className="mt-6 pt-6 border-t border-gray-50">
                  <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4">
                    <AlertCircle size={16} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Organizer Note</p>
                      <p className="text-xs text-gray-600 font-medium leading-relaxed">{request.adminNotes}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[3rem] border border-gray-100 p-20 text-center space-y-6">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
            <History size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-gray-900">No refund requests found</h3>
            <p className="text-gray-500 font-medium max-w-sm mx-auto">
              Any refund requests you make for your event tickets will appear here.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundsView;
