"use client"

import * as React from "react"
import { useState, useCallback, useMemo, lazy, Suspense } from "react"
import { motion } from "framer-motion"
import { Button } from "~/components/ui/button"
import { Plus, type LucideIcon } from "lucide-react"
import AnimatedPageWrapperOptimized from "~/components/jarvis/animated-page-wrapper-optimized"
import { NotesSearchBar } from "~/components/jarvis/notes/notes-search-bar"
import { NotesFilters } from "~/components/jarvis/notes/notes-filters"
import { NotesGridView } from "~/components/jarvis/notes/notes-grid-view"
import { cn } from "~/lib/utils"
import type { Note } from "~/app/(with-sidebar)/notes/page"
import type { WebhookResponse } from "~/lib/webhook-service"

// Lazy load modals
const AddContextModal = lazy(() => import("~/components/jarvis/modals/add-context-modal").then(mod => ({ default: mod.AddContextModal })))

interface OriginalData {
  url?: string
}

interface NotesListViewProps {
  notes: Note[]
  selectedNote: Note | null
  onNoteClick: (note: Note) => void
  onSaveContext: (contextType: string, webhookResponse: WebhookResponse & { originalData?: OriginalData }) => void
  getSourceIcon: (source: string) => LucideIcon
  getSourceColor: (source: string) => string
  className?: string
}

export function NotesListView({
  notes,
  onNoteClick,
  onSaveContext,
  getSourceIcon,
  getSourceColor,
  className
}: NotesListViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [isAddContextModalOpen, setIsAddContextModalOpen] = useState(false)

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const lowerSearchQuery = searchQuery.toLowerCase()
      const matchesSearch =
        note.title.toLowerCase().includes(lowerSearchQuery) ||
        note.tags.some((tag) => tag.toLowerCase().includes(lowerSearchQuery))
      const matchesFilter = activeFilter === "all" || note.source === activeFilter
      return matchesSearch && matchesFilter
    })
  }, [notes, searchQuery, activeFilter])

  const handleSaveContext = useCallback(async (contextType: string, webhookResponse: WebhookResponse & { originalData?: any }) => {
    await onSaveContext(contextType, webhookResponse)
    setIsAddContextModalOpen(false)
  }, [onSaveContext])

  return (
    <AnimatedPageWrapperOptimized className="min-h-full">
      <div className={cn("w-full pt-4", className)}>
        {/* Search Bar and Filter Section */}
        <section className="mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-4 items-center"
          >
            <NotesSearchBar 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <NotesFilters
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
          </motion.div>
        </section>

        {/* Notes Grid Section */}
        <NotesGridView
          notes={filteredNotes}
          allNotesCount={notes.length}
          onNoteClick={onNoteClick}
          getSourceIcon={getSourceIcon}
          getSourceColor={getSourceColor}
        />

        {/* Floating Action Button */}
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Button
            size="icon"
            onClick={() => setIsAddContextModalOpen(true)}
            className="h-12 w-12 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </motion.div>

        {/* Add Context Modal */}
        <Suspense fallback={null}>
          <AddContextModal
            isOpen={isAddContextModalOpen}
            onClose={() => setIsAddContextModalOpen(false)}
            onSave={handleSaveContext}
            sessionId="global-session"
            sessionData={{
              sessionId: "global-session",
              noteId: "none",
              createdAt: new Date().toISOString(),
              lastActivity: new Date().toISOString(),
              messageCount: 0,
              conversation: []
            }}
          />
        </Suspense>
      </div>
    </AnimatedPageWrapperOptimized>
  )
}