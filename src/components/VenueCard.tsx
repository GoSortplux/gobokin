'use client';
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Star, Eye } from "lucide-react";
import Slider from "react-slick";

import { Venue } from "@/types/venue";
import { useAuth } from "@/context/AuthContext";
import { createVenueSlug } from "@/utils/slugify";
import MediaThumbnail from "@/components/MediaThumbnail";

interface VenueCardProps {
  venue: Venue;
  variant?: 'default' | 'featured';
}

const VenueCard = ({ venue, variant = 'default' }: VenueCardProps) => {
  const { user } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const canSeeViews = useMemo(() => {
    if (!user) return false;
    if (user.activeRole === 'super-admin') return true;

    const venueOwnerId = typeof venue.owner === 'object' ? venue.owner?._id : venue.owner;
    const userId = user._id || user.id;

    if (user.activeRole === 'hall-owner') {
      return venueOwnerId === userId;
    }

    if (user.activeRole === 'staff') {
      const assignedHalls = (user.assignedHalls || user.hallIds || []) as (string | { _id: string })[];
      return assignedHalls.some((h) => {
        const hId = typeof h === 'object' ? h._id : h;
        return hId === venue._id || hId === venue.id;
      });
    }

    return false;
  }, [user, venue]);

  const { dailyRate, hourlyRate } = venue.pricing || {};

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    autoplay: isHovered,
    autoplaySpeed: 2000,
    pauseOnHover: false,
    lazyLoad: 'ondemand' as const,
  };

  const isFeatured = variant === 'featured';

  const media = useMemo(() => {
    return [...(venue.videos || []), ...(venue.images || [])];
  }, [venue.videos, venue.images]);

  return (
    <div className="h-full">
      <div
        data-testid="venue-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`h-full block bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-[1.02] transition-all duration-300 ${
          isFeatured ? 'border-2 border-primary/10' : ''
        }`}
      >
        <div className="relative venue-card-slider">
          {media && media.length > 1 && isHovered ? (
            <Slider {...settings} className="hall-card-slick">
              {media.map((item, index) => (
                <Link href={`/venues/${createVenueSlug(venue.name, venue._id, venue.slug)}`} key={index}>
                  <div className={`relative w-full ${isFeatured ? 'h-64 md:h-80' : 'h-48'}`}>
                    <MediaThumbnail
                      url={item}
                      alt={`${venue.name} media ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes={isFeatured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                      priority={isFeatured && index === 0}
                      showPlayIcon={true}
                      playIconSize="md"
                    />
                  </div>
                </Link>
              ))}
            </Slider>
          ) : (
            <Link href={`/venues/${createVenueSlug(venue.name, venue._id, venue.slug)}`}>
              <div className={`relative w-full ${isFeatured ? 'h-64 md:h-80' : 'h-48'}`}>
                <MediaThumbnail
                  url={media && media.length > 0 ? media[0] : undefined}
                  alt={venue.name}
                  fill
                  className="object-cover"
                  sizes={isFeatured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                  priority={isFeatured}
                  showPlayIcon={true}
                  playIconSize={isFeatured ? 'lg' : 'md'}
                />
              </div>
            </Link>
          )}
          {isFeatured && (
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold shadow-md uppercase tracking-wider">
                Featured
              </span>
            </div>
          )}
        </div>
        <Link href={`/venues/${createVenueSlug(venue.name, venue._id, venue.slug)}`} className="h-full">
          <div className={isFeatured ? 'p-5' : 'p-3'}>
            <h3 className={`${isFeatured ? 'text-lg md:text-xl' : 'text-sm'} font-bold text-gray-800 truncate`}>
              {venue.name}
            </h3>
            <p className={`mt-1 ${isFeatured ? 'text-sm' : 'text-xs'} text-gray-500 truncate`}>
              {venue.location}
            </p>
            <div className="mt-4 flex justify-between items-end">
              <div className={`${isFeatured ? 'text-sm md:text-base' : 'text-xs'} font-semibold text-gray-800 min-h-[2.5em] flex items-center`}>
                {dailyRate && (hourlyRate && hourlyRate > 0) ? (
                  <div>
                    <p>
                      <span className={`font-bold ${isFeatured ? 'text-lg md:text-xl' : 'text-sm'}`}>₦{dailyRate.toLocaleString()}</span>/day
                    </p>
                    <p>
                      <span className="font-bold">₦{hourlyRate.toLocaleString()}</span>/hr
                    </p>
                  </div>
                ) : dailyRate ? (
                  <p>
                    <span className={`font-bold ${isFeatured ? 'text-lg md:text-xl' : 'text-sm'}`}>₦{dailyRate.toLocaleString()}</span> / day
                  </p>
                ) : (hourlyRate && hourlyRate > 0) ? (
                  <p>
                    <span className={`font-bold ${isFeatured ? 'text-lg md:text-xl' : 'text-sm'}`}>₦{hourlyRate.toLocaleString()}</span> / hour
                  </p>
                ) : (
                  <span className="text-gray-500">Price not available</span>
                )}
              </div>
              <div className={`flex flex-col items-end ${isFeatured ? 'text-xs md:text-sm' : 'text-[11px]'} space-y-1 pb-0.5`}>
                <div className="flex items-center">
                  <Star className={`${isFeatured ? 'h-4 w-4 md:h-5 md:w-5' : 'h-3.5 w-3.5'} text-gray-400 fill-gray-400`} />
                  {venue.averageRating > 0 ? (
                    <span className="ml-1 text-gray-600 font-bold">
                      {venue.averageRating.toFixed(1)}
                    </span>
                  ) : (
                    <span className="ml-1 text-gray-400">New</span>
                  )}
                </div>
                {canSeeViews && (
                  <div className="flex items-center text-gray-500">
                    <Eye className={`${isFeatured ? 'h-4 w-4' : 'h-3 w-3'} mr-1`} />
                    <span>{venue.views || 0}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default React.memo(VenueCard);
