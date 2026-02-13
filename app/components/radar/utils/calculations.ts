import { DOMAIN_COLORS } from "@/app/types/domains";
import type { Cluster, Trend, Domain } from "@/app/types";
import type { NodePositioning } from "@/app/types";

// Horizon level labels for ring display
const HORIZON_LABELS: Record<number, string> = {
  9: "0-2 years",
  7: "2-5 years",
  5: "5-10 years",
  3: "10-15 years",
  1: "15+ years"
};

// Convert degrees to radians
const toRadians = (deg: number) => deg * Math.PI / 180;

// Get cluster ID based on cluster type
const getClusterId = (
  tech: Trend,
  clusterType: "parent" | "taxonomy" | "domain"
): string => {
  switch (clusterType) {
    case "taxonomy":
      return tech.taxonomyId ?? "";
    case "domain":
      return tech.domain ?? "";
    default:
      return tech.clusterId ?? "";
  }
};

// Calculate radius based on selected positioning metric
export const getRadius = (
  tech: Trend,
  nodePositioning: NodePositioning,
  minRadius: number,
  maxRadius: number
): number => {
  const value = (() => {
    switch (nodePositioning) {
      case "trl":
        return tech.technologyReadinessLevel;
      case "brl":
        return tech.businessReadinessLevel;
      case "horizon":
        return {
          "0-2": 9,
          "2-5": 7,
          "5-10": 5,
          "10-15": 3,
          "15+": 1
        }[tech.trendHorizon] ?? 5;
      default:
        return tech.technologyReadinessLevel;
    }
  })();

  const normalized = (value - 1) / 8;
  return minRadius + (maxRadius - minRadius) * (1 - normalized);
};

// Get display label for a ring level
export const getRingLabel = (
  level: number,
  nodePositioning: NodePositioning
): string => {
  switch (nodePositioning) {
    case "trl":
      return `TRL ${level}`;
    case "brl":
      return `BRL ${level}`;
    case "horizon":
      return HORIZON_LABELS[level] || "";
    default:
      return `Level ${level}`;
  }
};

// Main layout algorithm
export const calculatePositions = (
  clusters: Cluster[],
  technologies: Trend[],
  nodePositioning: NodePositioning,
  centerX: number,
  centerY: number,
  minRadius: number,
  maxRadius: number,
  labelDistance: number,
  clusterType: "parent" | "taxonomy" | "domain" = "parent"
) => {
  // Filter technologies to only include those with valid cluster IDs for the selected cluster type
  const validTechnologies = technologies.filter(tech => {
    const clusterId = getClusterId(tech, clusterType);
    return clusterId && clusterId.trim() !== "";
  });

  const activeClusters =
    clusterType === "domain"
      ? Array.from(new Set(validTechnologies.map(t => t.domain as Domain))).map(domain => ({
          id: domain,
          name: domain,
          description: `All ${domain} trends`,
          imageUrl: "",
          colorCode: DOMAIN_COLORS[domain as keyof typeof DOMAIN_COLORS] || "#999999",
          domain: domain as Domain,
          trends: [],
          universe: "General" as const,
          technologies: []
        }))
      : clusters
          .filter(cluster =>
            validTechnologies.some(t => getClusterId(t, clusterType) === cluster.id)
          )
          .sort((a, b) => a.name.localeCompare(b.name));

  // If no active clusters found, return empty array
  if (activeClusters.length === 0) {
    return [];
  }

  // Map cluster ID → trend list
  const clusterToTechs = new Map<string, Trend[]>();
  for (const tech of validTechnologies) {
    const id = getClusterId(tech, clusterType);
    if (!clusterToTechs.has(id)) clusterToTechs.set(id, []);
    clusterToTechs.get(id)!.push(tech);
  }

  // Count total elements for angular spacing
  let totalElements = 0;
  for (const cluster of activeClusters) {
    const id = clusterType === "domain" ? cluster.domain : cluster.id;
    const techs = clusterToTechs.get(id) || [];
    totalElements += techs.length + 1; // +1 for cluster label
  }

  // If no elements to display, return empty array
  if (totalElements === 0) {
    return [];
  }

  const anglePerElement = 360 / totalElements;

  // Assign global tech numbers based on consistent sort
  const sortedTechnologies = [...validTechnologies].sort((a, b) => {
    const domainCompare = a.domain.localeCompare(b.domain);
    if (domainCompare !== 0) return domainCompare;

    const clusterA = clusters.find(
      c => getClusterId(a, clusterType) === (clusterType === "domain" ? c.domain : c.id)
    );
    const clusterB = clusters.find(
      c => getClusterId(b, clusterType) === (clusterType === "domain" ? c.domain : c.id)
    );

    const clusterCompare = (clusterA?.name ?? "").localeCompare(clusterB?.name ?? "");
    if (clusterCompare !== 0) return clusterCompare;

    return a.name.localeCompare(b.name);
  });

  const techIndices = new Map<string, string>();
  sortedTechnologies.forEach((tech, index) => {
    techIndices.set(tech.id, (index + 1).toString().padStart(2, "0"));
  });

  let currentAngle = 0;

  return activeClusters.map(cluster => {
    const clusterId = clusterType === "domain" ? cluster.domain : cluster.id;
    const clusterTechs = (clusterToTechs.get(clusterId) || []).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const clusterAngle = currentAngle;
    const clusterAngleRad = toRadians(clusterAngle);
    const clusterLabelX = centerX + labelDistance * Math.cos(clusterAngleRad);
    const clusterLabelY = centerY + labelDistance * Math.sin(clusterAngleRad);
    const isClusterLabelLeftSide = clusterAngle > 90 && clusterAngle < 270;

    currentAngle += anglePerElement;

    const techPositions = clusterTechs.map(tech => {
      const angle = currentAngle;
      const angleRad = toRadians(angle);
      const radius = getRadius(tech, nodePositioning, minRadius, maxRadius);

      const x = centerX + radius * Math.cos(angleRad);
      const y = centerY + radius * Math.sin(angleRad);
      const labelX = centerX + labelDistance * Math.cos(angleRad);
      const labelY = centerY + labelDistance * Math.sin(angleRad);
      const isLeftSide = angle > 90 && angle < 270;

      currentAngle += anglePerElement;

      return {
        tech,
        x,
        y,
        labelX,
        labelY,
        angle,
        isLeftSide,
        techNumber: techIndices.get(tech.id) || ""
      };
    });

    return {
      cluster,
      clusterLabelX,
      clusterLabelY,
      clusterLabelAngle: clusterAngle,
      isClusterLabelLeftSide,
      technologies: techPositions
    };
  });
};