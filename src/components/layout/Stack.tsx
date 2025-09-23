import React from 'react';
import { cn } from '../../utils';

interface StackProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'vertical' | 'horizontal';
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  responsive?: {
    sm?: Partial<Pick<StackProps, 'direction' | 'spacing' | 'align' | 'justify'>>;
    md?: Partial<Pick<StackProps, 'direction' | 'spacing' | 'align' | 'justify'>>;
    lg?: Partial<Pick<StackProps, 'direction' | 'spacing' | 'align' | 'justify'>>;
  };
}

/**
 * Responsive stack component for flexible layouts
 */
export const Stack: React.FC<StackProps> = ({
  children,
  className = '',
  direction = 'vertical',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  responsive
}) => {
  const directionClasses = {
    vertical: 'flex-col',
    horizontal: 'flex-row'
  };

  const spacingClasses = {
    vertical: {
      xs: 'space-y-1',
      sm: 'space-y-2',
      md: 'space-y-4',
      lg: 'space-y-6',
      xl: 'space-y-8'
    },
    horizontal: {
      xs: 'space-x-1',
      sm: 'space-x-2',
      md: 'space-x-4',
      lg: 'space-x-6',
      xl: 'space-x-8'
    }
  };

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch'
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly'
  };

  // Generate responsive classes
  const getResponsiveClasses = () => {
    const classes = [];
    
    if (responsive?.sm) {
      if (responsive.sm.direction) classes.push(`sm:${directionClasses[responsive.sm.direction]}`);
      if (responsive.sm.spacing) classes.push(`sm:${spacingClasses[responsive.sm.direction || direction][responsive.sm.spacing]}`);
      if (responsive.sm.align) classes.push(`sm:${alignClasses[responsive.sm.align]}`);
      if (responsive.sm.justify) classes.push(`sm:${justifyClasses[responsive.sm.justify]}`);
    }
    
    if (responsive?.md) {
      if (responsive.md.direction) classes.push(`md:${directionClasses[responsive.md.direction]}`);
      if (responsive.md.spacing) classes.push(`md:${spacingClasses[responsive.md.direction || direction][responsive.md.spacing]}`);
      if (responsive.md.align) classes.push(`md:${alignClasses[responsive.md.align]}`);
      if (responsive.md.justify) classes.push(`md:${justifyClasses[responsive.md.justify]}`);
    }
    
    if (responsive?.lg) {
      if (responsive.lg.direction) classes.push(`lg:${directionClasses[responsive.lg.direction]}`);
      if (responsive.lg.spacing) classes.push(`lg:${spacingClasses[responsive.lg.direction || direction][responsive.lg.spacing]}`);
      if (responsive.lg.align) classes.push(`lg:${alignClasses[responsive.lg.align]}`);
      if (responsive.lg.justify) classes.push(`lg:${justifyClasses[responsive.lg.justify]}`);
    }
    
    return classes.join(' ');
  };

  return (
    <div
      className={cn(
        'flex',
        directionClasses[direction],
        spacingClasses[direction][spacing],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        getResponsiveClasses(),
        className
      )}
    >
      {children}
    </div>
  );
};