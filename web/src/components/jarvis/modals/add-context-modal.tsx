"use client"

import { useState } from "react"
import { X, Youtube, Twitter, Instagram, FileText, FileType, AlignLeft, Globe, Music, Loader, Film } from "lucide-react"
import { InputModal } from "./input-modal"
import { cn } from "~/lib/utils"
import { type WebhookResponse } from "~/lib/webhook-service"

interface AddContextModalProps {
  isOpen?: boolean
  onClose?: () => void
  onSave: (contextType: string, data: WebhookResponse & { originalData?: unknown }) => void
  sessionId?: string
  sessionData?: unknown
}

export const AddContextModal = ({
  isOpen = false,
  onClose,
  onSave,
  sessionId,
  sessionData,
}: AddContextModalProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [selectedOptionLabel, setSelectedOptionLabel] = useState<string>("")

  if (!isOpen) return null

  const options = [
    {
      icon: Youtube,
      label: "YouTube video",
      type: "youtube",
      gradient: "from-red-500 to-red-600", // Adjusted gradient for better theme fit
    },
    {
      icon: Film, // Changed to Film for TikTok
      label: "TikTok video",
      type: "tiktok",
      gradient: "from-purple-500 to-pink-500", // Adjusted
    },
    {
      icon: Twitter,
      label: "X (Twitter)",
      type: "twitter",
      gradient: "from-sky-500 to-blue-600", // Adjusted
    },
    {
      icon: Instagram,
      label: "Instagram Reel",
      type: "instagram",
      gradient: "from-fuchsia-500 to-pink-600", // Adjusted
    },
    {
      icon: FileText,
      label: "PDF",
      type: "pdf",
      gradient: "from-blue-500 to-indigo-600", // Adjusted
    },
    {
      icon: FileType,
      label: "TXT",
      type: "txt",
      gradient: "from-gray-500 to-gray-600", // Adjusted
    },
    {
      icon: AlignLeft,
      label: "Plain text",
      type: "text",
      gradient: "from-amber-400 to-yellow-500", // Adjusted
    },
    {
      icon: FileType, // Using FileType for Markdown, BoxIcon is too generic
      label: "Markdown",
      type: "markdown",
      gradient: "from-violet-500 to-purple-600", // Adjusted
    },
    {
      icon: FileText, // Using FileText for Article
      label: "Article",
      type: "article",
      gradient: "from-emerald-500 to-teal-600", // Adjusted
    },
    {
      icon: Globe,
      label: "Website",
      type: "website",
      gradient: "from-cyan-500 to-blue-600", // Adjusted
    },
    {
      icon: Music,
      label: "Voice",
      type: "audio",
      gradient: "from-purple-500 to-indigo-600", // Adjusted
    },
    {
      icon: Loader, // Consider a more specific icon if available, Loader is for loading state
      label: "Loom",
      type: "loom",
      gradient: "from-blue-500 to-cyan-600", // Adjusted
    },
  ]

  const handleOptionClick = (type: string, label: string) => {
    setSelectedOption(type)
    setSelectedOptionLabel(label)
  }

  const handleInputModalSave = (data: WebhookResponse, originalData: unknown) => {
    if (selectedOption) {
      // Adicionar os dados originais ao webhook response
      const enhancedData = {
        ...data,
        originalData
      }
      onSave(selectedOption, enhancedData)
    }
    setSelectedOption(null)
    if (onClose) onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div className="bg-white/[0.05] border border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-2xl relative shadow-2xl backdrop-blur-md">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
          <h2 className="text-white text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center sm:text-left">
            Adicionar Contexto
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {options.map((option) => (
              <div
                key={option.type}
                className={cn(
                  "group bg-white/[0.02] hover:bg-white/[0.05] backdrop-blur-sm border border-white/10 text-gray-100 rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all duration-150 hover:border-white/20 hover:scale-[1.03] hover:shadow-lg",
                  // Removed fixed height to allow content to define height
                )}
                onClick={() => handleOptionClick(option.type, option.label)}
              >
                <div
                  className={cn(
                    `bg-gradient-to-br ${option.gradient} p-2.5 rounded-xl shadow-md`,
                    "opacity-90 group-hover:opacity-100 transition-opacity duration-150 transform group-hover:scale-105",
                  )}
                >
                  <option.icon size={20} className="text-white" /> {/* Ensure icon color is visible */}
                </div>
                <span className="font-medium text-sm text-gray-400 group-hover:text-gray-100 transition-colors">
                  {option.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <InputModal
        isOpen={!!selectedOption}
        onClose={() => setSelectedOption(null)}
        onBack={() => setSelectedOption(null)}
        title={selectedOptionLabel ? `Adicionar ${selectedOptionLabel}` : "Adicionar Conteúdo"}
        type={selectedOption || ""}
        onSave={handleInputModalSave}
        sessionId={sessionId}
        sessionData={sessionData as any}
      />
    </>
  )
}
