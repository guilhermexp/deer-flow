// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useEffect, useState } from "react";

const FIRST_LOAD_KEY = "deerflow_first_load_complete";

/**
 * Hook to detect if this is the user's first page load in this session
 * and manage animation states accordingly
 */
export function useFirstLoad() {
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(false);

  useEffect(() => {
    // Check if user has completed first load in this session
    const hasLoadedBefore = sessionStorage.getItem(FIRST_LOAD_KEY);

    if (hasLoadedBefore) {
      setIsFirstLoad(false);
      setAnimationsEnabled(true);
    } else {
      // Mark as loaded after a short delay to ensure smooth initial render
      const timer = setTimeout(() => {
        sessionStorage.setItem(FIRST_LOAD_KEY, "true");
        setIsFirstLoad(false);
        // Enable animations after first load completes
        setTimeout(() => setAnimationsEnabled(true), 100);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  return { isFirstLoad, animationsEnabled };
}

/**
 * Hook to check if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Combined hook for animation control
 */
export function useAnimationControl() {
  const { isFirstLoad, animationsEnabled } = useFirstLoad();
  const prefersReducedMotion = usePrefersReducedMotion();

  return {
    isFirstLoad,
    shouldAnimate: animationsEnabled && !prefersReducedMotion,
    animationsEnabled,
    prefersReducedMotion,
  };
}
