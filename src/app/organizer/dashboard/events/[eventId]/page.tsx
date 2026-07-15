"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import {
  ArrowLeft,
  Calendar,
  PlayCircle,
  PauseCircle,
  MapPin,
  Users,
  TrendingUp,
  Ticket,
  Settings,
  Share2,
  Radio,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Plus,
  Tag,
  Shield,
  ExternalLink,
  Image as ImageIcon,
  Video,
  User,
  Clock,
  Globe,
  Download,
  UserPlus,
  ShieldCheck,
  Mail,
  Trash2,
  MousePointer2,
  Percent,
  Search,
  XCircle
} from "lucide-react";
import Image from "next/image";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { useOrganizerRules } from "@/hooks/useOrganizerRules";
import { Event, Analytics, StaffMember, WaitlistEntry } from "@/types";
import CustomLoader from "@/components/CustomLoader";
import Swal from "@/utils/sweetalert";
import { triggerSuccessConfetti } from "@/utils/confetti";
import { translateError } from "@/utils/errors";
import AssignStaffModal from "@/components/organizer/AssignStaffModal";
import WalkInRegistrationModal from "@/components/organizer/WalkInRegistrationModal";
import SuspendModal from "@/components/organizer/SuspendModal";
import MessageGuestModal from "@/components/organizer/MessageGuestModal";
import { ResourcesTab } from "@/components/organizer/ResourcesTab";
import RegistrationDetailsModal from "@/components/organizer/RegistrationDetailsModal";

interface TrackerDailyAttendance {
  day: number;
  attended: boolean;
  checkInTime?: string;
  checkedInBy?: {
    fullName: string;
    email: string;
    role: string;
  };
}

interface TrackerRegistrationDetail {
  id: string;
  ticketNumber: string;
  attendeeName: string;
  attendeeEmail: string;
  ticketName: string;
  guestCategory: string;
  overallCheckInStatus: boolean;
  dailyAttendance: TrackerDailyAttendance[];
}

const EventDetails = () => {
  const { user } = useAuth();
  const { isRestricted, getRule } = useOrganizerRules();
  const { eventId } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);

  const isStaff = user?.role?.includes('organizer-staff');
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendees, setAttendees] = useState<{ id?: string; attendeeName?: string; attendeeEmail?: string; ticketName?: string; ticketNumber?: string; status?: string; checkInStatus?: boolean; createdAt: string; attendeeData?: Record<string, string>; checkedInBy?: { fullName: string; email: string } }[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [attendeeSearchTerm, setAttendeeSearchTerm] = useState("");
  const [waitlistSearchTerm, setWaitlistSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [attendeeSubTab, setAttendeeSubTab] = useState<"list" | "attendance">("list");

  // Attendance Tracker States
  const [trackerRegistrations, setTrackerRegistrations] = useState<TrackerRegistrationDetail[]>([]);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerSearch, setTrackerSearch] = useState("");
  const [trackerDay, setTrackerDay] = useState<string>("");
  const [trackerStatus, setTrackerStatus] = useState<string>("");
  const [trackerPage, setTrackerPage] = useState(1);
  const [trackerLimit] = useState(10);
  const [trackerTotal, setTrackerTotal] = useState(0);
  const [trackerPages, setTrackerPages] = useState(1);
  const [trackerEventDays, setTrackerEventDays] = useState(0);

  const [selectedTicketNumberForModal, setSelectedTicketNumberForModal] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [suspendConfig, setSuspendConfig] = useState<{ type: "event" | "ticket"; title: string; ticketId?: string }>({ type: "event", title: "" });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setActiveMenu(null), []);
  useOnClickOutside(menuRef, closeMenu);

  const filteredAttendees = attendees.filter(attendee => {
    const searchLower = attendeeSearchTerm.toLowerCase();
    return (
      attendee.attendeeName?.toLowerCase().includes(searchLower) ||
      attendee.attendeeEmail?.toLowerCase().includes(searchLower) ||
      attendee.ticketNumber?.toLowerCase().includes(searchLower) ||
      attendee.id?.toLowerCase().includes(searchLower)
    );
  });

  const filteredWaitlist = waitlist.filter(entry => {
    const searchLower = waitlistSearchTerm.toLowerCase();
    return (
      entry.fullName?.toLowerCase().includes(searchLower) ||
      entry.email?.toLowerCase().includes(searchLower)
    );
  });

  const getEffectiveStatus = (event: Event) => {
    if (!event.isPublished) return "DRAFT";
    if (event.status === "CANCELLED") return "CANCELLED";

    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    if (now < start) return "UPCOMING";
    if (now >= start && now <= end) return "ONGOING";
    return "COMPLETED";
  };

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);

        // Only fetch analytics if not staff
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const promises: [Promise<any>, Promise<any> | null] = [
          api.get(`/events/${eventId}`),
          !isStaff ? api.get(`/events/${eventId}/analytics`) : null
        ];

        const [eventRes, analyticsRes] = await Promise.all(promises);

        setEvent(eventRes.data.data);
        if (analyticsRes) {
          setAnalytics(analyticsRes.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch event data:", error);
        Swal.fire("Error", translateError(error), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  useEffect(() => {
    if (activeTab === "staff" && eventId) {
      const fetchStaff = async () => {
        try {
          const response = await api.get(`/events/${eventId}/staff`);
          // Extract nested staff data from the assignment objects
          const staffMembers = (response.data.data || []).map((item: { staff: StaffMember }) => item.staff).filter(Boolean);
          setStaff(staffMembers);
        } catch (error) {
          console.error("Failed to fetch staff:", error);
        }
      };
      fetchStaff();
    }
  }, [activeTab, eventId]);

  useEffect(() => {
    if (activeTab === "waitlist" && eventId) {
      const fetchWaitlist = async () => {
        try {
          setWaitlistLoading(true);
          const response = await api.get(`/events/${eventId}/waitlist`);
          setWaitlist(response.data.data || []);
        } catch (error) {
          console.error("Failed to fetch waitlist:", error);
          setWaitlist([]);
        } finally {
          setWaitlistLoading(false);
        }
      };
      fetchWaitlist();
    }
  }, [activeTab, eventId]);

  useEffect(() => {
    if (activeTab === "attendees" && eventId) {
      const fetchAttendees = async () => {
        try {
          setAttendeesLoading(true);
          // Correct endpoint according to requirements
          const response = await api.get(`/events/${eventId}/orders`);

          // Orders typically contain nested registration/attendee data
          // If the API returns orders, we may need to flatten them for the attendees list
          const orders = response.data.data || [];

          // Based on common patterns in this repo, if orders have registrations:
          let flattenedAttendees = [];
          if (Array.isArray(orders)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            flattenedAttendees = orders.flatMap((order: any) => {
              const registrations = order.registrations || [];
              if (registrations.length === 0) {
                 return [{
                   ...order,
                   attendeeName: order.buyerInfo?.fullName || "Guest",
                   attendeeEmail: order.buyerInfo?.email || "N/A",
                   ticketName: order.ticketName || "Standard Entry",
                   ticketNumber: `ORD-${order.id?.slice(0, 8)}`,
                   status: order.status || "PENDING",
                   createdAt: order.createdAt
                 }];
              }

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return registrations.map((reg: any) => ({
                ...reg,
                orderId: order.id,
                attendeeName: reg.attendeeData?.fullName || reg.attendeeData?.['full-name'] || order.buyerInfo?.fullName || "Guest",
                attendeeEmail: reg.attendeeData?.email || order.buyerInfo?.email || "N/A",
                ticketName: reg.ticketId?.name || order.ticketName || "Standard Entry",
                ticketNumber: reg.ticketNumber || `ORD-${order.id?.slice(0, 8)}`,
                status: reg.paymentStatus || order.status || "PAID",
                createdAt: reg.createdAt || order.createdAt,
                checkedInBy: reg.checkedInBy
              }));
            });
          }

          setAttendees(flattenedAttendees);
        } catch (error) {
          console.error("Failed to fetch attendees/orders:", error);
          setAttendees([]);
        } finally {
          setAttendeesLoading(false);
        }
      };
      fetchAttendees();
    }
  }, [activeTab, eventId]);

  const fetchTrackerRegistrations = useCallback(async () => {
    if (!eventId || activeTab !== "attendees" || attendeeSubTab !== "attendance") return;
    try {
      setTrackerLoading(true);
      const params: Record<string, string | number> = {
        page: trackerPage,
        limit: trackerLimit,
      };
      if (trackerSearch.trim()) {
        params.search = trackerSearch.trim();
      }
      if (trackerStatus) {
        params.attendanceStatus = trackerStatus;
        if (trackerDay) {
          params.day = parseInt(trackerDay);
        }
      }
      const response = await api.get(`/events/${eventId}/registrations`, { params });
      setTrackerRegistrations(response.data.data || []);
      setTrackerTotal(response.data.pagination?.total || 0);
      setTrackerPages(response.data.pagination?.pages || 1);
      setTrackerEventDays(response.data.eventDays || 0);
    } catch (error) {
      console.error("Failed to fetch tracker registrations:", error);
    } finally {
      setTrackerLoading(false);
    }
  }, [eventId, activeTab, attendeeSubTab, trackerPage, trackerLimit, trackerSearch, trackerDay, trackerStatus]);

  useEffect(() => {
    fetchTrackerRegistrations();
  }, [fetchTrackerRegistrations]);

  const handleAssignStaff = async (staffId: string) => {
    try {
      await api.post(`/events/${eventId}/staff`, { staffId });
      Swal.fire('Assigned!', 'Staff member has been assigned to this event.', 'success');
      const response = await api.get(`/events/${eventId}/staff`);
      const staffMembers = (response.data.data || []).map((item: { staff: StaffMember }) => item.staff).filter(Boolean);
      setStaff(staffMembers);
    } catch (error) {
      Swal.fire('Error', translateError(error), 'error');
    }
  };

  const handleUnassignStaff = async (staffId: string) => {
    const result = await Swal.fire({
      title: 'Unassign Staff?',
      text: 'This staff member will no longer have access to this specific event.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, unassign',
      confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
      try {
        Swal.showLoading();
        await api.delete(`/events/${eventId}/staff/${staffId}`);
        Swal.fire('Unassigned!', 'Staff member has been unassigned from this event.', 'success');
        const response = await api.get(`/events/${eventId}/staff`);
        const staffMembers = (response.data.data || []).map((item: { staff: StaffMember }) => item.staff).filter(Boolean);
        setStaff(staffMembers);
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  const handleSuspendRegistration = async (data: { reason: string; pauseScope: string; resumeAt?: string }) => {
    try {
      setIsActionLoading(true);
      Swal.showLoading();
      await api.post(`/events/${eventId}/registration/suspend`, data);
      Swal.fire('Suspended!', 'Registration has been suspended.', 'success');
      const eventRes = await api.get(`/events/${eventId}`);
      setEvent(eventRes.data.data);
    } catch (error) {
      Swal.fire('Error', translateError(error), 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResumeRegistration = async () => {
    const result = await Swal.fire({
      title: 'Resume Registration?',
      text: 'This will allow attendees to register for your event again.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Resume',
      confirmButtonColor: '#10b981',
    });

    if (result.isConfirmed) {
      try {
        setIsActionLoading(true);
        Swal.showLoading();
        await api.post(`/events/${eventId}/registration/resume`);
        Swal.fire('Resumed!', 'Registration is now active.', 'success');
        const eventRes = await api.get(`/events/${eventId}`);
        setEvent(eventRes.data.data);
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleSuspendTicketSales = async (ticketId: string, data: { reason: string; pauseScope: string; resumeAt?: string }) => {
    try {
      setIsActionLoading(true);
      Swal.showLoading();
      await api.post(`/events/${eventId}/tickets/${ticketId}/suspend-sales`, data);
      Swal.fire('Suspended!', 'Ticket sales have been suspended.', 'success');
      const eventRes = await api.get(`/events/${eventId}`);
      setEvent(eventRes.data.data);
    } catch (error) {
      Swal.fire('Error', translateError(error), 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleResumeTicketSales = async (ticketId: string) => {
    const result = await Swal.fire({
      title: 'Resume Sales?',
      text: 'This will make this ticket category available for purchase again.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Resume',
      confirmButtonColor: '#10b981',
    });

    if (result.isConfirmed) {
      try {
        setIsActionLoading(true);
        Swal.showLoading();
        await api.post(`/events/${eventId}/tickets/${ticketId}/resume-sales`);
        Swal.fire('Resumed!', 'Ticket sales are now active.', 'success');
        const eventRes = await api.get(`/events/${eventId}`);
        setEvent(eventRes.data.data);
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleNotifyGuest = async (entry: WaitlistEntry) => {
    const { value: formValues, isConfirmed } = await Swal.fire({
      title: 'Direct Notification',
      html: `
        <div class="text-left space-y-6 pt-4 px-1">
          <div class="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
             <div class="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm shrink-0 border border-blue-100">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z"/><polyline points="15,9 18,9 18,11"/><path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2v0"/></svg>
             </div>
             <div class="overflow-hidden">
                <p class="text-[9px] font-black text-primary uppercase tracking-widest opacity-70">Target Guest</p>
                <p class="text-sm font-bold text-gray-700 truncate">${entry.fullName}</p>
                <p class="text-[10px] text-primary/60 font-medium truncate">${entry.email}</p>
             </div>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Broaden Audience (Optional)
            </label>
            <select id="swal-segment" class="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all cursor-pointer">
              <option value="custom">Send to this Guest only</option>
              <option value="all">Send to ALL Attendees</option>
              <option value="registered">Send to Registered Only</option>
              <option value="checked-in">Send to Checked-in Only</option>
              <option value="not_checked_in">Send to Not Checked-in Only</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject Line</label>
            <input id="swal-subject" type="text" class="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all" value="Waitlist Update: ${event?.title}">
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Message Body</label>
            <textarea id="swal-body" rows="4" class="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-sm font-medium focus:border-primary outline-none transition-all resize-none" placeholder="Enter your message here..."></textarea>
          </div>
        </div>
      `,
      customClass: {
        popup: 'rounded-[2.5rem] border-none shadow-2xl p-6',
        title: 'text-2xl font-black tracking-tight text-gray-900 pt-4',
        confirmButton: 'bg-primary text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all border-none mx-2',
        cancelButton: 'px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors bg-transparent border-none mx-2'
      },
      buttonsStyling: false,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Deliver Message',
      preConfirm: () => {
        const segment = (document.getElementById('swal-segment') as HTMLSelectElement).value;
        const subject = (document.getElementById('swal-subject') as HTMLInputElement).value;
        const body = (document.getElementById('swal-body') as HTMLTextAreaElement).value;
        if (!subject || !body) {
          Swal.showValidationMessage('Please enter both subject and message body');
          return false;
        }
        return { segment, subject, body };
      }
    });

    if (isConfirmed && formValues) {
      try {
        Swal.showLoading();
        await api.post(`/events/${eventId}/broadcast`, {
          subject: formValues.subject,
          body: formValues.body,
          segments: formValues.segment === 'custom' ? { emails: [entry.email] } : formValues.segment
        });
        Swal.fire('Sent!', 'Guest has been notified.', 'success');
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      }
    }
  };

  const handleMessageGuest = () => {
    if (isRestricted('BROADCAST_ALLOWED')) {
      const rule = getRule('BROADCAST_ALLOWED');
      Swal.fire({
        title: rule?.title || 'Feature Restricted',
        text: rule?.uxContext || 'Manual messaging is not available on your current plan.',
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
      return;
    }
    setIsBroadcastModalOpen(true);
  };

  const handleShare = () => {
    if (!event) return;

    // Construct the public event URL
    // organizerSlug and eventSlug are needed
    const organizerSlug = event.organizer?.slug;
    const eventSlug = event.slug;

    if (!organizerSlug || !eventSlug) {
      Swal.fire("Error", "Public URL not available yet.", "error");
      return;
    }

    const publicUrl = `${window.location.origin}/events/${organizerSlug}/${eventSlug}`;

    const shareData = {
      title: event.title,
      text: `Check out ${event.title} on Gobokin!`,
      url: publicUrl,
    };

    if (navigator.share) {
      navigator.share(shareData).catch((_err) => {
        // Silently handle share cancellation
      });
    } else {
      navigator.clipboard.writeText(publicUrl);
      Swal.toast.fire({
        icon: 'success',
        title: 'Event link copied to clipboard!',
        timer: 2000
      });
    }
  };

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
        setIsActionLoading(true);
        Swal.showLoading();
        await api.post(`/events/${eventId}/publish`);
        triggerSuccessConfetti();
        Swal.fire('Published!', 'Your event is now live.', 'success');
        // Refresh event data
        const eventRes = await api.get(`/events/${eventId}`);
        setEvent(eventRes.data.data);
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleUnpublish = async () => {
    const result = await Swal.fire({
      title: 'Unpublish Event?',
      text: 'This will hide your event from the public and suspend ticket sales.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Unpublish',
      confirmButtonColor: '#f59e0b',
    });

    if (result.isConfirmed) {
      try {
        setIsActionLoading(true);
        Swal.showLoading();
        await api.post(`/events/${eventId}/unpublish`);
        Swal.fire('Unpublished!', 'Your event has been moved to drafts.', 'success');
        // Refresh event data
        const eventRes = await api.get(`/events/${eventId}`);
        setEvent(eventRes.data.data);
      } catch (error) {
        Swal.fire('Error', translateError(error), 'error');
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  if (loading) return <div className="h-full flex items-center justify-center"><CustomLoader /></div>;
  if (!event) return <div className="p-20 text-center"><AlertCircle className="mx-auto mb-4 text-red-500" size={48} /><h3 className="text-xl font-bold">Event not found</h3></div>;

  const handleRestrictedAction = (key: string, defaultTitle: string, defaultText: string) => {
    if (isRestricted(key)) {
      const rule = getRule(key);
      Swal.fire({
        title: rule?.title || defaultTitle,
        text: rule?.uxContext || defaultText,
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
    return false;
  };

  return (
    <div className="space-y-8 pb-12">
      <SuspendModal
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        title={suspendConfig.title}
        type={suspendConfig.type}
        onConfirm={async (data) => {
          if (suspendConfig.type === "event") {
            await handleSuspendRegistration(data);
          } else if (suspendConfig.ticketId) {
            await handleSuspendTicketSales(suspendConfig.ticketId, data);
          }
        }}
      />
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 px-2">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-bold group w-fit">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          Back to My Events
        </button>
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-1 sm:pb-0 w-full sm:w-auto">
          <button
            onClick={handleShare}
            className="p-2.5 sm:p-3 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all border border-gray-100 sm:border-none shrink-0"
          >
            <Share2 size={20} />
          </button>

          {!isStaff && (
            <>
              {!event.isPublished ? (
                <button
                  onClick={handlePublish}
                  disabled={isActionLoading}
                  className="flex items-center gap-2 bg-emerald-50 text-emerald-600 font-bold px-4 sm:px-5 py-2.5 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 whitespace-nowrap shrink-0"
                >
                  <CheckCircle2 size={18} />
                  Publish
                </button>
              ) : (
                <button
                  onClick={handleUnpublish}
                  disabled={isActionLoading}
                  className="flex items-center gap-2 bg-amber-50 text-amber-600 font-bold px-4 sm:px-5 py-2.5 rounded-xl hover:bg-amber-600 hover:text-white transition-all border border-amber-100 whitespace-nowrap shrink-0"
                >
                  <EyeOff size={18} />
                  Unpublish
                </button>
              )}

              <button onClick={handleMessageGuest} className="flex items-center gap-2 bg-blue-50 text-primary font-bold px-4 sm:px-5 py-2.5 rounded-xl hover:bg-blue-100 transition-all border border-blue-100 whitespace-nowrap shrink-0">
                <Mail size={18} />
                Message Guest
              </button>
              <Link href={`/organizer/dashboard/events/${eventId}/edit`} className="flex items-center gap-2 bg-primary text-white font-bold px-4 sm:px-5 py-2.5 rounded-xl hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 whitespace-nowrap shrink-0">
                <Settings size={18} />
                Edit Event
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Header Profile Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-8">
           <div className="w-full lg:w-48 h-48 rounded-3xl overflow-hidden relative shadow-lg">
             {event.bannerUrl || (event as { image?: string }).image ? (
               <Image src={event.bannerUrl || (event as { image?: string }).image!} alt={event.title} fill className="object-cover" />
             ) : (
               <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center text-5xl font-black">
                 {event.title[0]}
               </div>
             )}
           </div>

           <div className="flex-1 text-center lg:text-left space-y-4">
             <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-black text-primary uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-xl w-fit">
               <CheckCircle2 size={14} />
               {getEffectiveStatus(event)}
             </div>
             <h1 className="text-3xl lg:text-4xl font-black text-primary tracking-tight">{event.title}</h1>
             <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-gray-500 font-medium">
               <div className="flex items-center gap-2">
                 <Calendar className="text-primary" size={18} />
                 {(() => {
                   const start = new Date(event.startDate);
                   const end = new Date(event.endDate);
                   const isMultiDay = start.toDateString() !== end.toDateString();
                   const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
                   if (isMultiDay) {
                     return `${start.toLocaleDateString(undefined, formatOptions)} - ${end.toLocaleDateString(undefined, formatOptions)}`;
                   }
                   return start.toLocaleDateString(undefined, formatOptions);
                 })()}
               </div>
               <div className="flex items-center gap-2">
                 <MapPin className="text-primary" size={18} />
                 {event.location || "Virtual Event"}
               </div>
               <div className="flex items-center gap-2">
                 <Users className="text-primary" size={18} />
                 {event.capacity} Capacity
               </div>
             </div>
           </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(isStaff ? [
          { label: "Ticket Sales", value: analytics?.orders || 0, icon: Ticket, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Checked-in", value: analytics?.summary?.checkedInGuests || 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Registrations", value: event?._count?.registrations ?? event?.soldQuantity ?? analytics?.registrations ?? 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Attendance Rate", value: `${analytics?.summary?.attendanceRate || 0}%`, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
        ] : [
          { label: "Ticket Sales", value: analytics?.orders || 0, icon: Ticket, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Revenue", value: `₦${analytics?.totalRevenue?.toLocaleString() || 0}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Registrations", value: event?._count?.registrations ?? event?.soldQuantity ?? analytics?.registrations ?? 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Detail Views", value: (event?.analytics?.detailViews || analytics?.views || 0).toLocaleString(), icon: Eye, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Impressions", value: (event?.analytics?.impressions || 0).toLocaleString(), icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Clicks", value: (event?.analytics?.clicks || 0).toLocaleString(), icon: MousePointer2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "CTR", value: `${(event?.analytics?.ctr || 0).toFixed(2)}%`, icon: Percent, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Click to Detail", value: `${(event?.analytics?.clickToDetailRate || 0).toFixed(2)}%`, icon: Percent, color: "text-amber-600", bg: "bg-amber-50" },
        ]).map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 group">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black text-gray-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Tabs & Detailed Content */}
      <div className="space-y-6">
         <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-full overflow-x-auto no-scrollbar sm:w-fit">
            {["overview", "schedule", "tickets", "resources", "attendees", "waitlist", "staff"].filter(t => !isStaff || (t !== "staff" && t !== "waitlist")).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[13px] sm:text-sm font-bold capitalize transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
         </div>

         <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 min-h-[400px]">
            {activeTab === "resources" && (
              isRestricted('RESOURCES_ALLOWED') ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-500">
                    <Radio size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{getRule('RESOURCES_ALLOWED')?.title || 'Feature Restricted'}</h3>
                  <p className="text-gray-500 max-w-sm text-center mt-2">
                    {getRule('RESOURCES_ALLOWED')?.uxContext || 'Resource sharing is not available on your current plan.'}
                  </p>
                  <button
                    onClick={() => router.push('/organizer/dashboard/settings?tab=subscriptions')}
                    className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all font-medium"
                  >
                    Upgrade Now
                  </button>
                </div>
              ) : (
                <ResourcesTab
                  eventId={eventId as string}
                  ticketTypes={event.tickets?.map(t => ({ id: t.id!, name: t.name })) || []}
                />
              )
            )}

            {activeTab === "overview" && (
              <div className="space-y-16 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">About Event</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
                      </div>

                      {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                           {event.tags.map((tag, i) => (
                             <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200">
                               <Tag size={12} />
                               {tag}
                             </span>
                           ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-4">
                         <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Category</p>
                            <p className="text-sm font-bold text-gray-700">{event.category}</p>
                         </div>
                         <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Registration Mode</p>
                            <p className="text-sm font-bold text-gray-700">{event.registrationMode?.replace('_', ' ') || 'FULL DETAILS'}</p>
                         </div>
                         <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Grouping</p>
                            <p className="text-sm font-bold text-gray-700">{event.isGroupingEnabled ? "Enabled" : "Disabled"}</p>
                         </div>
                         <div className="p-4 bg-gray-50 rounded-2xl">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Visibility</p>
                            <p className="text-sm font-bold text-gray-700">{event.isPublic ? "Public" : "Private"}</p>
                         </div>
                      </div>

                      {event.registrationFields && event.registrationFields.length > 0 && (
                        <div className="space-y-4 pt-4">
                           <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Registration Fields</h3>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {event.registrationFields.map((field, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                   <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm">
                                      <CheckCircle2 size={16} />
                                   </div>
                                   <div>
                                      <p className="text-xs font-bold text-gray-700">{field.label}</p>
                                      <p className="text-[10px] text-gray-400 font-medium">{field.type} • {field.required ? 'Required' : 'Optional'}</p>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="space-y-8">
                      <div className="space-y-4">
                        <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Quick Stats</h3>
                        <div className="bg-gray-50 rounded-3xl p-6 space-y-6 border border-gray-100">
                           <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-gray-500">Capacity Utilization</span>
                              <span className="text-sm font-black text-gray-900">{Math.round((event._count?.registrations ?? event.soldQuantity ?? analytics?.registrations ?? 0) / (event.capacity || 1) * 100)}%</span>
                           </div>
                           <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, ((event._count?.registrations ?? event.soldQuantity ?? analytics?.registrations ?? 0) / (event.capacity || 1) * 100))}%` }}
                              ></div>
                           </div>
                           <p className="text-xs text-gray-400 font-medium">Currently {event._count?.registrations ?? event.soldQuantity ?? analytics?.registrations ?? 0} registered out of {event.capacity} total slots.</p>
                        </div>
                      </div>

                      {(event.location || event.virtualLink) && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Access Details</h3>
                          <div className="bg-gray-50 rounded-3xl p-6 space-y-4 border border-gray-100">
                             {event.location && (
                               <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm">
                                    <MapPin size={16} />
                                  </div>
                                  <div className="flex-1">
                                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Physical Location</p>
                                     <p className="text-sm font-bold text-gray-700">{event.location}</p>
                                     {event.mapLink && (
                                       <a href={event.mapLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-primary hover:underline">
                                         <ExternalLink size={12} />
                                         View on Google Maps
                                       </a>
                                     )}
                                  </div>
                               </div>
                             )}
                             {event.virtualLink && (
                               <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm">
                                    <Globe size={16} />
                                  </div>
                                  <div className="flex-1">
                                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Virtual Link</p>
                                     <p className="text-sm font-bold text-primary truncate max-w-xs">{event.virtualLink}</p>
                                     <a href={event.virtualLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-primary hover:underline">
                                       <ExternalLink size={12} />
                                       Join Event
                                     </a>
                                  </div>
                               </div>
                             )}
                          </div>
                        </div>
                      )}
                   </div>
                </div>

                {/* Media Gallery */}
                {event.mediaUrls && event.mediaUrls.length > 0 && (
                   <div className="space-y-4">
                      <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Media Gallery</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                         {event.mediaUrls.map((url, i) => (
                           <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 group">
                              {url && typeof url === 'string' && url.match(/\.(mp4|webm|ogg)$/) ? (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                   <Video size={40} />
                                </div>
                              ) : (
                                <Image src={url} alt={`Gallery ${i}`} fill className="object-cover transition-transform group-hover:scale-110" />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <button className="p-2 bg-white rounded-full text-primary shadow-lg">
                                    {url && typeof url === 'string' && url.match(/\.(mp4|webm|ogg)$/) ? <Video size={20} /> : <ImageIcon size={20} />}
                                 </button>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                )}

                {/* Organizer Section */}
                {event.organizer && (
                   <div className="space-y-4">
                      <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Organizer Profile</h3>
                      <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex items-center gap-6">
                         <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-2xl">
                            {event.organizer.userProfile?.fullName?.[0] || 'O'}
                         </div>
                         <div>
                            <h4 className="font-bold text-gray-900">{event.organizer.userProfile?.fullName}</h4>
                            <p className="text-sm text-gray-500">{event.organizer.userProfile?.email}</p>
                            <div className="flex gap-4 mt-2">
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Commission: {event.organizer.commissionRate}%</span>
                               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Payout: {event.organizer.payoutPolicy?.replace('_', ' ')}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                )}

                {/* Speakers Section */}
                <div className="space-y-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Featured Speakers</h3>
                      <button className="flex items-center gap-2 text-primary font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                        <Plus size={16} />
                        Add Speaker
                      </button>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {event.speakers && event.speakers.length > 0 ? (
                        event.speakers.map((speaker, i) => (
                          <div key={i} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-300 group">
                             <div className="flex items-center gap-4 mb-6">
                                <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-md">
                                   {speaker.imageUrl ? (
                                     <Image src={speaker.imageUrl} alt={speaker.name} fill className="object-cover" />
                                   ) : (
                                     <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center">
                                        <User size={32} />
                                     </div>
                                   )}
                                </div>
                                <div>
                                   <h4 className="font-bold text-gray-900 text-lg leading-tight">{speaker.name}</h4>
                                   <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">{speaker.title}</p>
                                </div>
                             </div>
                             <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all">
                                {speaker.bio}
                             </p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                           <User className="mx-auto mb-4 text-gray-300" size={32} />
                           <p className="text-gray-400 font-medium text-sm">No speakers listed for this event.</p>
                        </div>
                      )}
                   </div>
                </div>

                {/* Agenda Section */}
                <div className="space-y-8">
                   <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Event Agenda</h3>
                      <button className="flex items-center gap-2 text-primary font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                        <Plus size={16} />
                        Add Agenda Item
                      </button>
                   </div>

                   <div className="space-y-6">
                      {event.agenda && event.agenda.length > 0 ? (
                        event.agenda.map((item, i) => (
                          <div key={i} className="flex gap-6 group">
                             <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-xl bg-secondary text-white flex items-center justify-center font-bold text-sm z-10 shadow-lg shadow-secondary/20">
                                   {i + 1}
                                </div>
                                {i !== event.agenda!.length - 1 && <div className="flex-1 w-[2px] bg-gray-100 my-1"></div>}
                             </div>
                             <div className="flex-1 pb-8">
                                <div className="bg-gray-50 p-6 rounded-3xl border border-transparent group-hover:border-secondary/20 group-hover:bg-white group-hover:shadow-lg transition-all duration-300">
                                   <div className="flex items-center justify-between mb-4">
                                      <h4 className="font-bold text-gray-900 text-lg">{item.title}</h4>
                                      <div className="flex items-center gap-3">
                                         <span className="flex items-center gap-1 text-xs font-bold text-secondary bg-orange-50 px-3 py-1 rounded-lg">
                                            <Clock size={14} />
                                            {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                         </span>
                                      </div>
                                   </div>
                                   <p className="text-gray-500 text-sm mb-4 leading-relaxed">{item.description}</p>
                                   {item.speakerName && (
                                     <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
                                        <User size={12} className="text-secondary" />
                                        Speaker: {item.speakerName}
                                     </div>
                                   )}
                                </div>
                             </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                           <Calendar className="mx-auto mb-4 text-gray-300" size={32} />
                           <p className="text-gray-400 font-medium text-sm">No agenda items added to this event.</p>
                        </div>
                      )}
                   </div>
                </div>

                {/* Refund Policy */}
                <div className="space-y-4">
                   <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4">Refund Policy</h3>
                   <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-12 h-12 rounded-2xl bg-white text-secondary flex items-center justify-center shadow-sm border border-gray-100">
                            <Shield size={24} />
                         </div>
                         <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Policy Type</p>
                            <h4 className="text-xl font-black text-gray-900">{event.refundType || 'NONE'}</h4>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Refund Percentage</p>
                            <p className="text-lg font-black text-primary">{event.refundPercentage || 0}%</p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cutoff Days</p>
                            <p className="text-lg font-black text-primary">{event.refundCutoffDays || 0} Days before event</p>
                         </div>
                         <div className="md:col-span-3 space-y-2 mt-4 pt-4 border-t border-gray-200">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detailed Terms</p>
                            <p className="text-sm text-gray-600 leading-relaxed italic">
                               {event.refundPolicy || "No custom refund policy specified for this event."}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}


            {activeTab === "schedule" && (
              <div className="space-y-6 animate-in fade-in duration-500">
                 <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900">Event Schedule</h3>
                    <button className="flex items-center gap-2 text-primary font-bold text-sm bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors">
                      <Plus size={16} />
                      Add Session
                    </button>
                 </div>

                 <div className="space-y-4">
                    {event.sessions && event.sessions.length > 0 ? (
                      event.sessions.map((session, i) => (
                        <div key={i} className="flex gap-6 group">
                           <div className="flex flex-col items-center">
                              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm z-10">
                                 {i + 1}
                              </div>
                              {i !== event.sessions!.length - 1 && <div className="flex-1 w-[2px] bg-gray-100 my-1"></div>}
                           </div>
                           <div className="flex-1 pb-8">
                              <div className="bg-gray-50 p-6 rounded-3xl border border-transparent group-hover:border-primary/20 group-hover:bg-white group-hover:shadow-lg transition-all duration-300">
                                 <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-gray-900 text-lg">{session.title}</h4>
                                    <span className="text-xs font-bold text-primary bg-blue-100 px-3 py-1 rounded-lg">
                                      {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                 </div>
                                 <p className="text-gray-500 text-sm mb-4">{session.description}</p>
                                 {session.location && (
                                   <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest">
                                      <MapPin size={12} />
                                      {session.location}
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center py-20 text-gray-400 font-medium">No sessions scheduled for this event.</p>
                    )}
                 </div>
              </div>
            )}

            {activeTab === "tickets" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-gray-900">Ticket Management</h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">Configure sales, availability, and suspension status.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {!isStaff && (
                        <>
                          {(event.isRegistrationSuspended || event.availabilityStatus === 'SALES_PAUSED') ? (
                            <button
                              onClick={handleResumeRegistration}
                              disabled={isActionLoading}
                              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
                            >
                              <PlayCircle size={14} />
                              Resume All Registration
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSuspendConfig({ type: "event", title: "Suspend All Registration" });
                                setIsSuspendModalOpen(true);
                              }}
                              disabled={isActionLoading}
                              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 font-bold text-xs rounded-xl border border-amber-100 hover:bg-amber-600 hover:text-white transition-all"
                            >
                              <PauseCircle size={14} />
                              Suspend All Registration
                            </button>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => router.push(`/organizer/dashboard/events/${eventId}/edit?step=2`)}
                        className="flex items-center gap-2 text-primary font-bold text-xs bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100"
                      >
                        <Plus size={14} />
                        Add Ticket Type
                      </button>
                    </div>
                 </div>

                 {(event.isRegistrationSuspended || event.availabilityStatus === 'SALES_PAUSED') && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                        <AlertCircle size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-amber-700 uppercase tracking-widest">Global Registration Suspended</p>
                          <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-800 text-[9px] font-black uppercase tracking-widest">ACTIVE</span>
                        </div>
                        <p className="text-xs text-amber-600/80 font-medium mt-1 leading-relaxed">
                          Reason: {event.registrationSuspensionReason || event.registrationSuspensionDetails?.reason || "N/A"} •
                          Scope: {(event.registrationPauseScope || event.registrationSuspensionDetails?.pauseScope)?.replace('_', ' ') || "ALL CHANNELS"}
                          {(event.registrationResumeAt || event.registrationSuspensionDetails?.resumeAt) && ` • Resumes: ${new Date(event.registrationResumeAt || event.registrationSuspensionDetails!.resumeAt!).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                 )}

                 <div className="space-y-12">
                   {event.tickets && event.tickets.filter(t => !t.isSpecial).length > 0 && (
                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                           <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">Standard Tickets</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {event.tickets.filter(t => !t.isSpecial).map((ticket, i) => (
                            <div key={i} className={`p-6 rounded-3xl border border-gray-100 bg-white hover:shadow-xl transition-all duration-500 group relative flex flex-col ${activeMenu === ticket.id ? 'z-50' : 'z-0'}`}>
                           <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 overflow-hidden pointer-events-none"></div>

                           <div className={`flex items-center justify-between mb-4 relative ${activeMenu === ticket.id ? 'z-50' : 'z-10'}`}>
                              <div className="flex flex-wrap gap-1.5">
                                 <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${ticket.type === 'FREE' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {ticket.type}
                                 </span>
                                 {ticket.isOffline && (
                                   <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-600">
                                      OFFLINE
                                   </span>
                                 )}
                                 {(ticket.isSalesSuspended || ticket.salesStatus === 'PAUSED' || ticket.availabilityStatus === 'SALES_PAUSED') && (
                                   <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-rose-50 text-rose-600">
                                      PAUSED
                                   </span>
                                 )}
                              </div>
                              {!isStaff && (
                                <div className="relative" ref={activeMenu === ticket.id ? menuRef : null}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenu(activeMenu === ticket.id ? null : ticket.id!);
                                    }}
                                    className={`p-2 rounded-xl transition-all ${activeMenu === ticket.id ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-primary hover:bg-gray-50'}`}
                                  >
                                    <MoreVertical size={18} />
                                  </button>

                                  {activeMenu === ticket.id && (
                                    <div
                                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2.5 z-[100] animate-in fade-in zoom-in duration-150 origin-top-right"
                                    >
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          router.push(`/organizer/dashboard/events/${eventId}/edit?step=2`);
                                        }}
                                        className="w-full px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-gray-600 hover:bg-blue-50 hover:text-primary transition-all flex items-center gap-3 cursor-pointer group"
                                      >
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                          <Settings size={16} />
                                        </div>
                                        Edit Ticket
                                      </button>

                                      {(ticket.isSalesSuspended || ticket.salesStatus === 'PAUSED' || ticket.availabilityStatus === 'SALES_PAUSED') ? (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleResumeTicketSales(ticket.id!);
                                            setActiveMenu(null);
                                          }}
                                          disabled={isActionLoading}
                                          className="w-full px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-3 cursor-pointer group"
                                        >
                                          <div className="w-8 h-8 rounded-lg bg-emerald-50/50 flex items-center justify-center group-hover:bg-white transition-colors">
                                            <PlayCircle size={16} />
                                          </div>
                                          Resume Sales
                                        </button>
                                      ) : (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSuspendConfig({ type: "ticket", title: `Suspend ${ticket.name}`, ticketId: ticket.id });
                                            setIsSuspendModalOpen(true);
                                            setActiveMenu(null);
                                          }}
                                          disabled={isActionLoading}
                                          className="w-full px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-amber-600 hover:bg-amber-50 transition-all flex items-center gap-3 cursor-pointer group"
                                        >
                                          <div className="w-8 h-8 rounded-lg bg-amber-50/50 flex items-center justify-center group-hover:bg-white transition-colors">
                                            <PauseCircle size={16} />
                                          </div>
                                          Suspend Sales
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                           </div>

                           <div className="flex-1">
                              <h4 className="font-black text-gray-900 text-lg mb-1 relative z-10 leading-tight">{ticket.name}</h4>
                              <p className="text-gray-400 text-[10px] mb-3 line-clamp-2 font-medium">{ticket.description || "No description provided."}</p>

                              <div className="flex items-baseline gap-1 mb-4 relative z-10">
                                 <p className="text-2xl font-black text-primary">
                                   {Number(ticket.price) > 0 ? `₦${Number(ticket.price).toLocaleString()}` : "Free"}
                                 </p>
                                 {Number(ticket.price) > 0 && <span className="text-[10px] font-bold text-gray-300 uppercase">/ pax</span>}
                              </div>

                              <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-gray-50 relative z-10 mb-5">
                                 <div>
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Quantity</p>
                                    <p className="text-[11px] font-bold text-gray-600">{ticket.availableQuantity} / {ticket.totalQuantity}</p>
                                 </div>
                                 <div>
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Min Order</p>
                                    <p className="text-[11px] font-bold text-gray-600">{ticket.groupSize || 1} pax</p>
                                 </div>
                                 <div className="col-span-2">
                                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Allocation</p>
                                    <p className="text-[11px] font-bold text-gray-600 uppercase">{ticket.allocationType || "GENERAL"}</p>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-3 relative z-10">
                              <div className="flex items-center justify-between text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                 <span>Sales Progress</span>
                                 <span className="text-primary">{Math.round(((ticket.totalQuantity - (ticket.availableQuantity || 0)) / (ticket.totalQuantity || 1)) * 100)}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                 <div
                                   className="h-full bg-primary rounded-full transition-all duration-1000"
                                   style={{ width: `${Math.min(100, ((ticket.totalQuantity - (ticket.availableQuantity || 0)) / (ticket.totalQuantity || 1)) * 100)}%` }}
                                 ></div>
                              </div>
                           </div>

                           {ticket.earlyBirdPrice && (
                             <div className="mt-4 p-2 bg-emerald-50 rounded-xl border border-emerald-100/50 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                   <TrendingUp size={12} className="text-emerald-600" />
                                   <span className="text-[8px] font-black text-emerald-700 uppercase">Early Bird</span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-600">₦{Number(ticket.earlyBirdPrice).toLocaleString()}</span>
                             </div>
                           )}
                        </div>
                          ))}
                        </div>
                     </div>
                   )}

                   {event.tickets && event.tickets.filter(t => t.isSpecial).length > 0 && (
                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <div className="w-1.5 h-6 bg-amber-400 rounded-full"></div>
                           <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest text-amber-600">Special Tickets</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {event.tickets.filter(t => t.isSpecial).map((ticket, i) => (
                            <div key={i} className={`p-6 rounded-3xl border border-amber-100 bg-amber-50/5 hover:shadow-xl transition-all duration-500 group relative flex flex-col ${activeMenu === ticket.id ? 'z-50' : 'z-0'}`}>
                               <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 overflow-hidden pointer-events-none"></div>

                               <div className={`flex items-center justify-between mb-4 relative ${activeMenu === ticket.id ? 'z-50' : 'z-10'}`}>
                                  <div className="flex flex-wrap gap-1.5">
                                     <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-700">
                                        SPECIAL
                                     </span>
                                     <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${ticket.type === 'FREE' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                        {ticket.type}
                                     </span>
                                     {ticket.isOffline && (
                                       <span className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-600">
                                          OFFLINE
                                       </span>
                                     )}
                                  </div>
                                  {!isStaff && (
                                    <div className="relative" ref={activeMenu === ticket.id ? menuRef : null}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setActiveMenu(activeMenu === ticket.id ? null : ticket.id!);
                                        }}
                                        className={`p-2 rounded-xl transition-all ${activeMenu === ticket.id ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-primary hover:bg-gray-50'}`}
                                      >
                                        <MoreVertical size={18} />
                                      </button>

                                      {activeMenu === ticket.id && (
                                        <div
                                          className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2.5 z-[100] animate-in fade-in zoom-in duration-150 origin-top-right"
                                        >
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              router.push(`/organizer/dashboard/events/${eventId}/edit?step=2`);
                                            }}
                                            className="w-full px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-gray-600 hover:bg-blue-50 hover:text-primary transition-all flex items-center gap-3 cursor-pointer group"
                                          >
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                              <Settings size={16} />
                                            </div>
                                            Edit Ticket
                                          </button>

                                          {(ticket.isSalesSuspended || ticket.salesStatus === 'PAUSED' || ticket.availabilityStatus === 'SALES_PAUSED') ? (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleResumeTicketSales(ticket.id!);
                                                setActiveMenu(null);
                                              }}
                                              disabled={isActionLoading}
                                              className="w-full px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-emerald-600 hover:bg-emerald-50 transition-all flex items-center gap-3 cursor-pointer group"
                                            >
                                              <div className="w-8 h-8 rounded-lg bg-emerald-50/50 flex items-center justify-center group-hover:bg-white transition-colors">
                                                <PlayCircle size={16} />
                                              </div>
                                              Resume Sales
                                            </button>
                                          ) : (
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSuspendConfig({ type: "ticket", title: `Suspend ${ticket.name}`, ticketId: ticket.id });
                                                setIsSuspendModalOpen(true);
                                                setActiveMenu(null);
                                              }}
                                              disabled={isActionLoading}
                                              className="w-full px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-[0.1em] text-amber-600 hover:bg-amber-50 transition-all flex items-center gap-3 cursor-pointer group"
                                            >
                                              <div className="w-8 h-8 rounded-lg bg-amber-50/50 flex items-center justify-center group-hover:bg-white transition-colors">
                                                <PauseCircle size={16} />
                                              </div>
                                              Suspend Sales
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                               </div>

                               <div className="flex-1">
                                  <h4 className="font-black text-gray-900 text-lg mb-1 relative z-10 leading-tight">{ticket.name}</h4>
                                  <p className="text-gray-400 text-[10px] mb-3 line-clamp-2 font-medium">{ticket.description || "No description provided."}</p>

                                  <div className="flex items-baseline gap-1 mb-4 relative z-10">
                                     <p className="text-2xl font-black text-amber-600">
                                       {Number(ticket.price) > 0 ? `₦${Number(ticket.price).toLocaleString()}` : "Free"}
                                     </p>
                                     {Number(ticket.price) > 0 && <span className="text-[10px] font-bold text-gray-300 uppercase">/ pax</span>}
                                  </div>

                                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-gray-50 relative z-10 mb-5">
                                     <div>
                                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Quantity</p>
                                        <p className="text-[11px] font-bold text-gray-600">{ticket.availableQuantity} / {ticket.totalQuantity}</p>
                                     </div>
                                     <div>
                                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Min Order</p>
                                        <p className="text-[11px] font-bold text-gray-600">{ticket.groupSize || 1} pax</p>
                                     </div>
                                     <div className="col-span-2">
                                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Allocation</p>
                                        <p className="text-[11px] font-bold text-gray-600 uppercase">{ticket.allocationType || "GENERAL"}</p>
                                     </div>
                                  </div>
                               </div>

                               <div className="space-y-3 relative z-10">
                                  <div className="flex items-center justify-between text-[9px] font-black text-gray-400 uppercase tracking-wider">
                                     <span>Sales Progress</span>
                                     <span className="text-amber-600">{Math.round(((ticket.totalQuantity - (ticket.availableQuantity || 0)) / (ticket.totalQuantity || 1)) * 100)}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                     <div
                                       className="h-full bg-amber-400 rounded-full transition-all duration-1000"
                                       style={{ width: `${Math.min(100, ((ticket.totalQuantity - (ticket.availableQuantity || 0)) / (ticket.totalQuantity || 1)) * 100)}%` }}
                                     ></div>
                                  </div>
                               </div>
                      </div>
                          ))}
                        </div>
                     </div>
                   )}

                   {(!event.tickets || event.tickets.length === 0) && (
                     <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
                        <Ticket className="mx-auto mb-4 text-gray-300" size={48} />
                        <p className="text-gray-400 font-medium">No ticket types created yet for this event.</p>
                     </div>
                   )}
                 </div>
              </div>
            )}

            {activeTab === "waitlist" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                       <h3 className="text-lg font-black text-gray-900">Event Waitlist</h3>
                       <p className="text-xs text-gray-500 font-medium mt-1">Guests waiting for ticket tiers that are sold out.</p>
                    </div>

                    <div className="relative w-full md:w-64">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                       <input
                         type="text"
                         placeholder="Search waitlist..."
                         className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                         value={waitlistSearchTerm}
                         onChange={(e) => setWaitlistSearchTerm(e.target.value)}
                       />
                    </div>

                    <div className="flex items-center gap-3">
                       <button
                         onClick={() => {
                           if (!handleRestrictedAction('BULK_IMPORT_ALLOWED', 'Feature Restricted', 'Bulk import and export is not available on your current plan.')) {
                             // Original export logic would go here
                           }
                         }}
                         className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 font-bold text-xs rounded-xl border border-gray-100 hover:bg-gray-100 transition-all"
                       >
                          <Download size={14} />
                          Export Waitlist
                       </button>
                    </div>
                 </div>

                 {waitlistLoading ? (
                   <div className="py-20 flex justify-center"><CustomLoader /></div>
                 ) : (
                   <div className="bg-white rounded-3xl border border-gray-50 overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                         <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-50">
                               <tr>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Guest</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Requested Tier</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Position</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined At</th>
                                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                               {filteredWaitlist.length > 0 ? (
                                 filteredWaitlist.map((entry, idx) => (
                                   <tr key={entry.id || idx} className="hover:bg-gray-50/50 transition-colors group">
                                      <td className="px-6 py-6">
                                         <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-black text-sm">
                                               {entry.fullName?.[0] || 'G'}
                                            </div>
                                            <div>
                                               <p className="text-sm font-bold text-gray-900">{entry.fullName}</p>
                                               <p className="text-[10px] text-gray-400 font-medium">{entry.email}</p>
                                            </div>
                                         </div>
                                      </td>
                                      <td className="px-6 py-6">
                                         <p className="text-sm font-bold text-gray-700">{entry.ticketType?.name || entry.ticketTypeId || "Standard Pass"}</p>
                                      </td>
                                      <td className="px-6 py-6">
                                         <span className="text-sm font-black text-primary bg-primary/5 px-2.5 py-1 rounded-lg">
                                            #{entry.position || idx + 1}
                                         </span>
                                      </td>
                                      <td className="px-6 py-6">
                                         <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                            entry.status === 'NOTIFIED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                         }`}>
                                            {entry.status || 'PENDING'}
                                         </span>
                                      </td>
                                      <td className="px-6 py-6">
                                         <p className="text-[11px] font-bold text-gray-600">{new Date(entry.createdAt).toLocaleDateString()}</p>
                                      </td>
                                      <td className="px-6 py-6 text-right">
                                         <button
                                           onClick={() => handleNotifyGuest(entry)}
                                           className="px-3 py-1.5 bg-blue-50 text-primary font-bold text-[10px] rounded-lg border border-blue-100 hover:bg-primary hover:text-white transition-all"
                                         >
                                            Notify Guest
                                         </button>
                                      </td>
                                   </tr>
                                 ))
                               ) : (
                                 <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                       <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                          <Clock size={32} />
                                       </div>
                                       <h4 className="text-lg font-bold text-gray-900">Waitlist is empty</h4>
                                       <p className="text-gray-500 text-sm">When guests join the waitlist, they will appear here.</p>
                                    </td>
                                 </tr>
                               )}
                            </tbody>
                         </table>
                      </div>
                   </div>
                 )}
              </div>
            )}

            {activeTab === "attendees" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                 {/* Secondary sub-tabs inside Attendees */}
                 <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl w-fit border border-gray-100">
                    <button
                      onClick={() => setAttendeeSubTab("list")}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        attendeeSubTab === "list"
                          ? "bg-white text-primary shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Registered List
                    </button>
                    <button
                      onClick={() => setAttendeeSubTab("attendance")}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        attendeeSubTab === "attendance"
                          ? "bg-white text-primary shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Attendance Tracker
                    </button>
                 </div>

                 {attendeeSubTab === "list" ? (
                    <div className="space-y-8">
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                             <h3 className="text-lg font-black text-gray-900">Registered Attendees</h3>
                             <p className="text-xs text-gray-500 font-medium mt-1">Manage and track all guest registrations for this event.</p>
                          </div>

                          <div className="relative w-full md:w-64">
                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                             <input
                               type="text"
                               placeholder="Search attendees..."
                               className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                               value={attendeeSearchTerm}
                               onChange={(e) => setAttendeeSearchTerm(e.target.value)}
                             />
                          </div>

                          <div className="flex items-center gap-3">
                             <button
                               onClick={async () => {
                                 if (!handleRestrictedAction('BULK_IMPORT_ALLOWED', 'Feature Restricted', 'Bulk import and export is not available on your current plan.')) {
                                   try {
                                     Swal.fire({
                                       title: 'Exporting Attendance...',
                                       text: 'Please wait while we prepare your file.',
                                       allowOutsideClick: false,
                                       didOpen: () => {
                                         Swal.showLoading();
                                       }
                                     });

                                     const response = await api.get(`/events/${eventId}/export-attendance`, {
                                       responseType: 'blob',
                                     });

                                     const blob = new Blob([response.data], {
                                       type: response.headers['content-type'] || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                                     });
                                     const url = window.URL.createObjectURL(blob);
                                     const link = document.createElement('a');
                                     link.href = url;

                                     let filename = `attendance_event_${eventId}.xlsx`;
                                     const contentDisposition = response.headers['content-disposition'];
                                     if (contentDisposition) {
                                       const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
                                       if (filenameMatch && filenameMatch[1]) {
                                         filename = filenameMatch[1];
                                       }
                                     }

                                     link.setAttribute('download', filename);
                                     document.body.appendChild(link);
                                     link.click();

                                     document.body.removeChild(link);
                                     window.URL.revokeObjectURL(url);

                                     Swal.fire({
                                       icon: 'success',
                                       title: 'Export Successful',
                                       text: 'Your attendance list has been exported successfully.',
                                       timer: 2000,
                                       showConfirmButton: false,
                                     });
                                   } catch (error) {
                                     console.error('Failed to export attendance list:', error);
                                     Swal.fire({
                                       icon: 'error',
                                       title: 'Export Failed',
                                       text: 'Could not export attendance list. Please try again later.',
                                     });
                                   }
                                 }
                               }}
                               className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 font-bold text-xs rounded-xl border border-gray-100 hover:bg-gray-100 transition-all"
                             >
                                <Download size={14} />
                                Export List
                             </button>
                             <button
                               onClick={() => {
                                 if (!handleRestrictedAction('WALK_IN_REGISTRATION_ALLOWED', 'Feature Restricted', 'Walk-in registration is not available on your current plan.')) {
                                   setIsWalkInModalOpen(true);
                                 }
                               }}
                               className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-900/20 hover:bg-emerald-700 transition-all"
                             >
                                <UserPlus size={14} />
                                Walk-in Registration
                             </button>
                             <Link href={`/organizer/dashboard/events/${eventId}/check-in`} className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                                <CheckCircle2 size={14} />
                                QR Check-in
                             </Link>
                          </div>
                       </div>

                       {attendeesLoading ? (
                         <div className="py-20 flex justify-center"><CustomLoader /></div>
                       ) : (
                         <div className="bg-white rounded-3xl border border-gray-50 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                               <table className="w-full text-left">
                                  <thead className="bg-gray-50/50 border-b border-gray-50">
                                     <tr>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendee</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket Details</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Checked In By</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Registered At</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                     </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                     {filteredAttendees.length > 0 ? (
                                       filteredAttendees.map((attendee, idx) => (
                                         <tr key={attendee.id || idx} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-6">
                                               <div className="flex items-center gap-3">
                                                  <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm">
                                                     {(attendee.attendeeName || attendee.attendeeData?.['full-name'] || 'G')[0]}
                                                  </div>
                                                  <div>
                                                     <p className="text-sm font-bold text-gray-900">{attendee.attendeeName || attendee.attendeeData?.['full-name'] || "Guest"}</p>
                                                     <p className="text-[10px] text-gray-400 font-medium">{attendee.attendeeEmail || attendee.attendeeData?.['email'] || "No email"}</p>
                                                  </div>
                                               </div>
                                            </td>
                                            <td className="px-6 py-6">
                                               <p className="text-sm font-bold text-gray-700">{attendee.ticketName || "Standard Entry"}</p>
                                               <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">ID: {attendee.ticketNumber || attendee.id?.slice(0, 8)}</p>
                                            </td>
                                            <td className="px-6 py-6">
                                               <div className="flex flex-col gap-1.5">
                                                  <span className={`w-fit px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                     attendee.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                  }`}>
                                                     {attendee.status || 'PAID'}
                                                  </span>
                                                  {attendee.checkInStatus && (
                                                    <span className="flex items-center gap-1 text-[9px] font-black text-blue-600 uppercase tracking-widest">
                                                       <CheckCircle2 size={10} />
                                                       Checked-in
                                                    </span>
                                                  )}
                                               </div>
                                            </td>
                                            <td className="px-6 py-6">
                                               {attendee.checkedInBy ? (
                                                 <div className="flex flex-col">
                                                    <p className="text-sm font-bold text-gray-700">{attendee.checkedInBy.fullName}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium">{attendee.checkedInBy.email}</p>
                                                 </div>
                                               ) : (
                                                 <span className="text-xs text-gray-400 italic">Not checked in</span>
                                               )}
                                            </td>
                                            <td className="px-6 py-6">
                                               <p className="text-[11px] font-bold text-gray-600">{new Date(attendee.createdAt).toLocaleDateString()}</p>
                                               <p className="text-[9px] text-gray-400 font-medium">{new Date(attendee.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                               <div className="flex items-center justify-end gap-2">
                                                  {!attendee.checkInStatus && (
                                                    <button
                                                      onClick={async () => {
                                                        try {
                                                          const result = await Swal.fire({
                                                            title: 'Confirm Check-in',
                                                            text: `Are you sure you want to check in ${attendee.attendeeName}?`,
                                                            icon: 'question',
                                                            showCancelButton: true,
                                                            confirmButtonText: 'Yes, Check-in',
                                                            confirmButtonColor: '#10b981',
                                                          });

                                                          if (result.isConfirmed) {
                                                            Swal.showLoading();
                                                            await api.post("/events/check-in", {
                                                              ticketNumber: attendee.ticketNumber
                                                            });
                                                            await Swal.fire('Success', 'Attendee checked in successfully', 'success');
                                                            // Refresh data
                                                            if (!isStaff) {
                                                              api.get(`/events/${eventId}/analytics`).then(res => setAnalytics(res.data.data));
                                                            }
                                                            const response = await api.get(`/events/${eventId}/orders`);
                                                            const orders = response.data.data || [];
                                                            let flattenedAttendees = [];
                                                            if (Array.isArray(orders)) {
                                                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                              flattenedAttendees = orders.flatMap((order: any) => {
                                                                const registrations = order.registrations || [];
                                                                if (registrations.length === 0) {
                                                                  return [{
                                                                    ...order,
                                                                    attendeeName: order.buyerInfo?.fullName || "Guest",
                                                                    attendeeEmail: order.buyerInfo?.email || "N/A",
                                                                    ticketName: order.ticketName || "Standard Entry",
                                                                    ticketNumber: `ORD-${order.id?.slice(0, 8)}`,
                                                                    status: order.status || "PENDING",
                                                                    createdAt: order.createdAt
                                                                  }];
                                                                }
                                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                                return registrations.map((reg: any) => ({
                                                                  ...reg,
                                                                  orderId: order.id,
                                                                  attendeeName: reg.attendeeData?.fullName || reg.attendeeData?.['full-name'] || order.buyerInfo?.fullName || "Guest",
                                                                  attendeeEmail: reg.attendeeData?.email || order.buyerInfo?.email || "N/A",
                                                                  ticketName: reg.ticketId?.name || order.ticketName || "Standard Entry",
                                                                  ticketNumber: reg.ticketNumber || `ORD-${order.id?.slice(0, 8)}`,
                                                                  status: reg.paymentStatus || order.status || "PAID",
                                                                  createdAt: reg.createdAt || order.createdAt,
                                                                  checkedInBy: reg.checkedInBy
                                                                }));
                                                              });
                                                            }
                                                            setAttendees(flattenedAttendees);
                                                          }
                                                        } catch (error) {
                                                          Swal.fire('Error', translateError(error), 'error');
                                                        }
                                                      }}
                                                      disabled={attendee.status === 'PENDING' || attendee.status === 'FAILED'}
                                                      title={attendee.status === 'PENDING' || attendee.status === 'FAILED' ? `Cannot check in a ${attendee.status.toLowerCase()} ticket` : ''}
                                                      className={`px-3 py-1.5 font-bold text-[10px] rounded-lg border transition-all ${
                                                        attendee.status === 'PENDING' || attendee.status === 'FAILED'
                                                          ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-60'
                                                          : 'bg-blue-50 text-primary border-blue-100 hover:bg-primary hover:text-white'
                                                      }`}
                                                    >
                                                      Check-in
                                                    </button>
                                                  )}
                                                  <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                                                     <MoreVertical size={16} />
                                                  </button>
                                               </div>
                                            </td>
                                         </tr>
                                       ))
                                     ) : (
                                       <tr>
                                          <td colSpan={5} className="px-6 py-20 text-center">
                                             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                                <Users size={32} />
                                             </div>
                                             <h4 className="text-lg font-bold text-gray-900">No attendees yet</h4>
                                             <p className="text-gray-500 text-sm">Once people register for your event, they will appear here.</p>
                                          </td>
                                       </tr>
                                     )}
                                  </tbody>
                               </table>
                            </div>
                         </div>
                       )}
                    </div>
                 ) : (
                    // Attendance Tracker UI
                    <div className="space-y-6">
                       {/* Filter and controls */}
                       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="relative w-full md:w-64">
                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                             <input
                               type="text"
                               placeholder="Search registrations..."
                               className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                               value={trackerSearch}
                               onChange={(e) => {
                                 setTrackerSearch(e.target.value);
                                 setTrackerPage(1);
                               }}
                             />
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                             <select
                               value={trackerStatus}
                               onChange={(e) => {
                                 setTrackerStatus(e.target.value);
                                 // If clearing status, also clear day
                                 if (!e.target.value) setTrackerDay("");
                                 setTrackerPage(1);
                               }}
                               className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none cursor-pointer"
                             >
                               <option value="">Filter Status: All</option>
                               <option value="attended">Attended</option>
                               <option value="missed">Missed</option>
                             </select>

                             <select
                               value={trackerDay}
                               disabled={!trackerStatus}
                               onChange={(e) => {
                                 setTrackerDay(e.target.value);
                                 setTrackerPage(1);
                               }}
                               className="px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                               <option value="">Filter Day: All</option>
                               {Array.from({ length: trackerEventDays || 1 }).map((_, i) => (
                                 <option key={i + 1} value={i + 1}>
                                   Day {i + 1}
                                 </option>
                               ))}
                             </select>

                             {(trackerSearch || trackerStatus || trackerDay) && (
                               <button
                                 onClick={() => {
                                   setTrackerSearch("");
                                   setTrackerStatus("");
                                   setTrackerDay("");
                                   setTrackerPage(1);
                                 }}
                                 className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 text-rose-600 font-bold text-xs rounded-xl hover:bg-rose-100 transition-all border border-rose-100"
                               >
                                  Clear Filters
                               </button>
                             )}
                          </div>
                       </div>

                       {trackerLoading ? (
                         <div className="py-20 flex justify-center"><CustomLoader /></div>
                       ) : (
                         <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto animate-in fade-in duration-300">
                               <table className="w-full text-left">
                                  <thead className="bg-gray-50 border-b border-gray-100">
                                     <tr>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Attendee</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ticket Details</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Overall Status</th>
                                        {/* Generate dynamically columns for Days */}
                                        {Array.from({ length: trackerEventDays || 1 }).map((_, i) => (
                                           <th key={i} className="px-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Day {i + 1}</th>
                                        ))}
                                        <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                     </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-50">
                                     {trackerRegistrations.length > 0 ? (
                                       trackerRegistrations.map((reg, idx) => {
                                          return (
                                             <tr key={reg.id || idx} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-6">
                                                   <div className="flex items-center gap-3">
                                                      <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm">
                                                         {(reg.attendeeName || 'G')[0]}
                                                      </div>
                                                      <div>
                                                         <p className="text-sm font-bold text-gray-900">{reg.attendeeName}</p>
                                                         <p className="text-[10px] text-gray-400 font-medium">{reg.attendeeEmail}</p>
                                                      </div>
                                                   </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                   <p className="text-sm font-bold text-gray-700">{reg.ticketName}</p>
                                                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">ID: {reg.ticketNumber}</p>
                                                </td>
                                                <td className="px-6 py-6">
                                                   <span className={`w-fit px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                                      reg.overallCheckInStatus ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                   }`}>
                                                      {reg.overallCheckInStatus ? 'Checked In' : 'Not Checked In'}
                                                   </span>
                                                </td>
                                                {/* Generate Day cells */}
                                                {Array.from({ length: trackerEventDays || 1 }).map((_, i) => {
                                                   const dayNum = i + 1;
                                                   const dayData = reg.dailyAttendance?.find((d: TrackerDailyAttendance) => d.day === dayNum);
                                                   const attended = dayData?.attended;

                                                   return (
                                                      <td key={i} className="px-4 py-6 text-center">
                                                         <div className="relative inline-block group/tooltip">
                                                            {attended ? (
                                                               <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition-all">
                                                                  <CheckCircle2 size={16} />
                                                               </div>
                                                            ) : (
                                                               <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-100 cursor-pointer hover:bg-rose-100 transition-all">
                                                                  <XCircle size={16} />
                                                               </div>
                                                            )}
                                                            {/* Tooltip */}
                                                            {attended && (
                                                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block bg-gray-900 text-white text-[10px] rounded-xl p-3 w-48 z-[110] shadow-xl pointer-events-none text-left">
                                                                  <p className="font-bold border-b border-white/10 pb-1 mb-1 text-primary">Day {dayNum} Checked In</p>
                                                                  {dayData.checkInTime && (
                                                                     <p className="text-[9px] text-gray-300">Time: {new Date(dayData.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                                  )}
                                                                  {dayData.checkedInBy && (
                                                                     <p className="text-[9px] text-gray-300 mt-0.5">By: {dayData.checkedInBy.fullName}</p>
                                                                  )}
                                                               </div>
                                                            )}
                                                         </div>
                                                      </td>
                                                   );
                                                })}
                                                <td className="px-6 py-6 text-right">
                                                   <button
                                                     onClick={() => {
                                                        setSelectedTicketNumberForModal(reg.ticketNumber);
                                                        setIsDetailsModalOpen(true);
                                                     }}
                                                     className="px-3 py-1.5 bg-blue-50 text-primary font-bold text-[10px] rounded-lg border border-blue-100 hover:bg-primary hover:text-white transition-all uppercase tracking-wider"
                                                   >
                                                      View Details
                                                   </button>
                                                </td>
                                             </tr>
                                          );
                                       })
                                     ) : (
                                       <tr>
                                          <td colSpan={5 + (trackerEventDays || 1)} className="px-6 py-20 text-center">
                                             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                                <Users size={32} />
                                             </div>
                                             <h4 className="text-lg font-bold text-gray-900">No registrations found</h4>
                                             <p className="text-gray-500 text-sm">No records match the active search and filter options.</p>
                                          </td>
                                       </tr>
                                     )}
                                  </tbody>
                               </table>
                            </div>

                            {/* Pagination Controls */}
                            {trackerPages > 1 && (
                               <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                  <p className="text-xs text-gray-500 font-bold">
                                     Showing Page {trackerPage} of {trackerPages} ({trackerTotal} Total Registrations)
                                  </p>
                                  <div className="flex items-center gap-2">
                                     <button
                                       onClick={() => setTrackerPage(p => Math.max(1, p - 1))}
                                       disabled={trackerPage === 1}
                                       className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                                     >
                                        Previous
                                     </button>
                                     <button
                                       onClick={() => setTrackerPage(p => Math.min(trackerPages, p + 1))}
                                       disabled={trackerPage === trackerPages}
                                       className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
                                     >
                                        Next
                                     </button>
                                  </div>
                               </div>
                            )}
                         </div>
                       )}
                    </div>
                 )}
              </div>
            )}

      <AssignStaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onAssign={handleAssignStaff}
        assignedStaffIds={staff.map(s => s.id)}
      />

      {event && (
        <MessageGuestModal
          isOpen={isBroadcastModalOpen}
          onClose={() => setIsBroadcastModalOpen(false)}
          eventId={event.id}
          tickets={event.tickets || []}
        />
      )}

      {event && (
        <WalkInRegistrationModal
          isOpen={isWalkInModalOpen}
          onClose={() => setIsWalkInModalOpen(false)}
          eventId={event.id}
          tickets={event.tickets || []}
          onSuccess={() => {
            // Refresh analytics if not staff
            if (!isStaff) {
              api.get(`/events/${eventId}/analytics`).then(res => setAnalytics(res.data.data));
            }
            // Refresh attendees if on that tab
            if (activeTab === "attendees") {
              const fetchAttendees = async () => {
                try {
                  setAttendeesLoading(true);
                  const response = await api.get(`/events/${eventId}/orders`);
                  const orders = response.data.data || [];
                  let flattenedAttendees = [];
                  if (Array.isArray(orders)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    flattenedAttendees = orders.flatMap((order: any) => {
                      const registrations = order.registrations || [];
                      if (registrations.length === 0) {
                        return [{
                          ...order,
                          attendeeName: order.buyerInfo?.fullName || "Guest",
                          attendeeEmail: order.buyerInfo?.email || "N/A",
                          ticketName: order.ticketName || "Standard Entry",
                          ticketNumber: `ORD-${order.id?.slice(0, 8)}`,
                          status: order.status || "PENDING",
                          createdAt: order.createdAt
                        }];
                      }
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      return registrations.map((reg: any) => ({
                        ...reg,
                        orderId: order.id,
                        attendeeName: reg.attendeeData?.fullName || reg.attendeeData?.['full-name'] || order.buyerInfo?.fullName || "Guest",
                        attendeeEmail: reg.attendeeData?.email || order.buyerInfo?.email || "N/A",
                        ticketName: reg.ticketId?.name || order.ticketName || "Standard Entry",
                        ticketNumber: reg.ticketNumber || `ORD-${order.id?.slice(0, 8)}`,
                        status: reg.paymentStatus || order.status || "PAID",
                        createdAt: reg.createdAt || order.createdAt,
                        checkedInBy: reg.checkedInBy
                      }));
                    });
                  }
                  setAttendees(flattenedAttendees);
                } catch (error) {
                  console.error("Failed to fetch attendees:", error);
                } finally {
                  setAttendeesLoading(false);
                }
              };
              fetchAttendees();
            }
          }}
        />
      )}

      {selectedTicketNumberForModal && (
        <RegistrationDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedTicketNumberForModal(null);
          }}
          eventId={eventId as string}
          ticketNumber={selectedTicketNumberForModal}
          onCheckInSuccess={() => {
            fetchTrackerRegistrations();
          }}
        />
      )}

            {activeTab === "staff" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                       <h3 className="text-lg font-black text-gray-900">Assigned Staff</h3>
                       <p className="text-xs text-gray-500 font-medium mt-1">Manage staff members who have access to this event.</p>
                    </div>
                    <button
                      onClick={() => setIsStaffModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                    >
                       <UserPlus size={14} />
                       Assign Staff
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.length > 0 ? (
                      staff.map((member) => (
                        <div key={member.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
                           <div className="flex items-center gap-4 mb-6">
                              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                                 {member.fullName?.[0] || <Users size={24} />}
                              </div>
                              <div>
                                 <h4 className="font-bold text-gray-900">{member.fullName || member.email?.split('@')[0] || 'Staff'}</h4>
                                 <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                   member.role === 'MANAGER' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-gray-50 text-gray-500 border border-gray-100'
                                 }`}>
                                    {member.role}
                                 </span>
                              </div>
                           </div>

                           <div className="space-y-3 pt-4 border-t border-gray-50">
                              <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                 <Mail size={14} className="text-primary" />
                                 {member.email}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                 <ShieldCheck size={14} className="text-emerald-500" />
                                 {member.canRegisterGuests ? "Can Register Guests" : "Check-in Access Only"}
                              </div>
                           </div>

                           <button
                             onClick={() => handleUnassignStaff(member.id)}
                             className="absolute top-4 right-4 p-2 text-gray-300 hover:text-rose-600 transition-colors bg-gray-50 hover:bg-rose-50 rounded-xl"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
                         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 shadow-sm">
                            <Users size={32} />
                         </div>
                         <h4 className="text-lg font-bold text-gray-900">No staff assigned</h4>
                         <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">Assign staff members from your pool to help manage this event.</p>
                         <button
                           onClick={() => setIsStaffModalOpen(true)}
                           className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
                         >
                            <UserPlus size={18} />
                            Assign Now
                         </button>
                      </div>
                    )}
                 </div>
              </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default EventDetails;
