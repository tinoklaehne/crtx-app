"use client";

import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HomeSection } from "./Sidepanel/sections";
import { ClustersSection } from "./Sidepanel/ClustersSection";
import { TechnologiesSection } from "./Sidepanel/TechnologiesSection";
import { TechnologyDetailSection } from "./Sidepanel/TechnologyDetailSection";
import { ClusterDetailSection } from "./Sidepanel/ClusterDetailSection";
import { ResizablePanel } from "../ui/resizable-panel";
import { useRadarStore } from "@/app/store/radarStore";
import type { Cluster } from "@/app/types/clusters";
import type { Trend } from "@/app/types/trends";
import type { NodePositioning } from "@/app/types";

interface SidepanelProps {
  clusters: Cluster[];
  technologies: Trend[];
  activeView: "home" | "clusters" | "technologies" | "detail" | "cluster-detail";
  activeTechnology?: Trend;
  activeCluster?: Cluster;
  onTechnologySelect: (tech: Trend) => void;
  onClusterSelect: (cluster: Cluster | null) => void;
  onNavigateTechnology: (direction: "prev" | "next") => void;
  onNavigateCluster: (direction: "prev" | "next") => void;
  onViewChange: (view: "home" | "clusters" | "technologies" | "detail" | "cluster-detail") => void;
  nodePositioning: NodePositioning;
  radarName?: string;
  universe?: "General" | "Travel";
}

export function Sidepanel({
  clusters,
  technologies,
  activeView,
  activeTechnology,
  activeCluster,
  onTechnologySelect,
  onClusterSelect,
  onNavigateTechnology,
  onNavigateCluster,
  onViewChange,
  nodePositioning,
  radarName,
  universe = "General",
}: SidepanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Memoize filtered technologies to prevent unnecessary re-renders
  const filteredTechnologies = useMemo(() => {
    if (!technologies || !Array.isArray(technologies)) return [];
    return technologies.filter(tech => 
      tech.name?.toLowerCase().includes((searchQuery || "").toLowerCase())
    );
  }, [technologies, searchQuery]);

  return (
    <ResizablePanel defaultWidth={320} minWidth={280} maxWidth={480} className="border-r bg-card">
      <ScrollArea className="h-screen">
        {activeView === "home" && (
          <HomeSection />
        )}
        {activeView === "clusters" && (
          <ClustersSection 
            clusters={clusters}
            technologies={technologies}
            onClusterSelect={onClusterSelect}
          />
        )}
        {activeView === "technologies" && (
          <TechnologiesSection 
            clusters={clusters}
            technologies={technologies}
            filteredTechnologies={filteredTechnologies}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onTechnologySelect={onTechnologySelect}
            onClusterSelect={onClusterSelect}
            nodePositioning={nodePositioning}
            radarName={radarName}
          />
        )}
        {activeView === "detail" && activeTechnology && (
          <TechnologyDetailSection 
            technology={activeTechnology}
            clusters={clusters}
            cluster={clusters.find(c => c.id === activeTechnology.clusterId)}
            onNavigate={onNavigateTechnology}
            onViewChange={onViewChange}
          />
        )}
        {activeView === "cluster-detail" && activeCluster && (
          <ClusterDetailSection 
            cluster={activeCluster}
            technologies={technologies.filter(t => t.clusterId === activeCluster.id)}
            onNavigate={onNavigateCluster}
            onViewChange={onViewChange}
            onTechnologySelect={onTechnologySelect}
            nodePositioning={nodePositioning}
            section={universe === "Travel" ? "travel" : "general"}
          />
        )}
      </ScrollArea>
    </ResizablePanel>
  );
}