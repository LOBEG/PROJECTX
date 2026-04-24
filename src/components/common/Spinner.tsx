import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

/**
 * A reusable spinner component for indicating loading states.
 * Renders a thick gray ring track with a blue arc indicator.
 */
const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md',
  color,
  className = '' 
}) => {
  const sizeMap = {
    sm: 24,
    md: 40,
    lg: 80,
  };
  const dim = sizeMap[size];
  const strokeWidth = size === 'sm' ? 3 : size === 'md' ? 4 : 6;
  const radius = (dim - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.3;
  const strokeColor = color === 'border-white' ? '#ffffff' : '#1a73e8';

  return (
    <svg
      width={dim}
      height={dim}
      viewBox={`0 0 ${dim} ${dim}`}
      className={`animate-spin ${className}`}
      role="status"
      aria-label="Loading..."
    >
      <circle
        cx={dim / 2}
        cy={dim / 2}
        r={radius}
        fill="none"
        stroke="#e0e0e0"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={dim / 2}
        cy={dim / 2}
        r={radius}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
      />
    </svg>
  );
};

export default Spinner;