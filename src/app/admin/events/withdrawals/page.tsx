"use client";
import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  DollarSign,
  AlertCircle
} from "lucide-react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { formatCurrency } from "@/utils/currency";

const WithdrawalRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("PENDING");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Assuming this endpoint exists based on the pattern
      const response = await api.get("/events/admin/withdrawals");
      setRequests(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch withdrawals:", error);
      // Mock data for UI development if endpoint fails
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: "APPROVED" | "REJECTED") => {
    const { isConfirmed, value: notes } = await Swal.fire({
      title: `${status === 'APPROVED' ? 'Approve' : 'Reject'} Withdrawal?`,
      input: 'textarea',
      inputPlaceholder: 'Add admin notes (e.g. Transaction ID)...',
      showCancelButton: true,
      confirmButtonText: 'Submit',
      confirmButtonColor: status === 'APPROVED' ? '#10b981' : '#ef4444',
    });

    if (isConfirmed) {
      try {
        Swal.showLoading();
        await api.post(`/events/admin/withdrawals/${id}/status`, {
          status,
          adminNotes: notes
        });
        Swal.fire("Success!", `Withdrawal request ${status.toLowerCase()}.`, "success");
        fetchRequests();
      } catch (error) {
        Swal.fire("Error", "Failed to update status", "error");
      }
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Withdrawal Requests</h1>
        <p className="text-gray-500 font-medium">Review and process payout requests from event organizers.</p>
      </div>

      <div className="bg-white p-3 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
         {["ALL", "PENDING", "APPROVED", "REJECTED"].map(filter => (
           <button
             key={filter}
             onClick={() => setActiveFilter(filter)}
             className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
               activeFilter === filter ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:bg-gray-50"
             }`}
           >
             {filter}
           </button>
         ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Organizer</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank Details</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.length > 0 ? requests.filter(r => activeFilter === "ALL" || r.status === activeFilter).map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-bold text-gray-900">{req.organizerName || "ID: " + req.organizerId.slice(0,8)}</p>
                    <p className="text-xs text-gray-500 font-medium">{req.organizerEmail}</p>
                  </td>
                  <td className="px-8 py-6 font-black text-primary text-lg">{formatCurrency(req.amount)}</td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-gray-700">{req.bankName}</p>
                    <p className="text-xs text-gray-500 font-medium">{req.accountNumber}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-gray-700">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                      req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {req.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleStatusUpdate(req.id, "REJECTED")}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="Reject"
                        >
                          <XCircle size={20} />
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(req.id, "APPROVED")}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="Approve"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <CreditCard size={40} />
                    </div>
                    <p className="text-gray-500 font-bold">No withdrawal requests found.</p>
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

export default WithdrawalRequests;
