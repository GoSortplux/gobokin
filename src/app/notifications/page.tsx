"use client";
import { useEffect, useState } from "react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import withAuth from "@/components/auth/withAuth";
import NotificationCard from "@/components/notifications/NotificationCard";
import EmptyState from "@/components/EmptyState";
import { Notification } from "@/types";

const NotificationsPage = () => {
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

  return (
    <div className="max-w-4xl mx-auto py-10 pt-24 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 border-b border-gray-100 pb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Manage your updates and activities</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
          <span className="flex items-center gap-1.5">
             <div className="w-2 h-2 bg-primary rounded-full"></div>
             {notifications.filter(n => !n.read).length} Unread
          </span>
          <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
          <span>{notifications.length} Total</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
           <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
           <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fetching your updates</p>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-1">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              onMarkAsUnread={handleMarkAsUnread}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
           <EmptyState message="You're all caught up!" />
        </div>
      )}
    </div>
  );
};

export default withAuth(NotificationsPage, ["user", "hall-owner", "staff", "super-admin", "organizer", "organizer-staff"]);
