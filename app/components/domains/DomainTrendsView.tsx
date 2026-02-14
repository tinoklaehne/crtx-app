"use client";

import { useState } from "react";
import { RadarVisualization } from "@/app/components/radar/RadarVisualization";
import { MatrixVisualization } from "@/app/components/matrix/MatrixVisualization";
import { Sidepanel } from "@/app/components/layout/Sidepanel";
import { TrendsKanbanView } from "./TrendsKanbanView";
import { TechnologyDetailModal } from "./TechnologyDetailModal";
import type { Trend } from "@/app/types/trends";
import type { Cluster } from "@/app/types/clusters";
import type { NodePositioning } from "@/app/types";

interface DomainTrendsViewProps {
  trends: Trend[];
  clusters: Cluster[];
}

export function DomainTrendsView({ trends, clusters }: DomainTrendsViewProps) {
  const [view, setView] = useState<"radar" | "matrix" | "kanban">("radar");
  const [nodePositioning, setNodePositioning] = useState<NodePositioning>("trl");
  const [clusterType, setClusterType] = useState<"parent" | "taxonomy" | "domain">("parent");
  const [activeView, setActiveView] = useState<"home" | "clusters" | "technologies" | "detail" | "cluster-detail">("technologies");
  const [activeTechnology, setActiveTechnology] = useState<Trend | undefined>();
  const [activeCluster, setActiveCluster] = useState<Cluster | undefined>();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTrendSelect = (trend: Trend) => {
    setActiveTechnology(trend);
    setIsModalOpen(true);
    // Also update sidepanel view for consistency, but modal will be shown
    setActiveView("detail");
  };

  const handleClusterSelect = (cluster: Cluster | null) => {
    if (cluster) {
      setActiveCluster(cluster);
      setActiveView("cluster-detail");
    } else {
      setActiveCluster(undefined);
      setActiveView("technologies");
    }
  };

  const handleNavigateTechnology = (direction: "prev" | "next") => {
    if (!activeTechnology) return;
    const currentIndex = trends.findIndex(t => t.id === activeTechnology.id);
    const newIndex = direction === "next"
      ? (currentIndex + 1) % trends.length
      : (currentIndex - 1 + trends.length) % trends.length;
    setActiveTechnology(trends[newIndex]);
  };

  const handleNavigateCluster = (direction: "prev" | "next") => {
    if (!activeCluster) return;
    const currentIndex = clusters.findIndex(c => c.id === activeCluster.id);
    const newIndex = direction === "next"
      ? (currentIndex + 1) % clusters.length
      : (currentIndex - 1 + clusters.length) % clusters.length;
    setActiveCluster(clusters[newIndex]);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setActiveView("technologies");
  };

  const activeTechnologyCluster = activeTechnology
    ? clusters.find((c) => c.id === activeTechnology.clusterId)
    : undefined;

  return (
    <>
      <div className="flex h-[800px] border rounded-lg overflow-hidden">
        <Sidepanel
          clusters={clusters}
          technologies={trends}
          activeView={activeView}
          activeTechnology={activeTechnology}
          activeCluster={activeCluster}
          onTechnologySelect={handleTrendSelect}
          onClusterSelect={handleClusterSelect}
          onNavigateTechnology={handleNavigateTechnology}
          onNavigateCluster={handleNavigateCluster}
          onViewChange={setActiveView}
          nodePositioning={nodePositioning}
        />
        {view === "matrix" ? (
          <MatrixVisualization
            clusters={clusters}
            technologies={trends}
            onTechnologySelect={handleTrendSelect}
            onClusterSelect={handleClusterSelect}
            nodePositioning={nodePositioning}
            onNodePositioningChange={setNodePositioning}
            view={view}
            onViewChange={setView}
          />
        ) : (
          <RadarVisualization
            clusters={clusters}
            technologies={trends}
            onTechnologySelect={handleTrendSelect}
            onClusterSelect={handleClusterSelect}
            nodePositioning={nodePositioning}
            onNodePositioningChange={setNodePositioning}
            view={view}
            onViewChange={setView}
            clusterType={clusterType}
            onClusterTypeChange={setClusterType}
            onKanbanView={() => <TrendsKanbanView trends={trends} onTrendSelect={handleTrendSelect} />}
          />
        )}
      </div>
      
      {/* Technology Detail Modal */}
      {activeTechnology && (
        <TechnologyDetailModal
          technology={activeTechnology}
          cluster={activeTechnologyCluster}
          clusters={clusters}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onNavigate={handleNavigateTechnology}
          signals={[]} // TODO: Fetch signals for the trend
        />
      )}
    </>
  );
}
