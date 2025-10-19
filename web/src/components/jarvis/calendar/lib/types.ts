export interface CalendarEvent {
  id: string;
  title: string;
  subtitle?: string;
  time: string; // Formatted time string e.g., "9:00 AM"
  duration: number; // in hours
  color: "blue" | "green" | "purple" | "orange" | "red";
  category: "all" | "rotina" | "habitos" | "workout" | "lembretes";
  day: number; // 0-6 (Mon-Sun), derived from actual date, useful for week view column logic
  startHour: number; // 6-22 (6AM-10PM)
  date: string; // ISO string representation of the event's date and start time
}

export type CalendarViewMode = "day" | "week" | "month";
export type CalendarFilter =
  | "all"
  | "rotina"
  | "habitos"
  | "workout"
  | "lembretes";

// Refined NewEventData
export interface NewEventFormData {
  title: string;
  subtitle?: string;
  eventDate: string; // YYYY-MM-DD format for date input
  startHour: number;
  duration: number;
  color: CalendarEvent["color"];
  category: Exclude<CalendarFilter, "all">; // Exclui "all" pois não se atribui a um evento
}
