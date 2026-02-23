"use client";
import React from 'react';
import EnhancedAnalytics from '@/components/vendor/EnhancedAnalytics';
import StaffDashboard from '@/components/vendor/StaffDashboard';
import { useAuth } from '@/context/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();

  if (user?.activeRole === 'staff' || (user?.role?.includes('staff') && user?.activeRole !== 'hall-owner')) {
    return <StaffDashboard />;
  }

  return <EnhancedAnalytics />;
};

export default DashboardPage;
