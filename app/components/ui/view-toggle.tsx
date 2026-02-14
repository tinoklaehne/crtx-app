"use client";

import { Button } from "@/components/ui/button";
import { LayoutGrid, Radar, Columns } from "lucide-react";

interface ViewToggleProps {
  view: "radar" | "matrix" | "kanban";
  onChange: (view: "radar" | "matrix" | "kanban") => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 p-1 rounded-lg bg-background/50 backdrop-blur border">
      <Button
        variant={view === "radar" ? "default" : "ghost"}
        size="icon"
        onClick={() => onChange("radar")}
        title="Radar View"
      >
        <Radar className="h-4 w-4" />
      </Button>
      <Button
        variant={view === "matrix" ? "default" : "ghost"}
        size="icon"
        onClick={() => onChange("matrix")}
        title="Matrix View"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={view === "kanban" ? "default" : "ghost"}
        size="icon"
        onClick={() => onChange("kanban")}
        title="Kanban View"
      >
        <Columns className="h-4 w-4" />
      </Button>
    </div>
  );
}