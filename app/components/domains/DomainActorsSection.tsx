"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Building2, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { DropdownFilter, type FilterCategory } from "@/components/ui/dropdown-filter";
import type { DomainActorInsight, DomainActorInsightsData } from "@/app/types/domainActors";

interface DomainActorsSectionProps {
  data: DomainActorInsightsData;
}

function formatDate(value?: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ActorCard({
  actor,
  onClick,
  showNewBadge = false,
}: {
  actor: DomainActorInsight;
  onClick: () => void;
  showNewBadge?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        {actor.logoUrl ? (
          <Image
            src={actor.logoUrl}
            alt={actor.name}
            width={40}
            height={40}
            className="w-10 h-10 object-contain flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-sm text-muted-foreground">
              {actor.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-sm line-clamp-1">{actor.name}</h3>
            {showNewBadge && actor.isNewStartup && (
              <Badge variant="secondary" className="text-[10px]">
                New
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            {actor.typeMain && <span>{actor.typeMain}</span>}
            {actor.geography && <span>- {actor.geography}</span>}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
            <span>Domain Signals: {actor.actionCount}</span>
            {formatDate(actor.firstSeenAt) && <span>First seen: {formatDate(actor.firstSeenAt)}</span>}
          </div>
        </div>
      </div>
    </button>
  );
}

export function DomainActorsSection({ data }: DomainActorsSectionProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"actors" | "startups">("actors");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    type: [],
    typeMain: [],
    geography: [],
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const hasAny = data.actors.length > 0;

  if (!hasAny) {
    return (
      <div className="border rounded-lg bg-card p-6 mt-8">
        <h2 className="text-2xl font-bold mb-2">Active Actors</h2>
        <p className="text-sm text-muted-foreground">
          No actor activity found in visible signals for this domain yet.
        </p>
      </div>
    );
  }

  const tabItems = activeTab === "actors" ? data.actors : data.startups;

  const filterCategories = useMemo<FilterCategory[]>(() => {
    const typeValues = Array.from(
      new Set(
        tabItems
          .map((item) => (item.type ?? "").trim())
          .filter((value) => value.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));

    const typeMainValues = Array.from(
      new Set(
        tabItems.flatMap((item) =>
          (item.typeMainValues ?? [])
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
        )
      )
    ).sort((a, b) => a.localeCompare(b));

    const geographyValues = Array.from(
      new Set(
        tabItems
          .map((item) => (item.geography ?? "").trim())
          .filter((value) => value.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));

    const categories: FilterCategory[] = [];
    if (typeValues.length > 0) {
      categories.push({
        id: "type",
        label: "Type",
        options: typeValues.map((value) => ({ value, label: value })),
      });
    }
    if (typeMainValues.length > 0) {
      categories.push({
        id: "typeMain",
        label: "Actor Type",
        options: typeMainValues.map((value) => ({ value, label: value })),
      });
    }
    if (geographyValues.length > 0) {
      categories.push({
        id: "geography",
        label: "Geography",
        options: geographyValues.map((value) => ({ value, label: value })),
      });
    }
    return categories;
  }, [tabItems]);

  const filteredTabItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const selectedTypes = selectedFilters.type ?? [];
    const selectedTypeMain = selectedFilters.typeMain ?? [];
    const selectedGeography = selectedFilters.geography ?? [];

    return tabItems.filter((item) => {
      const typeFilterMatch =
        selectedTypes.length === 0 ||
        (item.type ? selectedTypes.includes(item.type) : false);
      const typeMainMatch =
        selectedTypeMain.length === 0 ||
        (item.typeMainValues ?? []).some((value) => selectedTypeMain.includes(value));
      const geoMatch =
        selectedGeography.length === 0 ||
        (item.geography ? selectedGeography.includes(item.geography) : false);
      const searchMatch =
        query.length === 0 ||
        item.name.toLowerCase().includes(query) ||
        (item.type ?? "").toLowerCase().includes(query) ||
        (item.typeMainValues ?? []).some((value) => value.toLowerCase().includes(query)) ||
        (item.geography ?? "").toLowerCase().includes(query);
      return typeFilterMatch && typeMainMatch && geoMatch && searchMatch;
    });
  }, [tabItems, selectedFilters, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedFilters, searchQuery, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredTabItems.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const pagedActors =
    activeTab === "actors" ? filteredTabItems.slice(startIndex, endIndex) : [];
  const filteredStartups = activeTab === "startups" ? filteredTabItems : [];
  const newStartups = filteredStartups.filter((actor) => actor.isNewStartup);
  const pagedAllStartups = filteredStartups.slice(startIndex, endIndex);

  return (
    <div className="border rounded-lg bg-card p-4 mt-8">
      <h2 className="text-2xl font-bold mb-4">Active Actors</h2>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "actors" | "startups")} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="actors" className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            Actors ({data.actors.length})
          </TabsTrigger>
          <TabsTrigger value="startups" className="inline-flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            Startups ({data.startups.length})
          </TabsTrigger>
        </TabsList>

        <div className="mb-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full">
            {filterCategories.length > 0 && (
              <DropdownFilter
                categories={filterCategories}
                selected={selectedFilters}
                onSelectionChange={setSelectedFilters}
                triggerLabel="Filter"
                showSearch
                searchPlaceholder="Search filters..."
                clearAllLabel="Clear all"
                doneLabel="Done"
              />
            )}
            <div className="w-full sm:max-w-sm">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actors..."
                className="w-full"
              />
            </div>
          </div>
          <div className="w-full sm:w-32">
            <Select value={String(itemsPerPage)} onValueChange={(value) => setItemsPerPage(Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="actors" className="m-0">
          <div className="text-sm text-muted-foreground mb-3">
            Showing {filteredTabItems.length === 0 ? 0 : startIndex + 1}-
            {Math.min(endIndex, filteredTabItems.length)} of {filteredTabItems.length}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedActors.map((actor) => (
              <ActorCard
                key={actor.id}
                actor={actor}
                onClick={() => router.push(`/directory/${actor.id}`)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="startups" className="m-0 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              New Startups (Last 30 Days)
            </h3>
            {newStartups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No newly added startups in the last 30 days.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {newStartups.map((actor) => (
                  <ActorCard
                    key={actor.id}
                    actor={actor}
                    showNewBadge
                    onClick={() => router.push(`/directory/${actor.id}`)}
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              All Startups
            </h3>
            <div className="text-sm text-muted-foreground mb-3">
              Showing {filteredStartups.length === 0 ? 0 : startIndex + 1}-
              {Math.min(endIndex, filteredStartups.length)} of {filteredStartups.length}
            </div>
            {filteredStartups.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No startup actors found for this domain.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pagedAllStartups.map((actor) => (
                  <ActorCard
                    key={`all-${actor.id}`}
                    actor={actor}
                    showNewBadge
                    onClick={() => router.push(`/directory/${actor.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      {filteredTabItems.length > 0 && totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
