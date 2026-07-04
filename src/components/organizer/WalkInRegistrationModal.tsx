"use client";
import React, { useState } from "react";
import { X, User, Mail, Phone, Ticket, CreditCard, CheckCircle2 } from "lucide-react";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";
import { Ticket as TicketType } from "@/types";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

interface WalkInRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  tickets: TicketType[];
  onSuccess: () => void;
}

const WalkInRegistrationModal = ({ isOpen, onClose, eventId, tickets, onSuccess }: WalkInRegistrationModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ticketId: "",
    attendeeData: {
      fullName: "",
      email: "",
      phone: "",
    },
    paymentMethod: "CASH",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ticketId) {
      Swal.fire("Error", "Please select a ticket type", "error");
      return;
    }

    try {
      setLoading(true);
      Swal.showLoading();

      const payload = {
        ticketId: formData.ticketId,
        attendeeData: formData.attendeeData,
        paymentMethod: formData.paymentMethod,
        guestCategoryId: formData.ticketId // Assuming guestCategoryId is same as ticketId for walk-ins
      };

      await api.post(`/events/${eventId}/walk-in`, payload);

      await Swal.fire({
        title: "Registration Successful!",
        text: "The guest has been registered and can now be checked in.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });

      onSuccess();
      onClose();
      setFormData({
        ticketId: "",
        attendeeData: { fullName: "", email: "", phone: "" },
        paymentMethod: "CASH",
      });
    } catch (error) {
      console.error("Walk-in registration failed:", error);
      Swal.fire("Registration Failed", translateError(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white w-full max-w-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary p-5 sm:p-7 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex items-center gap-3 sm:gap-4 mb-1 sm:mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md">
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase italic">
                Walk-in <span className="text-white not-italic">Registration</span>
              </h2>
              <p className="text-white/70 text-[11px] sm:text-sm font-medium">Manual Guest Entry</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7 space-y-6 sm:space-y-7 overflow-y-auto no-scrollbar flex-1">
          <form id="walk-in-form" onSubmit={handleSubmit} className="space-y-6">
          {/* Ticket Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Ticket Type</label>
            <div className="grid grid-cols-1 gap-3">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, ticketId: ticket.id || "" })}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                    formData.ticketId === ticket.id
                      ? "border-primary bg-blue-50 shadow-md"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.ticketId === ticket.id ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>
                      <Ticket size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{ticket.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {Number(ticket.price) > 0 ? `₦${Number(ticket.price).toLocaleString()}` : "FREE"}
                      </p>
                    </div>
                  </div>
                  {formData.ticketId === ticket.id && <CheckCircle2 size={20} className="text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Guest Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Guest Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  type="text"
                  placeholder="e.g. Jane Doe"
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none"
                  value={formData.attendeeData.fullName}
                  onChange={(e) => setFormData({
                    ...formData,
                    attendeeData: { ...formData.attendeeData, fullName: e.target.value }
                  })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  type="email"
                  placeholder="guest@example.com"
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none"
                  value={formData.attendeeData.email}
                  onChange={(e) => setFormData({
                    ...formData,
                    attendeeData: { ...formData.attendeeData, email: e.target.value }
                  })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  type="tel"
                  placeholder="+234..."
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none"
                  value={formData.attendeeData.phone}
                  onChange={(e) => setFormData({
                    ...formData,
                    attendeeData: { ...formData.attendeeData, phone: e.target.value }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
            <div className="flex gap-3">
              {["CASH", "TRANSFER", "POS"].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: method })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                    formData.paymentMethod === method
                      ? "border-primary bg-blue-50 text-primary"
                      : "border-gray-100 text-gray-400 hover:border-gray-200"
                  }`}
                >
                  <CreditCard size={14} />
                  {method}
                </button>
              ))}
            </div>
          </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-7 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 shrink-0">
          <div className="flex justify-end gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              form="walk-in-form"
              type="submit"
              disabled={loading}
              className="px-6 sm:px-10 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] shadow-xl shadow-emerald-900/20 hover:shadow-emerald-900/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <CustomLoader className="w-3 h-3" />
                  Processing...
                </>
              ) : (
                <>
                  Complete Registration
                  <CheckCircle2 size={16} className="group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalkInRegistrationModal;
