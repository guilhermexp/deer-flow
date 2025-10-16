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
import { healthApiService } from "~/services/api/health";
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
  availableCardsForHealthDashboard.forEach((card) => {
    defaults[card.id] = true;
  });
  return defaults;
};

export function HealthDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [visibleCards, setVisibleCards] = useState<Record<string, boolean>>(
    () => {
      if (typeof window !== "undefined") {
        const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY_HEALTH);
        if (storedSettings) {
          try {
            const parsed = JSON.parse(storedSettings);
            const defaults = getDefaultVisibleCardsHealth();
            return { ...defaults, ...parsed };
          } catch (error) {
            console.error(
              "Error parsing localStorage settings for HealthDashboard:",
              error,
            );
            return getDefaultVisibleCardsHealth();
          }
        }
      }
      return getDefaultVisibleCardsHealth();
    },
  );

  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  // Mock functions - implementar com a API quando disponível
  const handleAddWater = async () => {
    console.log("Add water - to be implemented");
  };

  const handleUpdateSleep = async (sleepData: any) => {
    console.log("Update sleep - to be implemented");
  };

  const handleUpdateBloodPressure = async (bpData: any) => {
    console.log("Update blood pressure - to be implemented");
  };

  const handleToggleMedication = async (index: number) => {
    console.log("Toggle medication - to be implemented");
  };

  const handleAddMedication = async (medication: any) => {
    console.log("Add medication - to be implemented");
  };

  const handleRemoveMedication = async (index: number) => {
    console.log("Remove medication - to be implemented");
  };

  const handleCompleteWorkout = async () => {
    console.log("Complete workout - to be implemented");
  };

  // Load health data
  useEffect(() => {
    const loadHealthData = async () => {
      try {
        setIsLoading(true);
        // TODO: Implementar com healthApiService quando disponível
        // const data = await healthApiService.getHealthData();

        // Mock data for now
        const mockHealthData = {
          score: 85,
          hydration: {
            current: 6,
            goal: 8,
            unit: "cups",
          },
          sleep: {
            duration: 7.5,
            quality: "good",
          },
          bloodPressure: {
            systolic: 120,
            diastolic: 80,
            pulse: 72,
            history: [
              { date: "2025-10-16T08:00:00Z", systolic: 118, diastolic: 78 },
              { date: "2025-10-16T12:00:00Z", systolic: 122, diastolic: 82 },
              { date: "2025-10-16T16:00:00Z", systolic: 120, diastolic: 80 },
              { date: "2025-10-15T20:00:00Z", systolic: 119, diastolic: 79 },
            ],
          },
          workout: {
            nextWorkout: {
              time: "07:00",
              type: "Morning Run",
              duration: 30,
              intensity: "Moderada",
            },
            weeklyGoal: 5,
            weeklyCompleted: 3,
          },
          medications: [
            { id: "1", name: "Vitamin D", taken: false },
            { id: "2", name: "Omega 3", taken: true },
          ],
        };

        setHealthData(mockHealthData);
      } catch (err) {
        setError("Failed to load health data");
      } finally {
        setIsLoading(false);
      }
    };

    loadHealthData();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY_HEALTH);
      if (storedSettings) {
        try {
          const parsed = JSON.parse(storedSettings);
          const defaults = getDefaultVisibleCardsHealth();
          setVisibleCards({ ...defaults, ...parsed });
        } catch (error) {
          console.error(
            "Error parsing localStorage settings for HealthDashboard on mount:",
            error,
          );
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
      localStorage.setItem(
        LOCAL_STORAGE_KEY_HEALTH,
        JSON.stringify(newVisibleCards),
      );
    }
    setIsSettingsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <div className="border-primary inline-block h-8 w-8 animate-spin rounded-full border-t-2 border-b-2"></div>
          <p className="text-muted-foreground mt-2">
            Carregando dados de saúde...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Usuário não autenticado</p>
          <p className="text-muted-foreground text-sm">
            Faça login para acessar seus dados de saúde.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">
            Erro ao carregar dados de saúde
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
          <p className="text-muted-foreground mt-4 text-sm">
            Certifique-se de que as tabelas do banco de dados foram criadas.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 mt-4 rounded-md px-4 py-2"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">
            Nenhum dado de saúde disponível
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header with tabs and sidebar toggle */}
      <div className="mb-6 flex items-center justify-between">
        <HealthTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex items-center gap-2">
          {activeTab === "dashboard" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-muted-foreground hover:text-accent-foreground hover:bg-accent h-9 w-9 sm:h-10 sm:w-10"
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="sr-only">Dashboard Settings</span>
            </Button>
          )}
          {/* Sidebar toggle for mobile/tablet */}
          <Button
            variant="outline"
            size="icon"
            className="border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground h-9 w-9 bg-transparent sm:h-10 sm:w-10 xl:hidden"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <PanelRight className="h-4 w-4 sm:h-5 sm:w-5" />
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
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {" "}
                {/* Ajustado gap para consistência */}
                {visibleCards.healthScore && healthData && (
                  <div className="lg:col-span-2">
                    <HealthScoreCard
                      healthData={{
                        currentScore: healthData.score,
                        weeklyScores: [
                          78,
                          82,
                          85,
                          88,
                          85,
                          87,
                          healthData.score,
                        ], // Scores simulados para a semana
                        trend:
                          healthData.score >= 85
                            ? "up"
                            : healthData.score >= 75
                              ? "stable"
                              : "down",
                      }}
                    />
                  </div>
                )}
                {visibleCards.aiSuggestions && healthData && (
                  <div className="h-full">
                    {" "}
                    {/* Para AISuggestionsCard ocupar altura total se possível */}
                    <AISuggestionsCard healthData={healthData} />
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {" "}
                {/* Ajustado gap para consistência */}
                {visibleCards.hydration && healthData && (
                  <HydrationCard
                    hydration={healthData.hydration}
                    onAddWater={handleAddWater}
                  />
                )}
                {visibleCards.sleepQuality && healthData && (
                  <SleepQualityCard sleep={healthData.sleep} />
                )}
                {visibleCards.bloodPressure && healthData && (
                  <BloodPressureCard bloodPressure={healthData.bloodPressure} />
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
            <div className="bg-card flex min-h-[50vh] items-center justify-center rounded-lg p-6">
              <div className="text-center">
                <h2 className="text-foreground text-2xl font-bold">
                  Seção Treinos
                </h2>
                <p className="text-muted-foreground mt-2">
                  Conteúdo em desenvolvimento...
                </p>
              </div>
            </div>
          )}

          {activeTab === "exams" && (
            <div className="bg-card flex min-h-[50vh] items-center justify-center rounded-lg p-6">
              <div className="text-center">
                <h2 className="text-foreground text-2xl font-bold">
                  Seção Exames
                </h2>
                <p className="text-muted-foreground mt-2">
                  Conteúdo em desenvolvimento...
                </p>
              </div>
            </div>
          )}

          {activeTab === "nutrition" && (
            <div className="bg-card flex min-h-[50vh] items-center justify-center rounded-lg p-6">
              <div className="text-center">
                <h2 className="text-foreground text-2xl font-bold">
                  Seção Nutrição
                </h2>
                <p className="text-muted-foreground mt-2">
                  Conteúdo em desenvolvimento...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - desktop */}
        {/* sticky top-6 h-fit para manter a sidebar visível ao rolar, mas dentro do seu container */}
        <aside className="scrollbar-thin scrollbar-thumb-muted sticky top-[calc(var(--header-height,64px)+1.5rem)] hidden h-[calc(100vh-var(--header-height,64px)-3rem)] w-80 overflow-y-auto xl:block 2xl:w-96">
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
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        } fixed inset-y-0 right-0 z-50 w-80 transform border-l border-white/10 bg-white/[0.05] backdrop-blur-md transition-transform duration-300 xl:hidden`}
      >
        <div className="scrollbar-thin scrollbar-thumb-muted h-full overflow-auto p-4 sm:p-6">
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
          className="bg-background/50 fixed inset-0 z-40 xl:hidden"
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
