import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
};

const CardHeader: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={cn('px-6 py-4 border-b border-gray-200', className)}>
      {children}
    </div>
  );
};

const CardTitle: React.FC<CardProps> = ({ children, className }) => {
  return (
    <h3 className={cn('text-lg font-semibold text-gray-900', className)}>
      {children}
    </h3>
  );
};

const CardDescription: React.FC<CardProps> = ({ children, className }) => {
  return (
    <p className={cn('text-sm text-gray-500 mt-1', className)}>{children}</p>
  );
};

const CardContent: React.FC<CardProps> = ({ children, className }) => {
  return <div className={cn('px-6 py-4', className)}>{children}</div>;
};

const CardFooter: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg',
        className
      )}
    >
      {children}
    </div>
  );
};

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
