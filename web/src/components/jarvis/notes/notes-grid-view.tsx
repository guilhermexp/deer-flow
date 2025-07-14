"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { FileText, type LucideIcon } from "lucide-react"
import { FixedSizeGrid } from "react-window"
import { NoteCard } from "~/components/jarvis/notes/note-card"
import type { Note } from "~/app/(with-sidebar)/notes/page"

interface NotesGridViewProps {
  notes: Note[]
  allNotesCount: number
  onNoteClick: (note: Note) => void
  getSourceIcon: (source: string) => LucideIcon
  getSourceColor: (source: string) => string
}

const ROW_HEIGHT = 380 // Altura fixa para cada card/linha
const GAP_SIZE = 24 // Equivalente a gap-6 (1.5rem = 24px)

export function NotesGridView({
  notes,
  allNotesCount,
  onNoteClick,
  getSourceIcon,
  getSourceColor,
}: NotesGridViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [containerDimensions, setContainerDimensions] = React.useState({ width: 0, height: 0 })

  React.useLayoutEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.offsetWidth,
          height: window.innerHeight - (containerRef.current.offsetTop || 0) - 16, // 16px para pb-16
        })
      }
    }

    updateSize() // Initial size
    window.addEventListener("resize", updateSize)
    
    // Use ResizeObserver for more accurate container width changes
    let resizeObserver: ResizeObserver;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateSize)
      if (resizeObserver && containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    }
  }, [])

  const getColumnCount = (width: number): number => {
    if (width >= 1280) return 5 // xl
    if (width >= 1024) return 4 // lg
    if (width >= 768) return 3 // md
    if (width >= 640) return 2 // sm
    return 1 // default
  }

  const columnCount = getColumnCount(containerDimensions.width)
  const columnWidth = containerDimensions.width > 0 ? (containerDimensions.width - (columnCount - 1) * GAP_SIZE) / columnCount : 0
  const rowCount = Math.ceil(notes.length / columnCount)

  // eslint-disable-next-line react/display-name
  const Cell = React.memo(({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const index = rowIndex * columnCount + columnIndex
    if (index >= notes.length) {
      return null // Não renderizar células vazias
    }
    const note = notes[index]
    if (!note) {
      return null
    }

    // Ajustar o estilo para incluir o gap
    const cellStyle = {
      ...style,
      width: `${parseFloat(style.width as string) - (columnIndex === columnCount -1 ? 0 : GAP_SIZE)}px`, // Reduz a largura para o gap, exceto última coluna
      height: `${parseFloat(style.height as string) - GAP_SIZE}px`, // Reduz a altura para o gap
      paddingRight: `${columnIndex === columnCount - 1 ? 0 : GAP_SIZE}px`, // Adiciona padding para simular gap horizontal
      paddingBottom: `${GAP_SIZE}px`, // Adiciona padding para simular gap vertical
    }
    
    return (
      <div style={cellStyle}>
        <NoteCard
          note={note}
          index={index} // O index aqui é o global, não o da animação original
          onNoteClick={onNoteClick}
          getSourceIcon={getSourceIcon}
          getSourceColor={getSourceColor}
        />
      </div>
    )
  })


  if (notes.length === 0) {
    return (
      <main aria-label="Lista de notas" className="p-4 flex-grow flex items-center justify-center">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="text-gray-400 mb-6">
            <FileText className="h-16 w-16 mx-auto mb-6 opacity-40" />
            {allNotesCount === 0 ? (
              <>
                <p className="text-lg font-medium mb-2">Bem-vindo ao seu Second Brain!</p>
                <p className="text-sm mb-4">Comece adicionando seu primeiro conteúdo.</p>
                <p className="text-xs">Clique no botão + para adicionar YouTube, TikTok, PDFs e muito mais.</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium mb-2">Nenhuma nota encontrada</p>
                <p className="text-sm">Tente ajustar seus filtros ou termo de busca.</p>
              </>
            )}
          </div>
        </motion.div>
      </main>
    )
  }

  return (
    <main aria-label="Lista de notas" ref={containerRef} className="p-4 flex-grow" style={{ minHeight: 'calc(100vh - 100px)' }}> {/* Ajuste minHeight conforme necessário */}
      {containerDimensions.width > 0 && containerDimensions.height > 0 && (
        <FixedSizeGrid
          className="hide-scrollbar" // Classe para ocultar a barra de rolagem se necessário (definir em CSS global)
          columnCount={columnCount}
          columnWidth={columnWidth}
          height={containerDimensions.height}
          rowCount={rowCount}
          rowHeight={ROW_HEIGHT}
          width={containerDimensions.width}
          itemData={notes} // Opcional, mas pode ser útil se Cell precisar de mais dados
        >
          {Cell}
        </FixedSizeGrid>
      )}
    </main>
  )
}