import React from 'react';
import { useNavigate } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true
}) => {
  const navigate = useNavigate();

  // Size classes for wide logo (2000x300px ≈ 6.7:1 aspect ratio)
  const sizeClasses = {
    sm: 'h-6 w-40',  // 24px height, ~160px width
    md: 'h-8 w-52',  // 32px height, ~208px width  
    lg: 'h-10 w-64', // 40px height, ~256px width
  };

  // const textSizeClasses = {
  //   sm: 'text-sm',
  //   md: 'text-lg',
  //   lg: 'text-xl',
  // }; // Unused since logo image contains text

  const handleClick = () => {
    navigate('/publishers');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1 ${className}`}
      aria-label="Go to home page"
    >
      {/* Logo image */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <img
          src="/logo.png"
          alt="Azure VM Marketplace Logo"
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to a simple placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        {/* Fallback icon if image fails to load */}
        <div className="hidden w-full h-full bg-blue-600 rounded-md flex items-center justify-center">
          <span className="text-white font-bold text-xs">VM</span>
        </div>
      </div>


    </button>
  );
};

export default Logo;
