"use client";

import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanel } from "../ui/resizable-panel";
import { Input } from "@/components/ui/input";
import { useState, useMemo, useEffect } from "react";
import type { BusinessDomain } from "@/app/types/businessDomains";
import {
  DropdownFilter,
  type FilterCategory,
} from "@/components/ui/dropdown-filter";
import { Switch } from "@/components/ui/switch";

interface DomainsSidepanelProps {
  domains: BusinessDomain[];
  /** Map of record id → name for Arena labels (from full Domains table "Name" column). Pass from server when list is filtered (e.g. Sub-Area only). */
  arenaNames?: Record<string, string>;
  currentDomainId?: string;
}

function buildDomainsFilterCategories(
  domains: BusinessDomain[],
  /** Arena record id → name (Arenas are in the same Domains table, column "Name") */
  arenaNames: Record<string, string> = {}
): FilterCategory[] {
  const arenaIdSet = new Set<string>();
  domains.forEach((d) => (d.arenaIds ?? []).forEach((id) => arenaIdSet.add(id)));
  return [
    {
      id: "arena",
      label: "Arena",
      options: [...arenaIdSet].sort().map((id) => ({
        value: id,
        label: arenaNames[id] ?? id,
      })),
    },
  ];
}

export function DomainsSidepanel({ domains, arenaNames: arenaNamesProp, currentDomainId }: DomainsSidepanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const parseFiltersFromUrl = (): Record<string, string[]> => {
    const filters: Record<string, string[]> = {};
    const arenaParam = searchParams.get("arena");
    if (arenaParam) {
      filters.arena = arenaParam.split(",").filter(Boolean);
    }
    return filters;
  };

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>(parseFiltersFromUrl);
  const [subscribedDomainIds, setSubscribedDomainIds] = useState<string[]>([]);
  const [showSubscribedOnly, setShowSubscribedOnly] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery);
    }
    const arenaSel = selectedFilters.arena;
    if (arenaSel?.length) {
      params.set("arena", arenaSel.join(","));
    }
    const newQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (newQuery !== currentQuery) {
      const newUrl = `${pathname}${newQuery ? `?${newQuery}` : ""}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchQuery, selectedFilters, pathname, router, searchParams]);

  useEffect(() => {
    let cancelled = false;
    async function loadSubscribedDomains() {
      try {
        const res = await fetch("/api/user/subscribed-domains");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          const domainIds: string[] = data.domainIds ?? [];
          setSubscribedDomainIds(domainIds);
        }
      } catch (error) {
        console.error("Failed to load subscribed domains for sidepanel", error);
      }
    }
    loadSubscribedDomains();
    return () => {
      cancelled = true;
    };
  }, []);

  const arenaNames = useMemo(() => {
    if (arenaNamesProp && Object.keys(arenaNamesProp).length > 0) return arenaNamesProp;
    return Object.fromEntries(domains.map((d) => [d.id, d.name]));
  }, [arenaNamesProp, domains]);
  const filterCategories = useMemo(
    () => buildDomainsFilterCategories(domains, arenaNames),
    [domains, arenaNames]
  );

  const filteredDomains = useMemo(() => {
    let list = domains;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((domain) =>
        domain.name.toLowerCase().includes(query)
      );
    }
    const arenaSel = selectedFilters.arena;
    if (arenaSel?.length) {
      list = list.filter((domain) => {
        const ids = domain.arenaIds ?? [];
        return arenaSel.some((id) => ids.includes(id));
      });
    }
    if (showSubscribedOnly && subscribedDomainIds.length > 0) {
      list = list.filter((domain) => subscribedDomainIds.includes(domain.id));
    }
    return list;
  }, [domains, searchQuery, selectedFilters, showSubscribedOnly, subscribedDomainIds]);

  const handleDomainClick = (domainId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    router.push(`/domains/${domainId}${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <ResizablePanel defaultWidth={320} minWidth={280} maxWidth={480} className="border-r bg-card">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Domains</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              My Domains
            </span>
            <Switch
              checked={showSubscribedOnly}
              onCheckedChange={setShowSubscribedOnly}
              aria-label="Show only subscribed domains"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search domains..."
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
          {filteredDomains.map((domain, index) => {
            const isActive = domain.id === currentDomainId;
            return (
              <div
                key={domain.id}
                onClick={() => handleDomainClick(domain.id)}
                className={`
                  px-4 py-3 cursor-pointer transition-colors
                  ${index < filteredDomains.length - 1 ? 'border-b border-border' : ''}
                  ${isActive 
                    ? 'bg-secondary' 
                    : 'hover:bg-secondary/50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {(domain.iconAi ?? domain.iconUrl) ? (
                    <Image
                      src={domain.iconAi ?? domain.iconUrl!}
                      alt=""
                      width={24}
                      height={24}
                      className="w-6 h-6 flex-shrink-0 object-contain invert dark:invert-0"
                    />
                  ) : null}
                  <div className="font-medium text-sm flex-1">{domain.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </ResizablePanel>
  );
}
