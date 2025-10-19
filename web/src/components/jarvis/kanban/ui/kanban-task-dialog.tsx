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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import {
  Plus,
  X,
  FileText,
  CalendarIcon,
  BarChart3,
  Users,
  Palette,
} from "lucide-react";
import type { Task, TaskStatus, TaskWeekDay, Assignee } from "../lib/types";

interface KanbanTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingTask: Task | null;
  formData: {
    title: string;
    description: string;
    date: string;
    progress: number[];
    assignees: Assignee[];
    status: TaskStatus;
    weekDay?: TaskWeekDay;
  };
  onFormChange: (
    field: keyof KanbanTaskDialogProps["formData"],
    value: string | TaskWeekDay | TaskStatus | Assignee[]
  ) => void;
  onSliderChange: (value: number[]) => void;
  onSaveTask: () => void;
  onAddAssignee: () => void;
  onRemoveAssignee: (index: number) => void;
  isWeekBoardActive?: boolean;
}

export default function KanbanTaskDialog({
  isOpen,
  onOpenChange,
  editingTask,
  formData,
  onFormChange,
  onSliderChange,
  onSaveTask,
  onAddAssignee,
  onRemoveAssignee,
  isWeekBoardActive = false,
}: KanbanTaskDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editingTask ? "Editar Tarefa" : "Adicionar Nova Tarefa"}
          </DialogTitle>
          <DialogDescription>
            {editingTask
              ? "Atualize os detalhes da tarefa."
              : "Preencha os detalhes da nova tarefa."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 px-2 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title" className="text-muted-foreground">
              <FileText className="mr-2 inline h-4 w-4" /> Título
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => onFormChange("title", e.target.value)}
              placeholder="Ex: Finalizar relatório mensal"
              className="bg-background border-border focus:border-primary"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-muted-foreground">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => onFormChange("description", e.target.value)}
              placeholder="Adicione mais detalhes sobre a tarefa..."
              className="bg-background border-border focus:border-primary min-h-[100px]"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="date" className="text-muted-foreground">
                <CalendarIcon className="mr-2 inline h-4 w-4" /> Data
              </Label>
              <Input
                id="date"
                type="datetime-local"
                value={formData.date}
                onChange={(e) => onFormChange("date", e.target.value)}
                className="bg-background border-border focus:border-primary"
              />
            </div>
            {isWeekBoardActive ? (
              <div className="grid gap-2">
                <Label htmlFor="weekDay" className="text-muted-foreground">
                  <Palette className="mr-2 inline h-4 w-4" /> Dia da Semana
                </Label>
                <Select
                  value={formData.weekDay || "none"}
                  onValueChange={(value) =>
                    onFormChange(
                      "weekDay",
                      value === "none" ? undefined : (value as TaskWeekDay)
                    )
                  }
                >
                  <SelectTrigger className="bg-background border-border focus:border-primary">
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem
                      value="none"
                      className="text-popover-foreground"
                    >
                      Nenhum
                    </SelectItem>
                    {(
                      [
                        "segunda",
                        "terca",
                        "quarta",
                        "quinta",
                        "sexta",
                        "sabado",
                        "domingo",
                      ] as TaskWeekDay[]
                    ).map((day) => (
                      <SelectItem
                        key={day}
                        value={day!}
                        className="text-popover-foreground"
                      >
                        {day!.charAt(0).toUpperCase() + day!.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="status" className="text-muted-foreground">
                  <Palette className="mr-2 inline h-4 w-4" /> Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    onFormChange("status", value as TaskStatus)
                  }
                >
                  <SelectTrigger className="bg-background border-border focus:border-primary">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem
                      value="not-started"
                      className="text-popover-foreground"
                    >
                      Não iniciado
                    </SelectItem>
                    <SelectItem
                      value="paused"
                      className="text-popover-foreground"
                    >
                      Pausado
                    </SelectItem>
                    <SelectItem
                      value="in-progress"
                      className="text-popover-foreground"
                    >
                      Em progresso
                    </SelectItem>
                    <SelectItem
                      value="done"
                      className="text-popover-foreground"
                    >
                      Concluído
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="progress" className="text-muted-foreground">
              <BarChart3 className="mr-2 inline h-4 w-4" /> Progresso:{" "}
              {formData.progress[0]}%
            </Label>
            <Slider
              id="progress"
              value={formData.progress}
              onValueChange={onSliderChange}
              max={100}
              step={1}
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground">
                <Users className="mr-2 inline h-4 w-4" /> Responsáveis
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onAddAssignee}
                className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Plus className="mr-1 h-3 w-3" /> Adicionar
              </Button>
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {formData.assignees.map((assignee, index) => (
                <div
                  key={index}
                  className="bg-muted flex items-center gap-2 rounded-md px-2 py-1 text-sm"
                >
                  <Avatar className="h-5 w-5">
                    <AvatarImage
                      src={assignee.avatar || ""}
                      alt={assignee.name}
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                      {" "}
                      {/* Padronizado */}
                      {assignee.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground">{assignee.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveAssignee(index)}
                    className="text-muted-foreground hover:text-destructive h-5 w-5 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="px-2 pb-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border text-muted-foreground hover:bg-muted"
          >
            Cancelar
          </Button>
          <Button
            onClick={onSaveTask}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={!formData.title.trim()}
          >
            {editingTask ? "Salvar Alterações" : "Criar Tarefa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
