"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import AnimatedPageWrapperOptimized from "~/components/jarvis/animated-page-wrapper-optimized";

// Lazy load with better loading state
const DashboardStatsOptimized = dynamic(() => import("~/components/jarvis/dashboard-stats-optimized"), {
  ssr: false,
  loading: () => (
    <div className="w-full space-y-6 lg:space-y-8">
      <div className="flex justify-between items-center mb-4">
        <div className="h-8 bg-white/[0.05] rounded-xl w-48 animate-pulse"></div>
        <div className="h-8 w-8 bg-white/[0.05] rounded-xl animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="lg:col-span-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.05] backdrop-blur-sm h-48 animate-pulse">
              <div className="p-6">
                <div className="h-4 bg-white/10 rounded-xl w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-3 bg-white/[0.08] rounded-xl"></div>
                  <div className="h-3 bg-white/[0.08] rounded-xl w-4/5"></div>
                  <div className="h-3 bg-white/[0.08] rounded-xl w-3/5"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
});

export default function DashboardPage() {
  return (
    <AnimatedPageWrapperOptimized className="min-h-full">
      <Suspense fallback={
        <div className="w-full space-y-6 lg:space-y-8">
          <div className="h-8 bg-white/[0.05] rounded-xl w-48 animate-pulse"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/[0.05] backdrop-blur-sm h-32 animate-pulse" />
            ))}
          </div>
        </div>
      }>
        <div className="w-full space-y-6 lg:space-y-8">
          <DashboardStatsOptimized />
        </div>
      </Suspense>
    </AnimatedPageWrapperOptimized>
  );
}