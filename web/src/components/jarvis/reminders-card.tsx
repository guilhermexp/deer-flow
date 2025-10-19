"use client";
import { Bell, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import LiquidGlassCard from "~/components/ui/liquid-glass-card";
import { createRemindersApiService } from "~/services/api/reminders";
import { useAuthenticatedApi } from "~/hooks/use-authenticated-api";

interface Reminder {
  id: string;
  title: string;
  time?: string;
  category?: string;
  created_at?: string;
}

export default function RemindersCard() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use authenticated API client
  const authApi = useAuthenticatedApi();
  const remindersApiService = useMemo(
    () => createRemindersApiService(authApi),
    [authApi]
  );

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const data = await remindersApiService.getTodayReminders();
        setReminders(data);
      } catch (error) {
        console.error("Failed to load reminders:", error);
        // Em caso de erro, mostrar lembretes mock
        setReminders([
          {
            id: "1",
            title: "Reunião de equipe",
            time: "10:00",
            category: "Trabalho",
          },
          {
            id: "2",
            title: "Revisar relatório",
            time: "14:30",
            category: "Trabalho",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadReminders();
  }, [remindersApiService]);

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <LiquidGlassCard className="h-full rounded-xl p-5">
        <div className="pb-3">
          <h3 className="flex items-center gap-2 text-base font-medium text-white">
            <div className="group">
              <Bell className="h-4 w-4 text-gray-400 transition-colors group-hover:text-blue-400" />
            </div>
            Lembretes
          </h3>
        </div>
        <div>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <div className="h-4 w-12 animate-pulse rounded-xl bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 animate-pulse rounded-xl bg-white/10" />
                    <div className="h-3 w-20 animate-pulse rounded-xl bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : reminders.length > 0 ? (
            <div className="space-y-2.5">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-white/[0.08]"
                >
                  {reminder.time && (
                    <div className="flex min-w-[50px] items-center gap-1 pt-0.5 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {reminder.time}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-100">
                      {reminder.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {reminder.category || "Geral"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 text-gray-500" />
              <p className="text-xs text-gray-400">Nenhum lembrete para hoje</p>
            </div>
          )}
        </div>
      </LiquidGlassCard>
    </motion.div>
  );
}
