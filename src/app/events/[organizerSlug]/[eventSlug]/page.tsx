import React, { Suspense } from "react";
import EventDetailClient from "./EventDetailClient";
import CustomLoader from "@/components/CustomLoader";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ organizerSlug: string; eventSlug: string }>;
}

async function getEvent(organizerSlug: string, eventSlug: string) {
  try {
    const res = await fetch(`https://api.gobokin.com/api/v1/events/e/${organizerSlug}/${eventSlug}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error(`Failed to fetch event with slug: ${eventSlug}, status: ${res.status}`);
      return null;
    }

    const responseData = await res.json();
    return responseData.data;
  } catch (error) {
    console.error(`Error fetching event with slug: ${eventSlug}`, error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { organizerSlug, eventSlug } = await params;
    const event = await getEvent(organizerSlug, eventSlug);

    if (!event) {
      return {
        title: 'Event Not Found | Gobokin',
      };
    }

    const title = `${event.title} | Gobokin`;
    const description = event.description?.replace(/<[^>]*>/g, '').substring(0, 160);
    const imageUrl = event.bannerUrl || (event.mediaUrls && event.mediaUrls.length > 0 ? event.mediaUrls[0] : '/event_default.jpg');

    return {
      title,
      description,
      openGraph: {
        title: event.title,
        description,
        images: [imageUrl],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: event.title,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Event | Gobokin',
    };
  }
}

const EventDetailPage = async () => {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 flex items-center justify-center bg-gray-50"><CustomLoader /></div>}>
      <EventDetailClient />
    </Suspense>
  );
};

export default EventDetailPage;
