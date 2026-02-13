"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface NavigationControlsProps {
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
}

export function NavigationControls({ onClose, onNavigate }: NavigationControlsProps) {
  return (
    <div className="flex items-center justify-between pb-4">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onClose}
      >
        <X className="w-4 h-4" />
      </Button>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("prev")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onNavigate("next")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}