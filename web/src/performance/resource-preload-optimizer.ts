// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

// Resource Preload Optimizer Implementation

import type {
  PreloadResource,
  PreloadValidationResult,
  PreloadMetrics
} from './types';
import { PRELOAD_DEFAULTS, ENV_DETECTION } from './constants';
import { SimpleEventEmitter } from '../utils/performance-utils';

export interface ResourcePreloadOptimizerConfig {
  maxUnusedTime: number;
  cleanupInterval: number;
  warningThreshold: number;
  enableOptimization: boolean;
  enableCleanup: boolean;
  enableValidation: boolean;
}

export class ResourcePreloadOptimizer extends SimpleEventEmitter {
  private config: ResourcePreloadOptimizerConfig;
  private preloadedResources: Map<string, PreloadResource> = new Map();
  private resourceMetrics: Map<string, PreloadMetrics> = new Map();
  private usageTracker: Map<string, { preloadTime: number; firstUseTime?: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;

  constructor(config: Partial<ResourcePreloadOptimizerConfig> = {}) {
    super();

    this.config = {
      maxUnusedTime: PRELOAD_DEFAULTS.MAX_UNUSED_TIME,
      cleanupInterval: PRELOAD_DEFAULTS.CLEANUP_INTERVAL,
      warningThreshold: PRELOAD_DEFAULTS.WARNING_THRESHOLD,
      enableOptimization: true,
      enableCleanup: true,
      enableValidation: true,
      ...config
    };

    this.initialize();
  }

  // ==================== Public Methods ====================

  validatePreloads(): PreloadValidationResult[] {
    if (!this.config.enableValidation || !ENV_DETECTION.IS_BROWSER) {
      return [];
    }

    const results: PreloadValidationResult[] = [];
    const preloadElements = document.querySelectorAll('link[rel="preload"]');

    preloadElements.forEach(element => {
      const link = element as HTMLLinkElement;
      const resource: PreloadResource = {
        url: link.href,
        as: link.as as any,
        priority: (link as any).fetchPriority || 'low',
        crossOrigin: link.crossOrigin as any,
        integrity: link.integrity
      };

      const validation = this.validateSinglePreload(resource, link);
      results.push(validation);
    });

    return results;
  }

  async optimizePreloadDirectives(): Promise<void> {
    if (!this.config.enableOptimization || !ENV_DETECTION.IS_BROWSER) {
      return;
    }

    const validationResults = this.validatePreloads();
    let optimizations = 0;

    for (const result of validationResults) {
      if (!result.isValid) {
        // Try to fix the preload directive
        const fixed = await this.fixPreloadDirective(result);
        if (fixed) {
          optimizations++;
        }
      }

      if (!result.used && this.shouldRemoveUnusedPreload(result)) {
        this.removePreloadDirective(result.resource.url);
        optimizations++;
      }
    }

    this.emit('preload:optimized', {
      totalChecked: validationResults.length,
      optimizations
    });
  }

  addPreload(resource: PreloadResource): void {
    if (!ENV_DETECTION.IS_BROWSER || !this.config.enableOptimization) {
      return;
    }

    // Validate the resource before adding
    const validation = this.validateSinglePreload(resource);
    if (!validation.isValid) {
      console.warn('Invalid preload resource:', validation.issues);
      return;
    }

    // Check if preload already exists
    if (this.preloadedResources.has(resource.url)) {
      return;
    }

    // Create the preload element
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.url;
    link.as = resource.as;

    if (resource.priority) {
      (link as any).fetchPriority = resource.priority;
    }

    if (resource.crossOrigin) {
      link.crossOrigin = resource.crossOrigin;
    }

    if (resource.integrity) {
      link.integrity = resource.integrity;
    }

    // Add timeout for unused preload detection
    if (resource.timeout) {
      setTimeout(() => {
        this.checkPreloadUsage(resource.url);
      }, resource.timeout);
    }

    // Add to head
    document.head.appendChild(link);

    // Track the resource
    this.preloadedResources.set(resource.url, resource);
    this.usageTracker.set(resource.url, { preloadTime: performance.now() });

    this.emit('preload:added', resource);
  }

  removeUnusedPreloads(): void {
    if (!ENV_DETECTION.IS_BROWSER || !this.config.enableCleanup) {
      return;
    }

    const now = performance.now();
    const removedResources: string[] = [];

    for (const [url, tracker] of this.usageTracker.entries()) {
      const timeSincePreload = now - tracker.preloadTime;

      // If preload hasn't been used and it's past the threshold
      if (!tracker.firstUseTime && timeSincePreload > this.config.maxUnusedTime) {
        this.removePreloadDirective(url);
        removedResources.push(url);
      }
    }

    if (removedResources.length > 0) {
      this.emit('preload:cleanup', { removedCount: removedResources.length });
    }
  }

  trackPreloadUsage(resourceUrl: string): void {
    const tracker = this.usageTracker.get(resourceUrl);
    if (tracker && !tracker.firstUseTime) {
      tracker.firstUseTime = performance.now();

      // Calculate metrics
      const timeToFirstUse = tracker.firstUseTime - tracker.preloadTime;
      const effectiveness = this.calculateEffectiveness(timeToFirstUse);

      const metrics: PreloadMetrics = {
        resourceUrl,
        preloadTime: tracker.preloadTime,
        firstUseTime: tracker.firstUseTime,
        timeToFirstUse,
        wastedBytes: 0, // Will be updated if we can measure it
        effectiveness
      };

      this.resourceMetrics.set(resourceUrl, metrics);
      this.emit('preload:used', metrics);
    }
  }

  getPreloadMetrics(): PreloadMetrics[] {
    return Array.from(this.resourceMetrics.values());
  }

  // ==================== Private Methods ====================

  private initialize(): void {
    if (!ENV_DETECTION.IS_BROWSER) {
      return;
    }

    // Start cleanup interval
    if (this.config.enableCleanup) {
      this.cleanupInterval = setInterval(() => {
        this.removeUnusedPreloads();
      }, this.config.cleanupInterval);
    }

    // Set up performance observer to track resource usage
    if (ENV_DETECTION.SUPPORTS_PERFORMANCE_OBSERVER) {
      this.setupResourceObserver();
    }

    // Scan existing preloads
    this.scanExistingPreloads();
  }

  private setupResourceObserver(): void {
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();

        for (const entry of entries) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.trackResourceLoad(resourceEntry);
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Failed to setup resource observer:', error);
    }
  }

  private scanExistingPreloads(): void {
    const preloadElements = document.querySelectorAll('link[rel="preload"]');

    preloadElements.forEach(element => {
      const link = element as HTMLLinkElement;
      const resource: PreloadResource = {
        url: link.href,
        as: link.as as any,
        priority: (link as any).fetchPriority || 'low'
      };

      this.preloadedResources.set(resource.url, resource);
      this.usageTracker.set(resource.url, { preloadTime: performance.now() });
    });
  }

  private validateSinglePreload(
    resource: PreloadResource,
    element?: HTMLLinkElement
  ): PreloadValidationResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let isValid = true;

    // Validate 'as' attribute
    const validAsValues = ['script', 'style', 'image', 'document', 'font', 'fetch'];
    if (!validAsValues.includes(resource.as)) {
      issues.push(`Invalid 'as' attribute: ${resource.as}`);
      suggestions.push(`Use one of: ${validAsValues.join(', ')}`);
      isValid = false;
    }

    // Validate URL
    try {
      new URL(resource.url);
    } catch {
      issues.push('Invalid URL format');
      isValid = false;
    }

    // Check for HTTPS
    if (resource.url.startsWith('http:') && location.protocol === 'https:') {
      issues.push('HTTP resource on HTTPS page may cause mixed content warnings');
      suggestions.push('Use HTTPS URL if available');
    }

    // Check for font preloads without crossorigin
    if (resource.as === 'font' && !resource.crossOrigin) {
      issues.push('Font preloads should include crossorigin attribute');
      suggestions.push('Add crossorigin="anonymous" for font preloads');
      isValid = false;
    }

    // Check if resource is actually used
    const used = this.isResourceUsed(resource.url);

    return {
      resource,
      isValid,
      issues,
      suggestions,
      used
    };
  }

  private async fixPreloadDirective(result: PreloadValidationResult): Promise<boolean> {
    const { resource, issues, suggestions } = result;
    const element = this.findPreloadElement(resource.url);

    if (!element) {
      return false;
    }

    let fixed = false;

    // Fix font crossorigin issue
    if (resource.as === 'font' && !resource.crossOrigin) {
      element.crossOrigin = 'anonymous';
      fixed = true;
    }

    // Fix invalid 'as' attribute for common cases
    if (issues.some(issue => issue.includes("Invalid 'as' attribute"))) {
      const correctedAs = this.guessCorrectAsAttribute(resource.url);
      if (correctedAs) {
        element.as = correctedAs;
        fixed = true;
      }
    }

    if (fixed) {
      this.emit('preload:fixed', { resource, fixes: suggestions });
    }

    return fixed;
  }

  private guessCorrectAsAttribute(url: string): string | null {
    const extension = url.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'js':
      case 'mjs':
        return 'script';
      case 'css':
        return 'style';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
        return 'image';
      case 'woff':
      case 'woff2':
      case 'ttf':
      case 'otf':
        return 'font';
      case 'html':
        return 'document';
      default:
        return null;
    }
  }

  private removePreloadDirective(url: string): void {
    const element = this.findPreloadElement(url);
    if (element) {
      element.remove();
    }

    this.preloadedResources.delete(url);
    this.usageTracker.delete(url);

    this.emit('preload:removed', { url });
  }

  private findPreloadElement(url: string): HTMLLinkElement | null {
    const preloadElements = document.querySelectorAll('link[rel="preload"]');

    for (const element of preloadElements) {
      const link = element as HTMLLinkElement;
      if (link.href === url) {
        return link;
      }
    }

    return null;
  }

  private isResourceUsed(url: string): boolean {
    // Check if resource is referenced in the document
    const scripts = document.querySelectorAll('script[src]');
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    const images = document.querySelectorAll('img[src]');

    // Check scripts
    for (const script of scripts) {
      if ((script as HTMLScriptElement).src === url) {
        return true;
      }
    }

    // Check stylesheets
    for (const stylesheet of stylesheets) {
      if ((stylesheet as HTMLLinkElement).href === url) {
        return true;
      }
    }

    // Check images
    for (const image of images) {
      if ((image as HTMLImageElement).src === url) {
        return true;
      }
    }

    // Check if tracked as used
    const tracker = this.usageTracker.get(url);
    return tracker ? !!tracker.firstUseTime : false;
  }

  private shouldRemoveUnusedPreload(result: PreloadValidationResult): boolean {
    if (result.used) {
      return false;
    }

    const tracker = this.usageTracker.get(result.resource.url);
    if (!tracker) {
      return true; // No tracking data, likely safe to remove
    }

    const timeSincePreload = performance.now() - tracker.preloadTime;
    return timeSincePreload > this.config.maxUnusedTime;
  }

  private trackResourceLoad(entry: PerformanceResourceTiming): void {
    const url = entry.name;

    // Track preload usage
    this.trackPreloadUsage(url);

    // Update metrics if this is a preloaded resource
    const metrics = this.resourceMetrics.get(url);
    if (metrics) {
      // Estimate wasted bytes (rough calculation)
      metrics.wastedBytes = entry.transferSize || 0;

      // Recalculate effectiveness
      if (metrics.timeToFirstUse !== undefined) {
        metrics.effectiveness = this.calculateEffectiveness(metrics.timeToFirstUse);
      }
    }
  }

  private calculateEffectiveness(timeToFirstUse: number): 'high' | 'medium' | 'low' | 'unused' {
    if (timeToFirstUse === undefined) {
      return 'unused';
    }

    if (timeToFirstUse < 1000) { // Less than 1 second
      return 'high';
    } else if (timeToFirstUse < 3000) { // Less than 3 seconds
      return 'medium';
    } else {
      return 'low';
    }
  }

  private checkPreloadUsage(url: string): void {
    const tracker = this.usageTracker.get(url);
    if (tracker && !tracker.firstUseTime) {
      const timeSincePreload = performance.now() - tracker.preloadTime;

      if (timeSincePreload > this.config.warningThreshold) {
        this.emit('preload:unused_warning', {
          url,
          timeSincePreload: Math.round(timeSincePreload)
        });
      }
    }
  }

  // ==================== Lifecycle ====================

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }

    this.preloadedResources.clear();
    this.resourceMetrics.clear();
    this.usageTracker.clear();

    this.removeAllListeners();
  }
}

// Default instance
export const resourcePreloadOptimizer = new ResourcePreloadOptimizer();