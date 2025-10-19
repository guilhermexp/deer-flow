"use client";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

interface CreateProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  formData: { name: string; description: string };
  onFormChange: (field: "name" | "description", value: string) => void;
  onSave: () => void;
}

export default function CreateProjectDialog({
  isOpen,
  onOpenChange,
  formData,
  onFormChange,
  onSave,
}: CreateProjectDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0a0a0a] text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-white">Criar Novo Projeto</DialogTitle>
          <DialogDescription className="text-gray-400">
            Dê um nome e uma descrição para o seu novo projeto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="projectName" className="text-right text-gray-300">
              Nome
            </Label>
            <Input
              id="projectName"
              value={formData.name}
              onChange={(e) => onFormChange("name", e.target.value)}
              className="col-span-3 border-white/10 bg-white/[0.05] text-gray-100 placeholder:text-gray-500 focus:border-white/20"
              placeholder="Nome do Projeto"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label
              htmlFor="projectDescription"
              className="text-right text-gray-300"
            >
              Descrição
            </Label>
            <Textarea
              id="projectDescription"
              value={formData.description}
              onChange={(e) => onFormChange("description", e.target.value)}
              className="col-span-3 min-h-[80px] border-white/10 bg-white/[0.05] text-gray-100 placeholder:text-gray-500 focus:border-white/20"
              placeholder="Descreva seu projeto..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-white/10 text-gray-300 hover:bg-white/[0.08]"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={onSave}
            disabled={!formData.name.trim()}
            className="border border-blue-500/50 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          >
            Salvar Projeto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
