"use client";

import React, { useState, useEffect } from "react";
import { X, Download, Calendar, FileText, Filter, AlertCircle } from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import CustomLoader from "@/components/CustomLoader";

interface DownloadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReportType?: "finance" | "events";
}

const DownloadReportModal = ({
  isOpen,
  onClose,
  initialReportType = "finance",
}: DownloadReportModalProps) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role?.includes("super-admin") || user?.activeRole === "super-admin";

  const [reportType, setReportType] = useState<"finance" | "events">(initialReportType);
  const [format, setFormat] = useState<"excel" | "pdf">("excel");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isAsync, setIsAsync] = useState<boolean>(false);
  const [organizerId, setOrganizerId] = useState<string>("");

  // Finance-specific filters
  const [txType, setTxType] = useState<string>("");
  const [txStatus, setTxStatus] = useState<string>("");

  // Events-specific filters
  const [eventStatus, setEventStatus] = useState<string>("");
  const [isPublished, setIsPublished] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state with prop updates when modal opens
  useEffect(() => {
    if (isOpen) {
      setReportType(initialReportType);
      // Reset other states
      setFormat("excel");
      setStartDate("");
      setEndDate("");
      setIsAsync(false);
      setOrganizerId("");
      setTxType("");
      setTxStatus("");
      setEventStatus("");
      setIsPublished("");
    }
  }, [isOpen, initialReportType]);

  if (!isOpen) return null;

  const formatQueryDate = (dateStr: string, isEnd: boolean) => {
    if (!dateStr) return undefined;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return undefined;
      if (isEnd) {
        d.setHours(23, 59, 59, 999);
      } else {
        d.setHours(0, 0, 0, 0);
      }
      return d.toISOString();
    } catch (_e) {
      return undefined;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formattedStart = formatQueryDate(startDate, false);
    const formattedEnd = formatQueryDate(endDate, true);

    const params: Record<string, string | undefined> = {
      format,
      async: isAsync ? "true" : "false",
    };

    if (formattedStart) params.startDate = formattedStart;
    if (formattedEnd) params.endDate = formattedEnd;
    if (isSuperAdmin && organizerId.trim() !== "") {
      params.organizerId = organizerId.trim();
    }

    let endpoint = "";
    let defaultFilename = "";

    if (reportType === "finance") {
      endpoint = "/events/my-organizer-profile/finance/export";

      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      defaultFilename = `financial_transactions_${timestamp}`;

      if (txType) params.type = txType;
      if (txStatus) params.status = txStatus;
    } else {
      endpoint = "/events/my-events/export";

      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      defaultFilename = `events_summary_${timestamp}`;

      if (eventStatus) params.status = eventStatus;
      if (isPublished) params.isPublished = isPublished;
    }

    try {
      const response = await api.get(endpoint, {
        params,
        responseType: "blob",
      });

      const blob = response.data;

      // Check if the response is actually JSON (queued background task)
      if (blob.type === "application/json") {
        const text = await blob.text();
        const result = JSON.parse(text);
        if (result.success) {
          Swal.fire({
            title: "Report Queued",
            text: result.message || "Your report is being generated and will be sent to your email shortly.",
            icon: "success",
            confirmButtonColor: "#295FA7",
          });
          onClose();
        } else {
          Swal.fire("Error", result.message || "Failed to generate report.", "error");
        }
      } else {
        // Binary file download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        const ext = format === "pdf" ? "pdf" : "xlsx";
        link.setAttribute("download", `${defaultFilename}.${ext}`);

        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);

        Swal.fire({
          title: "Downloaded!",
          text: "Your report has been successfully generated and downloaded.",
          icon: "success",
          confirmButtonColor: "#295FA7",
        });
        onClose();
      }
    } catch (error: unknown) {
      console.error("Failed to export report:", error);
      const errResponse = (error as { response?: { data?: unknown } })?.response;
      if (errResponse?.data instanceof Blob) {
        try {
          const text = await errResponse.data.text();
          const parsed = JSON.parse(text);
          Swal.fire("Export Failed", parsed.message || "Failed to download report.", "error");
        } catch (_e) {
          Swal.fire("Export Failed", translateError(error), "error");
        }
      } else {
        Swal.fire("Export Failed", translateError(error), "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-primary p-5 sm:p-7 text-white relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-5 right-4 sm:right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Download className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Export Report</h2>
              <p className="text-white/70 text-[11px] sm:text-sm font-medium">Download performance or finance details</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto no-scrollbar flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Report Type Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <FileText size={12} className="text-primary" />
                Select Report Type
              </label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => setReportType("finance")}
                  className={`py-3 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${
                    reportType === "finance"
                      ? "bg-white text-primary shadow-sm font-black border border-gray-100"
                      : "text-gray-400 hover:text-gray-600 font-bold"
                  }`}
                >
                  Finance
                </button>
                <button
                  type="button"
                  onClick={() => setReportType("events")}
                  className={`py-3 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${
                    reportType === "events"
                      ? "bg-white text-primary shadow-sm font-black border border-gray-100"
                      : "text-gray-400 hover:text-gray-600 font-bold"
                  }`}
                >
                  Events Performance
                </button>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                Format
              </label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-gray-50 rounded-2xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => setFormat("excel")}
                  className={`py-3 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${
                    format === "excel"
                      ? "bg-white text-primary shadow-sm font-black border border-gray-100"
                      : "text-gray-400 hover:text-gray-600 font-bold"
                  }`}
                >
                  Excel (.xlsx)
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("pdf")}
                  className={`py-3 rounded-xl text-xs font-black transition-all uppercase tracking-wider ${
                    format === "pdf"
                      ? "bg-white text-primary shadow-sm font-black border border-gray-100"
                      : "text-gray-400 hover:text-gray-600 font-bold"
                  }`}
                >
                  PDF (.pdf)
                </button>
              </div>
            </div>

            {/* Date Range Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Calendar size={12} className="text-primary" />
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Calendar size={12} className="text-primary" />
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            {/* Conditional Filters: Finance */}
            {reportType === "finance" && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Filter size={12} className="text-primary" />
                    Transaction Type
                  </label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                  >
                    <option value="">All Types</option>
                    <option value="TICKET_PURCHASE">Ticket Purchase</option>
                    <option value="COMMISSION">Commission</option>
                    <option value="REFUND">Refund</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Filter size={12} className="text-primary" />
                    Status
                  </label>
                  <select
                    value={txStatus}
                    onChange={(e) => setTxStatus(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="SUCCESSFUL">Successful</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>
            )}

            {/* Conditional Filters: Events */}
            {reportType === "events" && (
              <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Filter size={12} className="text-primary" />
                    Event Status
                  </label>
                  <select
                    value={eventStatus}
                    onChange={(e) => setEventStatus(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                  >
                    <option value="">All Statuses</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Filter size={12} className="text-primary" />
                    Publication State
                  </label>
                  <select
                    value={isPublished}
                    onChange={(e) => setIsPublished(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                  >
                    <option value="">All States</option>
                    <option value="true">Published Only</option>
                    <option value="false">Drafts Only</option>
                  </select>
                </div>
              </div>
            )}

            {/* Super Admin specific organizer ID input */}
            {isSuperAdmin && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <label className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2 ml-1">
                  Organizer ID (Admin-only)
                </label>
                <input
                  type="text"
                  placeholder="Optional specific Organizer UUID"
                  value={organizerId}
                  onChange={(e) => setOrganizerId(e.target.value)}
                  className="w-full p-4 bg-red-50/20 border-2 border-red-100 focus:border-red-400 rounded-2xl text-sm font-bold outline-none transition-all"
                />
              </div>
            )}

            {/* Async Generation Option */}
            <div className="bg-blue-50/50 p-5 rounded-[1.5rem] border border-blue-100/50 flex items-start gap-4 cursor-pointer hover:bg-blue-50 transition-all">
              <div className="flex items-center h-5 mt-1">
                <input
                  id="async"
                  type="checkbox"
                  checked={isAsync}
                  onChange={(e) => setIsAsync(e.target.checked)}
                  className="w-5 h-5 text-primary border-gray-300 rounded-lg focus:ring-primary/20 accent-primary cursor-pointer"
                />
              </div>
              <label htmlFor="async" className="flex flex-col cursor-pointer select-none">
                <span className="text-xs font-black text-gray-900 uppercase tracking-wider">Generate Asynchronously</span>
                <span className="text-[10px] text-gray-500 font-medium leading-relaxed mt-0.5">
                  Highly recommended for large volume sets. The report will be compiled in the background and delivered via your email and in-app notifications.
                </span>
              </label>
            </div>

            {/* Informational tip */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-start gap-3">
              <AlertCircle size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                Reports exceeding 100 entries will automatically execute in asynchronous mode, even if &quot;Generate Asynchronously&quot; is unchecked.
              </p>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-7 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-[2] flex items-center justify-center gap-3 bg-primary text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <CustomLoader size={16} />
                  Generating...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DownloadReportModal;
