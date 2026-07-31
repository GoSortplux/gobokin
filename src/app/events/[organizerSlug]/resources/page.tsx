import React, { Suspense } from 'react';
import EventResourcesClient from './EventResourcesClient';
import CustomLoader from '@/components/CustomLoader';
import { Metadata } from 'next';
import { API_BASE_URL } from '@/services/api';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ organizerSlug: string }>;
}

async function getEvent(eventId: string) {
  try {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error(`Failed to fetch event with ID: ${eventId}, status: ${res.status}`);
      return null;
    }

    const responseData = await res.json();
    return responseData.data;
  } catch (error) {
    console.error(`Error fetching event with ID: ${eventId}`, error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { organizerSlug } = await params;
    const eventId = organizerSlug;
    const event = await getEvent(eventId);

    if (!event) {
      return {
        title: 'Event Resources | Gobokin',
      };
    }

    const title = `Event Resources - ${event.title} | Gobokin`;
    const description = `Shared materials and resources for ${event.title} on Gobokin.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Event Resources | Gobokin',
    };
  }
}

const EventResourcesPage = async () => {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 flex items-center justify-center bg-gray-50/50"><CustomLoader /></div>}>
      <EventResourcesClient />
    </Suspense>
  );
};

export default EventResourcesPage;
