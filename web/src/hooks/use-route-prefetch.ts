// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Hook to prefetch commonly used routes to improve navigation speed
 */
export function useRoutePrefetch(routes?: string[]) {
  const router = useRouter();

  useEffect(() => {
    if (!routes || routes.length === 0) return;

    // Prefetch immediately on next tick without delay
    const prefetchRoutes = () => {
      routes.forEach((route) => {
        router.prefetch(route);
      });
    };

    // Use requestIdleCallback for non-blocking prefetch
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(prefetchRoutes);
      return () => cancelIdleCallback(id);
    } else {
      // Fallback to immediate execution
      prefetchRoutes();
    }
  }, [router, routes]);
}

/**
 * Prefetch common app routes
 */
export function useCommonRoutePrefetch() {
  useRoutePrefetch(["/chat", "/settings", "/jarvis"]);
}
