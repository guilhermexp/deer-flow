// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

"use client";

import React, { createContext, useContext } from "react";

import { useAnimationControl } from "~/hooks/use-first-load";

interface AnimationContextValue {
  isFirstLoad: boolean;
  shouldAnimate: boolean;
  animationsEnabled: boolean;
  prefersReducedMotion: boolean;
}

const AnimationContext = createContext<AnimationContextValue | undefined>(
  undefined
);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const animationControl = useAnimationControl();

  return (
    <AnimationContext.Provider value={animationControl}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error("useAnimation must be used within AnimationProvider");
  }
  return context;
}

/**
 * Higher-order component to conditionally apply animations
 */
export function withAnimation<P extends object>(
  Component: React.ComponentType<P>,
  animatedProps: Partial<P>,
  staticProps?: Partial<P>
) {
  const AnimatedComponent = React.forwardRef<unknown, P>((props, ref) => {
    const { shouldAnimate } = useAnimation();
    const finalProps = shouldAnimate
      ? { ...props, ...animatedProps }
      : { ...props, ...staticProps };

    return <Component {...(finalProps as P)} ref={ref} />;
  });

  AnimatedComponent.displayName = `withAnimation(${Component.displayName ?? Component.name ?? "Component"})`;

  return AnimatedComponent;
}
