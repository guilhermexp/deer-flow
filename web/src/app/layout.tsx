// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import "~/styles/globals.css";
import "~/styles/jarvis-globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

import { ThemeProviderWrapper } from "~/components/deer-flow/theme-provider-wrapper";
import { AnimationProvider } from "~/contexts/animation-context";
import { env } from "~/env.js";

import { Toaster } from "../components/deer-flow/toaster";

export const metadata: Metadata = {
  title: "🦌 DeerFlow",
  description:
    "Exploração Profunda e Pesquisa Eficiente, uma ferramenta de IA que combina modelos de linguagem com ferramentas especializadas para tarefas de pesquisa.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <ClerkProvider>
      <html
        lang={locale}
        className={`${geist.variable}`}
        suppressHydrationWarning
      >
        <head>
          {/* Define a função isSpace globalmente para corrigir problemas do markdown-it com Next.js + Turbopack
            https://github.com/markdown-it/markdown-it/issues/1082#issuecomment-2749656365 */}
          <Script id="markdown-it-fix" strategy="beforeInteractive">
            {`
              if (typeof window !== 'undefined' && typeof window.isSpace === 'undefined') {
                window.isSpace = function(code) {
                  return code === 0x20 || code === 0x09 || code === 0x0A || code === 0x0B || code === 0x0C || code === 0x0D;
                };
              }
            `}
          </Script>
        </head>
        <body className="bg-app">
          <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeProviderWrapper>
              <AnimationProvider>{children}</AnimationProvider>
            </ThemeProviderWrapper>
          </NextIntlClientProvider>
          <Toaster />
          {
            // NENHUM RASTREAMENTO DE COMPORTAMENTO DO USUÁRIO OU COLETA DE DADOS PRIVADOS POR PADRÃO
            //
            // Quando `NEXT_PUBLIC_STATIC_WEBSITE_ONLY` for `true`, o script será injetado
            // na página apenas quando `AMPLITUDE_API_KEY` for fornecido em `.env`
          }
          {env.NEXT_PUBLIC_STATIC_WEBSITE_ONLY && env.AMPLITUDE_API_KEY && (
            <>
              <Script src="https://cdn.amplitude.com/script/d2197dd1df3f2959f26295bb0e7e849f.js"></Script>
              <Script id="amplitude-init" strategy="lazyOnload">
                {`window.amplitude.init('${env.AMPLITUDE_API_KEY}', {"fetchRemoteConfig":true,"autocapture":true});`}
              </Script>
            </>
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
