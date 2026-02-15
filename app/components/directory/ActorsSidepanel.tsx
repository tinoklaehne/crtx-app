"use client";

import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanel } from "../ui/resizable-panel";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import type { Actor } from "@/app/types/actors";

interface ActorsSidepanelProps {
  actors: Actor[];
  currentActorId?: string;
}

export function ActorsSidepanel({ actors, currentActorId }: ActorsSidepanelProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredActors = useMemo(() => {
    if (!searchQuery.trim()) return actors;
    const query = searchQuery.toLowerCase();
    return actors.filter(
      (actor) =>
        actor.name.toLowerCase().includes(query) ||
        (actor.description && actor.description.toLowerCase().includes(query))
    );
  }, [actors, searchQuery]);

  const handleActorClick = (actorId: string) => {
    router.push(`/directory/${actorId}`);
  };

  return (
    <ResizablePanel
      defaultWidth={320}
      minWidth={280}
      maxWidth={480}
      className="border-r bg-card"
    >
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Directory</h2>
        <Input
          placeholder="Search actors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      <ScrollArea className="h-[calc(100vh-120px)]">
        <div>
          {filteredActors.map((actor, index) => {
            const isActive = actor.id === currentActorId;
            return (
              <div
                key={actor.id}
                onClick={() => handleActorClick(actor.id)}
                className={`
                  px-4 py-3 cursor-pointer transition-colors
                  ${
                    index < filteredActors.length - 1
                      ? "border-b border-border"
                      : ""
                  }
                  ${isActive ? "bg-secondary" : "hover:bg-secondary/50"}
                `}
              >
                <div className="font-medium text-sm">{actor.name}</div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </ResizablePanel>
  );
}
