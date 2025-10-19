"use client";
import { useState, useCallback, useMemo } from "react";

export const useCalendarDateNavigation = (initialDate: Date = new Date()) => {
  const [currentDate, setCurrentDate] = useState(initialDate); // Dia/semana atual
  const [monthDisplayDate, setMonthDisplayDate] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1) // Mês atual para visualização de mês
  );

  const handleGoToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setMonthDisplayDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }, []);

  const navigateDay = useCallback((direction: "next" | "prev") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  }, []);

  const navigateWeek = useCallback((direction: "next" | "prev") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === "next" ? 7 : -7));
      return newDate;
    });
  }, []);

  const navigateMonth = useCallback((direction: "next" | "prev") => {
    setMonthDisplayDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  }, []);

  const startOfWeekDate = useMemo(() => {
    const date = new Date(currentDate);
    const dayOfWeek = date.getDay(); // Sunday is 0, Monday is 1
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [currentDate]);

  const daysInWeekViewArray = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(startOfWeekDate);
      day.setDate(startOfWeekDate.getDate() + i);
      return day;
    });
  }, [startOfWeekDate]);

  return {
    currentDate,
    setCurrentDate, // Expor para casos onde a data precisa ser setada diretamente (ex: ao clicar num dia do mês)
    monthDisplayDate,
    setMonthDisplayDate,
    handleGoToToday,
    navigateDay,
    navigateWeek,
    navigateMonth,
    startOfWeekDate,
    daysInWeekViewArray,
  };
};
