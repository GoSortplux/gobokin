"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TourGuide from "@/components/TourGuide";
import CookieConsent from "@/components/CookieConsent";
import PolicyModal from "@/components/PolicyModal";
import { useAuth } from "@/context/AuthContext";
import React, { useState, useEffect } from "react";
import api from "@/services/api";

const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, updateToken } = useAuth();
  const pathname = usePathname();
  const [showGeneralPolicy, setShowGeneralPolicy] = useState(false);
  const isAuthPage =
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/register") ||
    pathname.startsWith("/auth/forgot-password") ||
    pathname.startsWith("/auth/reset-password") ||
    pathname.startsWith("/auth/password-reset") ||
    pathname.startsWith("/auth/marketing") ||
    pathname.startsWith("/auth/verify-email");
  const isDashboardPage =
    pathname.startsWith("/vendor") ||
    pathname.startsWith("/admin");
  const isPaymentPage = pathname.startsWith("/payment/verify");

  useEffect(() => {
    if (user && !user.hasAcceptedLatestPolicies && !isAuthPage) {
      setShowGeneralPolicy(true);
    } else {
      setShowGeneralPolicy(false);
    }
  }, [user, isAuthPage]);

  const handleGeneralPolicyAccepted = async () => {
    // Re-fetch token or user data to get updated acceptance status
    try {
      const response = await api.post('/auth/refresh-token');
      if (response.data?.data?.accessToken) {
        updateToken(response.data.data.accessToken);
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Failed to refresh token after policy acceptance:', err);
      window.location.reload();
    }
    setShowGeneralPolicy(false);
  };

  if (isDashboardPage || isAuthPage || isPaymentPage) {
    return (
        <>
            {children}
            {user && !user.hasAcceptedLatestPolicies && (
                <PolicyModal
                    type="general"
                    isOpen={showGeneralPolicy}
                    isMandatory={true}
                    compact={true}
                    onAccept={handleGeneralPolicyAccepted}
                />
            )}
        </>
    );
  }

  return (
    <>
      <TourGuide />
      <Header />
      {children}
      <Footer />
      <CookieConsent />
      {user && !user.hasAcceptedLatestPolicies && (
        <PolicyModal
            type="general"
            isOpen={showGeneralPolicy}
            isMandatory={true}
            compact={true}
            onAccept={handleGeneralPolicyAccepted}
        />
      )}
    </>
  );
};

export default LayoutWrapper;
