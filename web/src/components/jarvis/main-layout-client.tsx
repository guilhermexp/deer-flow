"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "~/components/jarvis/app-sidebar-optimized";
import { GlobalCommandPalette } from "~/components/jarvis/global-command-palette";
import PageTitleProvider from "~/components/jarvis/page-title-provider";
import { Toaster } from "~/components/ui/sonner";
import { RouteWarmup } from "~/components/jarvis/route-warmup";
import { ServiceWorkerRegister } from "~/components/jarvis/service-worker-register";
import AppHeader from "~/components/jarvis/app-header";

interface MainLayoutClientProps {
  children: React.ReactNode;
}

// Mapeamento das rotas para títulos das páginas
const routeTitles: Record<string, string> = {
  "/chat": "Chat",
  "/jarvis": "", // Dashboard mantém a saudação
  "/jarvis/dashboard": "", // Dashboard mantém a saudação
  "/jarvis/calendar": "Calendário",
  "/jarvis/projects": "Projetos",
  "/jarvis/notes": "Notas",
  "/jarvis/health": "Saúde",
};

export function MainLayoutClient({ children }: MainLayoutClientProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle = routeTitles[pathname] || "";

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  // Páginas que precisam de altura total
  const fullHeightPages = ["/jarvis/projects", "/chat"];
  const isFullHeightPage = fullHeightPages.includes(pathname);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <RouteWarmup />
      <ServiceWorkerRegister />
      <AppSidebar
        isMobileOpen={isMobileSidebarOpen}
        toggleMobileSidebar={toggleMobileSidebar}
      />
      <div
        className={`flex min-h-screen flex-col lg:pl-12 ${isFullHeightPage ? "h-screen" : ""}`}
      >
        <AppHeader
          userName="User"
          pageTitle={pageTitle}
          onMenuClick={toggleMobileSidebar}
        />
        <PageTitleProvider
          userName="User"
          toggleCommandPalette={() => setIsCommandPaletteOpen((prev) => !prev)}
        >
          <main
            className={`flex-1 ${isFullHeightPage ? "h-full overflow-auto" : "px-4 py-6 sm:px-6 lg:px-8 lg:py-8"}`}
          >
            {isFullHeightPage ? (
              <div className="h-full w-full">{children}</div>
            ) : (
              <div className="mx-auto w-full max-w-7xl">{children}</div>
            )}
          </main>
        </PageTitleProvider>
      </div>
      <GlobalCommandPalette
        isOpen={isCommandPaletteOpen}
        setIsOpen={setIsCommandPaletteOpen}
      />
      <Toaster />
    </div>
  );
}

export default MainLayoutClient;
