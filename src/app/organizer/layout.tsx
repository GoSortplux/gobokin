"use client";
import React from "react";
import OrganizerSidebar from "@/components/organizer/OrganizerSidebar";
import OrganizerHeader from "@/components/organizer/OrganizerHeader";
import withAuth from "@/components/auth/withAuth";
import { UIProvider } from "@/context/UIContext";
import TourGuide from "@/components/TourGuide";

const OrganizerLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <UIProvider>
      <TourGuide />
      <div className="flex h-screen bg-gray-100">
        <OrganizerSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <OrganizerHeader />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
            {children}
          </main>
        </div>
      </div>
    </UIProvider>
  );
};

export default withAuth(OrganizerLayout, ["organizer", "organizer-staff"]);
