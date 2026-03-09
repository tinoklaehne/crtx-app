"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanel } from "../ui/resizable-panel";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useState, useMemo, useEffect } from "react";
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
  showSubscribedOnly?: boolean;
  onShowSubscribedOnlyChange?: (checked: boolean) => void;
  subscribedActorIds?: string[];
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

export function ActorsSidepanel({
  actors,
  actorlistNames = {},
  currentActorId,
  showSubscribedOnly: controlledShowSubscribedOnly,
  onShowSubscribedOnlyChange,
  subscribedActorIds: controlledSubscribedActorIds,
}: ActorsSidepanelProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [internalSubscribedActorIds, setInternalSubscribedActorIds] = useState<string[]>([]);
  const [internalShowSubscribedOnly, setInternalShowSubscribedOnly] = useState(true);

  const isControlled = onShowSubscribedOnlyChange != null;
  const showSubscribedOnly = isControlled
    ? (controlledShowSubscribedOnly ?? false)
    : internalShowSubscribedOnly;

  useEffect(() => {
    if (isControlled) return;
    let cancelled = false;
    async function loadSubscribedActors() {
      try {
        const res = await fetch("/api/user/subscribed-actors");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          const actorIds: string[] = data.actorIds ?? [];
          setInternalSubscribedActorIds(actorIds);
        }
      } catch (error) {
        console.error("Failed to load subscribed actors for sidepanel", error);
      }
    }
    loadSubscribedActors();
    return () => {
      cancelled = true;
    };
  }, [isControlled]);

  const filterCategories = useMemo(
    () => buildDirectoryFilterCategories(actors, actorlistNames),
    [actors, actorlistNames]
  );

  const filteredActors = useMemo(() => {
    const subscribedActorIds = isControlled
      ? (controlledSubscribedActorIds ?? [])
      : internalSubscribedActorIds;

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
    if (hasType || hasGeo || hasWatchlist) {
      const actorTypeStr = (a: Actor) => (a.typeMain != null ? String(a.typeMain) : "").trim();
      const actorGeoStr = (a: Actor) => (a.geography != null ? String(a.geography) : "").trim();
      list = list.filter((actor) => {
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
    }
    if (showSubscribedOnly) {
      const subscribedSet = new Set(subscribedActorIds);
      list = list.filter((actor) => subscribedSet.has(actor.id));
    }
    return list;
  }, [
    actors,
    searchQuery,
    selectedFilters,
    showSubscribedOnly,
    isControlled,
    controlledSubscribedActorIds,
    internalSubscribedActorIds,
  ]);

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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Directory</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">My Actors</span>
            <Switch
              checked={showSubscribedOnly}
              onCheckedChange={(checked) =>
                isControlled
                  ? onShowSubscribedOnlyChange?.(checked)
                  : setInternalShowSubscribedOnly(checked)
              }
              aria-label="Show only subscribed actors"
            />
          </div>
        </div>
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
