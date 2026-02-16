"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanel } from "../ui/resizable-panel";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import type { BusinessDomain } from "@/app/types/businessDomains";
import {
  DropdownFilter,
  type FilterCategory,
} from "@/components/ui/dropdown-filter";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

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
    if (!arenaSel?.length) return list;
    return list.filter((domain) => {
      const ids = domain.arenaIds ?? [];
      return arenaSel.some((id) => ids.includes(id));
    });
  }, [domains, searchQuery, selectedFilters]);

  const handleDomainClick = (domainId: string) => {
    router.push(`/domains/${domainId}`);
  };

  return (
    <ResizablePanel defaultWidth={320} minWidth={280} maxWidth={480} className="border-r bg-card">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Domains</h2>
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
                      className="w-6 h-6 flex-shrink-0 object-contain"
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
