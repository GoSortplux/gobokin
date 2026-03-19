'use client';
import React, { useRef, useState, useEffect } from 'react';
import Slider from 'react-slick';
import VenueCard from './VenueCard';
import NextArrow from './NextArrow';
import PrevArrow from './PrevArrow';
import { Venue } from '@/types/venue';

interface CarouselProps {
  venues: Venue[];
  slidesToShow?: number;
  variant?: 'default' | 'featured';
}

const Carousel = ({
  venues,
  slidesToShow: propSlidesToShow = 7,
  variant = 'default',
}: CarouselProps) => {
  const sliderRef = useRef<Slider>(null);
  const [currentSlidesToShow, setCurrentSlidesToShow] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setCurrentSlidesToShow(Math.min(venues.length, 2));
      } else if (width < 1024) {
        setCurrentSlidesToShow(Math.min(venues.length, Math.min(propSlidesToShow, 4)));
      } else {
        setCurrentSlidesToShow(Math.min(venues.length, propSlidesToShow));
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [propSlidesToShow, venues.length]);

  const settings = {
    dots: false,
    speed: 500,
    slidesToScroll: 1,
    arrows: false,
    draggable: true,
    swipeToSlide: true,
    slidesToShow: Math.min(venues.length, currentSlidesToShow || propSlidesToShow),
    infinite: venues.length > (currentSlidesToShow || propSlidesToShow),
    lazyLoad: 'ondemand' as const,
  };

  const goToNext = () => {
    sliderRef.current?.slickNext();
  };

  const goToPrev = () => {
    sliderRef.current?.slickPrev();
  };

  if (venues.length === 0) return null;

  return (
    <div className="relative group mt-12 md:mt-0" data-testid="carousel-container">
      {/* Arrows: Controlled by CSS visibility and length-based logic */}
      <div className="absolute -top-14 md:-top-12 right-0 space-x-3 z-10 flex">
        {/* Desktop Arrows: show only if length > propSlidesToShow on large screens */}
        <div className={venues.length > propSlidesToShow ? 'hidden lg:flex space-x-2' : 'hidden'}>
           <PrevArrow onClick={goToPrev} />
           <NextArrow onClick={goToNext} />
        </div>
        {/* Tablet/Large Mobile Arrows: show if length > 4 on medium screens */}
        <div className={venues.length > 4 ? 'hidden md:flex lg:hidden space-x-3' : 'hidden'}>
           <PrevArrow onClick={goToPrev} />
           <NextArrow onClick={goToNext} />
        </div>
        {/* Mobile Arrows: show if length > 2 on small screens */}
        <div className={venues.length > 2 ? 'flex md:hidden space-x-3' : 'hidden'}>
           <PrevArrow onClick={goToPrev} />
           <NextArrow onClick={goToNext} />
        </div>
      </div>

      <div className="mx-[-8px]">
        {!currentSlidesToShow ? (
          /* SSR & Initial Client Fallback: Flex container that expands items to fill available space */
          <div className="flex flex-wrap gap-4 px-2">
            {venues.slice(0, propSlidesToShow).map((venue) => (
              <div
                key={venue._id}
                className="flex-1 min-w-[150px]"
                style={{
                  flexBasis: `calc((100% - ${(propSlidesToShow - 1) * 16}px) / ${propSlidesToShow})`
                }}
              >
                <VenueCard venue={venue} variant={variant} />
              </div>
            ))}
          </div>
        ) : (
          /* Client-side: React Slick Slider - key depends on slidesToShow to force recalculation */
          <Slider key={`${venues.length}-${currentSlidesToShow}-${variant}`} ref={sliderRef} {...settings}>
            {venues.map((venue) => (
              <div key={venue._id} className="px-2 pb-4">
                <VenueCard venue={venue} variant={variant} />
              </div>
            ))}
          </Slider>
        )}
      </div>
    </div>
  );
};

export default React.memo(Carousel);
