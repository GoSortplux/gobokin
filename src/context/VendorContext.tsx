'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '@/services/api';
import { useAuth } from './AuthContext';

interface Subscription {
  tier: {
    maxHalls: number;
    name: string;
  };
  rules: {
    rule: {
      key: string;
      [key: string]: unknown;
    };
    value: number | string | boolean;
    displayText?: string;
  }[];
  status: string;
  expiryDate?: string;
  purchaseDate?: string;
}

interface VendorContextType {
  hallsCount: number;
  maxHalls: number;
  subscription: Subscription | null;
  loading: boolean;
  refresh: () => Promise<void>;
  isLimitReached: boolean;
}

export const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const VendorProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [hallsCount, setHallsCount] = useState(0);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user || (user.activeRole !== 'hall-owner' && user.activeRole !== 'staff' && user.activeRole !== 'super-admin')) return;

    setLoading(true);
    try {
      const [hallsResponse, subscriptionResponse] = await Promise.all([
        api.get("/halls/by-owner"),
        api.get("/licenses/my-subscription").catch(() => ({ data: { data: null } })),
      ]);

      setHallsCount(Array.isArray(hallsResponse.data.data) ? hallsResponse.data.data.length : 0);
      setSubscription(subscriptionResponse.data.data);
    } catch (err) {
      console.error("Error fetching vendor data:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxHalls = subscription?.tier?.maxHalls || 0;
  const isLimitReached = maxHalls > 0 && hallsCount >= maxHalls;

  return (
    <VendorContext.Provider
      value={{
        hallsCount,
        maxHalls,
        subscription,
        loading,
        refresh: fetchData,
        isLimitReached,
      }}
    >
      {children}
    </VendorContext.Provider>
  );
};

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (context === undefined) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};
