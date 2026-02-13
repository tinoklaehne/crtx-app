"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { DOMAINS } from "@/app/types/domains";
import type { FilterCategory } from "@/app/components/ui/filter-toggle";

interface FilterContextType {
  selectedFilters: FilterCategory[];
  selectedCluster: string | null;
  setSelectedFilters: (filters: FilterCategory[]) => void;
  handleFilterToggle: (category: FilterCategory) => void;
  setSelectedCluster: (clusterId: string | null) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [selectedFilters, setSelectedFilters] = useState<FilterCategory[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  useEffect(() => {
    const defaultFilters = DOMAINS.map(d => d.toLowerCase() as FilterCategory);
    setSelectedFilters(defaultFilters);
    setSelectedCluster(null);
  }, []);

  const handleFilterToggle = (category: FilterCategory) => {
    setSelectedFilters(prev => {
      // Prevent removing the last filter
      if (prev.length === 1 && prev.includes(category)) {
        return prev;
      }

      // If removing a filter, check if we need to clear the selected cluster
      if (prev.includes(category) && selectedCluster) {
        const cluster = document.querySelector(`[data-cluster-id="${selectedCluster}"]`);
        const clusterDomain = cluster?.getAttribute('data-domain')?.toLowerCase();
        if (clusterDomain === category) {
          setSelectedCluster(null);
        }
      }

      return prev.includes(category)
        ? prev.filter(f => f !== category)
        : [...prev, category];
    });
  };

  const resetFilters = () => {
    const defaultFilters = DOMAINS.map(d => d.toLowerCase() as FilterCategory);
    setSelectedFilters(defaultFilters);
    setSelectedCluster(null);
  };

  return (
    <FilterContext.Provider value={{ 
      selectedFilters, 
      selectedCluster,
      setSelectedFilters, 
      handleFilterToggle,
      setSelectedCluster,
      resetFilters,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}