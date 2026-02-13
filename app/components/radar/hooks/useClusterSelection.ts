"use client";

import { useCallback } from "react";
import type { Cluster } from "@/app/types";

export function useClusterSelection(
  clusters: Cluster[],
  onClusterSelect: (cluster: Cluster | null) => void
) {
  const handleClusterChange = useCallback((value: string) => {
    try {
      if (value === "all") {
        onClusterSelect(null);
        return;
      }

      const cluster = clusters.find(c => c.id === value);
      if (cluster) {
        onClusterSelect(cluster);
      } else {
        console.warn(`Cluster with id ${value} not found`);
        onClusterSelect(null);
      }
    } catch (error) {
      console.error("Error handling cluster change:", error);
      onClusterSelect(null);
    }
  }, [clusters, onClusterSelect]);

  return handleClusterChange;
}