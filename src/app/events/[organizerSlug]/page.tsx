"use client";
import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/services/api";
import CustomLoader from "@/components/CustomLoader";

const EventIdRedirect = () => {
  const { organizerSlug } = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchEventAndRedirect = async () => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(organizerSlug)) {
        try {
          const response = await api.get(`/events/${organizerSlug}`);
          const eventData = response.data.data;
          if (eventData.organizer?.slug && eventData.slug) {
            router.replace(`/events/${eventData.organizer.slug}/${eventData.slug}`);
          }
        } catch (error) {
          console.error("Failed to fetch event for redirect:", error);
        }
      }
    };

    if (organizerSlug) {
      fetchEventAndRedirect();
    }
  }, [organizerSlug, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <CustomLoader />
    </div>
  );
};

export default EventIdRedirect;
