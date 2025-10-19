export const CALENDAR_STORAGE_KEY = "calendar_events";

export const CALENDAR_FILTERS: Array<{ value: CalendarFilter; label: string }> =
  [
    { value: "all", label: "Todos" },
    { value: "rotina", label: "Rotina" },
    { value: "habitos", label: "Hábitos" },
    { value: "workout", label: "Workout" },
    { value: "lembretes", label: "Lembretes" },
  ];

import type { CalendarFilter, CalendarEvent } from "./types";

export const SAMPLE_EVENTS_DATA: Omit<CalendarEvent, "id" | "day" | "time">[] =
  [
    {
      title: "Reunião de Planejamento Semanal",
      subtitle: "Discussão de metas e tarefas",
      date: new Date(
        new Date().setDate(new Date().getDate() - new Date().getDay() + 1)
      ).toISOString(), // Segunda-feira desta semana
      startHour: 9,
      duration: 1.5,
      color: "blue" as const,
      category: "rotina" as const,
    },
    {
      title: "Sessão de Yoga Matinal",
      subtitle: "Foco em flexibilidade e respiração",
      date: new Date(
        new Date().setDate(new Date().getDate() - new Date().getDay() + 2)
      ).toISOString(), // Terça-feira desta semana
      startHour: 7,
      duration: 1,
      color: "green" as const,
      category: "habitos" as const,
    },
    {
      title: "Treino de Força - Pernas",
      subtitle: "Academia - Foco em agachamentos e leg press",
      date: new Date(
        new Date().setDate(new Date().getDate() - new Date().getDay() + 3)
      ).toISOString(), // Quarta-feira desta semana
      startHour: 18,
      duration: 1,
      color: "orange" as const,
      category: "workout" as const,
    },
    {
      title: "Pagar Contas",
      subtitle: "Luz, água, internet",
      date: new Date(
        new Date().setDate(new Date().getDate() - new Date().getDay() + 4)
      ).toISOString(), // Quinta-feira desta semana
      startHour: 10,
      duration: 0.5,
      color: "purple" as const,
      category: "lembretes" as const,
    },
    {
      title: "Almoço com Cliente X",
      subtitle: "Restaurante Italiano",
      date: new Date(
        new Date().setDate(new Date().getDate() - new Date().getDay() + 5)
      ).toISOString(), // Sexta-feira desta semana
      startHour: 12,
      duration: 1.5,
      color: "red" as const,
      category: "rotina" as const,
    },
    {
      title: "Estudar Novo Framework",
      subtitle: "Capítulo 3 e 4",
      date: new Date().toISOString(), // Hoje
      startHour: 14,
      duration: 2,
      color: "blue" as const,
      category: "habitos" as const,
    },
    {
      title: "Corrida no Parque",
      subtitle: "5km",
      date: new Date(
        new Date().setDate(new Date().getDate() + 1)
      ).toISOString(), // Amanhã
      startHour: 7,
      duration: 1,
      color: "orange" as const,
      category: "workout" as const,
    },
  ];

export const CALENDAR_HOURS: number[] = Array.from({ length: 24 }, (_, i) => i);

export const EVENT_COLORS_STYLES: {
  [key: string]: {
    bg: string;
    text: string;
    border: string;
    hoverBg?: string;
    activeRing?: string;
    card?: string;
    current?: string;
    dot?: string;
  };
} = {
  blue: {
    bg: "bg-blue-500/20",
    text: "text-blue-300",
    border: "border-blue-500/50",
    hoverBg: "hover:bg-blue-500/30",
    activeRing: "ring-blue-400",
    card: "border-blue-500/50 bg-blue-500/10",
    current: "ring-2 ring-blue-400/50",
    dot: "bg-blue-400",
  },
  green: {
    bg: "bg-green-500/20",
    text: "text-green-300",
    border: "border-green-500/50",
    hoverBg: "hover:bg-green-500/30",
    activeRing: "ring-green-400",
    card: "border-green-500/50 bg-green-500/10",
    current: "ring-2 ring-green-400/50",
    dot: "bg-green-400",
  },
  orange: {
    bg: "bg-orange-500/20",
    text: "text-orange-300",
    border: "border-orange-500/50",
    hoverBg: "hover:bg-orange-500/30",
    activeRing: "ring-orange-400",
    card: "border-orange-500/50 bg-orange-500/10",
    current: "ring-2 ring-orange-400/50",
    dot: "bg-orange-400",
  },
  purple: {
    bg: "bg-purple-500/20",
    text: "text-purple-300",
    border: "border-purple-500/50",
    hoverBg: "hover:bg-purple-500/30",
    activeRing: "ring-purple-400",
    card: "border-purple-500/50 bg-purple-500/10",
    current: "ring-2 ring-purple-400/50",
    dot: "bg-purple-400",
  },
  red: {
    bg: "bg-red-500/20",
    text: "text-red-300",
    border: "border-red-500/50",
    hoverBg: "hover:bg-red-500/30",
    activeRing: "ring-red-400",
    card: "border-red-500/50 bg-red-500/10",
    current: "ring-2 ring-red-400/50",
    dot: "bg-red-400",
  },
  teal: {
    bg: "bg-teal-500/20",
    text: "text-teal-300",
    border: "border-teal-500/50",
    hoverBg: "hover:bg-teal-500/30",
    activeRing: "ring-teal-400",
    card: "border-teal-500/50 bg-teal-500/10",
    current: "ring-2 ring-teal-400/50",
    dot: "bg-teal-400",
  },
  pink: {
    bg: "bg-pink-500/20",
    text: "text-pink-300",
    border: "border-pink-500/50",
    hoverBg: "hover:bg-pink-500/30",
    activeRing: "ring-pink-400",
    card: "border-pink-500/50 bg-pink-500/10",
    current: "ring-2 ring-pink-400/50",
    dot: "bg-pink-400",
  },
  cyan: {
    bg: "bg-cyan-500/20",
    text: "text-cyan-300",
    border: "border-cyan-500/50",
    hoverBg: "hover:bg-cyan-500/30",
    activeRing: "ring-cyan-400",
    card: "border-cyan-500/50 bg-cyan-500/10",
    current: "ring-2 ring-cyan-400/50",
    dot: "bg-cyan-400",
  },
  gray: {
    // Default/fallback color
    bg: "bg-slate-600/30",
    text: "text-slate-300",
    border: "border-slate-500/50",
    hoverBg: "hover:bg-slate-600/40",
    activeRing: "ring-slate-400",
    card: "border-slate-500/50 bg-slate-600/20",
    current: "ring-2 ring-slate-400/50",
    dot: "bg-slate-400",
  },
};

export const EVENT_COLOR_NAMES = Object.keys(EVENT_COLORS_STYLES).filter(
  (color) => color !== "gray"
);

export const DAYS_OF_WEEK_ABBREVIATED = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

export const CALENDAR_VIEW_MODES = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
] as const;
