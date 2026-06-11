"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Type,
  Calendar,
  Clock,
  MapPin,
  Users,
  ChevronDown,
  ShieldCheck,
  User,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  Zap,
  Eye,
  EyeOff,
  Image as ImageIcon,
  XCircle,
  Upload,
  UploadCloud,
  Ticket
} from "lucide-react";
import api from "@/services/api";
import axios from "axios";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { EventType, RegistrationMode, Speaker, TicketType, Ticket as ITicket } from "@/types";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

const steps = [
  { id: 1, title: "Identity", icon: Type },
  { id: 2, title: "Speakers", icon: Users },
  { id: 3, title: "Settings", icon: ShieldCheck },
  { id: 4, title: "Narrative", icon: FileText },
  { id: 5, title: "Visuals", icon: ImageIcon },
  { id: 6, title: "Ticketing", icon: Ticket },
  { id: 7, title: "Schedule", icon: Calendar },
];

const STORAGE_KEY = "gobokin_hosting_draft";

interface LivePreviewProps {
  basicInfo: {
    title: string;
    description: string;
    type: string;
    startDate: string;
    endDate: string;
    location: string;
    virtualLink: string;
    capacity: number;
    category: string;
    isPublic: boolean;
  };
  mediaInfo: {
    bannerUrl: string;
    mediaUrls: string[];
  };
  speakers: Speaker[];
  tickets: ITicket[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sessions: any[];
  agendaEnabled: boolean;
}

const LivePreview = ({ basicInfo, mediaInfo, speakers, tickets, sessions, agendaEnabled }: LivePreviewProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!agendaEnabled && activeTab === "schedule") {
      setActiveTab("overview");
    }
  }, [agendaEnabled, activeTab]);

  const tabs = ["overview", ...(agendaEnabled ? ["schedule"] : []), "speakers", "tickets"];

  return (
    <div className="sticky top-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden h-[calc(100vh-12rem)] overflow-y-auto no-scrollbar transition-all duration-500 hover:shadow-gray-300/50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-50 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Live Preview</span>
        </div>
      </div>

      <div className="p-6 space-y-10">
        <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-inner bg-gray-50 group">
          {mediaInfo.bannerUrl ? (
            <Image src={mediaInfo.bannerUrl} alt="Banner" fill unoptimized={true} className="object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
              <ImageIcon size={40} strokeWidth={1.5} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Banner Placeholder</p>
            </div>
          )}
          <div className="absolute top-4 left-4">
            <div className="bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl shadow-xl shadow-black/5 flex items-center gap-3 border border-white">
              <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex flex-col items-center justify-center leading-none">
                <span className="text-[8px] font-black uppercase tracking-widest mb-0.5">
                  {basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleDateString(undefined, { month: 'short' }) : 'MON'}
                </span>
                <span className="text-base font-black">
                  {basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleDateString(undefined, { day: 'numeric' }) : '00'}
                </span>
              </div>
              <div className="h-6 w-[1px] bg-gray-100"></div>
              <div>
                <p className="text-[10px] font-black text-gray-900 leading-tight">
                  {basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleDateString(undefined, { weekday: 'long' }) : 'Day'}
                </p>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                  {basicInfo.startDate ? new Date(basicInfo.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '00:00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest border border-primary/10">
              {basicInfo.category || "Category"}
            </span>
            <span className="px-3.5 py-1.5 rounded-full bg-secondary/5 text-secondary text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-secondary/10">
              <Zap size={10} />
              {basicInfo.type}
            </span>
            {basicInfo.isPublic === false && (
              <span className="px-3.5 py-1.5 rounded-full bg-gray-100 text-gray-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-gray-200">
                <EyeOff size={10} />
                Private
              </span>
            )}
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-tight">
            {basicInfo.title || "Your Event Title"}
          </h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 transition-all hover:bg-white hover:shadow-lg hover:shadow-gray-200/20">
              <div className="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                <MapPin size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Location</p>
                <p className="text-[11px] font-bold text-gray-700 truncate leading-none">{basicInfo.location || basicInfo.virtualLink || "Location pending"}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 transition-all hover:bg-white hover:shadow-lg hover:shadow-gray-200/20">
              <div className="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Capacity</p>
                <p className="text-[11px] font-bold text-gray-700 leading-none">{basicInfo.capacity || 0} Slots Available</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gray-50 rounded-2xl border border-gray-100 w-fit">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  activeTab === tab ? "bg-white text-primary shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[250px] relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            {activeTab === "overview" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">About Event</p>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap font-medium">
                    {basicInfo.description || "Enter a description in Step 4 to see it here..."}
                  </p>
                </div>

                {mediaInfo.mediaUrls.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-4 bg-secondary rounded-full"></div>
                          <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Gallery</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {mediaInfo.mediaUrls.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
                                    {url && typeof url === 'string' && url.match(/\.(mp4|webm|ogg)$/) ? (
                                        <video src={url} className="w-full h-full object-cover" />
                                    ) : url ? (
                                        <Image src={url} alt="Gallery" fill unoptimized={true} className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <ImageIcon size={20} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
            )}
            {activeTab === "speakers" && (
              <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-500">
                {speakers.length === 0 ? (
                  <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center py-10">No speakers added yet</p>
                ) : (
                  speakers.map((speaker, i) => (
                    <div key={i} className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-3xl border border-gray-100/50">
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center text-gray-300">
                        {speaker.imageUrl ? (
                           <Image src={speaker.imageUrl} alt={speaker.name} fill unoptimized={true} className="object-cover" />
                        ) : (
                           <User size={24} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-gray-900 truncate leading-tight">{speaker.name || "Unnamed Speaker"}</p>
                        <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5 truncate">{speaker.title || "Position"}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "schedule" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {sessions.length === 0 || (sessions.length === 1 && !sessions[0].title) ? (
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center py-10">No sessions added yet</p>
                ) : (
                  sessions.filter(s => s.title).map((item, i) => (
                      <div key={i} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-lg bg-secondary text-white flex items-center justify-center font-black text-[10px] flex-shrink-0 shadow-lg shadow-secondary/20">
                          {i + 1}
                          </div>
                          {i !== sessions.length - 1 && <div className="flex-1 w-[1px] bg-gray-100 my-2"></div>}
                      </div>
                      <div className="space-y-1.5 min-w-0 pt-0.5">
                          <p className="text-[11px] font-black text-gray-900 truncate tracking-tight">{item.title || "Untitled Session"}</p>
                          <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                  <Clock size={10} className="text-secondary" />
                                  <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">
                                  {item.startTime ? new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                  </p>
                              </div>
                              {(item.speakerNames && item.speakerNames.length > 0) && (
                                  <div className="flex items-center gap-1.5">
                                      <User size={10} className="text-secondary" />
                                      <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{item.speakerNames.join(", ")}</p>
                                  </div>
                              )}
                          </div>
                      </div>
                      </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "tickets" && (
              <div className="space-y-4 animate-in fade-in duration-500">
                 {tickets.map((ticket, i) => (
                   <div key={i} className="p-5 rounded-[1.5rem] border border-gray-100 bg-gray-50/50 space-y-4 transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-200/20 group">
                      <div className="flex justify-between items-center">
                        <p className="text-[11px] font-black text-gray-900 group-hover:text-primary transition-colors">{ticket.name || "Untitled Tier"}</p>
                        <span className="text-[8px] font-black text-secondary bg-secondary/5 px-2 py-1 rounded-lg uppercase tracking-widest border border-secondary/10">{ticket.type}</span>
                      </div>
                      <div className="flex items-end gap-1">
                          <p className="text-xl font-black text-gray-900 tracking-tight">₦{(ticket.price || 0).toLocaleString()}</p>
                          <span className="text-[9px] text-gray-400 font-bold mb-1 uppercase">/ pax</span>
                      </div>
                   </div>
                 ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const HostEventPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [formData, setFormData] = useState({
    eventId: null as string | null,
    basicInfo: {
      title: "",
      slug: "",
      category: "",
      tags: "",
      startDate: "",
      endDate: "",
      type: "PHYSICAL" as EventType,
      location: "",
      virtualLink: "",
      capacity: 0,
      agendaEnabled: false,
      isPublic: true,
      isFeatured: false,
      description: "",
    },
    mediaInfo: {
      bannerUrl: "",
      mediaUrls: [] as string[],
    },
    speakers: [] as Speaker[],
    registration: {
      mode: "FULL_DETAILS" as RegistrationMode,
    },
    tickets: [{
      id: "1",
      name: "General Admission",
      price: 0,
      type: "FREE" as TicketType,
      allocationType: "GENERAL",
      totalQuantity: 1,
      maxPerOrder: 5,
      salesStart: "",
      salesEnd: "",
      groupSize: 1,
      description: "",
      earlyBirdPrice: 0,
      earlyBirdLimit: 0,
      earlyBirdExpiry: "",
      isOffline: false,
      quantityDiscounts: []
    }] as ITicket[],
    sessions: [{
      id: "1",
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      location: "",
      room: "",
      stage: "",
      sessionType: "",
      speakerIds: [] as string[],
      speakerNames: [] as string[],
    }]
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/events/utils/categories");
        const data = response.data.data || [];
        const categoryNames = data.map((cat: string | { name: string }) =>
          typeof cat === 'string' ? cat : cat.name
        );
        setCategories(categoryNames);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    const resumeAtStep5 = localStorage.getItem("gobokin_host_event_resume_step_5");

    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(draft);
        if (resumeAtStep5 === "true") {
           // We'll handle the actual redirection to Step 5 inside another useEffect
           // that waits for 'user' to be available and performs the POST if needed.
           localStorage.removeItem("gobokin_host_event_resume_step_5");
        }
      } catch (e) {
        console.error("Failed to parse draft:", e);
      }
    }
  }, []);

  // Handle returning guests who need their event created
  useEffect(() => {
    const checkAndInitialize = async () => {
        if (user && !formData.eventId && currentStep === 1 && localStorage.getItem(STORAGE_KEY)) {
            // If we have a user, no eventId, but a draft exists, check if we were supposed to be at Step 5
            // This logic covers users who just registered/logged in.
            const draft = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
            if (draft.basicInfo?.title && !draft.eventId) {
                // If they have completed Step 1-4 data but haven't created the event yet
                // We'll let them click the button again or we could auto-trigger.
                // For safety and visibility, we'll just ensure they are at Step 4
                // so they can click "Create Event & Continue".
                if (draft.basicInfo.description) {
                    setCurrentStep(4);
                }
            }
        }
    };
    checkAndInitialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, formData.eventId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const uploadMedia = async (file: File, currentEventId?: string | null) => {
    try {
      const endpoint = currentEventId ? `/events/${currentEventId}/media/upload-url` : '/events/utils/upload-url';
      const presignedResponse = await api.get(endpoint, {
        params: { fileName: file.name, fileType: file.type }
      });
      const { uploadUrl, fileUrl, publicUrl } = presignedResponse.data.data;
      const finalUrl = publicUrl || fileUrl;

      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || file.size));
          setUploadProgress(percent);
        }
      });

      return finalUrl;
    } catch (_error) {
      console.error('Upload failed:', _error);
      throw _error;
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileUrl = await uploadMedia(file, formData.eventId);
      if (formData.eventId) {
          await api.post(`/events/${formData.eventId}/media`, { bannerUrl: fileUrl });
      }
      setFormData(prev => ({ ...prev, mediaInfo: { ...prev.mediaInfo, bannerUrl: fileUrl } }));
      Swal.toast.fire({ icon: 'success', title: 'Banner uploaded successfully!' });
    } catch (_error) {
      Swal.fire('Error', 'Failed to upload banner.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMediaUrlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
          const url = await uploadMedia(files[i], formData.eventId);
          if (formData.eventId) {
              await api.post(`/events/${formData.eventId}/media`, { mediaUrl: url });
          }
          urls.push(url);
      }
      setFormData(prev => ({ ...prev, mediaInfo: { ...prev.mediaInfo, mediaUrls: [...prev.mediaInfo.mediaUrls, ...urls] } }));
      Swal.toast.fire({ icon: 'success', title: 'Media uploaded successfully!' });
    } catch (_error) {
      Swal.fire('Error', 'Some uploads failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const removeMediaUrl = async (idx: number) => {
      const urlToDelete = formData.mediaInfo.mediaUrls[idx];
      if (formData.eventId) {
          try {
              await api.delete(`/events/${formData.eventId}/media`, { data: { mediaUrl: urlToDelete } });
          } catch (err) {
              console.error("Failed to delete media from backend:", err);
          }
      }
      setFormData(prev => ({ ...prev, mediaInfo: { ...prev.mediaInfo, mediaUrls: prev.mediaInfo.mediaUrls.filter((_, i) => i !== idx) } }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(prev as any)[section],
        [field]: value
      }
    }));
  };

  const addSpeaker = () => {
    setFormData(prev => ({
      ...prev,
      speakers: [...prev.speakers, { name: "", title: "", bio: "", imageUrl: "" }]
    }));
  };

  const updateSpeaker = (index: number, field: keyof Speaker, value: string) => {
    const newSpeakers = [...formData.speakers];
    newSpeakers[index] = { ...newSpeakers[index], [field]: value };
    setFormData(prev => ({ ...prev, speakers: newSpeakers }));
  };

  const removeSpeaker = (index: number) => {
    setFormData(prev => ({
      ...prev,
      speakers: prev.speakers.filter((_, i) => i !== index)
    }));
  };

  const addTicket = () => {
    const currentTotal = formData.tickets.reduce((sum, t) => sum + (t.totalQuantity || 0), 0);
    const remaining = Math.max(0, formData.basicInfo.capacity - currentTotal);
    setFormData(prev => ({
        ...prev,
        tickets: [...prev.tickets, {
            id: Math.random().toString(),
            name: "", price: 0, type: "PAID" as TicketType,
            allocationType: "GENERAL", totalQuantity: remaining, maxPerOrder: 5,
            salesStart: "", salesEnd: "", groupSize: 1, description: "",
            earlyBirdPrice: 0, earlyBirdLimit: 0, earlyBirdExpiry: "",
            isOffline: false, quantityDiscounts: []
        }]
    }));
  };

  const removeTicket = (id: string) => {
    if (formData.tickets.length > 1) {
      setFormData(prev => ({ ...prev, tickets: prev.tickets.filter(t => t.id !== id) }));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateTicket = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => {
        if (t.id === id) {
          let newValue = value;
          if (field === "totalQuantity") {
             const otherTicketsSum = prev.tickets.filter(ticket => ticket.id !== id).reduce((sum, ticket) => sum + (ticket.totalQuantity || 0), 0);
             const maxAllowed = Math.max(0, prev.basicInfo.capacity - otherTicketsSum);
             newValue = Math.min(parseInt(value) || 0, maxAllowed);
          }
          const updated = { ...t, [field]: newValue };
          if (field === 'type' && value === 'FREE') {
            return { ...updated, price: 0, earlyBirdPrice: 0, earlyBirdLimit: 0, earlyBirdExpiry: "" };
          }
          return updated;
        }
        return t;
      })
    }));
  };

  const addQuantityDiscount = (ticketId: string) => {
    setFormData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => t.id === ticketId ? {
        ...t, quantityDiscounts: [...(t.quantityDiscounts || []), { minQuantity: 0, discountPercentage: 0 }]
      } : t)
    }));
  };

  const updateQuantityDiscount = (ticketId: string, index: number, field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => {
        if (t.id === ticketId) {
          const discounts = [...(t.quantityDiscounts || [])];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (discounts[index] as any)[field] = value;
          return { ...t, quantityDiscounts: discounts };
        }
        return t;
      })
    }));
  };

  const removeQuantityDiscount = (ticketId: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      tickets: prev.tickets.map(t => {
        if (t.id === ticketId) {
          const discounts = [...(t.quantityDiscounts || [])];
          discounts.splice(index, 1);
          return { ...t, quantityDiscounts: discounts };
        }
        return t;
      })
    }));
  };

  const addSession = () => {
    setFormData(prev => ({
      ...prev,
      sessions: [...prev.sessions, {
        id: Math.random().toString(), title: "", description: "",
        startTime: "", endTime: "", location: "", room: "", stage: "",
        sessionType: "", speakerIds: [], speakerNames: []
      }]
    }));
  };

  const removeSession = (id: string) => {
    if (formData.sessions.length > 1) {
      setFormData(prev => ({ ...prev, sessions: prev.sessions.filter(s => s.id !== id) }));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateSession = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      sessions: prev.sessions.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 4) {
      handleFinalize();
    } else if (currentStep === 5) {
      setCurrentStep(6);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (currentStep === 6) {
      saveTickets();
    } else if (currentStep === 7) {
      saveSessions();
    }
  };

  const saveTickets = async () => {
    const eventId = formData.eventId;
    if (!eventId) return;

    const emptyTicket = formData.tickets.find(t => !t.name || t.name.trim() === "");
    if (emptyTicket) {
        Swal.fire("Validation Error", "All ticket tiers must have a name.", "error");
        return;
    }

    setIsFinalizing(true);
    Swal.showLoading();
    try {
        const payload = {
            tickets: formData.tickets.map(({ id: _, ...rest }) => ({
                ...rest,
                price: rest.type === 'FREE' ? 0 : rest.price,
                totalQuantity: Math.max(1, rest.totalQuantity || 1),
                salesStart: rest.salesStart ? new Date(rest.salesStart).toISOString() : undefined,
                salesEnd: rest.salesEnd ? new Date(rest.salesEnd).toISOString() : undefined,
                earlyBirdExpiry: rest.earlyBirdExpiry ? new Date(rest.earlyBirdExpiry).toISOString() : undefined,
            }))
        };
        await api.post(`/events/${eventId}/tickets`, payload);
        setCurrentStep(7);
        window.scrollTo({ top: 0, behavior: "smooth" });
        Swal.fire({ title: 'Step 6 Complete', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (_error) {
        Swal.fire("Error", translateError(_error), "error");
    } finally {
        setIsFinalizing(false);
    }
  };

  const saveSessions = async () => {
    const eventId = formData.eventId;
    if (!eventId) return;

    const validSessions = formData.sessions.filter(s => s.title.trim() !== "");
    if (formData.basicInfo.agendaEnabled && validSessions.length === 0) {
        Swal.fire("Validation Error", "At least one session is required when Agenda is enabled.", "error");
        return;
    }

    setIsFinalizing(true);
    Swal.showLoading();
    try {
        const payload = {
            sessions: validSessions.map(({ id: _, ...rest }) => ({
                ...rest,
                startTime: rest.startTime ? new Date(rest.startTime).toISOString() : undefined,
                endTime: rest.endTime ? new Date(rest.endTime).toISOString() : undefined,
                location: rest.location || (formData.basicInfo.type === 'ONLINE' ? 'Virtual' : (formData.basicInfo.location || 'Virtual')),
            }))
        };
        if (payload.sessions.length > 0) {
            await api.post(`/events/${eventId}/sessions`, payload);
        }
        await Swal.fire({ title: "Event Fully Launched!", icon: "success", confirmButtonColor: "#295FA7" });
        localStorage.removeItem(STORAGE_KEY);
        router.push(`/organizer/dashboard/events/${eventId}`);
    } catch (_error) {
        Swal.fire("Error", translateError(_error), "error");
    } finally {
        setIsFinalizing(false);
    }
  };

  const handleFinalize = async () => {
    const isOrganizer = user?.role?.includes('organizer');

    if (!user) {
        // Save draft and set flag to resume at Step 5 in THIS page
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        localStorage.setItem("gobokin_host_event_resume_step_5", "true");
        localStorage.setItem("returnUrl", "/host-event");
        router.push("/auth/register");
        return;
    }

    setIsFinalizing(true);
    Swal.showLoading();

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: Record<string, any> = {
            title: formData.basicInfo.title,
            description: formData.basicInfo.description,
            isPublic: formData.basicInfo.isPublic,
            type: formData.basicInfo.type,
            startDate: formData.basicInfo.startDate ? new Date(formData.basicInfo.startDate).toISOString() : undefined,
            endDate: formData.basicInfo.endDate ? new Date(formData.basicInfo.endDate).toISOString() : undefined,
            location: formData.basicInfo.type === 'ONLINE' ? 'Virtual' : (formData.basicInfo.location || 'Virtual'),
            virtualLink: formData.basicInfo.virtualLink || undefined,
            capacity: formData.basicInfo.capacity,
            category: formData.basicInfo.category,
            tags: (formData.basicInfo.tags || "").split(',').map(tag => tag.trim()).filter(tag => tag !== ""),
            agendaEnabled: formData.basicInfo.agendaEnabled,
            registrationMode: formData.registration.mode,
            // Default registration fields as expected by the dashboard
            registrationFields: [
                { name: "full-name", label: "Full Name", type: "text", required: true, isPerAttendee: true },
                { name: "email", label: "Email Address", type: "text", required: true, isPerAttendee: true },
                { name: "country", label: "Country", type: "select", source: "COUNTRIES", required: true, isPerAttendee: true },
                { name: "state", label: "State", type: "select", source: "STATES", dependsOn: "country", required: true, isPerAttendee: true },
                { name: "lga", label: "LGA", type: "select", source: "LGAS", dependsOn: "state", required: true, isPerAttendee: true },
            ],
            speakers: formData.speakers.map(s => ({
                name: s.name,
                title: s.title,
                bio: s.bio,
                imageUrl: s.imageUrl
            }))
        };

        const response = await api.post("/events", payload);
        const eventId = response.data.data.id;

        // Update draft with eventId
        const updatedDraft = { ...formData, eventId };
        setFormData(updatedDraft);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDraft));
        localStorage.setItem("gobokin_event_creation_draft_auto_resume", "true");

        if (!isOrganizer) {
            localStorage.setItem("gobokin_is_first_event_flow", "true");
        }

        Swal.fire({
            title: 'Event Initialized!',
            text: 'Now let\'s add some visuals to your event.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });

        setCurrentStep(5);
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (_error) {
        console.error("Failed to finalized event creation:", _error);
      Swal.fire("Error", translateError(_error), "error");
    } finally {
        setIsFinalizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 pb-20 px-4 md:px-6">
      <div className="max-w-[1500px] mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 tracking-tight">Host an Event</h1>
            <p className="text-gray-500 text-lg">Define your vision in four simple steps.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsPreviewModalOpen(true);
                } else {
                  setShowPreview(!showPreview);
                }
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all text-sm"
            >
              <Eye size={18} />
              <span>{showPreview ? "Hide Preview" : "Show Preview"}</span>
            </button>
          </div>
        </div>

        <div id="event-creation-steps" className="flex items-center gap-4 mb-12 overflow-x-auto no-scrollbar pb-2">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => idx + 1 < currentStep && setCurrentStep(idx + 1)}
                className="flex items-center gap-3 shrink-0"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    currentStep === step.id
                      ? "bg-primary text-white"
                      : currentStep > step.id
                      ? "bg-primary/10 text-primary"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {currentStep > step.id ? <CheckCircle2 size={18} /> : step.id}
                </div>
                <span className={`text-sm font-medium whitespace-nowrap ${currentStep === step.id ? "text-gray-900" : "text-gray-400"}`}>
                  {step.title}
                </span>
              </button>
              {idx < steps.length - 1 && (
                <div className="w-8 h-px bg-gray-200 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div id="event-creation-form" className="flex-1 w-full max-w-4xl">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-8 md:p-10 lg:p-12">
                {currentStep === 1 && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Event Title</label>
                        <input
                          type="text"
                          placeholder="What is your event called?"
                          className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400 shadow-sm"
                          value={formData.basicInfo.title}
                          onChange={(e) => handleChange("basicInfo", "title", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Category</label>
                        <div className="relative">
                          <select
                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-sm font-medium appearance-none outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm"
                            value={formData.basicInfo.category}
                            onChange={(e) => handleChange("basicInfo", "category", e.target.value)}
                          >
                            <option value="">Select a category</option>
                            {categories.map((cat, idx) => (
                              <option key={idx} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Search Keywords</label>
                        <input
                          type="text"
                          placeholder="Add tags separated by commas (e.g. Music, Outdoor)"
                          className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-400 shadow-sm"
                          value={formData.basicInfo.tags}
                          onChange={(e) => handleChange("basicInfo", "tags", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Starts On</label>
                        <input
                          type="datetime-local"
                          className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                          value={formData.basicInfo.startDate}
                          onChange={(e) => handleChange("basicInfo", "startDate", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Ends On</label>
                        <input
                          type="datetime-local"
                          className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                          value={formData.basicInfo.endDate}
                          onChange={(e) => handleChange("basicInfo", "endDate", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="pt-8 border-t border-gray-100 space-y-8">
                      <div className="space-y-4">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Event Format</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {["PHYSICAL", "ONLINE", "HYBRID"].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => handleChange("basicInfo", "type", type)}
                              className={`py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider border-2 transition-all ${
                                formData.basicInfo.type === type
                                  ? "bg-gray-900 text-white border-gray-900 shadow-md shadow-gray-200"
                                  : "bg-white text-gray-500 border-gray-100 hover:border-gray-200"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      {formData.basicInfo.type !== "ONLINE" && (
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700 ml-1">Venue Location</label>
                          <input
                            type="text"
                            placeholder="Street address, City, State"
                            className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                            value={formData.basicInfo.location}
                            onChange={(e) => handleChange("basicInfo", "location", e.target.value)}
                          />
                        </div>
                      )}
                      <div className="space-y-2 max-w-xs">
                        <label className="text-sm font-semibold text-gray-700 ml-1">Attendee Capacity</label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm"
                          value={formData.basicInfo.capacity}
                          onChange={(e) => handleChange("basicInfo", "capacity", parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-50 pb-8">
                      <div>
                        <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">Speakers & Guests</h3>
                        <p className="text-gray-500 font-medium">Add people who will be speaking or performing.</p>
                      </div>
                      <button
                        onClick={addSpeaker}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black transition-all text-sm shadow-lg shadow-gray-200"
                      >
                        <Plus size={18} />
                        <span>Add Speaker</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {formData.speakers.map((speaker, idx) => (
                        <div key={idx} className="p-6 bg-white rounded-2xl border border-gray-200 space-y-5 relative group hover:border-primary/30 transition-all shadow-sm">
                          <button
                            onClick={() => removeSpeaker(idx)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                          <div className="space-y-3">
                            <input
                              type="text"
                              placeholder="Full Name"
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                              value={speaker.name}
                              onChange={(e) => updateSpeaker(idx, "name", e.target.value)}
                            />
                            <input
                              type="text"
                              placeholder="Position / Title"
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                              value={speaker.title}
                              onChange={(e) => updateSpeaker(idx, "title", e.target.value)}
                            />
                            <textarea
                              placeholder="Short bio about the speaker..."
                              rows={3}
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                              value={speaker.bio}
                              onChange={(e) => updateSpeaker(idx, "bio", e.target.value)}
                            />
                          </div>
                          <div className="px-3 py-2 bg-gray-50 rounded-lg">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest leading-relaxed">
                              Image upload is enabled after registration.
                            </p>
                          </div>
                        </div>
                      ))}
                      {formData.speakers.length === 0 && (
                        <div className="md:col-span-2 py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-400">
                          <Users size={40} strokeWidth={1.5} />
                          <p className="text-sm font-medium mt-4">No speakers added yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {currentStep === 3 && (
                  <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-gray-900">Agenda Mode</h4>
                          <p className="text-xs text-gray-500">Enable session schedule</p>
                        </div>
                        <button
                          onClick={() => handleChange("basicInfo", "agendaEnabled", !formData.basicInfo.agendaEnabled)}
                          className={`w-12 h-7 rounded-full transition-all relative ${formData.basicInfo.agendaEnabled ? "bg-primary" : "bg-gray-200"}`}
                        >
                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.basicInfo.agendaEnabled ? "left-6" : "left-1"}`} />
                        </button>
                      </div>
                      <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-gray-900">Public Listing</h4>
                          <p className="text-xs text-gray-500">Visible to everyone</p>
                        </div>
                        <button
                          onClick={() => handleChange("basicInfo", "isPublic", !formData.basicInfo.isPublic)}
                          className={`w-12 h-7 rounded-full transition-all relative ${formData.basicInfo.isPublic ? "bg-primary" : "bg-gray-200"}`}
                        >
                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.basicInfo.isPublic ? "left-6" : "left-1"}`} />
                        </button>
                      </div>
                      <div className="p-8 bg-gray-50/50 rounded-2xl border border-gray-100 md:col-span-2 space-y-6">
                        <div className="space-y-1">
                          <h4 className="text-sm font-semibold text-gray-900">Registration Mode</h4>
                          <p className="text-xs text-gray-500">Choose how guest data is captured.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <button
                            onClick={() => handleChange("registration", "mode", "FULL_DETAILS")}
                            className={`p-6 rounded-2xl text-left border-2 transition-all ${
                              formData.registration.mode === "FULL_DETAILS"
                                ? "bg-white border-primary shadow-sm ring-4 ring-primary/5"
                                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                            }`}
                          >
                            <p className="text-xs font-bold uppercase tracking-wider mb-2">Full Details</p>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">Collect information for every single attendee in an order.</p>
                          </button>
                          <button
                            onClick={() => handleChange("registration", "mode", "BASIC_QUANTITY")}
                            className={`p-6 rounded-2xl text-left border-2 transition-all ${
                              formData.registration.mode === "BASIC_QUANTITY"
                                ? "bg-white border-primary shadow-sm ring-4 ring-primary/5"
                                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                            }`}
                          >
                            <p className="text-xs font-bold uppercase tracking-wider mb-2">Basic Quantity</p>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">Only collect the buyer&apos;s information, regardless of quantity.</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {currentStep === 4 && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">Event Description</h3>
                        <p className="text-gray-500 font-medium">Describe your event and provide any information attendees need to know.</p>
                      </div>
                      <textarea
                        rows={12}
                        placeholder="Share the story of your event. What can attendees expect? Mention key highlights, atmosphere, and why they shouldn't miss it."
                        className="w-full p-6 bg-white border border-gray-200 rounded-2xl text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none min-h-[300px] shadow-sm"
                        value={formData.basicInfo.description}
                        onChange={(e) => handleChange("basicInfo", "description", e.target.value)}
                      />
                    </div>
                    <div className="bg-primary/5 border border-primary/10 p-8 rounded-2xl flex items-start gap-5">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="text-primary" size={20} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 text-base">Almost there!</h4>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">
                          Your event outline is ready. Next, we&apos;ll upload your cover image and gallery photos to complete your event&apos;s visual presentation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 7 && (
                  <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-50 pb-8">
                       <div>
                          <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">Event Timeline</h3>
                          <p className="text-gray-500 font-medium">Add sessions, keynotes, or breaks to your event.</p>
                       </div>
                       <button
                         onClick={addSession}
                         className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black transition-all text-sm shadow-lg shadow-gray-200"
                       >
                         <Plus size={18} />
                         <span>Add Session</span>
                       </button>
                    </div>

                    <div className="space-y-8">
                      {formData.sessions.map((session, index) => (
                        <div key={session.id} className="p-8 bg-white rounded-3xl border border-gray-200 space-y-6 relative shadow-sm hover:border-primary/20 transition-all">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-gray-50 text-primary flex items-center justify-center border border-gray-100 font-bold">
                                    {index + 1}
                                 </div>
                                 <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">{session.title || 'Draft Session'}</h4>
                              </div>
                              {formData.sessions.length > 1 && (
                                 <button onClick={() => removeSession(session.id!)} className="text-gray-400 hover:text-rose-500 transition-colors">
                                    <Trash2 size={20} />
                                 </button>
                              )}
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2 md:col-span-2">
                                 <label className="text-xs font-semibold text-gray-700 ml-1">Session Title</label>
                                 <input
                                    type="text"
                                    placeholder="e.g., Opening Keynote"
                                    className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary outline-none transition-all"
                                    value={session.title}
                                    onChange={(e) => updateSession(session.id!, "title", e.target.value)}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-xs font-semibold text-gray-700 ml-1">Starts At</label>
                                 <input
                                    type="datetime-local"
                                    className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary outline-none"
                                    value={session.startTime}
                                    onChange={(e) => updateSession(session.id!, "startTime", e.target.value)}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-xs font-semibold text-gray-700 ml-1">Ends At</label>
                                 <input
                                    type="datetime-local"
                                    className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary outline-none"
                                    value={session.endTime}
                                    onChange={(e) => updateSession(session.id!, "endTime", e.target.value)}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-xs font-semibold text-gray-700 ml-1">Room / Stage</label>
                                 <input
                                    type="text"
                                    placeholder="Room A"
                                    className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary outline-none"
                                    value={session.room}
                                    onChange={(e) => updateSession(session.id!, "room", e.target.value)}
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-xs font-semibold text-gray-700 ml-1">Session Type</label>
                                 <input
                                    type="text"
                                    placeholder="Keynote, Workshop"
                                    className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary outline-none"
                                    value={session.sessionType}
                                    onChange={(e) => updateSession(session.id!, "sessionType", e.target.value)}
                                 />
                              </div>

                              <div className="space-y-3 md:col-span-2">
                                 <label className="text-xs font-semibold text-gray-700 ml-1">Assign Speakers</label>
                                 <div className="flex flex-wrap gap-2.5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    {formData.speakers.length === 0 ? (
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">No speakers added in Step 2</p>
                                    ) : (
                                      formData.speakers.map((speaker, sIdx) => {
                                        const isSelected = session.speakerIds?.includes(speaker.id || '') || session.speakerNames?.includes(speaker.name);
                                        return (
                                          <button
                                            key={sIdx}
                                            onClick={() => {
                                              const currentIds = session.speakerIds || [];
                                              const currentNames = session.speakerNames || [];
                                              let newIds, newNames;
                                              if (isSelected) {
                                                newIds = currentIds.filter(id => id !== speaker.id);
                                                newNames = currentNames.filter(name => name !== speaker.name);
                                              } else {
                                                newIds = speaker.id ? [...currentIds, speaker.id] : currentIds;
                                                newNames = [...currentNames, speaker.name];
                                              }
                                              updateSession(session.id!, "speakerIds", newIds);
                                              updateSession(session.id!, "speakerNames", newNames);
                                            }}
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                                              isSelected ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-gray-400 border-gray-200 hover:border-primary/30'
                                            }`}
                                          >
                                            {speaker.name}
                                            {isSelected && <CheckCircle2 size={10} />}
                                          </button>
                                        );
                                      })
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-50 pb-8">
                       <div>
                          <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">Ticket Vault</h3>
                          <p className="text-gray-500 font-medium">Configure access and monetization for your event.</p>
                       </div>
                       <button
                         onClick={addTicket}
                         className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-black transition-all text-sm shadow-lg shadow-gray-200"
                       >
                         <Plus size={18} />
                         <span>Create Tier</span>
                       </button>
                    </div>

                    <div className="space-y-8">
                      {formData.tickets.map((ticket, index) => (
                        <div key={ticket.id} className="p-8 bg-white rounded-3xl border border-gray-200 space-y-8 relative shadow-sm hover:border-primary/20 transition-all">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 text-primary flex items-center justify-center border border-gray-100">
                                   <Ticket size={20} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Tier #{index+1}</h4>
                             </div>
                             {formData.tickets.length > 1 && (
                                <button onClick={() => removeTicket(ticket.id!)} className="text-gray-400 hover:text-rose-500 transition-colors">
                                   <Trash2 size={20} />
                                </button>
                             )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                               <label className="text-xs font-semibold text-gray-700 ml-1">Public Name</label>
                               <input
                                  type="text"
                                  placeholder="e.g., General Admission"
                                  className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary outline-none transition-all"
                                  value={ticket.name}
                                  onChange={(e) => updateTicket(ticket.id!, "name", e.target.value)}
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-semibold text-gray-700 ml-1">Pricing Model</label>
                               <select
                                  className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                  value={ticket.type}
                                  onChange={(e) => updateTicket(ticket.id!, "type", e.target.value as TicketType)}
                               >
                                  <option value="FREE">Complimentary</option>
                                  <option value="PAID">Premium Access</option>
                               </select>
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-semibold text-gray-700 ml-1">Unit Price</label>
                               <div className="relative">
                                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₦</span>
                                   <input
                                      type="number"
                                      disabled={ticket.type === "FREE"}
                                      className="w-full pl-8 pr-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary disabled:bg-gray-50 outline-none"
                                      value={ticket.price}
                                      onChange={(e) => updateTicket(ticket.id!, "price", parseFloat(e.target.value))}
                                   />
                               </div>
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-semibold text-gray-700 ml-1">Inventory</label>
                               <input
                                  type="number"
                                  className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary outline-none"
                                  value={ticket.totalQuantity}
                                  onChange={(e) => updateTicket(ticket.id!, "totalQuantity", parseInt(e.target.value))}
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-xs font-semibold text-gray-700 ml-1">Max Per Order</label>
                               <input
                                  type="number"
                                  className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary outline-none"
                                  value={ticket.maxPerOrder}
                                  onChange={(e) => updateTicket(ticket.id!, "maxPerOrder", parseInt(e.target.value))}
                               />
                            </div>
                          </div>

                          <div className="pt-6 border-t border-gray-50 space-y-6">
                              <div className="flex items-center justify-between">
                                  <h5 className="text-[10px] font-black text-primary uppercase tracking-widest">Early Bird (Optional)</h5>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">Price</label>
                                      <input type="number" disabled={ticket.type === "FREE"} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-primary outline-none" value={ticket.earlyBirdPrice} onChange={(e) => updateTicket(ticket.id!, "earlyBirdPrice", parseFloat(e.target.value))} />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">Units</label>
                                      <input type="number" disabled={ticket.type === "FREE"} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-primary outline-none" value={ticket.earlyBirdLimit} onChange={(e) => updateTicket(ticket.id!, "earlyBirdLimit", parseInt(e.target.value))} />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-gray-400 uppercase">Expiry</label>
                                      <input type="datetime-local" disabled={ticket.type === "FREE"} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-xs font-medium focus:border-primary outline-none" value={ticket.earlyBirdExpiry} onChange={(e) => updateTicket(ticket.id!, "earlyBirdExpiry", e.target.value)} />
                                  </div>
                              </div>
                          </div>

                          <div className="pt-6 border-t border-gray-50 space-y-4">
                              <div className="flex items-center justify-between">
                                  <h5 className="text-[10px] font-black text-primary uppercase tracking-widest">Quantity Discounts</h5>
                                  <button onClick={() => addQuantityDiscount(ticket.id!)} className="text-[10px] font-bold text-primary hover:underline">+ Add Rule</button>
                              </div>
                              {ticket.quantityDiscounts?.map((discount, dIdx) => (
                                  <div key={dIdx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                                      <div className="flex-1 grid grid-cols-2 gap-4">
                                          <input type="number" placeholder="Min Qty" className="px-3 py-2 rounded-lg border border-gray-200 text-xs outline-none" value={discount.minQuantity} onChange={(e) => updateQuantityDiscount(ticket.id!, dIdx, "minQuantity", parseInt(e.target.value))} />
                                          <input type="number" placeholder="Discount Price" className="px-3 py-2 rounded-lg border border-gray-200 text-xs outline-none" value={discount.price} onChange={(e) => updateQuantityDiscount(ticket.id!, dIdx, "price", parseFloat(e.target.value))} />
                                      </div>
                                      <button onClick={() => removeQuantityDiscount(ticket.id!, dIdx)} className="text-gray-400 hover:text-rose-500"><Trash2 size={14} /></button>
                                  </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                    <div className="space-y-10 animate-in fade-in duration-500">
                        <div className="space-y-4 border-b border-gray-50 pb-8">
                            <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">Event Cover Image</h3>
                            <p className="text-gray-500 font-medium">Upload a cover image that represents your event and appears prominently on the event page.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div
                                className={`bg-gray-50 rounded-[2rem] p-8 border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center space-y-6 group/upload shadow-sm h-full relative overflow-hidden min-h-[300px]
                                  ${isUploading ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-white hover:border-primary/30 cursor-pointer'}
                                `}
                             >
                                <input
                                  type="file"
                                  className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                  onChange={handleBannerUpload}
                                  accept="image/*"
                                  disabled={isUploading}
                                />

                                {formData.mediaInfo.bannerUrl && !isUploading ? (
                                   <div className="relative w-full h-full rounded-[1.5rem] overflow-hidden shadow-2xl transition-transform duration-500">
                                      <Image src={formData.mediaInfo.bannerUrl} alt="Banner" fill unoptimized={true} className="object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                          <div className="bg-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900 flex items-center gap-3">
                                              <Upload size={14} />
                                              Update Banner
                                          </div>
                                      </div>
                                   </div>
                                ) : isUploading ? (
                                   <div className="flex flex-col items-center gap-4 animate-pulse w-full px-6">
                                       <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary">
                                            <UploadCloud size={32} className="animate-bounce" />
                                       </div>
                                       <div className="w-full space-y-2">
                                           <div className="flex justify-between text-[10px] font-black text-primary uppercase tracking-widest">
                                               <span>Uploading...</span>
                                               <span>{uploadProgress}%</span>
                                           </div>
                                           <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
                                               <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                                           </div>
                                       </div>
                                   </div>
                                ) : (
                                   <>
                                      <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center text-gray-300 group-hover/upload:text-primary transition-all duration-500">
                                        <Plus size={32} />
                                      </div>
                                      <div className="text-center space-y-1">
                                        <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">Event Banner</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Click to browse</p>
                                      </div>
                                   </>
                                )}
                             </div>

                             <div className="space-y-6">
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Banner Image URL</label>
                                        <p className="text-[10px] text-gray-400 font-medium ml-1">Paste a direct link to an image to use as your event banner.</p>
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="https://..."
                                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                                      value={formData.mediaInfo.bannerUrl}
                                      onChange={(e) => setFormData(prev => ({ ...prev, mediaInfo: { ...prev.mediaInfo, bannerUrl: e.target.value } }))}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Additional Media Gallery</label>
                                        <p className="text-[10px] text-gray-400 font-medium ml-1">Add photos that help attendees learn more about your event.</p>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {formData.mediaInfo.mediaUrls.map((url, idx) => (
                                            <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 group">
                                                <Image src={url} alt="Media" fill unoptimized={true} className="object-cover" />
                                                <button
                                                    onClick={() => removeMediaUrl(idx)}
                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 hover:border-primary hover:text-primary cursor-pointer transition-all">
                                            <Plus size={20} />
                                            <span className="text-[8px] font-black uppercase tracking-widest mt-1">Add</span>
                                            <input type="file" multiple className="hidden" onChange={handleMediaUrlUpload} accept="image/*" />
                                        </label>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                )}
              </div>
            </div>

            <div className="mt-12 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={currentStep === 1}
                className={`flex items-center gap-2 px-6 py-4 rounded-xl border border-gray-200 text-gray-600 font-semibold transition-all hover:bg-gray-50 ${
                  currentStep === 1 ? "opacity-0 invisible" : ""
                }`}
              >
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>
              <button
                onClick={handleNext}
                disabled={isFinalizing || isUploading}
                className={`flex items-center gap-3 bg-primary text-white font-semibold px-10 py-4 rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 ${isFinalizing || isUploading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <span>
                    {currentStep === 4 ? (user ? "Create Event & Continue" : "Register to Finalize Event") :
                     currentStep === 7 ? "Complete Setup" :
                     "Next Step"}
                </span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {showPreview && (
            <div id="event-creation-preview" className="hidden lg:block w-[400px] xl:w-[480px] shrink-0 animate-in fade-in slide-in-from-right-12 duration-1000 ease-out">
              <LivePreview
                basicInfo={formData.basicInfo}
                mediaInfo={formData.mediaInfo}
                speakers={formData.speakers}
                tickets={formData.tickets}
                sessions={formData.sessions}
                agendaEnabled={formData.basicInfo.agendaEnabled}
              />
            </div>
          )}
        </div>
      </div>

      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden flex flex-col bg-white animate-in slide-in-from-bottom duration-500">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-30">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Event Preview</h3>
            <button
              onClick={() => setIsPreviewModalOpen(false)}
              className="p-2 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900"
            >
              <XCircle size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <LivePreview
              basicInfo={formData.basicInfo}
              mediaInfo={formData.mediaInfo}
              speakers={formData.speakers}
              tickets={formData.tickets}
              sessions={formData.sessions}
              agendaEnabled={formData.basicInfo.agendaEnabled}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HostEventPage;
