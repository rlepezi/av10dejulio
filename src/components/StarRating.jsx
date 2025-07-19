import React, { useState, useEffect } from 'react';

const StarRating = ({ 
  value = 0, 
  onChange = null, 
  readonly = false, 
  size = 'md',
  showValue = true,
  className = '',
  color = 'yellow'
}) => {
  const [hoverValue, setHoverValue] = useState(0);
  const [currentValue, setCurrentValue] = useState(value);

  // Sincronizar con el valor externo
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const colorClasses = {
    yellow: {
      filled: 'text-yellow-400',
      empty: 'text-gray-300'
    },
    blue: {
      filled: 'text-blue-400',
      empty: 'text-gray-300'
    },
    red: {
      filled: 'text-red-400',
      empty: 'text-gray-300'
    },
    green: {
      filled: 'text-green-400',
      empty: 'text-gray-300'
    }
  };

  const handleStarClick = (starValue) => {
    if (readonly) return;
    setCurrentValue(starValue);
    if (onChange) {
      onChange(starValue);
    }
  };

  const handleMouseEnter = (starValue) => {
    if (readonly) return;
    setHoverValue(starValue);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverValue(0);
  };

  const displayValue = hoverValue || currentValue || value;
  const selectedColor = colorClasses[color] || colorClasses.yellow;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${sizeClasses[size]} ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            } transition-transform duration-150 focus:outline-none`}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
            aria-label={`${star} star${star !== 1 ? 's' : ''}`}
          >
            <svg
              className={`w-full h-full fill-current transition-colors duration-150 ${
                star <= displayValue
                  ? selectedColor.filled
                  : selectedColor.empty
              }`}
              viewBox="0 0 24 24"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 ml-2 font-medium">
          {displayValue > 0 ? displayValue.toFixed(1) : '0.0'} / 5
        </span>
      )}
    </div>
  );
};

export default StarRating;
