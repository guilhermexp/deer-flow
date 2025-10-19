// Traduzido para Português
export function minutesToAngle(
  minutes: number,
  totalMinutesInDay: number = 24 * 60
): number {
  const normalizedMinutes =
    ((minutes % totalMinutesInDay) + totalMinutesInDay) % totalMinutesInDay;
  const angle = (normalizedMinutes / totalMinutesInDay) * 360;
  return (angle - 90 + 360) % 360;
}

export function angleToMinutes(
  angle: number,
  totalMinutesInDay: number = 24 * 60
): number {
  const normalizedAngle = (angle + 90 + 360) % 360;
  const minutes = Math.round((normalizedAngle / 360) * totalMinutesInDay);
  return minutes % totalMinutesInDay;
}

export function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  // Formato de 24h é mais comum em PT-BR para horários precisos, mas AM/PM também é entendido.
  // Vou manter o formato HH:MM e adicionar AM/PM para clareza, mas poderia ser ajustado.
  // Para PT-BR puro, seria `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

export function formatDuration(
  totalMinutes: number,
  shortForm = false
): string {
  if (totalMinutes < 0) return "N/A";
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (shortForm) {
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`.trim();
  }
  return `${hours} hora${hours !== 1 ? "s" : ""}${mins > 0 ? ` ${mins} minuto${mins !== 1 ? "s" : ""}` : ""}`.trim();
}

export function createArcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
  const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
  const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
  const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

  let angleDiff = endAngle - startAngle;
  if (angleDiff < 0) angleDiff += 360;
  const largeArcFlag = angleDiff > 180 ? 1 : 0;

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
}

export function calculateSleepDuration(
  bedTimeMinutes: number,
  wakeTimeMinutes: number
): { hours: number; minutes: number; totalMinutes: number } {
  let duration = wakeTimeMinutes - bedTimeMinutes;
  if (duration < 0) {
    duration += 24 * 60;
  }
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return { hours, minutes, totalMinutes: duration };
}

// Nomes dos dias abreviados e completos em Português
export const DAY_NAMES_ABBR = ["S", "T", "Q", "Q", "S", "S", "D"]; // Segunda, Terça, Quarta, Quinta, Sexta, Sábado, Domingo
export const FULL_DAY_NAMES_PT = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];
