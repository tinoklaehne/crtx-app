"use client";

import type { Cluster, Trend, Domain } from "@/app/types";
import type { NodePositioning } from "@/app/types";

// Explicitly declare valid domain order
export const DOMAIN_ORDER: Domain[] = ["Technology", "Industry", "Humanity"];

export function getGlobalIndex(
  technology: Trend,
  clusters: Cluster[],
  technologies: Trend[]
): string {
  if (!technology || !Array.isArray(clusters) || !Array.isArray(technologies)) {
    return "00";
  }

  // Sort technologies based on domain, cluster name, then technology name
  const sortedTechnologies = [...technologies].sort((a, b) => {
    // --- Domain order (with type casting to Domain for TS safety)
    const domainOrderA = DOMAIN_ORDER.indexOf(a.domain as Domain);
    const domainOrderB = DOMAIN_ORDER.indexOf(b.domain as Domain);
    if (domainOrderA !== domainOrderB) {
      return domainOrderA - domainOrderB;
    }

    // --- Cluster name
    const clusterA = clusters.find((c) => c.id === a.clusterId);
    const clusterB = clusters.find((c) => c.id === b.clusterId);
    if (clusterA && clusterB) {
      const clusterCompare = clusterA.name.localeCompare(clusterB.name);
      if (clusterCompare !== 0) {
        return clusterCompare;
      }
    }

    // --- Technology name
    return a.name.localeCompare(b.name);
  });

  // Find index of current technology
  const index = sortedTechnologies.findIndex((t) => t.id === technology.id);

  return index >= 0 ? (index + 1).toString().padStart(2, "0") : "00";
}

export function getReadinessLevel(
  tech: Trend,
  nodePositioning: NodePositioning
): string | number {
  switch (nodePositioning) {
    case "trl":
      return `TRL ${tech.technologyReadinessLevel}`;
    case "brl":
      return `BRL ${tech.businessReadinessLevel}`;
    case "horizon":
      return tech.trendHorizon;
    default:
      return `TRL ${tech.technologyReadinessLevel}`;
  }
}