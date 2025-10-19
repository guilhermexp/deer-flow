"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { FileText, Play, Clock, HardDrive, Youtube } from "lucide-react";
import { cn } from "~/lib/utils";
import { ThumbnailImage } from "./thumbnail-image";
import type { Note } from "~/app/(with-sidebar)/notes/page";

interface NoteCardProps {
  note: Note;
  index: number;
  onNoteClick: (note: Note) => void;
  getSourceIcon: (source: string) => React.ElementType;
  getSourceColor: (source: string) => string;
}

const NoteCardComponent: React.FC<NoteCardProps> = ({
  note,
  index,
  onNoteClick,
  getSourceIcon,
  getSourceColor,
}) => {
  const SourceIcon = getSourceIcon(note.source);

  // Debug log
  React.useEffect(() => {
    if (note.source === "YouTube") {
      console.log("📺 YouTube Note Card:", {
        id: note.id,
        title: note.title,
        mediaUrl: note.mediaUrl,
        youtubeId: note.youtubeId,
        mediaType: note.mediaType,
      });
    }
  }, [note]);

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
        className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-lg border-white/10 bg-white/[0.02] shadow-sm backdrop-blur-sm transition-all duration-150 hover:bg-white/[0.05] hover:shadow-lg"
        onClick={() => onNoteClick(note)}
        tabIndex={0}
        role="button"
        aria-label={`Abrir nota: ${note.title}`}
      >
        <figure className="relative aspect-[16/10] overflow-hidden bg-white/[0.05]">
          {note.mediaType === "file" ? (
            <div className="flex h-full items-center justify-center">
              <FileText className="h-16 w-16 text-gray-400 transition-transform duration-150 group-hover:scale-105" />
            </div>
          ) : note.source === "YouTube" && note.youtubeId ? (
            <ThumbnailImage
              src={`https://img.youtube.com/vi/${note.youtubeId}/hqdefault.jpg`}
              alt={note.title}
              youtubeId={note.youtubeId}
              className="transition-transform duration-150 group-hover:scale-105"
              fallbackSrc={`https://img.youtube.com/vi/${note.youtubeId}/default.jpg`}
            />
          ) : note.mediaUrl ? (
            <ThumbnailImage
              src={note.mediaUrl}
              alt={note.title}
              youtubeId={note.youtubeId}
              className="transition-transform duration-150 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white/[0.05] transition-transform duration-150 group-hover:scale-105">
              {note.source === "YouTube" ? (
                <Youtube className="h-16 w-16 text-red-400 opacity-50" />
              ) : (
                <span className="text-xs text-gray-400">{note.title}</span>
              )}
            </div>
          )}
          {note.mediaType === "video" && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-black/50 p-3 shadow-md transition-colors duration-150 group-hover:bg-black/70 sm:p-4">
                <Play className="h-6 w-6 fill-white text-white sm:h-8" />
              </div>
            </div>
          )}
          {note.duration && (
            <div className="absolute right-2 bottom-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold tracking-wide text-white shadow">
              {note.duration}
            </div>
          )}
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="absolute top-3 left-3 z-10"
          >
            <Badge
              variant="outline"
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm",
                getSourceColor(note.source)
              )}
            >
              <SourceIcon className="mr-1.5 h-3.5 w-3.5" />
              {note.source}
            </Badge>
          </motion.div>
        </figure>

        <CardContent className="flex flex-1 flex-col p-6">
          <header className="mb-1.5 flex items-center justify-between gap-2">
            <time className="text-xs font-medium tracking-wide text-gray-400 uppercase">
              {note.date}
            </time>
          </header>
          <h2 className="mb-1.5 line-clamp-2 text-base leading-snug font-semibold text-white transition-colors duration-150 group-hover:text-blue-400 sm:text-lg">
            {note.title}
          </h2>
          <p className="mb-3 line-clamp-2 text-xs leading-normal text-gray-400 sm:text-sm">
            {note.description}
          </p>
          {note.tags.length > 0 && (
            <ul className="mb-3 flex flex-wrap gap-1.5">
              {note.tags.slice(0, 2).map((tag, tagIndex) => (
                <li key={tagIndex}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer rounded-full border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400 transition-all duration-300 hover:bg-blue-500/20"
                  >
                    {tag}
                  </Badge>
                </li>
              ))}
              {note.tags.length > 2 && (
                <li>
                  <Badge
                    variant="outline"
                    className="rounded-full border-blue-500/40 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400"
                  >
                    +{note.tags.length - 2}
                  </Badge>
                </li>
              )}
            </ul>
          )}
          <footer className="mt-auto flex items-center gap-2 border-t border-white/10 pt-2 text-xs font-medium text-gray-400">
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
  );
};

export const NoteCard = React.memo(NoteCardComponent);
