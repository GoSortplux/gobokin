'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '@/services/api';
import { OrganizerRule } from '@/types';
import { useAuth } from '@/context/AuthContext';

interface OrganizerRulesContextType {
  rules: OrganizerRule[];
  title?: string;
  loading: boolean;
  refreshRules: () => Promise<void>;
  isRestricted: (key: string) => boolean;
  getRule: (key: string) => OrganizerRule | undefined;
}

const OrganizerRulesContext = createContext<OrganizerRulesContextType | undefined>(undefined);

export const OrganizerRulesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [rules, setRules] = useState<OrganizerRule[]>([]);
  const [title, setTitle] = useState<string>('Free Plan Account');
  const [loading, setLoading] = useState(false);

  const fetchRules = useCallback(async () => {
    // Only fetch for active organizer or organizer-staff roles
    const activeRole = user?.activeRole;
    if (activeRole !== 'organizer' && activeRole !== 'organizer-staff') {
      setRules([]);
      setTitle('Free Plan Account');
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/events/my-organizer-profile/rules');
      const data = response.data?.data;
      if (data) {
        if (Array.isArray(data)) {
          setRules(data);
          setTitle('Free Plan Account');
        } else if (data.rules && Array.isArray(data.rules)) {
          setRules(data.rules);
          setTitle(data.title || 'Free Plan Account');
        } else {
          setRules([]);
          setTitle('Free Plan Account');
        }
      } else {
        setRules([]);
        setTitle('Free Plan Account');
      }
    } catch (error) {
      console.error('Failed to fetch organizer rules:', error);
      setRules([]);
      setTitle('Free Plan Account');
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
    <OrganizerRulesContext.Provider value={{ rules, title, loading, refreshRules: fetchRules, isRestricted, getRule }}>
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
