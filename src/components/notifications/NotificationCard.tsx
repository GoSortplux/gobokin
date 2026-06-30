
import { Check, Circle, ExternalLink } from "lucide-react";
import { Notification } from "@/types";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
}

const NotificationCard = ({ notification, onMarkAsRead, onMarkAsUnread }: NotificationCardProps) => {
  const { user } = useAuth();
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = notification.message.match(urlRegex);
  const detectedLink = match ? match[0] : null;

  // Detect booking or reservation ID (e.g., GOH-..., RES-...)
  const bookingIdRegex = /\b(GOH|RES)-[A-Z0-9-]+\b/i;
  const bookingMatch = notification.message.match(bookingIdRegex);
  const detectedBookingId = bookingMatch ? bookingMatch[0] : null;

  const urlSlug = notification.hallSlug || notification.hallId || "";

  const isOrganizer = user?.activeRole === 'organizer' || user?.role?.includes('organizer');
  const isTicketNotif = notification.message.toLowerCase().includes('ticket') || notification.message.toLowerCase().includes('sale') || notification.message.toLowerCase().includes('order');
  const isEventNotif = notification.message.toLowerCase().includes('event');

  const organizerLink = isOrganizer ? (isTicketNotif ? '/organizer/dashboard/orders' : (isEventNotif ? '/organizer/dashboard/events' : null)) : null;

  const finalLink = notification.link ||
                    detectedLink ||
                    (detectedBookingId ? `/booking/details/${detectedBookingId}` : null) ||
                    (urlSlug ? `/venues/${urlSlug}/review` : null) ||
                    organizerLink;
  const displayMessage = notification.message.replace(urlRegex, '').trim();

  return (
    <div
      className={`group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl transition-all duration-200 border border-transparent hover:border-gray-100 ${
        notification.read ? "bg-white opacity-60" : "bg-white hover:bg-gray-50/50 shadow-sm"
      }`}
    >
      <div className="flex items-start gap-4 flex-1 overflow-hidden">
        <div className="flex-shrink-0 mt-1.5">
          {!notification.read ? (
            <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(41,95,167,0.5)]" />
          ) : (
            <div className="w-2 h-2 bg-gray-200 rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug truncate sm:whitespace-normal ${notification.read ? "text-gray-500 font-medium" : "text-gray-900 font-bold"}`}>
            {displayMessage}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
              {new Date(notification.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            {finalLink && !notification.read && (
               <Link
                href={finalLink}
                onClick={() => onMarkAsRead(notification._id)}
                className="text-[11px] font-black text-primary hover:underline flex items-center gap-1 uppercase"
               >
                 View <ExternalLink size={10} />
               </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 sm:mt-0 sm:ml-6 flex items-center gap-3 shrink-0">
        {!notification.read ? (
          <button
            onClick={() => onMarkAsRead(notification._id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
          >
            <Check size={14} />
            Mark as read
          </button>
        ) : (
          <button
            onClick={() => onMarkAsUnread(notification._id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all"
          >
            <Circle size={12} className="text-gray-300" />
            Mark unread
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationCard;
