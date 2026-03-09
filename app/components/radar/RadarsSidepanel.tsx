"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanel } from "../ui/resizable-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import type { Radar } from "@/app/types/radars";

interface RadarsSidepanelProps {
  radars: Radar[];
  currentRadarId?: string;
  onCreateRadarClick?: () => void;
  createMessage?: string | null;
}

export function RadarsSidepanel({
  radars,
  currentRadarId,
  onCreateRadarClick,
  createMessage,
}: RadarsSidepanelProps) {
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
        <div className="flex items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-semibold">Trend Radars</h2>
          <Button size="sm" onClick={onCreateRadarClick}>
            <Plus className="h-4 w-4 mr-1" />
            Create
          </Button>
        </div>
        <Input
          placeholder="Search radars..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        {createMessage && (
          <p className="text-xs text-muted-foreground mt-2">{createMessage}</p>
        )}
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
                <div className="flex items-center gap-3">
                  {radar.logoUrl ? (
                    <Image
                      src={radar.logoUrl}
                      alt={radar.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {radar.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-sm flex items-center gap-1.5">
                      <span>{radar.name}</span>
                      {(radar.status || "").trim().toLowerCase() === "draft" && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Draft
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {radar.trends.length}{" "}
                      {radar.trends.length === 1 ? "trend" : "trends"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </ResizablePanel>
  );
}
