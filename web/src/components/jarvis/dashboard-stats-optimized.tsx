import { lazy, Suspense, memo, useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "~/components/ui/button";

// Lazy load dashboard settings modal
const DashboardSettingsModal = lazy(() => import("~/components/jarvis/dashboard-settings-modal"));

// Lazy load ALL cards to reduce initial bundle size
const RemindersCard = lazy(() => import("~/components/jarvis/reminders-card"));
const TodayTasksCard = lazy(() => import("~/components/jarvis/today-tasks-card"));
const TimelineCard = lazy(() => import("~/components/jarvis/timeline-card"));
const PrioritiesCard = lazy(() => import("~/components/jarvis/priorities-card"));
const SleepDashboard = lazy(() => import("~/components/jarvis/sleep/sleep-dashboard"));

// Ultra-lightweight loading skeleton
const CardSkeleton = memo(() => (
  <div className="rounded-xl border border-white/10 bg-white/[0.05] backdrop-blur-sm h-24">
    <div className="p-4">
      <div className="h-3 bg-white/10 rounded-xl w-1/3 mb-2"></div>
      <div className="space-y-1">
        <div className="h-2 bg-white/[0.08] rounded-xl"></div>
        <div className="h-2 bg-white/[0.08] rounded-xl w-4/5"></div>
      </div>
    </div>
  </div>
));

CardSkeleton.displayName = "CardSkeleton";

const LOCAL_STORAGE_KEY = "dashboardStatsVisibleCards";

export interface CardConfig {
  id: string;
  name: string;
}

const availableCardsForDashboardStats: CardConfig[] = [
  { id: "reminders", name: "Reminders" },
  { id: "timeline", name: "Timeline" },
  { id: "sleep", name: "Sleep Dashboard" },
  { id: "priorities", name: "Priorities" },
  { id: "todayTasks", name: "Today's Tasks" },
];

const getDefaultVisibleCards = (): Record<string, boolean> => {
  const defaults: Record<string, boolean> = {};
  availableCardsForDashboardStats.forEach(card => {
    defaults[card.id] = true;
  });
  return defaults;
};

const DashboardStatsOptimized = memo(function DashboardStatsOptimized() {
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [visibleCards, setVisibleCards] = useState<Record<string, boolean>>(getDefaultVisibleCards);

  // Load settings from localStorage after hydration
  useEffect(() => {
    const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        const defaults = getDefaultVisibleCards();
        setVisibleCards({ ...defaults, ...parsed });
      } catch (error) {
        console.error("Error parsing localStorage settings:", error);
      }
    }
  }, []);

  const handleSaveSettings = (newVisibleCards: Record<string, boolean>) => {
    setVisibleCards(newVisibleCards);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newVisibleCards));
    setIsSettingsModalOpen(false);
  };

  // Render all cards with lazy loading
  const renderCard = (cardId: string, Component: React.LazyExoticComponent<React.ComponentType>) => {
    if (!visibleCards[cardId]) return null;
    
    return (
      <Suspense fallback={<CardSkeleton />}>
        <Component />
      </Suspense>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto relative z-10">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-white">Dashboard</h2>
        <Button variant="ghost" size="icon" onClick={() => setIsSettingsModalOpen(true)} className="relative z-20 bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] text-gray-300 h-8 w-8">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Dashboard Settings</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 md:gap-4 lg:gap-6">
        {/* Left Column - Timeline alone */}
        <div className="sm:col-span-2 md:col-span-2 lg:col-span-4 space-y-3 md:space-y-4 lg:space-y-6">
          {renderCard("timeline", TimelineCard)}
        </div>

        {/* Center Column */}
        <div className="sm:col-span-2 md:col-span-1 lg:col-span-4 space-y-3 md:space-y-4 lg:space-y-6">
          {renderCard("sleep", SleepDashboard)}
        </div>

        {/* Right Column - Priorities first, then Reminders */}
        <div className="sm:col-span-2 md:col-span-1 lg:col-span-4 space-y-3 md:space-y-4 lg:space-y-6">
          {renderCard("todayTasks", TodayTasksCard)}
          {renderCard("priorities", PrioritiesCard)}
          {renderCard("reminders", RemindersCard)}
        </div>
      </div>

      {isSettingsModalOpen && (
        <Suspense fallback={null}>
          <DashboardSettingsModal
            isOpen={isSettingsModalOpen}
            onOpenChange={setIsSettingsModalOpen}
            availableCards={availableCardsForDashboardStats}
            visibleCards={visibleCards}
            onSave={handleSaveSettings}
            title="Customize Dashboard Stats"
          />
        </Suspense>
      )}
    </div>
  );
});

export default DashboardStatsOptimized;