"use client";
import React from 'react';
import EnhancedAnalytics from '@/components/vendor/EnhancedAnalytics';
import { useAuth } from '@/context/AuthContext';
import CustomLoader from '@/components/CustomLoader';

const DashboardPage = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <CustomLoader size={48} />
      </div>
    );
  }

  return <EnhancedAnalytics />;
};

export default DashboardPage;
