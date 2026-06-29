"use client";
import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext";
import { Menu, User, ChevronDown, LogOut, Users, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import { getDashboardPath } from "@/utils/redirects";
import api from "@/services/api";
import Swal from "@/utils/sweetalert";
import AccountSwitchModal from "../shared/AccountSwitchModal";
import NotificationIcon from "../notifications/NotificationIcon";
import NotificationDropdown from "../notifications/NotificationDropdown";

const formatRole = (role: string) => {
  if (role === 'user') return 'Customer';
  if (role === 'hall-owner') return 'Venue Owner';
  if (role === 'organizer') return 'Organizer';
  return role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const OrganizerHeader = () => {
  const { user, logout, updateToken } = useAuth();
  const { toggleSidebar } = useUI();
  const router = useRouter();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [roleSwitchOpen, setRoleSwitchOpen] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(userDropdownRef, () => {
    setUserDropdownOpen(false);
    setRoleSwitchOpen(false);
  });

  useOnClickOutside(notificationDropdownRef, () => {
    setNotificationDropdownOpen(false);
  });

  const handleRoleSwitch = async (role: string) => {
    setIsSwitchingAccount(true);
    setUserDropdownOpen(false);

    try {
      const response = await api.post('/auth/switch-role', { role }, { timeout: 15000 });
      const { accessToken } = response.data.data || response.data;
      updateToken(accessToken);
    } catch (error) {
      Swal.toast.fire({
        icon: 'error',
        title: error instanceof Error ? error.message : 'An error occurred. Please try again.',
      });
    } finally {
      setIsSwitchingAccount(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-100 h-20 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 lg:hidden text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Menu size={24} />
        </button>
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Organizer Dashboard</h2>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <div className="relative" ref={notificationDropdownRef}>
          <button
            onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
            className="p-2.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all relative"
          >
            <NotificationIcon />
          </button>
          {notificationDropdownOpen && <NotificationDropdown />}
        </div>

        <div className="h-10 w-[1px] bg-gray-100 hidden sm:block"></div>

        <div className="relative" ref={userDropdownRef}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-3 pl-2 cursor-pointer group hover:bg-gray-50 p-1 rounded-2xl transition-all"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">{user?.fullName}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatRole(user?.activeRole || '')}</p>
            </div>
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border-2 border-transparent group-hover:border-primary transition-all shadow-sm">
              {user?.avatar ? (
                <Image
                  src={user.avatar}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  <User size={20} />
                </div>
              )}
            </div>
            <ChevronDown size={16} className={`text-gray-400 group-hover:text-primary transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {userDropdownOpen && user && (
            <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] animate-in fade-in slide-in-from-top-2">
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

export default OrganizerHeader;
