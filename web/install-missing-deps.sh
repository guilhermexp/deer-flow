#!/bin/bash
cd /Users/guilhermevarela/Public/FlowDeep/deer-flow/web

# Install missing dependencies
pnpm add @radix-ui/react-alert-dialog @radix-ui/react-avatar @radix-ui/react-progress chart.js date-fns react-chartjs-2 react-day-picker react-window uuid

# Install missing dev dependencies
pnpm add -D @types/dompurify @types/react-window @types/uuid

# Also add dompurify
pnpm add dompurify