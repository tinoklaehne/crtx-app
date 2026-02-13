"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, Radar } from "lucide-react";

interface ViewToggleProps {
  view: "radar" | "matrix";
  onChange: (view: "radar" | "matrix") => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 p-1 rounded-lg bg-background/50 backdrop-blur border">
      <Button
        variant={view === "radar" ? "default" : "ghost"}
        size="icon"
        onClick={() => onChange("radar")}
      >
        <Radar className="h-4 w-4" />
      </Button>
      <Button
        variant={view === "matrix" ? "default" : "ghost"}
        size="icon"
        onClick={() => onChange("matrix")}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}