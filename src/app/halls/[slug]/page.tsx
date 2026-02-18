import HallDetailClient from '@/components/HallDetailClient';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getHall(slug: string) {
  try {
    const res = await fetch(`https://api.gobokin.com/api/v1/halls/${slug}`, {
      cache: 'no-store'
    });

    if (!res.ok) {
      console.error(`Failed to fetch hall with slug: ${slug}, status: ${res.status}`);
      return null;
    }

    const responseData = await res.json();
    return responseData.data;
  } catch (error) {
    console.error(`Error fetching hall with slug: ${slug}`, error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const hall = await getHall(slug);

    if (!hall) {
      return {
        title: 'Venue Not Found | Gobokin',
      };
    }

    return {
      title: `${hall.name} | Gobokin`,
      description: hall.description?.substring(0, 160),
      openGraph: {
        title: hall.name,
        description: hall.description?.substring(0, 160),
        images: hall.images && hall.images.length > 0 ? [hall.images[0]] : ['/hall_default.jpg'],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: hall.name,
        description: hall.description?.substring(0, 160),
        images: hall.images && hall.images.length > 0 ? [hall.images[0]] : ['/hall_default.jpg'],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Venue | Gobokin',
    };
  }
}

export default async function HallDetailPage({ params }: Props) {
  const { slug } = await params;

  const hall = await getHall(slug);

  return <HallDetailClient slugOrId={slug} initialHall={hall} />;
}
