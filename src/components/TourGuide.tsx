'use client';

import { useEffect, useRef } from 'react';
import { driver, Driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

const TourGuide = () => {
  const { user, activeRole } = useAuth();
  const pathname = usePathname();
  const driverRef = useRef<Driver | null>(null);
  const isDestroying = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !activeRole) return;

    const isVendorPage = pathname.startsWith('/vendor');
    const isCustomerCompleted = localStorage.getItem('gobokin_customer_tour_completed');
    const isOwnerCompleted = localStorage.getItem('gobokin_owner_tour_completed');

    const checkAndStartTour = () => {
        // Wait for page to be fully loaded and all data-fetching skeletons to disappear
        const isPageReady = document.readyState === 'complete';
        // We ignore the pulse animation in the footer (Mobile App Coming Soon)
        const isDataLoaded = !document.querySelector('.animate-pulse:not(footer *)');

        if (!isPageReady || !isDataLoaded) {
            timerRef.current = setTimeout(checkAndStartTour, 500);
            return;
        }

        if (isVendorPage && activeRole === 'hall-owner' && !isOwnerCompleted) {
          const ownerSteps = [
            {
              element: '#vendor-analytics',
              popover: {
                title: 'Welcome!',
                description: 'Welcome to your Venue Owner Dashboard! Here you can see an overview of your business performance, including revenue and bookings.',
                side: "bottom",
                align: 'start'
              }
            },
            {
              element: '#vendor-nav-venues',
              popover: {
                title: 'Manage Venues',
                description: 'Manage your venues here. You can add new venues, edit existing ones, or block dates for maintenance.',
                side: "right",
                align: 'start'
              }
            },
            {
              element: '#vendor-nav-bookings',
              popover: {
                title: 'Manage Bookings',
                description: 'View and manage all your customer bookings in one place. You can also create manual walk-in bookings.',
                side: "right",
                align: 'start'
              }
            },
            {
              element: '#vendor-nav-staff',
              popover: {
                title: 'Staff Management',
                description: 'Add and manage your staff members to help you run your venues more efficiently.',
                side: "right",
                align: 'start'
              }
            },
            {
              element: '#vendor-role-switcher',
              popover: {
                title: 'Switch Account',
                description: 'Need to switch back to your customer account? Use this menu to switch roles or access your profile settings.',
                side: "bottom",
                align: 'end'
              }
            },
          ].filter(step => document.querySelector(step.element));

          if (ownerSteps.length > 0 && !driverRef.current) {
              driverRef.current = driver({
                showProgress: true,
                nextBtnText: 'Next',
                prevBtnText: 'Prev',
                doneBtnText: 'Done',
                steps: ownerSteps as DriveStep[],
                onDestroyStarted: () => {
                   if (isDestroying.current) return;
                   isDestroying.current = true;
                   localStorage.setItem('gobokin_owner_tour_completed', 'true');
                   driverRef.current?.destroy();
                   isDestroying.current = false;
                   driverRef.current = null;
                }
              });
              driverRef.current.drive();
          }
        } else if (!isVendorPage && activeRole === 'user' && !isCustomerCompleted) {
          const customerSteps = [
            {
              element: '#search-bar',
              popover: {
                title: 'Find Venues',
                description: 'Use our powerful search to find venues by location, price, date, and capacity.',
                side: "bottom",
                align: 'start'
              }
            },
            {
              element: '#become-owner-button',
              popover: {
                title: 'List Your Venue',
                description: 'Have a space to share? You can easily apply to list your venue and start earning!',
                side: "bottom",
                align: 'start'
              }
            },
            {
              element: '#notification-button, #notification-button-mobile',
              popover: {
                title: 'Notifications',
                description: 'Keep track of your booking updates and important alerts here.',
                side: "bottom",
                align: 'end'
              }
            },
            {
              element: '#user-dropdown-button, #mobile-menu-toggle',
              popover: {
                title: 'Account Menu',
                description: 'Access your personal dashboard, manage your profile, and view your bookings from this menu.',
                side: "bottom",
                align: 'end'
              }
            },
          ].filter(step => document.querySelector(step.element));

          if (customerSteps.length > 0 && !driverRef.current) {
              driverRef.current = driver({
                showProgress: true,
                nextBtnText: 'Next',
                prevBtnText: 'Prev',
                doneBtnText: 'Done',
                steps: customerSteps as DriveStep[],
                onDestroyStarted: () => {
                    if (isDestroying.current) return;
                    isDestroying.current = true;
                    localStorage.setItem('gobokin_customer_tour_completed', 'true');
                    driverRef.current?.destroy();
                    isDestroying.current = false;
                    driverRef.current = null;
                }
              });
              driverRef.current.drive();
          }
        }
    };

    const timer = setTimeout(checkAndStartTour, 500);

    return () => {
      clearTimeout(timer);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (driverRef.current) {
        isDestroying.current = true;
        driverRef.current.destroy();
        isDestroying.current = false;
        driverRef.current = null;
      }
    };
  }, [user, pathname, activeRole]);

  return null;
};

export default TourGuide;
