"use client";
import React from 'react';
import AdminEnhancedAnalytics from '@/components/admin/AdminEnhancedAnalytics';
import withAuth from "@/components/auth/withAuth";

const AdminEventDashboardPage = () => {
  // AdminEnhancedAnalytics already handles both venue and event views via internal state.
  // However, for the Event Admin Dashboard, we want it to default to 'events'.
  return <AdminEnhancedAnalytics defaultView="events" />;
};

export default withAuth(AdminEventDashboardPage, ["super-admin"]);
