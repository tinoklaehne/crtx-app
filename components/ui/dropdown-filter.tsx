'use client';

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterCategoryOption {
  value: string;
  label: string;
}

export interface FilterCategory {
  id: string;
  label: string;
  options: FilterCategoryOption[];
}

export interface DropdownFilterProps {
  /** Categories with their options (e.g. Type, Geography, Watchlists) */
  categories: FilterCategory[];
  /** Currently selected values per category id */
  selected: Record<string, string[]>;
  /** Called when selection changes (e.g. toggle a checkbox) */
  onSelectionChange: (selected: Record<string, string[]>) => void;
  /** Trigger label, e.g. "Filter" */
  triggerLabel?: string;
  /** Show search input inside dropdown to filter options */
  showSearch?: boolean;
  /** Placeholder for search input */
  searchPlaceholder?: string;
  /** "Clear all" label */
  clearAllLabel?: string;
  /** "Done" label */
  doneLabel?: string;
  className?: string;
}

export function DropdownFilter({
  categories,
  selected,
  onSelectionChange,
  triggerLabel = 'Filter',
  showSearch = true,
  searchPlaceholder = 'Search',
  clearAllLabel = 'Clear all',
  doneLabel = 'Done',
  className,
}: DropdownFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [innerSearch, setInnerSearch] = React.useState('');
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(() => new Set());

  const toggleExpanded = (categoryId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const handleToggle = (categoryId: string, value: string) => {
    const current = selected[categoryId] ?? [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onSelectionChange({ ...selected, [categoryId]: next });
  };

  const handleClearAll = () => {
    const next: Record<string, string[]> = {};
    categories.forEach((c) => (next[c.id] = []));
    onSelectionChange(next);
  };

  const filterOptions = (opts: FilterCategoryOption[]) => {
    if (!innerSearch.trim()) return opts;
    const q = innerSearch.toLowerCase();
    return opts.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q)
    );
  };

  const activeCount = Object.values(selected).reduce(
    (sum, arr) => sum + (arr?.length ?? 0),
    0
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('gap-1', className)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          {triggerLabel}
          <ChevronDown className="h-4 w-4 opacity-50" />
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 max-h-[min(70vh,24rem)] overflow-hidden flex flex-col"
        onCloseAutoFocus={() => {
          setInnerSearch('');
          setExpandedIds(new Set());
        }}
      >
        {showSearch && (
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={innerSearch}
                onChange={(e) => setInnerSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-2">
          {categories.map((cat) => {
            const opts = filterOptions(cat.options);
            const sel = selected[cat.id] ?? [];
            const isExpanded = expandedIds.has(cat.id);
            const selectedCount = sel.length;
            return (
              <div key={cat.id} className="border-b border-border last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggleExpanded(cat.id)}
                  className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-2.5 text-left text-sm font-medium hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  aria-expanded={isExpanded}
                >
                  <span className="truncate">{cat.label}</span>
                  {selectedCount > 0 && (
                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-xs">
                      {selectedCount}
                    </span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
                {isExpanded && (
                  <div className="space-y-0.5 pb-2 pl-2 pr-2">
                    {opts.length === 0 ? (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">
                        {innerSearch.trim() ? 'No matches' : 'No options'}
                      </p>
                    ) : (
                      opts.map((opt) => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                        >
                          <Checkbox
                            checked={sel.includes(opt.value)}
                            onCheckedChange={() => handleToggle(cat.id, opt.value)}
                          />
                          <span className="truncate">{opt.label}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-2 p-2 border-t">
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            {clearAllLabel}
          </Button>
          <Button size="sm" onClick={() => setOpen(false)}>
            {doneLabel}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
