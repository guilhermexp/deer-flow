"use client";

import * as React from "react";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";

interface CardToggleItemProps {
  cardId: string;
  cardName: string;
  isVisible: boolean;
  onVisibilityChange: (cardId: string, newVisibility: boolean) => void;
  className?: string;
}

const CardToggleItem: React.FC<CardToggleItemProps> = ({
  cardId,
  cardName,
  isVisible,
  onVisibilityChange,
  className,
}) => {
  const handleCheckedChange = (checked: boolean) => {
    onVisibilityChange(cardId, checked);
  };

  return (
    <div className={cn("flex items-center justify-between py-2", className)}>
      <Label
        htmlFor={cardId}
        className="cursor-pointer text-sm font-medium text-gray-100"
      >
        {cardName}
      </Label>
      <Switch
        id={cardId}
        checked={isVisible}
        onCheckedChange={handleCheckedChange}
        aria-label={`Toggle visibility of ${cardName}`}
      />
    </div>
  );
};

CardToggleItem.displayName = "CardToggleItem";

export default CardToggleItem;
