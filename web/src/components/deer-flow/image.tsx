// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { memo, useCallback, useEffect, useState } from "react";

import { cn } from "~/lib/utils";

import { Tooltip } from "./tooltip";

function Image({
  className,
  imageClassName,
  imageTransition,
  src,
  alt,
  fallback = null,
}: {
  className?: string;
  imageClassName?: string;
  imageTransition?: boolean;
  src: string;
  alt: string;
  fallback?: React.ReactNode;
}) {
  const [, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Filter out invalid URLs early
  const isValidUrl = useCallback((url: string) => {
    if (!url) return false;

    // Skip x-raw-image URLs (internal browser URLs)
    if (url.startsWith("x-raw-image://")) return false;

    // Skip malformed URLs
    try {
      new URL(url);
      return true;
    } catch {
      // Try to handle relative URLs
      if (url.startsWith("/") || url.startsWith("./")) {
        return true;
      }
      return false;
    }
  }, []);

  useEffect(() => {
    if (!isValidUrl(src)) {
      setIsError(true);
      setIsLoading(false);
      return;
    }
    setIsError(false);
    setIsLoading(true);
  }, [src, isValidUrl]);

  const handleLoad = useCallback(() => {
    setIsError(false);
    setIsLoading(false);
  }, []);

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.style.display = "none";
      // Only log for valid URLs that failed to load
      if (isValidUrl(e.currentTarget.src)) {
        console.warn(`Markdown: Image "${e.currentTarget.src}" failed to load`);
      }
      setIsError(true);
    },
    [isValidUrl]
  );
  return (
    <span className={cn("block w-fit overflow-hidden", className)}>
      {isError || !src ? (
        fallback
      ) : (
        <Tooltip title={alt ?? "No caption"}>
          <img
            className={cn(
              "size-full object-cover",
              imageTransition && "transition-all duration-200 ease-out",
              imageClassName
            )}
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
          />
        </Tooltip>
      )}
    </span>
  );
}

export default memo(Image);
