import React from 'react';
import { Brain, GraduationCap, Zap, BookOpen } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon' | 'text';
  mark?: 'mortar' | 'book';
  className?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
};

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'full', 
  mark = 'mortar',
  className = '' 
}) => {
  const iconSize = sizeClasses[size];
  const textSize = textSizeClasses[size];

  const IconMark = () => (
    <div className="relative w-full h-full">
      {/* Background pill */}
      <div className="absolute inset-0 rounded-xl shadow-sm bg-gradient-to-br from-neural-500 to-secondary-500"></div>
      {/* Foreground symbol */}
      <div className="absolute inset-0 flex items-center justify-center">
        {mark === 'mortar' ? (
          <GraduationCap className="w-3/4 h-3/4 text-white" />
        ) : (
          <BookOpen className="w-3/4 h-3/4 text-white" />
        )}
      </div>
      {/* Spark node */}
      <div className="absolute -top-1 -right-1">
        <span className="inline-block w-3 h-3 rounded-full bg-accent-500 shadow" />
      </div>
    </div>
  );

  if (variant === 'icon') {
    return (
      <div className={`${iconSize} ${className}`}>
        <IconMark />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <span className={`font-bold bg-gradient-to-r from-neural-600 to-secondary-600 bg-clip-text text-transparent ${textSize}`}>
          NeuraLearn
        </span>
        <Zap className="w-4 h-4 text-accent-500" />
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Icon */}
      <div className={`${iconSize}`}>
        <IconMark />
      </div>
      
      {/* Text */}
      <div className="flex items-center space-x-2">
        <span className={`font-bold text-slate-800 ${textSize}`}>
          NeuraLearn
        </span>
      </div>
    </div>
  );
};

// Animated Logo Component
export const AnimatedLogo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'full', 
  className = '' 
}) => {
  const iconSize = sizeClasses[size];
  const textSize = textSizeClasses[size];

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Animated Icon */}
      <div className={`${iconSize} animate-pulse-slow`}>
        <div className="relative w-full h-full">
          {/* Animated Neural Network Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-neural-500 to-secondary-500 rounded-lg opacity-20 animate-pulse"></div>
          
          {/* Brain Icon with Animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="w-3/4 h-3/4 text-neural-600 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          
          {/* Graduation Cap Overlay */}
          <div className="absolute top-0 right-0">
            <GraduationCap className="w-1/3 h-1/3 text-secondary-600" />
          </div>
          
          {/* Spark/Neural Connection */}
          <div className="absolute bottom-0 left-0">
            <Zap className="w-1/4 h-1/4 text-accent-500 animate-pulse" />
          </div>
        </div>
      </div>
      
      {/* Text with Gradient Animation */}
      <div className="flex items-center space-x-2">
        <span className={`font-bold bg-gradient-to-r from-neural-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent ${textSize} animate-gradient-x`}>
          NeuraLearn
        </span>
        <Zap className="w-4 h-4 text-accent-500 animate-pulse" />
      </div>
    </div>
  );
};

// Favicon Component
export const Favicon: React.FC = () => {
  return (
    <div className="w-8 h-8">
      <div className="relative w-full h-full">
        {/* Neural Network Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-neural-500 to-secondary-500 rounded opacity-20"></div>
        
        {/* Brain Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Brain className="w-3/4 h-3/4 text-neural-600" />
        </div>
        
        {/* Graduation Cap Overlay */}
        <div className="absolute top-0 right-0">
          <GraduationCap className="w-1/3 h-1/3 text-secondary-600" />
        </div>
      </div>
    </div>
  );
};
