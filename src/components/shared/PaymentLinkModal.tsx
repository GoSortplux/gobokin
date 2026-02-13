"use client";

import React, { useState, useEffect, useCallback } from "react";
import { X, Copy, Check, Mail, MessageCircle, Facebook, Twitter } from "lucide-react";
import api from "@/services/api";
import { translateError } from "@/utils/errors";
import Swal from "@/utils/sweetalert";

interface PaymentLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  id: string; // bookingId, reservationId, or recurringBookingId
  title?: string;
}

const PaymentLinkModal: React.FC<PaymentLinkModalProps> = ({ isOpen, onClose, id, title = "Payment Link" }) => {
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchPaymentLink = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/payments/checkout-link/${id}`);
      if (response.data?.data?.checkoutUrl) {
        setCheckoutUrl(response.data.data.checkoutUrl);
      } else {
        throw new Error("Checkout link not found in response");
      }
    } catch (error) {
      console.error("Failed to fetch payment link:", error);
      Swal.fire("Error", translateError(error), "error");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [id, onClose]);

  useEffect(() => {
    if (isOpen && id) {
      fetchPaymentLink();
    } else {
      setCheckoutUrl("");
      setCopied(false);
    }
  }, [isOpen, id, fetchPaymentLink]);

  const handleCopy = () => {
    if (checkoutUrl) {
      navigator.clipboard.writeText(checkoutUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <MessageCircle className="w-5 h-5" />,
      color: "bg-[#25D366]",
      link: `https://wa.me/?text=${encodeURIComponent(`Here is your payment link for ${id}: ${checkoutUrl}`)}`,
    },
    {
      name: "Facebook",
      icon: <Facebook className="w-5 h-5" />,
      color: "bg-[#1877F2]",
      link: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(checkoutUrl)}`,
    },
    {
      name: "X (Twitter)",
      icon: <Twitter className="w-5 h-5" />,
      color: "bg-[#000000]",
      link: `https://twitter.com/intent/tweet?url=${encodeURIComponent(checkoutUrl)}&text=${encodeURIComponent(`Payment link for ${id}`)}`,
    },
    {
      name: "Email",
      icon: <Mail className="w-5 h-5" />,
      color: "bg-gray-600",
      link: `mailto:?subject=${encodeURIComponent(`Payment Link for ${id}`)}&body=${encodeURIComponent(`Please use this link to complete your payment: ${checkoutUrl}`)}`,
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-900 italic uppercase">Share {title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-500 font-medium">Generating link...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative group">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Payment URL</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={checkoutUrl}
                    className="flex-1 bg-transparent text-sm font-medium text-gray-600 truncate focus:outline-none"
                  />
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-white shadow-sm border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-primary"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-4 tracking-widest text-center">Share via Social Platforms</p>
                <div className="grid grid-cols-4 gap-4">
                  {shareOptions.map((option) => (
                    <a
                      key={option.name}
                      href={option.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className={`${option.color} p-3 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        {option.icon}
                      </div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{option.name}</span>
                    </a>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed font-medium">
                  Tip: For <span className="font-bold">Instagram</span>, you can copy the link and paste it into a Direct Message or your profile bio.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-primary-dark transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentLinkModal;
