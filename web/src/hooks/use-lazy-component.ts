// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useEffect, useState, useRef } from "react";
import type { ComponentType } from "react";

/**
 * Hook to lazy load components with better performance
 * Loads component after initial render to prevent blocking
 */
export function useLazyComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  delay = 0
) {
  const [Component, setComponent] = useState<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Load component after delay
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        void importFn().then((module) => {
          setComponent(() => module.default);
        });
      }, delay);
    } else {
      // Load immediately if no delay
      requestIdleCallback(
        () => {
          void importFn().then((module) => {
            setComponent(() => module.default);
          });
        },
        { timeout: 100 }
      );
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay, importFn]);

  return Component;
}

/**
 * Preload a dynamic component without rendering it
 */
export function preloadComponent(importFn: () => Promise<unknown>) {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    requestIdleCallback(
      () => {
        void importFn();
      },
      { timeout: 2000 }
    );
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      void importFn();
    }, 100);
  }
}
