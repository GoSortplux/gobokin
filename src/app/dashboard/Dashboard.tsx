"use client";
import React, { useState } from "react";
import BookingsView from "./BookingsView";
import SettingsView from "./SettingsView";
import ReservationsList from "@/components/ReservationsList";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("bookings");

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-12">
        <nav className="mt-16 lg:mt-20 mb-8 overflow-x-auto no-scrollbar">
          <div className="inline-flex p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100">
            {[
              { id: "bookings", label: "My Bookings" },
              { id: "reservations", label: "My Reservations" },
              { id: "settings", label: "Profile Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`cursor-pointer py-2.5 px-6 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>
        <main className="py-8">
          {activeTab === "bookings" && <BookingsView />}
          {activeTab === "reservations" && <ReservationsList />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
