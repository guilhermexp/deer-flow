"use client";

import AnimatedPageWrapperOptimized from "~/components/jarvis/animated-page-wrapper-optimized";
import { HealthDashboard } from "~/components/jarvis/health/health-dashboard";

export default function HealthPage() {
  return (
    <AnimatedPageWrapperOptimized className="px-4 sm:px-6 lg:px-8">
      <HealthDashboard />
    </AnimatedPageWrapperOptimized>
  );
}
