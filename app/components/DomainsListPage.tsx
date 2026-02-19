"use client";

import { useState, useMemo, Suspense, useId } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/layout/Navbar";
import { DomainsSidepanel } from "@/app/components/domains/DomainsSidepanel";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { DomainWithMomentum } from "@/app/types/businessDomains";

const PAGE_SIZE = 15;

type SortKey = "name" | "signalsMonth" | "signalsTotal";
type SortOrder = "asc" | "desc";

interface DomainsListPageProps {
  initialDomains: DomainWithMomentum[];
  /** Map of record id → name for Arena filter labels (from full Domains table) */
  arenaNames?: Record<string, string>;
}

function MomentumSparkline({ data }: { data: { period: string; count: number }[] }) {
  const gradientId = `sparkline-${useId().replace(/:/g, '')}`;
  if (!data || data.length === 0) {
    return <div className="h-8 w-full flex items-center justify-center text-muted-foreground text-xs">—</div>;
  }
  const maxCount = Math.max(1, ...data.map(d => d.count));
  return (
    <div className="h-8 w-24 min-w-[96px] bg-background" title={data.map(d => `${d.period}: ${d.count}`).join("\n")}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis dataKey="period" hide />
          <YAxis hide domain={[0, maxCount]} />
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <div className="bg-popover border rounded px-2 py-1 text-xs">
                  {payload[0].payload.period}: {payload[0].value}
                </div>
              ) : null
            }
          />
          <Area
            type="linear"
            dataKey="count"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 2 }}
            activeDot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
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

export function DomainsListPage({ initialDomains, arenaNames = {} }: DomainsListPageProps) {
  const router = useRouter();
  const [domains] = useState<DomainWithMomentum[]>(initialDomains);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("signalsMonth");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);

  const filteredDomains = useMemo(() => {
    if (!searchQuery.trim()) return domains;
    const query = searchQuery.toLowerCase();
    return domains.filter(domain =>
      domain.name.toLowerCase().includes(query) ||
      domain.description?.toLowerCase().includes(query)
    );
  }, [domains, searchQuery]);

  const sortedDomains = useMemo(() => {
    const sorted = [...filteredDomains].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = (a.name || "").localeCompare(b.name || "");
          break;
        case "signalsMonth": {
          const am = a.signalsMonth ?? 0;
          const bm = b.signalsMonth ?? 0;
          cmp = am - bm;
          break;
        }
        case "signalsTotal": {
          const at = a.signalsTotal ?? 0;
          const bt = b.signalsTotal ?? 0;
          cmp = at - bt;
          break;
        }
        default:
          cmp = 0;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredDomains, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedDomains.length / PAGE_SIZE));
  const paginatedDomains = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedDomains.slice(start, start + PAGE_SIZE);
  }, [sortedDomains, page]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder(key === "name" ? "asc" : "desc");
    }
    setPage(1);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Navbar />
      {domains.length > 0 && (
        <Suspense fallback={<div className="w-64 border-r bg-card" />}>
          <DomainsSidepanel domains={domains} arenaNames={arenaNames} />
        </Suspense>
      )}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <SortHeader
                      label="NAME"
                      sortKey="name"
                      currentSortKey={sortKey}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                      align="left"
                    />
                    <th className="text-center p-4 font-semibold w-28">MOMENTUM</th>
                    <SortHeader
                      label="SIGNALS (MONTH)"
                      sortKey="signalsMonth"
                      currentSortKey={sortKey}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                      align="right"
                    />
                    <SortHeader
                      label="SIGNALS (TOTAL)"
                      sortKey="signalsTotal"
                      currentSortKey={sortKey}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                      align="right"
                    />
                  </tr>
                </thead>
                <tbody>
                  {paginatedDomains.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">
                        No domains available.
                      </td>
                    </tr>
                  ) : (
                    paginatedDomains.map((domain) => (
                      <tr
                        key={domain.id}
                        className="border-t hover:bg-secondary/50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/domains/${domain.id}`)}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            {domain.status && (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  domain.status.toLowerCase() === "hot"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                                }`}
                              >
                                {domain.status}
                              </span>
                            )}
                            {(domain.iconAi ?? domain.iconUrl) && (
                              <Image
                                src={domain.iconAi ?? domain.iconUrl!}
                                alt=""
                                width={24}
                                height={24}
                                className="w-6 h-6 flex-shrink-0 object-contain invert dark:invert-0"
                              />
                            )}
                            <div>
                              <div className="font-semibold">{domain.name}</div>
                              {domain.description && (
                                <div className="text-sm text-muted-foreground line-clamp-1">
                                  {domain.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-2 align-middle" onClick={e => e.stopPropagation()}>
                          <MomentumSparkline data={domain.momentumData ?? []} />
                        </td>
                        <td className="p-4 text-right">
                          {domain.signalsMonth !== undefined ? domain.signalsMonth.toLocaleString() : "-"}
                        </td>
                        <td className="p-4 text-right">
                          {domain.signalsTotal !== undefined ? domain.signalsTotal.toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sortedDomains.length)} of {sortedDomains.length} domains
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
