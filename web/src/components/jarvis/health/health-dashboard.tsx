"use client";

import { useState, useEffect } from "react";
import { PanelRight, Settings } from "lucide-react";
import { Button } from "~/components/ui/button";
import { HealthScoreCard } from "./health-score-card";
import { AISuggestionsCard } from "./ai-suggestions-card";
import { HydrationCard } from "./hydration-card";
import { SleepQualityCard } from "./sleep-quality-card";
import { BloodPressureCard } from "./blood-pressure-card";
import { NextWorkoutCard } from "./next-workout-card";
import { HealthSidebar } from "./health-sidebar";
import { HealthTabs } from "./health-tabs";
import { useHealthData } from "./hooks/use-health-data";
import DashboardSettingsModal from "../dashboard-settings-modal";
import type { CardConfig } from "../dashboard-settings-modal";

const LOCAL_STORAGE_KEY_HEALTH = "healthDashboardVisibleCards";

const availableCardsForHealthDashboard: CardConfig[] = [
  { id: "healthScore", name: "Health Score" },
  { id: "aiSuggestions", name: "AI Suggestions" },
  { id: "hydration", name: "Hydration" },
  { id: "sleepQuality", name: "Sleep Quality" },
  { id: "bloodPressure", name: "Blood Pressure" },
  { id: "nextWorkout", name: "Next Workout" },
];

const getDefaultVisibleCardsHealth = (): Record<string, boolean> => {
  const defaults: Record<string, boolean> = {};
  availableCardsForHealthDashboard.forEach(card => {
    defaults[card.id] = true;
  });
  return defaults;
};

export function HealthDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [visibleCards, setVisibleCards] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY_HEALTH);
      if (storedSettings) {
        try {
          const parsed = JSON.parse(storedSettings);
          const defaults = getDefaultVisibleCardsHealth();
          return { ...defaults, ...parsed };
        } catch (error) {
          console.error("Error parsing localStorage settings for HealthDashboard:", error);
          return getDefaultVisibleCardsHealth();
        }
      }
    }
    return getDefaultVisibleCardsHealth();
  });

  const {
    healthData,
    isLoading,
    handleAddWater,
    handleUpdateSleep,
    handleUpdateBloodPressure,
    handleToggleMedication,
    handleAddMedication,
    handleRemoveMedication,
    handleCompleteWorkout,
  } = useHealthData();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY_HEALTH);
      if (storedSettings) {
        try {
          const parsed = JSON.parse(storedSettings);
          const defaults = getDefaultVisibleCardsHealth();
          setVisibleCards({ ...defaults, ...parsed });
        } catch (error) {
          console.error("Error parsing localStorage settings for HealthDashboard on mount:", error);
          setVisibleCards(getDefaultVisibleCardsHealth());
        }
      } else {
        setVisibleCards(getDefaultVisibleCardsHealth());
      }
    }
  }, []);

  const handleSaveSettings = (newVisibleCards: Record<string, boolean>) => {
    setVisibleCards(newVisibleCards);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY_HEALTH, JSON.stringify(newVisibleCards));
    }
    setIsSettingsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="text-muted-foreground mt-2">Carregando dados de saúde...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header with tabs and sidebar toggle */}
      <div className="flex items-center justify-between mb-6">
        <HealthTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="flex items-center gap-2">
          {activeTab === "dashboard" && (
            <Button variant="ghost" size="icon" onClick={() => setIsSettingsModalOpen(true)} className="h-9 w-9 sm:h-10 sm:w-10 text-muted-foreground hover:text-accent-foreground hover:bg-accent">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="sr-only">Dashboard Settings</span>
            </Button>
          )}
          {/* Sidebar toggle for mobile/tablet */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10 bg-transparent border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground xl:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <PanelRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>
      </div>

      {/* Main content with sidebar */}
      <div className="flex gap-6">
        {/* Content area */}
        <div className="flex-1 space-y-6 lg:space-y-8">
          {activeTab === "dashboard" && (
            <>
              {/* Score and Suggestions Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> {/* Ajustado gap para consistência */}
                {visibleCards.healthScore && healthData && (
                  <div className="lg:col-span-2">
                    <HealthScoreCard healthData={{
                      currentScore: healthData.score,
                      weeklyScores: [78, 82, 85, 88, 85, 87, healthData.score], // Scores simulados para a semana
                      trend: healthData.score >= 85 ? 'up' : healthData.score >= 75 ? 'stable' : 'down'
                    }} />
                  </div>
                )}
                {visibleCards.aiSuggestions && healthData && (
                  <div className="h-full"> {/* Para AISuggestionsCard ocupar altura total se possível */}
                    <AISuggestionsCard healthData={healthData} />
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"> {/* Ajustado gap para consistência */}
                {visibleCards.hydration && healthData && (
                  <HydrationCard
                    hydration={healthData.hydration}
                    onAddWater={handleAddWater}
                  />
                )}
                {visibleCards.sleepQuality && healthData && (
                  <SleepQualityCard
                    sleep={healthData.sleep}
                  />
                )}
                {visibleCards.bloodPressure && healthData && (
                  <BloodPressureCard
                    bloodPressure={healthData.bloodPressure}
                  />
                )}
                {visibleCards.nextWorkout && healthData && (
                  <NextWorkoutCard
                    workout={healthData.workout}
                    onCompleteWorkout={handleCompleteWorkout}
                  />
                )}
              </div>
            </>
          )}
          
          {activeTab === "workouts" && (
            <div className="flex items-center justify-center min-h-[50vh] bg-card rounded-lg p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">Seção Treinos</h2>
                <p className="text-muted-foreground mt-2">Conteúdo em desenvolvimento...</p>
              </div>
            </div>
          )}
          
          {activeTab === "exams" && (
            <div className="flex items-center justify-center min-h-[50vh] bg-card rounded-lg p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">Seção Exames</h2>
                <p className="text-muted-foreground mt-2">Conteúdo em desenvolvimento...</p>
              </div>
            </div>
          )}
          
          {activeTab === "nutrition" && (
            <div className="flex items-center justify-center min-h-[50vh] bg-card rounded-lg p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground">Seção Nutrição</h2>
                <p className="text-muted-foreground mt-2">Conteúdo em desenvolvimento...</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - desktop */}
        {/* sticky top-6 h-fit para manter a sidebar visível ao rolar, mas dentro do seu container */}
        <aside className="hidden xl:block w-80 2xl:w-96 sticky top-[calc(var(--header-height,64px)+1.5rem)] h-[calc(100vh-var(--header-height,64px)-3rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
          {healthData && (
            <HealthSidebar
              medications={healthData.medications}
              onToggleMedication={handleToggleMedication}
              onAddMedication={handleAddMedication}
              onRemoveMedication={handleRemoveMedication}
            />
          )}
        </aside>
      </div>

      {/* Sidebar - mobile/tablet overlay */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      } fixed inset-y-0 right-0 z-50 w-80 transform transition-transform duration-300 xl:hidden border-l border-white/10 bg-white/[0.05] backdrop-blur-md`}>
        <div className="h-full overflow-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-muted">
          {healthData && (
            <HealthSidebar
              medications={healthData.medications}
              onToggleMedication={handleToggleMedication}
              onAddMedication={handleAddMedication}
              onRemoveMedication={handleRemoveMedication}
            />
          )}
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/50 z-40 xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {activeTab === "dashboard" && (
        <DashboardSettingsModal
          isOpen={isSettingsModalOpen}
          onOpenChange={setIsSettingsModalOpen}
          availableCards={availableCardsForHealthDashboard}
          visibleCards={visibleCards}
          onSave={handleSaveSettings}
          title="Customize Health Dashboard"
        />
      )}
    </div>
  );
}