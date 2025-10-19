"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import CardToggleItem from "./card-toggle-item";
import { cn } from "~/lib/utils";

export interface CardConfig {
  id: string;
  name: string;
}

interface DashboardSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  availableCards: CardConfig[];
  visibleCards: Record<string, boolean>;
  onSave: (newVisibleCards: Record<string, boolean>) => void;
  title?: string;
  className?: string;
}

const DashboardSettingsModal: React.FC<DashboardSettingsModalProps> = ({
  isOpen,
  onOpenChange,
  availableCards,
  visibleCards,
  onSave,
  title = "Dashboard Settings",
  className,
}) => {
  const [currentSelections, setCurrentSelections] =
    React.useState<Record<string, boolean>>(visibleCards);

  React.useEffect(() => {
    setCurrentSelections(visibleCards);
  }, [visibleCards, isOpen]);

  const handleVisibilityChange = (cardId: string, newVisibility: boolean) => {
    setCurrentSelections((prev) => ({
      ...prev,
      [cardId]: newVisibility,
    }));
  };

  const handleSave = () => {
    onSave(currentSelections);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setCurrentSelections(visibleCards);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "border-white/10 bg-[#0a0a0a] sm:max-w-[425px]",
          className
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Personalize sua dashboard escolhendo quais cartões deseja exibir ou
            ocultar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {availableCards.map((card) => (
            <CardToggleItem
              key={card.id}
              cardId={card.id}
              cardName={card.name}
              isVisible={currentSelections[card.id] ?? true}
              onVisibilityChange={handleVisibilityChange}
            />
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-white/10 text-gray-300 hover:bg-white/[0.08]"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={handleSave}
            className="border border-blue-500/50 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

DashboardSettingsModal.displayName = "DashboardSettingsModal";

export default DashboardSettingsModal;
