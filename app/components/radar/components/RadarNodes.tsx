"use client";

import { ClusterLabel } from "./ClusterLabel";
import { TechnologyNode } from "./TechnologyNode";
import type { Cluster } from "@/app/types/clusters";
import type { Trend } from "@/app/types/trends";

// ✅ Properly named and exported props interface
export interface RadarNodesProps {
  positions: {
    cluster: Cluster;
    clusterLabelX: number;
    clusterLabelY: number;
    clusterLabelAngle: number;
    isClusterLabelLeftSide: boolean;
    technologies: {
      tech: Trend;
      x: number;
      y: number;
      labelX: number;
      labelY: number;
      angle: number;
      isLeftSide: boolean;
      techNumber: string;
    }[];
  }[];
  onTechnologySelect: (tech: Trend) => void;
  onClusterSelect: (cluster: Cluster) => void;
  setHoveredTech: (tech: Trend | null) => void;
  hoveredTech: Trend | null;
}

export function RadarNodes({
  positions,
  onTechnologySelect,
  onClusterSelect,
  setHoveredTech,
  hoveredTech,
}: RadarNodesProps) {
  return (
    <g>
      {positions.map(
        ({
          cluster,
          clusterLabelX,
          clusterLabelY,
          clusterLabelAngle,
          isClusterLabelLeftSide,
          technologies,
        }) => (
          <g key={cluster.id}>
            <ClusterLabel
              cluster={cluster}
              x={clusterLabelX}
              y={clusterLabelY}
              angle={clusterLabelAngle}
              isLeftSide={isClusterLabelLeftSide}
              onClick={onClusterSelect}
            />

            {technologies.map(
              ({ tech, x, y, labelX, labelY, angle, isLeftSide, techNumber }) => (
                <TechnologyNode
                  key={tech.id}
                  tech={tech}
                  cluster={cluster}
                  x={x}
                  y={y}
                  labelX={labelX}
                  labelY={labelY}
                  angle={angle}
                  isLeftSide={isLeftSide}
                  techNumber={techNumber}
                  isHovered={hoveredTech?.id === tech.id}
                  onSelect={onTechnologySelect}
                  onHover={setHoveredTech}
                />
              )
            )}
          </g>
        )
      )}
    </g>
  );
}