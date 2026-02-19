'use client';
import { useRef, useState, useEffect } from 'react';
import Slider from 'react-slick';
import VenueCard from './VenueCard';
import NextArrow from './NextArrow';
import PrevArrow from './PrevArrow';
import { Venue } from '@/types/venue';

interface CarouselProps {
  venues: Venue[];
  slidesToShow?: number;
}

const Carousel = ({
  venues,
  slidesToShow: propSlidesToShow = 7,
}: CarouselProps) => {
  const sliderRef = useRef<Slider>(null);
  const [currentSlidesToShow, setCurrentSlidesToShow] = useState<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setCurrentSlidesToShow(2);
      } else if (width < 1024) {
        setCurrentSlidesToShow(4);
      } else {
        setCurrentSlidesToShow(propSlidesToShow);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [propSlidesToShow]);

  const settings = {
    dots: false,
    speed: 500,
    slidesToScroll: 1,
    arrows: false,
    draggable: true,
    swipeToSlide: true,
    slidesToShow: Math.min(venues.length, currentSlidesToShow || propSlidesToShow),
    infinite: venues.length > (currentSlidesToShow || propSlidesToShow),
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
            {venues.slice(0, 7).map((venue) => (
              <div
                key={venue._id}
                className="flex-1 basis-[calc(50%-8px)] md:basis-[calc(25%-12px)] lg:basis-[calc((100%-96px)/7)]"
              >
                <VenueCard venue={venue} />
              </div>
            ))}
          </div>
        ) : (
          /* Client-side: React Slick Slider - key depends on slidesToShow to force recalculation */
          <Slider key={`${venues.length}-${currentSlidesToShow}`} ref={sliderRef} {...settings}>
            {venues.map((venue) => (
              <div key={venue._id} className="px-2 pb-4">
                <VenueCard venue={venue} />
              </div>
            ))}
          </Slider>
        )}
      </div>
    </div>
  );
};

export default Carousel;
