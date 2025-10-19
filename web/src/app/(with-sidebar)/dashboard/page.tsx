"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

import AnimatedPageWrapperOptimized from "~/components/jarvis/animated-page-wrapper-optimized";

// Lazy load with better loading state
const DashboardStatsOptimized = dynamic(
  () => import("~/components/jarvis/dashboard-stats-optimized"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full space-y-6 lg:space-y-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-white/[0.05]"></div>
          <div className="h-8 w-8 animate-pulse rounded-xl bg-white/[0.05]"></div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="lg:col-span-4">
              <div className="h-48 animate-pulse rounded-xl border border-white/10 bg-white/[0.05] backdrop-blur-sm">
                <div className="p-6">
                  <div className="mb-4 h-4 w-1/3 rounded-xl bg-white/10"></div>
                  <div className="space-y-3">
                    <div className="h-3 rounded-xl bg-white/[0.08]"></div>
                    <div className="h-3 w-4/5 rounded-xl bg-white/[0.08]"></div>
                    <div className="h-3 w-3/5 rounded-xl bg-white/[0.08]"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  }
);

export default function DashboardPage() {
  return (
    <AnimatedPageWrapperOptimized className="min-h-full">
      <Suspense
        fallback={
          <div className="flex w-full justify-center space-y-4 lg:space-y-6">
            <div className="h-6 w-32 animate-pulse rounded-xl bg-white/[0.05]"></div>
            <div className="grid w-full max-w-6xl grid-cols-1 gap-4 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-white/10 bg-white/[0.05] backdrop-blur-sm"
                />
              ))}
            </div>
          </div>
        }
      >
        <div className="flex w-full justify-center space-y-4 lg:space-y-6">
          <div className="w-full max-w-7xl">
            <DashboardStatsOptimized />
          </div>
        </div>
      </Suspense>
    </AnimatedPageWrapperOptimized>
  );
}
