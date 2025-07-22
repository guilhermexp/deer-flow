"use client"

import React, { useState } from "react"
import Image from "next/image"
import { cn } from "~/lib/utils"

interface ThumbnailImageProps {
  src: string
  alt: string
  youtubeId?: string
  className?: string
  fallbackSrc?: string
}

export const ThumbnailImage: React.FC<ThumbnailImageProps> = ({
  src,
  alt,
  youtubeId,
  className,
  fallbackSrc
}) => {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [hasError, setHasError] = useState(false)
  
  // Debug log
  React.useEffect(() => {
    console.log('🖼️ ThumbnailImage:', { src, alt, youtubeId, currentSrc })
  }, [src, alt, youtubeId, currentSrc])

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      
      // Fallback específico para YouTube com múltiplas qualidades
      if (youtubeId && currentSrc.includes('maxresdefault')) {
        setCurrentSrc(`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`)
        return
      }
      
      if (youtubeId && currentSrc.includes('hqdefault')) {
        setCurrentSrc(`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`)
        return
      }
      
      if (youtubeId && currentSrc.includes('mqdefault')) {
        setCurrentSrc(`https://img.youtube.com/vi/${youtubeId}/default.jpg`)
        return
      }
      
      // Fallback geral customizado
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc)
        return
      }
      
      // Se nada funcionar, não mostrar imagem (será tratado pelo CSS)
      setCurrentSrc("")
    }
  }

  return (
    <div
      className={cn(
        "relative w-full h-full bg-cover bg-center bg-muted/30 flex items-center justify-center",
        className
      )}
    >
      {/* Imagem otimizada */}
      {currentSrc && (
        <Image
          src={currentSrc}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover rounded-lg"
          onError={handleError}
          priority
          unoptimized={currentSrc.includes('youtube.com')}
        />
      )}
      
      {/* Fallback visual quando não há imagem */}
      {!currentSrc && (
        <span className="text-muted-foreground text-xs text-center px-2">
          {alt}
        </span>
      )}
    </div>
  )
} 