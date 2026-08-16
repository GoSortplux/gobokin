"use client";
import React from "react";
import { X, User, Users, FileText, Ticket, Sparkles, CheckCircle2 } from "lucide-react";
import { Ticket as TicketType, RegistrationField } from "@/types";

interface EventFormPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle?: string;
  isGroupingEnabled?: boolean;
  registrationFields?: RegistrationField[];
  tickets?: Partial<TicketType>[];
}

export const EventFormPreviewModal: React.FC<EventFormPreviewModalProps> = ({
  isOpen,
  onClose,
  eventTitle,
  isGroupingEnabled = false,
  registrationFields = [],
  tickets = [],
}) => {
  if (!isOpen) return null;

  const groupFields = registrationFields.filter((f) => !f.isPerAttendee);
  const attendeeFields = isGroupingEnabled
    ? registrationFields.filter((f) => f.isPerAttendee)
    : registrationFields;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white w-full max-w-3xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
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
          <div className="flex items-center gap-3 sm:gap-4 mb-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/20">
                  Attendee View
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest bg-amber-400 text-gray-900 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={10} /> Preview Mode
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                {eventTitle || "Event Registration Form"}
              </h2>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-8 space-y-8 overflow-y-auto no-scrollbar flex-1 bg-gray-50/50">
          {/* Tickets Section if provided */}
          {tickets.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Ticket className="text-primary" size={18} />
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">
                  1. Select Ticket Tier
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tickets.map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      idx === 0
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {t.name || "Standard Ticket"}
                        </p>
                        {t.description && (
                          <p className="text-[10px] text-gray-400 font-medium line-clamp-1 mt-0.5">
                            {t.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                          t.isSpecial
                            ? "bg-amber-100 text-amber-700"
                            : "bg-secondary/10 text-secondary"
                        }`}
                      >
                        {t.type || "PAID"}
                      </span>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between border-t border-gray-100 pt-2">
                      <span className="text-base font-black text-gray-900">
                        {t.price && t.price > 0
                          ? `₦${t.price.toLocaleString()}`
                          : "FREE"}
                      </span>
                      {idx === 0 && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-primary">
                          <CheckCircle2 size={12} /> Selected
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Fields Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <FileText className="text-primary" size={18} />
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">
                {tickets.length > 0 ? "2. Registration Details" : "Registration Form Preview"}
              </h3>
            </div>

            {/* Group Fields */}
            {isGroupingEnabled && (
              <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-5 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-primary/10">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none">
                      Group Details
                    </h4>
                    <p className="text-[8px] font-bold text-primary/60 uppercase tracking-tighter mt-1">
                      Shared Information (Collected once per group)
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {groupFields.map((field, i) => (
                    <div key={i} className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                        {field.label}{" "}
                        {field.required && <span className="text-secondary">*</span>}
                      </label>
                      <div className="w-full h-11 bg-white border border-gray-200 rounded-xl px-4 flex items-center text-gray-400 text-xs font-medium">
                        {field.type === "select"
                          ? "Select option..."
                          : field.type === "number"
                          ? "Enter number..."
                          : field.type === "textarea"
                          ? "Enter detailed response..."
                          : field.type === "checkbox"
                          ? "Select checkbox options..."
                          : `Enter ${field.label.toLowerCase()}...`}
                      </div>
                    </div>
                  ))}

                  {groupFields.length === 0 && (
                    <p className="text-[10px] text-gray-400 italic font-medium">
                      No group-level fields configured.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Attendee Fields */}
            <div className="p-6 rounded-[2rem] bg-secondary/5 border border-secondary/10 space-y-5 relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-secondary shadow-sm border border-secondary/10">
                  <User size={18} />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none">
                    Attendee Details
                  </h4>
                  <p className="text-[8px] font-bold text-secondary/60 uppercase tracking-tighter mt-1">
                    Individual Information
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {attendeeFields.map((field, i) => (
                  <div key={i} className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                      {field.label}{" "}
                      {field.required && <span className="text-secondary">*</span>}
                    </label>

                    {field.type === "checkbox" && field.options && field.options.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {field.options.map((opt, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600"
                          >
                            <input
                              type="checkbox"
                              disabled
                              className="w-4 h-4 rounded text-secondary"
                            />
                            <span>{opt}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="w-full h-11 bg-white border border-gray-200 rounded-xl px-4 flex items-center text-gray-400 text-xs font-medium">
                        {field.type === "select"
                          ? "Select option..."
                          : field.type === "number"
                          ? "Enter number..."
                          : field.type === "textarea"
                          ? "Enter detailed response..."
                          : `Enter ${field.label.toLowerCase()}...`}
                      </div>
                    )}
                  </div>
                ))}

                {attendeeFields.length === 0 && (
                  <p className="text-[10px] text-gray-400 italic font-medium">
                    No attendee fields configured yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gray-900 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-md"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventFormPreviewModal;
