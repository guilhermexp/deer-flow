"use client";

import AnimatedPageWrapperOptimized from "~/components/jarvis/animated-page-wrapper-optimized";
import CalendarPageClient from "~/components/jarvis/calendar/calendar-page-client";

export default function CalendarPage() {
  return (
    <AnimatedPageWrapperOptimized>
      <CalendarPageClient />
    </AnimatedPageWrapperOptimized>
  );
}
