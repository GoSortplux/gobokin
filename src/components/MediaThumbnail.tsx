import React, { useState } from 'react';
import Image from 'next/image';
import { isVideo, getMediaThumbnail } from '@/utils/media';

interface MediaThumbnailProps {
  url: string | undefined | null;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  showPlayIcon?: boolean;
  playIconSize?: 'sm' | 'md' | 'lg';
}

const MediaThumbnail: React.FC<MediaThumbnailProps> = ({
  url,
  alt,
  fill = true,
  className = "object-cover",
  sizes,
  priority = false,
  showPlayIcon = false,
  playIconSize = 'md'
}) => {
  const [error, setError] = useState(false);
  const isVid = isVideo(url);
  const thumb = getMediaThumbnail(url);

  const renderPlayIcon = () => {
    if (!isVid || !showPlayIcon) return null;

    const sizesMap = {
      sm: { container: 'p-1.5', icon: 'border-t-[4px] border-l-[7px] border-b-[4px] ml-0.5' },
      md: { container: 'p-2.5', icon: 'border-t-[6px] border-l-[10px] border-b-[6px] ml-1' },
      lg: { container: 'p-4', icon: 'border-t-[10px] border-l-[16px] border-b-[10px] ml-1.5' }
    };

    const { container, icon } = sizesMap[playIconSize];

    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none z-10">
        <div className={`bg-white/20 backdrop-blur-sm border border-white/30 rounded-full ${container}`}>
          <div className={`w-0 h-0 border-t-transparent border-l-white border-b-transparent ${icon}`} />
        </div>
      </div>
    );
  };

  // If it's a video and the "thumbnail" returned is just the video URL itself
  // (meaning it's not a Cloudinary-style auto-generated jpg),
  // we use a video tag to show the first frame.
  if (isVid && thumb === url) {
    return (
      <div className="relative w-full h-full overflow-hidden">
        <video
          src={url}
          className={`${className} w-full h-full`}
          preload="metadata"
          muted
          playsInline
        />
        {renderPlayIcon()}
      </div>
    );
  }

  // Otherwise, use the Next.js Image component
  return (
    <div className="relative w-full h-full overflow-hidden">
      <Image
        src={error || !thumb ? '/venue_default.jpg' : thumb}
        alt={alt}
        fill={fill}
        className={className}
        sizes={sizes}
        priority={priority}
        unoptimized={isVid} // Don't try to optimize if it's somehow still a video URL
        onError={() => setError(true)}
      />
      {renderPlayIcon()}
    </div>
  );
};

export default MediaThumbnail;
