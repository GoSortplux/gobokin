"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Calendar,
  MapPin,
  Globe,
  Users,
  Ticket as TicketIcon,
  Layers,
  Trash2,
  Plus,
  Info,
  Image as ImageIcon,
  Tag,
  Zap,
  ShieldCheck,
  Palette,
  Clock,
  Layout
} from "lucide-react";
import Image from "next/image";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import { translateError } from "@/utils/errors";
import { EventType, RegistrationMode, TicketType } from "@/types";

const steps = [
  { id: 1, title: "Basic Details", icon: Info },
  { id: 2, title: "Sessions & Timeline", icon: Calendar },
  { id: 3, title: "Media & Branding", icon: Palette },
  { id: 4, title: "Ticket Options", icon: TicketIcon },
  { id: 5, title: "Registration & Launch", icon: ShieldCheck },
];

const CreateEvent = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [basicInfo, setBasicInfo] = useState({
    title: "",
    description: "",
    type: "PHYSICAL" as EventType,
    startDate: "",
    endDate: "",
    location: "",
    virtualLink: "",
    capacity: 0,
    category: "",
    tags: [] as string[],
  });

  const [sessions, setSessions] = useState([{
    id: "1",
    title: "",
    description: "",
    startTime: "",
    endTime: "",
    location: "",
  }]);

  const [branding, setBranding] = useState({
    bannerUrl: "",
    themeColor: "#295FA7",
    isFeatured: false,
  });

  const [tickets, setTickets] = useState([{
    id: "1",
    name: "General Admission",
    price: 0,
    type: "FREE" as TicketType,
    totalQuantity: 0,
    groupSize: 1,
    description: "",
    earlyBirdPrice: 0,
    earlyBirdLimit: 0,
  }]);

  const [registration, setRegistration] = useState({
    mode: "FULL_DETAILS" as RegistrationMode,
    isGroupingEnabled: false,
    enforceUniqueGroupNames: true,
    fields: [
      { name: "full-name", label: "Full Name", type: "text", required: true, isPerAttendee: true },
      { name: "email", label: "Email Address", type: "text", required: true, isPerAttendee: true },
    ] as any[],
  });

  // Handlers
  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({ ...prev, [name]: name === "capacity" ? parseInt(value) || 0 : value }));
  };

  const addSession = () => setSessions([...sessions, { id: Math.random().toString(), title: "", description: "", startTime: "", endTime: "", location: "" }]);
  const removeSession = (id: string) => sessions.length > 1 && setSessions(sessions.filter(s => s.id !== id));
  const updateSession = (id: string, field: string, value: string) => setSessions(sessions.map(s => s.id === id ? { ...s, [field]: value } : s));

  const addTicket = () => setTickets([...tickets, { id: Math.random().toString(), name: "", price: 0, type: "PAID", totalQuantity: 0, groupSize: 1, description: "", earlyBirdPrice: 0, earlyBirdLimit: 0 }]);
  const removeTicket = (id: string) => tickets.length > 1 && setTickets(tickets.filter(t => t.id !== id));
  const updateTicket = (id: string, field: string, value: any) => setTickets(tickets.map(t => t.id === id ? { ...t, [field]: value } : t));

  const addField = () => setRegistration({ ...registration, fields: [...registration.fields, { name: "", label: "", type: "text", required: false, isPerAttendee: false }] });
  const removeField = (index: number) => index > 1 && setRegistration({ ...registration, fields: registration.fields.filter((_, i) => i !== index) });
  const updateField = (index: number, field: string, value: any) => {
    const newFields = [...registration.fields];
    newFields[index] = { ...newFields[index], [field]: value };
    setRegistration({ ...registration, fields: newFields });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      Swal.showLoading();
      const payload = {
        ...basicInfo,
        ...branding,
        sessions: sessions.map(({ id, ...rest }) => rest),
        tickets: tickets.map(({ id, ...rest }) => rest),
        registrationMode: registration.mode,
        isGroupingEnabled: registration.isGroupingEnabled,
        enforceUniqueGroupNames: registration.enforceUniqueGroupNames,
        registrationFields: registration.fields,
      };

      const response = await api.post("/events", payload);
      await Swal.fire({ title: "Event Launched!", text: "Your event is now live and ready for bookings.", icon: "success" });
      router.push(`/organizer/dashboard/events/${response.data.data.id}`);
    } catch (error) {
      Swal.fire("Error", translateError(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto py-10 px-4">
      {/* Enhanced Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="space-y-4">
          <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-gray-400 hover:text-primary transition-all font-bold group">
             <ArrowLeft size={18} className="group-hover:-translate-x-1" />
             Discard and return
          </button>
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight">Setup your experience</h1>
          <p className="text-gray-500 font-medium text-lg">Step {currentStep} of 5: {steps[currentStep-1].title}</p>
        </div>

        {/* Progress Timeline */}
        <div className="bg-white p-3 rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-900/5 flex items-center gap-1">
           {steps.map((step) => (
             <div
               key={step.id}
               className={`flex items-center gap-3 px-6 py-3 rounded-[1.5rem] transition-all duration-500 ${
                 currentStep === step.id ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" :
                 currentStep > step.id ? "text-emerald-500 bg-emerald-50" : "text-gray-400"
               }`}
             >
                <step.icon size={18} />
                <span className={`text-sm font-black whitespace-nowrap ${currentStep === step.id ? "block" : "hidden lg:block"}`}>{step.title}</span>
                {currentStep > step.id && <CheckCircle2 size={16} className="ml-1" />}
             </div>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Form Area */}
        <div className="lg:col-span-8 space-y-10">
           <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-blue-900/5 overflow-hidden transition-all duration-500">
              <div className="p-8 lg:p-12">
                 {/* STEP 1: BASIC INFO */}
                 {currentStep === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                       <div className="space-y-4">
                          <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                             <div className="w-10 h-10 bg-blue-50 text-primary rounded-xl flex items-center justify-center"><Layout size={20} /></div>
                             The Big Picture
                          </h3>
                          <p className="text-gray-500 font-medium">Start with the fundamental details of your event.</p>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="md:col-span-2 space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Title</label>
                             <input
                               type="text"
                               name="title"
                               placeholder="Give your event a catchy name..."
                               className="w-full p-5 bg-gray-50 border-2 border-transparent rounded-2xl text-lg font-bold focus:bg-white focus:border-primary transition-all"
                               value={basicInfo.title}
                               onChange={handleBasicChange}
                             />
                          </div>

                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Type</label>
                             <div className="grid grid-cols-3 gap-2">
                                {["PHYSICAL", "ONLINE", "HYBRID"].map(t => (
                                  <button
                                    key={t}
                                    onClick={() => setBasicInfo({...basicInfo, type: t as any})}
                                    className={`py-4 rounded-2xl text-xs font-black transition-all border-2 ${
                                      basicInfo.type === t ? "bg-primary border-primary text-white shadow-lg" : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100"
                                    }`}
                                  >
                                    {t}
                                  </button>
                                ))}
                             </div>
                          </div>

                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                             <select
                               name="category"
                               className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold text-gray-700 focus:ring-2 focus:ring-primary/20"
                               value={basicInfo.category}
                               onChange={handleBasicChange}
                             >
                                <option value="">Select a Category</option>
                                <option value="Technology">Technology</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Business">Business</option>
                                <option value="Lifestyle">Lifestyle</option>
                             </select>
                          </div>

                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date & Time</label>
                             <input type="datetime-local" name="startDate" className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold" value={basicInfo.startDate} onChange={handleBasicChange} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">End Date & Time</label>
                             <input type="datetime-local" name="endDate" className="w-full p-5 bg-gray-50 border-none rounded-2xl font-bold" value={basicInfo.endDate} onChange={handleBasicChange} />
                          </div>

                          <div className="md:col-span-2 space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                             <textarea
                               name="description"
                               rows={5}
                               placeholder="Tell the world why they shouldn't miss this event..."
                               className="w-full p-6 bg-gray-50 border-none rounded-[2rem] font-medium text-gray-700 leading-relaxed focus:ring-2 focus:ring-primary/20"
                               value={basicInfo.description}
                               onChange={handleBasicChange}
                             />
                          </div>
                       </div>
                    </div>
                 )}

                 {/* STEP 2: SESSIONS */}
                 {currentStep === 2 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                       <div className="flex items-center justify-between">
                          <div className="space-y-2">
                            <h3 className="text-2xl font-black text-gray-900">Event Timeline</h3>
                            <p className="text-gray-500 font-medium">Break your event into sessions or workshops.</p>
                          </div>
                          <button onClick={addSession} className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center hover:scale-110 transition-transform shadow-xl shadow-primary/20">
                             <Plus size={28} />
                          </button>
                       </div>

                       <div className="space-y-6">
                          {sessions.map((s, i) => (
                             <div key={s.id} className="relative group">
                                <div className="absolute -left-4 top-10 w-8 h-8 rounded-full bg-white border-4 border-primary z-10 flex items-center justify-center font-black text-xs">
                                   {i+1}
                                </div>
                                <div className="ml-4 p-8 bg-gray-50 rounded-[2.5rem] border border-transparent group-hover:border-primary/20 group-hover:bg-white group-hover:shadow-xl transition-all duration-500 space-y-6">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="md:col-span-2 flex items-center justify-between gap-4">
                                         <input
                                           placeholder="Session Title (e.g., Opening Keynote)"
                                           className="flex-1 bg-transparent border-b-2 border-gray-200 py-2 font-black text-xl focus:border-primary outline-none transition-all"
                                           value={s.title}
                                           onChange={(e) => updateSession(s.id, "title", e.target.value)}
                                         />
                                         <button onClick={() => removeSession(s.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                                      </div>
                                      <div className="space-y-1">
                                         <label className="text-[10px] font-black text-gray-400 uppercase">Starts</label>
                                         <input type="datetime-local" className="w-full p-3 bg-white rounded-xl text-sm font-bold" value={s.startTime} onChange={(e) => updateSession(s.id, "startTime", e.target.value)} />
                                      </div>
                                      <div className="space-y-1">
                                         <label className="text-[10px] font-black text-gray-400 uppercase">Ends</label>
                                         <input type="datetime-local" className="w-full p-3 bg-white rounded-xl text-sm font-bold" value={s.endTime} onChange={(e) => updateSession(s.id, "endTime", e.target.value)} />
                                      </div>
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {/* STEP 3: BRANDING */}
                 {currentStep === 3 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                             <Palette size={24} className="text-primary" />
                             Media & Branding
                          </h3>
                          <p className="text-gray-500 font-medium">Make your event stand out visually.</p>
                       </div>

                       <div className="space-y-8">
                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Banner URL</label>
                             <div className="relative group overflow-hidden rounded-[2.5rem] bg-gray-100 aspect-video border-4 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 hover:bg-gray-50 transition-all">
                                {branding.bannerUrl ? (
                                   <>
                                      <Image src={branding.bannerUrl} alt="Banner" fill className="object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                         <button onClick={() => setBranding({...branding, bannerUrl: ""})} className="bg-white/20 backdrop-blur-md text-white p-4 rounded-full hover:scale-110 transition-transform">
                                            <Trash2 size={24} />
                                         </button>
                                      </div>
                                   </>
                                ) : (
                                   <>
                                      <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-gray-300 shadow-sm"><ImageIcon size={40} /></div>
                                      <div className="text-center">
                                         <p className="font-bold text-gray-900">Enter image URL to preview</p>
                                         <p className="text-xs text-gray-400">High resolution 16:9 images work best.</p>
                                      </div>
                                      <input
                                         type="text"
                                         placeholder="https://example.com/banner.jpg"
                                         className="w-4/5 p-4 bg-white rounded-2xl text-sm border border-gray-100 shadow-sm focus:ring-2 focus:ring-primary/20"
                                         value={branding.bannerUrl}
                                         onChange={(e) => setBranding({...branding, bannerUrl: e.target.value})}
                                      />
                                   </>
                                )}
                             </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Theme Accent Color</label>
                                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                   <input type="color" className="w-12 h-12 rounded-xl bg-transparent border-none cursor-pointer" value={branding.themeColor} onChange={(e) => setBranding({...branding, themeColor: e.target.value})} />
                                   <div>
                                      <p className="text-sm font-black text-gray-900">{branding.themeColor.toUpperCase()}</p>
                                      <p className="text-[10px] text-gray-400 font-bold uppercase">Click to change</p>
                                   </div>
                                </div>
                             </div>
                             <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Featured Placement</label>
                                <button
                                  onClick={() => setBranding({...branding, isFeatured: !branding.isFeatured})}
                                  className={`w-full p-4 rounded-2xl flex items-center justify-between border-2 transition-all ${branding.isFeatured ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-transparent"}`}
                                >
                                   <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${branding.isFeatured ? "bg-amber-400 text-white" : "bg-white text-gray-300"}`}><Star size={20} /></div>
                                      <div className="text-left">
                                         <p className="text-sm font-black text-gray-900">Featured Event</p>
                                         <p className="text-[10px] text-gray-400 font-bold uppercase">Apply for VIP boost</p>
                                      </div>
                                   </div>
                                   <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${branding.isFeatured ? "border-amber-400 bg-amber-400" : "border-gray-200"}`}>
                                      {branding.isFeatured && <CheckCircle2 size={14} className="text-white" />}
                                   </div>
                                </button>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* STEP 4: TICKETING */}
                 {currentStep === 4 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                       <div className="flex items-center justify-between">
                          <div className="space-y-2">
                             <h3 className="text-2xl font-black text-gray-900">Ticket Inventory</h3>
                             <p className="text-gray-500 font-medium">Create multiple ticket tiers for different access levels.</p>
                          </div>
                          <button onClick={addTicket} className="flex items-center gap-2 bg-primary text-white font-black px-6 py-3 rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                             <Plus size={20} />
                             Add Tier
                          </button>
                       </div>

                       <div className="space-y-8">
                          {tickets.map((t, idx) => (
                             <div key={t.id} className="p-8 bg-white rounded-[3rem] border-2 border-gray-100 hover:border-primary/20 shadow-xl shadow-blue-900/5 transition-all duration-500 relative">
                                <div className="absolute -top-4 -right-4">
                                   <button onClick={() => removeTicket(t.id)} className="w-10 h-10 bg-white border border-gray-100 text-gray-300 hover:text-red-500 rounded-full flex items-center justify-center shadow-lg transition-colors"><Trash2 size={18} /></button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                   <div className="md:col-span-2 space-y-4">
                                      <div className="space-y-2">
                                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tier Name</label>
                                         <input
                                           placeholder="e.g., VIP All Access"
                                           className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black text-lg"
                                           value={t.name}
                                           onChange={(e) => updateTicket(t.id, "name", e.target.value)}
                                         />
                                      </div>
                                      <div className="space-y-2">
                                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description (What's included?)</label>
                                         <textarea
                                           rows={3}
                                           placeholder="e.g., Free lunch, Reserved seating, Afterparty access..."
                                           className="w-full p-4 bg-gray-50 border-none rounded-2xl text-sm font-medium"
                                           value={t.description}
                                           onChange={(e) => updateTicket(t.id, "description", e.target.value)}
                                         />
                                      </div>
                                   </div>

                                   <div className="space-y-6">
                                      <div className="space-y-2">
                                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ticket Type</label>
                                         <div className="flex p-1 bg-gray-50 rounded-2xl">
                                            {["FREE", "PAID"].map(type => (
                                               <button
                                                 key={type}
                                                 onClick={() => updateTicket(t.id, "type", type)}
                                                 className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${t.type === type ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                               >
                                                  {type}
                                               </button>
                                            ))}
                                         </div>
                                      </div>

                                      {t.type === 'PAID' && (
                                         <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Price (₦)</label>
                                            <input
                                              type="number"
                                              className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black text-xl text-primary"
                                              value={t.price}
                                              onChange={(e) => updateTicket(t.id, "price", parseFloat(e.target.value))}
                                            />
                                         </div>
                                      )}

                                      <div className="space-y-2">
                                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantity</label>
                                         <input
                                           type="number"
                                           className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black"
                                           value={t.totalQuantity}
                                           onChange={(e) => updateTicket(t.id, "totalQuantity", parseInt(e.target.value))}
                                         />
                                      </div>
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}

                 {/* STEP 5: REGISTRATION & LAUNCH */}
                 {currentStep === 5 && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                       <div className="space-y-2">
                          <h3 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                             <ShieldCheck size={24} className="text-emerald-500" />
                             Finalize Registration
                          </h3>
                          <p className="text-gray-500 font-medium">Configure how you collect attendee information.</p>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                          <div className="space-y-6">
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Registration Mode</h4>
                             <div className="space-y-3">
                                {[
                                   { id: "FULL_DETAILS", title: "Attendee-Specific", desc: "Detailed info for every guest" },
                                   { id: "BASIC_QUANTITY", title: "Bulk/Buyer-Only", desc: "Quick checkout for groups" }
                                ].map(m => (
                                   <button
                                     key={m.id}
                                     onClick={() => setRegistration({...registration, mode: m.id as any})}
                                     className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all relative ${registration.mode === m.id ? "bg-blue-50 border-primary shadow-lg ring-4 ring-primary/5" : "bg-gray-50 border-transparent hover:bg-gray-100"}`}
                                   >
                                      <p className="font-black text-gray-900">{m.title}</p>
                                      <p className="text-xs text-gray-500 mt-1">{m.desc}</p>
                                      {registration.mode === m.id && <div className="absolute top-6 right-6 text-primary"><CheckCircle2 size={24} /></div>}
                                   </button>
                                ))}
                             </div>
                          </div>

                          <div className="space-y-6">
                             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Collection</h4>
                             <div className="space-y-3">
                                {registration.fields.map((f, i) => (
                                   <div key={i} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group">
                                      <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm font-black text-xs">{i+1}</div>
                                         <span className="text-sm font-bold text-gray-700">{f.label}</span>
                                      </div>
                                      {i > 1 && (
                                         <button onClick={() => removeField(i)} className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                                      )}
                                   </div>
                                ))}
                                <button onClick={addField} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold text-sm hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2">
                                   <Plus size={18} />
                                   Add Custom Question
                                </button>
                             </div>
                          </div>
                       </div>

                       {/* LAUNCH PREVIEW BOX */}
                       <div className="bg-gray-900 rounded-[3rem] p-10 lg:p-14 text-white relative overflow-hidden shadow-2xl">
                          <div className="relative z-10 space-y-8">
                             <div className="space-y-2 text-center md:text-left">
                                <h4 className="text-3xl font-black tracking-tight">Ready to launch?</h4>
                                <p className="text-blue-100/60 font-medium">Review your details carefully. Your event will be live immediately.</p>
                             </div>

                             <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 p-6 bg-white/5 rounded-3xl border border-white/10">
                                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Event Snapshot</p>
                                   <div className="space-y-4">
                                      <div className="flex items-center gap-4">
                                         <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary"><Calendar size={20} /></div>
                                         <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">Starts On</p>
                                            <p className="font-black text-white">{basicInfo.startDate || "TBD"}</p>
                                         </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                         <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400"><TicketIcon size={20} /></div>
                                         <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase">Total Tickets</p>
                                            <p className="font-black text-white">{tickets.reduce((acc, t) => acc + t.totalQuantity, 0)} slots</p>
                                         </div>
                                      </div>
                                   </div>
                                </div>
                                <button
                                  onClick={handleSubmit}
                                  disabled={loading}
                                  className="w-full md:w-auto px-16 py-8 bg-primary text-white font-black rounded-[2rem] hover:scale-105 hover:shadow-2xl hover:shadow-primary/40 transition-all text-xl flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                   {loading ? "Launching..." : "Launch Experience"}
                                   <Zap size={24} className="fill-white" />
                                </button>
                             </div>
                          </div>
                          <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 skew-x-12 translate-x-1/2"></div>
                       </div>
                    </div>
                 )}
              </div>

              {/* Enhanced Footer Navigation */}
              <div className="px-8 lg:px-12 py-10 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                 <button
                   onClick={() => currentStep > 1 && setCurrentStep(currentStep-1)}
                   className={`flex items-center gap-2 font-black text-gray-500 hover:text-gray-900 transition-all ${currentStep === 1 ? "opacity-0 pointer-events-none" : ""}`}
                 >
                   <ArrowLeft size={20} />
                   Go Back
                 </button>

                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">Step {currentStep} of 5</span>
                    {currentStep < 5 && (
                       <button
                         onClick={() => setCurrentStep(currentStep+1)}
                         className="px-12 py-5 bg-primary text-white font-black rounded-3xl hover:shadow-xl hover:shadow-primary/20 transition-all flex items-center gap-2"
                       >
                         Continue
                         <ArrowRight size={20} />
                       </button>
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* Sidebar Info - Help & Tips */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-gray-900 rounded-[3rem] p-10 text-white space-y-8 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                 <div className="w-16 h-16 bg-white/10 rounded-[2rem] flex items-center justify-center text-amber-400 backdrop-blur-md">
                    <Zap size={32} />
                 </div>
                 <h4 className="text-2xl font-black leading-tight">Pro-Tip for Organizers</h4>
                 <p className="text-blue-100/60 font-medium leading-relaxed">
                    Events with clear sessions and detailed ticket descriptions see a 40% higher conversion rate. Try adding more value details!
                 </p>
                 <ul className="space-y-4 pt-4">
                    <li className="flex items-start gap-3">
                       <CheckCircle2 size={18} className="text-emerald-400 mt-1" />
                       <span className="text-sm font-bold">Use high-quality banners</span>
                    </li>
                    <li className="flex items-start gap-3">
                       <CheckCircle2 size={18} className="text-emerald-400 mt-1" />
                       <span className="text-sm font-bold">Add early bird incentives</span>
                    </li>
                 </ul>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
           </div>

           <div className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm space-y-6">
              <h4 className="text-lg font-black text-gray-900">Need Assistance?</h4>
              <div className="space-y-4">
                 <button className="w-full p-5 bg-gray-50 rounded-2xl flex items-center gap-4 hover:bg-gray-100 transition-all text-left group">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm"><Info size={20} /></div>
                    <span className="text-sm font-bold text-gray-700">Creation Guide</span>
                 </button>
                 <button className="w-full p-5 bg-gray-50 rounded-2xl flex items-center gap-4 hover:bg-gray-100 transition-all text-left group">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-sm"><Globe size={20} /></div>
                    <span className="text-sm font-bold text-gray-700">Contact Support</span>
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
