import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LazyProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export default function LazyProductImage({
  src,
  alt,
  className,
  containerClassName,
  ...props
}: LazyProductImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If the browser doesn't support IntersectionObserver, fall back to showing immediately
    if (typeof window === 'undefined' || !window.IntersectionObserver) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect(); // Disconnect once loaded
          }
        });
      },
      {
        rootMargin: '150px', // Start loading 150px before entering viewport
        threshold: 0.01,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src]);

  // Reset states when the image source changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-zinc-50 flex items-center justify-center w-full h-full select-none',
        containerClassName
      )}
    >
      {/* Skeleton Loading State */}
      {(!isLoaded || !isInView) && !hasError && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-100 flex items-center justify-center animate-pulse"
          style={{ backgroundSize: '200% 100%' }}
        >
          {/* Subtle loading icon placeholder */}
          <ImageIcon className="w-8 h-8 text-zinc-300 animate-bounce" />
        </div>
      )}

      {/* Actual Image Element loaded lazily */}
      {isInView && (
        <img
          src={src || undefined}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={cn(
            'w-full h-full object-cover transition-all duration-500',
            isLoaded ? 'opacity-100 scale-100 filter blur-0' : 'opacity-0 scale-95 filter blur-xs',
            hasError ? 'hidden' : '',
            className
          )}
          {...props}
        />
      )}

      {/* Fallback state when invalid/error image URL present */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-50 text-zinc-400 p-2 text-center">
          <ImageIcon className="w-6 h-6 mb-1 text-zinc-300" />
          <span className="text-[10px] font-medium max-w-[80%] line-clamp-1">{alt}</span>
        </div>
      )}
    </div>
  );
}
