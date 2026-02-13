"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search } from "lucide-react";
import { FilterToggle } from "../../ui/filter-toggle";
import { useFilters } from "@/app/contexts/FilterContext";
import type { Cluster, Trend } from "@/app/types";
import type { FilterCategory } from "@/app/components/ui/filter-toggle";

interface ClustersSectionProps {
  clusters: Cluster[];
  technologies: Trend[];
  onClusterSelect: (cluster: Cluster) => void;
}

export function ClustersSection({
  clusters,
  technologies,
  onClusterSelect,
}: ClustersSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedFilters } = useFilters();

  // Filter clusters based on domains and search
  const displayedClusters = clusters.filter(cluster => {
    const matchesSearch = cluster.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDomain = selectedFilters.includes(cluster.domain.toLowerCase() as FilterCategory);
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background">
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between pb-3">
            <h2 className="text-2xl font-extrabold">Macros</h2>
          </div>

          <FilterToggle className="mb-3" />

          <div className="relative">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 border-0 bg-transparent focus-visible:ring-0 focus-visible:outline-none h-8"
            />
          </div>
          <Separator className="-mx-6 w-[calc(100%+3rem)] mt-3" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pt-3">
        {displayedClusters.map((cluster) => {
          const clusterTechnologies = technologies.filter(t => 
            t.clusterId === cluster.id && 
            selectedFilters.includes(t.domain.toLowerCase() as FilterCategory)
          );
          
          return (
            <div
              key={cluster.id}
              className="group relative py-3 hover:bg-secondary/50 cursor-pointer -mx-6 px-6"
              onClick={() => onClusterSelect(cluster)}
            >
              <div className="flex flex-col">
                <h3 className="font-medium mb-1">{cluster.name}</h3>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  {clusterTechnologies.length} {clusterTechnologies.length === 1 ? 'micro' : 'micros'}
                </div>
              </div>
              <div 
                className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: cluster.colorCode }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}