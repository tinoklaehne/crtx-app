"use client";

import { useMemo } from "react";
import type { Cluster, Trend, Domain } from "@/app/types";

export function useRadarFilters(
  clusters: Cluster[],
  technologies: Trend[],
  selectedFilters: string[],
  selectedCluster: string | null,
  clusterType: "parent" | "taxonomy" | "domain" = "parent"
) {
  const filteredTechnologies = useMemo(
    () =>
      technologies.filter((tech) => {
        const matchesDomain = selectedFilters.includes(tech.domain.toLowerCase());
        const matchesCluster = selectedCluster
          ? clusterType === "domain"
            ? tech.domain === (selectedCluster as Domain)
            : tech.clusterId === selectedCluster
          : true;
        return matchesDomain && matchesCluster;
      }),
    [technologies, selectedFilters, selectedCluster, clusterType]
  );

  const filteredClusters = useMemo(
    () =>
      clusterType === "domain"
        ? clusters
        : clusters.filter((cluster) => {
            const matchesDomain = selectedFilters.includes(
              cluster.domain.toLowerCase()
            );
            const matchesSelectedCluster = selectedCluster
              ? cluster.id === selectedCluster
              : true;
            return matchesDomain && matchesSelectedCluster;
          }),
    [clusters, selectedFilters, selectedCluster, clusterType]
  );

  return {
    filteredTechnologies,
    filteredClusters,
  };
}