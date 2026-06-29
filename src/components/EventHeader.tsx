"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Search,
  MapPin,
  User as UserIcon,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Calendar
} from "lucide-react";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import useScroll from "@/hooks/useScroll";
import NotificationIcon from "./notifications/NotificationIcon";
import NotificationDropdown from "./notifications/NotificationDropdown";
import { getDashboardPath } from "@/utils/redirects";

const EventHeaderContent = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrolled = useScroll(10);

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [locationTerm, setLocationTerm] = useState(searchParams.get("location") || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showMobileLocationDropdown, setShowMobileLocationDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const mobileLocationDropdownRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(dropdownRef, () => setDropdownOpen(false));
  useOnClickOutside(notificationDropdownRef, () => setNotificationDropdownOpen(false));
  useOnClickOutside(locationDropdownRef, () => setShowLocationDropdown(false));
  useOnClickOutside(mobileLocationDropdownRef, () => setShowMobileLocationDropdown(false));

  const popularLocations = [
    'Lagos',
    'Abuja',
    'Port Harcourt',
    'Kano',
    'Ibadan',
    'Enugu',
    'Benin City',
    'Kaduna',
  ];

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationTerm("Near Me");
          setShowLocationDropdown(false);
          setShowMobileLocationDropdown(false);

          const params = new URLSearchParams(searchParams.toString());
          if (searchTerm) params.set("search", searchTerm);
          params.set("location", "Near Me");
          params.set("lat", position.coords.latitude.toString());
          params.set("lng", position.coords.longitude.toString());
          router.push(`/events?${params.toString()}`);
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  };

  // Sync state with URL params
  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
    setLocationTerm(searchParams.get("location") || "");
  }, [searchParams]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (searchTerm) params.set("search", searchTerm);
    else params.delete("search");
    if (locationTerm) params.set("location", locationTerm);
    else params.delete("location");

    router.push(`/events?${params.toString()}`);
  };

  const dashboardUrl = getDashboardPath(user?.activeRole || 'user');

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-sm h-16" : "bg-white/80 backdrop-blur-md h-20"
      } border-b border-gray-100`}
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <Link href="/events" className="flex items-center gap-2 group">
            <Image
              src="/gobokin-event.png"
              alt="Gobokin"
              width={160}
              height={50}
              className="h-10 md:h-12 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Search Bar - Desktop */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-lg bg-gray-50 border border-gray-200 rounded-xl p-1 items-center transition-all duration-300 hover:bg-white hover:shadow-md focus-within:bg-white focus-within:shadow-md focus-within:border-primary/30"
        >
          <div className="flex-[1.2] flex items-center px-3 gap-2 border-r border-gray-200">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              className="bg-transparent border-none focus:ring-0 text-xs font-semibold text-gray-700 w-full placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-1 relative" ref={locationDropdownRef}>
            <div
              className="flex items-center px-3 gap-2 cursor-pointer"
              onClick={() => setShowLocationDropdown(true)}
            >
              <MapPin size={16} className="text-gray-400" />
              <input
                type="text"
                placeholder="Location"
                className="bg-transparent border-none focus:ring-0 text-xs font-semibold text-gray-700 w-full placeholder:text-gray-400 cursor-pointer outline-none"
                value={locationTerm}
                onChange={(e) => setLocationTerm(e.target.value)}
                onFocus={(e) => {
                  e.stopPropagation();
                  setShowLocationDropdown(true);
                }}
              />
            </div>

            <AnimatePresence>
              {showLocationDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 overflow-hidden min-w-[200px]"
                >
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors border-b border-gray-50"
                  >
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin size={14} />
                    </div>
                    Use Current Location
                  </button>
                  <div className="px-4 py-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Popular Cities</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {popularLocations.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setLocationTerm(loc);
                          setShowLocationDropdown(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            type="submit"
            className="bg-primary text-white p-2 rounded-lg hover:bg-blue-700 transition-all hover:scale-105 active:scale-95 shadow-sm"
          >
            <Search size={16} />
          </button>
        </form>

        {/* Right Section */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/events"
            className={`hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              pathname === "/events" ? "text-primary bg-primary/5" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Calendar size={18} />
            Explore
          </Link>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative" ref={notificationDropdownRef}>
                <button
                  onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <NotificationIcon />
                </button>
                <AnimatePresence>
                  {notificationDropdownOpen && <NotificationDropdown />}
                </AnimatePresence>
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden">
                    <UserIcon size={20} className="text-gray-600" />
                  </div>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-[60]"
                    >
                      <div className="px-4 py-3 border-b border-gray-50 mb-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href={dashboardUrl}
                        className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <LayoutDashboard size={18} className="text-gray-400" />
                        Dashboard
                      </Link>
                      <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-primary/10 hover:scale-105 transition-all"
            >
              Login
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 bottom-0 w-[85%] bg-white z-[101] p-6 flex flex-col gap-8 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <Link href="/events" onClick={() => setMobileMenuOpen(false)}>
                  <Image src="/gobokin-event.png" alt="Logo" width={130} height={40} className="h-10 w-auto object-contain" />
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search events..."
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all focus:bg-white focus:shadow-md"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
                 <div className="relative" ref={mobileLocationDropdownRef}>
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Location"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/20 outline-none transition-all focus:bg-white focus:shadow-md"
                      value={locationTerm}
                      onChange={(e) => setLocationTerm(e.target.value)}
                      onFocus={() => setShowMobileLocationDropdown(true)}
                    />

                    <AnimatePresence>
                      {showMobileLocationDropdown && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden relative z-50 shadow-md"
                        >
                          <button
                            type="button"
                            onClick={handleUseCurrentLocation}
                            className="flex items-center gap-3 w-full px-4 py-4 text-sm font-semibold text-primary border-b border-gray-100"
                          >
                            <MapPin size={18} />
                            Use Current Location
                          </button>
                          <div className="max-h-48 overflow-y-auto">
                            {popularLocations.map((loc) => (
                              <button
                                key={loc}
                                type="button"
                                onClick={() => {
                                  setLocationTerm(loc);
                                  setShowMobileLocationDropdown(false);
                                }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-gray-600 border-b border-gray-100 last:border-none"
                              >
                                {loc}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
                 <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-semibold shadow-md shadow-primary/10 hover:scale-[1.02] active:scale-95 transition-all">
                    Find Events
                 </button>
              </form>

              <nav className="flex flex-col gap-2">
                 <Link href="/events" className="flex items-center gap-3 p-4 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                    <Calendar size={20} className="text-primary" />
                    Explore Events
                 </Link>
                 {user && (
                    <Link href={dashboardUrl} className="flex items-center gap-3 p-4 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                       <LayoutDashboard size={20} className="text-primary" />
                       Go to Dashboard
                    </Link>
                 )}
              </nav>

              {!user && (
                 <div className="mt-auto space-y-4">
                    <Link href="/auth/login" className="block w-full py-4 text-center bg-primary text-white rounded-xl font-semibold shadow-md shadow-primary/10">
                       Login
                    </Link>
                    <Link href="/auth/register" className="block w-full py-4 text-center border-2 border-primary text-primary rounded-xl font-semibold">
                       Create Account
                    </Link>
                 </div>
              )}

              {user && (
                 <button onClick={logout} className="mt-auto flex items-center gap-3 p-4 text-red-600 font-semibold hover:bg-red-50 rounded-xl transition-colors">
                    <LogOut size={20} />
                    Logout
                 </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

const EventHeader = () => {
  return (
    <Suspense fallback={<div className="h-20 bg-white border-b border-gray-100 animate-pulse"></div>}>
      <EventHeaderContent />
    </Suspense>
  );
};

export default EventHeader;
