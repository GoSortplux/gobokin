"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BookingsView from "./BookingsView";
import SettingsView from "./SettingsView";
import EventsView from "./EventsView";
import { Building2, Ticket, Settings } from "lucide-react";

const DashboardContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("events");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["bookings", "events", "waitlists", "refunds", "settings"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/dashboard?tab=${tabId}`, { scroll: false });
  };
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <nav className="mt-16 lg:mt-20 mb-8 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex sm:inline-flex p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100 min-w-max">
            {[
              { id: "events", label: "My Events", icon: Ticket, color: "bg-emerald-600", shadow: "shadow-emerald-600/20", tourId: "customer-nav-events" },
              { id: "bookings", label: "Venue Bookings", icon: Building2, color: "bg-primary", shadow: "shadow-primary/20" },
              { id: "settings", label: "Profile Settings", icon: Settings, color: "bg-gray-800", shadow: "shadow-gray-800/20" },
            ].map((tab) => (
              <button
                key={tab.id}
                id={tab.tourId}
                className={`flex-1 sm:flex-none cursor-pointer py-2.5 px-5 sm:px-6 rounded-xl text-[13px] sm:text-sm font-bold transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? `${tab.color} text-white shadow-md ${tab.shadow}`
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => handleTabChange(tab.id)}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
        <main className="py-8">
          {activeTab === "bookings" && <BookingsView />}
          {activeTab === "events" && <EventsView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

const Dashboard = () => (
  <Suspense fallback={null}>
    <DashboardContent />
  </Suspense>
);

export default Dashboard;
