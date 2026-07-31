"use client";
import { useEffect, useState } from "react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Check, Circle, BellOff, MoreVertical } from "lucide-react";
import { Notification } from "@/types";
import { motion } from "framer-motion";

const NotificationDropdown = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data.data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAsUnread = async (notificationId: string) => {
    try {
      await api.patch(`/notifications/${notificationId}/unread`);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as unread:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:w-96 sm:mt-3 origin-top bg-white rounded-2xl shadow-2xl z-50 border border-gray-100 overflow-hidden"
      data-testid="notification-dropdown"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-4 bg-white border-b border-gray-50 flex items-center justify-between">
        <div>
          <h3 className="text-md font-bold text-gray-900 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">
                {unreadCount} new
              </span>
            )}
          </h3>
          <p className="text-[11px] text-gray-500">Stay updated with your activities</p>
        </div>
        <button
          onClick={handleMarkAllAsRead}
          className="text-xs font-bold text-primary hover:text-primary-dark transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
        >
          Mark all as read
        </button>
      </div>

      <div className="max-h-[450px] overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center space-y-3">
             <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
             <p className="text-xs text-gray-400 font-medium">Fetching updates...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {notifications.map((notification) => {
              const urlRegex = /(https?:\/\/[^\s]+)/g;
              const match = notification.message.match(urlRegex);
              const urlSlug = notification.hallSlug || notification.hallId || "";

              const isOrganizer = user?.activeRole === 'organizer' || user?.role?.includes('organizer');
              const isTicketNotif = notification.message.toLowerCase().includes('ticket') || notification.message.toLowerCase().includes('sale') || notification.message.toLowerCase().includes('order');
              const isEventNotif = notification.message.toLowerCase().includes('event');

              const organizerLink = isOrganizer ? (isTicketNotif ? '/organizer/dashboard/orders' : (isEventNotif ? '/organizer/dashboard/events' : null)) : null;

              let finalLink = notification.link || (match ? match[0] : null) || (urlSlug ? `/venues/${urlSlug}/review` : null) || organizerLink;

              if (finalLink && (finalLink.includes('gobokin.com') || finalLink.startsWith('http'))) {
                try {
                  const urlObj = new URL(finalLink);
                  if (urlObj.hostname.includes('gobokin.com') || urlObj.hostname.includes('localhost')) {
                    finalLink = urlObj.pathname + urlObj.search;
                  }
                } catch (e) {
                  // fallback
                }
              }

              // Intercept incorrect dashboard events resources link
              if (finalLink && finalLink.includes('/dashboard/events/') && finalLink.endsWith('/resources')) {
                finalLink = finalLink.replace('/dashboard/events/', '/events/').replace('/organizer/dashboard/events/', '/events/');
              }

              const isReview = finalLink?.includes('/review') || notification.message.toLowerCase().includes('review');

              return (
                <div
                  key={notification._id}
                  className={`group flex items-start p-4 transition-all duration-200 hover:bg-gray-50/80 ${
                    notification.read ? "opacity-75" : "bg-white"
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {!notification.read ? (
                      <div className="w-2.5 h-2.5 bg-primary rounded-full shadow-[0_0_8px_rgba(41,95,167,0.5)]" />
                    ) : (
                      <div className="w-2.5 h-2.5 bg-gray-200 rounded-full" />
                    )}
                  </div>
                  <div className="ml-4 flex-grow">
                    <p className={`text-sm leading-relaxed ${notification.read ? "text-gray-500" : "text-gray-800 font-medium"}`}>
                      {notification.message.replace(urlRegex, '').trim()}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-2">
                      <Circle size={4} className="fill-gray-300 border-none" />
                      {new Date(notification.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>

                    <div className="mt-3 flex items-center gap-3">
                      {finalLink && (
                        <Link
                          href={notification.read ? "#" : finalLink}
                          onClick={(e) => {
                            if (notification.read) {
                              e.preventDefault();
                              return;
                            }
                            handleMarkAsRead(notification._id);
                          }}
                          className={`text-[11px] font-bold px-3 py-1 rounded-md transition-all ${
                            notification.read
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : isReview
                                ? "bg-[#B68945] text-white hover:shadow-lg hover:shadow-[#B68945]/20"
                                : "bg-primary text-white hover:shadow-lg hover:shadow-primary/20"
                          }`}
                        >
                          {isReview ? "Write Review" : "View Details"}
                        </Link>
                      )}

                      <button
                        onClick={() => notification.read ? handleMarkAsUnread(notification._id) : handleMarkAsRead(notification._id)}
                        className="text-[10px] font-bold text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
                      >
                        {notification.read ? (
                          <>
                            <Circle size={8} className="text-gray-300" />
                            Mark unread
                          </>
                        ) : (
                          <>
                            <Check size={10} className="text-primary" />
                            Mark read
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <BellOff className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-bold text-gray-900">All caught up!</p>
            <p className="text-xs text-gray-500 mt-1">No new notifications at the moment.</p>
          </div>
        )}
      </div>

      <div className="p-3 bg-white text-center border-t border-gray-50">
        <Link
          href="/notifications"
          className="text-xs font-bold text-primary hover:text-primary-dark transition-all flex items-center justify-center gap-2 py-2 hover:bg-primary/5 rounded-xl"
        >
          View all notifications
          <MoreVertical size={12} className="rotate-90" />
        </Link>
      </div>
    </motion.div>
  );
};

export default NotificationDropdown;
