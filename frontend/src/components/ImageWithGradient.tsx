import React from 'react';

interface ImageWithGradientProps {
  src: string;
  alt: string;
  className?: string;
  gradientOpacity?: 'hover' | 'visible';
  hoverTransform?: string;
}

const ImageWithGradient: React.FC<ImageWithGradientProps> = ({
  src,
  alt,
  className = '',
  gradientOpacity = 'hover',
  hoverTransform = 'hover:-translate-y-1'
}) => {
  const gradientClass = gradientOpacity === 'hover' 
    ? 'opacity-0 hover:opacity-50 transition-opacity'
    : 'opacity-50';

  return (
    <div className="relative">
      <div className={`absolute -inset-4 bg-gradient-to-r from-green-200 to-blue-200 rounded-3xl blur-lg ${gradientClass}`}></div>
      <img
        src={src}
        alt={alt}
        className={`relative rounded-2xl shadow-xl hover:shadow-2xl transition-all ${hoverTransform} ${className}`}
        loading="lazy"
      />
    </div>
  );
};

export default ImageWithGradient;