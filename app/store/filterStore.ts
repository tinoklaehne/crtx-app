"use client";

import { create } from 'zustand';
import { DOMAINS } from '@/app/types/domains';
import type { FilterCategory } from '@/app/components/ui/filter-toggle';

interface FilterState {
  selectedFilters: FilterCategory[];
  selectedCluster: string | null;
  setSelectedFilters: (filters: FilterCategory[]) => void;
  setSelectedCluster: (clusterId: string | null) => void;
  handleFilterToggle: (category: FilterCategory) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  selectedFilters: DOMAINS.map(d => d.toLowerCase() as FilterCategory),
  selectedCluster: null,
  setSelectedFilters: (filters) => set({ selectedFilters: filters }),
  setSelectedCluster: (clusterId) => set({ selectedCluster: clusterId }),
  handleFilterToggle: (category) => {
    const { selectedFilters, selectedCluster } = get();
    
    // Prevent removing the last filter
    if (selectedFilters.length === 1 && selectedFilters.includes(category)) {
      return;
    }

    // Update filters
    const newFilters = selectedFilters.includes(category)
      ? selectedFilters.filter(f => f !== category)
      : [...selectedFilters, category];

    // Clear selected cluster if its domain is being removed
    if (selectedFilters.includes(category) && selectedCluster) {
      const cluster = document.querySelector(`[data-cluster-id="${selectedCluster}"]`);
      const clusterDomain = cluster?.getAttribute('data-domain')?.toLowerCase();
      if (clusterDomain === category) {
        set({ selectedCluster: null });
      }
    }

    set({ selectedFilters: newFilters });
  },
  resetFilters: () => {
    const defaultFilters = DOMAINS.map(d => d.toLowerCase() as FilterCategory);
    set({ selectedFilters: defaultFilters, selectedCluster: null });
  },
}));