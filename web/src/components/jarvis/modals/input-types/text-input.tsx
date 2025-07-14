"use client"

import React from "react"
import { Textarea } from "~/components/ui/textarea"

interface TextInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const TextInput = React.memo(({ value, onChange, placeholder }: TextInputProps) => {
  return (
    <Textarea
      placeholder={placeholder || "Digite seu texto aqui..."}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-[160px] resize-none bg-white/[0.05] border-white/10 text-gray-100 placeholder:text-gray-500 focus:border-white/20"
    />
  )
})

TextInput.displayName = "TextInput"