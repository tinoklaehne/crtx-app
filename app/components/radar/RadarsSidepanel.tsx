"use client";

import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanel } from "../ui/resizable-panel";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import type { Radar } from "@/app/types/radars";

interface RadarsSidepanelProps {
  radars: Radar[];
  currentRadarId?: string;
}

export function RadarsSidepanel({ radars, currentRadarId }: RadarsSidepanelProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRadars = useMemo(() => {
    if (!searchQuery.trim()) return radars;
    const query = searchQuery.toLowerCase();
    return radars.filter(
      (radar) =>
        radar.name.toLowerCase().includes(query) ||
        (radar.description && radar.description.toLowerCase().includes(query))
    );
  }, [radars, searchQuery]);

  const handleRadarClick = (radarId: string) => {
    router.push(`/radars?radar=${radarId}`);
  };

  return (
    <ResizablePanel
      defaultWidth={320}
      minWidth={280}
      maxWidth={480}
      className="border-r bg-card"
    >
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Trend Radars</h2>
        <Input
          placeholder="Search radars..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      <ScrollArea className="h-[calc(100vh-120px)]">
        <div>
          {filteredRadars.map((radar, index) => {
            const isActive = radar.id === currentRadarId;
            return (
              <div
                key={radar.id}
                onClick={() => handleRadarClick(radar.id)}
                className={`
                  px-4 py-3 cursor-pointer transition-colors
                  ${
                    index < filteredRadars.length - 1
                      ? "border-b border-border"
                      : ""
                  }
                  ${isActive ? "bg-secondary" : "hover:bg-secondary/50"}
                `}
              >
                <div className="font-medium text-sm">{radar.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {radar.trends.length}{" "}
                  {radar.trends.length === 1 ? "trend" : "trends"}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </ResizablePanel>
  );
}
