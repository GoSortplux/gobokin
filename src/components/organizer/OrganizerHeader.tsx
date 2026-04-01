"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext";
import { Bell, Menu, User, ChevronDown, Search, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const OrganizerHeader = () => {
  const { user } = useAuth();
  const { toggleSidebar } = useUI();

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 h-24 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-40">
      <div className="flex items-center gap-8 flex-1">
        <button
          onClick={toggleSidebar}
          className="p-3 lg:hidden text-gray-500 hover:bg-gray-100 rounded-2xl transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Global Search for Organizer */}
        <div className="hidden md:flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-2xl w-full max-w-md group focus-within:ring-2 focus-within:ring-primary/20 transition-all border border-transparent focus-within:border-primary/10">
           <Search size={18} className="text-gray-400 group-focus-within:text-primary transition-colors" />
           <input
            type="text"
            placeholder="Search events, orders, or staff..."
            className="bg-transparent border-none outline-none text-sm font-medium w-full text-gray-700 placeholder:text-gray-400"
           />
           <div className="px-2 py-0.5 bg-white border border-gray-200 rounded-lg text-[10px] font-black text-gray-400 shadow-sm">⌘K</div>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-8">
        <div className="hidden xl:flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-2xl border border-amber-100">
           <Zap size={16} className="text-amber-500 fill-amber-500" />
           <span className="text-xs font-black text-amber-700 uppercase tracking-widest">Priority Support</span>
        </div>

        <button className="p-3 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-2xl transition-all relative group">
          <Bell size={22} />
          <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
          {/* Tooltip */}
          <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-gray-900 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Notifications</span>
        </button>

        <div className="h-10 w-[1px] bg-gray-100"></div>

        <Link href="/organizer/dashboard/settings" className="flex items-center gap-4 pl-2 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">{user?.fullName || 'Organizer Account'}</p>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg mt-0.5">Verified</p>
          </div>
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 border-2 border-transparent group-hover:border-primary transition-all shadow-sm">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt="Profile"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                <User size={24} />
              </div>
            )}
          </div>
          <ChevronDown size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
        </Link>
      </div>
    </header>
  );
};

export default OrganizerHeader;
