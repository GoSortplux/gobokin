"use client";
import React, { useState } from "react";
import { X, User, Mail, Phone, Ticket, CreditCard, CheckCircle2 } from "lucide-react";
import api from "@/services/api";
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-8 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Walk-in <span className="text-primary not-italic">Registration</span></h2>
            <p className="text-xs text-gray-400 font-black uppercase tracking-widest mt-1">Manual Guest Entry</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl hover:bg-emerald-700 hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 text-lg disabled:opacity-50 mt-4 group"
          >
            {loading ? "Registering..." : "Complete Registration"}
            {!loading && <CheckCircle2 size={24} className="group-hover:rotate-12 transition-transform" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WalkInRegistrationModal;
