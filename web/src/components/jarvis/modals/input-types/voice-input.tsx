"use client"

import React from "react"
import { ImageInput } from "./image-input"

interface VoiceInputProps {
  file: File | null
  onChange: (file: File | null) => void
  onFileNameChange?: (fileName: string) => void
}

// Voice input is essentially the same as file input but specifically for audio files
export const VoiceInput = React.memo(({ file, onChange, onFileNameChange }: VoiceInputProps) => {
  return (
    <ImageInput
      type="audio"
      file={file}
      onChange={onChange}
      onFileNameChange={onFileNameChange}
    />
  )
})

VoiceInput.displayName = "VoiceInput"