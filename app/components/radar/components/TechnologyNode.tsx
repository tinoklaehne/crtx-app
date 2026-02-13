"use client";

import type { Cluster } from "@/app/types/clusters";
import type { Trend } from "@/app/types/trends";

interface TechnologyNodeProps {
  tech: Trend;
  cluster: Cluster;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  angle: number;
  isLeftSide: boolean;
  techNumber: string;
  isHovered: boolean;
  onSelect: (tech: Trend) => void;
  onHover: (tech: Trend | null) => void;
}

export function TechnologyNode({
  tech,
  cluster,
  x,
  y,
  labelX,
  labelY,
  angle,
  isLeftSide,
  techNumber,
  isHovered,
  onSelect,
  onHover
}: TechnologyNodeProps) {
  // Truncate name if longer than 25 characters
  const truncatedName = tech.name.length > 25 
    ? `${tech.name.substring(0, 25)}...`
    : tech.name;

  return (
    <g
      onMouseEnter={() => onHover(tech)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(tech)}
      style={{ cursor: 'pointer' }}
    >
      <line
        x1={x}
        y1={y}
        x2={labelX}
        y2={labelY}
        className="stroke-foreground/20 dark:stroke-muted-foreground/20"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      
      <text
        x={labelX}
        y={labelY}
        textAnchor={isLeftSide ? "end" : "start"}
        alignmentBaseline="middle"
        fill="currentColor"
        fontSize="12"
        transform={`rotate(${isLeftSide ? angle + 180 : angle}, ${labelX}, ${labelY})`}
        className="text-foreground"
      >
        {isLeftSide ? (
          <>
            <tspan>{truncatedName}</tspan>
            <tspan dx="4" style={{ fill: cluster.colorCode }} fontSize="10">
              {techNumber}
            </tspan>
          </>
        ) : (
          <>
            <tspan style={{ fill: cluster.colorCode }} fontSize="10">
              {techNumber}
            </tspan>
            <tspan dx="4">{truncatedName}</tspan>
          </>
        )}
      </text>

      <circle
        cx={x}
        cy={y}
        r={isHovered ? 6 : 4}
        fill={cluster.colorCode}
      />
      
      {isHovered && (
        <circle
          cx={x}
          cy={y}
          r={8}
          fill="none"
          stroke={cluster.colorCode}
          strokeWidth={1}
          opacity={0.3}
        />
      )}
    </g>
  );
}