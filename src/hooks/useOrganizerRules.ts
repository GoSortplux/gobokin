import { useOrganizerRules as useRules } from '@/context/OrganizerRulesContext';

export const useOrganizerRules = () => {
  return useRules();
};
