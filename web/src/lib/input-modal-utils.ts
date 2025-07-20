import {
  YoutubeIcon,
  InstagramIcon,
  TwitterIcon,
  FileImageIcon as PDFIcon,
  TextIcon as TXTIcon,
  TextIcon,
  BookMarkedIcon as MarkdownIcon,
  SectionIcon as ArticleIcon,
  LinkIcon as WebsiteIcon,
  VoicemailIcon as VoiceIcon,
  LockIcon as LoomIcon,
  VideoIcon,
} from "lucide-react"
import type React from "react"

import type { WebhookData } from "~/lib/webhook-service"

// Icon mapping for different content types
export const iconMapping: Record<string, React.ElementType> = {
  youtube: YoutubeIcon,
  tiktok: VideoIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  pdf: PDFIcon,
  txt: TXTIcon,
  text: TextIcon,
  markdown: MarkdownIcon,
  article: ArticleIcon,
  website: WebsiteIcon,
  audio: VoiceIcon,
  loom: LoomIcon,
}

// Icon color mapping
export const getIconColorClass = (type: string): string => {
  const colorMap: Record<string, string> = {
    youtube: "text-red-500",
    tiktok: "text-pink-500",
    instagram: "text-pink-500",
    twitter: "text-blue-400",
    pdf: "text-red-500",
    txt: "text-gray-400",
    text: "text-yellow-500",
    markdown: "text-purple-500",
    article: "text-emerald-500",
    website: "text-cyan-500",
    audio: "text-purple-500",
    loom: "text-blue-500",
  }
  return colorMap[type] ?? ""
}

// URL placeholders for different types
export const urlPlaceholders: Record<string, string> = {
  youtube: "URL do vídeo do YouTube (ex: https://youtube.com/watch?v=...)",
  tiktok: "URL do vídeo do TikTok (ex: https://tiktok.com/@user/video/...)",
  instagram: "URL do Reel do Instagram (ex: https://instagram.com/reel/...)",
  website: "URL do Website (ex: https://example.com)",
  loom: "URL do Loom (ex: https://loom.com/share/...)",
  article: "URL do Artigo (ex: https://medium.com/article-slug)",
}

// File accept attributes for different file types
export const getFileAcceptAttribute = (type: string): string => {
  const acceptMap: Record<string, string> = {
    pdf: ".pdf",
    txt: ".txt",
    markdown: ".md,.markdown",
    audio: "audio/*",
  }
  return acceptMap[type] ?? "*/*"
}

// Max file size for different types
export const getMaxFileSize = (type: string): string => {
  return type === "audio" ? "25MB" : "10MB"
}

// Validation for different input types
export interface ValidationResult {
  isValid: boolean
  webhookData: WebhookData
}

export const validateTwitterInput = (
  username: string,
  url: string,
  baseData: WebhookData
): ValidationResult => {
  if (!username) {
    return { isValid: false, webhookData: baseData }
  }
  return {
    isValid: true,
    webhookData: { ...baseData, username, url },
  }
}

export const validateUrlInput = (
  url: string,
  type: string,
  limitPages: boolean,
  baseData: WebhookData
): ValidationResult => {
  if (!url) {
    return { isValid: false, webhookData: baseData }
  }
  return {
    isValid: true,
    webhookData: {
      ...baseData,
      url,
      ...(type === "website" && { limitPages }),
    },
  }
}

export const validateFileInput = (
  file: File | null,
  baseData: WebhookData
): ValidationResult => {
  if (!file) {
    return { isValid: false, webhookData: baseData }
  }
  return {
    isValid: true,
    webhookData: { ...baseData, file },
  }
}

export const validateTextInput = (
  text: string,
  baseData: WebhookData
): ValidationResult => {
  if (!text) {
    return { isValid: false, webhookData: baseData }
  }
  return {
    isValid: true,
    webhookData: { ...baseData, text },
  }
}

// Check if submit button should be disabled
export const isSubmitDisabled = (
  type: string,
  isLoading: boolean,
  processStatus: string,
  {
    twitterUsername,
    inputValue,
    file,
    textInput,
  }: {
    twitterUsername: string
    inputValue: string
    file: File | null
    textInput: string
  }
): boolean => {
  if (isLoading || processStatus === "processing") {
    return true
  }

  if (processStatus !== "idle") {
    return false
  }

  switch (type) {
    case "twitter":
      return !twitterUsername
    case "youtube":
    case "tiktok":
    case "instagram":
    case "website":
    case "loom":
    case "article":
      return !inputValue
    case "pdf":
    case "txt":
    case "markdown":
    case "audio":
      return !file
    case "text":
      return !textInput
    default:
      return true
  }
}