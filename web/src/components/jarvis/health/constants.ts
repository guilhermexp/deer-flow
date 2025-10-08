export const healthCardStyles = {
  base: "p-4 sm:p-5 lg:p-6 h-full bg-white/[0.02] border-white/10",
  header: "flex justify-between items-center mb-3 sm:mb-4",
  icon: "w-4 h-4 sm:w-5 sm:h-5",
  title: "font-medium text-sm sm:text-base text-gray-100",
} as const

export const healthColors = {
  hydration: "text-blue-400",
  sleep: "text-purple-400",
  pressure: "text-red-400",
  workout: "text-green-400",
  suggestions: "text-blue-400",
} as const