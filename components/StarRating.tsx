import React, { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  totalStars?: number;
  className?: string;
}

const Star: React.FC<{ 
    filled: boolean; 
    onMouseEnter?: () => void; 
    onClick?: () => void; 
    sizeClass: string;
    isInteractive: boolean;
}> = ({ filled, onMouseEnter, onClick, sizeClass, isInteractive }) => (
  <svg
    onMouseEnter={onMouseEnter}
    onClick={onClick}
    className={`${isInteractive ? 'cursor-pointer' : 'cursor-default'} transition-colors duration-200 ${filled ? 'text-amber-400' : 'text-slate-600'} ${isInteractive && !filled ? 'hover:text-amber-300' : ''} ${sizeClass}`}
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  size = 'md',
  disabled = false,
  totalStars = 5,
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const handleRatingClick = (newRating: number) => {
    if (!disabled && onRatingChange) {
      // Allow un-rating by clicking the same star again
      onRatingChange(newRating === rating ? 0 : newRating);
    }
  };

  return (
    <div 
        className={`flex items-center ${className}`}
        onMouseLeave={!disabled ? () => setHoverRating(0) : undefined}
    >
      {[...Array(totalStars)].map((_, index) => {
        const starRating = index + 1;
        
        let isFilled;
        if (disabled) {
            // For disabled (display only) mode, show partial stars
            isFilled = starRating - 0.5 < rating;
        } else {
            isFilled = starRating <= (hoverRating || rating);
        }

        return (
          <Star
            key={index}
            filled={isFilled}
            sizeClass={sizeClasses[size]}
            isInteractive={!disabled}
            onMouseEnter={!disabled ? () => setHoverRating(starRating) : undefined}
            onClick={() => handleRatingClick(starRating)}
          />
        );
      })}
    </div>
  );
};
