"use client";
import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Calendar,
  MapPin,
  Globe,
  Users,
  User,
  Ticket,
  Layers,
  Trash2,
  Plus,
  Info,
  Image as ImageIcon,
  Share2,
  ShieldCheck,
  Clock,
  ChevronDown,
  ChevronUp,
  Type,
  Layout,
  Tag,
  FileText,
  Eye,
  EyeOff,
  Zap,
  Sparkles,
  UploadCloud,
  Upload,
  Coins,
  History, X,
  MousePointer2,
  XCircle,
  Settings,
  Percent
} from "lucide-react";
import api from "@/services/api";
import axios from "axios";
import { useEffect } from "react";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { AgendaItem, EventType, RegistrationMode, RegistrationField, Speaker, TicketType, Ticket as ITicket } from "@/types";

const steps = [
  { id: 1, title: "Event Details", icon: Info },
  { id: 2, title: "Ticketing", icon: Ticket },
  { id: 3, title: "Schedule", icon: Calendar },
];

const AUTOSAVE_KEY = "gobokin_event_creation_draft";

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
  agendaEnabled: boolean;
  sessions: {
    title: string;
    startTime: string;
    speakerNames?: string[];
  }[];
  tickets: {
    name: string;
    price: number;
    type: string;
  }[];
}

const LivePreview = ({ basicInfo, mediaInfo, speakers, sessions, tickets, agendaEnabled }: LivePreviewProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!agendaEnabled && activeTab === "schedule") {
      setActiveTab("overview");
    }
  }, [agendaEnabled, activeTab]);

  const tabs = ["overview", ...(agendaEnabled ? ["schedule"] : []), "speakers", "tickets"];

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
                  {sessions.length === 0 ? (
                      <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest text-center py-10">No sessions added yet</p>
                  ) : (
                    sessions.map((item, i) => (
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

const CreateEvent = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [subStep, setSubStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showAddFieldDropdown, setShowAddFieldDropdown] = useState(false);
  const addFieldDropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(addFieldDropdownRef, () => setShowAddFieldDropdown(false));

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/events/utils/categories");
        const data = response.data.data || [];
        // Handle both array of strings and array of objects
        const categoryNames = data.map((cat: string | { name: string }) => typeof cat === 'string' ? cat : cat.name);
        setCategories(categoryNames);
      } catch (_error) {
        console.error("Failed to fetch categories:", _error);
      }
    };
    fetchCategories();
  }, []);

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
    agendaEnabled: false,
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

  const [sessions, setSessions] = useState([{
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
  }]);

  const [tickets, setTickets] = useState<ITicket[]>([{
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
  }]);

  const [registration, setRegistration] = useState({
    mode: "FULL_DETAILS" as RegistrationMode,
    isGroupingEnabled: false,
    enforceUniqueGroupNames: true,
    fields: [
      { name: "full-name", label: "Full Name", type: "text", required: true, isPerAttendee: true },
      { name: "email", label: "Email Address", type: "text", required: true, isPerAttendee: true },
      { name: "country", label: "Country", type: "select", source: "COUNTRIES", required: true, isPerAttendee: true },
      { name: "state", label: "State", type: "select", source: "STATES", dependsOn: "country", required: true, isPerAttendee: true },
      { name: "lga", label: "LGA", type: "select", source: "LGAS", dependsOn: "state", required: true, isPerAttendee: true },
    ] as (RegistrationField & { id?: string })[],
  });

  // Persistence Logic
  const getFormState = useCallback(() => {
    return {
      basicInfo,
      mediaInfo,
      speakers,
      sessions,
      tickets,
      registration,
      currentStep,
      subStep,
      eventId,
    };
  }, [basicInfo, mediaInfo, speakers, sessions, tickets, registration, currentStep, subStep, eventId]);

  const saveToLocalStorage = useCallback(() => {
    const state = getFormState();
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
  }, [getFormState]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(AUTOSAVE_KEY);
  }, []);

  const validateForAutosave = useCallback(() => {
    return basicInfo.title && basicInfo.title.trim() !== "";
  }, [basicInfo.title]);

  // Ref for debouncing
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveToBackend = useCallback(async () => {
    if (!eventId || isAutosaving || !validateForAutosave()) return;

    setIsAutosaving(true);
    try {
      // 1. Save Base Info
      const basePayload: Record<string, unknown> = {
        title: basicInfo.title,
        description: basicInfo.description,
        slug: basicInfo.slug || undefined,
        isPublic: basicInfo.isPublic,
        type: basicInfo.type,
        startDate: basicInfo.startDate ? new Date(basicInfo.startDate).toISOString() : undefined,
        endDate: basicInfo.endDate ? new Date(basicInfo.endDate).toISOString() : undefined,
        location: basicInfo.type === 'ONLINE' ? 'Virtual' : (basicInfo.location || 'Virtual'),
        virtualLink: basicInfo.virtualLink || undefined,
        capacity: basicInfo.capacity,
        category: basicInfo.category,
        tags: (basicInfo.tags || "").split(',').map(tag => tag.trim()).filter(tag => tag !== ""),
        agendaEnabled: basicInfo.agendaEnabled,
        registrationMode: registration.mode,
        isGroupingEnabled: registration.isGroupingEnabled,
        enforceUniqueGroupNames: registration.enforceUniqueGroupNames,
        registrationFields: registration.fields.map(f => ({
          name: f.name || f.label.toLowerCase().replace(/\s+/g, '-'),
          label: f.label,
          type: f.type,
          required: f.required,
          isPerAttendee: f.isPerAttendee,
          options: (f.type === 'select' || f.type === 'checkbox') && !f.source ? f.options : undefined,
          source: f.source,
          dependsOn: f.dependsOn
        })),
        bannerUrl: mediaInfo.bannerUrl || undefined,
        mediaUrls: mediaInfo.mediaUrls,
      };

      if (speakers.length > 0) {
        basePayload.speakers = speakers.map(s => ({
          name: s.name,
          title: s.title,
          bio: s.bio,
          imageUrl: s.imageUrl
        }));
      }

      const { isFeatured: _isFeatured, status: _status, ...patchPayload } = basePayload as Record<string, unknown>;
      // Ensure status is DRAFT if we're autosaving
      (patchPayload as any).status = "DRAFT";

      const response = await api.patch(`/events/${eventId}`, patchPayload);
      if (response.data.data.speakers) {
        setSpeakers(response.data.data.speakers);
      }

      // 2. Save Tickets (if in step 2)
      if (currentStep === 2) {
          const emptyTicket = tickets.find(t => !t.name || t.name.trim() === "");
          if (!emptyTicket) {
              const ticketPayload = {
                  tickets: tickets.map(({ id: _, ...rest }) => {
                      const tPayload: any = {
                          name: rest.name,
                          description: rest.description,
                          type: rest.type,
                          price: rest.type === 'FREE' ? 0 : rest.price,
                          totalQuantity: Math.max(1, rest.totalQuantity || 1),
                          groupSize: rest.groupSize,
                          allocationType: rest.allocationType,
                          maxPerOrder: rest.maxPerOrder,
                          salesStart: rest.salesStart ? new Date(rest.salesStart).toISOString() : undefined,
                          salesEnd: rest.salesEnd ? new Date(rest.salesEnd).toISOString() : undefined,
                          isOffline: rest.isOffline,
                          quantityDiscounts: rest.quantityDiscounts
                      };

                      if (rest.type !== 'FREE' && (rest.earlyBirdLimit || 0) > 0 && (rest.earlyBirdPrice || 0) > 0) {
                          tPayload.earlyBirdPrice = rest.earlyBirdPrice;
                          tPayload.earlyBirdLimit = rest.earlyBirdLimit;
                          tPayload.earlyBirdExpiry = rest.earlyBirdExpiry ? new Date(rest.earlyBirdExpiry).toISOString() : undefined;
                      }
                      return tPayload;
                  })
              };
              await api.post(`/events/${eventId}/tickets`, ticketPayload);
          }
      }

      // 3. Save Sessions (if in step 3)
      if (currentStep === 3) {
          // Filter out sessions without titles if agenda is not enabled
          const validSessions = sessions.filter(s => s.title.trim() !== "");
          if (validSessions.length > 0) {
              const sessionPayload = {
                  sessions: validSessions.map(({ id: _, ...rest }) => ({
                      title: rest.title,
                      description: rest.description,
                      startTime: rest.startTime ? new Date(rest.startTime).toISOString() : undefined,
                      endTime: rest.endTime ? new Date(rest.endTime).toISOString() : undefined,
                      location: rest.location || (basicInfo.type === 'ONLINE' ? 'Virtual' : (basicInfo.location || 'Virtual')),
                      room: rest.room || undefined,
                      stage: rest.stage || undefined,
                      sessionType: rest.sessionType || undefined,
                      speakerIds: rest.speakerIds && rest.speakerIds.length > 0 ? rest.speakerIds : undefined,
                      speakerNames: rest.speakerNames && rest.speakerNames.length > 0 ? rest.speakerNames : undefined,
                  }))
              };
              await api.post(`/events/${eventId}/sessions`, sessionPayload);
          }
      }

      console.log("Autosave to backend successful");
    } catch (error) {
      console.error("Autosave to backend failed", error);
    } finally {
      setIsAutosaving(false);
    }
  }, [eventId, basicInfo, mediaInfo, speakers, registration, tickets, sessions, currentStep, isAutosaving, validateForAutosave]);

  const handleBlur = useCallback(() => {
    saveToLocalStorage();

    // Debounce backend save
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      saveToBackend();
    }, 1000); // 1s debounce
  }, [saveToLocalStorage, saveToBackend]);

  // Autosave interval
  useEffect(() => {
    const interval = setInterval(() => {
      saveToLocalStorage();
      saveToBackend();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [saveToLocalStorage]); // Removing saveToBackend from deps to prevent reset on every state change

  // Load draft on mount
  useEffect(() => {
    const autoResume = localStorage.getItem(AUTOSAVE_KEY + "_auto_resume");
    const hostingDraft = localStorage.getItem("gobokin_hosting_draft");

    if (autoResume === "true" && hostingDraft) {
        try {
            const draft = JSON.parse(hostingDraft);
            if (draft.basicInfo) setBasicInfo(prev => ({ ...prev, ...draft.basicInfo }));
            if (draft.speakers) setSpeakers(draft.speakers);
            if (draft.registration) setRegistration(prev => ({ ...prev, ...draft.registration }));

            // For hosting draft resume, we jump to step 1, sub-step 5 (Media)
            setCurrentStep(1);
            setSubStep(5);

            localStorage.removeItem(AUTOSAVE_KEY + "_auto_resume");
            localStorage.removeItem("gobokin_hosting_draft");

            Swal.toast.fire({
                icon: "success",
                title: "Progress resumed from hosting flow",
            });
            return;
        } catch (e) {
            console.error("Failed to parse hosting draft for auto-resume:", e);
        }
    }

    const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        Swal.fire({
          title: "Resume Draft?",
          text: "We found a previously saved draft. Would you like to continue where you left off?",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Yes, Resume",
          cancelButtonText: "No, Start Fresh",
          confirmButtonColor: "#295FA7",
        }).then((result) => {
          if (result.isConfirmed) {
            if (draft.basicInfo) setBasicInfo(draft.basicInfo);
            if (draft.mediaInfo) setMediaInfo(draft.mediaInfo);
            if (draft.speakers) setSpeakers(draft.speakers);
            if (draft.sessions) setSessions(draft.sessions);
            if (draft.tickets) setTickets(draft.tickets);
            if (draft.registration) setRegistration(draft.registration);
            if (draft.currentStep) setCurrentStep(draft.currentStep);
            if (draft.subStep) setSubStep(draft.subStep);
            if (draft.eventId) setEventId(draft.eventId);

            Swal.toast.fire({
              icon: "success",
              title: "Draft resumed successfully",
            });
          } else {
            clearDraft();
          }
        });
      } catch (e) {
        console.error("Failed to load draft", e);
        clearDraft();
      }
    }
  }, []);

  // Media Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMedia = async (file: File, currentEventId?: string | null) => {
    try {
      // 1. Get presigned URL
      const endpoint = currentEventId ? `/events/${currentEventId}/media/upload-url` : '/events/utils/upload-url';
      const presignedResponse = await api.get(endpoint, {
        params: { fileName: file.name, fileType: file.type }
      });
      const { uploadUrl, fileUrl, publicUrl } = presignedResponse.data.data;
      const finalUrl = publicUrl || fileUrl;

      // 2. Upload to R2
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

  const handleBannerUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileUrl = await uploadMedia(file, eventId);

      // If event exists, attach it via post-creation route
      if (eventId) {
          await api.post(`/events/${eventId}/media`, { bannerUrl: fileUrl });
      }

      setMediaInfo(prev => ({ ...prev, bannerUrl: fileUrl }));
      Swal.toast.fire({ icon: 'success', title: 'Banner uploaded successfully!' });
    } catch (_error) {
      Swal.fire('Error', 'Failed to upload banner. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [eventId]);

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

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMediaInfo(prev => ({ ...prev, [name]: value }));
  };

  const addSpeaker = () => {
    setSpeakers([...speakers, { name: "", title: "", bio: "", imageUrl: "" }]);
  };

  const updateSpeaker = (index: number, field: keyof Speaker, value: string) => {
    const newSpeakers = [...speakers];
    newSpeakers[index] = { ...newSpeakers[index], [field]: value };
    setSpeakers(newSpeakers);
  };

  const removeSpeaker = (index: number) => {
    setSpeakers(speakers.filter((_, i) => i !== index));
  };

  const handleSpeakerImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      Swal.showLoading();
      // Speakers are uploaded via utility route before event creation
      const fileUrl = await uploadMedia(file);
      updateSpeaker(index, 'imageUrl', fileUrl);
      Swal.close();
      Swal.toast.fire({ icon: 'success', title: 'Speaker image uploaded!' });
    } catch (_error) {
      Swal.fire('Error', 'Upload failed', 'error');
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
          const url = await uploadMedia(files[i], eventId);
          // If event exists, attach it via post-creation route
          if (eventId) {
              await api.post(`/events/${eventId}/media`, { mediaUrl: url });
          }
          urls.push(url);
      }
      setMediaInfo(prev => ({ ...prev, mediaUrls: [...prev.mediaUrls, ...urls] }));
      Swal.toast.fire({ icon: 'success', title: 'Media uploaded successfully!' });
    } catch (_error) {
      Swal.fire('Error', 'Some uploads failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const removeMediaUrl = async (idx: number) => {
      const urlToDelete = mediaInfo.mediaUrls[idx];
      if (eventId) {
          try {
              await api.delete(`/events/${eventId}/media`, { data: { mediaUrl: urlToDelete } });
          } catch (err) {
              console.error("Failed to delete media from backend:", err);
          }
      }
      setMediaInfo(prev => ({ ...prev, mediaUrls: prev.mediaUrls.filter((_, i) => i !== idx) }));
  };

  const addSession = () => {
    setSessions([...sessions, {
      id: Math.random().toString(),
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      location: "",
      room: "",
      stage: "",
      sessionType: "",
      speakerIds: [],
      speakerNames: [],
    }]);
  };

  const removeSession = (sessionId: string) => {
    if (sessions.length > 1) setSessions(sessions.filter(s => s.id !== sessionId));
  };

  const updateSession = (sessionId: string, field: string, value: any) => {
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, [field]: value } : s));
  };

  const addTicket = () => {
    const currentTotal = tickets.reduce((sum, t) => sum + (t.totalQuantity || 0), 0);
    const remaining = Math.max(0, basicInfo.capacity - currentTotal);

    setTickets([...tickets, {
        id: Math.random().toString(),
        name: "",
        price: 0,
        type: "PAID",
        allocationType: "GENERAL",
        totalQuantity: remaining,
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
    }]);
  };

  const removeTicket = (ticketId: string) => {
    if (tickets.length > 1) setTickets(tickets.filter(t => t.id !== ticketId));
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
    setTickets(tickets.map(t => t.id === ticketId ? {
      ...t,
      quantityDiscounts: [...(t.quantityDiscounts || []), { minQuantity: 0, discountPercentage: 0 }]
    } : t));
  };

  const updateQuantityDiscount = (ticketId: string, index: number, field: string, value: number) => {
    setTickets(tickets.map(t => {
      if (t.id === ticketId) {
        const discounts = [...(t.quantityDiscounts || [])];
        discounts[index] = { ...discounts[index], [field]: value };
        return { ...t, quantityDiscounts: discounts };
      }
      return t;
    }));
  };

  const removeQuantityDiscount = (ticketId: string, index: number) => {
    setTickets(tickets.map(t => {
      if (t.id === ticketId) {
        const discounts = [...(t.quantityDiscounts || [])];
        discounts.splice(index, 1);
        return { ...t, quantityDiscounts: discounts };
      }
      return t;
    }));
  };

  const addField = (fieldType: 'custom' | 'location' | 'address' = 'custom') => {
    const isPerAttendee = registration.isGroupingEnabled ? true : false;

    if (fieldType === 'location') {
      setRegistration(prev => ({
        ...prev,
        fields: [
          ...prev.fields,
          {
            name: "country",
            label: "Country",
            type: "select",
            source: "COUNTRIES",
            required: true,
            isPerAttendee,
            options: []
          },
          {
            name: "state",
            label: "State",
            type: "select",
            source: "STATES",
            dependsOn: "country",
            required: true,
            isPerAttendee,
            options: []
          },
          {
            name: "lga",
            label: "LGA",
            type: "select",
            source: "LGAS",
            dependsOn: "state",
            required: true,
            isPerAttendee,
            options: []
          }
        ]
      }));
    } else if (fieldType === 'address') {
      setRegistration({
        ...registration,
        fields: [...registration.fields, {
          name: "address",
          label: "Address",
          type: "text",
          required: false,
          isPerAttendee,
          options: []
        }]
      });
    } else {
      setRegistration({
        ...registration,
        fields: [...registration.fields, {
          name: "",
          label: "",
          type: "text",
          required: false,
          isPerAttendee,
          options: []
        }]
      });
    }
    setShowAddFieldDropdown(false);
  };

  const removeField = (index: number) => {
    const newFields = [...registration.fields];
    newFields.splice(index, 1);
    setRegistration({ ...registration, fields: newFields });
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...registration.fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newFields.length) {
      const temp = newFields[index];
      newFields[index] = newFields[targetIndex];
      newFields[targetIndex] = temp;
      setRegistration({ ...registration, fields: newFields });
      handleBlur();
    }
  };

  const updateField = (index: number, field: string, value: any) => {
    const newFields = [...registration.fields];
    newFields[index] = { ...newFields[index], [field]: value };
    setRegistration({ ...registration, fields: newFields });
  };

  const addFieldOption = (fieldIdx: number) => {
    const newFields = [...registration.fields];
    const currentOptions = newFields[fieldIdx].options || [];
    newFields[fieldIdx] = { ...newFields[fieldIdx], options: [...currentOptions, ""] };
    setRegistration({ ...registration, fields: newFields });
  };

  const updateFieldOption = (fieldIdx: number, optionIdx: number, value: string) => {
    const newFields = [...registration.fields];
    const newOptions = [...(newFields[fieldIdx].options || [])];
    newOptions[optionIdx] = value;
    newFields[fieldIdx] = { ...newFields[fieldIdx], options: newOptions };
    setRegistration({ ...registration, fields: newFields });
  };

  const removeFieldOption = (fieldIdx: number, optionIdx: number) => {
    const newFields = [...registration.fields];
    const newOptions = (newFields[fieldIdx].options || []).filter((_, i) => i !== optionIdx);
    newFields[fieldIdx] = { ...newFields[fieldIdx], options: newOptions };
    setRegistration({ ...registration, fields: newFields });
  };

  const createEventBase = async () => {
    // If event already created, just move to media phase
    if (eventId) {
        setSubStep(5);
        return;
    }

    setLoading(true);
    try {
      Swal.showLoading();

      const payload: Record<string, unknown> = {
        title: basicInfo.title,
        description: basicInfo.description,
        slug: basicInfo.slug || undefined,
        isPublic: basicInfo.isPublic,
        type: basicInfo.type,
        startDate: basicInfo.startDate ? new Date(basicInfo.startDate).toISOString() : undefined,
        endDate: basicInfo.endDate ? new Date(basicInfo.endDate).toISOString() : undefined,
        location: basicInfo.type === 'ONLINE' ? 'Virtual' : (basicInfo.location || 'Virtual'),
        virtualLink: basicInfo.virtualLink || undefined,
        capacity: basicInfo.capacity,
        category: basicInfo.category,
        tags: (basicInfo.tags || "").split(',').map(tag => tag.trim()).filter(tag => tag !== ""),
        agendaEnabled: basicInfo.agendaEnabled,
        registrationMode: registration.mode,
        isGroupingEnabled: registration.isGroupingEnabled,
        enforceUniqueGroupNames: registration.enforceUniqueGroupNames,
        registrationFields: registration.fields.map(f => ({
          name: f.name || f.label.toLowerCase().replace(/\s+/g, '-'),
          label: f.label,
          type: f.type,
          required: f.required,
          isPerAttendee: f.isPerAttendee,
          options: (f.type === 'select' || f.type === 'checkbox') && !f.source ? f.options : undefined,
          source: f.source,
          dependsOn: f.dependsOn
        })),
      };

      if (speakers.length > 0) {
        payload.speakers = speakers.map(s => ({
          name: s.name,
          title: s.title,
          bio: s.bio,
          imageUrl: s.imageUrl
        }));
      }

      // Remove restricted fields from creation payload
      const { isFeatured: _isFeatured, status: _status, ...creationPayload } = payload as Record<string, unknown>;
      const response = await api.post("/events", creationPayload);
      const newEventId = response.data.data.id;
      setEventId(newEventId);

      if (response.data.data.speakers) {
        setSpeakers(response.data.data.speakers);
      }

      setSubStep(5);
      Swal.fire({
          title: 'Event Created!',
          text: 'Now let&apos;s upload your banner and gallery images.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
      });
    } catch (_error) {
      console.error("Failed to create event:", _error);
      Swal.fire("Error", translateError(_error), "error");
    } finally {
      setLoading(false);
    }
  };

  const createTickets = async () => {
      if (!eventId) return;

      // Validate Ticket Names
      const emptyTicket = tickets.find(t => !t.name || t.name.trim() === "");
      if (emptyTicket) {
          Swal.fire("Validation Error", "All ticket tiers must have a public name.", "error");
          return;
      }

      setLoading(true);
      try {
          Swal.showLoading();
          const payload = {
              tickets: tickets.map(({ id: _, ...rest }) => {
                  const tPayload: any = {
                      name: rest.name,
                      description: rest.description,
                      type: rest.type,
                      price: rest.type === 'FREE' ? 0 : rest.price,
                      totalQuantity: Math.max(1, rest.totalQuantity || 1),
                      groupSize: rest.groupSize,
                      allocationType: rest.allocationType,
                      maxPerOrder: rest.maxPerOrder,
                      salesStart: rest.salesStart ? new Date(rest.salesStart).toISOString() : undefined,
                      salesEnd: rest.salesEnd ? new Date(rest.salesEnd).toISOString() : undefined,
                      isOffline: rest.isOffline,
                      quantityDiscounts: rest.quantityDiscounts
                  };

                  if (rest.type !== 'FREE' && (rest.earlyBirdLimit || 0) > 0 && (rest.earlyBirdPrice || 0) > 0) {
                      tPayload.earlyBirdPrice = rest.earlyBirdPrice;
                      tPayload.earlyBirdLimit = rest.earlyBirdLimit;
                      tPayload.earlyBirdExpiry = rest.earlyBirdExpiry ? new Date(rest.earlyBirdExpiry).toISOString() : undefined;
                  }

                  return tPayload;
              })
          };
          await api.post(`/events/${eventId}/tickets`, payload);
          setCurrentStep(3);
          Swal.fire({
              title: 'Step 2 Complete',
              text: 'Tickets configured. Finally, add your event sessions.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
          });
      } catch (_error) {
          console.error("Failed to create tickets:", _error);
          Swal.fire("Error", translateError(_error), "error");
      } finally {
          setLoading(false);
      }
  };

  const createSessions = async () => {
      if (!eventId) return;

      const validSessions = sessions.filter(s => s.title.trim() !== "");
      if (basicInfo.agendaEnabled && validSessions.length === 0) {
          Swal.fire("Validation Error", "At least one session is required when Agenda is enabled.", "error");
          return;
      }

      setLoading(true);
      try {
          Swal.showLoading();
          const payload = {
              sessions: validSessions.map(({ id: _, ...rest }) => ({
                  title: rest.title,
                  description: rest.description,
                  startTime: rest.startTime ? new Date(rest.startTime).toISOString() : undefined,
                  endTime: rest.endTime ? new Date(rest.endTime).toISOString() : undefined,
                  location: rest.location || (basicInfo.type === 'ONLINE' ? 'Virtual' : (basicInfo.location || 'Virtual')),
                  room: rest.room || undefined,
                  stage: rest.stage || undefined,
                  sessionType: rest.sessionType || undefined,
                  speakerIds: rest.speakerIds && rest.speakerIds.length > 0 ? rest.speakerIds : undefined,
                  speakerNames: rest.speakerNames && rest.speakerNames.length > 0 ? rest.speakerNames : undefined,
              }))
          };

          if (payload.sessions.length > 0) {
              await api.post(`/events/${eventId}/sessions`, payload);
          }
          await Swal.fire({
              title: "Event Fully Launched!",
              text: "Your event, tickets, and sessions have been successfully created.",
              icon: "success",
              confirmButtonColor: "#295FA7",
          });
          clearDraft();
          router.push(`/organizer/dashboard/events/${eventId}`);
      } catch (_error) {
          console.error("Failed to create sessions:", _error);
          Swal.fire("Error", translateError(_error), "error");
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="max-w-[1600px] mx-auto py-6 lg:py-10 px-4">
      {/* Header Area */}
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 px-4">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-all mb-4 group font-black text-[10px] uppercase tracking-[0.2em]">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Overview
          </button>
          <h1 className="text-5xl font-black text-primary tracking-tight leading-none mb-3">Create Event</h1>
          <p className="text-gray-500 font-medium text-lg">Bring your vision to life in a few simple steps.</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsPreviewModalOpen(true);
              } else {
                setShowPreview(!showPreview);
              }
            }}
            className="flex items-center gap-2.5 bg-white text-gray-500 font-black px-6 py-4 rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 hover:text-primary transition-all text-[10px] uppercase tracking-[0.2em]"
          >
            <Eye size={16} />
            <span className="hidden sm:inline">{showPreview ? "Hide Preview" : "Show Preview"}</span>
            <span className="sm:hidden">Preview</span>
          </button>

          {/* Step Indicator Desktop */}
          <div className="hidden xl:flex items-center gap-1.5 bg-gray-50 p-2 rounded-[2.5rem] border border-gray-100">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-500 relative group cursor-help ${
                  currentStep === step.id
                  ? "bg-primary text-white shadow-xl shadow-primary/30 scale-110"
                  : currentStep > step.id ? "text-secondary bg-white border border-secondary/20" : "text-gray-300 hover:text-gray-400"
                }`}
              >
                <step.icon size={16} strokeWidth={currentStep === step.id ? 3 : 2} />
                {currentStep > step.id && (
                    <div className="absolute -top-1 -right-1 bg-secondary text-white rounded-full p-0.5 border-2 border-white">
                        <CheckCircle2 size={10} strokeWidth={4} />
                    </div>
                )}
                {/* Tooltip */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                    {step.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start px-2">
        {/* Main Form Container */}
        <div className={`flex-1 w-full bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden transition-all duration-700 ease-in-out`}>
          {/* Mobile Progress Bar */}
          <div className="lg:hidden bg-white px-6 py-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-5">
                 <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-base shadow-xl shadow-primary/20">
                    {currentStep}
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Current Step</p>
                    <span className="text-base font-black text-gray-900 leading-none">{steps[currentStep-1].title}</span>
                 </div>
              </div>
              <div className="flex gap-1.5">
                 {steps.map(s => (
                    <div key={s.id} className={`w-2 h-2 rounded-full transition-all duration-500 ${s.id === currentStep ? 'w-6 bg-primary' : s.id < currentStep ? 'bg-secondary' : 'bg-gray-200'}`}></div>
                 ))}
              </div>
          </div>

          <div className="p-8 md:p-10 lg:p-12">
            {/* STEP 1: EVENT DETAILS */}
            {currentStep === 1 && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                 {/* Sub-progress for Step 1 */}
                 <div className="flex items-center gap-4 mb-8">
                    {[1, 2, 3, 4, 5].map((s) => (
                       <div key={s} className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                             className={`h-full transition-all duration-500 ${
                                s <= subStep ? 'bg-primary' : 'bg-transparent'
                             }`}
                          />
                       </div>
                    ))}
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap ml-2">
                       {subStep} of 5
                    </span>
                 </div>

                 {subStep === 1 && (
                    <div className="space-y-16 animate-in fade-in duration-500">
                       {/* Section 1: Event Identity */}
                       <div className="space-y-10 group/section">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center transition-all group-hover/section:bg-primary group-hover/section:text-white group-hover/section:rotate-3 shadow-sm border border-gray-100">
                                <Type size={24} />
                             </div>
                             <div>
                                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Event Identity</h3>
                                  <p className="text-sm text-gray-400 font-medium">Define the core personality of your event.</p>
                             </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Official Event Title</label>
                                <input
                                  type="text"
                                  name="title"
                                  required
                                  placeholder="e.g., Annual Tech Summit 2024"
                                  className="w-full p-5 sm:p-6 bg-white border border-gray-300 rounded-[1.5rem] sm:rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm"
                                  value={basicInfo.title || ""}
                                  onBlur={handleBlur} onChange={handleBasicChange}
                                />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Slug (URL Friendly)</label>
                                <input
                                  type="text"
                                  name="slug"
                                  placeholder="e.g., tech-summit-2024"
                                  className="w-full p-5 sm:p-6 bg-white border border-gray-300 rounded-[1.5rem] sm:rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm"
                                  value={basicInfo.slug || ""}
                                  onBlur={handleBlur} onChange={handleBasicChange}
                                />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Category</label>
                                <div className="relative">
                                   <Layout size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                                   <select
                                      name="category"
                                      className="w-full pl-14 pr-12 py-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none appearance-none shadow-sm cursor-pointer"
                                      value={basicInfo.category || ""}
                                      onBlur={handleBlur} onChange={handleBasicChange}
                                   >
                                      <option value="">Select a category</option>
                                      {categories.map((cat, idx) => (
                                        <option key={idx} value={cat}>{cat}</option>
                                      ))}
                                   </select>
                                   <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Search Keywords</label>
                                <div className="relative">
                                   <Tag size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" />
                                   <input
                                      type="text"
                                      name="tags"
                                      placeholder="Comma separated tags"
                                      className="w-full pl-14 pr-6 py-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm"
                                      value={basicInfo.tags || ""}
                                      onBlur={handleBlur} onChange={handleBasicChange}
                                   />
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* Section 2: Date & Time */}
                       <div className="space-y-10 group/section">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center transition-all group-hover/section:bg-primary group-hover/section:text-white group-hover/section:-rotate-3 shadow-sm border border-gray-100">
                                <Calendar size={24} />
                             </div>
                             <div>
                                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Timeline</h3>
                                  <p className="text-sm text-gray-400 font-medium">When should attendees mark their calendars?</p>
                             </div>
                          </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Commences</label>
                                <div className="relative">
                                      <Clock size={18} className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-primary" />
                                   <input
                                      type="datetime-local"
                                      name="startDate"
                                         className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-5 sm:py-6 bg-white border border-gray-300 rounded-[1.5rem] sm:rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                      value={basicInfo.startDate}
                                      onBlur={handleBlur} onChange={handleBasicChange}
                                   />
                                </div>
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Concludes</label>
                                <div className="relative">
                                      <Clock size={18} className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-primary" />
                                   <input
                                      type="datetime-local"
                                      name="endDate"
                                         className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-5 sm:py-6 bg-white border border-gray-300 rounded-[1.5rem] sm:rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                      value={basicInfo.endDate}
                                      onBlur={handleBlur} onChange={handleBasicChange}
                                   />
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* Section 3: Location & Format */}
                       <div className="space-y-10 group/section">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center transition-all group-hover/section:bg-primary group-hover/section:text-white group-hover/section:scale-110 shadow-sm border border-gray-100">
                                <MapPin size={24} />
                             </div>
                             <div>
                                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Location & Format</h3>
                                  <p className="text-sm text-gray-400 font-medium">Choose where the magic happens.</p>
                             </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Access Method</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                                   {["PHYSICAL", "ONLINE", "HYBRID"].map((type) => (
                                      <button
                                         key={type}
                                         type="button"
                                         onClick={() => setBasicInfo({...basicInfo, type: type as EventType})}
                                         className={`py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all ${
                                            basicInfo.type === type
                                            ? "bg-primary text-white border-primary shadow-xl shadow-primary/30"
                                            : "bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50"
                                         }`}
                                      >
                                         {type}
                                      </button>
                                   ))}
                                </div>
                             </div>
                             {basicInfo.type !== "ONLINE" && (
                                <div className="space-y-3 md:col-span-2">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Physical Venue Address</label>
                                   <div className="relative">
                                      <MapPin size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" />
                                      <input
                                         type="text"
                                         name="location"
                                         placeholder="Street address, City, State"
                                         className="w-full pl-14 pr-6 py-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm"
                                         value={basicInfo.location || ""}
                                         onBlur={handleBlur} onChange={handleBasicChange}
                                      />
                                   </div>
                                </div>
                             )}
                             {basicInfo.type !== "PHYSICAL" && (
                             <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Digital Meeting Link</label>
                                   <div className="relative">
                                      <Globe size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" />
                                      <input
                                         type="url"
                                         name="virtualLink"
                                         placeholder="https://zoom.us/j/..."
                                         className="w-full pl-14 pr-6 py-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm"
                                         value={basicInfo.virtualLink || ""}
                                         onBlur={handleBlur} onChange={handleBasicChange}
                                      />
                                   </div>
                                </div>
                             )}
                             <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Attendee Capacity</label>
                                <div className="relative">
                                   <Users size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" />
                                   <input
                                      type="number"
                                      name="capacity"
                                      className="w-full pl-14 pr-6 py-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                      value={basicInfo.capacity}
                                      onBlur={handleBlur} onChange={handleBasicChange}
                                   />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {subStep === 2 && (
                    <div className="space-y-16 animate-in fade-in duration-500">
                       {/* Section 6: Speakers */}
                       <div className="space-y-10 group/section">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-10">
                             <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center shadow-sm border border-gray-100">
                                   <Users size={24} />
                                </div>
                                <div>
                                   <h3 className="text-2xl font-black text-gray-900 tracking-tight">Speakers & Guests</h3>
                                   <p className="text-sm text-gray-400 font-medium">Highlight the key people at your event.</p>
                                </div>
                             </div>
                             <button
                               onClick={addSpeaker}
                               className="flex items-center gap-3 bg-gray-900 text-white font-black px-8 py-5 rounded-3xl hover:bg-black transition-all shadow-2xl shadow-gray-900/20 text-[10px] uppercase tracking-[0.2em]"
                             >
                               <Plus size={18} />
                               Add Speaker
                             </button>
                          </div>

                          <div className={`grid gap-8 ${showPreview ? "grid-cols-1 2xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
                             {speakers.map((speaker, idx) => (
                                <div key={idx} className="p-8 bg-gray-50 rounded-[3rem] space-y-6 relative group/speaker transition-all duration-500 hover:bg-white hover:shadow-xl">
                                   <button
                                      onClick={() => removeSpeaker(idx)}
                                      className="absolute top-6 right-6 w-10 h-10 bg-white text-gray-300 hover:text-secondary rounded-xl flex items-center justify-center shadow-sm transition-all"
                                   >
                                      <Trash2 size={16} />
                                   </button>

                                   <div className={`flex items-center gap-6 ${showPreview ? "flex-col 2xl:flex-row" : "flex-col sm:flex-row"}`}>
                                      <div className="relative w-24 h-24 rounded-[2rem] overflow-hidden bg-white shadow-lg border border-gray-100 group/img shrink-0">
                                         {speaker.imageUrl ? (
                                            <Image src={speaker.imageUrl} alt="Speaker" fill unoptimized={true} className="object-cover" />
                                         ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                               <Users size={32} />
                                            </div>
                                         )}
                                         <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10">
                                            <Upload size={20} className="text-white" />
                                            <input type="file" className="hidden" onBlur={handleBlur} onChange={(e) => handleSpeakerImageUpload(idx, e)} />
                                         </label>
                                         <div className="absolute bottom-2 right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white z-20 pointer-events-none">
                                            <Upload size={14} strokeWidth={3} />
                                         </div>
                                      </div>
                                      <div className="flex-1 w-full space-y-4">
                                         <input
                                            type="text"
                                            placeholder="Full Name"
                                            className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all shadow-sm"
                                            value={speaker.name}
                                            onBlur={handleBlur} onChange={(e) => updateSpeaker(idx, 'name', e.target.value)}
                                         />
                                         <input
                                            type="text"
                                            placeholder="Title (e.g., CEO, Speaker)"
                                            className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all shadow-sm"
                                            value={speaker.title}
                                            onBlur={handleBlur} onChange={(e) => updateSpeaker(idx, 'title', e.target.value)}
                                         />
                                      </div>
                                   </div>
                                   <textarea
                                      placeholder="Short bio about the speaker..."
                                      rows={3}
                                      className="w-full p-6 bg-white border border-gray-200 rounded-[1.5rem] text-sm font-bold outline-none focus:border-primary transition-all"
                                      value={speaker.bio}
                                      onBlur={handleBlur} onChange={(e) => updateSpeaker(idx, 'bio', e.target.value)}
                                   />
                                </div>
                             ))}
                          </div>
                       </div>

                       {/* Section 7: Agenda Toggle */}
                       <div className="space-y-10 group/section">
                          <div className="p-8 bg-gray-50 rounded-[3rem] border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white hover:shadow-xl transition-all duration-500">
                             <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white text-secondary flex items-center justify-center shadow-sm border border-gray-100 group-hover/section:bg-secondary group-hover/section:text-white transition-all">
                                   <Calendar size={24} />
                                </div>
                                <div>
                                   <h3 className="text-xl font-black text-gray-900 tracking-tight">Enable Event Agenda</h3>
                                   <p className="text-xs text-gray-400 font-medium">Allow timeline, session pages, and speaker scheduling.</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{basicInfo.agendaEnabled ? 'Enabled' : 'Disabled'}</span>
                                <button
                                   onClick={() => {
                                      const newVal = !basicInfo.agendaEnabled;
                                      setBasicInfo(prev => ({ ...prev, agendaEnabled: newVal }));
                                      handleBlur();
                                   }}
                                   className={`w-16 h-9 rounded-full transition-all relative ${basicInfo.agendaEnabled ? 'bg-secondary' : 'bg-gray-200'}`}
                                >
                                   <div className={`absolute top-1.5 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${basicInfo.agendaEnabled ? 'left-8' : 'left-1.5'}`} />
                                </button>
                             </div>
                          </div>

                          {basicInfo.agendaEnabled && (
                            <div className="bg-secondary/5 border border-secondary/10 p-6 rounded-[2rem] flex items-start gap-4">
                                <Info size={18} className="text-secondary shrink-0 mt-0.5" />
                                <p className="text-[11px] font-medium text-secondary/80 leading-relaxed">
                                    When Agenda is enabled, you'll be required to add at least one session in the "Schedule" step before publishing your event.
                                </p>
                            </div>
                          )}
                       </div>
                    </div>
                 )}

                 {subStep === 3 && (
                    <div className="space-y-16 animate-in fade-in duration-500">
                       {/* Section 8: Advanced Settings */}
                       <div className="space-y-10 group/section">
                          <div className="flex items-center gap-5 border-b border-gray-100 pb-10">
                             <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center shadow-sm border border-gray-100">
                                <ShieldCheck size={24} />
                             </div>
                             <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Advanced Settings</h3>
                                <p className="text-sm text-gray-400 font-medium">Fine-tune your event&apos;s visibility and registration.</p>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                             <div className="space-y-4 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                   <Globe size={12} />
                                   Public Visibility
                                </label>
                                <div className="flex items-center justify-between">
                                   <span className="text-sm font-bold text-gray-700">{basicInfo.isPublic ? 'Publicly Listed' : 'Hidden from Search'}</span>
                                   <button
                                      onClick={() => setBasicInfo(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                                      className={`w-14 h-8 rounded-full transition-all relative ${basicInfo.isPublic ? 'bg-primary' : 'bg-gray-300'}`}
                                   >
                                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${basicInfo.isPublic ? 'left-7' : 'left-1'}`} />
                                   </button>
                                </div>
                             </div>
                             <div className="space-y-4 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                   <Sparkles size={12} />
                                   Featured Event
                                </label>
                                <div className="flex items-center justify-between">
                                   <span className="text-sm font-bold text-gray-700">{basicInfo.isFeatured ? 'Promoted' : 'Standard'}</span>
                                   <button
                                      onClick={() => setBasicInfo(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                                      className={`w-14 h-8 rounded-full transition-all relative ${basicInfo.isFeatured ? 'bg-secondary' : 'bg-gray-300'}`}
                                   >
                                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${basicInfo.isFeatured ? 'left-7' : 'left-1'}`} />
                                   </button>
                                </div>
                             </div>
                             <div className="space-y-4 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                   <User size={12} />
                                   Registration Mode
                                </label>
                                <div className="relative">
                                   <select
                                      className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-xs font-bold outline-none focus:border-primary appearance-none"
                                      value={registration.mode}
                                      onBlur={handleBlur} onChange={(e) => setRegistration(prev => ({ ...prev, mode: e.target.value as RegistrationMode }))}
                                   >
                                      <option value="FULL_DETAILS">Full Details (Each Guest)</option>
                                      <option value="BASIC_QUANTITY">Basic Quantity (Buyer Only)</option>
                                   </select>
                                   <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                             </div>
                             <div className="space-y-4 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                   <Users size={12} />
                                   Grouping
                                </label>
                                <div className="flex items-center justify-between">
                                   <span className="text-sm font-bold text-gray-700">Allow Grouping</span>
                                   <button
                                      onClick={() => {
                                         const newGroupingEnabled = !registration.isGroupingEnabled;
                                         setRegistration(prev => ({
                                            ...prev,
                                            isGroupingEnabled: newGroupingEnabled,
                                            fields: newGroupingEnabled
                                               ? prev.fields
                                               : prev.fields.map((f) => ({ ...f, isPerAttendee: false }))
                                         }));
                                      }}
                                      className={`w-14 h-8 rounded-full transition-all relative ${registration.isGroupingEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                                   >
                                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${registration.isGroupingEnabled ? 'left-7' : 'left-1'}`} />
                                   </button>
                                </div>
                             </div>
                             {registration.isGroupingEnabled && (
                                <div className="space-y-4 p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                      <Users size={12} />
                                      Unique Names
                                   </label>
                                   <div className="flex items-center justify-between">
                                      <span className="text-sm font-bold text-gray-700">Enforce Unique Names</span>
                                      <button
                                         onClick={() => setRegistration(prev => ({ ...prev, enforceUniqueGroupNames: !prev.enforceUniqueGroupNames }))}
                                         className={`w-14 h-8 rounded-full transition-all relative ${registration.enforceUniqueGroupNames ? 'bg-primary' : 'bg-gray-300'}`}
                                      >
                                         <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${registration.enforceUniqueGroupNames ? 'left-7' : 'left-1'}`} />
                                      </button>
                                   </div>
                                </div>
                             )}
                          </div>
                       </div>

                       {/* Section 9: Registration Fields */}
                       <div className="space-y-10">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-10">
                             <div>
                                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Intelligence Gathering</h3>
                                <p className="text-sm text-gray-500 font-medium">Capture custom data points from your attendees.</p>
                             </div>
                             <div className="relative" ref={addFieldDropdownRef}>
                                <button
                                  onClick={() => setShowAddFieldDropdown(!showAddFieldDropdown)}
                                  className="flex items-center gap-3 bg-gray-900 text-white font-black px-8 py-5 rounded-3xl hover:bg-black transition-all shadow-2xl shadow-gray-900/20 text-[10px] uppercase tracking-[0.2em]"
                                >
                                  <Plus size={18} />
                                  Add Dynamic Field
                                </button>
                                {showAddFieldDropdown && (
                                   <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-[100] animate-in fade-in zoom-in duration-200">
                                      <button
                                         onClick={() => addField('location')}
                                         className="w-full px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-3"
                                      >
                                         <MapPin size={14} />
                                         Location
                                      </button>
                                      <button
                                         onClick={() => addField('address')}
                                         className="w-full px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-3"
                                      >
                                         <FileText size={14} />
                                         Address
                                      </button>
                                      <button
                                         onClick={() => addField('custom')}
                                         className="w-full px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-3"
                                      >
                                         <Plus size={14} />
                                         Empty Field
                                      </button>
                                   </div>
                                )}
                             </div>
                          </div>

                          <div className="grid grid-cols-1 gap-6">
                             {registration.fields.map((field, idx) => (
                                <React.Fragment key={idx}>
                                <div className={`flex items-center gap-4 p-5 bg-gray-50 rounded-[2rem] group relative border border-transparent hover:border-primary/10 hover:bg-white transition-all duration-500 hover:shadow-lg hover:shadow-gray-200/50 ${showPreview ? "flex-col 2xl:flex-row 2xl:gap-6" : "flex-col lg:flex-row lg:gap-6"}`}>
                                   <div className="flex items-center gap-6 px-5 h-14 bg-white/50 rounded-xl border border-gray-100 w-full lg:w-auto shrink-0 order-1">
                                      <label className="flex items-center gap-2 cursor-pointer group/toggle">
                                         <input
                                            type="checkbox"
                                            checked={field.required}
                                            disabled={field.source === 'COUNTRIES' || field.source === 'STATES' || field.source === 'LGAS'}
                                            onBlur={handleBlur} onChange={(e) => updateField(idx, "required", e.target.checked)}
                                            className="w-5 h-5 rounded-lg border-gray-200 text-primary cursor-pointer shadow-sm transition-all"
                                         />
                                         <span className="text-[9px] font-black text-gray-400 group-hover/toggle:text-gray-900 uppercase tracking-widest transition-colors">Mandatory</span>
                                      </label>
                                      <label
                                         className={`flex items-center gap-2 group/toggle ${!registration.isGroupingEnabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                         title={!registration.isGroupingEnabled ? "Enable 'Allow Grouping' to collect details per attendee" : ""}
                                      >
                                         <input
                                            type="checkbox"
                                            checked={field.isPerAttendee}
                                            disabled={field.source === 'COUNTRIES' || field.source === 'STATES' || field.source === 'LGAS'}
                                            onBlur={handleBlur} onChange={(e) => updateField(idx, "isPerAttendee", e.target.checked)}
                                            className="w-5 h-5 rounded-lg border-gray-200 text-primary cursor-pointer shadow-sm transition-all"
                                         />
                                         <span className="text-[9px] font-black text-gray-400 group-hover/toggle:text-gray-900 uppercase tracking-widest transition-colors">Per Attendee</span>
                                      </label>
                                   </div>

                                   <div className="flex-1 w-full space-y-1.5 order-2">
                                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Field Label</label>
                                      <input
                                         type="text"
                                         placeholder="e.g., Job Title"
                                         disabled={field.source === 'COUNTRIES' || field.source === 'STATES' || field.source === 'LGAS'}
                                         className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-[11px] font-bold focus:border-primary transition-all outline-none disabled:bg-gray-50 disabled:text-gray-400"
                                         value={field.label}
                                         onBlur={handleBlur} onChange={(e) => updateField(idx, "label", e.target.value)}
                                      />
                                   </div>

                                   <div className={`w-full space-y-1.5 order-3 ${showPreview ? "2xl:w-40" : "lg:w-40"}`}>
                                      <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Input Type</label>
                                      <div className="relative">
                                         <select
                                            disabled={field.source === 'COUNTRIES' || field.source === 'STATES' || field.source === 'LGAS'}
                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-xl text-[11px] font-bold appearance-none outline-none focus:border-primary transition-all disabled:bg-gray-50 disabled:text-gray-400"
                                            value={field.type}
                                            onBlur={handleBlur} onChange={(e) => updateField(idx, "type", e.target.value)}
                                         >
                                            <option value="text">Text</option>
                                            <option value="number">Number</option>
                                            <option value="select">Dropdown</option>
                                            <option value="checkbox">Checkbox</option>
                                         </select>
                                         <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                      </div>
                                   </div>

                                   <div className="flex items-center gap-2 shrink-0 order-4 w-full lg:w-auto justify-end">
                                      <div className="flex gap-1.5">
                                         <button
                                            onClick={() => moveField(idx, 'up')}
                                            disabled={idx === 0}
                                            className="w-10 h-10 bg-white text-gray-300 hover:text-primary disabled:opacity-30 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all border border-gray-100"
                                         >
                                            <ChevronUp size={16} />
                                         </button>
                                         <button
                                            onClick={() => moveField(idx, 'down')}
                                            disabled={idx === registration.fields.length - 1}
                                            className="w-10 h-10 bg-white text-gray-300 hover:text-primary disabled:opacity-30 rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all border border-gray-100"
                                         >
                                            <ChevronDown size={16} />
                                         </button>
                                      </div>
                                      <button
                                         onClick={() => removeField(idx)}
                                         className="w-10 h-10 bg-white text-gray-300 hover:text-secondary rounded-xl flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 transition-all border border-gray-100"
                                      >
                                         <Trash2 size={16} />
                                      </button>
                                   </div>
                                </div>
                                {(field.type === 'select' || field.type === 'checkbox') && (
                                    <div className="bg-gray-50/50 rounded-[2rem] p-6 border border-gray-100 mt-2 ml-4 mr-4 space-y-5">
                                        <div className={`grid gap-5 ${showPreview ? "grid-cols-1 2xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Choice Source</label>
                                                <div className="relative">
                                                    <select
                                                        className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold appearance-none outline-none focus:border-primary transition-all"
                                                        value={field.source || ""}
                                                        onBlur={handleBlur}
                                                        onChange={(e) => {
                                                            const newSource = e.target.value || undefined;
                                                            updateField(idx, "source", newSource);
                                                            if (newSource) {
                                                                updateField(idx, "options", []);
                                                            }
                                                        }}
                                                    >
                                                        <option value="">Manual Entry</option>
                                                        <option value="COUNTRIES">Automatic: Countries</option>
                                                        <option value="STATES">Automatic: States</option>
                                                        <option value="LGAS">Automatic: LGAs</option>
                                                    </select>
                                                    <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>
                                            </div>

                                            {field.source && (
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Link to Field</label>
                                                    <div className="relative">
                                                        <select
                                                            className="w-full p-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold appearance-none outline-none focus:border-primary transition-all"
                                                            value={field.dependsOn || ""}
                                                            onBlur={handleBlur}
                                                            onChange={(e) => updateField(idx, "dependsOn", e.target.value || undefined)}
                                                        >
                                                            <option value="">Independent</option>
                                                            {registration.fields
                                                                .filter((f, i) => i !== idx && (f.type === 'select' || f.type === 'text'))
                                                                .map((f, i) => (
                                                                    <option key={i} value={f.name || f.label.toLowerCase().replace(/\s+/g, '-')}>
                                                                        {f.label || `Field ${i + 1}`}
                                                                    </option>
                                                                ))
                                                            }
                                                        </select>
                                                        <ChevronDown size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-1">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                    {field.source ? "Auto-Managed" : "Your Options"}
                                                </p>
                                                {!field.source && (
                                                    <button
                                                        onClick={() => {
                                                            addFieldOption(idx);
                                                            handleBlur();
                                                        }}
                                                        className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
                                                    >
                                                        <Plus size={10} strokeWidth={3} /> Add
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2.5">
                                                {field.source ? (
                                                    <div className="flex items-center gap-2.5 p-3.5 bg-primary/5 rounded-xl border border-primary/10 w-full">
                                                        <Info size={14} className="text-primary shrink-0" />
                                                        <p className="text-[9px] font-semibold text-primary/80 leading-relaxed uppercase tracking-wider">
                                                            Pops from {field.source}.
                                                            {field.dependsOn && <span> Linked to {field.dependsOn}.</span>}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {(field.options || []).map((opt, oIdx) => (
                                                            <div key={oIdx} className="flex items-center gap-1.5 bg-white p-1.5 pl-3 rounded-lg border border-gray-100 shadow-sm group/opt transition-all hover:border-primary/20">
                                                                <input
                                                                    type="text"
                                                                    value={opt}
                                                                    onBlur={handleBlur}
                                                                    onChange={(e) => updateFieldOption(idx, oIdx, e.target.value)}
                                                                    placeholder="Option"
                                                                    className="bg-transparent border-none outline-none text-[10px] font-bold text-gray-600 w-20"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        removeFieldOption(idx, oIdx);
                                                                        handleBlur();
                                                                    }}
                                                                    className="w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-secondary transition-all"
                                                                >
                                                                    <X size={12} strokeWidth={3} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        {(field.options || []).length === 0 && (
                                                            <p className="text-[9px] text-gray-400 italic px-1">Add options for your guests to select.</p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                </React.Fragment>
                             ))}
                          </div>
                       </div>
                    </div>
                 )}

                 {subStep === 4 && (
                    <div className="space-y-16 animate-in fade-in duration-500">
                       {/* Section 4: Bio */}
                       <div className="space-y-10 group/section">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 rounded-2xl bg-gray-50 text-secondary flex items-center justify-center transition-all group-hover/section:bg-secondary group-hover/section:text-white shadow-sm border border-gray-100">
                                <FileText size={24} />
                             </div>
                             <div>
                                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Detailed Narrative</h3>
                                  <p className="text-sm text-gray-400 font-medium">Tell the story of your event.</p>
                             </div>
                          </div>
                          <textarea
                            name="description"
                            rows={12}
                            placeholder="Describe your event in detail. What should attendees expect?"
                            className="w-full p-8 bg-white border border-gray-300 rounded-[2.5rem] text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 min-h-[400px] shadow-sm"
                            value={basicInfo.description || ""}
                            onBlur={handleBlur} onChange={handleBasicChange}
                          />
                       </div>
                    </div>
                 )}

                 {subStep === 5 && (
                    <div className="space-y-16 animate-in fade-in duration-500">
                       {/* Section 5: Media */}
                       <div className="space-y-10 group/section">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center shadow-sm border border-gray-100">
                                <ImageIcon size={24} />
                             </div>
                             <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Visual Identity</h3>
                                <p className="text-sm text-gray-400 font-medium">Upload a captivating banner and gallery images.</p>
                             </div>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                             <div
                                className={`bg-gray-50 rounded-[3rem] p-8 border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center space-y-6 group/upload shadow-sm h-full relative overflow-hidden min-h-[400px]
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

                                {mediaInfo.bannerUrl && !isUploading ? (
                                   <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl group-hover/upload:scale-[0.98] transition-transform duration-500">
                                      <Image src={mediaInfo.bannerUrl} alt="Banner" fill unoptimized={true} className="object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                          <div className="bg-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] text-gray-900 shadow-2xl flex items-center gap-3">
                                              <Upload size={16} />
                                              Update Banner
                                          </div>
                                      </div>
                                   </div>
                                ) : isUploading ? (
                                   <div className="flex flex-col items-center gap-6 animate-pulse w-full px-10">
                                       <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center text-primary">
                                            <UploadCloud size={40} className="animate-bounce" />
                                       </div>
                                       <div className="w-full space-y-3">
                                           <div className="flex justify-between text-[10px] font-black text-primary uppercase tracking-widest">
                                               <span>Uploading Art</span>
                                               <span>{uploadProgress}%</span>
                                           </div>
                                           <div className="w-full h-3 bg-primary/10 rounded-full overflow-hidden">
                                               <div
                                                 className="h-full bg-primary transition-all duration-300"
                                                 style={{ width: `${uploadProgress}%` }}
                                               />
                                           </div>
                                       </div>
                                   </div>
                                ) : (
                                   <>
                                      <div className="w-24 h-24 rounded-[2rem] bg-white shadow-xl shadow-gray-200 flex items-center justify-center text-gray-300 group-hover/upload:text-primary group-hover/upload:scale-110 group-hover/upload:rotate-3 transition-all duration-500">
                                        <Plus size={48} />
                                      </div>
                                      <div className="text-center space-y-2">
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-[0.3em]">Drop your masterpiece here</p>
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">or click to browse gallery</p>
                                      </div>
                                      <div className="flex items-center gap-4 pt-4">
                                          <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-[8px] font-black text-gray-400 uppercase tracking-widest">JPG</div>
                                          <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-[8px] font-black text-gray-400 uppercase tracking-widest">PNG</div>
                                          <div className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-[8px] font-black text-gray-400 uppercase tracking-widest">WEBP</div>
                                      </div>
                                   </>
                                )}
                             </div>

                             <div className="space-y-10 flex flex-col justify-center">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Asset Source URL</label>
                                    <div className="relative">
                                        <Globe size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                                        <input
                                          type="text"
                                          name="bannerUrl" autoComplete="off" autoCorrect="off"
                                          placeholder="https://..."
                                          className="w-full pl-14 pr-6 py-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none placeholder:text-gray-400 shadow-sm"
                                          value={mediaInfo.bannerUrl || ""}
                                          onBlur={handleBlur} onChange={handleMediaChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Additional Media Gallery</label>
                                    <div className="flex flex-wrap gap-4">
                                        {mediaInfo.mediaUrls.map((url, idx) => (
                                            <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-100 group">
                                                {url && typeof url === 'string' && url.match(/\.(mp4|webm|ogg)$/) ? (
                                                    <video src={url} className="w-full h-full object-cover" />
                                                ) : url ? (
                                                    <Image src={url} alt="Media" fill unoptimized={true} className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => removeMediaUrl(idx)}
                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 hover:border-primary hover:text-primary cursor-pointer transition-all">
                                            <Plus size={24} />
                                            <span className="text-[8px] font-black uppercase tracking-widest mt-1">Add</span>
                                            <input type="file" multiple className="hidden" onBlur={handleBlur} onChange={handleMediaUrlUpload} accept="image/*,video/*" />
                                        </label>
                                    </div>
                                </div>
                                <div className="bg-gray-900 p-10 rounded-[3rem] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                                    <Sparkles className="text-primary mb-6" size={32} strokeWidth={1.5} />
                                    <h4 className="text-lg font-black text-white tracking-tight mb-3">Optimization Protocol</h4>
                                    <p className="text-sm text-gray-400 font-medium leading-relaxed">
                                        Our engine automatically compresses and serves your images via a global CDN. For best results, use a 16:9 aspect ratio image with at least 1920px width.
                                    </p>
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
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                    <div>
                       <h3 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-3">Ticket Vault</h3>
                       <p className="text-lg text-gray-500 font-medium">Configure access and monetization for your event.</p>
                    </div>
                    <button
                      onClick={addTicket}
                      className="flex items-center gap-3 bg-secondary text-white font-black px-8 py-5 rounded-[2rem] hover:bg-opacity-90 transition-all shadow-3xl shadow-secondary/30 text-[10px] uppercase tracking-[0.25em] active:scale-95 group"
                    >
                      <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                      Create Tier
                    </button>
                 </div>

                 <div className={`grid gap-8 lg:gap-10 ${showPreview ? "grid-cols-1 2xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
                  {tickets.map((ticket, index) => (
                      <div key={ticket.id} className="p-8 md:p-10 bg-gray-50/50 rounded-[3.5rem] border border-gray-100 space-y-10 relative group/ticket hover:bg-white hover:shadow-4xl hover:shadow-secondary/10 transition-all duration-700">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-white text-secondary flex items-center justify-center shadow-xl shadow-gray-200/50 border border-gray-100 group-hover/ticket:bg-secondary group-hover/ticket:text-white transition-all duration-500">
                                   <Ticket size={24} strokeWidth={2} />
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-900 uppercase tracking-[0.3em] text-[10px]">Tier #{index+1}</h4>
                                    <p className="text-sm font-black text-gray-400 mt-1">{ticket.name || 'Untitled Tier'}</p>
                                </div>
                             </div>
                             {tickets.length > 1 && (
                                <button
                                  onClick={() => removeTicket(ticket.id!)}
                                  className="w-14 h-14 flex items-center justify-center text-gray-300 hover:text-secondary bg-white rounded-2xl shadow-sm hover:shadow-2xl transition-all border border-gray-100 group/trash"
                                >
                                   <Trash2 size={20} className="group-hover/trash:rotate-12 transition-transform" />
                                </button>
                             )}
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
                                   onBlur={handleBlur} onChange={(e) => updateTicket(ticket.id!, "name", e.target.value)}
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
                                   value={ticket.description}
                                   onBlur={handleBlur} onChange={(e) => updateTicket(ticket.id!, "description", e.target.value)}
                                />
                             </div>

                             <div className={`grid gap-8 ${showPreview ? "grid-cols-1 2xl:grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <MousePointer2 size={12} className="text-secondary" />
                                       Pricing Model
                                   </label>
                                   <div className="relative">
                                       <select
                                          className="w-full pl-5 pr-10 py-5 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none appearance-none shadow-sm"
                                          value={ticket.type}
                                          onBlur={handleBlur} onChange={(e) => updateTicket(ticket.id!, "type", e.target.value as TicketType)}
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
                                          onBlur={handleBlur} onChange={(e) => updateTicket(ticket.id!, "price", parseFloat(e.target.value))}
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
                                      onBlur={handleBlur} onChange={(e) => updateTicket(ticket.id!, "totalQuantity", parseInt(e.target.value))}
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
                                      onBlur={handleBlur} onChange={(e) => updateTicket(ticket.id!, "groupSize", parseInt(e.target.value))}
                                   />
                                </div>
                             </div>

                             <div className="pt-6 border-t border-gray-100 space-y-6">
                                <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Early Bird Configuration (Optional)</h5>
                                <div className={`grid gap-6 ${showPreview ? "grid-cols-1 2xl:grid-cols-3" : "grid-cols-1 sm:grid-cols-3"}`}>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase">Discount Price</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-[10px]">₦</span>
                                            <input
                                                type="number"
                                                disabled={ticket.type === "FREE"}
                                                className="w-full pl-8 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none disabled:bg-gray-100 disabled:opacity-50"
                                                value={ticket.earlyBirdPrice}
                                                onBlur={handleBlur} onChange={(e) => updateTicket(ticket.id!, "earlyBirdPrice", parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase">Units Limit</label>
                                        <input
                                            type="number"
                                            disabled={ticket.type === "FREE"}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none disabled:bg-gray-100 disabled:opacity-50"
                                            value={ticket.earlyBirdLimit}
                                            onBlur={handleBlur} onChange={(e) => updateTicket(ticket.id!, "earlyBirdLimit", parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase">Expiry Date</label>
                                        <input
                                            type="datetime-local"
                                            disabled={ticket.type === "FREE"}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none disabled:bg-gray-100 disabled:opacity-50"
                                            value={ticket.earlyBirdExpiry}
                                            onBlur={handleBlur} onChange={(e) => updateTicket(ticket.id!, "earlyBirdExpiry", e.target.value)}
                                        />
                                    </div>
                                </div>
                             </div>

                             <div className="pt-6 border-t border-gray-100 space-y-6">
                                <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                                    <Settings size={12} />
                                    Advanced Sales Configuration
                                </h5>
                                <div className={`grid gap-6 ${showPreview ? "grid-cols-1 2xl:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase">Sales Start</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-bold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none"
                                            value={ticket.salesStart}
                                            onBlur={handleBlur} onChange={(e) => updateTicket(ticket.id!, "salesStart", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase">Sales End</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-bold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none"
                                            value={ticket.salesEnd}
                                            onBlur={handleBlur} onChange={(e) => updateTicket(ticket.id!, "salesEnd", e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-400 uppercase">Allocation Type</label>
                                        <select
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-xs font-bold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none"
                                            value={ticket.allocationType}
                                            onBlur={handleBlur} onChange={(e) => updateTicket(ticket.id!, "allocationType", e.target.value as "GENERAL" | "RESERVED")}
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
                                            onBlur={handleBlur} onChange={(e) => updateTicket(ticket.id!, "maxPerOrder", parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 pt-6">
                                        <input
                                            type="checkbox"
                                            id={`isOffline-${ticket.id}`}
                                            className="w-4 h-4 rounded text-secondary focus:ring-secondary border-gray-300"
                                            checked={ticket.isOffline}
                                            onBlur={handleBlur} onChange={(e) => updateTicket(ticket.id!, "isOffline", e.target.checked)}
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
                                        onClick={() => addQuantityDiscount(ticket.id!)}
                                        className="text-[9px] font-black text-secondary uppercase tracking-widest hover:underline flex items-center gap-1"
                                    >
                                        <Plus size={10} /> Add Rule
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {ticket.quantityDiscounts?.map((discount, dIndex) => (
                                        <div key={dIndex} className={`grid gap-4 p-4 bg-gray-100/50 rounded-2xl items-end ${showPreview ? "grid-cols-1 2xl:grid-cols-3" : "grid-cols-1 sm:grid-cols-3"}`}>
                                            <div className="space-y-2">
                                                <label className="text-[8px] font-bold text-gray-400 uppercase">Min Quantity</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none"
                                                    value={discount.minQuantity}
                                                    onBlur={handleBlur} onChange={(e) => updateQuantityDiscount(ticket.id!, dIndex, "minQuantity", parseInt(e.target.value))}
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
                                                        onBlur={handleBlur} onChange={(e) => updateQuantityDiscount(ticket.id!, dIndex, "price", parseFloat(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={() => removeQuantityDiscount(ticket.id!, dIndex)}
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
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                    <div>
                       <h3 className="text-4xl font-black text-gray-900 tracking-tight leading-none mb-3">Event Timeline</h3>
                       <p className="text-lg text-gray-500 font-medium">Add sessions, keynotes, or breaks to your event.</p>
                    </div>
                    <button
                      onClick={addSession}
                      className="flex items-center gap-3 bg-primary text-white font-black px-8 py-5 rounded-[2rem] hover:shadow-2xl hover:shadow-primary/30 transition-all text-[10px] uppercase tracking-[0.25em] active:scale-95 group"
                    >
                      <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                      Add Session
                    </button>
                 </div>

                 <div className="space-y-8">
                  {sessions.map((session, index) => (
                      <div key={session.id} className="relative group animate-in slide-in-from-left-8 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                          <div className="bg-gray-50/50 rounded-[3rem] p-8 md:p-12 space-y-10 border border-gray-100 transition-all duration-700 hover:bg-white hover:shadow-3xl hover:shadow-gray-200/50 relative overflow-hidden group/card">
                             {/* Floating Index Decor */}
                             <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover/card:opacity-100 transition-opacity"></div>

                             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-white text-primary flex items-center justify-center font-black text-xl shadow-xl shadow-gray-200/50 border border-gray-100 group-hover/card:bg-primary group-hover/card:text-white transition-all duration-500">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-1">Session Protocol</p>
                                        <h4 className="text-xl font-black text-gray-900 tracking-tight">{session.title || 'Draft Session'}</h4>
                                    </div>
                                </div>
                                {sessions.length > 1 && (
                                   <button
                                     onClick={() => removeSession(session.id)}
                                     className="w-14 h-14 flex items-center justify-center text-gray-300 hover:text-secondary bg-white rounded-2xl shadow-sm hover:shadow-2xl hover:scale-110 transition-all border border-gray-100 group/trash"
                                   >
                                      <Trash2 size={20} className="group-hover/trash:rotate-12 transition-transform" />
                                   </button>
                                )}
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                                <div className="space-y-3 md:col-span-2">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <Type size={12} className="text-primary" />
                                       Session Title
                                   </label>
                                   <input
                                   type="text"
                                   placeholder="e.g., Welcome Keynote: Future of Gobokin"
                                   className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                   value={session.title}
                                   onBlur={handleBlur} onChange={(e) => updateSession(session.id, "title", e.target.value)}
                                   />
                                </div>

                                <div className="space-y-3 md:col-span-2">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <FileText size={12} className="text-primary" />
                                       Session Description
                                   </label>
                                   <textarea
                                   rows={3}
                                   placeholder="Deep dive into the future roadmap..."
                                   className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                   value={session.description}
                                   onBlur={handleBlur} onChange={(e) => updateSession(session.id, "description", e.target.value)}
                                   />
                                </div>

                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <History size={12} className="text-primary" />
                                       Starts At
                                   </label>
                                   <input
                                   type="datetime-local"
                                   className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                   value={session.startTime}
                                   min={basicInfo.startDate}
                                   max={basicInfo.endDate}
                                   onBlur={handleBlur} onChange={(e) => updateSession(session.id, "startTime", e.target.value)}
                                   />
                                </div>
                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <History size={12} className="text-primary" />
                                       Ends At
                                   </label>
                                   <input
                                   type="datetime-local"
                                   className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                   value={session.endTime}
                                   min={session.startTime || basicInfo.startDate}
                                   max={basicInfo.endDate}
                                   onBlur={handleBlur} onChange={(e) => updateSession(session.id, "endTime", e.target.value)}
                                   />
                                </div>

                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <MapPin size={12} className="text-primary" />
                                       Room / Stage
                                   </label>
                                   <div className="grid grid-cols-2 gap-4">
                                      <input
                                      type="text"
                                      placeholder="Room A"
                                      className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                      value={session.room}
                                      onBlur={handleBlur} onChange={(e) => updateSession(session.id, "room", e.target.value)}
                                      />
                                      <input
                                      type="text"
                                      placeholder="Main Stage"
                                      className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                      value={session.stage}
                                      onBlur={handleBlur} onChange={(e) => updateSession(session.id, "stage", e.target.value)}
                                      />
                                   </div>
                                </div>

                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <Zap size={12} className="text-primary" />
                                       Session Type
                                   </label>
                                   <input
                                   type="text"
                                   placeholder="Keynote, Workshop, Break"
                                   className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none shadow-sm"
                                   value={session.sessionType}
                                   onBlur={handleBlur} onChange={(e) => updateSession(session.id, "sessionType", e.target.value)}
                                   />
                                </div>

                                <div className="space-y-3 md:col-span-2">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <Users size={12} className="text-primary" />
                                       Assign Speakers
                                   </label>
                                   <div className="flex flex-wrap gap-4 p-6 bg-white border border-gray-300 rounded-[2rem] shadow-sm">
                                      {speakers.length === 0 ? (
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">No speakers added in Step 1</p>
                                      ) : (
                                        speakers.map((speaker, sIdx) => {
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
                                                updateSession(session.id, "speakerIds", newIds);
                                                updateSession(session.id, "speakerNames", newNames);
                                                handleBlur();
                                              }}
                                              className={`flex items-center gap-3 px-5 py-3 rounded-2xl border-2 transition-all ${
                                                isSelected
                                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                                : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200'
                                              }`}
                                            >
                                              <div className="relative w-6 h-6 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                                                {speaker.imageUrl ? (
                                                  <Image src={speaker.imageUrl} alt={speaker.name} fill className="object-cover" />
                                                ) : <User size={12} className="m-auto mt-1" />}
                                              </div>
                                              <span className="text-[10px] font-black uppercase tracking-widest">{speaker.name}</span>
                                              {isSelected && <CheckCircle2 size={12} />}
                                            </button>
                                          );
                                        })
                                      )}
                                   </div>
                                </div>
                             </div>
                          </div>
                      </div>
                  ))}
                 </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="bg-white px-8 md:px-16 py-12 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-8">
             <button
               onClick={() => {
                 if (currentStep === 1 && subStep > 1) {
                   setSubStep(subStep - 1);
                 } else {
                   setCurrentStep(currentStep - 1);
                 }
               }}
               disabled={(currentStep === 1 && subStep === 1) || loading}
               className={`flex items-center gap-4 font-black text-[10px] uppercase tracking-[0.3em] transition-all px-10 py-5 rounded-3xl border-2 ${
                 (currentStep === 1 && subStep === 1) ? "opacity-0 invisible" : "bg-white text-gray-400 border-gray-100 hover:text-gray-900 hover:border-gray-900 shadow-sm"
               }`}
             >
               <ArrowLeft size={16} />
               Back
             </button>

             <div className="flex items-center gap-8">
                 <div className="hidden sm:flex flex-col items-end">
                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.4em] mb-1">Next Up</p>
                    <span className="text-xs font-black text-gray-900 uppercase tracking-widest">
                        {currentStep < 3 ? (currentStep === 1 && subStep < 5 ? 'Details' : steps[currentStep].title) : 'Finish'}
                    </span>
                 </div>
                 {currentStep === 1 && (
                    <button
                      onClick={() => {
                        if (subStep < 4) {
                          setSubStep(subStep + 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else if (subStep === 4) {
                          createEventBase();
                        } else {
                          // Phase 5 completed, go to step 2
                          setCurrentStep(2);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      disabled={loading}
                      className="flex items-center gap-4 bg-primary text-white font-black px-14 py-6 rounded-[2.5rem] hover:bg-opacity-90 transition-all shadow-3xl shadow-primary/30 uppercase tracking-[0.3em] text-[11px] group active:scale-95"
                    >
                      {loading ? "Saving..." : subStep < 4 ? "Next" : subStep === 4 ? "Create Event & Add Visuals" : "Continue to Ticketing"}
                      <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                    </button>
                 )}
                 {currentStep === 2 && (
                    <button
                      onClick={createTickets}
                      disabled={loading}
                      className="flex items-center gap-4 bg-primary text-white font-black px-14 py-6 rounded-[2.5rem] hover:bg-opacity-90 transition-all shadow-3xl shadow-primary/30 uppercase tracking-[0.3em] text-[11px] group active:scale-95"
                    >
                      {loading ? "Saving..." : "Save Tickets"}
                      <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-500" />
                    </button>
                 )}
                 {currentStep === 3 && (
                    <button
                      onClick={createSessions}
                      disabled={loading}
                      className="flex items-center gap-4 bg-secondary text-white font-black px-14 py-6 rounded-[2.5rem] hover:bg-opacity-90 transition-all shadow-3xl shadow-secondary/30 uppercase tracking-[0.3em] text-[11px] disabled:opacity-50 active:scale-95 group"
                    >
                      {loading ? "Finalizing..." : "Complete Setup"}
                      <ShieldCheck size={20} className="group-hover:rotate-12 transition-transform" />
                    </button>
                 )}
             </div>
          </div>
        </div>

        {/* Live Preview Pane (Desktop) */}
        {showPreview && (
          <div className="hidden lg:block w-[400px] xl:w-[480px] shrink-0 animate-in fade-in slide-in-from-right-12 duration-1000 ease-out">
            <LivePreview
              basicInfo={basicInfo}
              mediaInfo={mediaInfo}
              speakers={speakers}
              sessions={sessions}
              tickets={tickets}
              agendaEnabled={basicInfo.agendaEnabled}
            />
          </div>
        )}
      </div>

      {/* Live Preview Modal (Mobile) */}
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
              basicInfo={basicInfo}
              mediaInfo={mediaInfo}
              speakers={speakers}
              sessions={sessions}
              tickets={tickets}
              agendaEnabled={basicInfo.agendaEnabled}
            />
          </div>
        </div>
      )}

      {/* Visual Support Badges */}
      <div className="mt-20 flex flex-wrap items-center justify-center gap-16 opacity-10 grayscale pointer-events-none px-4">
          <div className="flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] text-gray-900">
              <ShieldCheck size={20} strokeWidth={1.5} />
              Protocol Secured
          </div>
          <div className="flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] text-gray-900">
              <Globe size={20} strokeWidth={1.5} />
              Decentralized Edge
          </div>
          <div className="flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] text-gray-900">
              <Share2 size={20} strokeWidth={1.5} />
              Viral Propagation
          </div>
      </div>
    </div>
  );
};

export default CreateEvent;
