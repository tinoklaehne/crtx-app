"use client";

import { useCallback } from "react";
import { useRadarStore } from "@/app/store/radarStore";
import { useFilters } from "@/app/contexts/FilterContext";
import type { Cluster, Trend } from "@/app/types";

export function useRadarActions() {
  const { 
    setActiveView, 
    setActiveTechnology, 
    setActiveCluster,
    reset 
  } = useRadarStore();
  const { setSelectedCluster } = useFilters();

  const handleTechnologySelect = useCallback((tech: Trend) => {
    setActiveTechnology(tech);
    setActiveView("detail");
  }, [setActiveTechnology, setActiveView]);

  const handleClusterSelect = useCallback((cluster: Cluster | null) => {
    if (cluster) {
      setActiveCluster(cluster);
      setActiveView("cluster-detail");
      setSelectedCluster(cluster.id);
    } else {
      setActiveCluster(undefined);
      setSelectedCluster(null);
      setActiveView("technologies");
    }
  }, [setActiveCluster, setActiveView, setSelectedCluster]);

  const handleCloseDetail = useCallback(() => {
    reset();
    setSelectedCluster(null);
  }, [reset, setSelectedCluster]);

  return {
    handleTechnologySelect,
    handleClusterSelect,
    handleCloseDetail
  };
}