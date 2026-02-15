"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext";
import {
  LayoutDashboard,
  Building,
  Calendar,
  BarChart,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const { isSidebarOpen, closeSidebar } = useUI();
  const pathname = usePathname();
  const { logout, user } = useAuth();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    closeSidebar();
    setPendingPath(null);
  }, [pathname, closeSidebar]);

  const handleNavigate = (href: string) => {
    if (pathname === href) return;
    setPendingPath(href);
    window.location.href = href;
  };

  const navLinks = [
    {
      href: "/vendor/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={24} />,
      id: "vendor-nav-dashboard",
    },
    {
      href: "/vendor/dashboard/halls",
      label: "Venues",
      icon: <Building size={24} />,
      id: "vendor-nav-halls",
    },
    {
      href: "/vendor/dashboard/bookings",
      label: "Bookings",
      icon: <Calendar size={24} />,
      id: "vendor-nav-bookings",
    },
  ];

  // Only add these links if the user is a hall-owner
  if (user?.activeRole === "hall-owner") {
    navLinks.push(
      {
        href: "/vendor/dashboard/analytics",
        label: "Analytics",
        icon: <BarChart size={24} />,
        id: "vendor-nav-analytics",
      },
      {
        href: "/vendor/dashboard/staff",
        label: "Staff",
        icon: <Users size={24} />,
        id: "vendor-nav-staff",
      },
      {
        href: "/vendor/dashboard/settings",
        label: "Settings",
        icon: <Settings size={24} />,
        id: "vendor-nav-settings",
      }
    );
  }

  return (
    <>
    {/* Mobile Backdrop */}
    {isSidebarOpen && (
      <div
        className="fixed inset-0 bg-black/50 z-[50] md:hidden backdrop-blur-sm transition-opacity"
        onClick={closeSidebar}
      />
    )}

    <div className={`
      ${isSidebarOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0"}
      ${isExpanded ? "md:w-64" : "md:w-20"}
      fixed md:sticky top-0 left-0 z-[60] md:z-30
      bg-white border-r border-gray-100 flex flex-col transition-all duration-300 h-screen
    `}>
      <div className="flex items-center justify-between px-4 py-8 mb-4 relative">
        <Link href="/" className={`${(!isExpanded && !isSidebarOpen) && "mx-auto"}`}>
          {(isExpanded || isSidebarOpen) ? (
            <Image
              src="/logo.png"
              alt="Gobokin Logo"
              width={140}
              height={36}
              className="h-8 w-auto object-contain animate-in fade-in slide-in-from-left-4"
            />
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
        <button
          onClick={closeSidebar}
          className="md:hidden p-2 text-gray-400 hover:text-primary"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 flex flex-col px-3 space-y-3">
        {navLinks.map((link) => (
          <button
            key={link.href}
            id={link.id}
            onClick={() => handleNavigate(link.href)}
            className={`flex items-center ${isExpanded ? "px-4" : "justify-center"} h-12 rounded-2xl transition-all duration-300 group relative w-full ${
              pathname === link.href
                ? "bg-primary text-white shadow-lg shadow-blue-200"
                : "text-gray-400 hover:text-primary hover:bg-blue-50"
            } ${pendingPath === link.href ? "opacity-70 cursor-wait" : ""}`}
            title={!isExpanded ? link.label : ""}
          >
            <div className={`flex-shrink-0 transform group-hover:scale-110 transition-transform duration-200 ${pathname === link.href ? "scale-105" : ""}`}>
              {pendingPath === link.href ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent" />
              ) : (
                React.cloneElement(link.icon as React.ReactElement<{ size: number }>, { size: 20 })
              )}
            </div>
            {(isExpanded || isSidebarOpen) && (
              <span className={`ml-4 text-sm font-bold whitespace-nowrap opacity-100 transition-opacity duration-300 ${pathname === link.href ? "text-white" : "text-gray-600"}`}>
                {link.label}
              </span>
            )}
            {pathname === link.href && !isExpanded && (
              <div className="absolute -left-3 w-1.5 h-6 bg-primary rounded-r-full" />
            )}
          </button>
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
            <span className="ml-4 text-sm font-bold whitespace-nowrap">
              Sign Out
            </span>
          )}
        </button>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
