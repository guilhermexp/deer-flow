"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { FileText, type LucideIcon } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { NoteCard } from "~/components/jarvis/notes/note-card";
import type { Note } from "~/app/(with-sidebar)/notes/page";

interface NotesGridViewProps {
  notes: Note[];
  allNotesCount: number;
  onNoteClick: (note: Note) => void;
  getSourceIcon: (source: string) => LucideIcon;
  getSourceColor: (source: string) => string;
}

const ROW_HEIGHT = 380; // Altura fixa para cada card/linha
const GAP_SIZE = 24; // Equivalente a gap-6 (1.5rem = 24px)

export function NotesGridView({
  notes,
  allNotesCount,
  onNoteClick,
  getSourceIcon,
  getSourceColor,
}: NotesGridViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = React.useState({
    width: 0,
    height: 0,
  });

  React.useLayoutEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.offsetWidth,
          height:
            window.innerHeight - (containerRef.current.offsetTop || 0) - 16, // 16px para pb-16
        });
      }
    };

    updateSize(); // Initial size
    window.addEventListener("resize", updateSize);

    // Use ResizeObserver for more accurate container width changes
    let resizeObserver: ResizeObserver;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateSize);
      if (resizeObserver && containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  const getColumnCount = (width: number): number => {
    if (width >= 1280) return 5; // xl
    if (width >= 1024) return 4; // lg
    if (width >= 768) return 3; // md
    if (width >= 640) return 2; // sm
    return 1; // default
  };

  const columnCount = getColumnCount(containerDimensions.width);
  const columnWidth =
    containerDimensions.width > 0
      ? (containerDimensions.width - (columnCount - 1) * GAP_SIZE) / columnCount
      : 0;

  const virtualizer = useVirtualizer({
    count: notes.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT + GAP_SIZE,
    overscan: 5,
  });

  if (notes.length === 0) {
    return (
      <main
        aria-label="Lista de notas"
        className="flex flex-grow items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center"
        >
          <div className="mb-6 text-gray-400">
            <FileText className="mx-auto mb-6 h-16 w-16 opacity-40" />
            {allNotesCount === 0 ? (
              <>
                <p className="mb-2 text-lg font-medium">
                  Bem-vindo ao seu Second Brain!
                </p>
                <p className="mb-4 text-sm">
                  Comece adicionando seu primeiro conteúdo.
                </p>
                <p className="text-xs">
                  Clique no botão + para adicionar YouTube, TikTok, PDFs e muito
                  mais.
                </p>
              </>
            ) : (
              <>
                <p className="mb-2 text-lg font-medium">
                  Nenhuma nota encontrada
                </p>
                <p className="text-sm">
                  Tente ajustar seus filtros ou termo de busca.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main
      aria-label="Lista de notas"
      ref={containerRef}
      className="flex-grow overflow-auto p-4"
      style={{ minHeight: "calc(100vh - 100px)" }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const note = notes[virtualItem.index];
          if (!note) return null;

          return (
            <div
              key={note.id}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                display: "grid",
                gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                gap: `${GAP_SIZE}px`,
                paddingBottom: `${GAP_SIZE}px`,
              }}
            >
              <NoteCard
                note={note}
                index={virtualItem.index}
                onNoteClick={onNoteClick}
                getSourceIcon={getSourceIcon}
                getSourceColor={getSourceColor}
              />
            </div>
          );
        })}
      </div>
    </main>
  );
}
