"use client";

import { useFilters } from "@/app/contexts/FilterContext";
import type { Cluster } from "@/app/types/clusters";

interface ClusterLabelProps {
  cluster: Cluster;
  x: number;
  y: number;
  angle: number;
  isLeftSide: boolean;
  onClick: (cluster: Cluster) => void;
}

export function ClusterLabel({
  cluster,
  x,
  y,
  angle,
  isLeftSide,
  onClick
}: ClusterLabelProps) {
  const { setSelectedCluster } = useFilters();

  const handleClick = (e: React.MouseEvent<SVGTextElement>) => {
    e.stopPropagation();
    setSelectedCluster(cluster.id);
    onClick(cluster);
  };

  return (
    <text
      x={x}
      y={y}
      textAnchor={isLeftSide ? "end" : "start"}
      alignmentBaseline="middle"
      fill={cluster.colorCode}
      fontSize="14"
      fontWeight="bold"
      transform={`rotate(${isLeftSide ? angle + 180 : angle}, ${x}, ${y})`}
      className="cursor-pointer hover:opacity-80 transition-opacity"
      onMouseDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={handleClick}
    >
      {cluster.name}
    </text>
  );
}