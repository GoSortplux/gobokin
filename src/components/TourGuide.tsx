'use client';

import { useEffect, useRef } from 'react';
import { driver, Driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

const TourGuide = () => {
  const { user, activeRole } = useAuth();
  const pathname = usePathname();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const activeTab = searchParams?.get('tab');
  const driverRef = useRef<Driver | null>(null);
  const isDestroying = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !activeRole) return;

    const isVendorPage = pathname.startsWith('/vendor');
    const isDashboardPage = pathname === '/dashboard';
    const isEventsDiscoveryPage = pathname === '/events';
    const isHostEventPage = pathname === '/host-event';
    const isEventCreationPage = isHostEventPage || pathname === '/organizer/dashboard/events/create';

    const isCustomerCompleted = localStorage.getItem('gobokin_customer_tour_completed');
    const isOwnerCompleted = localStorage.getItem('gobokin_owner_tour_completed');
    const isEventDiscoveryCompleted = localStorage.getItem('gobokin_event_discovery_tour_completed');
    const isCustomerEventsCompleted = localStorage.getItem('gobokin_customer_events_tour_completed');
    const isOrganizerDashboardCompleted = localStorage.getItem('gobokin_organizer_dashboard_tour_completed');
    const isOrganizerEventsCompleted = localStorage.getItem('gobokin_organizer_events_tour_completed');
    const isEventCreationCompleted = localStorage.getItem('gobokin_event_creation_tour_completed');

    const startTour = (steps: DriveStep[], storageKey: string) => {
        if (steps.length > 0 && !driverRef.current) {
            driverRef.current = driver({
              showProgress: true,
              nextBtnText: 'Next',
              prevBtnText: 'Prev',
              doneBtnText: 'Done',
              steps,
              onDestroyStarted: () => {
                 if (isDestroying.current) return;
                 isDestroying.current = true;
                 localStorage.setItem(storageKey, 'true');
                 driverRef.current?.destroy();
                 isDestroying.current = false;
                 driverRef.current = null;
              }
            });
            driverRef.current.drive();
        }
    };

    const checkAndStartTour = () => {
        // Wait for page to be fully loaded and all data-fetching skeletons to disappear
        const isPageReady = document.readyState === 'complete';
        // We ignore the pulse animation in the footer (Mobile App Coming Soon)
        const isDataLoaded = !document.querySelector('.animate-pulse:not(footer *)');

        if (!isPageReady || !isDataLoaded) {
            timerRef.current = setTimeout(checkAndStartTour, 500);
            return;
        }

        // 1. Venue Owner Tour
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
          startTour(ownerSteps as DriveStep[], 'gobokin_owner_tour_completed');
        }

        // 2. Customer Landing Page Tour
        else if (pathname === '/' && activeRole === 'user' && !isCustomerCompleted) {
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
          startTour(customerSteps as DriveStep[], 'gobokin_customer_tour_completed');
        }

        // 3. Event Discovery Tour
        else if (isEventsDiscoveryPage && !isEventDiscoveryCompleted) {
          const discoverySteps = [
            {
              element: '#discovery-host-event',
              popover: {
                title: 'Host Your Own Event',
                description: 'Ready to organize your own experience? Start here to create and list your event.',
                side: "bottom",
                align: 'start'
              }
            },
            {
              element: '#discovery-browse-list',
              popover: {
                title: 'Browse Events',
                description: 'Scroll down to explore all available events or use the button to jump straight to the listings.',
                side: "bottom",
                align: 'start'
              }
            },
            {
              element: '#discovery-categories',
              popover: {
                title: 'Categories',
                description: 'Filter events by category to find exactly what you are looking for.',
                side: "right",
                align: 'start'
              }
            },
            {
              element: '#discovery-view-toggle',
              popover: {
                title: 'Change View',
                description: 'Switch between grid and map views to discover events in your preferred way.',
                side: "right",
                align: 'start'
              }
            },
            {
              element: '#discovery-featured',
              popover: {
                title: 'Featured Experiences',
                description: 'Don\'t miss out on these hand-picked, top-tier events.',
                side: "top",
                align: 'start'
              }
            },
            {
              element: '#discovery-bookmarks',
              popover: {
                title: 'Your Bookmarks',
                description: 'Quickly access events you\'ve saved for later.',
                side: "top",
                align: 'start'
              }
            },
          ].filter(step => document.querySelector(step.element));
          startTour(discoverySteps as DriveStep[], 'gobokin_event_discovery_tour_completed');
        }

        // 4. Customer Dashboard - My Events Tab Tour
        else if (isDashboardPage && !isCustomerEventsCompleted && document.querySelector('#customer-events-tabs')) {
          const customerEventsSteps = [
            {
              element: '#customer-events-tabs',
              popover: {
                title: 'My Events',
                description: 'Welcome to your events hub! Here you can manage your tickets, waitlists, and refunds.',
                side: "bottom",
                align: 'start'
              }
            },
            {
              element: '#customer-events-tickets',
              popover: {
                title: 'Tickets',
                description: 'View all your active event tickets and their details.',
                side: "bottom",
                align: 'start'
              }
            },
            {
              element: '#customer-events-waitlists',
              popover: {
                title: 'Waitlists',
                description: 'Keep track of events you are waiting for an opening.',
                side: "bottom",
                align: 'start'
              }
            },
            {
              element: '#customer-events-refunds',
              popover: {
                title: 'Refunds',
                description: 'Monitor the status of your refund requests here.',
                side: "bottom",
                align: 'start'
              }
            },
          ].filter(step => document.querySelector(step.element));
          startTour(customerEventsSteps as DriveStep[], 'gobokin_customer_events_tour_completed');
        }

        // 5. Organizer Dashboard Tour
        else if (pathname === '/organizer/dashboard' && !isOrganizerDashboardCompleted) {
          const isStaff = user?.role?.includes('organizer-staff');
          const organizerDashboardSteps = [
            {
              element: '#organizer-dashboard-header',
              popover: {
                title: 'Organizer Dashboard',
                description: 'Overview of your event performance and quick actions.',
                side: "bottom",
                align: 'start'
              }
            },
            {
              element: '#organizer-stats-grid',
              popover: {
                title: 'Key Metrics',
                description: 'Track your revenue, registrations, and conversion rates at a glance.',
                side: "bottom",
                align: 'start'
              }
            },
            {
              element: '#organizer-revenue-trends',
              popover: {
                title: 'Revenue Trends',
                description: 'Analyze your daily revenue performance over the last 7 days.',
                side: "bottom",
                align: 'start'
              }
            },
            {
              element: '#organizer-event-distribution',
              popover: {
                title: 'Event Status',
                description: 'Quick breakdown of your events by their current status.',
                side: "bottom",
                align: 'start'
              }
            },
            {
              element: '#organizer-top-events',
              popover: {
                title: 'Top Performing Events',
                description: 'Deep dive into how your individual events are performing.',
                side: "top",
                align: 'start'
              }
            },
            {
              element: '#organizer-nav-events',
              popover: {
                title: 'Manage Events',
                description: 'View and manage all your events, check-ins, and walk-in registrations.',
                side: "right",
                align: 'start'
              }
            },
            {
              element: '#organizer-nav-orders',
              popover: {
                title: 'Orders & Registrations',
                description: 'Access a complete list of all ticket orders and attendee data.',
                side: "right",
                align: 'start'
              }
            },
            {
              element: '#organizer-nav-finance',
              popover: {
                title: 'Financial Overview',
                description: 'Manage your wallet, withdrawals, and transaction history.',
                side: "right",
                align: 'start'
              }
            },
          ].filter(step => {
              const el = document.querySelector(step.element);
              if (!el) return false;
              // Filter out steps staff shouldn't see
              if (isStaff && (step.element === '#organizer-stats-grid' || step.element === '#organizer-revenue-trends' || step.element === '#organizer-nav-finance')) return false;
              return true;
          });
          startTour(organizerDashboardSteps as DriveStep[], 'gobokin_organizer_dashboard_tour_completed');
        }

        // 6. Organizer My Events Tour
        else if (pathname === '/organizer/dashboard/events' && !isOrganizerEventsCompleted) {
          const organizerEventsSteps = [
            {
              element: '#organizer-events-toolbar',
              popover: {
                title: 'Event Tools',
                description: 'Search your events, filter by status, and switch between grid and list views.',
                side: "bottom",
                align: 'start'
              }
            },
            {
              element: '#organizer-events-grid',
              popover: {
                title: 'Your Events',
                description: 'Monitor impressions, clicks, and registrations for each event. Access management tools or check-in portals directly.',
                side: "top",
                align: 'start'
              }
            },
          ].filter(step => document.querySelector(step.element));
          startTour(organizerEventsSteps as DriveStep[], 'gobokin_organizer_events_tour_completed');
        }

        // 7. Event Creation Tour
        else if (isEventCreationPage && !isEventCreationCompleted) {
          const creationSteps = [
            {
              element: '#event-creation-steps',
              popover: {
                title: 'Creation Journey',
                description: 'Follow these steps to set up your event. You can move between steps as you complete them.',
                side: "bottom",
                align: 'start'
              }
            },
            {
              element: '#event-creation-form',
              popover: {
                title: 'Event Details',
                description: 'Fill in the information for your event here. Most progress is saved automatically.',
                side: "right",
                align: 'start'
              }
            },
            {
              element: '#event-creation-preview',
              popover: {
                title: 'Live Preview',
                description: 'See how your event page will look to attendees in real-time as you type.',
                side: "left",
                align: 'start'
              }
            },
          ].filter(step => document.querySelector(step.element));
          startTour(creationSteps as DriveStep[], 'gobokin_event_creation_tour_completed');
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
  }, [user, pathname, activeRole, activeTab]);

  return null;
};

export default TourGuide;
