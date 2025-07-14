/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import "./src/env.js";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import("next").NextConfig} */

// DeerFlow leverages **Turbopack** during development for faster builds and a smoother developer experience.
// However, in production, **Webpack** is used instead.
//
// This decision is based on the current recommendation to avoid using Turbopack for critical projects, as it
// is still evolving and may not yet be fully stable for production environments.

const config = {
  // For development mode
  turbopack: {
    rules: {
      "*.md": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },

  // For production mode
  webpack: (config) => {
    config.module.rules.push({
      test: /\.md$/,
      use: "raw-loader",
    });

    // Otimizações de performance
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Separar Chart.js em bundle próprio
          charts: {
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 20,
          },
          // Separar Framer Motion
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion|motion)[\\/]/,
            name: 'animations',
            chunks: 'all',
            priority: 20,
          },
          // Separar TipTap
          editor: {
            test: /[\\/]node_modules[\\/](@tiptap)[\\/]/,
            name: 'editor',
            chunks: 'all',
            priority: 20,
          },
          // Radix UI components
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui)[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };

    return config;
  },

  // ... rest of the configuration.
  output: "standalone",

  // Custom server configuration
  serverRuntimeConfig: {
    port: 4000,
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion", 
      "@radix-ui/react-accordion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
    ],
    // Pre-compile páginas mais usadas
    optimizeServerReact: true,
    // Faster builds em desenvolvimento
    turbo: {
      memoryLimit: 512,
    },
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "upgrade-insecure-requests",
          },
        ],
      },
    ];
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // Configurações de performance para desenvolvimento
  devIndicators: {
    buildActivity: true,
    buildActivityPosition: 'bottom-right',
  },
};

export default withNextIntl(config);
