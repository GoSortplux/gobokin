"use client";
import React, { useState } from "react";
import { X, CheckCircle, AlertTriangle } from "lucide-react";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { RefundRequest } from "@/types";

interface ProcessRefundModalProps {
  request: RefundRequest;
  onClose: () => void;
  onSuccess: () => void;
}

const ProcessRefundModal: React.FC<ProcessRefundModalProps> = ({ request, onClose, onSuccess }) => {
  const [adminNotes, setAdminNotes] = useState("");
  const [isManual, setIsManual] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTopUp = async (suggestedAmount: number) => {
    const { value: amount, isConfirmed } = await Swal.fire({
      title: 'Top up Wallet',
      text: `Your wallet balance is insufficient. Suggested amount to cover this refund: ₦${suggestedAmount.toLocaleString()}`,
      input: 'number',
      inputValue: suggestedAmount,
      inputPlaceholder: 'Enter amount...',
      showCancelButton: true,
      confirmButtonText: 'Initialize Payment',
      confirmButtonColor: '#295FA7',
    });

    if (isConfirmed && amount) {
      try {
        Swal.showLoading();
        const response = await api.post("/events/wallet/top-up", {
          amount: parseFloat(amount)
        });

        if (response.data.data?.authorization_url) {
          window.location.href = response.data.data.authorization_url;
        } else {
          Swal.fire('Success', 'Top-up initialized. Please complete payment.', 'success');
        }
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  const handleProcess = async () => {
    try {
      setLoading(true);
      await api.post(`/events/registrations/${request.registrationId}/refund`, {
        adminNotes,
        isManual
      });
      Swal.fire("Success", "Refund processed successfully.", "success");
      onSuccess();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMsg = translateError(error);
      if (error?.response?.data?.message?.toLowerCase().includes("insufficient") || error?.response?.data?.message?.toLowerCase().includes("top-up")) {
        Swal.fire({
          title: "Insufficient Funds",
          text: errorMsg,
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Top up Now",
          confirmButtonColor: "#295FA7",
          cancelButtonText: "Close"
        }).then((result) => {
          if (result.isConfirmed) {
            handleTopUp(request.registration.pricePaid);
          }
        });
      } else {
        Swal.fire("Error", errorMsg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Process Refund</h3>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendee</span>
                <span className="text-sm font-bold text-gray-900">{request.registration.attendeeData.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount Paid</span>
                <span className="text-sm font-black text-primary">₦{request.registration.pricePaid.toLocaleString()}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Reason for Request</span>
                <p className="text-xs text-gray-600 font-medium leading-relaxed italic">&quot;{request.reason}&quot;</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Approved as per policy."
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all min-h-[80px] resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <input
                  type="checkbox"
                  id="isManual"
                  checked={isManual}
                  onChange={(e) => setIsManual(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-blue-200 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                />
                <label htmlFor="isManual" className="flex flex-col cursor-pointer">
                  <span className="text-xs font-black text-blue-900 uppercase tracking-widest">Manual Refund</span>
                  <span className="text-[10px] text-blue-700 font-medium">Tick this if you&apos;ve already refunded the guest outside the platform.</span>
                </label>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
              <AlertTriangle className="text-amber-600 shrink-0" size={18} />
              <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                Processing this refund will deduct funds from your wallet. Platform commission remains non-refundable.
              </p>
            </div>

            <button
              onClick={handleProcess}
              disabled={loading}
              className="w-full bg-primary text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : (
                <>
                  Confirm Refund
                  <CheckCircle size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessRefundModal;
