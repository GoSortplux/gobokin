"use client";
import React, { useState, useRef, useEffect } from "react";
import { Search, User as UserIcon, Building, Calendar, Users, Shield, ChevronDown, LogOut, LayoutDashboard, Menu, X, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import NotificationIcon from "../notifications/NotificationIcon";
import NotificationDropdown from "../notifications/NotificationDropdown";
import { getDashboardPath } from "@/utils/redirects";
import api from "@/services/api";
import { translateError } from "@/utils/errors";
import Swal from "@/utils/sweetalert";
import AccountSwitchModal from "../shared/AccountSwitchModal";
import { useUI } from "@/context/UIContext";

const placeholders = [
  "Search for Users by name...",
  "Search for Venue names...",
  "Search for Booking IDs...",
  "Search for License Tiers...",
];

const formatRole = (role: string) => {
  if (role === 'user') return 'Customer';
  if (role === 'hall-owner') return 'Venue Owner';
  return role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const AdminHeader = () => {
  const { user, logout, updateToken } = useAuth();
  const { toggleSidebar } = useUI();
  const router = useRouter();
  const [notificationDropdownOpen, setNotificationDropdownOpen] =
    useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [roleSwitchOpen, setRoleSwitchOpen] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(notificationDropdownRef, () =>
    setNotificationDropdownOpen(false)
  );
  useOnClickOutside(userDropdownRef, () => {
    setUserDropdownOpen(false);
    setRoleSwitchOpen(false);
  });
  useOnClickOutside(searchRef, () => setShowSearchSuggestions(false));

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (path: string) => {
    if (searchQuery.trim()) {
      router.push(`${path}?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchSuggestions(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      // Default to users for admin
      handleSearch("/admin/dashboard/users");
    }
  };

  const handleRoleSwitch = async (role: string) => {
    setIsSwitchingAccount(true);
    setUserDropdownOpen(false);

    try {
      const response = await api.post('/auth/switch-role', { role }, { timeout: 15000 });
      const { accessToken } = response.data.data || response.data;

      // updateToken now handles redirection using window.location.href
      updateToken(accessToken);
    } catch (error: unknown) {
      Swal.toast.fire({
        icon: 'error',
        title: error instanceof Error ? error.message : 'An error occurred. Please try again.',
      });
    } finally {
      setIsSwitchingAccount(false);
    }
  };

  const suggestions = [
    { label: "Search in Users", icon: Users, path: "/admin/dashboard/users" },
    { label: "Search in Venues", icon: Building, path: "/admin/dashboard/venues" },
    { label: "Search in Bookings", icon: Calendar, path: "/admin/dashboard/bookings" },
    { label: "Search in License Tiers", icon: Shield, path: "/admin/dashboard/license-tiers" },
  ];

  const handleSettleCommission = async () => {
    const amount = user?.outstandingReferralCommission || 0;
    try {
      Swal.fire({
        title: 'Settling Commission...',
        text: 'Generating your payment link.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });
      const response = await api.post('/payments/settle-commission', { amount });
      const { checkoutUrl } = response.data.data;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('Failed to generate payment link');
      }
    } catch (err) {
      console.error('Failed to settle commission:', err);
      Swal.fire('Error', translateError(err), 'error');
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-xl md:hidden transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic hidden lg:block">Super Admin <span className="text-primary not-italic">Dashboard</span></h1>
      </div>

      {/* Desktop Search */}
      <div className="hidden md:flex items-center w-1/3 relative group" ref={searchRef}>
        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchSuggestions(true)}
            onKeyDown={onKeyDown}
            placeholder={placeholders[placeholderIndex]}
            className="pl-11 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full text-sm text-gray-600 transition-all duration-300"
          />
        </div>
        {showSearchSuggestions && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden">
            <div className="p-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
              Suggestions
            </div>
            <ul>
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button
                    onClick={() => handleSearch(s.path)}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-primary/5 flex items-center space-x-3 transition-colors"
                  >
                    <s.icon size={18} className="text-gray-400" />
                    <span>{s.label} <span className="font-bold text-primary">&quot;{searchQuery}&quot;</span></span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="absolute inset-0 bg-white z-50 flex items-center px-4 md:hidden">
          <div className="relative w-full flex items-center space-x-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search..."
                className="pl-11 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-full text-sm text-gray-600"
              />
            </div>
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              <X size={20} />
            </button>
          </div>
          {searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 bg-white shadow-2xl border-t border-gray-100 overflow-hidden">
              <ul>
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      onClick={() => {
                        handleSearch(s.path);
                        setIsMobileSearchOpen(false);
                      }}
                      className="w-full text-left px-6 py-4 text-sm text-gray-700 active:bg-gray-50 flex items-center space-x-4"
                    >
                      <s.icon size={20} className="text-gray-400" />
                      <span>{s.label} <span className="font-bold text-primary">&quot;{searchQuery}&quot;</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center space-x-2 md:space-x-6">
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl md:hidden transition-all"
        >
          <Search size={20} />
        </button>
        <div
          className="relative"
          ref={notificationDropdownRef}
        >
          <button
            onClick={() =>
              setNotificationDropdownOpen(!notificationDropdownOpen)
            }
            className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all relative"
            data-testid="notification-button"
          >
            <NotificationIcon />
          </button>
          {notificationDropdownOpen && <NotificationDropdown />}
        </div>
        <div className="flex items-center space-x-3 pl-2 md:pl-6 border-l border-gray-100 relative" ref={userDropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center space-x-3 hover:bg-gray-50 p-1 rounded-2xl transition-all duration-300 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shadow-sm group-hover:shadow-md transition-all">
              <UserIcon size={20} />
            </div>
            {user && (
              <div className="hidden lg:block text-left">
                <p className="font-bold text-sm text-gray-900 leading-tight">{user.fullName}</p>
                <div className="flex items-center mt-0.5">
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest">{formatRole(user.activeRole || user.role[0] || '')}</p>
                   <ChevronDown size={12} className={`ml-1 text-gray-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>
            )}
          </button>

          {userDropdownOpen && user && (
            <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-2">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    router.push(getDashboardPath(user.activeRole));
                  }}
                  className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  <LayoutDashboard size={18} className="mr-3 text-primary" />
                  Dashboard
                </button>

                {user.role && user.role.length > 1 && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRoleSwitchOpen(!roleSwitchOpen);
                      }}
                      className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                      <span className="flex items-center">
                        <Users size={18} className="mr-3 text-primary" />
                        Switch Account
                      </span>
                      <ChevronDown size={14} className={`transform transition-transform text-gray-400 ${roleSwitchOpen ? 'rotate-180 md:-rotate-90' : ''}`} />
                    </button>
                    {roleSwitchOpen && (
                      <div className="md:absolute md:right-full md:top-0 md:w-48 md:mr-2 md:bg-white md:rounded-xl md:shadow-2xl md:border md:border-gray-100 relative w-full bg-gray-50 rounded-xl mt-1 overflow-hidden animate-in fade-in slide-in-from-top-1 md:slide-in-from-right-2">
                        <div className="py-1">
                          {user.role.map((role) => (
                            <button
                              key={role}
                              onClick={() => handleRoleSwitch(role)}
                              className={`block w-full px-4 py-2.5 text-sm text-left transition-all ${
                                user.activeRole === role ? 'bg-primary/10 text-primary font-black' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              {formatRole(role)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="my-1 border-t border-gray-50" />

                <div className="px-4 py-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Referral Balance</p>
                  <div className={`flex items-center justify-between p-3 rounded-xl border ${ (user?.outstandingReferralCommission || 0) > 0 ? 'bg-rose-50 border-rose-100' : 'bg-gray-50 border-gray-100' }`}>
                    <div className="flex items-center gap-2">
                      <Wallet size={14} className={ (user?.outstandingReferralCommission || 0) > 0 ? 'text-rose-600' : 'text-gray-400' } />
                      <span className={`text-xs font-bold ${ (user?.outstandingReferralCommission || 0) > 0 ? 'text-rose-700' : 'text-gray-600' }`}>
                        ₦{(user?.outstandingReferralCommission || 0).toLocaleString()}
                      </span>
                    </div>
                    {(user?.outstandingReferralCommission || 0) > 0 && (
                      <button
                        onClick={handleSettleCommission}
                        className="text-[10px] font-black uppercase text-rose-600 hover:text-rose-800 underline underline-offset-2"
                      >
                        Settle
                      </button>
                    )}
                  </div>
                </div>

                <div className="my-1 border-t border-gray-50" />

                <button
                  onClick={logout}
                  className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut size={18} className="mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <AccountSwitchModal isOpen={isSwitchingAccount} />
    </header>
  );
};

export default AdminHeader;
