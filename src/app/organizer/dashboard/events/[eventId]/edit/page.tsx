"use client";
import React, { useState, useCallback, useEffect, useRef, useMemo, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import { Reorder } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Globe,
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
  Layout,
  Type,
  FileText,
  Eye,
  EyeOff,
  CheckCircle2,
  Zap,
  UploadCloud,
  Upload,
  XCircle, X,
  Settings,
  Coins,
  ChevronDown,
  Layers,
  MousePointer2
} from "lucide-react";
import api from "@/services/api";
import { RegistrationFieldItem } from "@/components/organizer/RegistrationFieldItem";
import { EventReminderSection } from "@/components/organizer/EventReminderSection";
import axios from "axios";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { EventType, RegistrationMode, RegistrationField, Speaker, TicketType } from "@/types";
import { useOrganizerRules } from "@/hooks/useOrganizerRules";
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
    hideLocationDetails?: boolean;
  };
  mediaInfo: {
    bannerUrl: string;
    mediaUrls: (string | { file: File; preview: string })[];
    seoTitle: string;
    seoDescription: string;
  };
  speakers: (Speaker & { previewUrl?: string })[];
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
    isSpecial?: boolean;
  }[];
  registration: {
    isGroupingEnabled: boolean;
    fields: RegistrationField[];
  };
}

const LivePreview = ({ basicInfo, mediaInfo, speakers, sessions, tickets, agendaEnabled, registration }: LivePreviewProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!agendaEnabled && activeTab === "schedule") {
      setActiveTab("overview");
    }
  }, [agendaEnabled, activeTab]);

  const tabs = ["overview", ...(agendaEnabled ? ["schedule"] : []), "speakers", "tickets", "registration"];

  const tabConfig = {
    overview: { label: "Overview", icon: Info },
    schedule: { label: "Schedule", icon: Clock },
    speakers: { label: "Speakers", icon: User },
    tickets: { label: "Tickets", icon: Ticket },
    registration: { label: "Form", icon: FileText },
  };

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
                <p className="text-[11px] font-bold text-gray-700 truncate leading-none">
                  {basicInfo.hideLocationDetails ? "Available for registered guests" : (basicInfo.location || basicInfo.virtualLink || "Location pending")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 transition-all hover:bg-white hover:shadow-lg hover:shadow-gray-200/20">
              <div className="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-100">
                <Users size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Expected Guest</p>
                <p className="text-[11px] font-bold text-gray-700 leading-none">{basicInfo.capacity || 0} Slots Available</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-6">
           <div className="flex flex-nowrap items-center gap-1.5 p-1.5 bg-gray-50 rounded-2xl border border-gray-100 w-full overflow-x-auto no-scrollbar">
              {tabs.map(tab => {
                const config = tabConfig[tab as keyof typeof tabConfig];
                const Icon = config ? config.icon : Info;
                const label = config ? config.label : tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                      activeTab === tab
                        ? "bg-white text-primary shadow-sm border border-gray-100 scale-[1.02]"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
                    }`}
                  >
                    <Icon size={12} className={activeTab === tab ? "text-primary" : "text-gray-400"} />
                    <span>{label}</span>
                  </button>
                );
              })}
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
                              {mediaInfo.mediaUrls.map((item, i) => {
                                  const url = typeof item === 'string' ? item : item.preview;
                                  const isVideo = typeof item === 'string'
                                    ? item.match(/\.(mp4|webm|ogg)$/)
                                    : item.file.type.startsWith('video/');

                                  return (
                                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
                                        {url && isVideo ? (
                                            <video src={url} className="w-full h-full object-cover" />
                                        ) : url ? (
                                            <Image src={url} alt="Gallery" fill unoptimized={true} className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <ImageIcon size={20} />
                                            </div>
                                        )}
                                    </div>
                                  );
                              })}
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
                                {item.speakerNames && item.speakerNames.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <User size={10} className="text-secondary" />
                                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{item.speakerNames.join(', ')}</p>
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
                <div className="space-y-6 animate-in fade-in duration-500">
                   {tickets.filter(t => !t.isSpecial).length > 0 && (
                     <div className="space-y-3">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Standard Access</p>
                        {tickets.filter(t => !t.isSpecial).map((ticket, i) => (
                          <div key={i} className="p-5 rounded-[1.5rem] border border-gray-100 bg-gray-50/50 space-y-4 transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-200/20 group">
                              <div className="flex justify-between items-center">
                                <p className="text-[11px] font-black text-gray-900 group-hover:text-primary transition-colors">{ticket.name || "Unnamed Ticket Type"}</p>
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
                   {tickets.filter(t => t.isSpecial).length > 0 && (
                     <div className="space-y-3 pt-2">
                        <p className="text-[8px] font-black text-amber-500 uppercase tracking-[0.2em] ml-2">Special Access</p>
                        {tickets.filter(t => t.isSpecial).map((ticket, i) => (
                          <div key={i} className="p-5 rounded-[1.5rem] border border-amber-100 bg-amber-50/30 space-y-4 transition-all hover:bg-white hover:shadow-xl hover:shadow-amber-200/20 group">
                              <div className="flex justify-between items-center">
                                <p className="text-[11px] font-black text-gray-900 group-hover:text-amber-600 transition-colors">{ticket.name || "Unnamed Ticket Type"}</p>
                                <div className="flex gap-1.5">
                                  <span className="text-[8px] font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-lg uppercase tracking-widest border border-amber-200/50">Special</span>
                                  <span className="text-[8px] font-black text-secondary bg-secondary/5 px-2 py-1 rounded-lg uppercase tracking-widest border border-secondary/10">{ticket.type}</span>
                                </div>
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
              )}

              {activeTab === "registration" && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                    <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Form Preview</h4>
                  </div>

                  <div className="space-y-6">
                    {registration.isGroupingEnabled && (
                      <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 space-y-5 relative overflow-hidden group">
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border border-primary/10">
                            <Users size={18} />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none">Group Details</h4>
                            <p className="text-[8px] font-bold text-primary/60 uppercase tracking-tighter mt-1">Shared Information</p>
                          </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                          {registration.fields.filter(f => !f.isPerAttendee).map((field, i) => (
                            <div key={i} className="space-y-2">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                {field.label} {field.required && <span className="text-secondary">*</span>}
                              </label>
                              <div className="w-full h-11 bg-white border border-gray-100 rounded-xl px-4 flex items-center">
                                <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                                  {field.type === 'select' ? 'Select Option...' : field.type === 'number' ? '0' : 'Enter detail...'}
                                </span>
                              </div>
                            </div>
                          ))}
                          {registration.fields.filter(f => !f.isPerAttendee).length === 0 && (
                            <p className="text-[9px] text-gray-400 italic">No shared fields configured</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className={`p-6 rounded-[2rem] bg-secondary/5 border border-secondary/10 space-y-5 relative overflow-hidden`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-secondary shadow-sm border border-secondary/10">
                          <User size={18} />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-none">Attendee Details</h4>
                          <p className="text-[8px] font-bold text-secondary/60 uppercase tracking-tighter mt-1">Individual Information</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {(registration.isGroupingEnabled
                          ? registration.fields.filter(f => f.isPerAttendee)
                          : registration.fields
                        ).map((field, i) => (
                          <div key={i} className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">
                              {field.label} {field.required && <span className="text-secondary">*</span>}
                            </label>
                            <div className="w-full h-11 bg-white border border-gray-100 rounded-xl px-4 flex items-center">
                              <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                                {field.type === 'select' ? 'Select Option...' : field.type === 'number' ? '0' : 'Enter detail...'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};


const getLocalDateTimeString = () => {
  const d = new Date();
  const pad = (num: number) => String(num).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const EditEventContent = () => {
  const router = useRouter();
  const { getRule } = useOrganizerRules();
  const { eventId } = useParams();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [subStep, setSubStep] = useState(1);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Deep linking to steps and subSteps
  useEffect(() => {
    const step = searchParams.get("step");
    if (step) {
      const parsedStep = parseInt(step);
      if (!isNaN(parsedStep)) {
        setCurrentStep(parsedStep);
      }
    }
    const sub = searchParams.get("subStep");
    if (sub) {
      const parsedSub = parseInt(sub);
      if (!isNaN(parsedSub)) {
        setSubStep(parsedSub);
      }
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(true);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [organizerSlug, setOrganizerSlug] = useState<string>("");

  // Deferred Uploads State
  const [bannerFile, setBannerFile] = useState<File | null>(null);

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
    tags: [] as string[],
    isPublic: true,
    status: "UPCOMING",
    agendaEnabled: false,
    hideLocationDetails: false,
    isWaitlistEnabled: false,
    remindersEnabled: false,
    reminderCustomText: "",
    reminderFrequencies: [] as number[],
    useDefaultFrequencies: true,
  });

  const visibleSteps = useMemo(() =>
    basicInfo.agendaEnabled ? steps : steps.slice(0, 2),
  [basicInfo.agendaEnabled]);

  const [showAddFieldDropdown, setShowAddFieldDropdown] = useState(false);
  const [showRegInfo, setShowRegInfo] = useState(false);
  const [keywordInput, setKeywordInput] = useState("");
  const addFieldDropdownRef = useRef<HTMLDivElement>(null);
  const regInfoRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(addFieldDropdownRef, () => setShowAddFieldDropdown(false));
  useOnClickOutside(regInfoRef, () => setShowRegInfo(false));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isPreviewActive = isMobile ? isPreviewModalOpen : showPreview;

  const [mediaInfo, setMediaInfo] = useState({
    bannerUrl: "",
    mediaUrls: [] as (string | { file: File; preview: string })[],
    seoTitle: "",
    seoDescription: "",
    socialImage: "",
  });

  const [speakers, setSpeakers] = useState<(Speaker & { pendingFile?: File; previewUrl?: string })[]>([]);

  const [sessions, setSessions] = useState<{
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    location: string;
    room?: string;
    stage?: string;
    sessionType?: string;
    speakerIds?: string[];
    speakerNames?: string[];
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
    isSpecial?: boolean;
    quantityDiscounts?: { minQuantity: number; discountPercentage: number; price?: number }[];
  }[]>([]);

  const [registration, setRegistration] = useState({
    mode: "FULL_DETAILS" as RegistrationMode,
    isGroupingEnabled: false,
    enforceUniqueGroupNames: true,
    fields: [] as RegistrationField[],
  });

  // Fetch Event Data
  const fetchEvent = useCallback(async () => {
    try {
      const [eventRes, categoriesRes, profileRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get("/events/utils/categories"),
        api.get("/events/my-organizer-profile")
      ]);

      const event = eventRes.data.data;

      // Populate Categories
      const categoryData = categoriesRes.data.data || [];
      setCategories(categoryData.map((cat: string | { name: string }) => typeof cat === 'string' ? cat : cat.name));

      if (profileRes.data?.data?.slug) {
        setOrganizerSlug(profileRes.data.data.slug);
      }

      // Format dates for input[type="datetime-local"]
      const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toISOString().slice(0, 16) : "";

      setIsPublished(!!event.isPublished);

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
        tags: Array.isArray(event.tags) ? event.tags : [],
        isPublic: event.isPublic !== false,
        status: event.status || "UPCOMING",
        agendaEnabled: !!event.agendaEnabled,
        hideLocationDetails: !!event.hideLocationDetails,
        isWaitlistEnabled: !!event.isWaitlistEnabled,
        remindersEnabled: !!event.remindersEnabled,
        reminderCustomText: event.reminderCustomText || "",
        reminderFrequencies: Array.isArray(event.reminderFrequencies) ? event.reminderFrequencies : [],
        useDefaultFrequencies: !Array.isArray(event.reminderFrequencies) || event.reminderFrequencies.length === 0,
      });

      setMediaInfo({
        bannerUrl: event.bannerUrl || "",
        mediaUrls: (event.mediaUrls || []) as (string | { file: File; preview: string })[],
        seoTitle: event.seoTitle || "",
        seoDescription: event.seoDescription || "",
        socialImage: event.socialImage || "",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSpeakers((event.speakers || []).map((s: any) => ({
        ...s,
        id: s.id || s._id,
        name: s.name || "",
        title: s.title || "",
        bio: s.bio || "",
        imageUrl: s.imageUrl || ""
      })));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSessions((event.sessions || []).map((s: any) => ({
        ...s,
        id: s.id || s._id || Math.random().toString(),
        startTime: formatDate(s.startTime),
        endTime: formatDate(s.endTime),
        speakerIds: s.speakerIds || [],
        speakerNames: s.speakerNames || []
      })));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setTickets((event.tickets || []).map((t: any) => ({
        ...t,
        id: t.id || t._id || Math.random().toString(),
        earlyBirdExpiry: formatDate(t.earlyBirdExpiry),
        salesStart: formatDate(t.salesStart || ""),
        salesEnd: formatDate(t.salesEnd || ""),
        allocationType: t.allocationType || "GENERAL",
        maxPerOrder: t.maxPerOrder || 10,
        isOffline: !!t.isOffline,
        isSpecial: !!t.isSpecial,
        quantityDiscounts: t.quantityDiscounts || []
      })));

      setRegistration({
        mode: event.registrationMode || "FULL_DETAILS",
        isGroupingEnabled: !!event.isGroupingEnabled,
        enforceUniqueGroupNames: !!event.enforceUniqueGroupNames,
        fields: (event.registrationFields || [
          { name: "fullName", label: "Full Name", type: "text", required: true, isPerAttendee: true },
          { name: "email", label: "Email Address", type: "text", required: true, isPerAttendee: true },
          { name: "phone", label: "Phone Number", type: "number", required: true, isPerAttendee: true },
        ]).map((f: RegistrationField) => ({
          ...f,
          id: f.id || f.name || Math.random().toString()
        })),
      });

    } catch (error) {
      console.error("Failed to fetch event:", error);
      Swal.fire("Error", "Could not load event data.", "error");
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  // Media Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [_, setUploadProgress] = useState(0);

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
    } catch (_error) {
      console.error('Upload failed:', _error);
      throw _error;
    }
  };

  const handleBannerUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setBannerFile(file);
    setMediaInfo(prev => ({ ...prev, bannerUrl: previewUrl }));
    Swal.toast.fire({ icon: 'success', title: 'Banner art selected (pending save)!' });
  }, []);

  const handleMediaUrlUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMedia = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setMediaInfo(prev => ({ ...prev, mediaUrls: [...prev.mediaUrls, ...newMedia] }));
    Swal.toast.fire({ icon: 'success', title: 'Media added (pending save)!' });
  };

  const removeMediaUrl = async (idx: number) => {
      setMediaInfo(prev => ({ ...prev, mediaUrls: prev.mediaUrls.filter((_, i) => i !== idx) }));
  };

  // Handlers
  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "capacity") {
      let newCapacity = parseInt(value) || 0;

      // Check MAX_GUESTS rule
      const maxGuestsRule = getRule('MAX_GUESTS');
      if (maxGuestsRule) {
        const limit = parseInt(maxGuestsRule.value as string);
        if (limit !== -1 && newCapacity > limit) {
          newCapacity = limit;
          Swal.toast.fire({
            icon: "warning",
            title: `Capacity capped at maximum ${limit} guests.`
          });
          Swal.fire({
            title: maxGuestsRule.title || 'Capacity Restricted',
            text: maxGuestsRule.uxContext || `Your current plan only allows events with up to ${limit} guests.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Upgrade Now',
            cancelButtonText: 'Adjust Capacity',
            confirmButtonColor: '#295FA7',
          }).then((result) => {
            if (result.isConfirmed) {
              router.push('/organizer/dashboard/settings?tab=subscriptions');
            }
          });
        }
      }

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
      if (name === "endDate") {
        setTickets(prevTickets => prevTickets.map(t => ({ ...t, salesEnd: value })));
      }
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

    const previewUrl = URL.createObjectURL(file);
    setSpeakers(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        pendingFile: file,
        previewUrl: previewUrl,
        imageUrl: previewUrl
      };
      return updated;
    });
    Swal.toast.fire({ icon: 'success', title: 'Speaker image selected (pending save)!' });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateSession = (sessionId: string, field: string, value: any) => {
    setSessions(sessions.map(s => s.id === sessionId ? { ...s, [field]: value } : s));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  const addField = (fieldType: 'custom' | 'location' | 'address' = 'custom') => {
    const isPerAttendee = registration.isGroupingEnabled ? true : false;

    if (fieldType === 'location') {
      setRegistration(prev => {
        const newFields = [...prev.fields];
        const sources = ["COUNTRIES", "STATES", "LGAS"];
        const labels = ["Country", "State", "LGA"];
        const names = ["country", "state", "lga"];
        const depends = [null, "country", "state"];

        sources.forEach((source, i) => {
          if (!newFields.find(f => f.source === source)) {
            newFields.push({
              id: Math.random().toString(),
              name: names[i],
              label: labels[i],
              type: "select",
              source: source as "COUNTRIES" | "STATES" | "LGAS",
              dependsOn: depends[i] as string,
              required: true,
              isPerAttendee,
              options: []
            });
          }
        });

        return { ...prev, fields: newFields };
      });
    } else if (fieldType === 'address') {
      setRegistration({
        ...registration,
        fields: [...registration.fields, {
          id: Math.random().toString(),
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
          id: Math.random().toString(),
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

  const groupFields = useMemo(() =>
    registration.fields.filter(f => !f.isPerAttendee),
  [registration.fields]);

  const attendeeFields = useMemo(() =>
    registration.fields.filter(f => f.isPerAttendee),
  [registration.fields]);

  const setGroupFields = useCallback((newFields: RegistrationField[]) => {
    setRegistration(prev => {
      const currentAttendeeFields = prev.fields.filter(f => f.isPerAttendee);
      const updatedFields = [...newFields, ...currentAttendeeFields];
      return {
        ...prev,
        fields: updatedFields
      };
    });
  }, []);

  const setAttendeeFields = useCallback((newFields: RegistrationField[]) => {
    setRegistration(prev => {
      const currentGroupFields = prev.fields.filter(f => !f.isPerAttendee);
      const updatedFields = [...currentGroupFields, ...newFields];
      return {
        ...prev,
        fields: updatedFields
      };
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateField = (index: number, field: string, value: any) => {
    setRegistration(prev => {
        const newFields = [...prev.fields];
        const updatedField = { ...newFields[index], [field]: value };

        // Auto-setup logic for source selection
        if (field === "source" && value) {
            updatedField.type = "select";
            updatedField.options = [];
            if (value === "COUNTRIES") {
                updatedField.label = "Country";
                updatedField.name = "country";

                // Check if state/lga already exist, if so, promote/re-use them to avoid duplication
                const stateFieldIdx = newFields.findIndex(f => f.source === 'STATES' || f.name === 'state' || f.label.toLowerCase() === 'state');
                const lgaFieldIdx = newFields.findIndex(f => f.source === 'LGAS' || f.name === 'lga' || f.label.toLowerCase() === 'lga');

                if (stateFieldIdx !== -1) {
                    newFields[stateFieldIdx] = {
                        ...newFields[stateFieldIdx],
                        name: "state",
                        label: "State",
                        type: "select",
                        source: "STATES",
                        dependsOn: "country",
                        required: updatedField.required,
                        isPerAttendee: updatedField.isPerAttendee,
                        options: []
                    };
                } else {
                    newFields.push({
                        id: Math.random().toString(),
                        name: "state",
                        label: "State",
                        type: "select",
                        source: "STATES",
                        dependsOn: "country",
                        required: updatedField.required,
                        isPerAttendee: updatedField.isPerAttendee,
                        options: []
                    });
                }

                if (lgaFieldIdx !== -1) {
                    newFields[lgaFieldIdx] = {
                        ...newFields[lgaFieldIdx],
                        name: "lga",
                        label: "LGA",
                        type: "select",
                        source: "LGAS",
                        dependsOn: "state",
                        required: updatedField.required,
                        isPerAttendee: updatedField.isPerAttendee,
                        options: []
                    };
                } else {
                    newFields.push({
                        id: Math.random().toString(),
                        name: "lga",
                        label: "LGA",
                        type: "select",
                        source: "LGAS",
                        dependsOn: "state",
                        required: updatedField.required,
                        isPerAttendee: updatedField.isPerAttendee,
                        options: []
                    });
                }
            } else if (value === "STATES") {
                updatedField.label = "State";
                updatedField.name = "state";
                // Find a country field to depend on
                const countryField = newFields.find(f => f.source === 'COUNTRIES');
                if (countryField) updatedField.dependsOn = countryField.name || "country";

                const lgaFieldIdx = newFields.findIndex(f => f.source === 'LGAS' || f.name === 'lga' || f.label.toLowerCase() === 'lga');
                if (lgaFieldIdx !== -1) {
                    newFields[lgaFieldIdx] = {
                        ...newFields[lgaFieldIdx],
                        name: "lga",
                        label: "LGA",
                        type: "select",
                        source: "LGAS",
                        dependsOn: "state",
                        required: updatedField.required,
                        isPerAttendee: updatedField.isPerAttendee,
                        options: []
                    };
                } else {
                    newFields.push({
                        id: Math.random().toString(),
                        name: "lga",
                        label: "LGA",
                        type: "select",
                        source: "LGAS",
                        dependsOn: "state",
                        required: updatedField.required,
                        isPerAttendee: updatedField.isPerAttendee,
                        options: []
                    });
                }
            } else if (value === "LGAS" || value === "CITY") {
                updatedField.label = value === "CITY" ? "City" : "LGA";
                updatedField.name = value === "CITY" ? "city" : "lga";
                updatedField.source = "LGAS";
                // Find a state field to depend on
                const stateField = newFields.find(f => f.source === 'STATES');
                if (stateField) updatedField.dependsOn = stateField.name || "state";
            }
        }

        newFields[index] = updatedField;
        const orderedFields = ensureCorrectDependencyOrder(newFields);
        return { ...prev, fields: orderedFields };
    });
  };

  const addFieldOption = (fieldIdx: number) => {
    setRegistration(prev => {
        const newFields = [...prev.fields];
        const currentOptions = newFields[fieldIdx].options || [];
        newFields[fieldIdx] = { ...newFields[fieldIdx], options: [...currentOptions, ""] };
        return { ...prev, fields: newFields };
    });
  };

  const updateFieldOption = (fieldIdx: number, optionIdx: number, value: string) => {
    setRegistration(prev => {
        const newFields = [...prev.fields];
        const newOptions = [...(newFields[fieldIdx].options || [])];
        newOptions[optionIdx] = value;
        newFields[fieldIdx] = { ...newFields[fieldIdx], options: newOptions };
        return { ...prev, fields: newFields };
    });
  };

  const removeFieldOption = (fieldIdx: number, optionIdx: number) => {
    const newFields = [...registration.fields];
    const newOptions = (newFields[fieldIdx].options || []).filter((_, i) => i !== optionIdx);
    newFields[fieldIdx] = { ...newFields[fieldIdx], options: newOptions };
    setRegistration({ ...registration, fields: newFields });
  };

  const addQuantityDiscount = (ticketId: string) => {
    setTickets(tickets.map(t => {
      if (t.id === ticketId) {
        const discounts = t.quantityDiscounts || [];
        return {
          ...t,
          quantityDiscounts: [...discounts, { minQuantity: 2, discountPercentage: 0 }]
        };
      }
      return t;
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateTicket = async (ticket: any) => {
    // If it's a new ticket, we can't update it individually yet, it will be saved with saveAllChanges
    if (!ticket.id || ticket.id.includes('.')) {
      Swal.fire("Info", "This is a new ticket. Please use 'Finalize & Update' to save it.", "info");
      return;
    }

    if (!ticket.name || ticket.name.trim() === "") {
        Swal.fire("Validation Error", "Ticket must have a name.", "error");
        return;
    }

    try {
      Swal.showLoading();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        name: ticket.name,
        description: ticket.description,
        price: ticket.type === 'FREE' ? 0 : ticket.price,
        type: ticket.type,
        totalQuantity: ticket.totalQuantity,
        groupSize: ticket.groupSize,
        allocationType: ticket.allocationType,
        maxPerOrder: ticket.maxPerOrder,
        salesStart: (ticket.salesStart ? new Date(ticket.salesStart) : new Date()).toISOString(),
        salesEnd: ticket.salesEnd ? new Date(ticket.salesEnd).toISOString() : (basicInfo.endDate ? new Date(basicInfo.endDate).toISOString() : undefined),
        isOffline: ticket.isOffline,
        isSpecial: ticket.isSpecial || false,
        quantityDiscounts: ticket.quantityDiscounts
      };

      if (ticket.type !== 'FREE' && (ticket.earlyBirdLimit || 0) > 0 && (ticket.earlyBirdPrice || 0) > 0) {
          payload.earlyBirdPrice = ticket.earlyBirdPrice;
          payload.earlyBirdLimit = ticket.earlyBirdLimit;
          payload.earlyBirdExpiry = ticket.earlyBirdExpiry ? new Date(ticket.earlyBirdExpiry).toISOString() : undefined;
      }
      await api.patch(`/events/${eventId}/tickets/${ticket.id}`, payload);
      await fetchEvent();
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateSession = async (session: any) => {
    if (!session.id || session.id.includes('.')) {
      Swal.fire("Info", "This is a new session. Please use 'Finalize & Update' to save it.", "info");
      return;
    }

    try {
      Swal.showLoading();
      const payload = {
        title: session.title,
        description: session.description,
        startTime: session.startTime ? new Date(session.startTime).toISOString() : undefined,
        endTime: session.endTime ? new Date(session.endTime).toISOString() : undefined,
        location: session.location,
        room: session.room,
        stage: session.stage,
        sessionType: session.sessionType,
        speakerIds: session.speakerIds,
        speakerNames: session.speakerNames
      };
      await api.patch(`/events/${eventId}/sessions/${session.id}`, payload);
      await fetchEvent();
      Swal.fire("Updated!", "Session updated successfully.", "success");
    } catch (error) {
      Swal.fire("Error", translateError(error), "error");
    }
  };

  // Consolidate Save Handler
  const saveAllChanges = async (shouldRedirect = true) => {
    // Validate Ticket Names
    const emptyTicket = tickets.find(t => !t.name || t.name.trim() === "");
    if (emptyTicket) {
        Swal.fire("Validation Error", "All tickets must have a name.", "error");
        return;
    }

    // Validate Sessions if agenda is enabled
    if (basicInfo.agendaEnabled) {
        const activeSessions = sessions.filter(s => s.title?.trim());
        if (activeSessions.length === 0) {
            Swal.fire("Validation Error", "With Agenda enabled, you must define at least one session.", "error");
            setCurrentStep(3);
            return;
        }
    }

    setSaving(true);
    try {
      Swal.fire({
          title: 'Saving Changes...',
          text: 'Please wait while we process your updates and upload any new media.',
          allowOutsideClick: false,
          didOpen: () => {
              Swal.showLoading();
          }
      });

      // 1. Handle deferred uploads
      let finalBannerUrl = mediaInfo.bannerUrl;
      if (bannerFile) {
          finalBannerUrl = await uploadMedia(bannerFile);
      }

      setIsUploading(true);
      const finalMediaUrls = await Promise.all(mediaInfo.mediaUrls.map(async (item) => {
          if (typeof item === 'string') return item;
          return await uploadMedia(item.file);
      }));

      const finalSpeakers = await Promise.all(speakers.map(async (s) => {
          let imageUrl = s.imageUrl;
          if (s.pendingFile) {
              imageUrl = await uploadMedia(s.pendingFile);
          }
          return {
              ...s,
              imageUrl: imageUrl,
              pendingFile: undefined,
              previewUrl: undefined
          };
      }));
      setIsUploading(false);

      // 2. Save Event Base Details
      const basePayload = {
        title: basicInfo.title,
        description: basicInfo.description,
        slug: basicInfo.slug,
        isPublic: basicInfo.isPublic,
        type: basicInfo.type,
        startDate: basicInfo.startDate ? new Date(basicInfo.startDate).toISOString() : undefined,
        endDate: basicInfo.endDate ? new Date(basicInfo.endDate).toISOString() : undefined,
        location: basicInfo.location,
        virtualLink: basicInfo.virtualLink,
        capacity: basicInfo.capacity,
        category: basicInfo.category,
        agendaEnabled: basicInfo.agendaEnabled,
        hideLocationDetails: basicInfo.hideLocationDetails,
        isWaitlistEnabled: basicInfo.isWaitlistEnabled,
        tags: basicInfo.tags,
        speakers: finalSpeakers,
        registrationMode: registration.mode,
        isGroupingEnabled: registration.isGroupingEnabled,
        enforceUniqueGroupNames: registration.enforceUniqueGroupNames,
        registrationFields: ensureCorrectDependencyOrder(registration.fields).map(f => ({
          name: f.name || f.label.toLowerCase().replace(/\s+/g, '-'),
          label: f.label,
          type: f.type,
          required: f.required,
          isPerAttendee: f.isPerAttendee,
          options: (f.type === 'select' || f.type === 'checkbox') && !f.source ? f.options : undefined,
          source: f.source,
          dependsOn: f.dependsOn
        })),
        bannerUrl: finalBannerUrl,
        mediaUrls: finalMediaUrls,
        remindersEnabled: basicInfo.remindersEnabled || false,
        reminderCustomText: basicInfo.remindersEnabled ? (basicInfo.reminderCustomText || undefined) : undefined,
        reminderFrequencies: basicInfo.remindersEnabled ? (basicInfo.useDefaultFrequencies ? [] : basicInfo.reminderFrequencies) : undefined,
      };

      // Fix: Remove restricted fields
      const { status: _status, ...patchPayload } = basePayload as Record<string, unknown>;
      await api.patch(`/events/${eventId}`, patchPayload);

      // 2. Save Tickets (Handle both new and existing)
      const existingTickets = tickets.filter(t => t.id && !t.id.includes('.'));
      const newTickets = tickets.filter(t => !t.id || t.id.includes('.'));

      for (const ticket of existingTickets) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const payload: any = {
              name: ticket.name,
              description: ticket.description,
              price: ticket.type === 'FREE' ? 0 : ticket.price,
              type: ticket.type,
              totalQuantity: Math.max(1, ticket.totalQuantity || 1),
              groupSize: ticket.groupSize,
              allocationType: ticket.allocationType,
              maxPerOrder: ticket.maxPerOrder,
              salesStart: (ticket.salesStart ? new Date(ticket.salesStart) : new Date()).toISOString(),
              salesEnd: ticket.salesEnd ? new Date(ticket.salesEnd).toISOString() : (basicInfo.endDate ? new Date(basicInfo.endDate).toISOString() : undefined),
              isOffline: ticket.isOffline,
              isSpecial: ticket.isSpecial || false,
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const item: any = {
                      name: t.name,
                      description: t.description,
                      price: t.type === 'FREE' ? 0 : t.price,
                      type: t.type,
                      totalQuantity: Math.max(1, t.totalQuantity || 1),
                      groupSize: t.groupSize,
                      allocationType: t.allocationType,
                      maxPerOrder: t.maxPerOrder,
                      salesStart: (t.salesStart ? new Date(t.salesStart) : new Date()).toISOString(),
                      salesEnd: t.salesEnd ? new Date(t.salesEnd).toISOString() : (basicInfo.endDate ? new Date(basicInfo.endDate).toISOString() : undefined),
                      isOffline: t.isOffline,
                      isSpecial: t.isSpecial || false,
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
              description: session.description,
              startTime: session.startTime ? new Date(session.startTime).toISOString() : undefined,
              endTime: session.endTime ? new Date(session.endTime).toISOString() : undefined,
              location: session.location,
              room: session.room,
              stage: session.stage,
              sessionType: session.sessionType,
              speakerIds: session.speakerIds,
              speakerNames: session.speakerNames
          };
          await api.patch(`/events/${eventId}/sessions/${session.id}`, payload);
      }

      if (newSessions.length > 0) {
          const filteredNewSessions = newSessions.filter(s => s.title?.trim());
          if (filteredNewSessions.length > 0) {
              const sessionPayload = {
                  sessions: filteredNewSessions.map(s => ({
                      title: s.title,
                      description: s.description,
                      startTime: s.startTime ? new Date(s.startTime).toISOString() : undefined,
                      endTime: s.endTime ? new Date(s.endTime).toISOString() : undefined,
                      location: s.location,
                      room: s.room,
                      stage: s.stage,
                      sessionType: s.sessionType,
                      speakerIds: s.speakerIds,
                      speakerNames: s.speakerNames
                  }))
              };
              await api.post(`/events/${eventId}/sessions`, sessionPayload);
          }
      }

      await fetchEvent();
      Swal.fire("Success", "Event updated successfully", "success");

      // Clear pending uploads state
      setBannerFile(null);
      setMediaInfo(prev => ({ ...prev, bannerUrl: finalBannerUrl, mediaUrls: finalMediaUrls }));
      setSpeakers(finalSpeakers);

      if (shouldRedirect) {
          router.push(`/organizer/dashboard/events/${eventId}`);
      }
    } catch (error) {
      Swal.fire("Error", translateError(error), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><CustomLoader /></div>;

  const handlePublish = async () => {
    const result = await Swal.fire({
      title: 'Publish Event?',
      text: 'This will make your event visible to the public and allow ticket sales.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Publish Now',
      confirmButtonColor: '#10b981',
    });

    if (result.isConfirmed) {
      try {
        setIsPublishing(true);
        Swal.showLoading();
        await api.post(`/events/${eventId}/publish`);
        Swal.fire('Published!', 'Your event is now live.', 'success');
        await fetchEvent();
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      } finally {
        setIsPublishing(false);
      }
    }
  };

  const checkMaxTicketsRule = () => {
    const maxTicketsRule = getRule('MAX_TICKET_CATEGORIES');
    if (maxTicketsRule) {
      const limit = parseInt(maxTicketsRule.value as string);
      if (limit !== -1 && tickets.length >= limit) {
        Swal.fire({
          title: maxTicketsRule.title || 'Ticket Limit Reached',
          text: maxTicketsRule.uxContext || `You have reached the maximum number of ticket categories (${limit}) allowed on your current plan.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Upgrade Now',
          cancelButtonText: 'Later',
          confirmButtonColor: '#295FA7',
        }).then((result) => {
          if (result.isConfirmed) {
            router.push('/organizer/dashboard/settings?tab=subscriptions');
          }
        });
        return true;
      }
    }
    return false;
  };

  return (
    <div className="max-w-[1600px] mx-auto py-6 lg:py-10 px-4">
      {/* Header Area */}
      <div className={`mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8 px-4 ${showPreview ? "2xl:px-8" : "xl:px-8"}`}>
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-primary transition-all mb-4 group font-black text-[10px] uppercase tracking-[0.2em]">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Details
          </button>
          <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight leading-none mb-3">Edit Event</h1>
          <p className="text-gray-500 font-medium text-base md:text-lg">Update your event configuration and schedule.</p>
        </div>

        <div className="flex items-center gap-4">
          {!isPublished && (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-600 font-bold px-5 py-3.5 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all text-[10px] uppercase tracking-[0.2em] whitespace-nowrap shrink-0 shadow-sm"
            >
              <CheckCircle2 size={16} />
              Publish
            </button>
          )}

          <button
            onClick={() => {
              if (isMobile) setIsPreviewModalOpen(!isPreviewModalOpen);
              else setShowPreview(!showPreview);
            }}
            className="flex items-center gap-2.5 bg-white text-gray-500 font-black px-5 md:px-6 py-3.5 md:py-4 rounded-2xl border border-gray-100 shadow-sm hover:bg-gray-50 hover:text-primary transition-all text-[10px] uppercase tracking-[0.2em]"
          >
            <Eye size={16} />
            <span className="hidden sm:inline">{isPreviewActive ? "Hide Preview" : "Show Preview"}</span>
            <span className="sm:hidden">Preview</span>
          </button>

          <div className={`hidden items-center gap-1.5 bg-gray-50 p-2 rounded-[2.5rem] border border-gray-100 ${showPreview ? "2xl:flex" : "xl:flex"}`}>
            {visibleSteps.map((step) => (
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
        <div className={`flex-1 w-full bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden transition-all duration-500 ease-in-out`}>

          <div className={`p-6 md:p-8 lg:p-10 ${showPreview ? "2xl:p-12" : "xl:p-12"}`}>
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
                          <div className={`grid grid-cols-1 gap-8 ${showPreview ? "2xl:grid-cols-2" : "md:grid-cols-2"}`}>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Title</label>
                                <input type="text" name="title" className="w-full p-4 md:p-6 bg-white border border-gray-300 rounded-2xl md:rounded-3xl text-sm font-bold outline-none" value={basicInfo.title} onChange={handleBasicChange} />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Slug (URL Friendly)</label>
                                <input type="text" name="slug" className="w-full p-4 md:p-6 bg-white border border-gray-300 rounded-2xl md:rounded-3xl text-sm font-bold outline-none" value={basicInfo.slug} onChange={handleBasicChange} />
                                {organizerSlug && (
                                  <p className="text-[10px] font-bold text-primary mt-1 ml-2 break-all">
                                    Preview: gobokin.com/events/{organizerSlug}/{basicInfo.slug || "event-slug"}
                                  </p>
                                )}
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Category</label>
                                <select name="category" className="w-full p-4 md:p-6 bg-white border border-gray-300 rounded-2xl md:rounded-3xl text-sm font-bold outline-none appearance-none" value={basicInfo.category} onChange={handleBasicChange}>
                                   <option value="">Select a category</option>
                                   {categories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                                </select>
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Commences</label>
                                <input type="datetime-local" name="startDate" className="w-full p-4 md:p-6 bg-white border border-gray-300 rounded-2xl md:rounded-3xl text-sm font-bold outline-none" value={basicInfo.startDate} onChange={handleBasicChange} />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Concludes</label>
                                <input type="datetime-local" name="endDate" className="w-full p-4 md:p-6 bg-white border border-gray-300 rounded-2xl md:rounded-3xl text-sm font-bold outline-none" value={basicInfo.endDate} onChange={handleBasicChange} />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Location</label>
                                <input type="text" name="location" className="w-full p-4 md:p-6 bg-white border border-gray-300 rounded-2xl md:rounded-3xl text-sm font-bold outline-none" value={basicInfo.location} onChange={handleBasicChange} />
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Number of Expected Guest</label>
                                <input type="number" name="capacity" className="w-full p-4 md:p-6 bg-white border border-gray-300 rounded-2xl md:rounded-3xl text-sm font-bold outline-none" value={basicInfo.capacity} onChange={handleBasicChange} />
                             </div>
                             <div className={`space-y-3 ${showPreview ? "2xl:col-span-2" : "md:col-span-2"}`}>
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Search Keywords</label>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">{basicInfo.tags.length}/5 Keywords</span>
                                </div>
                                <div className="flex flex-wrap gap-2 p-4 bg-white border border-gray-300 rounded-3xl h-[120px] overflow-y-auto focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all shadow-sm scrollbar-thin scrollbar-thumb-gray-200">
                                   {basicInfo.tags.map((tag, index) => (
                                      <span key={index} className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 text-primary rounded-xl text-[11px] font-black uppercase tracking-wider border border-primary/10 animate-in zoom-in duration-300">
                                         {tag}
                                         <button
                                            type="button"
                                            onClick={() => {
                                               const newTags = [...basicInfo.tags];
                                               newTags.splice(index, 1);
                                               setBasicInfo(prev => ({ ...prev, tags: newTags }));
                                            }}
                                            className="hover:text-secondary transition-colors"
                                         >
                                            <X size={12} strokeWidth={3} />
                                         </button>
                                      </span>
                                   ))}
                                   {basicInfo.tags.length < 5 && (
                                      <input
                                         type="text"
                                         placeholder={basicInfo.tags.length === 0 ? "Enter keywords (comma separated)" : "Add more..."}
                                         className="flex-1 min-w-[120px] bg-transparent outline-none text-sm font-bold placeholder:text-gray-400 px-2 h-fit self-center"
                                         value={keywordInput}
                                         onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.endsWith(',')) {
                                               const newTag = value.slice(0, -1).trim();
                                               if (newTag && !basicInfo.tags.includes(newTag) && basicInfo.tags.length < 5) {
                                                  setBasicInfo(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
                                                  setKeywordInput("");
                                               } else {
                                                  setKeywordInput(value.slice(0, -1));
                                               }
                                            } else {
                                               setKeywordInput(value);
                                            }
                                         }}
                                         onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                               e.preventDefault();
                                               const newTag = keywordInput.trim();
                                               if (newTag && !basicInfo.tags.includes(newTag) && basicInfo.tags.length < 5) {
                                                  setBasicInfo(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
                                                  setKeywordInput("");
                                               }
                                            } else if (e.key === 'Backspace' && !keywordInput && basicInfo.tags.length > 0) {
                                               const newTags = [...basicInfo.tags];
                                               newTags.pop();
                                               setBasicInfo(prev => ({ ...prev, tags: newTags }));
                                            }
                                      }}
                                   />
                                   )}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {subStep === 2 && (
                    <div className="space-y-16 animate-in fade-in duration-500">
                       <div className="space-y-10 group/section">
                          <div
                            onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                            className="flex items-center justify-between border-b border-gray-100 pb-10 cursor-pointer group/header"
                          >
                             <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm border border-gray-100 ${isConfigExpanded ? 'bg-primary text-white scale-110 rotate-3' : 'bg-gray-50 text-primary group-hover/header:bg-gray-100'}`}>
                                   <ShieldCheck size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Event Configuration</h3>
                             </div>
                             <div className={`w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center transition-all duration-500 ${isConfigExpanded ? 'rotate-180 bg-primary/5 text-primary border-primary/10' : 'bg-gray-50 text-gray-400'}`}>
                                <ChevronDown size={24} strokeWidth={3} />
                             </div>
                          </div>

                          {isConfigExpanded && (
                          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 animate-in slide-in-from-top-4 duration-500 ${showPreview ? "2xl:grid-cols-3" : "lg:grid-cols-3"}`}>
                             <div className="space-y-4 p-4 sm:p-6 md:p-8 bg-gray-50 rounded-2xl sm:rounded-[2.5rem] border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                   <Globe size={12} />
                                   Public Visibility
                                </label>
                                <div className="flex items-start justify-between gap-4">
                                   <div className="space-y-1">
                                      <span className="text-sm font-bold text-gray-700 block">{basicInfo.isPublic ? 'Visible' : 'Hidden'}</span>
                                      <p className="text-[10px] text-gray-400 font-medium leading-tight">
                                         {basicInfo.isPublic
                                            ? 'Visible on public search results and event discovery lists.'
                                            : 'Only people with the direct link can find and register.'}
                                      </p>
                                   </div>
                                   <button onClick={() => setBasicInfo(prev => ({ ...prev, isPublic: !prev.isPublic }))} className={`w-14 h-8 rounded-full transition-all relative shrink-0 ${basicInfo.isPublic ? 'bg-primary' : 'bg-gray-300'}`}>
                                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${basicInfo.isPublic ? 'left-7' : 'left-1'}`} />
                                   </button>
                                </div>
                             </div>
                             <div className="space-y-4 p-4 sm:p-6 md:p-8 bg-gray-50 rounded-2xl sm:rounded-[2.5rem] border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                   <MapPin size={12} />
                                   Hide Location
                                </label>
                                <div className="flex items-start justify-between gap-4">
                                   <div className="space-y-1">
                                      <span className="text-sm font-bold text-gray-700 block">{basicInfo.hideLocationDetails ? 'Details Hidden' : 'Details Visible'}</span>
                                      <p className="text-[10px] text-gray-400 font-medium leading-tight">Hide address and links until registration.</p>
                                   </div>
                                   <button
                                      onClick={() => setBasicInfo(prev => ({ ...prev, hideLocationDetails: !prev.hideLocationDetails }))}
                                      className={`w-14 h-8 rounded-full transition-all relative shrink-0 ${basicInfo.hideLocationDetails ? 'bg-primary' : 'bg-gray-300'}`}
                                   >
                                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${basicInfo.hideLocationDetails ? 'left-7' : 'left-1'}`} />
                                   </button>
                                </div>
                             </div>
                             <div className="space-y-4 p-4 sm:p-6 md:p-8 bg-gray-50 rounded-2xl sm:rounded-[2.5rem] border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                   Registration Mode
                                   <div className="relative" ref={regInfoRef}>
                                      <button
                                        type="button"
                                        onClick={() => setShowRegInfo(!showRegInfo)}
                                        className="text-primary hover:text-primary/80 transition-colors focus:outline-none"
                                      >
                                        <Info size={14} />
                                      </button>
                                      {showRegInfo && (
                                        <div className="absolute bottom-full right-0 mb-3 w-72 max-w-[calc(100vw-2.5rem)] sm:max-w-none p-4 sm:p-6 bg-white border border-gray-100 text-gray-900 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                           <div className="flex items-center justify-between mb-4">
                                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registration Modes Explained</p>
                                              <button onClick={() => setShowRegInfo(false)} className="text-gray-400 hover:text-gray-600">
                                                 <X size={14} />
                                              </button>
                                           </div>
                                           <div className="space-y-4">
                                              {registration.mode === 'FULL_DETAILS' ? (
                                              <div className="space-y-1.5">
                                                 <p className="text-xs font-bold text-primary uppercase italic">Attendee Registration</p>
                                                 <p className="text-[10px] text-gray-500 font-bold leading-relaxed">Requires every attendee to provide their full details during registration. Ideal for events where individual identification is necessary.</p>
                                              </div>
                                              ) : (
                                              <div className="space-y-1.5">
                                                 <p className="text-xs font-bold text-secondary uppercase italic">Ticket Sales</p>
                                                 <p className="text-[10px] text-gray-500 font-bold leading-relaxed">Only the ticket buyer provides their information, regardless of the quantity purchased. Best for simple ticketing scenarios.</p>
                                              </div>
                                              )}
                                           </div>
                                           <div className="absolute top-full right-1 w-3 h-3 bg-white border-b border-r border-gray-100 rotate-45 -translate-y-1.5" />
                                        </div>
                                      )}
                                   </div>
                                </label>
                                <div className="relative">
                                   <select className="w-full p-3 sm:p-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary appearance-none" value={registration.mode} onChange={(e) => setRegistration(prev => ({ ...prev, mode: e.target.value as RegistrationMode }))}>
                                       <option value="FULL_DETAILS">Attendee Registration (Full details)</option>
                                       <option value="BASIC_QUANTITY">Ticket Sales (basic quantity)</option>
                                   </select>
                                   <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                             </div>
                             <div className="space-y-4 p-4 sm:p-6 md:p-8 bg-gray-50 rounded-2xl sm:rounded-[2.5rem] border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                   <Users size={12} />
                                   Grouping
                                </label>
                                <div className="flex items-start justify-between gap-4">
                                   <div className="space-y-1">
                                      <span className="text-sm font-bold text-gray-700 block">Enable Group Registration</span>
                                      <p className="text-[10px] text-gray-400 font-medium leading-tight">Allow attendees to register as a group or team.</p>
                                   </div>
                                   <button
                                      onClick={() => {
                                         const newGroupingEnabled = !registration.isGroupingEnabled;
                                         setRegistration(prev => ({
                                            ...prev,
                                            isGroupingEnabled: newGroupingEnabled,
                                            fields: newGroupingEnabled
                                               ? prev.fields
                                               : prev.fields.map((f, _i) => ({ ...f, isPerAttendee: false }))
                                         }));
                                      }}
                                      className={`w-14 h-8 rounded-full transition-all relative shrink-0 ${registration.isGroupingEnabled ? 'bg-primary' : 'bg-gray-300'}`}
                                   >
                                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${registration.isGroupingEnabled ? 'left-7' : 'left-1'}`} />
                                   </button>
                                </div>
                             </div>
                             {registration.isGroupingEnabled && (
                                <div className="space-y-4 p-4 sm:p-6 md:p-8 bg-gray-50 rounded-2xl sm:rounded-[2.5rem] border border-gray-100">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                      <Users size={12} />
                                      Unique Names
                                   </label>
                                   <div className="flex items-start justify-between gap-4">
                                      <div className="space-y-1">
                                         <span className="text-sm font-bold text-gray-700 block">Require Unique Group Names</span>
                                         <p className="text-[10px] text-gray-400 font-medium leading-tight">Prevent multiple groups from using the same name.</p>
                                      </div>
                                      <button
                                         onClick={() => setRegistration(prev => ({ ...prev, enforceUniqueGroupNames: !prev.enforceUniqueGroupNames }))}
                                         className={`w-14 h-8 rounded-full transition-all relative shrink-0 ${registration.enforceUniqueGroupNames ? 'bg-primary' : 'bg-gray-300'}`}
                                      >
                                         <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${registration.enforceUniqueGroupNames ? 'left-7' : 'left-1'}`} />
                                      </button>
                                   </div>
                                </div>
                             )}
                             <div className="space-y-4 p-4 sm:p-6 md:p-8 bg-gray-50 rounded-2xl sm:rounded-[2.5rem] border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Waitlist Feature</label>
                                <div className="flex items-center justify-between">
                                   <span className="text-sm font-bold text-gray-700">{basicInfo.isWaitlistEnabled ? 'Enabled' : 'Disabled'}</span>
                                   <button onClick={() => setBasicInfo(prev => ({ ...prev, isWaitlistEnabled: !prev.isWaitlistEnabled }))} className={`w-14 h-8 rounded-full transition-all relative ${basicInfo.isWaitlistEnabled ? 'bg-primary' : 'bg-gray-300'}`}>
                                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${basicInfo.isWaitlistEnabled ? 'left-7' : 'left-1'}`} />
                                   </button>
                                </div>
                             </div>
                             <div className={`pt-4 ${showPreview ? "2xl:col-span-3" : "md:col-span-2 lg:col-span-3"}`}>
                                <div className="flex items-center justify-between p-4 sm:p-6 bg-gray-50 rounded-2xl sm:rounded-[2rem] border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-500 group/agenda">
                                   <div className="flex items-center gap-5">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${basicInfo.agendaEnabled ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'bg-white text-gray-300 border border-gray-100'}`}>
                                         <Calendar size={20} />
                                      </div>
                                      <div>
                                         <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">Enable Event Agenda</h4>
                                         <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Sessions, Schedule & Speakers</p>
                                      </div>
                                   </div>
                                   <button
                                      type="button"
                                      onClick={() => setBasicInfo(prev => ({ ...prev, agendaEnabled: !prev.agendaEnabled }))}
                                      className={`w-14 h-8 rounded-full transition-all relative ${basicInfo.agendaEnabled ? 'bg-secondary' : 'bg-gray-200'}`}
                                   >
                                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${basicInfo.agendaEnabled ? 'left-7' : 'left-1'}`} />
                                   </button>
                                </div>
                                {basicInfo.agendaEnabled && (
                                    <div className="mt-4 p-5 bg-secondary/5 border border-secondary/10 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                                        <Info size={14} className="text-secondary shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-bold text-secondary/80 leading-relaxed uppercase">
                                            Agenda enabled: You&apos;ll be required to add at least one session in Step 3.
                                        </p>
                                    </div>
                                )}
                             </div>

                             <div className={`pt-4 ${showPreview ? "2xl:col-span-3" : "md:col-span-2 lg:col-span-3"}`}>
                                {(() => {
                                   const remindersRule = getRule('REMINDERS_ALLOWED');
                                   const remindersRestricted = remindersRule ? remindersRule.isRestricted : true;
                                   const remindersUxContext = remindersRule ? remindersRule.uxContext : "The Automated Reminders feature is not available on your current plan. Upgrade your subscription to unlock this and additional features.";
                                   return (
                                      <EventReminderSection
                                         remindersEnabled={basicInfo.remindersEnabled}
                                         reminderCustomText={basicInfo.reminderCustomText}
                                         reminderFrequencies={basicInfo.reminderFrequencies}
                                         useDefaultFrequencies={basicInfo.useDefaultFrequencies}
                                         isRestricted={remindersRestricted}
                                         uxContext={remindersUxContext}
                                         onChange={(updates) => {
                                            setBasicInfo(prev => ({
                                               ...prev,
                                               ...updates
                                            }));
                                         }}
                                      />
                                   );
                                })()}
                             </div>
                          </div>
                          )}
                       </div>

                       {/* Section 9: Registration Fields */}
                       <div className="space-y-10">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-10">
                             <div>
                                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Custom Registration Fields</h3>
                                <p className="text-sm text-gray-500 font-medium">Add custom fields to collect information from attendees during registration.</p>
                             </div>
                             <div className="relative" ref={addFieldDropdownRef}>
                                <button
                                  onClick={() => setShowAddFieldDropdown(!showAddFieldDropdown)}
                                  className="flex items-center gap-3 bg-gray-900 text-white font-black px-8 py-5 rounded-3xl hover:bg-black transition-all shadow-2xl shadow-gray-900/20 text-[10px] uppercase tracking-[0.2em]"
                                >
                                  <Plus size={18} />
                                  Add Fields
                                </button>
                                {showAddFieldDropdown && (
                                   <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 z-[100] animate-in fade-in zoom-in duration-200">
                                      {!(registration.fields.some(f => f.source === 'COUNTRIES') &&
                                         registration.fields.some(f => f.source === 'STATES') &&
                                         registration.fields.some(f => f.source === 'LGAS')) && (
                                      <button
                                         onClick={() => addField('location')}
                                         className="w-full px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-3"
                                      >
                                         <MapPin size={14} />
                                         Country / Cities
                                      </button>
                                      )}
                                      {registration.isGroupingEnabled && (
                                        <div className="border-t border-gray-50 my-1 py-1">
                                          <p className="px-6 py-1 text-[8px] font-black text-gray-400 uppercase tracking-widest">Group Fields</p>
                                          {!registration.fields.some(f => f.label.toLowerCase() === 'organization') && (
                                            <button
                                              onClick={() => {
                                                setRegistration({
                                                  ...registration,
                                                  fields: [...registration.fields, {
                                                    name: "organization",
                                                    label: "Organization",
                                                    type: "text",
                                                    required: false,
                                                    isPerAttendee: false,
                                                    options: []
                                                  }]
                                                });
                                                setShowAddFieldDropdown(false);
                                              }}
                                              className="w-full px-6 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-3"
                                            >
                                              <Layout size={14} />
                                              Organization
                                            </button>
                                          )}
                                        </div>
                                      )}
                                      <div className="border-t border-gray-50 my-1 py-1">
                                        {registration.isGroupingEnabled && <p className="px-6 py-1 text-[8px] font-black text-gray-400 uppercase tracking-widest">Attendee Fields</p>}
                                        <button
                                          onClick={() => addField('custom')}
                                          className="w-full px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors flex items-center gap-3"
                                        >
                                          <Plus size={14} />
                                          Empty Field
                                        </button>
                                      </div>
                                   </div>
                                )}
                             </div>
                          </div>

                          <div className="grid grid-cols-1 gap-12">
                             {registration.mode === 'FULL_DETAILS' && registration.isGroupingEnabled ? (
                               <>
                                 {/* Group Information Section */}
                                 <div className="space-y-6">
                                   <div className="flex items-center gap-3 px-2">
                                     <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                                     <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Group Information</h4>
                                   </div>
                                   <Reorder.Group axis="y" values={groupFields} onReorder={setGroupFields} className="grid grid-cols-1 gap-6">
                                     {groupFields.map((field) => (
                                       <RegistrationFieldItem
                                         key={field.id || field.name || field.label}
                                         field={field}
                                         idx={registration.fields.indexOf(field)}
                                         isLocationField={field.source === 'COUNTRIES' || field.source === 'STATES' || field.source === 'LGAS'}
                                         showPreview={showPreview}
                                         registration={registration}
                                         updateField={updateField}
                                         removeField={removeField}
                                         addFieldOption={addFieldOption}
                                         updateFieldOption={updateFieldOption}
                                         removeFieldOption={removeFieldOption}
                                       />
                                     ))}
                                   </Reorder.Group>
                                 </div>

                                 {/* Attendee Information Section */}
                                 <div className="space-y-6">
                                   <div className="flex items-center gap-3 px-2">
                                     <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
                                     <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Attendee Information</h4>
                                   </div>
                                   <Reorder.Group axis="y" values={attendeeFields} onReorder={setAttendeeFields} className="grid grid-cols-1 gap-6">
                                     {attendeeFields.map((field) => (
                                       <RegistrationFieldItem
                                         key={field.id || field.name || field.label}
                                         field={field}
                                         idx={registration.fields.indexOf(field)}
                                         isLocationField={field.source === 'COUNTRIES' || field.source === 'STATES' || field.source === 'LGAS'}
                                         showPreview={showPreview}
                                         registration={registration}
                                         updateField={updateField}
                                         removeField={removeField}
                                         addFieldOption={addFieldOption}
                                         updateFieldOption={updateFieldOption}
                                         removeFieldOption={removeFieldOption}
                                       />
                                     ))}
                                   </Reorder.Group>
                                 </div>
                               </>
                             ) : (
                                <Reorder.Group axis="y" values={registration.fields} onReorder={(newFields) => setRegistration(prev => ({ ...prev, fields: newFields }))} className="grid grid-cols-1 gap-6">
                                  {registration.fields.map((field) => (
                                    <RegistrationFieldItem
                                      key={field.id || field.name || field.label}
                                      field={field}
                                      idx={registration.fields.indexOf(field)}
                                      isLocationField={field.source === 'COUNTRIES' || field.source === 'STATES' || field.source === 'LGAS'}
                                      showPreview={showPreview}
                                      registration={registration}
                                      updateField={updateField}
                                      removeField={removeField}
                                      addFieldOption={addFieldOption}
                                      updateFieldOption={updateFieldOption}
                                      removeFieldOption={removeFieldOption}
                                    />
                                  ))}
                                </Reorder.Group>
                             )}
                          </div>
                       </div>
                    </div>
                 )}

                 {subStep === 3 && (
                    <div className="space-y-16 animate-in fade-in duration-500">
                       <div className="space-y-10 group/section">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-10">
                             <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 text-primary flex items-center justify-center shadow-sm border border-gray-100">
                                   <Users size={24} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Speakers & Agenda (Optional)</h3>
                             </div>
                             <button onClick={() => setSpeakers([...speakers, { name: "", title: "", bio: "", imageUrl: "" }])} className="flex items-center gap-3 bg-gray-900 text-white font-black px-8 py-5 rounded-3xl text-[10px] uppercase tracking-[0.2em]">
                               <Plus size={18} /> Add Speaker
                             </button>
                          </div>

                          <div className={`grid gap-8 ${showPreview ? "grid-cols-1 2xl:grid-cols-2" : "grid-cols-1 md:grid-cols-2"}`}>
                             {speakers.map((speaker, idx) => (
                                <div key={idx} className="p-8 bg-gray-50 rounded-[3rem] space-y-6 relative group/speaker transition-all duration-500 hover:bg-white hover:shadow-xl">
                                   <button onClick={() => setSpeakers(speakers.filter((_, i) => i !== idx))} className="absolute top-6 right-6 text-gray-300 hover:text-secondary transition-colors"><Trash2 size={16} /></button>
                                   <div className={`flex items-center gap-6 ${showPreview ? "flex-col 2xl:flex-row" : "flex-col sm:flex-row"}`}>
                                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-100 group/img shrink-0">
                                         {speaker.imageUrl ? <Image src={speaker.imageUrl} alt="Speaker" fill unoptimized={true} className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-200"><Users size={32} /></div>}
                                         <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer z-10">
                                            <Upload size={20} className="text-white" /><input type="file" className="hidden" onChange={(e) => handleSpeakerImageUpload(idx, e)} />
                                         </label>
                                         <div className="absolute bottom-2 right-2 w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white z-20 pointer-events-none">
                                            <Upload size={12} strokeWidth={3} />
                                         </div>
                                      </div>
                                      <div className="flex-1 w-full space-y-3">
                                         <input type="text" placeholder="Full Name" className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all shadow-sm" value={speaker.name} onChange={(e) => updateSpeaker(idx, 'name', e.target.value)} />
                                         <input type="text" placeholder="Title (e.g., CEO)" className="w-full p-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold outline-none focus:border-primary transition-all shadow-sm" value={speaker.title || ""} onChange={(e) => updateSpeaker(idx, 'title', e.target.value)} />
                                      </div>
                                   </div>
                                </div>
                             ))}
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
                             <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Event Description</h3>
                                <p className="text-sm text-gray-400 font-medium">Describe your event and provide any information attendees need to know.</p>
                             </div>
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
                             <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Event Cover Image</h3>
                                <p className="text-sm text-gray-400 font-medium">Upload a cover image that represents your event and appears prominently on the event page.</p>
                             </div>
                          </div>

                          <div className={`grid grid-cols-1 gap-10 ${showPreview ? "2xl:grid-cols-2" : "lg:grid-cols-2"}`}>
                             <div className={`bg-gray-50 rounded-[3rem] p-8 border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center space-y-6 group/upload shadow-sm h-full relative overflow-hidden min-h-[300px] ${isUploading ? 'border-primary bg-primary/5' : 'border-gray-200'}`}>
                                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" onChange={handleBannerUpload} accept="image/*" disabled={isUploading} />
                                {mediaInfo.bannerUrl && !isUploading ? (
                                   <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl">
                                      <Image src={mediaInfo.bannerUrl} alt="Banner" fill unoptimized={true} className="object-cover" />
                                   </div>
                                ) : (
                                   <div className="text-center">
                                       <UploadCloud size={40} className="mx-auto mb-4 text-gray-300" />
                                       <p className="text-[10px] font-black uppercase tracking-widest">Update Banner Art</p>
                                   </div>
                                )}
                             </div>
                             <div className="space-y-8">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Additional Media Gallery</label>
                                    <p className="text-[10px] text-gray-400 font-medium">Add photos that help attendees learn more about your event.</p>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {mediaInfo.mediaUrls.map((item, idx) => {
                                        const url = typeof item === 'string' ? item : item.preview;
                                        const isVideo = typeof item === 'string'
                                          ? item.match(/\.(mp4|webm|ogg)$/)
                                          : item.file.type.startsWith('video/');

                                        return (
                                          <div key={idx} className="relative w-24 h-24 rounded-2xl overflow-hidden group">
                                              {url && isVideo ? <video src={url} className="w-full h-full object-cover" /> : <Image src={url} alt="Media" fill unoptimized={true} className="object-cover" />}
                                              <button onClick={() => removeMediaUrl(idx)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Trash2 size={16} /></button>
                                          </div>
                                        );
                                    })}
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
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-4">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">Tickets</h3>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                       {(() => {
                         const maxTicketsRule = getRule('MAX_TICKET_CATEGORIES');
                         const ticketsLimit = maxTicketsRule ? parseInt(maxTicketsRule.value as string) : 5;
                         const ticketsLimitReached = ticketsLimit !== -1 && tickets.length >= ticketsLimit;
                         return (
                           <button
                             disabled={ticketsLimitReached}
                             onClick={() => {
                               if (checkMaxTicketsRule()) return;

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
                           salesStart: getLocalDateTimeString(),
                           salesEnd: basicInfo.endDate || "",
                           isOffline: false,
                           isSpecial: false,
                           quantityDiscounts: []
                         }]);
                       }} className={`flex items-center gap-3 bg-secondary text-white font-black px-6 sm:px-8 py-4 sm:py-5 rounded-2xl sm:rounded-3xl text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] active:scale-95 group shadow-3xl shadow-secondary/30 ${ticketsLimitReached ? 'opacity-40 cursor-not-allowed' : ''}`}>
                         <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" /> Add Ticket Type
                       </button>
                         );
                       })()}
                    </div>
                 </div>
                 <div className="grid grid-cols-1 gap-8">
                    {tickets.map((ticket, _index) => (
                      <React.Fragment key={ticket.id}>
                        {_index > 0 && (
                          <div className="border-t-2 border-dashed border-gray-200/80 my-4 sm:my-6" />
                        )}
                        <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-gray-50/50 rounded-2xl sm:rounded-[2rem] lg:rounded-[3.5rem] border border-gray-100 space-y-6 sm:space-y-8 lg:space-y-10 relative group/ticket hover:bg-white hover:shadow-4xl hover:shadow-secondary/10 transition-all duration-700">
                            <div className="flex justify-between items-center gap-3">
                                <div className="flex items-center gap-3 sm:gap-5">
                                   <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white text-secondary flex items-center justify-center shadow-xl shadow-gray-200/50 border border-gray-100 group-hover/ticket:bg-secondary group-hover/ticket:text-white transition-all duration-500 shrink-0">
                                      <Ticket size={18} className="sm:hidden" strokeWidth={2} />
                                      <Ticket size={24} className="hidden sm:block" strokeWidth={2} />
                                   </div>
                                   <div>
                                       <h4 className="font-black text-gray-900 uppercase tracking-[0.15em] sm:tracking-[0.3em] text-[9px] sm:text-[10px]">Ticket Type #{_index+1}</h4>
                                       <p className="text-xs sm:text-sm font-black text-gray-400 mt-1">{ticket.name || 'Unnamed Ticket Type'}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                                    {ticket.id.length >= 10 && (
                                        <button
                                            onClick={() => handleUpdateTicket(ticket)}
                                            className="text-[8px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg uppercase tracking-widest border border-primary/10 hover:bg-primary hover:text-white transition-all shrink-0"
                                        >
                                            Update
                                        </button>
                                    )}
                                    <button
                                      onClick={() => deleteTicket(ticket.id)}
                                      className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-secondary bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100 shrink-0"
                                    >
                                       <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6 sm:space-y-8">
                                <div className="space-y-3">
                                   <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 mb-2">
                                       <input
                                           type="checkbox"
                                           id={`isSpecial-${ticket.id}`}
                                           className="w-4 h-4 mt-1 rounded text-primary focus:ring-primary border-gray-300"
                                           checked={ticket.isSpecial || false}
                                           onChange={(e) => updateTicket(ticket.id, "isSpecial", e.target.checked)}
                                       />
                                       <div className="space-y-1">
                                           <div className="flex items-center gap-2">
                                               <label htmlFor={`isSpecial-${ticket.id}`} className="text-[10px] font-black text-gray-900 uppercase tracking-widest cursor-pointer">
                                                   Special Ticket
                                               </label>
                                               <div className="group relative">
                                                   <Info size={12} className="text-primary cursor-help" />
                                                   <div className="absolute bottom-full left-0 mb-2 w-64 p-4 bg-gray-900 text-white text-[10px] font-bold leading-relaxed rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl border border-gray-800">
                                                       Mark this ticket as a Special Ticket for facilitators, vendors, resource persons, and other designated guests. You can set any price, including free, and attendees will automatically be assigned to the selected guest category for easier tracking and reporting.
                                                       <div className="absolute top-full left-4 w-3 h-3 bg-gray-900 rotate-45 -translate-y-1.5 border-b border-r border-gray-800"></div>
                                                   </div>
                                               </div>
                                           </div>
                                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-tight leading-tight">
                                               (For Facilitators/Speakers, Special guests, Vendors, Resource Persons, and other designated guests)
                                           </p>
                                       </div>
                                   </div>
                                </div>

                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <Type size={12} className="text-secondary" />
                                       Ticket Name
                                   </label>
                                   <input
                                      type="text"
                                      placeholder="e.g., VIP Early Bird"
                                      className="w-full p-4 sm:p-5 bg-white border border-gray-300 rounded-2xl sm:rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none transition-all shadow-sm"
                                      value={ticket.name}
                                      onChange={(e) => updateTicket(ticket.id, "name", e.target.value)}
                                   />
                                </div>

                                <div className="space-y-3">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                       <FileText size={12} className="text-secondary" />
                                       Description
                                   </label>
                                   <textarea
                                      rows={2}
                                      placeholder="What's included in this tier? (e.g., Free drinks, Front row seating)"
                                      className="w-full p-4 sm:p-5 bg-white border border-gray-300 rounded-2xl sm:rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none transition-all shadow-sm resize-none"
                                      value={ticket.description || ""}
                                      onChange={(e) => updateTicket(ticket.id, "description", e.target.value)}
                                   />
                                </div>

                                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                                   <div className="space-y-3">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 sm:h-10 flex items-end pb-1 gap-2">
                                          <MousePointer2 size={12} className="text-secondary shrink-0" />
                                          <span>Pricing</span>
                                      </label>
                                      <div className="relative">
                                          <select
                                             className="w-full pl-5 pr-10 py-3 sm:py-4 bg-white border border-gray-300 rounded-2xl sm:rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none appearance-none shadow-sm"
                                             value={ticket.type}
                                             onChange={(e) => updateTicket(ticket.id, "type", e.target.value as TicketType)}
                                          >
                                             <option value="FREE">Free</option>
                                             <option value="PAID">Paid</option>
                                          </select>
                                          <ChevronDown size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                      </div>
                                   </div>
                                   <div className="space-y-3">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 sm:h-10 flex items-end pb-1 gap-2">
                                          <Coins size={12} className="text-secondary shrink-0" />
                                          <span>Ticket Price</span>
                                      </label>
                                      <div className="relative">
                                          <span className="absolute left-5 top-1/2 -translate-y-1/2 text-secondary font-black text-xs">₦</span>
                                          <input
                                             type="number"
                                             disabled={ticket.type === "FREE"}
                                             className="w-full pl-10 pr-5 py-3 sm:py-4 bg-white border border-gray-300 rounded-2xl sm:rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 disabled:bg-gray-100 disabled:opacity-50 outline-none shadow-sm"
                                             value={ticket.price ?? ""}
                                             onChange={(e) => updateTicket(ticket.id, "price", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                          />
                                      </div>
                                   </div>
                                   <div className="space-y-3 md:col-span-1">
                                      <label htmlFor={`totalQuantity-${ticket.id}`} className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 sm:h-10 flex items-end pb-1 gap-2">
                                          <Layers size={12} className="text-secondary shrink-0" />
                                          <span>Available Quantity</span>
                                      </label>
                                      <input
                                         id={`totalQuantity-${ticket.id}`}
                                         type="number"
                                         className="w-full px-5 py-3 sm:py-4 bg-white border border-gray-300 rounded-2xl sm:rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none shadow-sm"
                                         value={ticket.totalQuantity ?? ""}
                                         onChange={(e) => updateTicket(ticket.id, "totalQuantity", e.target.value === "" ? "" : parseInt(e.target.value))}
                                      />
                                   <p className="text-[9px] font-bold text-gray-400 mt-1 ml-1 uppercase">
                                       Max: {Math.max(0, basicInfo.capacity - tickets.filter(t => t.id !== ticket.id).reduce((sum, t) => sum + (t.totalQuantity || 0), 0))}
                                   </p>
                                   </div>
                                </div>

                                <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
                                   <div className="space-y-3">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 sm:h-10 flex items-end pb-1 gap-2">
                                          <Users size={12} className="text-secondary shrink-0" />
                                          <span>Minimum Tickets per Order</span>
                                      </label>
                                      <input
                                         type="number"
                                      min="1"
                                         className="w-full px-5 py-3 sm:py-4 bg-white border border-gray-300 rounded-2xl sm:rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none shadow-sm"
                                         value={ticket.groupSize ?? ""}
                                      onChange={(e) => updateTicket(ticket.id, "groupSize", e.target.value === "" ? "" : Math.max(1, parseInt(e.target.value) || 1))}
                                      />
                                   </div>
                                   <div className="space-y-3">
                                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 sm:h-10 flex items-end pb-1 gap-2">
                                          <Ticket size={12} className="text-secondary shrink-0" />
                                          <span>Maximum Tickets per Order</span>
                                      </label>
                                      <input
                                         type="number"
                                         className="w-full px-5 py-3 sm:py-4 bg-white border border-gray-300 rounded-2xl sm:rounded-3xl text-sm font-bold focus:border-secondary focus:ring-4 focus:ring-secondary/5 outline-none shadow-sm"
                                         value={ticket.maxPerOrder ?? ""}
                                         onChange={(e) => updateTicket(ticket.id, "maxPerOrder", e.target.value === "" ? "" : parseInt(e.target.value))}
                                      />
                                   </div>
                                </div>

                                <div className="pt-6 sm:pt-10 border-t border-gray-100 space-y-6 sm:space-y-12">
                                   <h5 className="text-[12px] font-black text-primary uppercase tracking-[0.2em] sm:tracking-[0.4em] flex items-center gap-3">
                                       <Settings size={16} />
                                       Ticket Configuration
                                   </h5>

                                   <div className="space-y-6 sm:space-y-8 pl-2 sm:pl-4 border-l-2 border-gray-100">
                                       <div className="space-y-4 sm:space-y-6">
                                               <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] sm:tracking-[0.3em]">Ticket Selling Start and End Date</h6>
                                               <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                                   <div className="space-y-2">
                                                       <label className="text-[9px] font-bold text-gray-400 uppercase">Sales Start Date</label>
                                                       <input
                                                           type="datetime-local"
                                                           className="w-full px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none"
                                                           value={ticket.salesStart}
                                                           onChange={(e) => updateTicket(ticket.id, "salesStart", e.target.value)}
                                                       />
                                                   </div>
                                                   <div className="space-y-2">
                                                       <label className="text-[9px] font-bold text-gray-400 uppercase">Sales End Date</label>
                                                       <input
                                                           type="datetime-local"
                                                           className="w-full px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none"
                                                           value={ticket.salesEnd}
                                                           onChange={(e) => updateTicket(ticket.id, "salesEnd", e.target.value)}
                                                       />
                                                   </div>
                                               </div>
                                           </div>

                                           <div className="pt-8 border-t border-gray-50 space-y-6">
                                           <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Early Bird Discount (Optional)</h6>
                                           <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-3">
                                               <div className="space-y-2">
                                                   <label className="text-[9px] font-bold text-gray-400 uppercase">Early Bird Price</label>
                                                   <div className="relative">
                                                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-[10px]">₦</span>
                                                       <input
                                                           type="number"
                                                           disabled={ticket.type === "FREE"}
                                                           className="w-full pl-8 pr-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none disabled:bg-gray-100 disabled:opacity-50"
                                                           value={ticket.earlyBirdPrice ?? ""}
                                                           onChange={(e) => updateTicket(ticket.id, "earlyBirdPrice", e.target.value === "" ? "" : parseFloat(e.target.value))}
                                                       />
                                                   </div>
                                               </div>
                                               <div className="space-y-2">
                                                   <label className="text-[9px] font-bold text-gray-400 uppercase">Available Tickets at This Price</label>
                                                   <input
                                                       type="number"
                                                       disabled={ticket.type === "FREE"}
                                                       className="w-full px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none disabled:bg-gray-100 disabled:opacity-50"
                                                       value={ticket.earlyBirdLimit ?? ""}
                                                       onChange={(e) => updateTicket(ticket.id, "earlyBirdLimit", e.target.value === "" ? "" : parseInt(e.target.value))}
                                                   />
                                               </div>
                                               <div className="space-y-2">
                                                   <label className="text-[9px] font-bold text-gray-400 uppercase">Discount Ends On</label>
                                                   <input
                                                       type="datetime-local"
                                                       disabled={ticket.type === "FREE"}
                                                       className="w-full px-4 py-2 sm:py-3 bg-white border border-gray-200 rounded-2xl text-sm font-semibold focus:border-primary focus:ring-2 focus:ring-primary/5 outline-none disabled:bg-gray-100 disabled:opacity-50"
                                                       value={ticket.earlyBirdExpiry}
                                                       onChange={(e) => updateTicket(ticket.id, "earlyBirdExpiry", e.target.value)}
                                                   />
                                               </div>
                                           </div>
                                       </div>

                                       <div className="pt-8 border-t border-gray-50 space-y-6">
                                           <div className="flex items-center justify-between">
                                               <div className="flex items-center gap-1.5 relative group/discount-tooltip">
                                                   <h6 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Quantity Discounts</h6>
                                                   <Info size={12} className="text-gray-400 hover:text-primary cursor-help shrink-0 -mt-0.5" />
                                                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/discount-tooltip:block bg-gray-900 text-white text-[10px] font-bold rounded-xl p-3 w-64 z-[110] shadow-xl pointer-events-none text-left leading-relaxed normal-case tracking-normal">
                                                       <p className="mb-2">Offer automatic discounts when attendees purchase multiple tickets.</p>
                                                       <p className="text-gray-300 font-normal">For example, buy 5 tickets and get 10% off.</p>
                                                   </div>
                                               </div>
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
                                                               min="2"
                                                               className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold outline-none"
                                                               value={discount.minQuantity ?? ""}
                                                               onChange={(e) => updateQuantityDiscount(ticket.id, dIndex, "minQuantity", e.target.value === "" ? "" : Math.max(2, parseInt(e.target.value) || 2))}
                                                           />
                                                       </div>
                                                       <div className="space-y-2">
                                                           <label className="text-[8px] font-bold text-gray-400 uppercase">Discount Percentage</label>
                                                           <div className="relative">
                                                               <span className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-black text-[9px]">%</span>
                                                               <input
                                                                   type="number"
                                                                   className="w-full pr-8 pl-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold outline-none"
                                                                   value={discount.discountPercentage ?? ""}
                                                                   onChange={(e) => updateQuantityDiscount(ticket.id, dIndex, "discountPercentage", e.target.value === "" ? "" : parseFloat(e.target.value))}
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
                                           <div className="pt-2 flex justify-end">
                                               <button
                                                   type="button"
                                                   onClick={() => window.open("/organizer/dashboard/settings?tab=discounts", "_blank")}
                                                   className="flex items-center gap-2 bg-white text-secondary border border-secondary font-black px-4 py-2 rounded-xl hover:bg-secondary/5 transition-all text-[9px] uppercase tracking-wider active:scale-95 shadow-sm"
                                               >
                                                   Create Discount Code
                                               </button>
                                           </div>
                                       </div>
                                   </div>
                                </div>
                            </div>
                        </div>
                      </React.Fragment>
                    ))}
                 </div>
              </div>
            )}

            {/* STEP 3: SCHEDULE */}
            {currentStep === 3 && (
              <div className="space-y-12 animate-in fade-in duration-500">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">Event Timeline</h3>
                        <p className="text-sm text-gray-400 font-medium mt-1">
                            {!basicInfo.agendaEnabled
                                ? "Agenda is currently disabled. Enable it in Step 1 to author sessions."
                                : "Define sessions, assign speakers, and set the schedule."}
                        </p>
                    </div>
                    {basicInfo.agendaEnabled && (
                        <button onClick={() => setSessions([...sessions, { id: Math.random().toString(), title: "", description: "", startTime: "", endTime: "", location: "", speakerIds: [], speakerNames: [] }])} className="flex items-center gap-3 bg-primary text-white font-black px-8 py-5 rounded-3xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20">
                            <Plus size={18} /> Add Session
                        </button>
                    )}
                 </div>

                 {!basicInfo.agendaEnabled ? (
                    <div className="py-20 bg-gray-50/50 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center text-center px-10">
                        <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-gray-200 shadow-sm mb-6">
                            <Calendar size={32} />
                        </div>
                        <h4 className="text-xl font-black text-gray-900 mb-2">Sessions are Disabled</h4>
                        <p className="text-sm text-gray-400 font-medium max-w-sm mb-8">You chose not to include an agenda for this event. You can skip this step or go back to Step 1 to enable it.</p>
                        <button onClick={() => setCurrentStep(1)} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Enable Agenda in Step 1</button>
                    </div>
                 ) : (
                    <div className="space-y-8">
                        {sessions.map((session, index) => (
                            <div key={session.id} className="p-10 bg-gray-50/50 rounded-[3.5rem] border border-gray-100 group/session hover:bg-white hover:shadow-4xl transition-all duration-700 relative">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-gray-100 pb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 rounded-2xl bg-white text-primary flex items-center justify-center shadow-xl shadow-gray-200/50 border border-gray-100 group-hover/session:bg-primary group-hover/session:text-white transition-all duration-500 font-black">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-gray-900 uppercase tracking-[0.3em] text-[10px]">Session Tracking</h4>
                                            <p className="text-sm font-black text-gray-400 mt-1">{session.title || 'Untitled Session'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {session.id.length >= 10 && (
                                            <button
                                                onClick={() => handleUpdateSession(session)}
                                                className="text-[8px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg uppercase tracking-widest border border-primary/10 hover:bg-primary hover:text-white transition-all"
                                            >
                                                Update
                                            </button>
                                        )}
                                        <button onClick={() => deleteSession(session.id)} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-secondary bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-gray-100">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className={`grid grid-cols-1 gap-8 ${showPreview ? "2xl:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                                    <div className={`space-y-3 ${showPreview ? "2xl:col-span-2" : "md:col-span-2 lg:col-span-3"}`}>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Session Title</label>
                                        <input type="text" placeholder="e.g., Opening Keynote" className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold outline-none focus:border-primary transition-all shadow-sm" value={session.title} onChange={(e) => updateSession(session.id, "title", e.target.value)} />
                                    </div>

                                    <div className="md:col-span-2 lg:col-span-3 space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Event Description</label>
                                        <textarea rows={3} placeholder="What will happen during this session?" className="w-full p-6 bg-white border border-gray-300 rounded-3xl text-sm font-bold outline-none focus:border-primary transition-all shadow-sm resize-none" value={session.description} onChange={(e) => updateSession(session.id, "description", e.target.value)} />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Commences</label>
                                        <input type="datetime-local" className="w-full p-5 bg-white border border-gray-300 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all" value={session.startTime} min={basicInfo.startDate} max={basicInfo.endDate} onChange={(e) => updateSession(session.id, "startTime", e.target.value)} />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Concludes</label>
                                        <input type="datetime-local" className="w-full p-5 bg-white border border-gray-300 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all" value={session.endTime} min={session.startTime || basicInfo.startDate} max={basicInfo.endDate} onChange={(e) => updateSession(session.id, "endTime", e.target.value)} />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Primary Location</label>
                                        <input type="text" placeholder="e.g., Main Hall" className="w-full p-5 bg-white border border-gray-300 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all" value={session.location} onChange={(e) => updateSession(session.id, "location", e.target.value)} />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Specific Room</label>
                                        <input type="text" placeholder="e.g., Suite 402" className="w-full p-5 bg-white border border-gray-300 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all" value={session.room || ""} onChange={(e) => updateSession(session.id, "room", e.target.value)} />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Designated Stage</label>
                                        <input type="text" placeholder="e.g., Alpha Stage" className="w-full p-5 bg-white border border-gray-300 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all" value={session.stage || ""} onChange={(e) => updateSession(session.id, "stage", e.target.value)} />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Session Type</label>
                                        <div className="relative">
                                            <select className="w-full p-5 bg-white border border-gray-300 rounded-2xl text-xs font-bold outline-none focus:border-primary transition-all appearance-none" value={session.sessionType || ""} onChange={(e) => updateSession(session.id, "sessionType", e.target.value)}>
                                                <option value="">Unspecified</option>
                                                <option value="keynote">Keynote</option>
                                                <option value="workshop">Workshop</option>
                                                <option value="panel">Panel Discussion</option>
                                                <option value="networking">Networking</option>
                                                <option value="break">Break/Meal</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className={`space-y-5 pt-4 ${showPreview ? "2xl:col-span-3" : "md:col-span-2 lg:col-span-3"}`}>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Assigned Speakers</label>
                                        <div className="flex flex-wrap gap-3">
                                            {speakers.filter(s => s.name).map((speaker, sIdx) => {
                                                const isAssigned = session.speakerNames?.includes(speaker.name);
                                                return (
                                                    <button
                                                        key={sIdx}
                                                        onClick={() => {
                                                            const currentIds = session.speakerIds || [];
                                                            const currentNames = session.speakerNames || [];
                                                            let nextIds, nextNames;

                                                            if (isAssigned) {
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                nextIds = currentIds.filter(id => id !== (speaker as any).id);
                                                                nextNames = currentNames.filter(name => name !== speaker.name);
                                                            } else {
                                                                nextIds = [...currentIds];
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                if ((speaker as any).id) nextIds.push((speaker as any).id);
                                                                nextNames = [...currentNames, speaker.name];
                                                            }

                                                            const updatedSessions = [...sessions];
                                                            updatedSessions[index] = {
                                                                ...session,
                                                                speakerIds: nextIds,
                                                                speakerNames: nextNames
                                                            };
                                                            setSessions(updatedSessions);
                                                        }}
                                                        className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300 ${
                                                            isAssigned
                                                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                                            : 'bg-white border-gray-200 text-gray-500 hover:border-primary hover:text-primary'
                                                        }`}
                                                    >
                                                        <div className="w-6 h-6 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                            {speaker.imageUrl && <Image src={speaker.imageUrl} alt={speaker.name} width={24} height={24} unoptimized={true} className="object-cover" />}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{speaker.name}</span>
                                                        {isAssigned && <ShieldCheck size={12} strokeWidth={3} />}
                                                    </button>
                                                );
                                            })}
                                            {speakers.filter(s => s.name).length === 0 && (
                                                <p className="text-[10px] text-gray-400 italic">No speakers defined in Step 1.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {sessions.length === 0 && (
                            <div className="py-20 bg-gray-50/50 rounded-[3rem] border border-gray-100 flex flex-col items-center justify-center text-center px-10">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No sessions defined yet.</p>
                                <button onClick={() => setSessions([{ id: Math.random().toString(), title: "", description: "", startTime: "", endTime: "", location: "", speakerIds: [], speakerNames: [] }])} className="mt-4 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Add Your First Session</button>
                            </div>
                        )}
                    </div>
                 )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className={`bg-white px-4 sm:px-6 md:px-10 lg:px-12 py-6 sm:py-8 border-t border-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6 ${showPreview ? "2xl:px-16" : "xl:px-16"}`}>
             <button onClick={() => router.back()} className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors order-last md:order-first">Discard Changes</button>
             <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 w-full md:w-auto">
                <button
                    onClick={() => saveAllChanges(false)}
                    disabled={saving}
                    className="flex items-center gap-2.5 bg-white text-gray-900 border border-gray-200 font-black px-5 md:px-8 py-3.5 md:py-5 rounded-[1.5rem] md:rounded-[2rem] shadow-sm hover:border-secondary hover:text-secondary transition-all uppercase tracking-[0.1em] md:tracking-[0.15em] text-[9px] md:text-[10px] disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <CustomLoader className="w-4 h-4" />
                            Saving...
                        </>
                    ) : (
                        <>
                            Save Changes
                            <CheckCircle2 size={16} className="text-emerald-500" />
                        </>
                    )}
                </button>

                {currentStep === 1 && (
                    <button
                        onClick={() => {
                            if (subStep < 5) setSubStep(subStep + 1);
                            else setCurrentStep(2);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex items-center gap-2 md:gap-3 bg-primary text-white font-black px-6 md:px-10 py-3.5 md:py-5 rounded-[1.5rem] md:rounded-[2rem] shadow-3xl shadow-primary/30 uppercase tracking-[0.15em] md:tracking-[0.2em] text-[9px] md:text-[10px]"
                    >
                        {subStep < 5 ? "Continue" : "Next: Ticketing"}
                        <ArrowRight size={18} />
                    </button>
                )}
                {currentStep === 2 && (
                    <button
                        onClick={() => {
                            if (!basicInfo.agendaEnabled) {
                                saveAllChanges(true);
                            } else {
                                setCurrentStep(3);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        }}
                        className={`flex items-center gap-2 md:gap-3 ${!basicInfo.agendaEnabled ? 'bg-secondary' : 'bg-primary'} text-white font-black px-6 md:px-10 py-3.5 md:py-5 rounded-[1.5rem] md:rounded-[2rem] shadow-3xl ${!basicInfo.agendaEnabled ? 'shadow-secondary/30' : 'shadow-primary/30'} uppercase tracking-[0.15em] md:tracking-[0.2em] text-[9px] md:text-[10px]`}
                    >
                        {!basicInfo.agendaEnabled ? "Finalize & Update" : "Next: Schedule"}
                        {!basicInfo.agendaEnabled ? <ShieldCheck size={18} /> : <ArrowRight size={18} />}
                    </button>
                )}
                {currentStep === 3 && (
                    <button onClick={() => saveAllChanges(true)} disabled={saving} className="flex items-center gap-2 md:gap-3 bg-secondary text-white font-black px-6 md:px-10 py-3.5 md:py-5 rounded-[1.5rem] md:rounded-[2rem] shadow-3xl shadow-secondary/30 uppercase tracking-[0.15em] md:tracking-[0.2em] text-[9px] md:text-[10px] disabled:opacity-50">
                        {saving ? (
                            <>
                                <CustomLoader className="w-4 h-4" />
                                Finalizing...
                            </>
                        ) : (
                            <>
                                Finalize & Update
                                <ShieldCheck size={18} />
                            </>
                        )}
                    </button>
                )}
             </div>
          </div>
        </div>

        {/* Live Preview (Desktop) */}
        {showPreview && (
          <div className="hidden lg:block w-[400px] xl:w-[480px] shrink-0 animate-in fade-in slide-in-from-right-8 duration-500 ease-out">
            <LivePreview basicInfo={basicInfo} mediaInfo={mediaInfo} speakers={speakers} agendaEnabled={basicInfo.agendaEnabled} sessions={sessions} tickets={tickets} registration={registration} />
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
            <LivePreview basicInfo={basicInfo} mediaInfo={mediaInfo} speakers={speakers} agendaEnabled={basicInfo.agendaEnabled} sessions={sessions} tickets={tickets} registration={registration} />
          </div>
        </div>
      )}
    </div>
  );
};

const ensureCorrectDependencyOrder = (fields: RegistrationField[]): RegistrationField[] => {
  // First, map fields to remove dependsOn and source if the parent field does not exist in the list
  const cleanedFields = fields.map(f => {
    if (f.dependsOn) {
      const parentFieldExists = fields.some(p =>
        p.name === f.dependsOn ||
        (f.dependsOn === 'country' && p.source === 'COUNTRIES') ||
        (f.dependsOn === 'state' && p.source === 'STATES')
      );
      if (!parentFieldExists) {
        return {
          ...f,
          type: 'text',
          source: undefined,
          dependsOn: undefined
        };
      }
    } else if (f.source === 'STATES' || f.source === 'LGAS') {
      const countryFieldExists = fields.some(p => p.source === 'COUNTRIES');
      const stateFieldExists = fields.some(p => p.source === 'STATES');

      if (f.source === 'STATES' && !countryFieldExists) {
        return {
          ...f,
          type: 'text',
          source: undefined,
          dependsOn: undefined
        };
      }
      if (f.source === 'LGAS' && !stateFieldExists) {
        return {
          ...f,
          type: 'text',
          source: undefined,
          dependsOn: undefined
        };
      }
    }
    return f;
  });

  const result = [...cleanedFields];

  // Find index of countries, states, and lgas fields
  const countryIdx = result.findIndex(f => f.source === 'COUNTRIES');
  const stateIdx = result.findIndex(f => f.source === 'STATES');
  const lgaIdx = result.findIndex(f => f.source === 'LGAS');

  // We want: countryIdx < stateIdx < lgaIdx (for whichever are present)
  // If state is present, and country is present, and state is before country:
  if (stateIdx !== -1 && countryIdx !== -1 && stateIdx < countryIdx) {
    const [countryField] = result.splice(countryIdx, 1);
    const currentStateIdx = result.findIndex(f => f.source === 'STATES');
    result.splice(currentStateIdx, 0, countryField);
  }

  // Find indices again since they might have shifted
  const newStateIdx = result.findIndex(f => f.source === 'STATES');
  const newLgaIdx = result.findIndex(f => f.source === 'LGAS');

  if (newStateIdx !== -1 && newLgaIdx !== -1 && newLgaIdx < newStateIdx) {
    const [stateField] = result.splice(newStateIdx, 1);
    const currentLgaIdx = result.findIndex(f => f.source === 'LGAS');
    result.splice(currentLgaIdx, 0, stateField);
  }

  // Also check if country is after lga if state is not present
  const finalCountryIdx = result.findIndex(f => f.source === 'COUNTRIES');
  const finalLgaIdx = result.findIndex(f => f.source === 'LGAS');
  if (finalCountryIdx !== -1 && finalLgaIdx !== -1 && finalLgaIdx < finalCountryIdx) {
    const [countryField] = result.splice(finalCountryIdx, 1);
    const currentLgaIdx = result.findIndex(f => f.source === 'LGAS');
    result.splice(currentLgaIdx, 0, countryField);
  }

  return result;
};

const EditEvent = () => {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><CustomLoader /></div>}>
      <EditEventContent />
    </Suspense>
  );
};

export default EditEvent;
