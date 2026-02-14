"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ViewToggle } from "../ui/view-toggle";
import { useFilters } from "@/app/contexts/FilterContext";
import { Logo } from "../layout/Logo";
import { RadarRings } from "./components/RadarRings";
import { RadarNodes } from "./components/RadarNodes";
import { useRadarSize } from "./hooks/useRadarSize";
import { useRadarFilters } from "./hooks/useRadarFilters";
import { useZoomAndPan } from "./hooks/useZoomAndPan";
import { useClusterFilter } from "@/app/hooks/useClusterFilter";
import { calculatePositions } from "./utils/calculations";
import type { Cluster } from "@/app/types/clusters";
import type { Trend } from "@/app/types/trends";
import type { NodePositioning } from "@/app/types";

// Constants for SVG dimensions
const SVG_WIDTH = 1200;
const SVG_HEIGHT = 1200;
const PADDING = 300;
const CENTER_X = SVG_WIDTH / 2;
const CENTER_Y = SVG_HEIGHT / 2;
const MAX_RADIUS = Math.min(CENTER_X, CENTER_Y) - PADDING;
const MIN_RADIUS = MAX_RADIUS * 0.2;
const LABEL_DISTANCE = MAX_RADIUS + 100;

interface RadarVisualizationProps {
  clusters: Cluster[];
  technologies: Trend[];
  onTechnologySelect: (tech: Trend) => void;
  onClusterSelect: (cluster: Cluster | null) => void;
  nodePositioning: NodePositioning;
  onNodePositioningChange: (positioning: NodePositioning) => void;
  view: "radar" | "matrix" | "kanban";
  onViewChange?: (view: "radar" | "matrix" | "kanban") => void;
  clusterType?: "parent" | "taxonomy" | "domain";
  onClusterTypeChange?: (type: "parent" | "taxonomy" | "domain") => void;
  onKanbanView?: () => React.ReactNode;
}

export function RadarVisualization({ 
  clusters,
  technologies,
  onTechnologySelect,
  onClusterSelect,
  nodePositioning,
  onNodePositioningChange,
  view,
  onViewChange = () => {},
  clusterType = "parent",
  onClusterTypeChange = (_type: "parent" | "taxonomy" | "domain") => {},
  onKanbanView
}: RadarVisualizationProps) {
  const [hoveredTech, setHoveredTech] = useState<Trend | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedFilters, selectedCluster } = useFilters();
  const handleClusterFilter = useClusterFilter();
  const { zoom, rotation, x, y, handleWheel } = useZoomAndPan();

  const size = useRadarSize(svgRef);
  const { filteredTechnologies, filteredClusters } = useRadarFilters(
    clusters,
    technologies,
    selectedFilters,
    selectedCluster
  );

  const handleClusterSelect = (cluster: Cluster) => {
    onClusterSelect?.(cluster);
    handleClusterFilter(cluster);
  };

  // Always use filtered data when a cluster is selected, regardless of how it was selected
  const positions = calculatePositions(
    selectedCluster ? filteredClusters : clusters,
    selectedCluster ? filteredTechnologies : technologies,
    nodePositioning,
    CENTER_X,
    CENTER_Y,
    MIN_RADIUS,
    MAX_RADIUS,
    LABEL_DISTANCE,
    clusterType
  );

  // Debug logging
  console.log('RadarVisualization debug:', {
    clusterType,
    selectedCluster,
    totalTechnologies: technologies.length,
    totalClusters: clusters.length,
    filteredTechnologies: filteredTechnologies.length,
    filteredClusters: filteredClusters.length,
    positionsLength: positions.length,
    hasValidTechnologies: technologies.some(tech => {
      const clusterId = clusterType === "taxonomy" ? tech.taxonomyId : tech.clusterId;
      return clusterId && clusterId.trim() !== "";
    })
  });

  // Check if we have any data to display
  const hasData = positions.length > 0 && positions.some(pos => pos.technologies.length > 0);

  // Handle kanban view
  if (view === "kanban" && onKanbanView) {
    return (
      <div className="relative flex-1 bg-background overflow-hidden">
        <ViewToggle view={view} onChange={onViewChange} />
        <div className="h-full overflow-auto">
          {onKanbanView()}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 bg-background overflow-hidden">
      <ViewToggle view={view} onChange={onViewChange} />

      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Select value={clusterType} onValueChange={onClusterTypeChange}>
          <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur">
            <SelectValue placeholder="Clustering Method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="parent">Parent Relationship</SelectItem>
            <SelectItem value="domain">Domain</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCluster || "all"} onValueChange={(value) => {
          const cluster = value === "all" ? null : filteredClusters.find(c => c.id === value) || clusters.find(c => c.id === value);
          handleClusterFilter(cluster ?? null); 
          onClusterSelect?.(cluster ?? null);
        }}>
          <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur">
            <SelectValue placeholder="All Clusters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clusters</SelectItem>
            {filteredClusters
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((cluster) => (
                <SelectItem key={cluster.id} value={cluster.id}>
                  {cluster.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <motion.div
        ref={containerRef}
        className="w-full h-full"
        onWheel={handleWheel}
        style={{
          x,
          y,
          rotate: rotation,
          scale: zoom,
          cursor: "grab",
          touchAction: "none"
        }}
        drag
        dragConstraints={{ left: -500, right: 500, top: -500, bottom: 500 }}
        dragElastic={0.1}
        dragMomentum={false}
        whileDrag={{ cursor: "grabbing" }}
      >
        <svg
          ref={svgRef}
          width={size.width}
          height={size.height}
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: "100%", height: "100%" }}
        >
          <g transform={`translate(${CENTER_X - 50}, ${CENTER_Y - 50})`}>
            <foreignObject width="100" height="100">
              <div className="w-full h-full flex items-center justify-center opacity-10">
                <Logo />
              </div>
            </foreignObject>
          </g>

          {!hasData && (
            <g transform={`translate(${CENTER_X}, ${CENTER_Y})`}>
              <foreignObject width="400" height="200" x="-200" y="-100">
                <div className="w-full h-full flex flex-col items-center justify-center text-center">
                  <div className="text-lg font-semibold mb-2">No trends available</div>
                  <div className="text-sm text-muted-foreground">
                    No trends are available for the selected clustering method ({clusterType}).
                    <br />
                    Try switching to a different clustering method or check the data configuration.
                  </div>
                </div>
              </foreignObject>
            </g>
          )}

          <RadarRings
            centerX={CENTER_X}
            centerY={CENTER_Y}
            minRadius={MIN_RADIUS}
            maxRadius={MAX_RADIUS}
            nodePositioning={nodePositioning}
          />

          {hasData && (
            <RadarNodes
              positions={positions}
              onTechnologySelect={onTechnologySelect}
              onClusterSelect={handleClusterSelect}
              setHoveredTech={setHoveredTech}
              hoveredTech={hoveredTech}
            />
          )}
        </svg>
      </motion.div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-lg bg-background/50 backdrop-blur border">
        <Select value={nodePositioning || "trl"} onValueChange={onNodePositioningChange}>
          <SelectTrigger className="w-[200px] border-0 bg-transparent">
            <SelectValue placeholder="Technology Readiness Level">
              {nodePositioning === "trl" && "Technology Readiness Level"}
              {nodePositioning === "brl" && "Business Readiness Level"}
              {nodePositioning === "horizon" && "Trend Horizon"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="trl">Technology Readiness Level</SelectItem>
            <SelectItem value="brl">Business Readiness Level</SelectItem>
            <SelectItem value="horizon">Trend Horizon</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hoveredTech && (
        <div className="absolute right-4 top-20 w-64 p-4 rounded-lg bg-background/50 backdrop-blur border">
          <h3 className="font-semibold mb-2">{hoveredTech.name}</h3>
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-muted-foreground">TRL: </span>
              <span className="font-medium">{hoveredTech.technologyReadinessLevel}</span>
            </div>
            <div>
              <span className="text-muted-foreground">BRL: </span>
              <span className="font-medium">{hoveredTech.businessReadinessLevel}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Horizon: </span>
              <span className="font-medium">{hoveredTech.trendHorizon} years</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}