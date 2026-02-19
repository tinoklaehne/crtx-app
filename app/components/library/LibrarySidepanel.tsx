"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanel } from "../ui/resizable-panel";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useState, useMemo, useEffect } from "react";
import type { Report } from "@/app/types/reports";
import {
  DropdownFilter,
  type FilterCategory,
} from "@/components/ui/dropdown-filter";

interface LibrarySidepanelProps {
  reports: Report[];
  /** Map of domain record id → name (for Sub-Area labels) */
  domainNames?: Record<string, string>;
  currentReportId?: string;
  /** When provided (e.g. from LibraryListPage), the sidepanel toggle controls this state and the parent table filter */
  showSubscribedOnly?: boolean;
  onShowSubscribedOnlyChange?: (checked: boolean) => void;
  subscribedReportIds?: string[];
}

function buildLibraryFilterCategories(
  reports: Report[],
  domainNames: Record<string, string> = {}
): FilterCategory[] {
  const sourceSet = new Set<string>();
  const subAreaIdSet = new Set<string>();
  const yearSet = new Set<string>();

  reports.forEach((r) => {
    if (r.source?.trim()) sourceSet.add(r.source.trim());
    (r.subAreaIds ?? []).forEach((id) => {
      if (domainNames[id]) subAreaIdSet.add(id);
    });
    if (r.year) {
      const yearStr = String(r.year);
      if (yearStr.trim()) yearSet.add(yearStr);
    }
  });

  return [
    {
      id: "source",
      label: "Source",
      options: [...sourceSet].sort().map((v) => ({ value: v, label: v })),
    },
    {
      id: "subArea",
      label: "Domain",
      options: [...subAreaIdSet].sort((a, b) => {
        const nameA = domainNames[a] || a;
        const nameB = domainNames[b] || b;
        return nameA.localeCompare(nameB);
      }).map((id) => ({
        value: id,
        label: domainNames[id] ?? id,
      })),
    },
    {
      id: "year",
      label: "Year",
      options: [...yearSet].sort((a, b) => {
        const numA = parseInt(a) || 0;
        const numB = parseInt(b) || 0;
        return numB - numA; // Newest first
      }).map((year) => ({
        value: year,
        label: year,
      })),
    },
  ];
}

export function LibrarySidepanel({
  reports,
  domainNames = {},
  currentReportId,
  showSubscribedOnly: controlledShowSubscribedOnly,
  onShowSubscribedOnlyChange,
  subscribedReportIds: controlledSubscribedReportIds,
}: LibrarySidepanelProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [internalSubscribedReportIds, setInternalSubscribedReportIds] = useState<string[]>([]);
  const [internalShowSubscribedOnly, setInternalShowSubscribedOnly] = useState(false);

  const isControlled = onShowSubscribedOnlyChange != null;
  const showSubscribedOnly = isControlled ? (controlledShowSubscribedOnly ?? false) : internalShowSubscribedOnly;
  const subscribedReportIds = isControlled ? (controlledSubscribedReportIds ?? []) : internalSubscribedReportIds;

  useEffect(() => {
    if (isControlled) return;
    let cancelled = false;
    async function loadSubscribedReports() {
      try {
        const res = await fetch("/api/user/subscribed-reports");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          const reportIds: string[] = data.reportIds ?? [];
          setInternalSubscribedReportIds(reportIds);
        }
      } catch (error) {
        console.error("Failed to load subscribed reports for sidepanel", error);
      }
    }
    loadSubscribedReports();
    return () => {
      cancelled = true;
    };
  }, [isControlled]);

  const filterCategories = useMemo(
    () => buildLibraryFilterCategories(reports, domainNames),
    [reports, domainNames]
  );

  const filteredReports = useMemo(() => {
    let list = reports;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (report) =>
          report.name.toLowerCase().includes(query) ||
          (report.source && report.source.toLowerCase().includes(query))
      );
    }
    const sourceSel = selectedFilters.source;
    const subAreaSel = selectedFilters.subArea;
    const yearSel = selectedFilters.year;
    const hasSource = sourceSel?.length;
    const hasSubArea = subAreaSel?.length;
    const hasYear = yearSel?.length;
    
    // Apply other filters if they exist
    if (hasSource || hasSubArea || hasYear) {
      list = list.filter((report) => {
        if (hasSource) {
          if (!report.source || !sourceSel.includes(report.source)) return false;
        }
        if (hasSubArea) {
          const ids = report.subAreaIds ?? [];
          if (!subAreaSel.some((id) => ids.includes(id))) return false;
        }
        if (hasYear) {
          if (!report.year) return false;
          const yearStr = String(report.year);
          if (!yearSel.includes(yearStr)) return false;
        }
        return true;
      });
    }
    
    // My Reports filter - must be applied last
    if (showSubscribedOnly) {
      // Create a Set for faster lookup
      const subscribedSet = new Set(subscribedReportIds);
      list = list.filter((report) => subscribedSet.has(report.id));
    }
    
    return list;
  }, [reports, searchQuery, selectedFilters, showSubscribedOnly, subscribedReportIds]);

  const handleReportClick = (reportId: string) => {
    router.push(`/library/${reportId}`);
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
          <h2 className="text-lg font-semibold">Library</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              My Reports
            </span>
            <Switch
              checked={showSubscribedOnly}
              onCheckedChange={(checked) =>
                isControlled ? onShowSubscribedOnlyChange?.(checked) : setInternalShowSubscribedOnly(checked)
              }
              aria-label="Show only bookmarked reports"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search reports..."
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
          {filteredReports.map((report, index) => {
            const isActive = report.id === currentReportId;
            return (
              <div
                key={report.id}
                onClick={() => handleReportClick(report.id)}
                className={`
                  px-4 py-3 cursor-pointer transition-colors
                  ${
                    index < filteredReports.length - 1
                      ? "border-b border-border"
                      : ""
                  }
                  ${isActive ? "bg-secondary" : "hover:bg-secondary/50"}
                `}
              >
                <div className="flex items-center gap-3">
                  {report.sourceLogo ? (
                    <Image
                      src={report.sourceLogo}
                      alt={report.source || report.name}
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {report.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{report.name}</div>
                    {report.source && (
                      <div className="text-xs text-muted-foreground mt-1">{report.source}</div>
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
