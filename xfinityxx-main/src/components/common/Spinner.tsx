import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

/**
 * A reusable spinner component for indicating loading states.
 */
const Spinner: React.FC<SpinnerProps> = ({ 
  size = 'md',
  color = 'border-blue-600', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={`animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${color} ${className}`}
      role="status"
      aria-label="Loading..."
    />
  );
};

export default Spinner;