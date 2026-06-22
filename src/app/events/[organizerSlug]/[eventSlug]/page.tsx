"use client";
import React, { Suspense } from "react";
import EventDetailClient from "./EventDetailClient";
import CustomLoader from "@/components/CustomLoader";

const EventDetailPage = () => {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 flex items-center justify-center bg-gray-50"><CustomLoader /></div>}>
      <EventDetailClient />
    </Suspense>
  );
};

export default EventDetailPage;
