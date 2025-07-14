"use client"
import { Menu } from "lucide-react"
import { Button } from "~/components/ui/button"
import { useCurrentDateTime } from "~/hooks/jarvis/use-current-date-time"
import { ThemeToggle } from "~/components/deer-flow/theme-toggle"

interface AppHeaderProps {
  userName?: string
  pageTitle?: string
  onMenuClick?: () => void
}

export default function AppHeader({
  userName = "Guilherme",
  pageTitle,
  onMenuClick
}: AppHeaderProps) {
  const { formattedDate, formattedTime } = useCurrentDateTime()

  // Estilo padronizado com transparência e blur
  const headerClasses = "supports-backdrop-blur:bg-background/80 bg-background/40 sticky top-0 z-40 w-full backdrop-blur-lg"

  return (
    <header className={headerClasses}>
      <div className="flex h-14 items-center px-4 sm:px-6 lg:px-8">
        {/* Container grid para garantir alinhamento simétrico */}
        <div className="w-full grid grid-cols-3 items-center">
          {/* Seção Esquerda (Logo e Menu) */}
          <div className="flex justify-start items-center gap-3">
            {/* Botão de menu apenas no mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden text-muted-foreground hover:text-foreground"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦌</span>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 text-glow-white">DeerFlow</span>
            </div>
          </div>

          {/* Seção Central (Saudação ou Título da Página) */}
          <div className="flex items-center justify-center">
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 text-center">
              {pageTitle ? (
                <span className="text-glow-white">{pageTitle}</span>
              ) : (
                <>Bom dia, <span className="text-glow-white">{userName}!</span></>
              )}
            </h1>
          </div>

          {/* Seção Direita (Data/Hora e Botões) */}
          <div className="flex items-center justify-end gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="capitalize">{formattedDate}</span>
              <span>•</span>
              <span>{formattedTime}</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
      <hr className="from-border/0 via-border/70 to-border/0 m-0 h-px w-full border-none bg-gradient-to-r" />
    </header>
  )
}
