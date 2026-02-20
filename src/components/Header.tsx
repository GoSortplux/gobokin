"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/api";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight, LogOut, LayoutDashboard, UserCircle, Plus, User as UserIcon, ChevronDown, Users } from "lucide-react";
import useOnClickOutside from "@/hooks/useOnClickOutside";
import useScroll from "@/hooks/useScroll";
import CollapsedSearchBar from "./CollapsedSearchBar";
import AccountSwitchModal from "./shared/AccountSwitchModal";
import NotificationIcon from "./notifications/NotificationIcon";
import NotificationDropdown from "./notifications/NotificationDropdown";
import Swal from "@/utils/sweetalert";
import { getDashboardPath } from "@/utils/redirects";

const formatRole = (role: string) => {
  if (role === 'user') return 'Customer';
  if (role === 'hall-owner') return 'Venue Owner';
  return role.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const Header = () => {
  const { user, logout, updateToken } = useAuth();
  const [message] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [roleSwitchOpen, setRoleSwitchOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const mobileNotificationDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const scrolled = useScroll(10);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  useOnClickOutside(dropdownRef, () => {
    setDropdownOpen(false);
    setRoleSwitchOpen(false);
  });
  useOnClickOutside([notificationDropdownRef, mobileNotificationDropdownRef], () =>
    setNotificationDropdownOpen(false)
  );


  const dashboardUrl = getDashboardPath(user?.activeRole || 'user');

  const handleRoleSwitch = async (role: string) => {
    setIsSwitchingAccount(true);
    setDropdownOpen(false);

    try {
      const response = await api.post('/auth/switch-role', { role }, { timeout: 15000 }); // 15 second timeout
      const { accessToken } = response.data.data;

      updateToken(accessToken);

      // Redirect based on the new role
      const redirectPath = getDashboardPath(role);
      router.push(redirectPath);
    } catch (error: unknown) {
      Swal.toast.fire({
        icon: 'error',
        title: error instanceof Error ? error.message : 'An error occurred. Please try again.',
      });
    } finally {
      setIsSwitchingAccount(false);
    }
  };

  const renderBecomeOwnerButton = () => {
    const buttonClasses = "flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-secondary text-secondary font-semibold hover:bg-secondary hover:text-white transition-all duration-300";

    if (!user) {
      return (
        <Link id="become-owner-button" href="/auth/register" className={buttonClasses}>
          <Plus className="w-4 h-4" />
          <span>List your venue</span>
        </Link>
      );
    }

    // Hide button if user is a hall-owner or super-admin
    if (user.role?.includes('hall-owner') || user.role?.includes('super-admin')) {
      return null;
    }

    // Show button only to users with the "user" role
    if (user.role?.includes('user')) {
      if (user.hallOwnerApplication?.status === 'pending') {
        return (
          <button disabled className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-400 font-semibold cursor-not-allowed">
            <span>Pending Application</span>
          </button>
        );
      }

      if (user.hallOwnerApplication?.status === 'not-applied' || !user.hallOwnerApplication?.status) {
        return (
          <Link
            id="become-owner-button"
            href="/apply-venue-owner"
            className={buttonClasses}
          >
            <Plus className="w-4 h-4" />
            <span>List your venue</span>
          </Link>
        );
      }
    }

    return null;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,box-shadow,height] duration-300 ${
        scrolled || pathname !== '/' ? 'bg-white shadow-md' : 'bg-transparent shadow-none'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`flex items-center justify-between transition-[height] duration-300 ${
            scrolled ? 'h-16' : 'h-20'
          }`}
        >
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Gobokin Logo"
                width={150}
                height={40}
                className="h-8 md:h-10 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {scrolled && (
            <div className="flex-grow flex justify-center px-2 md:px-4">
              <CollapsedSearchBar />
            </div>
          )}

          <div className="hidden lg:flex items-center space-x-4">
            {renderBecomeOwnerButton()}
            {message && <p>{message}</p>}
            {user ? (
              <div className="flex items-center space-x-4">
                <div
                  className="relative"
                  ref={notificationDropdownRef}
                >
                  <button
                    id="notification-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotificationDropdownOpen(!notificationDropdownOpen);
                    }}
                  >
                    <NotificationIcon />
                  </button>
                  <AnimatePresence>
                    {notificationDropdownOpen && <NotificationDropdown />}
                  </AnimatePresence>
                </div>
                <div className="flex items-center space-x-2 relative" ref={dropdownRef}>
                  <button
                    id="user-dropdown-button"
                    data-testid="user-dropdown-button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 hover:bg-gray-50 p-1 rounded-lg transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon size={24} className="text-gray-600" />
                    </div>
                    {user && (
                      <div className="text-left hidden md:block">
                        <p className="font-semibold text-sm text-gray-700">{user.fullName}</p>
                        <div className="flex items-center">
                          <p className="text-xs text-gray-500">{formatRole(user.activeRole || user.role[0] || '')}</p>
                          <ChevronDown size={14} className="ml-1 text-gray-400" />
                        </div>
                      </div>
                    )}
                  </button>

                  {dropdownOpen && user && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg z-[60] border border-gray-100">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            router.push(getDashboardPath(user.activeRole));
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <LayoutDashboard size={16} className="mr-2" />
                          Dashboard
                        </button>
                        {user.role && user.role.length > 1 && (
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoleSwitchOpen(!roleSwitchOpen);
                              }}
                              className="flex items-center justify-between w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                            >
                              <span className="flex items-center">
                                <Users size={16} className="mr-2" />
                                Switch Account
                              </span>
                              <ChevronDown size={14} className={`transform transition-transform ${roleSwitchOpen ? 'rotate-180 md:-rotate-90' : ''}`} />
                            </button>
                            {roleSwitchOpen && (
                              <div className="md:absolute md:right-full md:top-0 md:w-48 md:mr-1 md:bg-white md:rounded-md md:shadow-lg md:border md:border-gray-100 relative w-full bg-gray-50 rounded-md mt-1 overflow-hidden animate-in fade-in slide-in-from-top-1 md:slide-in-from-right-1">
                                <div className="py-1">
                                  {user.role.map((role) => (
                                    <button
                                      key={role}
                                      onClick={() => handleRoleSwitch(role)}
                                      className={`block w-full px-4 py-2 text-sm text-left transition-all ${
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
                        <button
                          onClick={logout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={16} className="mr-2" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-primary"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center space-x-2">
            {user && (
              <div className="relative mr-2" ref={mobileNotificationDropdownRef}>
                 <button
                    id="notification-button-mobile"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotificationDropdownOpen(!notificationDropdownOpen);
                    }}
                    className="p-2"
                  >
                    <NotificationIcon />
                  </button>
                  <AnimatePresence>
                    {notificationDropdownOpen && (
                       <NotificationDropdown />
                    )}
                  </AnimatePresence>
              </div>
            )}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
              className={`p-2 rounded-md transition-colors ${
                scrolled ? 'text-gray-900 bg-gray-100' : 'text-gray-800 bg-white/80 backdrop-blur-sm shadow-sm'
              }`}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay & Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] lg:hidden"
            />

            {/* Side Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white shadow-2xl z-[101] lg:hidden flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b">
                <Image
                  src="/logo.png"
                  alt="Gobokin Logo"
                  width={120}
                  height={32}
                  className="h-8 w-auto object-contain"
                />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto py-6 px-4">
                {user ? (
                  <div className="space-y-6">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 pb-6 border-b">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <UserCircle className="w-8 h-8 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-gray-900 truncate">
                          {user.fullName || "User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>

                    {/* Nav Links */}
                    <nav id="mobile-nav" className="space-y-2">
                      <Link
                        href={dashboardUrl}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex items-center space-x-3">
                          <LayoutDashboard className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                          <span className="font-medium text-gray-700 group-hover:text-primary">Dashboard</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </Link>

                      {user.role && user.role.length > 1 && (
                        <div className="pt-4">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                            Switch Account
                          </p>
                          <div className="grid grid-cols-1 gap-1">
                            {user.role.map((role) => (
                              <button
                                key={role}
                                onClick={() => handleRoleSwitch(role)}
                                className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                                  user.activeRole === role
                                    ? 'bg-primary/5 text-primary'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <span>{formatRole(role)}</span>
                                {user.activeRole === role && (
                                  <div className="w-2 h-2 rounded-full bg-primary" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-4 px-2">
                        {renderBecomeOwnerButton() && (
                           <div className="p-4 bg-secondary/5 rounded-2xl border border-secondary/10">
                             <div className="flex flex-col space-y-3">
                               <p className="text-sm text-gray-600 font-semibold">Have a space to share?</p>
                               <div className="[&>a]:!flex [&>a]:items-center [&>a]:justify-center [&>a]:gap-2 [&>a]:w-full [&>a]:py-3 [&>a]:!bg-secondary [&>a]:!text-white [&>a]:text-center [&>a]:rounded-xl [&>a]:font-bold [&>a]:shadow-md [&>a]:shadow-secondary/20
                                             [&>button]:!flex [&>button]:items-center [&>button]:justify-center [&>button]:gap-2 [&>button]:w-full [&>button]:py-3 [&>button]:!bg-secondary [&>button]:!text-white [&>button]:text-center [&>button]:rounded-xl [&>button]:font-bold [&>button]:shadow-md [&>button]:shadow-secondary/20">
                                 {renderBecomeOwnerButton()}
                               </div>
                             </div>
                           </div>
                        )}
                      </div>
                    </nav>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-gray-600 text-sm">Log in to book venues and manage your reservations.</p>
                    <Link
                      href="/auth/login"
                      className="block w-full py-3 text-center bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20"
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block w-full py-3 text-center border-2 border-primary text-primary font-bold rounded-xl"
                    >
                      Register
                    </Link>

                    {renderBecomeOwnerButton() && (
                      <div className="pt-4">
                        <div className="p-4 bg-secondary/5 rounded-2xl border border-secondary/10">
                          <div className="flex flex-col space-y-3">
                            <p className="text-sm text-gray-600 font-semibold">Have a space to share?</p>
                            <div className="[&>a]:!flex [&>a]:items-center [&>a]:justify-center [&>a]:gap-2 [&>a]:w-full [&>a]:py-3 [&>a]:!bg-secondary [&>a]:!text-white [&>a]:text-center [&>a]:rounded-xl [&>a]:font-bold [&>a]:shadow-md [&>a]:shadow-secondary/20">
                              {renderBecomeOwnerButton()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {user && (
                <div className="p-4 border-t mt-auto">
                  <button
                    onClick={logout}
                    className="flex items-center space-x-3 w-full p-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Account Switching Loader Overlay */}
      <AccountSwitchModal isOpen={isSwitchingAccount} />
    </header>
  );
};

export default Header;
