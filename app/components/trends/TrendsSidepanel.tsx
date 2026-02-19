"use client";

import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanel } from "@/app/components/ui/resizable-panel";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useState, useMemo, useEffect } from "react";
import type { Trend } from "@/app/types/trends";
import {
  DropdownFilter,
  type FilterCategory,
} from "@/components/ui/dropdown-filter";

function buildTrendsFilterCategories(trends: Trend[]): FilterCategory[] {
  const universeSet = new Set<string>();
  const domainSet = new Set<string>();
  trends.forEach((t) => {
    if (t.universe?.trim()) universeSet.add(t.universe.trim());
    if (t.domain?.trim()) domainSet.add(t.domain.trim());
  });
  return [
    {
      id: "universe",
      label: "Universe",
      options: [...universeSet].sort().map((v) => ({ value: v, label: v })),
    },
    {
      id: "category",
      label: "Category",
      options: [...domainSet].sort().map((v) => ({ value: v, label: v })),
    },
  ];
}

interface TrendsSidepanelProps {
  trends: Trend[];
  showSubscribedOnly?: boolean;
  onShowSubscribedOnlyChange?: (checked: boolean) => void;
  subscribedTrendIds?: string[];
}

export function TrendsSidepanel({
  trends,
  showSubscribedOnly: controlledShowSubscribedOnly,
  onShowSubscribedOnlyChange,
  subscribedTrendIds: controlledSubscribedTrendIds,
}: TrendsSidepanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [internalSubscribedTrendIds, setInternalSubscribedTrendIds] = useState<string[]>([]);
  const [internalShowSubscribedOnly, setInternalShowSubscribedOnly] = useState(false);

  const isControlled = onShowSubscribedOnlyChange != null;
  const showSubscribedOnly = isControlled ? (controlledShowSubscribedOnly ?? false) : internalShowSubscribedOnly;
  const subscribedTrendIds = isControlled ? (controlledSubscribedTrendIds ?? []) : internalSubscribedTrendIds;

  useEffect(() => {
    if (isControlled) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/user/subscribed-trends");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setInternalSubscribedTrendIds(data.trendIds ?? []);
      } catch (e) {
        console.error("Failed to load subscribed trends", e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isControlled]);

  const filterCategories = useMemo(
    () => buildTrendsFilterCategories(trends),
    [trends]
  );

  const filteredTrends = useMemo(() => {
    let list = trends;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => t.name.toLowerCase().includes(q));
    }
    const universeSel = selectedFilters.universe;
    const categorySel = selectedFilters.category;
    if (universeSel?.length) {
      list = list.filter((t) => t.universe && universeSel.includes(t.universe));
    }
    if (categorySel?.length) {
      list = list.filter((t) => t.domain && categorySel.includes(t.domain));
    }
    if (showSubscribedOnly) {
      const set = new Set(subscribedTrendIds);
      list = list.filter((t) => set.has(t.id));
    }
    return list;
  }, [trends, searchQuery, selectedFilters, showSubscribedOnly, subscribedTrendIds]);

  const currentTrendId = pathname?.startsWith("/trends/") ? pathname.replace("/trends/", "").split("/")[0] : null;

  return (
    <ResizablePanel
      defaultWidth={320}
      minWidth={280}
      maxWidth={480}
      className="border-r bg-card"
    >
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Trends</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">My Trends</span>
            <Switch
              checked={showSubscribedOnly}
              onCheckedChange={(checked) =>
                isControlled ? onShowSubscribedOnlyChange?.(checked) : setInternalShowSubscribedOnly(checked)
              }
              aria-label="Show only bookmarked trends"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Search by name..."
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
      <ScrollArea className="h-[calc(100vh-160px)]">
        <div>
          {filteredTrends.map((trend, index) => {
            const isActive = trend.id === currentTrendId;
            return (
              <div
                key={trend.id}
                onClick={() => router.push(`/trends/${trend.id}`)}
                className={`
                  px-4 py-3 cursor-pointer transition-colors
                  ${index < filteredTrends.length - 1 ? "border-b border-border" : ""}
                  ${isActive ? "bg-secondary" : "hover:bg-secondary/50"}
                `}
              >
                <div className="flex items-center gap-3">
                  {(trend.iconUrl ?? trend.imageUrl) ? (
                    <Image
                      src={trend.iconUrl ?? trend.imageUrl}
                      alt=""
                      width={24}
                      height={24}
                      className="w-6 h-6 flex-shrink-0 object-contain invert dark:invert-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {trend.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{trend.name}</div>
                    {trend.domain && (
                      <div className="text-xs text-muted-foreground mt-0.5">{trend.domain}</div>
                    )}
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
