"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Package,
  Calendar,
  ChevronRight
} from "lucide-react";
import api from "@/services/api";
import { SubscriptionPackage } from "@/types";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { formatCurrency } from "@/utils/currency";

interface ManualSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  organizerId: string;
  eventTitle: string;
}

const ManualSubscriptionModal = ({ isOpen, onClose, eventId, organizerId, eventTitle }: ManualSubscriptionModalProps) => {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
    }
  }, [isOpen]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get("/events/admin/packages");
      setPackages(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch packages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedPackageId) {
      Swal.fire("Selection Required", "Please select a subscription package to assign.", "warning");
      return;
    }

    const pkg = packages.find(p => p.id === selectedPackageId);

    const result = await Swal.fire({
      title: 'Confirm Assignment',
      text: `Are you sure you want to manually assign the "${pkg?.name}" package to this event? This will grant the organizer immediate access to its features for this event.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Assign Package',
      confirmButtonColor: '#295FA7',
    });

    if (result.isConfirmed) {
      setIsAssigning(true);
      try {
        await api.post(`/events/admin/organizers/${organizerId}/assign-subscription`, {
          packageId: selectedPackageId,
          eventId: eventId
        });

        await Swal.fire({
          title: "Success!",
          text: `The ${pkg?.name} package has been manually assigned to "${eventTitle}".`,
          icon: "success",
          confirmButtonColor: "#295FA7"
        });

        onClose();
      } catch (error) {
        console.error("Assignment failed:", error);
        Swal.fire("Error", translateError(error), "error");
      } finally {
        setIsAssigning(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-primary p-7 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md text-white">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Assign Subscription</h2>
              <p className="text-white/70 text-sm font-medium uppercase tracking-widest">Manual Event Package Assignment</p>
            </div>
          </div>
        </div>

        <div className="p-7 space-y-7 overflow-y-auto no-scrollbar flex-1">
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm shrink-0">
                <Calendar size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Target Event</p>
                <p className="text-lg font-black text-gray-900 line-clamp-1">{eventTitle}</p>
             </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
              <Package size={12} className="text-primary" />
              Select Subscription Package
            </label>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-4 text-gray-400">
                <Loader2 className="animate-spin" size={32} />
                <p className="text-sm font-bold uppercase tracking-widest">Loading Packages...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${
                      selectedPackageId === pkg.id
                        ? "border-primary bg-blue-50 shadow-lg shadow-primary/5"
                        : "border-gray-100 bg-gray-50 hover:border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        selectedPackageId === pkg.id ? "bg-primary text-white" : "bg-white text-gray-400 group-hover:text-primary"
                      }`}>
                        <Shield size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-black text-gray-900 group-hover:text-primary transition-colors">{pkg.name}</p>
                        <p className="text-xs text-gray-500 font-bold">{formatCurrency(pkg.price)} / {pkg.durationDays} Days</p>
                      </div>
                    </div>
                    {selectedPackageId === pkg.id ? (
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                         <CheckCircle2 size={18} />
                      </div>
                    ) : (
                      <ChevronRight size={20} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700 font-bold leading-relaxed uppercase tracking-tight">
              Manual assignment bypasses the payment gateway. Use this for special partnerships, offline sales, or administrative overrides.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-7 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 shrink-0">
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={isAssigning || loading || !selectedPackageId}
              className="flex items-center justify-center gap-3 bg-primary text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isAssigning ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Assign Package
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualSubscriptionModal;
