"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search } from "lucide-react";
import { getReadinessLevel } from "./utils";
import type { Cluster, Trend } from "@/app/types";
import type { NodePositioning } from "@/app/types";

interface TechnologiesSectionProps {
  clusters: Cluster[];
  technologies: Trend[];
  filteredTechnologies: Trend[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onTechnologySelect: (tech: Trend) => void;
  onClusterSelect: (cluster: Cluster | null) => void;
  nodePositioning: NodePositioning;
  radarName?: string;
}

export function TechnologiesSection({
  clusters,
  technologies,
  filteredTechnologies,
  searchQuery,
  onSearchChange,
  onTechnologySelect,
  onClusterSelect,
  nodePositioning,
  radarName,
}: TechnologiesSectionProps) {
  const handleClusterClick = useCallback((cluster: Cluster) => {
    onClusterSelect(cluster);
  }, [onClusterSelect]);

  // Group technologies by cluster
  const groupedTechnologies = filteredTechnologies.reduce((acc, tech) => {
    const cluster = clusters.find(c => c.id === tech.clusterId);
    if (!cluster) return acc;

    if (!acc.has(cluster.id)) {
      acc.set(cluster.id, { cluster, technologies: [] });
    }
    
    acc.get(cluster.id)!.technologies.push(tech);
    return acc;
  }, new Map<string, { cluster: Cluster; technologies: Trend[] }>());

  // Calculate global index
  let globalIndex = 1;

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background">
        <div className="px-6 h-[72px] flex items-center">
          <h2 className="text-2xl font-extrabold">
            {radarName || "Trends"}
          </h2>
        </div>

        <div className="px-6">
          <div className="relative">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 border-0 bg-transparent focus-visible:ring-0 focus-visible:outline-none h-8"
            />
          </div>
          <Separator className="-mx-6 w-[calc(100%+3rem)] mt-3" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pt-3">
        {Array.from(groupedTechnologies.values())
          .sort((a, b) => a.cluster.name.localeCompare(b.cluster.name))
          .map(({ cluster, technologies: clusterTechs }) => (
            <div key={cluster.id} className="space-y-2 mb-4">
              <h3 
                className={`text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => handleClusterClick(cluster)}
                style={{ color: cluster.colorCode }}
              >
                {cluster.name}
              </h3>
              <div className="-mx-6">
                {clusterTechs
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((tech) => {
                    const index = globalIndex++;
                    return (
                      <div
                        key={tech.id}
                        className="group relative py-2 hover:bg-secondary/50 cursor-pointer"
                        onClick={() => onTechnologySelect(tech)}
                      >
                        <div className="flex items-center justify-between px-6">
                          <div className="flex items-center gap-4">
                            <span 
                              className="text-sm w-8 tabular-nums"
                              style={{ color: cluster.colorCode }}
                            >
                              {index.toString().padStart(2, '0')}
                            </span>
                            <h4 className="font-medium">{tech.name}</h4>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {getReadinessLevel(tech, nodePositioning)}
                          </div>
                        </div>
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: cluster.colorCode }}
                        />
                      </div>
                    );
                  })}
              </div>
              <Separator className="-mx-6 w-[calc(100%+3rem)] mt-4" />
            </div>
          ))}

        {groupedTechnologies.size === 0 && (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">
              {searchQuery ? "No matching trends found" : "No trends available"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}