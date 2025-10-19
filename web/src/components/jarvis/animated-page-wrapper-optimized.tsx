"use client";
import type React from "react";
import { cn } from "~/lib/utils";
import { memo } from "react";

interface AnimatedPageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const AnimatedPageWrapperOptimized = memo(
  function AnimatedPageWrapperOptimized({
    children,
    className,
  }: AnimatedPageWrapperProps) {
    // Renderiza diretamente sem animações para evitar piscadas
    return <div className={cn("w-full", className)}>{children}</div>;
  }
);

export default AnimatedPageWrapperOptimized;
