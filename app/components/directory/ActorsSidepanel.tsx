"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanel } from "../ui/resizable-panel";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import type { Actor } from "@/app/types/actors";
import {
  DropdownFilter,
  type FilterCategory,
} from "@/components/ui/dropdown-filter";

interface ActorsSidepanelProps {
  actors: Actor[];
  /** Map of actorlist record id → name for watchlist filter labels */
  actorlistNames?: Record<string, string>;
  currentActorId?: string;
}

function buildDirectoryFilterCategories(
  actors: Actor[],
  actorlistNames: Record<string, string> = {}
): FilterCategory[] {
  const typeMainSet = new Set<string>();
  const geographySet = new Set<string>();
  const watchlistIdSet = new Set<string>();
  const toStr = (v: unknown): string =>
    v == null ? '' : Array.isArray(v) ? (v[0] != null ? String(v[0]) : '') : String(v);

  actors.forEach((a) => {
    const typeMain = toStr(a.typeMain).trim();
    if (typeMain) typeMainSet.add(typeMain);
    const geography = toStr(a.geography).trim();
    if (geography) geographySet.add(geography);
    (a.actorListIds ?? []).forEach((id) => watchlistIdSet.add(id));
  });
  return [
    {
      id: "type",
      label: "Type",
      options: [...typeMainSet].sort().map((v) => ({ value: v, label: v })),
    },
    {
      id: "geography",
      label: "Geography",
      options: [...geographySet].sort().map((v) => ({ value: v, label: v })),
    },
    {
      id: "watchlist",
      label: "Watchlists",
      options: [...watchlistIdSet].sort().map((id) => ({
        value: id,
        label: actorlistNames[id] ?? id,
      })),
    },
  ];
}

export function ActorsSidepanel({ actors, actorlistNames = {}, currentActorId }: ActorsSidepanelProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  const filterCategories = useMemo(
    () => buildDirectoryFilterCategories(actors, actorlistNames),
    [actors, actorlistNames]
  );

  const filteredActors = useMemo(() => {
    let list = actors;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (actor) =>
          actor.name.toLowerCase().includes(query) ||
          (actor.description && actor.description.toLowerCase().includes(query))
      );
    }
    const typeSel = selectedFilters.type;
    const geoSel = selectedFilters.geography;
    const watchlistSel = selectedFilters.watchlist;
    const hasType = typeSel?.length;
    const hasGeo = geoSel?.length;
    const hasWatchlist = watchlistSel?.length;
    if (!hasType && !hasGeo && !hasWatchlist) return list;
    const actorTypeStr = (a: Actor) => (a.typeMain != null ? String(a.typeMain) : '').trim();
    const actorGeoStr = (a: Actor) => (a.geography != null ? String(a.geography) : '').trim();
    return list.filter((actor) => {
      if (hasType) {
        const t = actorTypeStr(actor);
        if (!t || !typeSel.includes(t)) return false;
      }
      if (hasGeo) {
        const g = actorGeoStr(actor);
        if (!g || !geoSel.includes(g)) return false;
      }
      if (hasWatchlist) {
        const ids = actor.actorListIds ?? [];
        if (!watchlistSel.some((id) => ids.includes(id))) return false;
      }
      return true;
    });
  }, [actors, searchQuery, selectedFilters]);

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
        <div className="flex gap-2">
          <Input
            placeholder="Search actors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <DropdownFilter
            categories={filterCategories}
            selected={selectedFilters}
            onSelectionChange={setSelectedFilters}
            triggerLabel="Filter"
            searchPlaceholder="Search"
            clearAllLabel="Clear all"
            doneLabel="Done"
          />
        </div>
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
                <div className="flex items-center gap-3">
                  {actor.logo ? (
                    <Image
                      src={actor.logo}
                      alt={actor.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {actor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="font-medium text-sm">{actor.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </ResizablePanel>
  );
}
