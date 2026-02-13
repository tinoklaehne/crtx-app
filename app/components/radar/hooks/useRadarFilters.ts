"use client";

import { useMemo } from "react";
import type { Cluster, Trend } from "@/app/types";

export function useRadarFilters(
  clusters: Cluster[],
  technologies: Trend[],
  selectedFilters: string[],
  selectedCluster: string | null
) {
  const filteredTechnologies = useMemo(() => 
    technologies.filter(tech => {
      const matchesDomain = selectedFilters.includes(tech.domain.toLowerCase());
      const matchesCluster = selectedCluster ? tech.clusterId === selectedCluster : true;
      return matchesDomain && matchesCluster;
    }),
    [technologies, selectedFilters, selectedCluster]
  );

  const filteredClusters = useMemo(() => 
    clusters.filter(cluster => {
      const matchesDomain = selectedFilters.includes(cluster.domain.toLowerCase());
      const matchesSelectedCluster = selectedCluster ? cluster.id === selectedCluster : true;
      return matchesDomain && matchesSelectedCluster;
    }),
    [clusters, selectedFilters, selectedCluster]
  );

  return {
    filteredTechnologies,
    filteredClusters
  };
}