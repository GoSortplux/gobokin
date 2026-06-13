"use client";
import React, { useState, useRef } from "react";
import {
  X,
  Send,
  Paperclip,
  Users,
  CheckCircle2,
  Ticket,
  FileText,
  Trash2,
  Loader2,
  AlertCircle,
  Mail,
  Smartphone
} from "lucide-react";
import api from "@/services/api";
import axios from "axios";
import { Ticket as ITicket } from "@/types";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  tickets: ITicket[];
}

const BroadcastModal = ({ isOpen, onClose, eventId, tickets }: BroadcastModalProps) => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [segmentType, setSegmentType] = useState<"all" | "checked-in" | "tickets">("all");
  const [selectedTickets, setSelectedTicketIds] = useState<string[]>([]);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Get presigned URL
      const response = await api.get(`/events/${eventId}/media/upload-url`, {
        params: { fileName: file.name, fileType: file.type }
      });
      const { uploadUrl, fileUrl, publicUrl } = response.data.data;
      const finalUrl = publicUrl || fileUrl;

      // Upload to R2/S3
      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type }
      });

      setAttachmentUrl(finalUrl);
      setAttachmentName(file.name);
      Swal.toast.fire({ icon: "success", title: "File attached successfully" });
    } catch (error) {
      console.error("Upload failed:", error);
      Swal.fire("Upload Failed", "Could not upload the attachment. Please try again.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachmentUrl(null);
    setAttachmentName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTicketIds(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleSendBroadcast = async () => {
    if (!subject.trim() || !body.trim()) {
      Swal.fire("Missing Information", "Please provide both a subject and a message body.", "warning");
      return;
    }

    if (segmentType === "tickets" && selectedTickets.length === 0) {
      Swal.fire("No Audience", "Please select at least one ticket type.", "warning");
      return;
    }

    setIsSending(true);
    try {
      const segments = segmentType === "tickets" ? selectedTickets.join(",") : segmentType;

      const payload = {
        subject,
        body,
        segments,
        attachmentUrl: attachmentUrl || undefined
      };

      await api.post(`/events/${eventId}/broadcast`, payload);

      await Swal.fire({
        title: "Broadcast Sent!",
        text: "Your message is being delivered to the selected audience via email and app notification.",
        icon: "success",
        confirmButtonColor: "#295FA7"
      });

      // Reset form and close
      setSubject("");
      setBody("");
      setSegmentType("all");
      setSelectedTicketIds([]);
      removeAttachment();
      onClose();
    } catch (error) {
      console.error("Broadcast failed:", error);
      Swal.fire("Error", translateError(error), "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-primary p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Send size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight">Event Broadcast</h2>
              <p className="text-white/70 text-sm font-medium">Reach your attendees instantly via Email & App</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto no-scrollbar">
          {/* Segmentation */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={12} className="text-primary" />
              Target Audience Segment
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "all", label: "All Attendees", icon: Users },
                { id: "checked-in", label: "Checked-in Only", icon: CheckCircle2 },
                { id: "tickets", label: "Specific Tickets", icon: Ticket },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSegmentType(s.id as any)}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold text-sm ${
                    segmentType === s.id
                      ? "bg-primary/5 border-primary text-primary shadow-sm"
                      : "bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200"
                  }`}
                >
                  <s.icon size={18} />
                  {s.label}
                </button>
              ))}
            </div>

            {segmentType === "tickets" && (
              <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 animate-in slide-in-from-top-2 duration-300">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Select Ticket Types</p>
                <div className="flex flex-wrap gap-2">
                  {tickets.map(t => (
                    <button
                      key={t.id}
                      onClick={() => toggleTicketSelection(t.id!)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                        selectedTickets.includes(t.id!)
                          ? "bg-primary text-white border-primary shadow-md"
                          : "bg-white text-gray-500 border-gray-200 hover:border-primary/30"
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject Line</label>
              <input
                type="text"
                placeholder="e.g. Important Update for Tech Conference"
                className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message Body</label>
              <textarea
                placeholder="Type your message here..."
                rows={6}
                className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-3xl text-sm font-medium focus:border-primary focus:bg-white outline-none transition-all resize-none"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
          </div>

          {/* Attachment */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Paperclip size={12} className="text-primary" />
                Attachment (Optional)
              </label>
              {!attachmentUrl && !isUploading && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
                >
                  Choose File
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
            />

            {isUploading && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 text-primary rounded-2xl border border-blue-100 animate-pulse">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Uploading file...</span>
              </div>
            )}

            {attachmentUrl && (
              <div className="flex items-center justify-between p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText size={18} className="shrink-0" />
                  <span className="text-xs font-bold truncate">{attachmentName}</span>
                </div>
                <button
                  onClick={removeAttachment}
                  className="p-2 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            {!attachmentUrl && !isUploading && (
               <div
                 onClick={() => fileInputRef.current?.click()}
                 className="group cursor-pointer p-6 border-2 border-dashed border-gray-100 hover:border-primary/30 rounded-[2rem] transition-all flex flex-col items-center justify-center gap-2"
               >
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:text-primary group-hover:bg-primary/5 transition-colors">
                    <Paperclip size={20} />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-primary transition-colors">Click to attach a file</p>
               </div>
            )}
          </div>

          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
              This message will be sent to the selected audience segment. Please ensure your content is accurate before sending, as broadcasts cannot be undone.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-gray-50/80 backdrop-blur-md border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 text-gray-400">
                <Mail size={14} />
                <span className="text-[9px] font-black uppercase">Email</span>
             </div>
             <div className="w-1 h-1 rounded-full bg-gray-300"></div>
             <div className="flex items-center gap-1.5 text-gray-400">
                <Smartphone size={14} />
                <span className="text-[9px] font-black uppercase">Push</span>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSendBroadcast}
              disabled={isSending || isUploading}
              className="flex items-center gap-3 bg-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Send Broadcast
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastModal;
