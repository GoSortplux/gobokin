'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Slider from 'react-slick';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { isVideo, getMediaThumbnail } from '@/utils/media';

interface MediaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: string[];
  startIndex: number;
}

const MediaViewerModal = ({ isOpen, onClose, media, startIndex }: MediaViewerModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [showControls, setShowControls] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const sliderRef = useRef<Slider>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const resetIdleTimer = useCallback(() => {
    setShowControls(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (!isZoomed) {
        setShowControls(false);
      }
    }, 4000);
  }, [isZoomed]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('mousemove', resetIdleTimer);
      resetIdleTimer();
    }
    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isOpen, resetIdleTimer]);

  useEffect(() => {
    if (isOpen && sliderRef.current) {
      sliderRef.current.slickGoTo(startIndex);
      setCurrentIndex(startIndex);
    }
    setIsZoomed(false);
  }, [isOpen, startIndex]);

  // Handle video autoplay
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex && isOpen) {
          video.play().catch(() => {
            // Autoplay might be blocked if not interacted
          });
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentIndex, isOpen]);

  if (!isOpen) return null;

  const settings = {
    dots: false,
    infinite: true,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    initialSlide: startIndex,
    arrows: false,
    beforeChange: (_oldIndex: number, newIndex: number) => {
      setCurrentIndex(newIndex);
      setIsZoomed(false);
    },
  };

  const handleThumbnailClick = (index: number) => {
    sliderRef.current?.slickGoTo(index);
    setCurrentIndex(index);
  };

  const toggleZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-md transition-all duration-500 overflow-hidden"
      onMouseMove={resetIdleTimer}
      onClick={onClose}
    >
      {/* Top Header */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-[120] flex items-center justify-between p-6 bg-gradient-to-b from-black/80 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-white/90 font-medium text-lg tracking-wider flex items-center gap-2">
              <span className="text-white font-bold">{currentIndex + 1}</span>
              <span className="text-white/40">/</span>
              <span className="text-white/60 text-sm">{media.length}</span>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-all p-2 rounded-full hover:bg-white/10 group"
              aria-label="Close"
            >
              <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div
        className={`relative w-full h-full flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isZoomed ? 'scale-125 cursor-zoom-out' : 'scale-100'
        }`}
      >
        <div className="w-full max-w-[95vw] md:max-w-[85vw]" onClick={(e) => e.stopPropagation()}>
          <Slider ref={sliderRef} {...settings}>
            {media.map((url, index) => (
              <div
                key={index}
                className="flex justify-center items-center h-[75vh] md:h-[85vh] outline-none"
              >
                <div
                  className="relative w-full h-full flex items-center justify-center"
                  onClick={(e) => !isVideo(url) && toggleZoom(e)}
                >
                  {isVideo(url) ? (
                    <div className="relative w-full h-full flex items-center justify-center group" onClick={(e) => e.stopPropagation()}>
                       <video
                        ref={(el) => { videoRefs.current[index] = el; }}
                        src={url}
                        controls
                        muted
                        playsInline
                        className="max-h-full max-w-full object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                      />
                    </div>
                  ) : (
                    <div className={`relative w-full h-full transition-transform duration-500 ${isZoomed ? '' : 'cursor-zoom-in hover:scale-[1.02]'}`}>
                       <Image
                        src={url}
                        alt={`Media ${index + 1}`}
                        fill
                        className="object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                        sizes="(max-width: 768px) 100vw, 85vw"
                        priority={index === startIndex}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </Slider>
        </div>

        {/* Navigation Arrows */}
        <AnimatePresence>
          {showControls && !isZoomed && (
            <>
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={(e) => {
                  e.stopPropagation();
                  sliderRef.current?.slickPrev();
                }}
                className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-[110] text-white/50 hover:text-white bg-black/20 hover:bg-black/40 p-4 rounded-full backdrop-blur-xl transition-all border border-white/5 hover:border-white/20 group"
              >
                <ChevronLeft size={32} className="group-hover:-translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={(e) => {
                  e.stopPropagation();
                  sliderRef.current?.slickNext();
                }}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-[110] text-white/50 hover:text-white bg-black/20 hover:bg-black/40 p-4 rounded-full backdrop-blur-xl transition-all border border-white/5 hover:border-white/20 group"
              >
                <ChevronRight size={32} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Thumbnails */}
      <AnimatePresence>
        {showControls && !isZoomed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 z-[120] p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-center gap-4 overflow-x-auto no-scrollbar scroll-smooth"
            onClick={(e) => e.stopPropagation()}
          >
            {media.map((url, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`relative w-16 h-12 md:w-24 md:h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-500 border-2 shadow-xl ${
                  currentIndex === index
                    ? 'border-white scale-110 ring-4 ring-white/10'
                    : 'border-white/10 opacity-40 hover:opacity-100 hover:scale-105 hover:border-white/30'
                }`}
              >
                 {isVideo(url) ? (
                    <div className="relative w-full h-full">
                        <Image
                            src={getMediaThumbnail(url)}
                            alt={`Thumbnail ${index + 1}`}
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center">
                                <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-1" />
                            </div>
                        </div>
                    </div>
                 ) : (
                    <Image
                        src={url}
                        alt={`Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                    />
                 )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MediaViewerModal;
