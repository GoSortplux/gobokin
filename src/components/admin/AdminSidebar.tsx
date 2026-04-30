"use client";
import React, { useEffect } from "react";
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
  Shield,
  DollarSign,
  X,
  Ticket,
} from "lucide-react";

const AdminSidebar = () => {
  const pathname = usePathname();
  const { isSidebarOpen, closeSidebar } = useUI();
  const { logout } = useAuth();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  const navLinks = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={24} />,
    },
    {
      href: "/admin/dashboard/venues",
      label: "Venues",
      icon: <Building size={24} />,
    },
    {
      href: "/admin/dashboard/bookings",
      label: "Bookings",
      icon: <Calendar size={24} />,
    },
    {
      href: "/admin/dashboard/analytics",
      label: "Subscription Analytics",
      icon: <BarChart size={24} />,
    },
    {
      href: "/admin/dashboard/users",
      label: "Users",
      icon: <Users size={24} />,
    },
    {
      href: "/admin/dashboard/license-tiers",
      label: "License Tiers",
      icon: <Shield size={24} />,
    },
    {
      href: "/admin/dashboard/payment-management",
      label: "Payment Management",
      icon: <DollarSign size={24} />,
    },
    {
      href: "/admin/dashboard/settings",
      label: "Settings",
      icon: <Settings size={24} />,
    },
  ];

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
      w-20
      ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      fixed md:sticky top-0 left-0 z-[60] md:z-30
      bg-white border-r border-gray-100 flex flex-col items-center py-6 h-screen transition-all duration-300
    `}>
      <div className="flex-shrink-0 mb-10 flex flex-col items-center space-y-4">
        <button
          onClick={closeSidebar}
          className="md:hidden p-2 text-gray-400 hover:text-primary"
        >
          <X size={20} />
        </button>
        <Link href="/">
          <Image
            src="/logo-icon.png"
            alt="Gobokin Logo"
            width={44}
            height={44}
            className="w-11 h-11 object-contain transform hover:rotate-12 transition-transform duration-300"
          />
        </Link>
      </div>
      <nav className="flex-1 flex flex-col items-center space-y-3">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center justify-center h-12 w-12 rounded-2xl transition-all duration-300 group relative ${
              pathname === link.href
                ? "bg-primary text-white shadow-lg shadow-blue-200 scale-110"
                : "text-gray-400 hover:text-primary hover:bg-blue-50"
            }`}
            title={link.label}
          >
            <div className="transform group-hover:scale-110 transition-transform duration-200">
              {React.cloneElement(link.icon as React.ReactElement<{ size: number }>, { size: 20 })}
            </div>
            {pathname === link.href && (
              <div className="absolute -left-4 w-1.5 h-6 bg-primary rounded-r-full" />
            )}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-gray-50 pt-6 w-full flex flex-col items-center">
        <button
          onClick={logout}
          className="flex items-center justify-center h-12 w-12 rounded-2xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all duration-300 group"
          title="Logout"
        >
          <LogOut size={20} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
    </>
  );
};

export default AdminSidebar;
