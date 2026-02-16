"use client";

import { useState, useMemo, Suspense } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/layout/Navbar";
import { ActorsSidepanel } from "@/app/components/directory/ActorsSidepanel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { DropdownFilter, type FilterCategory } from "@/components/ui/dropdown-filter";
import type { Actor } from "@/app/types/actors";

const PAGE_SIZE = 15;

type SortKey = "name" | "signals" | "geography" | "type";
type SortOrder = "asc" | "desc";

interface DirectoryListPageProps {
  initialActors: Actor[];
  /** Map of actorlist record id → name (watchlist labels) */
  actorlistNames?: Record<string, string>;
  /** Map of domain id → name for AREA column */
  domainNames?: Record<string, string>;
  /** Map of actor id → array of domain IDs */
  actorsDomains?: Record<string, string[]>;
  loadError?: boolean;
}

function SortHeader({
  label,
  sortKey,
  currentSortKey,
  currentOrder,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  currentSortKey: SortKey;
  currentOrder: SortOrder;
  onSort: (key: SortKey) => void;
  align?: "left" | "right" | "center";
}) {
  const isActive = currentSortKey === sortKey;
  const Icon = isActive ? (currentOrder === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th
      className={`p-4 font-semibold cursor-pointer hover:bg-muted/70 transition-colors select-none ${
        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
      }`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <Icon className={`h-4 w-4 ${isActive ? "opacity-100" : "opacity-50"}`} />
      </span>
    </th>
  );
}

export function DirectoryListPage({ 
  initialActors, 
  actorlistNames = {}, 
  domainNames = {},
  actorsDomains = {},
  loadError 
}: DirectoryListPageProps) {
  const router = useRouter();
  const [actors] = useState<Actor[]>(initialActors);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    type: [],
    geography: [],
    watchlist: [],
  });
  const [sortKey, setSortKey] = useState<SortKey>("signals");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);

  // Build filter categories
  const filterCategories = useMemo<FilterCategory[]>(() => {
    const categories: FilterCategory[] = [];

    // Type category
    const types = new Set<string>();
    actors.forEach(actor => {
      if (actor.typeMain) types.add(actor.typeMain);
    });
    if (types.size > 0) {
      categories.push({
        id: 'type',
        label: 'Type',
        options: Array.from(types).sort().map(type => ({
          value: type,
          label: type,
        })),
      });
    }

    // Geography category
    const geographies = new Set<string>();
    actors.forEach(actor => {
      if (actor.geography) geographies.add(actor.geography);
    });
    if (geographies.size > 0) {
      categories.push({
        id: 'geography',
        label: 'Geography',
        options: Array.from(geographies).sort().map(geo => ({
          value: geo,
          label: geo,
        })),
      });
    }

    // Watchlist category
    const watchlistIds = new Set<string>();
    actors.forEach(actor => {
      (actor.actorListIds || []).forEach(id => watchlistIds.add(id));
    });
    if (watchlistIds.size > 0) {
      categories.push({
        id: 'watchlist',
        label: 'Watchlist',
        options: Array.from(watchlistIds).sort().map(id => ({
          value: id,
          label: actorlistNames[id] || id,
        })),
      });
    }

    return categories;
  }, [actors, actorlistNames]);

  // Filter actors
  const filteredActors = useMemo(() => {
    let filtered = actors;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(actor =>
        actor.name.toLowerCase().includes(query) ||
        actor.description?.toLowerCase().includes(query) ||
        actor.typeMain?.toLowerCase().includes(query) ||
        actor.geography?.toLowerCase().includes(query)
      );
    }

    // Type filter
    const selectedTypes = selectedFilters.type || [];
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(actor => 
        actor.typeMain && selectedTypes.includes(actor.typeMain)
      );
    }

    // Geography filter
    const selectedGeographies = selectedFilters.geography || [];
    if (selectedGeographies.length > 0) {
      filtered = filtered.filter(actor => 
        actor.geography && selectedGeographies.includes(actor.geography)
      );
    }

    // Watchlist filter
    const selectedWatchlists = selectedFilters.watchlist || [];
    if (selectedWatchlists.length > 0) {
      filtered = filtered.filter(actor => 
        (actor.actorListIds || []).some(id => selectedWatchlists.includes(id))
      );
    }

    return filtered;
  }, [actors, searchQuery, selectedFilters]);

  // Sort actors
  const sortedActors = useMemo(() => {
    const sorted = [...filteredActors].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = (a.name || "").localeCompare(b.name || "");
          break;
        case "signals": {
          const aSignals = (a.actionIds?.length || 0);
          const bSignals = (b.actionIds?.length || 0);
          cmp = aSignals - bSignals;
          break;
        }
        case "geography":
          cmp = (a.geography || "").localeCompare(b.geography || "");
          break;
        case "type":
          cmp = (a.typeMain || "").localeCompare(b.typeMain || "");
          break;
        default:
          cmp = 0;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredActors, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedActors.length / PAGE_SIZE));
  const paginatedActors = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedActors.slice(start, start + PAGE_SIZE);
  }, [sortedActors, page]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder(key === "name" || key === "geography" || key === "type" ? "asc" : "desc");
    }
    setPage(1);
  };


  if (loadError) {
    return (
      <div className="flex h-screen bg-background text-foreground">
        <Navbar />
        <div className="flex-1 overflow-auto flex items-center justify-center p-6">
          <div className="max-w-sm text-center space-y-4">
            <p className="text-muted-foreground">
              The directory could not be loaded. This can happen when the request times out.
            </p>
            <Button
              variant="outline"
              onClick={() => router.refresh()}
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Navbar />
      <Suspense fallback={<div className="w-64 border-r bg-card" />}>
        <ActorsSidepanel actors={actors} actorlistNames={actorlistNames} />
      </Suspense>
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Suchen"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="max-w-md"
                />
              </div>
              {filterCategories.length > 0 && (
                <DropdownFilter
                  categories={filterCategories}
                  selected={selectedFilters}
                  onSelectionChange={setSelectedFilters}
                  triggerLabel="Filtern"
                  showSearch={true}
                  searchPlaceholder="Search filters..."
                  clearAllLabel="Clear all"
                  doneLabel="Done"
                />
              )}
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-4 font-semibold w-16 text-center">LOGO</th>
                    <SortHeader
                      label="NAME"
                      sortKey="name"
                      currentSortKey={sortKey}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                      align="left"
                    />
                    <SortHeader
                      label="SIGNALS"
                      sortKey="signals"
                      currentSortKey={sortKey}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                      align="right"
                    />
                    <SortHeader
                      label="GEOGRAPHY"
                      sortKey="geography"
                      currentSortKey={sortKey}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                      align="left"
                    />
                    <SortHeader
                      label="TYPE"
                      sortKey="type"
                      currentSortKey={sortKey}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                      align="left"
                    />
                  </tr>
                </thead>
                <tbody>
                  {paginatedActors.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        {searchQuery || Object.values(selectedFilters).some(f => f.length > 0)
                          ? "No actors found matching your search."
                          : "No actors available."}
                      </td>
                    </tr>
                  ) : (
                    paginatedActors.map((actor) => {
                      const signalsCount = actor.actionIds?.length || 0;
                      return (
                        <tr
                          key={actor.id}
                          className="border-t hover:bg-secondary/50 cursor-pointer transition-colors"
                          onClick={() => router.push(`/directory/${actor.id}`)}
                        >
                          <td className="p-4 text-center">
                            {actor.logo ? (
                              <Image
                                src={actor.logo}
                                alt={actor.name}
                                width={32}
                                height={32}
                                className="w-8 h-8 object-contain mx-auto"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center mx-auto">
                                <span className="text-xs text-muted-foreground">
                                  {actor.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="font-semibold">{actor.name}</div>
                            {actor.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {actor.description}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            {signalsCount.toLocaleString()}
                          </td>
                          <td className="p-4">
                            {actor.geography || "-"}
                          </td>
                          <td className="p-4">
                            {actor.typeMain || "-"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sortedActors.length)} of {sortedActors.length} actors
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
