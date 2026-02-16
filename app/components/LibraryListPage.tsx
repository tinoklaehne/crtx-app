"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/layout/Navbar";
import { LibrarySidepanel } from "@/app/components/library/LibrarySidepanel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { DropdownFilter, type FilterCategory } from "@/components/ui/dropdown-filter";
import type { Report } from "@/app/types/reports";

const PAGE_SIZE = 15;

type SortKey = "name" | "source" | "subArea";
type SortOrder = "asc" | "desc";

interface LibraryListPageProps {
  initialReports: Report[];
  /** Map of domain record id → name (for Sub-Area labels) */
  domainNames?: Record<string, string>;
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

export function LibraryListPage({ 
  initialReports, 
  domainNames = {}, 
  loadError 
}: LibraryListPageProps) {
  const router = useRouter();
  const [reports] = useState<Report[]>(initialReports);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    source: [],
    subArea: [],
  });
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [page, setPage] = useState(1);

  // Build filter categories
  const filterCategories = useMemo<FilterCategory[]>(() => {
    const categories: FilterCategory[] = [];

    // Source category
    const sources = new Set<string>();
    reports.forEach(report => {
      if (report.source) sources.add(report.source);
    });
    if (sources.size > 0) {
      categories.push({
        id: 'source',
        label: 'Source',
        options: Array.from(sources).sort().map(source => ({
          value: source,
          label: source,
        })),
      });
    }

    // Sub-Area category
    const subAreas = new Set<string>();
    reports.forEach(report => {
      (report.subAreaIds ?? []).forEach(id => {
        const name = domainNames[id];
        if (name) subAreas.add(id);
      });
    });
    if (subAreas.size > 0) {
      categories.push({
        id: 'subArea',
        label: 'Sub-Area',
        options: Array.from(subAreas).sort((a, b) => {
          const nameA = domainNames[a] || a;
          const nameB = domainNames[b] || b;
          return nameA.localeCompare(nameB);
        }).map(id => ({
          value: id,
          label: domainNames[id] || id,
        })),
      });
    }

    return categories;
  }, [reports, domainNames]);

  // Filter and search
  const filteredReports = useMemo(() => {
    let list = reports;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        report =>
          report.name.toLowerCase().includes(query) ||
          (report.source && report.source.toLowerCase().includes(query))
      );
    }

    // Source filter
    const sourceFilter = selectedFilters.source;
    if (sourceFilter && sourceFilter.length > 0) {
      list = list.filter(report => report.source && sourceFilter.includes(report.source));
    }

    // Sub-Area filter
    const subAreaFilter = selectedFilters.subArea;
    if (subAreaFilter && subAreaFilter.length > 0) {
      list = list.filter(report =>
        (report.subAreaIds ?? []).some(id => subAreaFilter.includes(id))
      );
    }

    return list;
  }, [reports, searchQuery, selectedFilters]);

  // Sort
  const sortedReports = useMemo(() => {
    const sorted = [...filteredReports];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "");
          break;
        case "source":
          comparison = (a.source || "").localeCompare(b.source || "");
          break;
        case "subArea":
          const aSubArea = (a.subAreaIds ?? []).map(id => domainNames[id] || "").join(", ") || "";
          const bSubArea = (b.subAreaIds ?? []).map(id => domainNames[id] || "").join(", ") || "";
          comparison = aSubArea.localeCompare(bSubArea);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
    return sorted;
  }, [filteredReports, sortKey, sortOrder, domainNames]);

  // Pagination
  const totalPages = Math.ceil(sortedReports.length / PAGE_SIZE);
  const paginatedReports = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedReports.slice(start, start + PAGE_SIZE);
  }, [sortedReports, page]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const activeFilterCount = Object.values(selectedFilters).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="flex h-screen overflow-hidden">
      <Navbar />
      <Suspense fallback={<div className="flex-1 p-4">Loading...</div>}>
        <LibrarySidepanel
          reports={reports}
          domainNames={domainNames}
        />
      </Suspense>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Library</h1>
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-64"
              />
              <DropdownFilter
                categories={filterCategories}
                selected={selectedFilters}
                onSelectionChange={(newFilters) => {
                  setSelectedFilters(newFilters);
                  setPage(1);
                }}
                triggerLabel="Filter"
                searchPlaceholder="Search"
                clearAllLabel="Clear all"
                doneLabel="Done"
              />
            </div>
          </div>

          {loadError ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Failed to load reports.</p>
              <Button onClick={() => router.refresh()}>Try again</Button>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <SortHeader
                        label="NAME"
                        sortKey="name"
                        currentSortKey={sortKey}
                        currentOrder={sortOrder}
                        onSort={handleSort}
                      />
                      <SortHeader
                        label="SOURCE"
                        sortKey="source"
                        currentSortKey={sortKey}
                        currentOrder={sortOrder}
                        onSort={handleSort}
                      />
                      <SortHeader
                        label="SUB-AREA"
                        sortKey="subArea"
                        currentSortKey={sortKey}
                        currentOrder={sortOrder}
                        onSort={handleSort}
                      />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedReports.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-muted-foreground">
                          {searchQuery || activeFilterCount > 0
                            ? "No reports found matching your filters."
                            : "No reports available."}
                        </td>
                      </tr>
                    ) : (
                      paginatedReports.map((report) => (
                        <tr
                          key={report.id}
                          onClick={() => router.push(`/library/${report.id}`)}
                          className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <td className="p-4 font-medium">{report.name}</td>
                          <td className="p-4 text-muted-foreground">{report.source || "—"}</td>
                          <td className="p-4 text-muted-foreground">
                            {(report.subAreaIds ?? [])
                              .map(id => domainNames[id])
                              .filter(Boolean)
                              .join(", ") || "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, sortedReports.length)} of {sortedReports.length} reports
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
