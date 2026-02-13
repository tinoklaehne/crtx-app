"use client";

import { useCallback } from "react";
import { useFilters } from "@/app/contexts/FilterContext";
import type { Cluster } from "@/app/types/clusters";

export function useClusterFilter() {
  const { setSelectedCluster } = useFilters();

  const handleClusterSelect = useCallback((cluster: Cluster | null) => {
    setSelectedCluster(cluster?.id || null);
  }, [setSelectedCluster]);

  return handleClusterSelect;
}