'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Swal from "@/utils/sweetalert";
import api from '@/services/api';
import { getDashboardPath } from '@/utils/redirects';
import { User, UserRole } from '@/types';

interface DecodedToken {
  _id: string;
  email: string;
  role: UserRole[];
  activeRole: string;
  hasAcceptedLatestPolicies: boolean;
  hasAcceptedHallOwnerPolicy: boolean;
  hasAcceptedOrganizerPolicy: boolean;
  iat: number;
  exp: number;
  hallOwnerApplication?: {
    status: string;
  };
}

interface AuthContextType {
  user: User | null;
  activeRole: string | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User, redirectPath?: string) => void;
  logout: () => void;
  updateToken: (token: string, redirectPath?: string | null) => void;
  updateUser: (updates: Partial<User>) => void;
  updateUserApplicationStatus: (status: string) => void;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IDLE_TIMEOUT = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const ACTIVITY_UPDATE_INTERVAL = 60 * 1000; // 1 minute in milliseconds

export const getCookieDomain = () => {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname;
  if (hostname === 'gobokin.com' || hostname.endsWith('.gobokin.com')) {
    return 'domain=.gobokin.com';
  }
  return '';
};

export const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const domain = getCookieDomain();
  const domainString = domain ? `; ${domain}` : '';
  const secureString = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${domainString}${secureString}`;
};

export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

export const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  const domain = getCookieDomain();
  // 1. Delete on wildcard domain if applicable
  if (domain) {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; ${domain}`;
  }
  // 2. Always delete on host-only domain to clear any legacy/host-specific cookies
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
};

export const setSharedReturnUrl = (url: string) => {
  if (typeof window === 'undefined') return;
  let targetUrl = url;
  if (url.startsWith('/')) {
    targetUrl = window.location.origin + url;
  }
  localStorage.setItem('returnUrl', targetUrl);
  setCookie('returnUrl', targetUrl, 1);
};

export const getSharedReturnUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('returnUrl') || getCookie('returnUrl');
};

export const clearSharedReturnUrl = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('returnUrl');
  deleteCookie('returnUrl');
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());
  const router = useRouter();

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivity');
    deleteCookie('token');
    deleteCookie('user');
    delete api.defaults.headers.Authorization;
    router.push('/auth/login');
  }, [router]);

  const logoutWithAlert = useCallback(async (message: string) => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    // Don't show alert if already on login or verify-email page
    if (typeof window !== 'undefined' && (window.location.pathname === '/auth/login' || window.location.pathname === '/auth/verify-email')) {
      if (window.location.pathname === '/auth/login') {
        logout();
      }
      setIsLoggingOut(false);
      return;
    }

    if (typeof window !== 'undefined') {
      const currentUrl = window.location.origin + window.location.pathname + window.location.search;
      setSharedReturnUrl(currentUrl);
    }

    await Swal.fire({
      title: 'Session Expired',
      text: message,
      icon: 'warning',
      confirmButtonText: 'Log In Again',
      confirmButtonColor: '#295FA7',
      allowOutsideClick: false,
    });

    logout();
    setIsLoggingOut(false);
  }, [isLoggingOut, logout]);

  // Handle idle timeout
  useEffect(() => {
    if (!token) return;

    const handleActivity = () => {
      const now = Date.now();
      // Only check localStorage if at least 1 second has passed since we last updated the ref
      // to avoid doing it on every single pixel of mouse movement
      if (now - lastActivityRef.current < 1000) {
        lastActivityRef.current = now;
        return;
      }

      lastActivityRef.current = now;

      const lastStored = localStorage.getItem('lastActivity');
      if (!lastStored || now - parseInt(lastStored, 10) > ACTIVITY_UPDATE_INTERVAL) {
        localStorage.setItem('lastActivity', now.toString());
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    const interval = setInterval(() => {
      const now = Date.now();
      const storedLastActivity = localStorage.getItem('lastActivity');
      const lastActivity = storedLastActivity ? parseInt(storedLastActivity, 10) : lastActivityRef.current;

      if (now - lastActivity > IDLE_TIMEOUT) {
        logoutWithAlert("Your session has timed out due to inactivity.");
      }
    }, 60000); // Check every minute

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(interval);
    };
  }, [token, logoutWithAlert]);

  // Listen for unauthorized access (401 errors)
  useEffect(() => {
    const handleUnauthorized = () => {
      logoutWithAlert("Your session has expired. Please log in again.");
    };

    window.addEventListener('unauthorized-access', handleUnauthorized);
    return () => window.removeEventListener('unauthorized-access', handleUnauthorized);
  }, [logoutWithAlert]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await api.get('/users/me');
      const userData = response.data.data || response.data;
      setUser(prev => {
        const updated = { ...prev, ...userData };
        const updatedStr = JSON.stringify(updated);
        localStorage.setItem('user', updatedStr);
        setCookie('user', updatedStr);
        return updated;
      });
    } catch (error) {
      console.error("Failed to fetch user profile", error);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token') || getCookie('token');
    const storedLastActivity = localStorage.getItem('lastActivity');

    if (storedToken) {
      // Sync it to localStorage if it was only present in cookies (cross-subdomain sync)
      if (!localStorage.getItem('token')) {
        localStorage.setItem('token', storedToken);
      }

      // Sync to cookie if it was only present in localStorage
      if (!getCookie('token')) {
        setCookie('token', storedToken);
      }

      // Check for inactivity timeout
      if (storedLastActivity) {
        if (Date.now() - parseInt(storedLastActivity, 10) > IDLE_TIMEOUT) {
          logoutWithAlert("Your session has timed out due to inactivity.");
          setLoading(false);
          return;
        }
      } else {
        // Initialize for sessions that don't have it yet
        localStorage.setItem('lastActivity', Date.now().toString());
      }

      try {
        const decodedToken = jwtDecode<DecodedToken>(storedToken);
        // Check if token is expired
        if (decodedToken.exp * 1000 < Date.now()) {
          logout(); // This will clear storage and redirect
        } else {
          setToken(storedToken);
          api.defaults.headers.Authorization = `Bearer ${storedToken}`;
          // Fetch user data if not in local storage or if it's stale
          const storedUser = localStorage.getItem('user') || getCookie('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));

            // Sync user to both places
            if (!localStorage.getItem('user')) {
              localStorage.setItem('user', storedUser);
            }
            if (!getCookie('user')) {
              setCookie('user', storedUser);
            }

            fetchUserProfile(); // Background refresh
          } else {
            // Initial load from token then background fetch
            const userFromToken: User = {
                id: decodedToken._id,
                _id: decodedToken._id,
                email: decodedToken.email,
                role: decodedToken.role,
                activeRole: decodedToken.activeRole,
                fullName: '',
                hasAcceptedLatestPolicies: decodedToken.hasAcceptedLatestPolicies,
                hasAcceptedHallOwnerPolicy: decodedToken.hasAcceptedHallOwnerPolicy,
                hasAcceptedOrganizerPolicy: decodedToken.hasAcceptedOrganizerPolicy,
                hallOwnerApplication: decodedToken.hallOwnerApplication
            };
            setUser(userFromToken);
            fetchUserProfile();
          }
        }
      } catch (error) {
        console.error("Failed to initialize auth from localStorage", error);
        logout(); // Token might be invalid, so clear everything
      }
    }
    setLoading(false);
  }, [logout, logoutWithAlert, fetchUserProfile]);

  const login = useCallback((newToken: string, newUser: User, redirectPath?: string) => {
    setToken(newToken);
    setUser(newUser);
    const userStr = JSON.stringify(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', userStr);
    localStorage.setItem('lastActivity', Date.now().toString());
    setCookie('token', newToken);
    setCookie('user', userStr);
    api.defaults.headers.Authorization = `Bearer ${newToken}`;

    if (redirectPath) {
      window.location.href = redirectPath;
      return;
    }

    const returnUrl = getSharedReturnUrl();
    if (returnUrl) {
      clearSharedReturnUrl();
      window.location.href = returnUrl;
    } else {
      // First-time users (customers) go to home page for the tour
      const isCustomer = newUser.activeRole === 'user';
      const tourCompleted = localStorage.getItem('gobokin_customer_tour_completed');

      if (isCustomer && !tourCompleted) {
        window.location.href = '/';
      } else {
        const dashboardPath = getDashboardPath(newUser.activeRole);
        window.location.href = dashboardPath;
      }
    }
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      const updatedStr = JSON.stringify(updated);
      localStorage.setItem('user', updatedStr);
      setCookie('user', updatedStr);
      return updated;
    });
  }, []);

  const updateToken = useCallback((newToken: string, customRedirectPath?: string | null) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('lastActivity', Date.now().toString());
    setCookie('token', newToken);
    api.defaults.headers.Authorization = `Bearer ${newToken}`;

    try {
      const decodedToken = jwtDecode<DecodedToken>(newToken);

      setUser(prev => {
        const updatedUser: User = {
          id: decodedToken._id,
          _id: decodedToken._id,
          email: decodedToken.email,
          role: decodedToken.role,
          activeRole: decodedToken.activeRole,
          fullName: prev?.fullName || '',
          // Prefer true if either the token or the current state has it as true (persistence fix)
          hasAcceptedLatestPolicies: decodedToken.hasAcceptedLatestPolicies === true || prev?.hasAcceptedLatestPolicies === true,
          hasAcceptedHallOwnerPolicy: decodedToken.hasAcceptedHallOwnerPolicy === true || prev?.hasAcceptedHallOwnerPolicy === true,
          hasAcceptedOrganizerPolicy: decodedToken.hasAcceptedOrganizerPolicy === true || prev?.hasAcceptedOrganizerPolicy === true,
          hallOwnerApplication: decodedToken.hallOwnerApplication || prev?.hallOwnerApplication,
        };
        const updatedStr = JSON.stringify(updatedUser);
        localStorage.setItem('user', updatedStr);
        setCookie('user', updatedStr);
        return updatedUser;
      });

      // If customRedirectPath is explicitly null, skip redirection
      if (customRedirectPath === null) return;

      if (customRedirectPath) {
        window.location.href = customRedirectPath;
        return;
      }

      const returnUrl = getSharedReturnUrl();
      if (returnUrl) {
        clearSharedReturnUrl();
        window.location.href = returnUrl;
      } else {
        // First-time users (customers) go to home page for the tour
        const isCustomer = decodedToken.activeRole === 'user';
        const tourCompleted = localStorage.getItem('gobokin_customer_tour_completed');

        if (isCustomer && !tourCompleted) {
          window.location.href = '/';
        } else {
          const redirectPath = getDashboardPath(decodedToken.activeRole);
          window.location.href = redirectPath;
        }
      }
    } catch (error) {
      console.error("Failed to decode token or update user", error);
      logout();
    }
  }, [logout]);

  const updateUserApplicationStatus = useCallback((status: string) => {
    setUser(prev => {
      if (!prev) return null;
      const updatedUser = {
        ...prev,
        hallOwnerApplication: {
          ...prev.hallOwnerApplication,
          status,
        },
      };
      const updatedStr = JSON.stringify(updatedUser);
      localStorage.setItem('user', updatedStr);
      setCookie('user', updatedStr);
      return updatedUser;
    });
  }, []);

  const contextValue = useMemo(() => ({
    user,
    activeRole: user?.activeRole || null,
    token,
    loading,
    login,
    logout,
    updateToken,
    updateUser,
    updateUserApplicationStatus,
    fetchUserProfile
  }), [user, token, loading, login, logout, updateToken, updateUser, updateUserApplicationStatus, fetchUserProfile]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
