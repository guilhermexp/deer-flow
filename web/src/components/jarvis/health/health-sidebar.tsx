"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Trash2, Check } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "~/components/ui/dialog"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"

interface HealthSidebarProps {
  medications: {
    name: string
    dosage: string
    time: string
    taken: boolean
  }[]
  onToggleMedication: (index: number) => void
  onAddMedication: (name: string, dosage: string, time: string) => void
  onRemoveMedication: (index: number) => void
}

export function HealthSidebar({ 
  medications, 
  onToggleMedication, 
  onAddMedication, 
  onRemoveMedication 
}: HealthSidebarProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newMed, setNewMed] = useState({ name: '', dosage: '', time: '' })
  
  const handleAddMedication = () => {
    if (newMed.name && newMed.dosage && newMed.time) {
      onAddMedication(newMed.name, newMed.dosage, newMed.time)
      setNewMed({ name: '', dosage: '', time: '' })
      setShowAddDialog(false)
    }
  }
  
  const getMedicationIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('vitamina')) return '💊'
    if (lowerName.includes('omega') || lowerName.includes('ômega')) return '❤️'
    if (lowerName.includes('magnésio')) return '⚡'
    return '💊'
  }
  return (
    <>
      <div className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-semibold text-white">Maria Silva</h1>
          <div className="mt-2 space-y-0.5 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span>🇧🇷</span>
              <span>Brasil</span>
              <span className="mx-1">•</span>
              <span>28 anos</span>
            </div>
            <div className="flex items-center gap-2">
              <span>60kg</span>
              <span className="mx-1">•</span>
              <span>1.65m</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="h-14 w-14 rounded-full overflow-hidden border border-white/10">
            <Image
              src="https://i.pravatar.cc/80?img=5"
              alt="Maria Silva"
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold grid place-content-center">5</span>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white/[0.02]"></span> {/* Usar cor semântica para online status */}
        </div>
      </div>

      {/* Health Level */}
      <div className="mt-4">
        <div className="h-1.5 w-full bg-white/[0.05] rounded-full">
          <div className="h-full w-2/3 bg-primary rounded-full transition-all duration-500"></div>
        </div>
        <p className="mt-1 text-xs text-gray-400">Nível Saúde</p>
      </div>

      {/* Medications */}
      <div className="mt-8 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Medicamentos</h2>
        <Button variant="outline" size="sm" className="rounded-md text-xs">
          Recentes
        </Button>
      </div>

      <Button
        className="w-full mt-6 flex items-center justify-center gap-2 rounded-md"
        variant="outline"
        onClick={() => setShowAddDialog(true)}
      >
        <Plus className="w-4 h-4 text-gray-400 group-hover:rotate-90 transition-transform duration-300" />
        <span className="font-medium text-sm text-gray-400">Adicionar Medicamento</span>
      </Button>

      {/* Lista de Medicamentos */}
      <div className="mt-6 space-y-3">
        <AnimatePresence>
          {medications.map((med, index) => (
            <motion.div
              key={`${med.name}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 p-3 rounded-md bg-white/[0.05] border border-white/10 hover:bg-white/[0.08] transition-all"
            >
              <Checkbox
                checked={med.taken}
                onCheckedChange={() => onToggleMedication(index)}
                className="border-white/10 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
              />
              <div className="h-10 w-10 bg-white/[0.05] rounded-md flex items-center justify-center">
                {/* Mantendo cor semântica para ícone de medicamento por enquanto */}
                <span className="text-blue-400">{getMedicationIcon(med.name)}</span>
              </div>
              <div className="flex-1">
                <div className={`font-medium text-sm ${med.taken ? 'line-through text-gray-400' : 'text-gray-100'}`}>
                  {med.name}
                </div>
                <div className="text-xs text-gray-400">{med.dosage} - {med.time}</div>
              </div>
              <div className="flex items-center gap-2">
                {med.taken && (
                  <Check className="w-4 h-4 text-green-500" /> // Usar cor semântica
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                  onClick={() => onRemoveMedication(index)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {medications.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">
            Nenhum medicamento cadastrado
          </div>
        )}
      </div>

      {/* Upcoming reminders */}
      <div className="mt-10">
        <h2 className="text-base font-semibold text-white">Próximos Lembretes</h2>
        
        <div className="mt-4 space-y-3">
          {/* Exemplo de item de lembrete - aplicar bg-secondary, border-border, rounded-md */}
          <div className="flex items-center gap-3 p-3 rounded-md bg-white/[0.05] border border-white/10">
            <div className="h-8 w-8 bg-white/[0.05] rounded-md flex items-center justify-center">
              {/* Manter cor semântica por enquanto */}
              <span className="text-orange-400">🕐</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-100">Consulta Cardiologista</div>
              <div className="text-xs text-gray-400">Amanhã às 14:30</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-md bg-white/[0.05] border border-white/10">
            <div className="h-8 w-8 bg-white/[0.05] rounded-md flex items-center justify-center">
              <span className="text-purple-400">🧪</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-100">Exame de Sangue</div>
              <div className="text-xs text-gray-400">Sexta-feira às 09:00</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-md bg-white/[0.05] border border-white/10">
            <div className="h-8 w-8 bg-white/[0.05] rounded-md flex items-center justify-center">
              <span className="text-green-500">📋</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-100">Check-up Anual</div>
              <div className="text-xs text-gray-400">Próxima semana</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-10">
        <h2 className="text-base font-semibold text-white mb-4">Estatísticas Rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Exemplo de item de estatística - aplicar bg-secondary, border-border, rounded-md */}
          <div className="bg-white/[0.05] border border-white/10 rounded-md p-4 text-center">
            <div className="text-2xl font-bold text-primary">95</div> {/* Usar text-primary para destaque */}
            <div className="text-xs text-gray-400">Peso Ideal</div>
          </div>
          <div className="bg-white/[0.05] border border-white/10 rounded-md p-4 text-center">
            <div className="text-2xl font-bold text-primary">8.2</div> {/* Usar text-primary para destaque */}
            <div className="text-xs text-gray-400">IMC</div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Dialog para adicionar medicamento */}
    <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Medicamento</DialogTitle>
          <DialogDescription>
            Preencha as informações do medicamento que deseja adicionar ao seu plano de saúde.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={newMed.name}
              onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
              className="col-span-3"
              placeholder="Ex: Vitamina D"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dosage" className="text-right">
              Dosagem
            </Label>
            <Input
              id="dosage"
              value={newMed.dosage}
              onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
              className="col-span-3"
              placeholder="Ex: 1000 UI"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="time" className="text-right">
              Horário
            </Label>
            <Input
              id="time"
              type="time"
              value={newMed.time}
              onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleAddMedication}>
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}