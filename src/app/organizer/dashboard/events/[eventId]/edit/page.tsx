"use client";
import React, { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  User,
  Ticket,
  Trash2,
  Plus,
  Info,
  Image as ImageIcon,
  ShieldCheck,
  Clock,
  Type,
  FileText,
  Eye,
  EyeOff,
  Zap,
  UploadCloud,
  Upload,
  XCircle,
  Settings,
  Percent,
  Coins,
  ChevronDown,
  Layers,
  MousePointer2
} from "lucide-react";
import api from "@/services/api";
import axios from "axios";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { AgendaItem, EventType, RegistrationMode, Speaker, TicketType } from "@/types";
import CustomLoader from "@/components/CustomLoader";

const steps = [
  { id: 1, title: "Event Details", icon: Info },
  { id: 2, title: "Ticketing", icon: Ticket },
  { id: 3, title: "Schedule", icon: Calendar },
];

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
    seoTitle: string;
    seoDescription: string;
  };
  speakers: Speaker[];
  agenda: AgendaItem[];
  sessions: {
    title: string;
    startTime: string;
  }[];
  tickets: {
    name: string;
    price: number;
    type: string;
  }[];
}

const LivePreview = ({ basicInfo, mediaInfo, speakers, agenda, sessions, tickets }: LivePreviewProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="sticky top-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 overflow-hidden h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar transition-all duration-500 hover:shadow-gray-300/50">
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-50 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Live Preview</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-primary bg-primary/5 px-2.5 py-1 rounded-full uppercase tracking-widest border border-primary/10">Attendee View</span>
        </div>
      </div>

      <div className="p-6 space-y-10">
        {/* Banner */}
        <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-inner bg-gray-50 group">
          {mediaInfo.bannerUrl ? (
            <Image src={mediaInfo.bannerUrl} alt="Preview" fill unoptimized={true} className="object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
              <ImageIcon size={40} strokeWidth={1.5} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Banner Placeholder</p>
            </div>
          )}
          <div className="absolute top-4 left-4">
             <div className="bg-white/95 backdrop-blur-sm px-3.5 py-2 rounded-2xl shadow-xl shadow-black/5 flex items-center gap-3 border border-white">
                <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center leading-none">
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

        {/* Info */}
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

        {/* Tabs */}
        <div className="space-y-6">
           <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-gray-50 rounded-2xl border border-gray-100 w-fit">
              {["overview", "agenda", "speakers", "schedule", "tickets"].map(tab => (
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
                        {basicInfo.description || "Enter a description to see it here..."}
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

              {activeTab === "agenda" && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  {agenda.length === 0 ? (
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center py-10">No agenda items added yet</p>
                  ) : (
                    agenda.map((item, i) => (
                        <div key={i} className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-lg bg-secondary text-white flex items-center justify-center font-black text-[10px] flex-shrink-0 shadow-lg shadow-secondary/20">
                            {i + 1}
                            </div>
                            {i !== agenda.length - 1 && <div className="flex-1 w-[1px] bg-gray-100 my-2"></div>}
                        </div>
                        <div className="space-y-1.5 min-w-0 pt-0.5">
                            <p className="text-[11px] font-black text-gray-900 truncate tracking-tight">{item.title || "Untitled Agenda"}</p>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                    <Clock size={10} className="text-secondary" />
                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">
                                    {item.startTime ? new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                    </p>
                                </div>
                                {item.speakerName && (
                                    <div className="flex items-center gap-1.5">
                                        <User size={10} className="text-secondary" />
                                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{item.speakerName}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        </div>
                    ))
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
                                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                                    {speaker.imageUrl ? (
                                        <Image src={speaker.imageUrl} alt={speaker.name} fill unoptimized={true} className="object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <User size={24} />
                                        </div>
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
                  {sessions.map((session, i) => (
                    <div key={i} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                          {i + 1}
                        </div>
                        {i !== sessions.length - 1 && <div className="flex-1 w-[1px] bg-gray-100 my-2"></div>}
                      </div>
                      <div className="space-y-1.5 min-w-0 pt-1">
                        <p className="text-[11px] font-black text-gray-900 truncate tracking-tight">{session.title || "Untitled Session"}</p>
                        <div className="flex items-center gap-2">
                            <Clock size={10} className="text-primary" />
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                            {session.startTime ? new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </p>
                        </div>
                      </div>
                    </div>
                  ))}
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
                            <p className="text-xl font-black text-gray-900 tracking-tight">₦{ticket.price.toLocaleString()}</p>
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

const EditEvent = () => {
  const router = useRouter();
  const { eventId } = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [subStep, setSubStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  // Form State
  const [basicInfo, setBasicInfo] = useState({
    title: "",
    description: "",
    slug: "",
    type: "PHYSICAL" as EventType,
    startDate: "",
    endDate: "",
    location: "",
    virtualLink: "",
    capacity: 0,
    category: "",
    tags: "",
    isPublic: true,
    isFeatured: false,
    status: "UPCOMING",
  });

  const [mediaInfo, setMediaInfo] = useState({
    bannerUrl: "",
    mediaUrls: [] as string[],
    seoTitle: "",
    seoDescription: "",
    socialImage: "",
  });

  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);

  const [sessions, setSessions] = useState<{
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location: string;
  }[]>([]);

  const [tickets, setTickets] = useState<{
    id: string;
    name: string;
    price: number;
    type: TicketType;
    totalQuantity: number;
    groupSize: number;
    description: string;
    earlyBirdPrice: number;
    earlyBirdLimit: number;
    earlyBirdExpiry: string;
    allocationType?: "GENERAL" | "RESERVED";
    maxPerOrder?: number;
    salesStart?: string;
    salesEnd?: string;
    isOffline?: boolean;
    quantityDiscounts?: { minQuantity: number; price: number }[];
  }[]>([]);

  const [registration, setRegistration] = useState({
    mode: "FULL_DETAILS" as RegistrationMode,
    isGroupingEnabled: false,
    enforceUniqueGroupNames: true,
    fields: [] as { name: string; label: string; type: string; required: boolean; isPerAttendee: boolean }[],
  });

  // Fetch Event Data
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const [eventRes, categoriesRes] = await Promise.all([
          api.get(`/events/${eventId}`),
          api.get("/events/utils/categories")
        ]);

        const event = eventRes.data.data;

        // Populate Categories
        const categoryData = categoriesRes.data.data || [];
        setCategories(categoryData.map((cat: string | { name: string }) => typeof cat === 'string' ? cat : cat.name));

        // Format dates for input[type="datetime-local"]
        const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toISOString().slice(0, 16) : "";

        setBasicInfo({
          title: event.title || "",
          description: event.description || "",
          slug: event.slug || "",
          type: event.type || "PHYSICAL",
          startDate: formatDate(event.startDate),
          endDate: formatDate(event.endDate),
          location: event.location || "",
          virtualLink: event.virtualLink || "",
          capacity: event.capacity || 0,
          category: event.category || "",
          tags: (event.tags || []).join(", "),
          isPublic: event.isPublic !== false,
          isFeatured: !!event.isFeatured,
          status: event.status || "UPCOMING",
        });

        setMediaInfo({
          bannerUrl: event.bannerUrl || "",
          mediaUrls: event.mediaUrls || [],
          seoTitle: event.seoTitle || "",
          seoDescription: event.seoDescription || "",
          socialImage: event.socialImage || "",
        });

        setSpeakers(event.speakers || []);
        setAgenda((event.agenda || []).map((a: AgendaItem) => ({ ...a, startTime: formatDate(a.startTime || ""), endTime: formatDate(a.endTime || "") })));

        setSessions((event.sessions || []).map((s: { id?: string; _id?: string; title: string; description: string; startTime: string; endTime: string; location: string }) => ({
          ...s,
          id: s.id || s._id || Math.random().toString(),
          startTime: formatDate(s.startTime),
          endTime: formatDate(s.endTime)
        })));

        setTickets((event.tickets || []).map((t: any) => ({
          ...t,
          id: t.id || t._id || Math.random().toString(),
          earlyBirdExpiry: formatDate(t.earlyBirdExpiry),
          salesStart: formatDate(t.salesStart || ""),
          salesEnd: formatDate(t.salesEnd || ""),
          allocationType: t.allocationType || "GENERAL",
          maxPerOrder: t.maxPerOrder || 10,
          isOffline: !!t.isOffline,
          quantityDiscounts: t.quantityDiscounts || []
        })));

        setRegistration({
          mode: event.registrationMode || "FULL_DETAILS",
          isGroupingEnabled: !!event.isGroupingEnabled,
          enforceUniqueGroupNames: !!event.enforceUniqueGroupNames,
          fields: event.registrationFields || [
            { name: "full-name", label: "Full Name", type: "text", required: true, isPerAttendee: true },
            { name: "email", label: "Email Address", type: "text", required: true, isPerAttendee: true },
          ],
        });

      } catch (error) {
        console.error("Failed to fetch event:", error);
        Swal.fire("Error", "Could not load event data.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  // Media Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMedia = async (file: File) => {
    try {
      const presignedResponse = await api.get(`/events/${eventId}/media/upload-url`, {
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
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const handleBannerUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileUrl = await uploadMedia(file);
      setMediaInfo(prev => ({ ...prev, bannerUrl: fileUrl }));
      Swal.toast.fire({ icon: 'success', title: 'Banner uploaded (pending save)!' });
    } catch (_error) {
      Swal.fire('Error', 'Failed to upload banner.', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [eventId, uploadMedia]);

  const handleMediaUrlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
          const url = await uploadMedia(files[i]);
          urls.push(url);
      }
      setMediaInfo(prev => ({ ...prev, mediaUrls: [...prev.mediaUrls, ...urls] }));
      Swal.toast.fire({ icon: 'success', title: 'Media added (pending save)!' });
    } catch (_error) {
      Swal.fire('Error', 'Some uploads failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const removeMediaUrl = async (idx: number) => {
      setMediaInfo(prev => ({ ...prev, mediaUrls: prev.mediaUrls.filter((_, i) => i !== idx) }));
  };

  // Handlers
  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "capacity") {
      const newCapacity = parseInt(value) || 0;
      setBasicInfo(prev => ({ ...prev, capacity: newCapacity }));

      // Adjust tickets if sum exceeds new capacity
      setTickets(prevTickets => {
        let currentSum = prevTickets.reduce((sum, t) => sum + (t.totalQuantity || 0), 0);
        if (currentSum <= newCapacity) return prevTickets;

        const adjustedTickets = [...prevTickets];
        for (let i = adjustedTickets.length - 1; i >= 0; i--) {
          const ticket = adjustedTickets[i];
          const excess = currentSum - newCapacity;
          const reduction = Math.min(ticket.totalQuantity || 0, excess);
          adjustedTickets[i] = { ...ticket, totalQuantity: (ticket.totalQuantity || 0) - reduction };
          currentSum -= reduction;
          if (currentSum <= newCapacity) break;
        }
        return adjustedTickets;
      });
    } else {
      setBasicInfo(prev => ({ ...prev, [name]: value }));
    }
  };

  const updateSpeaker = (index: number, field: keyof Speaker, value: string) => {
    const newSpeakers = [...speakers];
    newSpeakers[index] = { ...newSpeakers[index], [field]: value };
    setSpeakers(newSpeakers);
  };

  const handleSpeakerImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      Swal.showLoading();
      const fileUrl = await uploadMedia(file);
      updateSpeaker(index, 'imageUrl', fileUrl);
      Swal.close();
    } catch (error) {
      Swal.fire('Error', 'Upload failed', 'error');
    }
  };

  const updateAgendaItem = (index: number, field: keyof AgendaItem, value: string) => {
    const newAgenda = [...agenda];
    newAgenda[index] = { ...newAgenda[index], [field]: value };
    setAgenda(newAgenda);
  };

  const updateSession = (sessionId: string, field: string, value: string) => {
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, [field]: value } : s));
  };

  const updateTicket = (ticketId: string, field: string, value: any) => {
    setTickets(tickets.map(t => {
        if (t.id === ticketId) {
            let newValue = value;
            if (field === "totalQuantity") {
                const otherTicketsSum = tickets
                    .filter(ticket => ticket.id !== ticketId)
                    .reduce((sum, ticket) => sum + (ticket.totalQuantity || 0), 0);
                const maxAllowed = Math.max(0, basicInfo.capacity - otherTicketsSum);
                newValue = Math.min(parseInt(value) || 0, maxAllowed);
            }

            const updated = { ...t, [field]: newValue };
            if (field === 'type' && value === 'FREE') {
                return { ...updated, price: 0, earlyBirdPrice: 0, earlyBirdLimit: 0, earlyBirdExpiry: "" };
            }
            return updated;
        }
        return t;
    }));
  };

  const addQuantityDiscount = (ticketId: string) => {
    setTickets(tickets.map(t => {
      if (t.id === ticketId) {
        const discounts = t.quantityDiscounts || [];
        return {
          ...t,
          quantityDiscounts: [...discounts, { minQuantity: 2, price: 0 }]
        };
      }
      return t;
    }));
  };

  const updateQuantityDiscount = (ticketId: string, discountIndex: number, field: string, value: any) => {
    setTickets(tickets.map(t => {
      if (t.id === ticketId && t.quantityDiscounts) {
        const updatedDiscounts = [...t.quantityDiscounts];
        updatedDiscounts[discountIndex] = { ...updatedDiscounts[discountIndex], [field]: value };
        return { ...t, quantityDiscounts: updatedDiscounts };
      }
      return t;
    }));
  };

  const removeQuantityDiscount = (ticketId: string, discountIndex: number) => {
    setTickets(tickets.map(t => {
      if (t.id === ticketId && t.quantityDiscounts) {
        return {
          ...t,
          quantityDiscounts: t.quantityDiscounts.filter((_, i) => i !== discountIndex)
        };
      }
      return t;
    }));
  };

  const deleteTicket = async (ticketId: string) => {
    // If it's a new ticket (not in DB yet), just filter it out
    if (!ticketId || ticketId.includes('.')) {
      setTickets(tickets.filter(t => t.id !== ticketId));
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this ticket deletion!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        Swal.showLoading();
        await api.delete(`/events/${eventId}/tickets/${ticketId}`);
        setTickets(tickets.filter(t => t.id !== ticketId));
        Swal.fire("Deleted!", "Your ticket has been deleted.", "success");
      } catch (error) {
        Swal.fire("Error", translateError(error), "error");
      }
    }
  };

  const handleUpdateTicket = async (ticket: any) => {
    // If it's a new ticket, we can't update it individually yet, it will be saved with saveAllChanges
    if (!ticket.id || ticket.id.includes('.')) {
      Swal.fire("Info", "This is a new ticket. Please use 'Finalize & Update' to save it.", "info");
      return;
    }

    if (!ticket.name || ticket.name.trim() === "") {
        Swal.fire("Validation Error", "Ticket must have a public name.", "error");
        return;
    }

    try {
      Swal.showLoading();
      const payload: any = {
        name: ticket.name,
        description: ticket.description,
        price: ticket.type === 'FREE' ? 0 : ticket.price,
        type: ticket.type,
        totalQuantity: ticket.totalQuantity,
        groupSize: ticket.groupSize,
        allocationType: ticket.allocationType,
        maxPerOrder: ticket.maxPerOrder,
        salesStart: ticket.salesStart ? new Date(ticket.salesStart).toISOString() : undefined,
        salesEnd: ticket.salesEnd ? new Date(ticket.salesEnd).toISOString() : undefined,
        isOffline: ticket.isOffline,
        quantityDiscounts: ticket.quantityDiscounts
      };

      if (ticket.type !== 'FREE' && (ticket.earlyBirdLimit || 0) > 0 && (ticket.earlyBirdPrice || 0) > 0) {
          payload.earlyBirdPrice = ticket.earlyBirdPrice;
          payload.earlyBirdLimit = ticket.earlyBirdLimit;
          payload.earlyBirdExpiry = ticket.earlyBirdExpiry ? new Date(ticket.earlyBirdExpiry).toISOString() : undefined;
      }
      await api.patch(`/events/${eventId}/tickets/${ticket.id}`, payload);
      Swal.fire("Updated!", "Ticket updated successfully.", "success");
    } catch (error) {
      Swal.fire("Error", translateError(error), "error");
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!sessionId || sessionId.includes('.')) {
      setSessions(sessions.filter(s => s.id !== sessionId));
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this session deletion!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        Swal.showLoading();
        await api.delete(`/events/${eventId}/sessions/${sessionId}`);
        setSessions(sessions.filter(s => s.id !== sessionId));
        Swal.fire("Deleted!", "Your session has been deleted.", "success");
      } catch (error) {
        Swal.fire("Error", translateError(error), "error");
      }
    }
  };

  const handleUpdateSession = async (session: any) => {
    if (!session.id || session.id.includes('.')) {
      Swal.fire("Info", "This is a new session. Please use 'Finalize & Update' to save it.", "info");
      return;
    }

    try {
      Swal.showLoading();
      const payload = {
        title: session.title,
        startTime: session.startTime ? new Date(session.startTime).toISOString() : undefined,
        endTime: session.endTime ? new Date(session.endTime).toISOString() : undefined,
        location: session.location,
      };
      await api.patch(`/events/${eventId}/sessions/${session.id}`, payload);
      Swal.fire("Updated!", "Session updated successfully.", "success");
    } catch (error) {
      Swal.fire("Error", translateError(error), "error");
    }
  };

  // Consolidate Save Handler
  const saveAllChanges = async () => {
    // Validate Ticket Names
    const emptyTicket = tickets.find(t => !t.name || t.name.trim() === "");
    if (emptyTicket) {
        Swal.fire("Validation Error", "All ticket tiers must have a public name.", "error");
        return;
    }

    setSaving(true);
    try {
      Swal.showLoading();

      // 1. Save Event Base Details
      const basePayload = {
        title: basicInfo.title,
        description: basicInfo.description,
        slug: basicInfo.slug,
        type: basicInfo.type,
        startDate: basicInfo.startDate ? new Date(basicInfo.startDate).toISOString() : undefined,
        endDate: basicInfo.endDate ? new Date(basicInfo.endDate).toISOString() : undefined,
        location: basicInfo.location,
        virtualLink: basicInfo.virtualLink,
        capacity: basicInfo.capacity,
        category: basicInfo.category,
        tags: basicInfo.tags.split(',').map(t => t.trim()).filter(t => t),
        speakers: speakers.map(s => ({ name: s.name, title: s.title, bio: s.bio, imageUrl: s.imageUrl })),
        agenda: agenda.map(a => ({
          title: a.title,
          description: a.description,
          startTime: a.startTime ? new Date(a.startTime).toISOString() : undefined,
          endTime: a.endTime ? new Date(a.endTime).toISOString() : undefined,
          speakerName: a.speakerName
        })),
        registrationMode: registration.mode,
        isGroupingEnabled: registration.isGroupingEnabled,
        enforceUniqueGroupNames: registration.enforceUniqueGroupNames,
        registrationFields: registration.fields,
        bannerUrl: mediaInfo.bannerUrl,
        mediaUrls: mediaInfo.mediaUrls,
      };

      // Fix: Remove restricted fields
      const { isFeatured: _isFeatured, status: _status, ...patchPayload } = basePayload as Record<string, unknown>;
      await api.patch(`/events/${eventId}`, patchPayload);

      // 2. Save Tickets (Handle both new and existing)
      const existingTickets = tickets.filter(t => t.id && !t.id.includes('.'));
      const newTickets = tickets.filter(t => !t.id || t.id.includes('.'));

      for (const ticket of existingTickets) {
          const payload: any = {
              name: ticket.name,
              description: ticket.description,
              price: ticket.type === 'FREE' ? 0 : ticket.price,
              type: ticket.type,
              totalQuantity: Math.max(1, ticket.totalQuantity || 1),
              groupSize: ticket.groupSize,
              allocationType: ticket.allocationType,
              maxPerOrder: ticket.maxPerOrder,
              salesStart: ticket.salesStart ? new Date(ticket.salesStart).toISOString() : undefined,
              salesEnd: ticket.salesEnd ? new Date(ticket.salesEnd).toISOString() : undefined,
              isOffline: ticket.isOffline,
              quantityDiscounts: ticket.quantityDiscounts
          };

          if (ticket.type !== 'FREE' && (ticket.earlyBirdLimit || 0) > 0 && (ticket.earlyBirdPrice || 0) > 0) {
              payload.earlyBirdPrice = ticket.earlyBirdPrice;
              payload.earlyBirdLimit = ticket.earlyBirdLimit;
              payload.earlyBirdExpiry = ticket.earlyBirdExpiry ? new Date(ticket.earlyBirdExpiry).toISOString() : undefined;
          }
          await api.patch(`/events/${eventId}/tickets/${ticket.id}`, payload);
      }

      if (newTickets.length > 0) {
          const ticketPayload = {
              tickets: newTickets.map(t => {
                  const item: any = {
                      name: t.name,
                      description: t.description,
                      price: t.type === 'FREE' ? 0 : t.price,
                      type: t.type,
                      totalQuantity: Math.max(1, t.totalQuantity || 1),
                      groupSize: t.groupSize,
                      allocationType: t.allocationType,
                      maxPerOrder: t.maxPerOrder,
                      salesStart: t.salesStart ? new Date(t.salesStart).toISOString() : undefined,
                      salesEnd: t.salesEnd ? new Date(t.salesEnd).toISOString() : undefined,
                      isOffline: t.isOffline,
                      quantityDiscounts: t.quantityDiscounts
                  };

                  if (t.type !== 'FREE' && (t.earlyBirdLimit || 0) > 0 && (t.earlyBirdPrice || 0) > 0) {
                      item.earlyBirdPrice = t.earlyBirdPrice;
                      item.earlyBirdLimit = t.earlyBirdLimit;
                      item.earlyBirdExpiry = t.earlyBirdExpiry ? new Date(t.earlyBirdExpiry).toISOString() : undefined;
                  }

                  return item;
              })
          };
          await api.post(`/events/${eventId}/tickets`, ticketPayload);
      }

      // 3. Save Sessions (Handle both new and existing)
      const existingSessions = sessions.filter(s => s.id && !s.id.includes('.'));
      const newSessions = sessions.filter(s => !s.id || s.id.includes('.'));

      for (const session of existingSessions) {
          const payload = {
              title: session.title,
              startTime: session.startTime ? new Date(session.startTime).toISOString() : undefined,
              endTime: session.endTime ? new Date(session.endTime).toISOString() : undefined,
              location: session.location,
          };
          await api.patch(`/events/${eventId}/sessions/${session.id}`, payload);
      }

      if (newSessions.length > 0) {
          const sessionPayload = {
              sessions: newSessions.map(s => ({
                  title: s.title,
                  startTime: s.startTime ? new Date(s.startTime).toISOString() : undefined,
                  endTime: s.endTime ? new Date(s.endTime).toISOString() : undefined,
                  location: s.location,
              }))
          };
          await api.post(`/events/${eventId}/sessions`, sessionPayload);
      }

      Swal.fire("Success", "Event updated successfully", "success");
      router.push(`/organizer/dashboard/events/${eventId}`);
    } catch (error) {
      Swal.fire("Error", translateError(error), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><CustomLoader /></div>;

  return (
    <div className="max-w-[1600px] mx-auto py-6 lg:py-10 px-4">
      {/* Header Area */}
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-all mb-4 group font-black text-[10px] uppercase tracking-[0.2em]">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Details
          </button>
          <h1 className="text-5xl font-black text-primary tracking-tight leading-none mb-3">Edit Event</h1>
          <p className="text-gray-500 font-medium text-lg">Update your event configuration and schedule.</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) setIsPreviewModalOpen(true);
              else setShowPreview(!showPreview);
            }}
            className="flex items-center gap-2.5 bg-white text-gray-500 font-black px-6 py-4 rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 hover:text-primary transition-all text-[10px] uppercase tracking-[0.2em]"
          >
            <Eye size={16} />
            <span className="hidden sm:inline">{showPreview ? "Hide Preview" : "Show Preview"}</span>
            <span className="sm:hidden">Preview</span>
          </button>

          <div className="hidden xl:flex items-center gap-1.5 bg-gray-50 p-2 rounded-[2.5rem] border border-gray-100">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 relative group ${
                  currentStep === step.id
                  ? "bg-primary text-white shadow-xl shadow-primary/30 scale-110"
                  : "text-gray-300 hover:text-gray-400"
                }`}
              >
                <step.icon size={16} strokeWidth={currentStep === step.id ? 3 : 2} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start px-2">
        {/* Main Form Container */}
        <div className={`flex-1 w-full bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden`}>

          <div className="p-8 md:p-10 lg:p-12">
            {/* STEP 1: EVENT DETAILS */}
            {currentStep === 1 && (
              <div className="space-y-16">
                 {/* Sub-progress for Step 1 */}
                 <div className="flex items-center gap-4 mb-8">
                    {[1, 2, 3, 4, 5].map((s) => (
                       <button
                         key={s}
                         onClick={() => setSubStep(s)}
                         className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${s <= subStep ? 'bg-primary' : 'bg-gray-100'}`}
                       />
                    ))}
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap ml-2">
                       {subStep} of 5
                    </span>
                 </div>

                 {subStep === 1 && (
                    <div className="space-y-16 animate-in fade-in duration-500">
                       <div className="space-y-10 group/section">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center shadow-sm border border-gray-100">
                                <Type size={24} />
                             </div>
                             <div>
                                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Event Identity</h3>
                                  <p className="text-sm text-gray-400 font-medium">Core personality of your event.</p>
                             </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Title</label>
                                <input type="text" name="title" className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold outline-none" value={basicInfo.title} onChange={handleBasicChange} />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Category</label>
                                <select name="category" className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold outline-none appearance-none" value={basicInfo.category} onChange={handleBasicChange}>
                                   <option value="">Select a category</option>
                                   {categories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                                </select>
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Commences</label>
                                <input type="datetime-local" name="startDate" className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold outline-none" value={basicInfo.startDate} onChange={handleBasicChange} />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Concludes</label>
                                <input type="datetime-local" name="endDate" className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold outline-none" value={basicInfo.endDate} onChange={handleBasicChange} />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Location</label>
                                <input type="text" name="location" className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold outline-none" value={basicInfo.location} onChange={handleBasicChange} />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Attendee Capacity</label>
                                <input type="number" name="capacity" className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold outline-none" value={basicInfo.capacity} onChange={handleBasicChange} />
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {subStep === 2 && (
                    <div className="space-y-16 animate-in fade-in duration-500">
                       <div className="space-y-10 group/section">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-10">
                             <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center shadow-sm border border-gray-100">
                                   <Users size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Speakers & Agenda</h3>
                             </div>
                             <button onClick={() => setSpeakers([...speakers, { name: "", title: "", bio: "", imageUrl: "" }])} className="flex items-center gap-3 bg-gray-900 text-white font-black px-8 py-5 rounded-3xl text-[10px] uppercase tracking-[0.2em]">
                               <Plus size={18} /> Add Speaker
                             </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             {speakers.map((speaker, idx) => (
                                <div key={idx} className="p-8 bg-gray-50 rounded-[3rem] space-y-6 relative group/speaker">
                                   <button onClick={() => setSpeakers(speakers.filter((_, i) => i !== idx))} className="absolute top-6 right-6 text-gray-300 hover:text-secondary"><Trash2 size={16} /></button>
                                   <div className="flex items-center gap-6">
                                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-100 group/img">
                                         {speaker.imageUrl ? <Image src={speaker.imageUrl} alt="Speaker" fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><Users size={32} /></div>}
                                         <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                            <Upload size={20} className="text-white" /><input type="file" className="hidden" onChange={(e) => handleSpeakerImageUpload(idx, e)} />
                                         </label>
                                      </div>
                                      <input type="text" placeholder="Full Name" className="flex-1 p-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none" value={speaker.name} onChange={(e) => updateSpeaker(idx, 'name', e.target.value)} />
                                   </div>
                                </div>
                             ))}
                          </div>

                          <div className="pt-10 border-t border-gray-100">
                             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-10">
                                <div>
                                   <h3 className="text-2xl font-black text-gray-900 tracking-tight">Event Agenda</h3>
                                   <p className="text-sm text-gray-400 font-medium">Outline the flow of your event.</p>
                                </div>
                                <button onClick={() => setAgenda([...agenda, { title: "", description: "", startTime: "", endTime: "", speakerName: "" }])} className="flex items-center gap-3 bg-secondary text-white font-black px-8 py-5 rounded-3xl text-[10px] uppercase tracking-[0.2em]">
                                  <Plus size={18} /> Add Agenda Item
                                </button>
                             </div>
                             <div className="space-y-6">
                                {agenda.map((item, idx) => (
                                    <div key={idx} className="p-8 bg-gray-50 rounded-[3rem] border border-gray-100 hover:bg-white transition-all duration-500 hover:shadow-xl hover:shadow-gray-200/50 group/agenda">
                                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                          <div className="md:col-span-2 space-y-3">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title</label>
                                             <input
                                                type="text"
                                                placeholder="Opening Keynote"
                                                className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all"
                                                value={item.title}
                                                onChange={(e) => updateAgendaItem(idx, 'title', e.target.value)}
                                             />
                                          </div>
                                          <div className="space-y-3">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Speaker</label>
                                             <select
                                                className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all appearance-none"
                                                value={item.speakerName}
                                                onChange={(e) => updateAgendaItem(idx, 'speakerName', e.target.value)}
                                             >
                                                <option value="">No Speaker</option>
                                                {speakers.filter(s => s.name).map((s, i) => (
                                                   <option key={i} value={s.name}>{s.name}</option>
                                                ))}
                                             </select>
                                          </div>
                                          <div className="flex items-end justify-end">
                                             <button
                                                onClick={() => setAgenda(agenda.filter((_, i) => i !== idx))}
                                                className="w-14 h-14 bg-white text-gray-300 hover:text-secondary rounded-2xl flex items-center justify-center shadow-sm hover:shadow-xl transition-all border border-gray-100"
                                             >
                                                <Trash2 size={20} />
                                             </button>
                                          </div>
                                          <div className="space-y-3">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Time</label>
                                             <input
                                                type="datetime-local"
                                                className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all"
                                                value={item.startTime}
                                                min={basicInfo.startDate}
                                                max={basicInfo.endDate}
                                                onChange={(e) => updateAgendaItem(idx, 'startTime', e.target.value)}
                                             />
                                          </div>
                                          <div className="space-y-3">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">End Time</label>
                                             <input
                                                type="datetime-local"
                                                className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all"
                                                value={item.endTime}
                                                min={item.startTime || basicInfo.startDate}
                                                max={basicInfo.endDate}
                                                onChange={(e) => updateAgendaItem(idx, 'endTime', e.target.value)}
                                             />
                                          </div>
                                          <div className="md:col-span-2 space-y-3">
                                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                                             <textarea
                                                rows={1}
                                                placeholder="Short summary of the session..."
                                                className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all"
                                                value={item.description}
                                                onChange={(e) => updateAgendaItem(idx, 'description', e.target.value)}
                                             />
                                          </div>
                                       </div>
                                    </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {subStep === 3 && (
                    <div className="space-y-16 animate-in fade-in duration-500">
                       <div className="space-y-10 group/section">
                          <div className="flex items-center gap-5 border-b border-gray-100 pb-10">
                             <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center shadow-sm border border-gray-100">
                                <ShieldCheck size={24} />
                             </div>
                             <h3 className="text-2xl font-black text-gray-900 tracking-tight">Advanced Settings</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                             <div className="space-y-4 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Public Visibility</label>
                                <div className="flex items-center justify-between">
                                   <span className="text-sm font-bold text-gray-700">{basicInfo.isPublic ? 'Visible' : 'Hidden'}</span>
                                   <button onClick={() => setBasicInfo(prev => ({ ...prev, isPublic: !prev.isPublic }))} className={`w-14 h-8 rounded-full transition-all relative ${basicInfo.isPublic ? 'bg-primary' : 'bg-gray-300'}`}>
                                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${basicInfo.isPublic ? 'left-7' : 'left-1'}`} />
                                   </button>
                                </div>
                             </div>
                             <div className="space-y-4 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registration Mode</label>
                                <select className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-xs font-bold outline-none appearance-none" value={registration.mode} onChange={(e) => setRegistration(prev => ({ ...prev, mode: e.target.value as RegistrationMode }))}>
                                    <option value="FULL_DETAILS">Full Details</option>
                                    <option value="BASIC_QUANTITY">Basic Quantity</option>
                                </select>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {subStep === 4 && (
                    <div className="space-y-16 animate-in fade-in duration-500">
                       <div className="space-y-10 group/section">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 rounded-2xl bg-gray-50 text-secondary flex items-center justify-center shadow-sm border border-gray-100">
                                <FileText size={24} />
                             </div>
                             <h3 className="text-2xl font-black text-gray-900 tracking-tight">Detailed Narrative</h3>
                          </div>
                          <textarea rows={12} className="w-full p-8 bg-white border border-gray-300 rounded-[2.5rem] text-sm font-bold focus:border-primary transition-all outline-none" value={basicInfo.description} onChange={handleBasicChange} name="description" />
                       </div>
                    </div>
                 )}

                 {subStep === 5 && (
                    <div className="space-y-16 animate-in fade-in duration-500">
                       <div className="space-y-10 group/section">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center shadow-sm border border-gray-100">
                                <ImageIcon size={24} />
                             </div>
                             <h3 className="text-2xl font-black text-gray-900 tracking-tight">Visual Identity</h3>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                             <div className={`bg-gray-50 rounded-[3rem] p-8 border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center space-y-6 group/upload shadow-sm h-full relative overflow-hidden min-h-[300px] ${isUploading ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={handleBannerUpload} accept="image/*" disabled={isUploading} />
                                {mediaInfo.bannerUrl && !isUploading ? (
                                   <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl">
                                      <Image src={mediaInfo.bannerUrl} alt="Banner" fill className="object-cover" />
                                   </div>
                                ) : (
                                   <div className="text-center">
                                       <UploadCloud size={40} className="mx-auto mb-4 text-gray-300" />
                                       <p className="text-[10px] font-black uppercase tracking-widest">Update Banner Art</p>
                                   </div>
                                )}
                             </div>
                             <div className="space-y-8">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Gallery Assets</label>
                                <div className="flex flex-wrap gap-4">
                                    {mediaInfo.mediaUrls.map((url, idx) => (
                                        <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden group">
                                            {url && typeof url === 'string' && url.match(/\.(mp4|webm|ogg)$/) ? <video src={url} className="w-full h-full object-cover" /> : <Image src={url} alt="Media" fill className="object-cover" />}
                                            <button onClick={() => removeMediaUrl(idx)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                    <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-primary hover:text-primary cursor-pointer transition-all">
                                        <Plus size={24} /><input type="file" multiple className="hidden" onChange={handleMediaUrlUpload} accept="image/*,video/*" />
                                    </label>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
            )}

            {/* STEP 2: TICKETING */}
            {currentStep === 2 && (
              <div className="space-y-12 animate-in fade-in duration-500">
                 <div className="flex items-center justify-between px-4">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">Ticket Vault</h3>
                    <button onClick={() => {
                      const currentTotal = tickets.reduce((sum, t) => sum + (t.totalQuantity || 0), 0);
                      const remaining = Math.max(0, basicInfo.capacity - currentTotal);
                      setTickets([...tickets, {
                        id: Math.random().toString(),
                        name: "",
                        price: 0,
                        type: "PAID",
                        totalQuantity: remaining,
                        groupSize: 1,
                        description: "",
                        earlyBirdPrice: 0,
                        earlyBirdLimit: 0,
                        earlyBirdExpiry: "",
                        allocationType: "GENERAL",
                        maxPerOrder: 10,
                        salesStart: "",
                        salesEnd: "",
                        isOffline: false,
                        quantityDiscounts: []
                      }]);
                    }} className="flex items-center gap-3 bg-secondary text-white font-black px-8 py-5 rounded-3xl text-[10px] uppercase tracking-[0.2em]">
                      <Plus size={18} /> Create Tier
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {tickets.map((ticket, _index) => (
                        <div key={ticket.id} className="p-8 md:p-10 bg-gray-50/50 rounded-[3.5rem] border border-gray-100 space-y-10 relative group/ticket hover:bg-white hover:shadow-4xl hover:shadow-secondary/10 transition-all duration-700">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-5">
                                   <div className="w-14 h-14 rounded-2xl bg-white text-secondary flex items-center justify-center shadow-xl shadow-gray-200/50 border border-gray-100 group-hover/ticket:bg-secondary group-hover/ticket:text-white transition-all duration-500">
                                      <Ticket size={24} strokeWidth={2} />
                                   </div>
                                   <div>
                                       <h4 className="font-black text-gray-900 uppercase tracking-[0.3em] text-[10px]">Tier #{_index+1}</h4>
                                       <p className="text-sm font-black text-gray-400 mt-1">{ticket.name || 'Untitled Tier'}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {ticket.id.length >= 10 && (
                                        <button
                                            onClick={() => handleUpdateTicket(ticket)}
                                            className="text-[8px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg uppercase tracking-widest border border-primary/10 hover:bg-primary hover:text-white transition-all"
                                        >
                                            Update
                                        </button>
                                    )}
                                    <button
                                      onClick={() => deleteTicket(ticket.id)}
                                      className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-secondary bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <Type size={12} className="text-secondary" />
                                       Public Name
                                   </label>
                                   <input
                                      type="text"
                                      placeholder="e.g., VIP Early Bird"
                                      className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none transition-all shadow-sm"
                                      value={ticket.name}
                                      onChange={(e) => updateTicket(ticket.id, "name", e.target.value)}
                                   />
                                </div>

                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <FileText size={12} className="text-secondary" />
                                       Public Description
                                   </label>
                                   <textarea
                                      rows={2}
                                      placeholder="What's included in this tier? (e.g., Free drinks, Front row seating)"
                                      className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none transition-all shadow-sm resize-none"
                                      value={ticket.description || ""}
                                      onChange={(e) => updateTicket(ticket.id, "description", e.target.value)}
                                   />
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                   <div className="space-y-3">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                          <MousePointer2 size={12} className="text-secondary" />
                                          Pricing Model
                                      </label>
                                      <div className="relative">
                                          <select
                                             className="w-full pl-5 pr-10 py-5 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none appearance-none shadow-sm"
                                             value={ticket.type}
                                             onChange={(e) => updateTicket(ticket.id, "type", e.target.value as TicketType)}
                                          >
                                             <option value="FREE">Complimentary</option>
                                             <option value="PAID">Premium Access</option>
                                          </select>
                                          <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                      </div>
                                   </div>
                                   <div className="space-y-3">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                          <Coins size={12} className="text-secondary" />
                                          Unit Price
                                      </label>
                                      <div className="relative">
                                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary font-black text-xs">₦</span>
                                          <input
                                             type="number"
                                             disabled={ticket.type === "FREE"}
                                             className="w-full pl-10 pr-5 py-5 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 disabled:bg-gray-100 disabled:opacity-50 outline-none shadow-sm"
                                             value={ticket.price}
                                             onChange={(e) => updateTicket(ticket.id, "price", parseFloat(e.target.value))}
                                          />
                                      </div>
                                   </div>
                                   <div className="space-y-3">
                                      <label htmlFor={`totalQuantity-${ticket.id}`} className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                          <Layers size={12} className="text-secondary" />
                                          Total Inventory
                                      </label>
                                      <input
                                         id={`totalQuantity-${ticket.id}`}
                                         type="number"
                                         className="w-full px-5 py-5 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none shadow-sm"
                                         value={ticket.totalQuantity}
                                         onChange={(e) => updateTicket(ticket.id, "totalQuantity", parseInt(e.target.value))}
                                      />
                                   <p className="text-[9px] font-bold text-gray-400 mt-1 ml-1 uppercase">
                                       Max: {Math.max(0, basicInfo.capacity - tickets.filter(t => t.id !== ticket.id).reduce((sum, t) => sum + (t.totalQuantity || 0), 0))}
                                   </p>
                                   </div>
                                   <div className="space-y-3">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                          <Users size={12} className="text-secondary" />
                                          Min Purchase
                                      </label>
                                      <input
                                         type="number"
                                         className="w-full px-5 py-5 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none shadow-sm"
                                         value={ticket.groupSize}
                                         onChange={(e) => updateTicket(ticket.id, "groupSize", parseInt(e.target.value))}
                                      />
                                   </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 space-y-6">
                                   <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Early Bird Configuration (Optional)</h5>
                                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                       <div className="space-y-2">
                                           <label className="text-[9px] font-bold text-gray-400 uppercase">Discount Price</label>
                                           <div className="relative">
                                               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-[10px]">₦</span>
                                               <input
                                                   type="number"
                                                   disabled={ticket.type === "FREE"}
                                                   className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none disabled:bg-gray-100 disabled:opacity-50"
                                                   value={ticket.earlyBirdPrice}
                                                   onChange={(e) => updateTicket(ticket.id, "earlyBirdPrice", parseFloat(e.target.value))}
                                               />
                                           </div>
                                       </div>
                                       <div className="space-y-2">
                                           <label className="text-[9px] font-bold text-gray-400 uppercase">Total Limit</label>
                                           <input
                                               type="number"
                                               disabled={ticket.type === "FREE"}
                                               className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none disabled:bg-gray-100 disabled:opacity-50"
                                               value={ticket.earlyBirdLimit}
                                               onChange={(e) => updateTicket(ticket.id, "earlyBirdLimit", parseInt(e.target.value))}
                                           />
                                       </div>
                                       <div className="space-y-2">
                                           <label className="text-[9px] font-bold text-gray-400 uppercase">Expiry Date</label>
                                           <input
                                               type="datetime-local"
                                               disabled={ticket.type === "FREE"}
                                               className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-bold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none disabled:bg-gray-100 disabled:opacity-50"
                                               value={ticket.earlyBirdExpiry}
                                               onChange={(e) => updateTicket(ticket.id, "earlyBirdExpiry", e.target.value)}
                                           />
                                       </div>
                                   </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 space-y-6">
                                   <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                       <Settings size={12} />
                                       Advanced Sales Configuration
                                   </h5>
                                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                       <div className="space-y-2">
                                           <label className="text-[9px] font-bold text-gray-400 uppercase">Sales Start</label>
                                           <input
                                               type="datetime-local"
                                               className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-bold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none"
                                               value={ticket.salesStart}
                                               onChange={(e) => updateTicket(ticket.id, "salesStart", e.target.value)}
                                           />
                                       </div>
                                       <div className="space-y-2">
                                           <label className="text-[9px] font-bold text-gray-400 uppercase">Sales End</label>
                                           <input
                                               type="datetime-local"
                                               className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-bold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none"
                                               value={ticket.salesEnd}
                                               onChange={(e) => updateTicket(ticket.id, "salesEnd", e.target.value)}
                                           />
                                       </div>
                                       <div className="space-y-2">
                                           <label className="text-[9px] font-bold text-gray-400 uppercase">Allocation Type</label>
                                           <select
                                               className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none"
                                               value={ticket.allocationType}
                                               onChange={(e) => updateTicket(ticket.id, "allocationType", e.target.value as "GENERAL" | "RESERVED")}
                                           >
                                               <option value="GENERAL">General</option>
                                               <option value="RESERVED">Reserved</option>
                                           </select>
                                       </div>
                                       <div className="space-y-2">
                                           <label className="text-[9px] font-bold text-gray-400 uppercase">Max Per Order</label>
                                           <input
                                               type="number"
                                               className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none"
                                               value={ticket.maxPerOrder}
                                               onChange={(e) => updateTicket(ticket.id, "maxPerOrder", parseInt(e.target.value))}
                                           />
                                       </div>
                                       <div className="flex items-center gap-3 pt-6">
                                           <input
                                               type="checkbox"
                                               id={`isOffline-${ticket.id}`}
                                               className="w-4 h-4 rounded text-secondary focus:ring-secondary border-gray-300"
                                               checked={ticket.isOffline}
                                               onChange={(e) => updateTicket(ticket.id, "isOffline", e.target.checked)}
                                           />
                                           <label htmlFor={`isOffline-${ticket.id}`} className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                               Offline Ticket
                                           </label>
                                       </div>
                                   </div>
                                </div>

                                <div className="pt-6 border-t border-gray-100 space-y-6">
                                   <div className="flex items-center justify-between">
                                       <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                           <Percent size={12} />
                                           Quantity Discounts
                                       </h5>
                                       <button
                                           onClick={() => addQuantityDiscount(ticket.id)}
                                           className="text-[9px] font-black text-secondary uppercase tracking-widest hover:underline flex items-center gap-1"
                                       >
                                           <Plus size={10} /> Add Rule
                                       </button>
                                   </div>
                                   <div className="space-y-4">
                                       {ticket.quantityDiscounts?.map((discount, dIndex) => (
                                           <div key={dIndex} className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-100/50 rounded-2xl items-end">
                                               <div className="space-y-2">
                                                   <label className="text-[8px] font-bold text-gray-400 uppercase">Min Quantity</label>
                                                   <input
                                                       type="number"
                                                       className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                                                       value={discount.minQuantity}
                                                       onChange={(e) => updateQuantityDiscount(ticket.id, dIndex, "minQuantity", parseInt(e.target.value))}
                                                   />
                                               </div>
                                               <div className="space-y-2">
                                                   <label className="text-[8px] font-bold text-gray-400 uppercase">Discount Price</label>
                                                   <div className="relative">
                                                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary font-black text-[9px]">₦</span>
                                                       <input
                                                           type="number"
                                                           className="w-full pl-6 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                                                           value={discount.price}
                                                           onChange={(e) => updateQuantityDiscount(ticket.id, dIndex, "price", parseFloat(e.target.value))}
                                                       />
                                                   </div>
                                               </div>
                                               <div className="flex justify-end">
                                                   <button
                                                       onClick={() => removeQuantityDiscount(ticket.id, dIndex)}
                                                       className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                   >
                                                       <Trash2 size={14} />
                                                   </button>
                                               </div>
                                           </div>
                                       ))}
                                       {(!ticket.quantityDiscounts || ticket.quantityDiscounts.length === 0) && (
                                           <p className="text-[10px] text-gray-400 italic text-center py-2">No quantity discounts configured</p>
                                       )}
                                   </div>
                                </div>
                            </div>
                        </div>
                    ))}
                 </div>
              </div>
            )}

            {/* STEP 3: SCHEDULE */}
            {currentStep === 3 && (
              <div className="space-y-12 animate-in fade-in duration-500">
                 <div className="flex items-center justify-between px-4">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">Event Timeline</h3>
                    <button onClick={() => setSessions([...sessions, { id: Math.random().toString(), title: "", description: "", startTime: "", endTime: "", location: "" }])} className="flex items-center gap-3 bg-primary text-white font-black px-8 py-5 rounded-3xl text-[10px] uppercase tracking-[0.2em]">
                      <Plus size={18} /> Add Session
                    </button>
                 </div>
                 <div className="space-y-6">
                    {sessions.map((session, index) => (
                        <div key={session.id} className="p-8 bg-gray-50 rounded-[3rem] border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                            <div className="md:col-span-2 flex justify-between items-center mb-2">
                                <div className="flex items-center gap-4">
                                    <h4 className="font-black text-gray-900 uppercase tracking-[0.3em] text-[10px]">Session #{index+1}</h4>
                                    {session.id.length >= 10 && (
                                        <button
                                            onClick={() => handleUpdateSession(session)}
                                            className="text-[8px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg uppercase tracking-widest border border-primary/10 hover:bg-primary hover:text-white transition-all"
                                        >
                                            Update Session
                                        </button>
                                    )}
                                </div>
                                <button onClick={() => deleteSession(session.id)} className="text-gray-300 hover:text-secondary"><Trash2 size={18} /></button>
                            </div>
                            <input type="text" placeholder="Session Title" className="md:col-span-2 p-4 bg-white border border-gray-300 rounded-2xl text-sm font-bold outline-none" value={session.title} onChange={(e) => updateSession(session.id, "title", e.target.value)} />
                            <input type="datetime-local" className="p-4 bg-white border border-gray-300 rounded-2xl text-sm font-bold outline-none" value={session.startTime} min={basicInfo.startDate} max={basicInfo.endDate} onChange={(e) => updateSession(session.id, "startTime", e.target.value)} />
                            <input type="datetime-local" className="p-4 bg-white border border-gray-300 rounded-2xl text-sm font-bold outline-none" value={session.endTime} min={session.startTime || basicInfo.startDate} max={basicInfo.endDate} onChange={(e) => updateSession(session.id, "endTime", e.target.value)} />
                        </div>
                    ))}
                 </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="bg-white px-8 md:px-16 py-12 border-t border-gray-50 flex items-center justify-between">
             <button onClick={() => router.back()} className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-gray-900 transition-colors">Discard Changes</button>
             <div className="flex items-center gap-6">
                {currentStep === 1 && (
                    <button
                        onClick={() => {
                            if (subStep < 5) setSubStep(subStep + 1);
                            else setCurrentStep(2);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex items-center gap-4 bg-primary text-white font-black px-14 py-6 rounded-[2.5rem] shadow-3xl shadow-primary/30 uppercase tracking-[0.3em] text-[11px]"
                    >
                        {subStep < 5 ? "Next Phase" : "Next: Ticketing"}
                        <ArrowRight size={20} />
                    </button>
                )}
                {currentStep === 2 && (
                    <button
                        onClick={() => {
                            setCurrentStep(3);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex items-center gap-4 bg-primary text-white font-black px-14 py-6 rounded-[2.5rem] shadow-3xl shadow-primary/30 uppercase tracking-[0.3em] text-[11px]"
                    >
                        Next: Schedule
                        <ArrowRight size={20} />
                    </button>
                )}
                {currentStep === 3 && (
                    <button onClick={saveAllChanges} disabled={saving} className="flex items-center gap-4 bg-secondary text-white font-black px-14 py-6 rounded-[2.5rem] shadow-3xl shadow-secondary/30 uppercase tracking-[0.3em] text-[11px] disabled:opacity-50">
                        {saving ? "Finalizing..." : "Finalize & Update"}
                        <ShieldCheck size={20} />
                    </button>
                )}
             </div>
          </div>
        </div>

        {/* Live Preview (Desktop) */}
        {showPreview && (
          <div className="hidden lg:block w-[400px] xl:w-[480px] shrink-0">
            <LivePreview basicInfo={basicInfo} mediaInfo={mediaInfo} speakers={speakers} agenda={agenda} sessions={sessions} tickets={tickets} />
          </div>
        )}
      </div>

      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden flex flex-col bg-white">
          <div className="p-4 border-b flex justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Event Preview</h3>
            <button onClick={() => setIsPreviewModalOpen(false)}><XCircle size={24} /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <LivePreview basicInfo={basicInfo} mediaInfo={mediaInfo} speakers={speakers} agenda={agenda} sessions={sessions} tickets={tickets} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EditEvent;
