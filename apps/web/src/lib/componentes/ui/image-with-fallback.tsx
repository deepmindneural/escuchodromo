'use client';

import React, { useState } from 'react';
import { FaImage } from 'react-icons/fa';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  width: number;
  height: number;
  fallbackColor?: string;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  className = '', 
  width, 
  height,
  fallbackColor = 'from-teal-100 to-cyan-100'
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gradient-to-br ${fallbackColor} ${className}`}
        style={{ width, height }}
      >
        <FaImage className="text-teal-400 text-4xl" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      onError={() => setImageError(true)}
      onLoad={() => setImageError(false)}
    />
  );
}