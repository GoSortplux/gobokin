"use client";
import React from "react";
import { X, CreditCard, Tag, ArrowRight, ShieldCheck, Info } from "lucide-react";
import { PricingBreakdown } from "@/types";

interface CheckoutBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  breakdown: PricingBreakdown;
  loading?: boolean;
}

const CheckoutBreakdownModal: React.FC<CheckoutBreakdownModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  breakdown,
  loading = false,
}) => {
  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: breakdown.currency || "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-primary p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-all"
          >
            <X size={20} />
          </button>

          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-100">Checkout</p>
            <h2 className="text-2xl font-black tracking-tight">Order Summary</h2>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Ticket Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="space-y-0.5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket Type</p>
              <p className="font-black text-gray-900">{breakdown.ticketName}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quantity</p>
              <p className="font-black text-gray-900">x{breakdown.quantity}</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm font-bold text-gray-500">
              <span>Subtotal</span>
              <span>{formatCurrency(breakdown.originalSubtotal)}</span>
            </div>

            {breakdown.discounts.totalAmount > 0 && (
              <div className="flex items-center justify-between text-sm font-bold text-emerald-600 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                <div className="flex items-center gap-2">
                  <Tag size={14} />
                  <span>Total Discount</span>
                </div>
                <span>-{formatCurrency(breakdown.discounts.totalAmount)}</span>
              </div>
            )}

            {breakdown.discounts.code?.applied && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] font-bold text-amber-700">
                <Info size={14} className="flex-shrink-0" />
                <p>{breakdown.discounts.code.message}</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-lg font-black text-gray-900">Total Payable</span>
              <span className="text-2xl font-black text-primary">{formatCurrency(breakdown.totalPayable)}</span>
            </div>
          </div>

          {/* Security Badges */}
          <div className="flex items-center justify-center gap-6 py-2">
            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <ShieldCheck size={14} className="text-emerald-500" />
              Secure Payment
            </div>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-widest">
              <CreditCard size={14} className="text-primary" />
              Instant Delivery
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full bg-primary text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-primary/20 hover:brightness-110 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
          >
            {loading ? "Processing..." : "Proceed to Payment"}
            {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
          </button>

          <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest">
            Redirecting to secure payment page
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutBreakdownModal;
