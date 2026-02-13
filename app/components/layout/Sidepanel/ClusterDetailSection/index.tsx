"use client";

import { Separator } from "@/components/ui/separator";
import { NavigationControls } from "./NavigationControls";
import { ClusterHeader } from "./ClusterHeader";
import { ClusterImage } from "./ClusterImage";
import { ClusterDescription } from "./ClusterDescription";
import { TrendsList } from "./TrendsList";
import { useFilters } from "@/app/contexts/FilterContext";
import type { Cluster, Trend } from "@/app/types";
import type { NodePositioning } from "@/app/types";

interface ClusterDetailSectionProps {
  cluster: Cluster;
  trends: Trend[];
  onNavigate: (direction: "prev" | "next") => void;
  onViewChange: (view: "technologies") => void;
  onTrendSelect: (tech: Trend) => void;
  nodePositioning: NodePositioning;
}

export function ClusterDetailSection({
  cluster,
  trends,
  onNavigate,
  onViewChange,
  onTrendSelect,
  nodePositioning,
}: ClusterDetailSectionProps) {
  const { setSelectedCluster } = useFilters();
  
  const handleClose = () => {
    setSelectedCluster(null);
    onViewChange("technologies");
  };

  return (
    <div className="relative flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background">
        <div className="px-6 pt-6">
          <NavigationControls 
            onClose={handleClose}
            onNavigate={onNavigate}
          />
          <Separator className="-mx-6 w-[calc(100%+3rem)]" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pt-4 space-y-4">
        <ClusterHeader cluster={cluster} />

        <ClusterImage cluster={cluster} />
        <ClusterDescription description={cluster.description} />
        
        <Separator className="-mx-6 w-[calc(100%+3rem)]" />

        <TrendsList
          cluster={cluster}
          trends={trends}
          nodePositioning={nodePositioning}
          onTrendSelect={onTrendSelect}
        />
      </div>
    </div>
  );
}