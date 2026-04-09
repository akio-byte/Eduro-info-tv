import React from 'react';
import { cn } from "../../lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
}

export function Skeleton({ className, variant = 'rectangular', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200 rounded",
        variant === 'text' && "h-4 w-full",
        variant === 'circular' && "rounded-full",
        variant === 'card' && "h-48 w-full rounded-xl",
        className
      )}
      {...props}
    />
  );
}
