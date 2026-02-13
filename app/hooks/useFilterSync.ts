"use client";

import { useEffect } from "react";
import { useFilters } from "@/app/contexts/FilterContext";
import { useRadarStore } from "@/app/store/radarStore";

export function useFilterSync() {
  const { selectedCluster, setSelectedCluster } = useFilters();
  const { activeCluster, setActiveCluster, setActiveView } = useRadarStore();

  // Sync filter changes with radar state
  useEffect(() => {
    if (!selectedCluster) {
      setActiveCluster(undefined);
      setActiveView("technologies");
    }
  }, [selectedCluster, setActiveCluster, setActiveView]);

  // Sync radar state changes with filters
  useEffect(() => {
    if (!activeCluster) {
      setSelectedCluster(null);
    }
  }, [activeCluster, setSelectedCluster]);
}