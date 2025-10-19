"use client";

import { useUser } from "@clerk/nextjs";
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
  const { user, isLoaded } = useUser();
  const isLoading = !isLoaded;
  const isAuthenticated = isLoaded && Boolean(user);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  // Verificar autenticação (muito permissivo em desenvolvimento)
  useEffect(() => {
    // In development, be very permissive with auth
    if (process.env.NODE_ENV === "development") {
      console.log("🛠️ Development mode: Skipping auth redirect logic");
      return;
    }

    // Only redirect in production if auth is definitely failing
    if (!isLoading && !isAuthenticated) {
      console.log("🔒 Production: Redirecting to Clerk sign-in");
      router.push("/sign-in");
    }
  }, [isLoading, isAuthenticated, router]);

  // Páginas que precisam de altura total
  const fullHeightPages = [
    "/projects",
    "/chat",
    "/notes",
    "/health",
    "/dashboard",
  ];
  const isFullHeightPage = fullHeightPages.includes(pathname);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="mb-2 text-2xl">🦌</div>
          <div className="text-muted-foreground">
            Verificando autenticação...
          </div>
        </div>
      </div>
    );
  }

  // Em desenvolvimento, permitir acesso mesmo com problemas de auth
  if (!isAuthenticated && process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="text-foreground min-h-screen bg-[#0a0a0a]">
      <RouteWarmup />
      <ServiceWorkerRegister />
      <AppSidebar
        isMobileOpen={isMobileSidebarOpen}
        toggleMobileSidebar={toggleMobileSidebar}
      />
      <div
        className={`flex h-screen flex-col overflow-hidden bg-[#0a0a0a] lg:pl-12`}
      >
        {pathname !== "/chat" &&
          pathname !== "/dashboard" &&
          pathname !== "/calendar" &&
          pathname !== "/projects" &&
          pathname !== "/notes" &&
          pathname !== "/health" && (
            <AppHeader
              userName={
                user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ??
                user?.firstName ??
                "User"
              }
              pageTitle={pageTitle}
              onMenuClick={toggleMobileSidebar}
            />
          )}
        <PageTitleProvider
          userName={
            user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ??
            user?.firstName ??
            "User"
          }
          toggleCommandPalette={() => setIsCommandPaletteOpen((prev) => !prev)}
        >
          <main
            className={`flex-1 ${isFullHeightPage ? "overflow-hidden" : "overflow-auto px-4 py-3 sm:px-6 lg:px-8 lg:py-4"}`}
          >
            {isFullHeightPage ? (
              children
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
