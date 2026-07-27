"use client";

import React from "react";
import dynamic from "next/dynamic";
import CustomLoader from "@/components/CustomLoader";

const HostEventClient = dynamic(
  () =>
    import("./HostEventClient").catch((error) => {
      console.error("Failed to load HostEventClient component, reloading...", error);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
      return { default: () => null };
    }),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-white animate-in fade-in duration-500">
        <CustomLoader />
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-4">Loading Setup Portal...</p>
      </div>
    ),
  }
);

export default function HostEventPage() {
  return <HostEventClient />;
}
