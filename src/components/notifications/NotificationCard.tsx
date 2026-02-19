
import { Check, Circle, ExternalLink } from "lucide-react";
import { Notification } from "@/types";
import Link from "next/link";

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onMarkAsUnread: (id: string) => void;
}

const NotificationCard = ({ notification, onMarkAsRead, onMarkAsUnread }: NotificationCardProps) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const match = notification.message.match(urlRegex);
  const detectedLink = match ? match[0] : null;

  // Detect booking or reservation ID (e.g., GOH-..., RES-...)
  const bookingIdRegex = /\b(GOH|RES)-[A-Z0-9-]+\b/i;
  const bookingMatch = notification.message.match(bookingIdRegex);
  const detectedBookingId = bookingMatch ? bookingMatch[0] : null;

  const urlSlug = notification.hallSlug || notification.hallId || "";

  const finalLink = notification.link ||
                    detectedLink ||
                    (detectedBookingId ? `/booking/details/${detectedBookingId}` : null) ||
                    (urlSlug ? `/venues/${urlSlug}/review` : null);
  const displayMessage = notification.message.replace(urlRegex, '').trim();

  const isReview = finalLink?.includes('/review') || notification.message.toLowerCase().includes('review');

  return (
    <div
      className={`flex items-start p-5 sm:p-7 rounded-2xl border transition-all duration-300 ${
        notification.read ? "bg-gray-50/50 border-gray-100" : "bg-white border-primary/10 shadow-sm"
      }`}
    >
      <div className="flex-shrink-0 mt-1">
        {!notification.read ? (
          <div className="w-3 h-3 bg-primary rounded-full shadow-[0_0_10px_rgba(41,95,167,0.5)]" />
        ) : (
          <div className="w-3 h-3 bg-gray-200 rounded-full" />
        )}
      </div>
      <div className="ml-5 flex-grow">
        <p className={`text-md leading-relaxed ${notification.read ? "text-gray-500" : "text-gray-900 font-bold"}`}>
          {displayMessage}
        </p>
        <p className="text-sm text-gray-400 mt-2 font-medium">
          {new Date(notification.createdAt).toLocaleString(undefined, {
            dateStyle: 'long',
            timeStyle: 'short'
          })}
        </p>

        {finalLink && (
          <div className="mt-5">
            <Link
              href={notification.read ? "#" : finalLink}
              onClick={(e) => {
                if (notification.read) {
                  e.preventDefault();
                  return;
                }
                onMarkAsRead(notification._id);
              }}
              className={`inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all duration-200 active:scale-95 ${
                notification.read
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                  : isReview
                    ? "bg-[#B68945] text-white hover:shadow-[#B68945]/30 hover:-translate-y-0.5"
                    : "bg-primary text-white hover:shadow-primary/30 hover:-translate-y-0.5"
              }`}
            >
              {isReview ? "Write a Review" : "View Details"}
              <ExternalLink className="ml-2 w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4">
          {!notification.read ? (
            <button
              onClick={() => onMarkAsRead(notification._id)}
              className="text-sm font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-1.5"
            >
              <Check size={16} />
              Mark as read
            </button>
          ) : (
            <button
              onClick={() => onMarkAsUnread(notification._id)}
              className="text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-1.5"
            >
              <Circle size={14} className="text-gray-300" />
              Mark as unread
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
