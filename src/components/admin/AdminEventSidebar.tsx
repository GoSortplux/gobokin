"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  Wallet,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Shield,
  Briefcase,
  Layers,
  ArrowLeftRight,
  CreditCard,
  Target
} from "lucide-react";

const AdminEventSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isSidebarOpen, closeSidebar } = useUI();
  const pathname = usePathname();
  const { logout } = useAuth();

  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  const navLinks = [
    {
      href: "/admin/events/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={24} />,
      id: "admin-event-nav-dashboard",
    },
    {
      href: "/admin/events/events",
      label: "All Events",
      icon: <Calendar size={24} />,
      id: "admin-event-nav-events",
    },
    {
      href: "/admin/events/orders",
      label: "Orders & Registrations",
      icon: <Ticket size={24} />,
      id: "admin-event-nav-orders",
    },
    {
      href: "/admin/events/users",
      label: "User Management",
      icon: <Users size={24} />,
      id: "admin-event-nav-users",
    },
    {
      href: "/admin/events/finance",
      label: "Finance",
      icon: <Wallet size={24} />,
      id: "admin-event-nav-finance",
    },
    {
      href: "/admin/events/settings",
      label: "System Settings",
      icon: <Settings size={24} />,
      id: "admin-event-nav-settings",
    },
  ];

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[50] md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`
        ${isSidebarOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${isExpanded ? "md:w-64" : "md:w-20"}
        fixed md:sticky top-0 left-0 z-[60] md:z-30
        bg-white border-r border-gray-100 flex flex-col transition-all duration-300 h-screen
      `}
      >
        <div className="flex items-center justify-between px-4 py-8 mb-4 relative">
          <Link href="/" className={`${!isExpanded && !isSidebarOpen && "mx-auto"}`}>
            {isExpanded || isSidebarOpen ? (
              <div className="flex items-center gap-2">
                <Image
                  src="/logo-icon.png"
                  alt="G"
                  width={32}
                  height={32}
                  className="w-8 h-8 object-contain"
                />
                <span className="font-black text-xl tracking-tighter uppercase italic">Event <span className="text-primary not-italic">Admin</span></span>
              </div>
            ) : (
              <Image
                src="/logo-icon.png"
                alt="G"
                width={40}
                height={40}
                className="w-10 h-10 object-contain transform hover:rotate-12 transition-transform duration-300"
              />
            )}
          </Link>
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-primary transition-all duration-300"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="hidden md:block p-1.5 hover:bg-white rounded-xl text-gray-400 hover:text-primary transition-all duration-300 absolute -right-4 top-8 bg-white border border-gray-100 shadow-md z-10"
            >
              <Menu size={14} />
            </button>
          )}
          <button onClick={closeSidebar} className="md:hidden p-2 text-gray-400 hover:text-primary">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 flex flex-col px-3 space-y-2 overflow-y-auto no-scrollbar">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              id={link.id}
              href={link.href}
              className={`flex items-center ${isExpanded ? "px-4" : "justify-center"} h-12 rounded-2xl transition-all duration-300 group relative ${
                pathname.startsWith(link.href)
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-gray-400 hover:text-primary hover:bg-blue-50"
              }`}
              title={!isExpanded ? link.label : ""}
            >
              <div
                className={`flex-shrink-0 transform group-hover:scale-110 transition-transform duration-200 ${pathname.startsWith(link.href) ? "scale-105" : ""}`}
              >
                {React.cloneElement(link.icon as React.ReactElement<{ size: number }>, { size: 20 })}
              </div>
              {(isExpanded || isSidebarOpen) && (
                <span
                  className={`ml-4 text-xs font-bold whitespace-nowrap opacity-100 transition-opacity duration-300 ${pathname.startsWith(link.href) ? "text-primary font-black" : "text-gray-600"}`}
                >
                  {link.label}
                </span>
              )}
              {pathname.startsWith(link.href) && !isExpanded && (
                <div className="absolute -left-3 w-1.5 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 mt-auto border-t border-gray-50 pt-6">
          <button
            onClick={logout}
            className={`flex items-center ${isExpanded ? "px-4" : "justify-center"} h-12 w-full rounded-2xl text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300 group`}
            title={!isExpanded ? "Sign Out" : ""}
          >
            <div className="flex-shrink-0 group-hover:-translate-x-0.5 transition-transform">
              <LogOut size={20} />
            </div>
            {(isExpanded || isSidebarOpen) && (
              <span className="ml-4 text-sm font-bold whitespace-nowrap">Sign Out</span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminEventSidebar;
