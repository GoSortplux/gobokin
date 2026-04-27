"use client";
import React from 'react';
import SubscriptionAnalytics from '@/components/admin/SubscriptionAnalytics';
import withAuth from "@/components/auth/withAuth";

const AnalyticsPage = () => {
  return <SubscriptionAnalytics />;
};

export default withAuth(AnalyticsPage, ["super-admin"]);
