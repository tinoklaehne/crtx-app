"use client";

import { useState, useMemo } from "react";
import { RadarVisualization } from "@/app/components/radar/RadarVisualization";
import { MatrixVisualization } from "@/app/components/matrix/MatrixVisualization";
import { Sidepanel } from "@/app/components/layout/Sidepanel";
import { TrendsKanbanView } from "./TrendsKanbanView";
import { TechnologyDetailModal } from "./TechnologyDetailModal";
import { generateClusterPalette } from "@/app/components/radar/utils/calculations";
import { useFilters } from "@/app/contexts/FilterContext";
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
  const { setSelectedCluster } = useFilters();

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
      setSelectedCluster(
        clusterType === "domain" ? (cluster.domain as string) : cluster.id
      );
    } else {
      setActiveCluster(undefined);
      setActiveView("technologies");
      setSelectedCluster(null);
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

  const clusterAccentMaps = useMemo(() => {
    if (!trends.length || !clusters.length) {
      return {
        byClusterId: new Map<string, string>(),
        byDomain: {} as Record<string, string>,
      };
    }

    const validTechnologies = trends.filter((t) => {
      if (clusterType === "domain") {
        return !!(t.domain && t.domain.trim());
      }
      if (clusterType === "taxonomy") {
        return !!(t.taxonomyId && t.taxonomyId.trim());
      }
      return !!(t.clusterId && t.clusterId.trim());
    });

    if (clusterType === "domain") {
      const domains = Array.from(
        new Set(
          validTechnologies
            .map((t) => t.domain)
            .filter((d): d is string => !!d && d.trim().length > 0)
        )
      ).sort();
      const palette = generateClusterPalette(domains);
      const byClusterId = new Map<string, string>();
      clusters.forEach((c) => {
        const key = c.domain && palette[c.domain] ? c.domain : undefined;
        if (key) {
          byClusterId.set(c.id, palette[key]);
        }
      });
      return { byClusterId, byDomain: palette };
    }

    const activeClusters = clusters
      .filter((cluster) =>
        validTechnologies.some((t) =>
          (clusterType === "taxonomy" ? t.taxonomyId : t.clusterId) === cluster.id
        )
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    const palette = generateClusterPalette(activeClusters.map((c) => c.id));
    const byClusterId = new Map<string, string>();
    clusters.forEach((c) => {
      if (palette[c.id]) {
        byClusterId.set(c.id, palette[c.id]);
      }
    });

    return { byClusterId, byDomain: {} as Record<string, string> };
  }, [trends, clusters, clusterType]);

  const activeTechnologyAccentColor = useMemo(() => {
    if (!activeTechnology) return undefined;

    if (clusterType === "domain") {
      const domainKey = activeTechnology.domain;
      return (domainKey && clusterAccentMaps.byDomain[domainKey]) || undefined;
    }

    const clusterId = activeTechnology.clusterId || activeTechnology.taxonomyId || "";
    return (clusterId && clusterAccentMaps.byClusterId.get(clusterId)) || undefined;
  }, [activeTechnology, clusterType, clusterAccentMaps]);

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
          clusterType={clusterType}
          showTechnologiesTitle={false}
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
            clusterType={clusterType}
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
          accentColor={activeTechnologyAccentColor}
        />
      )}
    </>
  );
}
