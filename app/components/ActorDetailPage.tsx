"use client";

import type { Actor } from "@/app/types/actors";
import { MarkdownContent } from "@/app/components/ui/markdown-content";

interface ActorDetailPageProps {
  actor: Actor;
}

export function ActorDetailPage({ actor }: ActorDetailPageProps) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4">{actor.name}</h1>
        {actor.description ? (
          <MarkdownContent
            content={actor.description}
            className="text-muted-foreground"
          />
        ) : (
          <p className="text-muted-foreground">No description available.</p>
        )}
      </div>
    </div>
  );
}
