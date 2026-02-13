"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useFilters } from "@/app/contexts/FilterContext";
import { getReadinessLevel } from "./utils";
import type { Cluster, Trend } from "@/app/types";
import type { NodePositioning } from "@/app/types";

interface ClusterDetailSectionProps {
  cluster: Cluster;
  technologies: Trend[];
  onNavigate: (direction: "prev" | "next") => void;
  onViewChange: (view: "technologies") => void;
  onTechnologySelect: (tech: Trend) => void;
  nodePositioning: NodePositioning;
  universe?: "General" | "Travel";
  section: "general" | "travel";
}

export function ClusterDetailSection({
  cluster,
  technologies,
  onNavigate,
  onViewChange,
  onTechnologySelect,
  nodePositioning,
  universe = "General",
  section,
}: ClusterDetailSectionProps) {
  const { setSelectedCluster } = useFilters();
  
  // Sort technologies alphabetically
  const sortedTechnologies = [...technologies].sort((a, b) => a.name.localeCompare(b.name));

  const handleClose = () => {
    setSelectedCluster(null);
    onViewChange("technologies");
  };

  return (
    <div className="relative flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background">
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between pb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate("prev")}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate("next")}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Separator className="-mx-6 w-[calc(100%+3rem)]" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pt-4 space-y-4">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground uppercase tracking-wider">
            {cluster.domain}
          </div>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold" style={{ color: cluster.colorCode }}>
              {cluster.name}
            </h2>
          </div>
          <div className="text-sm text-muted-foreground">
            {technologies.length} {technologies.length === 1 ? 'trend' : 'trends'}
          </div>
        </div>

        {cluster.imageUrl && (
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image
              src={cluster.imageUrl}
              alt={cluster.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="-mx-6 px-6 pb-6">
          <p className="text-muted-foreground">{cluster.description}</p>
        </div>
        <Separator className="-mx-6 w-[calc(100%+3rem)]" />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold" style={{ color: cluster.colorCode }}>
            Trends
          </h3>
          <div className="-mx-6">
            {sortedTechnologies.map((tech) => (
              <div
                key={tech.id}
                className="group relative py-3 hover:bg-secondary/50 cursor-pointer"
                onClick={() => onTechnologySelect(tech)}
              >
                <div className="flex items-center justify-between px-6">
                  <h4 className="font-medium">{tech.name}</h4>
                  <div className="text-sm text-muted-foreground">
                    {getReadinessLevel(tech, nodePositioning)}
                  </div>
                </div>
                <div 
                  className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: cluster.colorCode }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}