"use client"
import { Bell, Clock } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import LiquidGlassCard from "~/components/ui/liquid-glass-card"
import { reminderService } from "~/services/supabase/reminders"
import type { Reminder } from "~/services/supabase/reminders"

export default function RemindersCard() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadReminders = async () => {
      try {
        const data = await reminderService.getTodayReminders()
        setReminders(data)
      } catch (error) {
        console.error('Failed to load reminders:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadReminders()
  }, [])

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
                  <div className="h-4 w-12 bg-white/10 rounded-xl animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded-xl animate-pulse" />
                    <div className="h-3 w-20 bg-white/10 rounded-xl animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : reminders.length > 0 ? (
            <div className="space-y-2.5">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.08] transition-colors"
                >
                  {reminder.time && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 min-w-[50px] pt-0.5">
                      <Clock className="h-3 w-3" />
                      {reminder.time}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-100 truncate">{reminder.title}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-gray-500">{reminder.category || 'Geral'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Bell className="h-8 w-8 mx-auto text-gray-500 mb-2" />
              <p className="text-xs text-gray-400">Nenhum lembrete para hoje</p>
            </div>
          )}
        </div>
      </LiquidGlassCard>
    </motion.div>
  )
}
