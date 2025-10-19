import { Youtube, Instagram, Music, ImageIcon, FileText } from "lucide-react";

import { type Note } from "~/app/(with-sidebar)/notes/page";
import { type WebhookResponse } from "~/lib/webhook-service";

// Storage constants
export const NOTES_STORAGE_KEY = "jarvis-notes";

// Load notes from localStorage
export const loadNotesFromStorage = (): Note[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Erro ao carregar notas do localStorage:", error);
    return [];
  }
};

// Save notes to localStorage
export const saveNotesToStorage = (notes: Note[]) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
  } catch (error) {
    console.error("Erro ao salvar notas no localStorage:", error);
  }
};

// Get source color based on note source
export const getSourceColor = (source: string) => {
  switch (source) {
    case "YouTube":
      return "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/15 hover:border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30";
    case "Instagram":
      return "bg-pink-500/10 text-pink-700 border-pink-500/20 hover:bg-pink-500/15 hover:border-pink-500/30 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/30";
    case "TikTok":
      return "bg-purple-500/10 text-purple-700 border-purple-500/20 hover:bg-purple-500/15 hover:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30";
    case "Imagens":
      return "bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/15 hover:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30";
    case "Arquivos":
      return "bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/15 hover:border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30";
    default:
      return "bg-gray-500/10 text-gray-700 border-gray-500/20 hover:bg-gray-500/15 hover:border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/30";
  }
};

// Get source icon based on note source
export const getSourceIcon = (source: string) => {
  switch (source) {
    case "YouTube":
      return Youtube;
    case "Instagram":
      return Instagram;
    case "TikTok":
      return Music;
    case "Imagens":
      return ImageIcon;
    case "Arquivos":
      return FileText;
    default:
      return FileText;
  }
};

// Map content type to source
export const getSourceFromType = (type: string): Note["source"] => {
  const typeToSource: Record<string, Note["source"]> = {
    youtube: "YouTube",
    instagram: "Instagram",
    tiktok: "TikTok",
    pdf: "Arquivos",
    txt: "Arquivos",
    markdown: "Arquivos",
    audio: "Arquivos",
    text: "Arquivos",
    website: "Arquivos",
    article: "Arquivos",
    loom: "Arquivos",
    twitter: "Arquivos",
  };
  return typeToSource[type] ?? "Arquivos";
};

// Map content type to media type
export const getMediaTypeFromSource = (type: string): Note["mediaType"] => {
  const videoTypes = ["youtube", "tiktok", "instagram", "loom"];
  return videoTypes.includes(type) ? "video" : "file";
};

// Extract real thumbnail based on content type
export const extractRealThumbnail = (
  contextType: string,
  originalUrl: string,
  youtubeId?: string
): string => {
  switch (contextType) {
    case "youtube":
      if (youtubeId) {
        // Usar hqdefault como padrão pois sempre existe
        return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
      }
      return "";

    case "tiktok":
      // Para TikTok, vamos extrair o ID do vídeo e usar a API de thumbnail
      const tiktokMatch = /tiktok\.com\/@[^/]+\/video\/(\d+)/.exec(originalUrl);
      if (tiktokMatch) {
        // TikTok não tem API pública, mas podemos tentar alguns padrões
        return `https://p16-sign-va.tiktokcdn.com/obj/tos-maliva-p-0068/oEIfAWGgAEqrJdIyDHHFBCDCqhcDEBKdGgMCJB?x-expires=1640995200&x-signature=example`;
      }
      return "";

    case "instagram":
      // Instagram Reel - extrair ID e usar oEmbed
      const instaMatch = /instagram\.com\/(reel|p)\/([A-Za-z0-9_-]+)/.exec(
        originalUrl
      );
      if (instaMatch) {
        // Usar serviço de proxy para extrair thumbnail
        return `https://api.instagram.com/oembed/?url=${encodeURIComponent(originalUrl)}`;
      }
      return "";

    case "twitter":
      // Twitter/X - usar oEmbed API
      if (
        originalUrl.includes("twitter.com") ||
        originalUrl.includes("x.com")
      ) {
        return `https://publish.twitter.com/oembed?url=${encodeURIComponent(originalUrl)}`;
      }
      return "";

    case "loom":
      // Loom - extrair ID do vídeo
      const loomMatch = /loom\.com\/share\/([a-zA-Z0-9]+)/.exec(originalUrl);
      if (loomMatch) {
        return `https://cdn.loom.com/sessions/thumbnails/${loomMatch[1]}-00001.jpg`;
      }
      return "";

    case "website":
    case "article":
      // Para websites e artigos, usar serviço de screenshot
      return `https://api.screenshotone.com/take?access_key=demo&url=${encodeURIComponent(originalUrl)}&viewport_width=1200&viewport_height=630&image_quality=80&format=jpg`;

    case "pdf":
    case "txt":
    case "markdown":
    case "text":
    case "audio":
      // Para arquivos sem thumbnail visual, retornar vazio para usar ícone
      return "";

    default:
      return "";
  }
};

// Format webhook text for display
export const formatWebhookText = (text: string): React.ReactNode => {
  if (!text) return null;

  // Remover asteriscos duplos e simples
  const processedText = text
    .replace(/\*\*/g, "") // Remove **
    .replace(/\*/g, "") // Remove *
    .replace(/#{1,6}\s/g, "") // Remove # ## ### etc
    .replace(/`/g, "") // Remove backticks
    .replace(/___/g, "") // Remove underscores
    .replace(/---/g, "━━━━━━━━━━"); // Substitui --- por linha

  // Dividir por linhas para processar cada uma
  const lines = processedText.split("\n");

  return lines.map((line, index) => {
    const trimmedLine = line.trim();

    // Pular linhas vazias
    if (!trimmedLine) return <br key={index} />;

    // Detectar padrões de título (linhas que terminam com :)
    if (trimmedLine.endsWith(":") && trimmedLine.length < 50) {
      return (
        <h3
          key={index}
          className="text-primary mt-4 mb-2 text-lg font-semibold"
        >
          {trimmedLine}
        </h3>
      );
    }

    // Detectar seções importantes (Informações, Resumo, etc)
    if (
      trimmedLine.toLowerCase().includes("informações") ||
      trimmedLine.toLowerCase().includes("resumo") ||
      trimmedLine.toLowerCase().includes("conteúdo") ||
      trimmedLine.toLowerCase().includes("detalhado")
    ) {
      return (
        <div key={index} className="section-title mt-6 mb-3">
          {trimmedLine}
        </div>
      );
    }

    // Detectar numeração (1. 2. etc)
    if (/^\d+\./.test(trimmedLine)) {
      return (
        <div key={index} className="mb-2 ml-4">
          <span className="text-primary mr-2 font-medium">
            {/^\d+\./.exec(trimmedLine)?.[0]}
          </span>
          <span className="text-muted-foreground">
            {trimmedLine.replace(/^\d+\.\s*/, "")}
          </span>
        </div>
      );
    }

    // Detectar bullets (- no início)
    if (trimmedLine.startsWith("-")) {
      return (
        <div key={index} className="mb-1 ml-6 flex items-start">
          <span className="text-primary mr-2">•</span>
          <span className="text-muted-foreground flex-1">
            {trimmedLine.substring(1).trim()}
          </span>
        </div>
      );
    }

    // Detectar campos específicos (Título:, Canal:, etc)
    if (trimmedLine.includes(":") && trimmedLine.indexOf(":") < 20) {
      const [label, ...valueParts] = trimmedLine.split(":");
      const value = valueParts.join(":").trim();
      if (value) {
        return (
          <div key={index} className="mb-2 flex flex-wrap items-start gap-2">
            <span className="text-primary/80 min-w-fit font-medium">
              {label}:
            </span>
            <span className="text-muted-foreground flex-1">{value}</span>
          </div>
        );
      }
    }

    // Detectar linhas separadoras
    if (trimmedLine === "━━━━━━━━━━") {
      return <hr key={index} className="border-border/50 my-4" />;
    }

    // Texto normal
    return (
      <p key={index} className="text-muted-foreground mb-2 leading-relaxed">
        {trimmedLine}
      </p>
    );
  });
};

// Create new note from webhook response
export const createNoteFromWebhook = (
  contextType: string,
  webhookResponse: WebhookResponse & { originalData?: { url?: string } }
): Note => {
  // Debugging logs
  console.log("🔍 createNoteFromWebhook - Input data:", {
    contextType,
    webhookResponse,
    hasSuccess: webhookResponse.success,
    summary: webhookResponse.summary,
    resumo: webhookResponse.resumo,
    transcript: webhookResponse.transcript,
    transcricao: webhookResponse.transcricao,
    title: webhookResponse.title,
    titulo: webhookResponse.titulo,
  });

  const originalUrl = webhookResponse.originalData?.url ?? "";

  // Extract YouTube ID if it's a YouTube video
  let youtubeId: string | undefined;
  if (contextType === "youtube" && originalUrl) {
    // Suporta múltiplos formatos de URLs do YouTube
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#\/]+)/,
      /youtube\.com\/shorts\/([^&\n?#\/]+)/,
      /m\.youtube\.com\/watch\?v=([^&\n?#\/]+)/,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(originalUrl);
      if (match) {
        youtubeId = match[1];
        break;
      }
    }

    console.log("🎥 YouTube ID extraction:", { originalUrl, youtubeId });
  }

  // Extract thumbnail
  let thumbnailUrl = "";
  if (webhookResponse.thumbnail) {
    thumbnailUrl = webhookResponse.thumbnail;
  } else if (youtubeId) {
    // Para YouTube, sempre usar a thumbnail do YouTube
    thumbnailUrl = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  } else {
    thumbnailUrl = extractRealThumbnail(contextType, originalUrl, youtubeId);
  }

  console.log("🖼️ Thumbnail extraction:", {
    contextType,
    hasWebhookThumbnail: !!webhookResponse.thumbnail,
    youtubeId,
    thumbnailUrl,
  });

  // Extract AI summary and transcript with debugging
  const aiSummary = webhookResponse.summary ?? webhookResponse.resumo ?? "";
  const transcript =
    webhookResponse.transcript ?? webhookResponse.transcricao ?? "";

  console.log("📝 createNoteFromWebhook - Extracted content:", {
    aiSummary: aiSummary ? `${aiSummary.substring(0, 100)}...` : "EMPTY",
    transcript: transcript ? `${transcript.substring(0, 100)}...` : "EMPTY",
    aiSummaryLength: aiSummary.length,
    transcriptLength: transcript.length,
  });

  const newNote: Note = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title:
      webhookResponse.title ??
      webhookResponse.titulo ??
      `Nova Nota - ${contextType}`,
    description:
      (webhookResponse as any).description ??
      "Nota processada automaticamente via IA",
    source: getSourceFromType(contextType),
    date: new Date().toLocaleDateString("pt-BR"),
    tags: [contextType],
    mediaType: getMediaTypeFromSource(contextType),
    mediaUrl: thumbnailUrl,
    youtubeId: youtubeId,
    aiSummary,
    transcript,
    podcastContent: "",
    duration: (webhookResponse as any).duration,
    fileSize: (webhookResponse as any).fileSize,
    webhookData: {
      type: contextType,
      originalUrl: originalUrl ?? undefined,
      processedAt: new Date().toISOString(),
    },
  };

  console.log("✅ createNoteFromWebhook - Final note object:", {
    id: newNote.id,
    title: newNote.title,
    hasAiSummary: !!newNote.aiSummary,
    hasTranscript: !!newNote.transcript,
    aiSummaryPreview: newNote.aiSummary
      ? `${newNote.aiSummary.substring(0, 50)}...`
      : "EMPTY",
    transcriptPreview: newNote.transcript
      ? `${newNote.transcript.substring(0, 50)}...`
      : "EMPTY",
  });

  return newNote;
};
