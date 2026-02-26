'use client';
import React, { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, Eye } from "lucide-react";
import Slider from "react-slick";

import { Venue } from "@/types/venue";
import { useAuth } from "@/context/AuthContext";
import { createVenueSlug } from "@/utils/slugify";

interface VenueCardProps {
  venue: Venue;
}

const VenueCard = ({ venue }: VenueCardProps) => {
  const { user } = useAuth();

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
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <div className="h-full">
      <div data-testid="venue-card" className="h-full block bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
        <div className="relative venue-card-slider">
          {venue.images && venue.images.length > 1 ? (
            <Slider {...settings} className="hall-card-slick">
              {venue.images.map((image, index) => (
                <Link href={`/venues/${createVenueSlug(venue.name, venue._id, venue.slug)}`} key={index}>
                  <div className="relative h-48 w-full">
                    <Image
                      fill
                      className="object-cover"
                      src={image}
                      alt={`${venue.name} image ${index + 1}`}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                </Link>
              ))}
            </Slider>
          ) : (
            <Link href={`/venues/${createVenueSlug(venue.name, venue._id, venue.slug)}`}>
              <div className="relative h-48 w-full">
                <Image
                  fill
                  className="object-cover"
                  src={venue.images && venue.images.length > 0 ? venue.images[0] : "/venue_default.jpg"}
                  alt={venue.name}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </Link>
          )}
        </div>
        <Link href={`/venues/${createVenueSlug(venue.name, venue._id, venue.slug)}`} className="h-full">
          <div className="p-3">
            <h3 className="text-sm font-bold text-gray-800 truncate">{venue.name}</h3>
          <p className="mt-0.5 text-xs text-gray-500 truncate">{venue.location}</p>
          <div className="mt-2 flex justify-between items-end">
            <div className="text-xs font-semibold text-gray-800 min-h-[2.5em] flex items-center">
              {dailyRate && hourlyRate ? (
                <div>
                  <p>
                    <span className="font-bold text-sm">₦{dailyRate.toLocaleString()}</span>/day
                  </p>
                  <p>
                    <span className="font-bold">₦{hourlyRate.toLocaleString()}</span>/hr
                  </p>
                </div>
              ) : dailyRate ? (
                <p>
                  <span className="font-bold text-sm">₦{dailyRate.toLocaleString()}</span> / day
                </p>
              ) : hourlyRate ? (
                <p>
                  <span className="font-bold text-sm">₦{hourlyRate.toLocaleString()}</span> / hour
                </p>
              ) : (
                <span className="text-gray-500">Price not available</span>
              )}
            </div>
            <div className="flex flex-col items-end text-[11px] space-y-1 pb-0.5">
              <div className="flex items-center">
                <Star className="h-3.5 w-3.5 text-gray-400 fill-gray-400" />
                {venue.averageRating > 0 ? (
                  <span className="ml-1 text-gray-400 font-semibold">
                    {venue.averageRating.toFixed(1)}
                  </span>
                ) : (
                  <span className="ml-1 text-gray-400">New</span>
                )}
              </div>
              {canSeeViews && (
                <div className="flex items-center text-gray-500">
                  <Eye className="h-3 w-3 mr-1" />
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

export default VenueCard;
