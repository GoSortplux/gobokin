"use client";
import React from "react";
import Sidebar from "@/components/vendor/Sidebar";
import VendorHeader from "@/components/vendor/VendorHeader";
import withAuth from "@/components/auth/withAuth";
import { UIProvider } from "@/context/UIContext";
import { VendorProvider } from "@/context/VendorContext";
import TourGuide from "@/components/TourGuide";
import SubscriptionReminder from "@/components/vendor/SubscriptionReminder";

const VendorLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <UIProvider>
      <VendorProvider>
      <TourGuide />
      <SubscriptionReminder />
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <VendorHeader />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-4">
            {children}
          </main>
        </div>
      </div>
      </VendorProvider>
    </UIProvider>
  );
};

export default withAuth(VendorLayout, ["hall-owner", "staff"]);