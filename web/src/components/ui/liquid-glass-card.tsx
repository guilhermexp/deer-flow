import React from 'react';
import { cn } from '~/lib/utils';

interface LiquidGlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export const LiquidGlassCard: React.FC<LiquidGlassCardProps> = ({
  children,
  className
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-md",
        className
      )}
    >
      {children}
    </div>
  );
};

export default LiquidGlassCard;
