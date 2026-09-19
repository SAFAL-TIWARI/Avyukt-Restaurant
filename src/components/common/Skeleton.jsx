import React from 'react';

/**
 * Base Atomic Skeleton
 * Displays a sleek, pulsing block with a metallic light-sweep shimmer.
 */
export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-shimmer bg-black/5 dark:bg-white/[0.08] rounded-xl ${className}`}
      {...props}
    />
  );
};

/**
 * Order Card Skeleton
 * Accurately replicates the live order cards on OrdersPage.
 */
export const OrderCardSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white/90 dark:bg-zinc-900/90 rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-sm space-y-4"
        >
          {/* Header Row: ID, Time, Status Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-28 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3.5 w-36 rounded-md" />
            </div>
            <Skeleton className="h-8 w-28 rounded-full" />
          </div>

          {/* Items Preview */}
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-4 w-16 rounded-md" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-16 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-4 w-14 rounded-md" />
            </div>
          </div>

          {/* Footer Row: Progress bar & Action button */}
          <div className="pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Payment Transaction Row Skeleton
 * Replicates payment items on the ProfilePage.
 */
export const PaymentCardSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-50/80 dark:bg-zinc-800/40 p-5 rounded-3xl border border-black/5 dark:border-white/5 flex flex-col md:flex-row justify-between md:items-center gap-4"
        >
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-36 rounded-md" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-24 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Notification Item Skeleton
 * Replicates notifications on NotificationsPage.
 */
export const NotificationSkeleton = ({ count = 4 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-900/90 rounded-3xl border border-black/5 dark:border-white/10 p-5 shadow-sm space-y-3"
        >
          <div className="flex items-start gap-4">
            <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-44 rounded-md" />
                <Skeleton className="h-3 w-16 rounded-md" />
              </div>
              <Skeleton className="h-3.5 w-5/6 rounded-md" />
              <Skeleton className="h-3.5 w-2/3 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Stats Cards Grid Skeleton
 * Replicates KPI cards on Admin Dashboard.
 */
export const StatsGridSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-8">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white/90 dark:bg-zinc-900/90 p-5 md:p-6 rounded-3xl border border-amber-950/10 dark:border-white/10 shadow-sm flex items-center gap-4"
        >
          <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="h-6 w-28 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Menu Food Card Skeleton
 * Replicates food dishes on Menu / Recipes pages.
 */
export const MenuCardSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white/80 dark:bg-zinc-900/80 rounded-3xl p-5 border border-black/5 dark:border-white/10 shadow-sm space-y-4"
        >
          <Skeleton className="w-full h-48 rounded-2xl" />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <Skeleton className="h-4 w-8 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-full rounded-md" />
            <Skeleton className="h-3.5 w-2/3 rounded-md" />
          </div>
          <div className="pt-2 flex items-center justify-between">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Full Page Skeleton
 * Used as high-end Suspense fallback for lazy-loaded routes in App.jsx.
 */
export const PageSkeleton = ({ type = 'default' }) => {
  return (
    <div className="min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Top Banner / Hero Title Shimmer */}
      <div className="space-y-3 max-w-xl">
        <Skeleton className="h-4 w-32 rounded-full" />
        <Skeleton className="h-10 w-3/4 rounded-2xl" />
        <Skeleton className="h-4 w-full rounded-lg" />
      </div>

      {/* Dynamic Content Pattern by Page Type */}
      {type === 'orders' ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
          <OrderCardSkeleton count={3} />
        </div>
      ) : type === 'dashboard' ? (
        <div className="space-y-6">
          <StatsGridSkeleton count={4} />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-36 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
          <OrderCardSkeleton count={2} />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-36 rounded-full" />
          </div>
          <MenuCardSkeleton count={6} />
        </div>
      )}
    </div>
  );
};

export default Skeleton;
