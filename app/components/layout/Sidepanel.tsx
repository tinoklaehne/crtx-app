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
import { useFilters } from "@/app/contexts/FilterContext";
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
  radarStatus?: string;
  onEditRadar?: () => void;
  radarDescription?: string;
  radarOwners?: { name: string; email?: string }[];
  clusterType?: "parent" | "taxonomy" | "domain";
  universe?: "General" | "Travel";
  showTechnologiesTitle?: boolean;
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
  radarStatus,
  onEditRadar,
  radarDescription,
  radarOwners,
  clusterType = "parent",
  universe = "General",
  showTechnologiesTitle = true,
}: SidepanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedCluster } = useFilters();

  // Memoize filtered technologies to prevent unnecessary re-renders
  const filteredTechnologies = useMemo(() => {
    if (!technologies || !Array.isArray(technologies)) return [];
    const nameFiltered = technologies.filter((tech) =>
      tech.name?.toLowerCase().includes((searchQuery || "").toLowerCase())
    );

    if (clusterType === "domain") {
      if (!selectedCluster || selectedCluster === "all") {
        return nameFiltered;
      }
      return nameFiltered.filter((tech) => tech.domain === selectedCluster);
    }

    // For parent/taxonomy we leave domain dropdown alone; Parent clustering is
    // handled via cluster clicks/cluster-detail view.
    return nameFiltered;
  }, [technologies, searchQuery, clusterType, selectedCluster]);

  return (
    <ResizablePanel defaultWidth={500} minWidth={360} maxWidth={720} className="border-r bg-card">
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
            radarStatus={radarStatus}
            onEditRadar={onEditRadar}
            radarDescription={radarDescription}
            radarOwners={radarOwners}
            clusterType={clusterType}
            showTitle={showTechnologiesTitle}
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
            technologies={technologies.filter((t) =>
              clusterType === "domain"
                ? t.domain === activeCluster.domain
                : t.clusterId === activeCluster.id
            )}
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