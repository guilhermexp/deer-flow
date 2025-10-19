"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { BarChart3, Brain } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Progress } from "~/components/ui/progress";
// import { defaultTasks } from "~/data/jarvis/tasks"
import { useEventManager } from "~/hooks/jarvis/useEventManager";

// Mock tasks data
const defaultTasks: any[] = [];
import AnimatedCardWrapper from "~/components/jarvis/animated-card-wrapper";
import LiquidGlassCard from "~/components/ui/liquid-glass-card";

interface WeeklyBarProps {
  day: string;
  percentage: number;
}

function WeeklyBar({ day, percentage }: WeeklyBarProps) {
  const barColor = "bg-accent-blue";

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center space-y-1 sm:space-y-1.5">
      <div className="text-muted-foreground w-full truncate text-center text-xs font-medium">
        {day}
      </div>
      <div className="bg-muted/40 relative mx-auto h-12 w-full max-w-[12px] overflow-hidden rounded-full sm:h-16 sm:max-w-[14px] md:h-20 md:max-w-[16px]">
        <motion.div
          className={`absolute bottom-0 w-full rounded-b-full ${barColor}`}
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        />
      </div>
      <div className="text-foreground mt-0.5 text-xs font-bold sm:text-sm">
        {percentage}%
      </div>
    </div>
  );
}

export default function WeeklyActivityCard() {
  const { events } = useEventManager();

  const weekDays = React.useMemo(
    () => [
      { id: "monday", name: "Seg" },
      { id: "tuesday", name: "Ter" },
      { id: "wednesday", name: "Qua" },
      { id: "thursday", name: "Qui" },
      { id: "friday", name: "Sex" },
      { id: "saturday", name: "Sáb" },
      { id: "sunday", name: "Dom" },
    ],
    []
  );

  const weeklyData = React.useMemo(
    () =>
      weekDays.map((dayInfo) => {
        const dayTasks = defaultTasks.filter(
          (task) => task.day === dayInfo.id
        ).length;

        const now = new Date();
        const currentDayOfWeek = now.getDay();
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(
          now.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1)
        );

        const dayIndex = weekDays.findIndex((d) => d.id === dayInfo.id);
        const dayDate = new Date(firstDayOfWeek);
        dayDate.setDate(firstDayOfWeek.getDate() + dayIndex);

        const dayEvents = events.filter(
          (event) =>
            new Date(event.date).toDateString() === dayDate.toDateString()
        ).length;

        const totalActivities = dayTasks + dayEvents;
        const maxExpectedActivities = 5;
        return {
          day: dayInfo.name,
          tasks: dayTasks,
          events: dayEvents,
          total: totalActivities,
          percentage: Math.min(
            100,
            Math.round((totalActivities / maxExpectedActivities) * 100)
          ),
        };
      }),
    [events, weekDays]
  );

  const aiInsights = React.useMemo(() => {
    const totalTasksAI = defaultTasks.length;
    const completedTasks = defaultTasks.filter(
      (t) => t.timeSpent && t.timeSpent > 0 && !t.isRunning
    ).length;
    const completionRate =
      totalTasksAI > 0 ? Math.round((completedTasks / totalTasksAI) * 100) : 0;

    const baselineProductivity = 50;
    let productivityChange = "";
    if (completionRate >= baselineProductivity) {
      productivityChange = `${completionRate - baselineProductivity}% acima da média`;
    } else {
      productivityChange = `${baselineProductivity - completionRate}% abaixo da média`;
    }

    return {
      completedTasks,
      totalTasksAI,
      completionRate,
      productivityChange,
    };
  }, []);

  return (
    <AnimatedCardWrapper delay={0}>
      <LiquidGlassCard className="h-full rounded-xl">
        <Card className="h-full border-0 bg-transparent shadow-none">
          <CardHeader className="relative z-10 px-4 pt-4 pb-2 sm:px-5 sm:pt-5 sm:pb-3">
            <CardTitle className="text-foreground flex items-center gap-2 text-base font-semibold sm:gap-3 sm:text-lg md:text-xl">
              <motion.div
                animate={{ rotate: [0, 7, -7, 0] }}
                transition={{
                  duration: 1.5,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 2,
                }}
                whileHover={{
                  scale: 1.15,
                  rotate: 360,
                  transition: { duration: 0.4, ease: "easeInOut" },
                }}
              >
                <BarChart3 className="text-muted-foreground h-4 w-4 sm:h-5 sm:w-5" />
              </motion.div>
              <span className="truncate">Atividades da Semana</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 px-4 pb-4 sm:px-5 sm:pb-5">
            <Tabs defaultValue="progress" className="w-full">
              <TabsList className="bg-muted/40 mb-3 grid w-full grid-cols-2 rounded-md p-1 sm:mb-4">
                <TabsTrigger
                  value="progress"
                  className="data-[state=active]:bg-background/70 data-[state=active]:text-foreground rounded-[5px] py-1.5 text-xs transition-all duration-150 data-[state=active]:shadow-sm sm:py-2 sm:text-sm"
                >
                  Progresso
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="data-[state=active]:bg-background/70 data-[state=active]:text-foreground rounded-[5px] py-1.5 text-xs transition-all duration-150 data-[state=active]:shadow-sm sm:py-2 sm:text-sm"
                >
                  Detalhes
                </TabsTrigger>
              </TabsList>
              <TabsContent value="progress" className="space-y-2 sm:space-y-3">
                <div className="flex w-full items-end justify-around space-x-1 px-1 sm:space-x-1.5 md:space-x-2">
                  {weeklyData.map((dayData, index) => (
                    <WeeklyBar
                      key={index}
                      day={dayData.day}
                      percentage={dayData.percentage}
                    />
                  ))}
                </div>
                <div className="border-border/40 mt-3 border-t pt-2 sm:mt-4 sm:pt-3">
                  <div className="mb-2 flex items-center gap-2 sm:mb-3">
                    <Brain className="text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-muted-foreground text-xs font-medium sm:text-sm">
                      AI Insights
                    </span>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground text-2xl font-bold sm:text-3xl md:text-4xl">
                        {aiInsights.completionRate}%
                      </span>
                      <span className="text-muted-foreground text-right text-xs">
                        {aiInsights.productivityChange}
                      </span>
                    </div>

                    <Progress
                      value={aiInsights.completionRate}
                      className="bg-muted/40 h-1.5"
                      indicatorClassName="bg-accent-teal"
                    />

                    <p className="text-muted-foreground text-xs sm:text-sm">
                      <strong className="text-foreground font-semibold">
                        {aiInsights.completedTasks}
                      </strong>
                      /{aiInsights.totalTasksAI} Tarefas completadas esta
                      semana.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </LiquidGlassCard>
    </AnimatedCardWrapper>
  );
}
