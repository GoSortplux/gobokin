"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext";
import { Bell, Menu, User, ChevronDown } from "lucide-react";
import Image from "next/image";

const OrganizerHeader = () => {
  const { user } = useAuth();
  const { toggleSidebar } = useUI();

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
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Welcome back, {user?.fullName || 'Organizer'}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <button className="p-2.5 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-10 w-[1px] bg-gray-100 hidden sm:block"></div>

        <div className="flex items-center gap-3 pl-2 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">{user?.fullName}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user?.activeRole}</p>
          </div>
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border-2 border-transparent group-hover:border-primary transition-all">
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
          <ChevronDown size={16} className="text-gray-400 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </header>
  );
};

export default OrganizerHeader;
