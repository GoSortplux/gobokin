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

  // Handle chunk loading errors (usually after a new deployment)
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent | PromiseRejectionEvent) => {
      const error = 'error' in event ? event.error : event.reason;
      const errorMessage = error?.message || '';

      if (
        errorMessage.includes('Failed to load chunk') ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('Unexpected token') // Often happens when HTML is returned instead of JS
      ) {
        // Prevent infinite reload loops
        const lastReload = sessionStorage.getItem('last-chunk-reload');
        const now = Date.now();

        // Only reload if we haven't reloaded in the last 10 seconds
        if (!lastReload || now - parseInt(lastReload) > 10000) {
          sessionStorage.setItem('last-chunk-reload', now.toString());
          console.warn('Chunk loading error detected, reloading page...', errorMessage);
          window.location.reload();
        } else {
          console.error('Chunk loading error persisted after reload. Please check your connection or clear cache.', errorMessage);
        }
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleChunkError);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleChunkError);
    };
  }, []);

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
