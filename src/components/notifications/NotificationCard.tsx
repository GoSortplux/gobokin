
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

  const urlSlug = notification.hallSlug || notification.hallId || "";

  const finalLink = notification.link || detectedLink || (urlSlug ? `/halls/${urlSlug}/review` : null);
  const displayMessage = notification.message.replace(urlRegex, '').trim();

  const isReview = finalLink?.includes('/review') || notification.message.toLowerCase().includes('review');

  return (
    <div
      className={`flex items-start p-4 sm:p-6 rounded-lg shadow-md transition-all duration-300 ${
        notification.read ? "bg-gray-50" : "bg-white"
      }`}
    >
      <div className="flex-shrink-0">
        {notification.read ? (
          <Check className="w-6 h-6 text-green-500" />
        ) : (
          <Circle className="w-6 h-6 text-blue-500" />
        )}
      </div>
      <div className="ml-4 flex-grow">
        <p className="text-md font-semibold text-gray-800">{displayMessage}</p>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(notification.createdAt).toLocaleString()}
        </p>

        {finalLink && (
          <div className="mt-4">
            <Link
              href={notification.read ? "#" : finalLink}
              onClick={(e) => {
                if (notification.read) {
                  e.preventDefault();
                  return;
                }
                onMarkAsRead(notification._id);
              }}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all duration-200 ${
                notification.read
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : isReview
                    ? "bg-[#B68945] text-white hover:bg-[#a57b3d]"
                    : "bg-primary text-white hover:bg-opacity-90"
              }`}
            >
              {isReview ? "Write a Review" : "View Details"}
              <ExternalLink className="ml-2 w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="mt-3">
          {!notification.read ? (
            <button
              onClick={() => onMarkAsRead(notification._id)}
              className="text-sm text-primary hover:underline"
            >
              Mark as read
            </button>
          ) : (
            <button
              onClick={() => onMarkAsUnread(notification._id)}
              className="text-sm text-gray-500 hover:underline"
            >
              Mark as unread
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
