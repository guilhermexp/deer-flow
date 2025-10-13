"use client"

import { useEffect, useCallback, useRef, memo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import {
  Home,
  CalendarDays,
  Folder,
  X,
  Settings,
  Brain,
  Activity,
  StickyNote,
  MessageSquare,
  House,
  LogOut,
} from "lucide-react"
import { cn } from "~/lib/utils"
import { Button } from "~/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { useRoutePrefetch } from "~/hooks/use-route-prefetch"


const navItems = [
  { href: "/chat", icon: MessageSquare, label: "Chat", disabled: false },
  { href: "/dashboard", icon: Home, label: "Dashboard", disabled: false },
  { href: "/calendar", icon: CalendarDays, label: "Calendar", disabled: false },
  { href: "/projects", icon: Folder, label: "Projects", disabled: false },
  { href: "/notes", icon: StickyNote, label: "Notes", disabled: false },
  { href: "/health", icon: Activity, label: "Health", disabled: false },
]

const implementedRoutesSet = new Set(["/chat", "/dashboard", "/calendar", "/projects", "/notes", "/health", "/settings"])

// Memoized sidebar button component with aggressive prefetch
const SidebarButton = memo(({ 
  item, 
  isActive, 
  onClick,
  onHover,
  isMobileOpen
}: {
  item: typeof navItems[0]
  isActive: boolean
  onClick: () => void
  onHover?: () => void
  isMobileOpen?: boolean
}) => {
  const Icon = item.icon
  
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      onMouseEnter={onHover}
      onFocus={onHover} // Add focus handler for keyboard navigation
      disabled={item.disabled}
      className={cn(
        "relative transition-all duration-200 rounded-xl",
        "flex items-center",
        isMobileOpen
          ? "w-full h-12 justify-start px-4" // Estilo para mobile com label
          : "w-9 h-9 justify-center", // Botões balanceados para sidebar
        "hover:bg-white/10",
        isActive && "bg-primary/20 text-primary shadow-lg",
        item.disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className={cn(
        "font-medium whitespace-nowrap",
        isMobileOpen
          ? "ml-3 text-sm" // Estilo para mobile com label visível
          : "absolute left-full ml-3 px-2 py-1 text-xs bg-black/80 text-white rounded-md opacity-0 group-hover:opacity-100 pointer-events-none z-50 lg:group-hover:opacity-100", // Tooltip original
        isMobileOpen && isActive && "text-primary",
        isMobileOpen && !isActive && "text-slate-200" // Cor ajustada para melhor contraste
      )}>
        {item.label}
      </span>
    </Button>
  )
})

SidebarButton.displayName = "SidebarButton"

// Memoized sidebar content
const SidebarContent = memo(({ 
  pathname, 
  onNavigate,
  onHoverItem,
  isMobileOpen,
  router
}: {
  pathname: string
  onNavigate: (href: string) => void
  onHoverItem: (href: string) => void
  isMobileOpen?: boolean
  router: any
}) => {
  const { signOut } = useClerk()
  
  return (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-center h-10 border-b border-border/60">
      <Brain className="w-4 h-4 text-slate-100 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all hover:brightness-125" />
    </div>

    <nav className={cn(
      "flex-1 flex flex-col gap-1.5 px-1.5 py-2",
      isMobileOpen ? "items-stretch" : "items-center justify-center"
    )}>
      {navItems.map((item) => (
        <div key={item.href} className={cn("relative group", isMobileOpen && "w-full")}>
          <SidebarButton
            item={item}
            isActive={pathname === item.href}
            onClick={() => onNavigate(item.href)}
            onHover={() => onHoverItem(item.href)}
            isMobileOpen={isMobileOpen}
          />
        </div>
      ))}
    </nav>

    <div className="flex flex-col gap-1.5 px-1.5 py-2">
      <div className="relative group">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/settings')}
          className={cn(
            "relative w-9 h-9 rounded-xl transition-all duration-200",
            "flex items-center justify-center",
            "hover:bg-white/10"
          )}
        >
          <Settings className="w-4 h-4" />
          <span className={cn(
            "absolute left-full ml-3 px-2 py-1 text-xs font-medium",
            "bg-black/80 text-white rounded-md whitespace-nowrap",
            "opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200",
            "pointer-events-none z-50"
          )}>
            Configurações
          </span>
        </Button>
      </div>
      <div className="relative group">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => signOut()}
          className={cn(
            "relative w-9 h-9 rounded-xl transition-all duration-200",
            "flex items-center justify-center",
            "hover:bg-red-500/20 hover:text-red-400"
          )}
        >
          <LogOut className="w-4 h-4" />
          <span className={cn(
            "absolute left-full ml-3 px-2 py-1 text-xs font-medium",
            "bg-black/80 text-white rounded-md whitespace-nowrap",
            "opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200",
            "pointer-events-none z-50"
          )}>
            Sair
          </span>
        </Button>
      </div>
    </div>
  </div>
  )
})

SidebarContent.displayName = "SidebarContent"

export const AppSidebar = memo(function AppSidebar({ isMobileOpen, toggleMobileSidebar }: { isMobileOpen: boolean; toggleMobileSidebar: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  
  // Prefetch all main routes immediately on mount
  const routesToPrefetch = navItems.map(item => item.href);
  useRoutePrefetch(routesToPrefetch)

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobileOpen) {
      toggleMobileSidebar()
    }
  }, [pathname]) // Only depend on pathname to avoid infinite loops

  // Use CSS class for body overflow
  useEffect(() => {
    const className = 'overflow-hidden'
    if (isMobileOpen) {
      document.body.classList.add(className)
    } else {
      document.body.classList.remove(className)
    }
    return () => document.body.classList.remove(className)
  }, [isMobileOpen])

  // Optimized navigation handler
  const handleNavigation = useCallback((href: string) => {
    if (!implementedRoutesSet.has(href)) {
      return
    }
    if (pathname === href) return
    
    router.push(href)
  }, [router, pathname])
  
  // Prefetch on hover/focus for instant navigation
  const handleHoverItem = useCallback((href: string) => {
    if (implementedRoutesSet.has(href)) {
      router.prefetch(href)
    }
  }, [router])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-30 w-12 supports-backdrop-blur:bg-background/80 bg-background/40 backdrop-blur-lg border-r border-border/60">
        <SidebarContent pathname={pathname} onNavigate={handleNavigation} onHoverItem={handleHoverItem} isMobileOpen={false} router={router} />
      </aside>

      {/* Mobile sidebar with AnimatePresence */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleMobileSidebar}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 supports-backdrop-blur:bg-background/90 bg-background/60 backdrop-blur-lg border-r border-border/60 lg:hidden"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMobileSidebar}
                className="absolute top-4 right-[-0.5rem] sm:right-4 rounded-full text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
              <SidebarContent pathname={pathname} onNavigate={handleNavigation} onHoverItem={handleHoverItem} isMobileOpen={isMobileOpen} router={router} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
})

AppSidebar.displayName = "AppSidebar"
