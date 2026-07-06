'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '@/services/api';
import { OrganizerRule } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface OrganizerRulesContextType {
  rules: OrganizerRule[];
  loading: boolean;
  refreshRules: () => Promise<void>;
  isRestricted: (key: string) => boolean;
  getRule: (key: string) => OrganizerRule | undefined;
}

const OrganizerRulesContext = createContext<OrganizerRulesContextType | undefined>(undefined);

export const OrganizerRulesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [rules, setRules] = useState<OrganizerRule[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRules = useCallback(async () => {
    // Only fetch for organizers or organizer-staff
    if (!user?.role?.includes('organizer')) {
      setRules([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/events/my-organizer-profile/rules');
      setRules(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch organizer rules:', error);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const isRestricted = useCallback((key: string) => {
    const rule = rules.find(r => r.key === key);
    return rule ? rule.isRestricted : false;
  }, [rules]);

  const getRule = useCallback((key: string) => {
    return rules.find(r => r.key === key);
  }, [rules]);

  return (
    <OrganizerRulesContext.Provider value={{ rules, loading, refreshRules: fetchRules, isRestricted, getRule }}>
      {children}
    </OrganizerRulesContext.Provider>
  );
};

export const useOrganizerRules = () => {
  const context = useContext(OrganizerRulesContext);
  if (context === undefined) {
    throw new Error('useOrganizerRules must be used within an OrganizerRulesProvider');
  }
  return context;
};
