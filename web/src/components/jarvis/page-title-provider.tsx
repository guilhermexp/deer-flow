"use client"

import type { ReactNode } from "react"

interface PageTitleProviderProps {
  userName?: string
  children: ReactNode
  toggleCommandPalette?: () => void
}

export default function PageTitleProvider({
  children,
}: PageTitleProviderProps) {
  return children
} 