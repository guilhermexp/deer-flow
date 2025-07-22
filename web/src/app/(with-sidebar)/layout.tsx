"use client";

import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useState, useCallback, useEffect } from "react";

import AppHeader from "~/components/jarvis/app-header";
import { AppSidebar } from "~/components/jarvis/app-sidebar-optimized";
import { GlobalCommandPalette } from "~/components/jarvis/global-command-palette";
import PageTitleProvider from "~/components/jarvis/page-title-provider";
import { RouteWarmup } from "~/components/jarvis/route-warmup";
import { ServiceWorkerRegister } from "~/components/jarvis/service-worker-register";
import { Toaster } from "~/components/ui/sonner";
import { useAuth } from "~/core/contexts/auth-context";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

// Mapeamento das rotas para títulos das páginas
const routeTitles: Record<string, string> = {
  "/chat": "Chat",
  "/dashboard": "Dashboard",
  "/calendar": "Calendário",
  "/projects": "Projetos",
  "/notes": "Notas",
  "/health": "Saúde",
  "/settings": "Configurações",
};

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const pageTitle = routeTitles[pathname] ?? "";
  const { user, isLoading, isAuthenticated } = useAuth();
  
  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev);
  }, []);

  // Verificar autenticação
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Páginas que precisam de altura total
  const fullHeightPages = ['/projects', '/chat', '/notes', '/health'];
  const isFullHeightPage = fullHeightPages.includes(pathname);
  
  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="text-2xl mb-2">🦌</div>
          <div className="text-muted-foreground">Verificando autenticação...</div>
        </div>
      </div>
    );
  }
  
  // Se não está autenticado, não renderiza nada (será redirecionado)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="bg-[#0a0a0a] text-foreground min-h-screen">
      <RouteWarmup />
      <ServiceWorkerRegister />
      <AppSidebar isMobileOpen={isMobileSidebarOpen} toggleMobileSidebar={toggleMobileSidebar} />
      <div className={`h-screen flex flex-col lg:pl-12 overflow-hidden bg-[#0a0a0a]`}>
        {pathname !== '/chat' && pathname !== '/dashboard' && pathname !== '/calendar' && pathname !== '/projects' && pathname !== '/notes' && pathname !== '/health' && (
          <AppHeader 
            userName={user?.email?.split('@')[0] || "User"}
            pageTitle={pageTitle}
            onMenuClick={toggleMobileSidebar}
          />
        )}
        <PageTitleProvider
          userName={user?.email?.split('@')[0] || "User"}
          toggleCommandPalette={() => setIsCommandPaletteOpen(prev => !prev)}
        >
          <main className={`flex-1 ${isFullHeightPage ? 'overflow-hidden' : 'px-4 sm:px-6 lg:px-8 py-3 lg:py-4 overflow-auto'}`}>
            {isFullHeightPage ? (
              children
            ) : (
              <div className="max-w-7xl mx-auto w-full">{children}</div>
            )}
          </main>
        </PageTitleProvider>
      </div>
      <GlobalCommandPalette isOpen={isCommandPaletteOpen} setIsOpen={setIsCommandPaletteOpen} />
      <Toaster />
    </div>
  );
}