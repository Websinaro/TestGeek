import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: 'text' | 'title' | 'circle' | 'rect';
}

export function Skeleton({ className, variant = 'rect', ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-zinc-200 dark:bg-zinc-800',
        {
          'h-4 w-full rounded': variant === 'text',
          'h-8 w-2/3 rounded-md': variant === 'title',
          'rounded-full shrink-0': variant === 'circle',
          'rounded-lg': variant === 'rect',
        },
        className
      )}
      {...props}
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full space-y-8 animate-pulse">
      {/* Skeleton Banner / Header */}
      <div className="w-full h-48 md:h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />

      {/* Title & Button Line */}
      <div className="flex justify-between items-center">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-md w-48" />
        <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-24" />
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl shadow-sm">
            <div className="aspect-square w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-sm w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full space-y-8 animate-pulse">
      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded-md w-56 mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
              <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-md shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
                <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              </div>
              <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-12" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 rounded-lg space-y-4 h-48">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
          <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md w-full" />
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full space-y-8 animate-pulse">
      <div className="flex items-center gap-6 pb-6 border-b border-zinc-100 dark:border-zinc-850">
        <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
        <div className="space-y-2">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-48" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border border-zinc-100 dark:border-zinc-800 rounded-lg p-6 space-y-4 bg-white dark:bg-zinc-900">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
        </div>
        <div className="md:col-span-2 border border-zinc-100 dark:border-zinc-800 rounded-lg p-6 bg-white dark:bg-zinc-900 space-y-6">
          <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
          <div className="space-y-3">
            <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderListSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 w-full space-y-6 animate-pulse">
      <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-48" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-6 space-y-4 bg-white dark:bg-zinc-900">
          <div className="flex justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
            </div>
            <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded-full w-20" />
          </div>
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 flex gap-4">
            <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-md shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="bg-[#f1f3f6] min-h-screen pb-20 animate-pulse">
      <div className="max-w-[1440px] mx-auto px-4 py-4 space-y-4">
        {/* Breadcrumb Skeleton */}
        <div className="h-10 bg-white rounded shadow-sm w-1/2" />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Images */}
          <div className="lg:w-[40%] space-y-4">
            <div className="bg-white p-4 rounded shadow-sm">
              <div className="aspect-square bg-zinc-200 dark:bg-zinc-800 rounded-sm w-full" />
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded p-1 shrink-0" />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Information */}
          <div className="flex-1 bg-white p-6 md:p-8 rounded shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
              <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
              <div className="flex items-center gap-4">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-32" />
                <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-16" />
              </div>
            </div>

            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-36" />

            <div className="space-y-2 pt-4 border-t border-zinc-100">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
            </div>

            <div className="flex gap-4 pt-6">
              <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-md w-32" />
              <div className="h-12 bg-zinc-200 dark:bg-zinc-800 rounded-md w-40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

