"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Home, CalendarDays, Folder, Activity } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "~/lib/utils"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command"

interface NavItem {
  href: string
  icon: LucideIcon
  label: string
  disabled: boolean
}

// Replicando a estrutura de navItems para uso local.
// Idealmente, isso viria de uma fonte compartilhada.
const commandNavItems: NavItem[] = [
  { href: "/", icon: Home, label: "Dashboard", disabled: false },
  { href: "/calendar", icon: CalendarDays, label: "Calendar", disabled: false },
  { href: "/projects", icon: Folder, label: "Projects", disabled: false },
  
  { href: "/health", icon: Activity, label: "Health", disabled: false },
]

interface GlobalCommandPaletteProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function GlobalCommandPalette({ isOpen, setIsOpen }: GlobalCommandPaletteProps) {
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(!isOpen)
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setIsOpen])

  const runCommand = React.useCallback((command: () => unknown) => {
    setIsOpen(false)
    command()
  }, [setIsOpen])

  return (
    <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
      <CommandInput placeholder="Digite um comando ou pesquise..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Navegação">
          {commandNavItems
            .filter((item) => !item.disabled)
            .map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.label} ${item.href}`}
                onSelect={() => {
                  runCommand(() => router.push(item.href))
                }}
                className="cursor-pointer"
              >
                <item.icon className={cn("mr-2 h-4 w-4")} />
                <span>{item.label}</span>
              </CommandItem>
            ))}
        </CommandGroup>
        {/* TODO: Adicionar mais grupos aqui (ex: Ações, Configurações) */}
      </CommandList>
    </CommandDialog>
  )
}