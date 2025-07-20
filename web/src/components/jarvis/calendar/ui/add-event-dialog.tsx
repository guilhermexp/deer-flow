"use client"

import React, { useState } from "react" // Adicionado useState
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Textarea } from "~/components/ui/textarea"
import { ScrollArea } from "~/components/ui/scroll-area"
import { cn } from "~/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { format as formatDateFn } from "date-fns"
import { ptBR } from "date-fns/locale" // Importar o locale ptBR corretamente
import { useForm } from "react-hook-form"
import * as z from "zod"
import { CALENDAR_FILTERS, EVENT_COLOR_NAMES } from "../lib/constants"
import type { NewEventFormData, CalendarEvent } from "../lib/types"
import { Loader2 } from "lucide-react" // Adicionado Loader2
import { toast } from "sonner" // Adicionado toast

const newEventFormSchema = z.object({
  title: z.string().min(2, { message: "Título deve ter pelo menos 2 caracteres." }),
  subtitle: z.string().optional(),
  eventDate: z.date({ required_error: "Data do evento é obrigatória." }),
  startHour: z.coerce.number().min(0, "Hora inválida").max(23, "Hora inválida"),
  duration: z.coerce.number().min(0.5, "Duração mínima de 0.5 horas").max(24, "Duração máxima de 24 horas"),
  color: z.enum(EVENT_COLOR_NAMES as [string, ...string[]], { required_error: "Cor é obrigatória." }),
  category: z.enum(CALENDAR_FILTERS.filter((f) => f.value !== "all").map((f) => f.value) as [string, ...string[]], {
    required_error: "Categoria é obrigatória.",
  }),
})

type FormValues = z.infer<typeof newEventFormSchema>

interface AddEventDialogProps {
  open: boolean
  setOpen: (open: boolean) => void
  onAddEvent: (eventData: NewEventFormData) => Promise<void> // Modificado para Promise
  initialDate?: Date
}

export function AddEventDialog({ open, setOpen, onAddEvent, initialDate }: AddEventDialogProps) {
  const [isLoading, setIsLoading] = useState(false) // Adicionado estado isLoading
  const [isCalendarOpen, setIsCalendarOpen] = useState(false) // Estado para controlar o popover
  const form = useForm<FormValues>({
    resolver: zodResolver(newEventFormSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      eventDate: initialDate || new Date(),
      startHour: 9,
      duration: 1,
      color: EVENT_COLOR_NAMES[0] as CalendarEvent["color"],
      category:
        (CALENDAR_FILTERS.find((f) => f.value === "rotina")?.value as Exclude<CalendarEvent["category"], "all">) ||
        "rotina",
    },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        subtitle: "",
        eventDate: initialDate || new Date(),
        startHour: 9,
        duration: 1,
        color: EVENT_COLOR_NAMES[0] as CalendarEvent["color"],
        category:
          (CALENDAR_FILTERS.find((f) => f.value === "rotina")?.value as Exclude<CalendarEvent["category"], "all">) ||
          "rotina",
      })
      setIsLoading(false) // Resetar isLoading ao abrir
      setIsCalendarOpen(false) // Resetar estado do calendário
    }
  }, [open, initialDate, form])

  async function onSubmit(data: FormValues) { // Modificado para async
    setIsLoading(true) // Iniciar carregamento
    try {
      const eventDataToSubmit: NewEventFormData = {
        ...data,
        eventDate: formatDateFn(data.eventDate, "yyyy-MM-dd"),
        color: data.color as NewEventFormData["color"],
        category: data.category as NewEventFormData["category"],
      }
      await onAddEvent(eventDataToSubmit) // Aguardar a adição do evento
      toast.success("Evento salvo com sucesso!") // Toast de sucesso
      setOpen(false) // Fechar diálogo
      // form.reset() // O reset já é feito no useEffect ao abrir
    } catch (error) {
      console.error("Falha ao salvar evento:", error)
      toast.error("Falha ao salvar evento. Tente novamente.") // Toast de erro
      // Não fechar o diálogo
    } finally {
      setIsLoading(false) // Finalizar carregamento
    }
  }

  const availableHours = Array.from({ length: 24 }, (_, i) => i)
  const availableDurations = [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8]

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="sm:max-w-[525px] bg-[#0a0a0a] border-white/10 text-gray-100 p-0">
        <AlertDialogHeader className="p-6 pb-4 bg-[#0a0a0a]">
          <AlertDialogTitle className="text-white">Adicionar Novo Evento</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">Preencha os detalhes do seu novo evento.</AlertDialogDescription>
        </AlertDialogHeader>
        <ScrollArea className="max-h-[calc(90vh_-_150px)] bg-[#0a0a0a]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 px-6 pb-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Reunião de equipe"
                        {...field}
                        className="bg-input border-input focus:ring-ring focus:ring-offset-2 focus:ring-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtítulo (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Discutir próximos passos do projeto X"
                        {...field}
                        className="bg-input border-input focus:ring-ring focus:ring-offset-2 focus:ring-2 resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Evento</FormLabel>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal bg-input border-input hover:bg-muted focus:ring-ring focus:ring-offset-2 focus:ring-2",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              formatDateFn(field.value, "PPP", { locale: ptBR }) // Usar o locale importado
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
                        <Calendar 
                          mode="single" 
                          selected={field.value} 
                          onSelect={(date) => {
                            console.log("Data selecionada:", date);
                            if (date) {
                              field.onChange(date);
                              setIsCalendarOpen(false); // Fechar o popover após selecionar
                            }
                          }}
                          disabled={(date) => false} // Permitir todas as datas
                          initialFocus
                          locale={ptBR}
                          className="bg-card"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora Início</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger className="bg-input border-input focus:ring-ring focus:ring-offset-2 focus:ring-2">
                            <SelectValue placeholder="Hora" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {availableHours.map((hour) => (
                            <SelectItem key={hour} value={String(hour)} className="text-gray-100">
                              {`${String(hour).padStart(2, "0")}:00`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (horas)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                        <FormControl>
                          <SelectTrigger className="bg-input border-input focus:ring-ring focus:ring-offset-2 focus:ring-2">
                            <SelectValue placeholder="Duração" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {availableDurations.map((dur) => (
                            <SelectItem key={dur} value={String(dur)} className="text-gray-100">
                              {dur}h
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-input border-input focus:ring-ring focus:ring-offset-2 focus:ring-2">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {CALENDAR_FILTERS.filter((f) => f.value !== "all").map((catFilter) => (
                            <SelectItem
                              key={catFilter.value}
                              value={catFilter.value}
                              className="text-gray-100"
                            >
                              {catFilter.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-input border-input focus:ring-ring focus:ring-offset-2 focus:ring-2">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover border-border">
                          {EVENT_COLOR_NAMES.map((colorName) => (
                            <SelectItem key={colorName} value={colorName} className="text-gray-100">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    "w-3 h-3 rounded-full",
                                    `bg-${colorName}-500`, // Tailwind JIT might need full class names
                                  )}
                                ></span>
                                {colorName.charAt(0).toUpperCase() + colorName.slice(1)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </ScrollArea>
        <AlertDialogFooter className="p-6 pt-4 border-t border-white/10 bg-[#0a0a0a]">
          <AlertDialogCancel asChild>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                // form.reset(); // O reset já é feito no useEffect ao abrir
              }}
              className="text-gray-300 hover:bg-white/[0.08]"
            >
              Cancelar
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              className="bg-blue-500/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/30"
              disabled={isLoading} // Desabilitar durante o carregamento
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Salvando..." : "Adicionar Evento"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
