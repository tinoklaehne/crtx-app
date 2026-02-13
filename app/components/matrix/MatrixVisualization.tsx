"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRingLabel } from "../radar/utils/calculations";
import { ViewToggle } from "../ui/view-toggle";
import { useFilters } from "@/app/contexts/FilterContext";
import type { Cluster, Trend } from "@/app/types";
import type { NodePositioning } from "@/app/types";
import type { FilterCategory } from "@/app/components/ui/filter-toggle";

interface MatrixVisualizationProps {
  clusters: Cluster[];
  technologies: Trend[];
  onTechnologySelect: (tech: Trend) => void;
  onClusterSelect: (cluster: Cluster | null) => void;
  nodePositioning: NodePositioning;
  onNodePositioningChange: (positioning: NodePositioning) => void;
  view: "radar" | "matrix";
  onViewChange?: (view: "radar" | "matrix") => void;
}

interface AxisConfig {
  type: NodePositioning;
  label: string;
}

const AXIS_OPTIONS: AxisConfig[] = [
  { type: "trl", label: "Technology Readiness Level" },
  { type: "brl", label: "Business Readiness Level" },
  { type: "horizon", label: "Trend Horizon" }
];

export function MatrixVisualization({
  clusters,
  technologies,
  onTechnologySelect,
  onClusterSelect,
  nodePositioning,
  onNodePositioningChange,
  view,
  onViewChange = () => {}
}: MatrixVisualizationProps) {
  const [hoveredTech, setHoveredTech] = useState<Trend | null>(null);
  const [xAxis, setXAxis] = useState<NodePositioning>("trl");
  const [yAxis, setYAxis] = useState<NodePositioning>("brl");
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedFilters, selectedCluster } = useFilters();

  // Create stable jitter values for each technology
  const jitterValues = useRef<Map<string, { x: number; y: number }>>(new Map());

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    setZoom(prev => Math.min(Math.max(0.5, prev + delta), 2));
  };

  // Initialize jitter values if they don't exist
  technologies.forEach(tech => {
    if (!jitterValues.current.has(tech.id)) {
      jitterValues.current.set(tech.id, {
        x: Math.random() * 16 - 8,
        y: Math.random() * 16 - 8
      });
    }
  });

  const getNodePosition = (tech: Trend, axis: NodePositioning) => {
    switch (axis) {
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
        }[tech.trendHorizon] || 5;
    }
  };

  const handleClusterChange = (value: string) => {
    if (value === "all") {
      onClusterSelect(null);
      return;
    }

    const cluster = clusters.find(c => c.id === value);
    if (cluster) {
      onClusterSelect(cluster);
    }
  };

  // Filter technologies based on selected domains and cluster
  const filteredTechnologies = technologies.filter(tech => {
    const matchesDomain = selectedFilters.includes(tech.domain.toLowerCase() as FilterCategory);
    const matchesCluster = selectedCluster ? tech.clusterId === selectedCluster : true;
    return matchesDomain && matchesCluster;
  });

  return (
    <div className="relative flex-1 bg-background overflow-hidden">
      <ViewToggle view={view} onChange={onViewChange} />
      
      <div className="absolute top-4 right-4 z-10">
        <Select value={selectedCluster || "all"} onValueChange={handleClusterChange}>
          <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur">
            <SelectValue placeholder="All Clusters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clusters</SelectItem>
            {[...clusters].sort((a, b) => a.name.localeCompare(b.name)).map((cluster) => (
              <SelectItem key={cluster.id} value={cluster.id}>
                {cluster.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <motion.div
        ref={containerRef}
        className="w-full h-full p-32"
        onWheel={handleWheel}
        style={{
          x,
          y,
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
        <div className="relative w-full h-full border rounded-lg bg-background">
          {/* Y-axis labels */}
          <div className="absolute -left-24 top-0 bottom-0 flex flex-col justify-between py-6">
            {[9, 7, 5, 3, 1].map(level => (
              <div key={level} className="text-xs text-muted-foreground whitespace-nowrap">
                {getRingLabel(level, yAxis)}
              </div>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="absolute -bottom-12 left-0 right-0 flex justify-between px-6">
            {[1, 3, 5, 7, 9].map(level => (
              <div key={level} className="text-xs text-muted-foreground whitespace-nowrap -rotate-45 origin-top-left translate-y-6">
                {getRingLabel(level, xAxis)}
              </div>
            ))}
          </div>

          {/* Grid lines */}
          <svg className="absolute inset-0 w-full h-full">
            {[0, 0.25, 0.5, 0.75, 1].map(pos => (
              <g key={pos}>
                <line
                  x1={`${pos * 100}%`}
                  y1="0"
                  x2={`${pos * 100}%`}
                  y2="100%"
                  className="stroke-foreground/20 dark:stroke-muted-foreground/20"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
                <line
                  x1="0"
                  y1={`${pos * 100}%`}
                  x2="100%"
                  y2={`${pos * 100}%`}
                  className="stroke-foreground/20 dark:stroke-muted-foreground/20"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              </g>
            ))}
          </svg>

          {/* Technology nodes */}
          {filteredTechnologies.map(tech => {
            const cluster = clusters.find(c => c.id === tech.clusterId);
            if (!cluster) return null;

            const jitter = jitterValues.current.get(tech.id) || { x: 0, y: 0 };
            
            // Calculate base position (0-100%)
            const baseX = ((getNodePosition(tech, xAxis) - 1) / 8) * 100;
            const baseY = (1 - (getNodePosition(tech, yAxis) - 1) / 8) * 100;
            
            // Add jitter but constrain to stay within nearby cells
            const x = Math.max(6, Math.min(94, baseX + (jitter.x * 0.5)));
            const y = Math.max(6, Math.min(94, baseY + (jitter.y * 0.5)));
            const isRightHalf = x > 50;

            return (
              <div 
                key={tech.id} 
                className="absolute" 
                style={{ 
                  left: `${x}%`, 
                  top: `${y}%`,
                  zIndex: 1
                }}
                onMouseEnter={() => setHoveredTech(tech)}
                onMouseLeave={() => setHoveredTech(null)}
                onClick={() => onTechnologySelect(tech)}
              >
                <div 
                  className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ backgroundColor: cluster.colorCode }}
                />
                <div 
                  className={`absolute whitespace-nowrap text-xs text-foreground ${
                    isRightHalf ? '-translate-x-full -left-3' : 'left-3'
                  } top-1 pointer-events-none opacity-0 transition-opacity ${
                    hoveredTech?.id === tech.id ? 'opacity-100' : ''
                  }`}
                >
                  <span className="bg-background border px-2 py-1 rounded-md block">
                    {tech.name}
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {xAxis.toUpperCase()}: {getNodePosition(tech, xAxis)}<br />
                      {yAxis.toUpperCase()}: {getNodePosition(tech, yAxis)}
                    </div>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 rounded-lg bg-background/50 backdrop-blur border z-50">
        <div className="flex items-center gap-2">
          <Select value={xAxis} onValueChange={(value) => setXAxis(value as NodePositioning)}>
            <SelectTrigger className="w-[200px] border-0 bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AXIS_OPTIONS.map(option => (
                <SelectItem key={option.type} value={option.type}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">×</span>
          <Select value={yAxis} onValueChange={(value) => setYAxis(value as NodePositioning)}>
            <SelectTrigger className="w-[200px] border-0 bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AXIS_OPTIONS.map(option => (
                <SelectItem key={option.type} value={option.type}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}