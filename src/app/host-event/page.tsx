"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Type,
  Layout,
  Tag,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  ChevronDown,
  Info,
  ShieldCheck,
  User,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  Sparkles,
  Zap,
  Eye,
  EyeOff,
  Image as ImageIcon,
  XCircle
} from "lucide-react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { EventType, RegistrationMode, Speaker } from "@/types";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";

const steps = [
  { id: 1, title: "Identity", icon: Type },
  { id: 2, title: "Speakers", icon: Users },
  { id: 3, title: "Settings", icon: ShieldCheck },
  { id: 4, title: "Narrative", icon: FileText },
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
  speakers: Speaker[];
  agendaEnabled: boolean;
}

const LivePreview = ({ basicInfo, speakers, agendaEnabled }: LivePreviewProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!agendaEnabled && activeTab === "schedule") {
      setActiveTab("overview");
    }
  }, [agendaEnabled, activeTab]);

  const tabs = ["overview", "speakers"];

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
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-3">
            <ImageIcon size={40} strokeWidth={1.5} />
            <p className="text-[10px] font-bold uppercase tracking-widest text-center px-4">Banner will be added in Step 5</p>
          </div>
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
                        <User size={24} />
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
    speakers: [] as Speaker[],
    registration: {
      mode: "FULL_DETAILS" as RegistrationMode,
    }
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
    if (savedDraft) {
      try {
        setFormData(JSON.parse(savedDraft));
      } catch (e) {
        console.error("Failed to parse draft:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
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

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleFinalize();
    }
  };

  const handleFinalize = async () => {
    const isOrganizer = user?.role?.includes('organizer');

    if (!user) {
        // Save draft one last time before redirecting
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        localStorage.setItem("gobokin_event_creation_draft_auto_resume", "true");
        localStorage.setItem("gobokin_is_first_event_flow", "true");
        localStorage.setItem("returnUrl", "/organizer/dashboard/events/create");
        router.push("/auth/register");
        return;
    }

    setIsFinalizing(true);
    Swal.showLoading();

    try {
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDraft));
        localStorage.setItem("gobokin_event_creation_draft_auto_resume", "true");

        if (!isOrganizer) {
            localStorage.setItem("gobokin_is_first_event_flow", "true");
        }

        Swal.fire({
            title: 'Event Initialized!',
            text: 'Redirecting to your dashboard to complete the setup.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });

        router.push("/organizer/dashboard/events/create");
    } catch (error) {
        console.error("Failed to initialize event:", error);
        Swal.fire("Error", translateError(error), "error");
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

        <div className="flex items-center gap-4 mb-12 overflow-x-auto no-scrollbar pb-2">
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
          <div className="flex-1 w-full max-w-4xl">
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
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">Only collect the buyer's information, regardless of quantity.</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {currentStep === 4 && (
                  <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">Detailed Description</h3>
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
                          Your event outline is ready. Next, we&apos;ll help you create your organizer profile to finalize ticketing and launch. Your progress is saved automatically.
                        </p>
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
                disabled={isFinalizing}
                className={`flex items-center gap-3 bg-primary text-white font-semibold px-10 py-4 rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 ${isFinalizing ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <span>{currentStep === 4 ? (user ? "Finalize & Continue" : "Register to Finalize Event") : "Next Step"}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {showPreview && (
            <div className="hidden lg:block w-[400px] xl:w-[480px] shrink-0 animate-in fade-in slide-in-from-right-12 duration-1000 ease-out">
              <LivePreview
                basicInfo={formData.basicInfo}
                speakers={formData.speakers}
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
              speakers={formData.speakers}
              agendaEnabled={formData.basicInfo.agendaEnabled}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HostEventPage;
