"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { FileText, Play, Clock, HardDrive, Youtube } from "lucide-react"
import { cn } from "~/lib/utils"
import { ThumbnailImage } from "./thumbnail-image"
import type { Note } from "~/app/(with-sidebar)/notes/page"

interface NoteCardProps {
  note: Note
  index: number
  onNoteClick: (note: Note) => void
  getSourceIcon: (source: string) => React.ElementType
  getSourceColor: (source: string) => string
}

const NoteCardComponent: React.FC<NoteCardProps> = ({ note, index, onNoteClick, getSourceIcon, getSourceColor }) => {
  const SourceIcon = getSourceIcon(note.source)
  
  // Debug log
  React.useEffect(() => {
    if (note.source === "YouTube") {
      console.log('📺 YouTube Note Card:', { 
        id: note.id,
        title: note.title, 
        mediaUrl: note.mediaUrl, 
        youtubeId: note.youtubeId,
        mediaType: note.mediaType
      })
    }
  }, [note])

  return (
    <motion.article
      key={note.id} // A chave deve estar no elemento mais externo do map, mas é bom ter aqui também
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Card
        className="group relative flex flex-col h-full rounded-lg shadow-sm hover:shadow-lg transition-all duration-150 cursor-pointer overflow-hidden bg-white/[0.02] border-white/10 hover:bg-white/[0.05] backdrop-blur-sm"
        onClick={() => onNoteClick(note)}
        tabIndex={0}
        role="button"
        aria-label={`Abrir nota: ${note.title}`}
      >
        <figure className="relative aspect-[16/10] overflow-hidden bg-white/[0.05]">
          {note.mediaType === "file" ? (
            <div className="flex items-center justify-center h-full">
              <FileText className="h-16 w-16 text-gray-400 group-hover:scale-105 transition-transform duration-150" />
            </div>
          ) : note.source === "YouTube" && note.youtubeId ? (
            <ThumbnailImage
              src={`https://img.youtube.com/vi/${note.youtubeId}/hqdefault.jpg`}
              alt={note.title}
              youtubeId={note.youtubeId}
              className="group-hover:scale-105 transition-transform duration-150"
              fallbackSrc={`https://img.youtube.com/vi/${note.youtubeId}/default.jpg`}
            />
          ) : note.mediaUrl ? (
            <ThumbnailImage
              src={note.mediaUrl}
              alt={note.title}
              youtubeId={note.youtubeId}
              className="group-hover:scale-105 transition-transform duration-150"
            />
          ) : (
            <div className="w-full h-full bg-white/[0.05] flex items-center justify-center group-hover:scale-105 transition-transform duration-150">
              {note.source === "YouTube" ? (
                <Youtube className="h-16 w-16 text-red-400 opacity-50" />
              ) : (
                <span className="text-gray-400 text-xs">{note.title}</span>
              )}
            </div>
          )}
          {note.mediaType === "video" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/50 rounded-full p-3 sm:p-4 group-hover:bg-black/70 transition-colors duration-150 shadow-md">
                <Play className="h-6 w-6 sm:h-8 text-white fill-white" />
              </div>
            </div>
          )}
          {note.duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-semibold shadow tracking-wide">
              {note.duration}
            </div>
          )}
          <motion.div whileHover={{ scale: 1.08 }} className="absolute top-3 left-3 z-10">
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm",
                getSourceColor(note.source),
              )}
            >
              <SourceIcon className="h-3.5 w-3.5 mr-1.5" />
              {note.source}
            </Badge>
          </motion.div>
        </figure>

        <CardContent className="flex flex-col flex-1 p-6">
          <header className="mb-1.5 flex items-center justify-between gap-2">
            <time className="text-xs text-gray-400 font-medium tracking-wide uppercase">{note.date}</time>
          </header>
          <h2 className="font-semibold text-base sm:text-lg leading-snug text-white mb-1.5 line-clamp-2 group-hover:text-blue-400 transition-colors duration-150">
            {note.title}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mb-3 line-clamp-2 leading-normal">
            {note.description}
          </p>
          {note.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5 mb-3">
              {note.tags.slice(0, 2).map((tag, tagIndex) => (
                <li key={tagIndex}>
                  <Badge
                    variant="outline"
                    className="rounded-full text-xs px-2 py-0.5 border-blue-500/40 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all duration-300 cursor-pointer font-medium"
                  >
                    {tag}
                  </Badge>
                </li>
              ))}
              {note.tags.length > 2 && (
                <li>
                  <Badge variant="outline" className="rounded-full text-xs px-2 py-0.5 border-blue-500/40 text-blue-400 bg-blue-500/10 font-medium">
                    +{note.tags.length - 2}
                  </Badge>
                </li>
              )}
            </ul>
          )}
          <footer className="flex items-center gap-2 text-xs text-gray-400 font-medium mt-auto pt-2 border-t border-white/10">
            {note.duration ? (
              <>
                <Clock className="h-3.5 w-3.5" />
                <span>{note.duration}</span>
              </>
            ) : note.fileSize ? (
              <>
                <HardDrive className="h-3.5 w-3.5" />
                <span>{note.fileSize}</span>
              </>
            ) : (
              <div className="h-[1.125rem]" /> /* Placeholder for consistent height */
            )}
          </footer>
        </CardContent>
      </Card>
    </motion.article>
  )
}

export const NoteCard = React.memo(NoteCardComponent)
