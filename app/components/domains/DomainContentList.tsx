"use client";

import { useState, useMemo, useEffect } from "react";
import type { DomainContentItem } from "@/app/types/domainContent";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { CircleOff, ExternalLink, SlidersHorizontal, Trash2 } from "lucide-react";
import { DropdownFilter, type FilterCategory } from "@/components/ui/dropdown-filter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DomainContentListProps {
  items: DomainContentItem[];
  itemsPerPage?: number;
  domainNames?: Record<string, string>;
}

type SortOrder = "newest" | "oldest";

export function DomainContentList({ items, itemsPerPage: initialItemsPerPage = 10, domainNames = {} }: DomainContentListProps) {
  const [localItems, setLocalItems] = useState<DomainContentItem[]>(items);
  const [pendingStatusById, setPendingStatusById] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    signalType: [],
    domain: [],
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  // Get unique signal types for filter
  const signalTypes = useMemo(() => {
    const types = new Set<string>();
    localItems.forEach(item => {
      if (item.signalType) {
        types.add(item.signalType);
      }
    });
    return Array.from(types).sort();
  }, [localItems]);

  // Get unique domains for filter
  const uniqueDomains = useMemo(() => {
    const domainSet = new Set<string>();
    localItems.forEach(item => {
      const domainId = item.metadata?.domainId;
      if (domainId && domainNames[domainId]) {
        domainSet.add(domainId);
      }
    });
    return Array.from(domainSet);
  }, [localItems, domainNames]);

  // Build filter categories
  const filterCategories = useMemo<FilterCategory[]>(() => {
    const categories: FilterCategory[] = [];

    // Signal Type category
    if (signalTypes.length > 0) {
      categories.push({
        id: 'signalType',
        label: 'Signal Type',
        options: signalTypes.map(type => ({
          value: type,
          label: type,
        })),
      });
    }

    // Domain category
    if (uniqueDomains.length > 0) {
      categories.push({
        id: 'domain',
        label: 'Domain',
        options: uniqueDomains.map(domainId => ({
          value: domainId,
          label: domainNames[domainId] || domainId,
        })),
      });
    }

    return categories;
  }, [signalTypes, uniqueDomains, domainNames]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = localItems;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.signalType?.toLowerCase().includes(query)
      );
    }

    // Signal type filter
    const selectedSignalTypes = selectedFilters.signalType || [];
    if (selectedSignalTypes.length > 0) {
      filtered = filtered.filter(item => 
        item.signalType && selectedSignalTypes.includes(item.signalType)
      );
    }

    // Domain filter
    const selectedDomains = selectedFilters.domain || [];
    if (selectedDomains.length > 0) {
      filtered = filtered.filter(item => {
        const domainId = item.metadata?.domainId;
        return domainId && selectedDomains.includes(domainId);
      });
    }

    // Sort by date (newest first by default)
    filtered = [...filtered].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      // Handle invalid dates
      const validDateA = isNaN(dateA) ? 0 : dateA;
      const validDateB = isNaN(dateB) ? 0 : dateB;
      
      if (sortOrder === "newest") {
        return validDateB - validDateA; // Newest first
      } else {
        return validDateA - validDateB; // Oldest first
      }
    });

    return filtered;
  }, [localItems, searchQuery, selectedFilters, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredAndSortedItems.slice(startIndex, endIndex);

  // Reset to page 1 when filters or itemsPerPage change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFilters, sortOrder, itemsPerPage]);

  if (localItems.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No content available in this category.</p>
      </div>
    );
  }

  async function handleStatusChange(
    e: React.MouseEvent,
    item: DomainContentItem,
    status: "Auto" | "Noise" | "Delete"
  ) {
    e.preventDefault();
    e.stopPropagation();
    if (pendingStatusById[item.id]) return;
    setPendingStatusById((prev) => ({ ...prev, [item.id]: true }));

    const previousItems = localItems;
    const shouldHide = status !== "Auto";
    if (shouldHide) {
      setLocalItems((prev) => prev.filter((it) => it.id !== item.id));
    } else {
      setLocalItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status } : it))
      );
    }

    try {
      const res = await fetch("/api/user/action-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: item.id, status }),
      });
      if (!res.ok) {
        throw new Error("Failed to update signal status");
      }
    } catch (error) {
      console.error(error);
      setLocalItems(previousItems);
    } finally {
      setPendingStatusById((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
    }
  }

  return (
    <div className="border rounded-lg bg-card">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-2xl font-bold">Latest Signals</h2>
      </div>
      
      {/* Search, Filter, and Sort Controls */}
      <div className="p-4 border-b space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search - Made larger */}
          <div className="flex-[2] min-w-0">
            <Input
              placeholder="Search by headline, description, or signal type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Filter Dropdown */}
          {filterCategories.length > 0 && (
            <div className="flex-shrink-0">
              <DropdownFilter
                categories={filterCategories}
                selected={selectedFilters}
                onSelectionChange={setSelectedFilters}
                triggerLabel="Filter"
                showSearch={true}
                searchPlaceholder="Search filters..."
                clearAllLabel="Clear all"
                doneLabel="Done"
              />
            </div>
          )}

          {/* Sort */}
          <div className="w-full sm:w-48 flex-shrink-0">
            <Select
              value={sortOrder}
              onValueChange={(value) => setSortOrder(value as SortOrder)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Items per page */}
          <div className="w-full sm:w-32 flex-shrink-0">
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
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

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedItems.length)} of {filteredAndSortedItems.length} items
        </div>
      </div>

      {/* List View */}
      <div>
        {paginatedItems.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No items found matching your criteria.</p>
          </div>
        ) : (
          paginatedItems.map((item, index) => {
            const handleClick = (e: React.MouseEvent) => {
              if (item.url) {
                e.preventDefault();
                // Ensure URL has protocol
                let url = item.url;
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                  url = 'https://' + url;
                }
                window.open(url, '_blank', 'noopener,noreferrer');
              }
            };

            return (
            <div
              key={item.id}
              className={`p-4 hover:bg-secondary/50 transition-colors cursor-pointer group ${
                index < paginatedItems.length - 1 ? 'border-b border-border' : ''
              }`}
              onClick={handleClick}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Signal Type and Domain Tags - displayed above headline */}
                  {(item.signalType || item.metadata?.domainId) && (
                    <div className="mb-2 flex items-center gap-2 flex-wrap">
                      {item.signalType && (
                        <Badge variant="outline" className="text-xs">
                          {item.signalType}
                        </Badge>
                      )}
                      {item.metadata?.domainId && domainNames[item.metadata.domainId] && (
                        <Badge variant="secondary" className="text-xs">
                          {domainNames[item.metadata.domainId]}
                        </Badge>
                      )}
                    </div>
                  )}
                  {/* Headline */}
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {item.title}
                    {item.url && (
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2 inline-block" />
                    )}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {item.date && (
                      <span>
                        Date: {new Date(item.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                    {item.source && <span>Source: {item.source}</span>}
                  </div>
                </div>
                <div className="ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        disabled={!!pendingStatusById[item.id]}
                        className="px-2 py-1 text-xs border rounded hover:bg-secondary disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        <SlidersHorizontal className="h-3 w-3" />
                        Status
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handleStatusChange(e, item, "Noise")}>
                        <CircleOff className="h-4 w-4 mr-2" />
                        Noise
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleStatusChange(e, item, "Delete")}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
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
                } else if (page === currentPage - 2 || page === currentPage + 2) {
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
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
