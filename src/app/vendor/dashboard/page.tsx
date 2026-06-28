"use client";
import React from 'react';
import EnhancedAnalytics from '@/components/vendor/EnhancedAnalytics';
import withAuth from '@/components/auth/withAuth';

const DashboardPage = () => {
  return <EnhancedAnalytics />;
};

export default withAuth(DashboardPage, ['hall-owner', 'staff']);
