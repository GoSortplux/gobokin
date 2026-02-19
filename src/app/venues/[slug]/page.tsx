import VenueDetailClient from '@/components/VenueDetailClient';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getVenue(slug: string) {
  try {
    const res = await fetch(`https://api.gobokin.com/api/v1/halls/${slug}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error(`Failed to fetch venue with slug: ${slug}, status: ${res.status}`);
      return null;
    }

    const responseData = await res.json();
    return responseData.data;
  } catch (error) {
    console.error(`Error fetching venue with slug: ${slug}`, error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const venue = await getVenue(slug);

    if (!venue) {
      return {
        title: 'Venue Not Found | Gobokin',
      };
    }

    return {
      title: `${venue.name} | Gobokin`,
      description: venue.description?.substring(0, 160),
      openGraph: {
        title: venue.name,
        description: venue.description?.substring(0, 160),
        images: venue.images && venue.images.length > 0 ? [venue.images[0]] : ['/venue_default.jpg'],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: venue.name,
        description: venue.description?.substring(0, 160),
        images: venue.images && venue.images.length > 0 ? [venue.images[0]] : ['/venue_default.jpg'],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Venue | Gobokin',
    };
  }
}

export default async function VenueDetailPage({ params }: Props) {
  const { slug } = await params;

  const venue = await getVenue(slug);

  return <VenueDetailClient slugOrId={slug} initialVenue={venue} />;
}
