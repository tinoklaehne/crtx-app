"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Navbar } from "../components/layout/Navbar";
import { Sidepanel } from "../components/layout/Sidepanel";
import { MatrixVisualization } from "../components/matrix/MatrixVisualization";
import { RadarVisualization } from "../components/radar/RadarVisualization";
import { useFilters } from "../contexts/FilterContext";
import { useRadarStore } from "@/app/store/radarStore";
import { useFilterSync } from "@/app/hooks/useFilterSync";
import type { Cluster } from "@/app/types/clusters";
import type { Trend } from "@/app/types/trends";

interface GeneralPageProps {
  initialTechnologies: Trend[];
  initialClusters: Cluster[];
  isLoading: boolean;
  error: string | null;
}

export function GeneralPage({
  initialTechnologies,
  initialClusters,
  isLoading: initialLoading,
  error: initialError,
}: GeneralPageProps) {
  const {
    technologies,
    clusters,
    isLoading,
    error,
    activeView,
    setActiveView,
    activeTechnology,
    setActiveTechnology,
    activeCluster,
    setActiveCluster,
    nodePositioning,
    setNodePositioning,
    viewMode,
    setViewMode,
    setTechnologies,
    setClusters,
    setIsLoading,
    setError,
  } = useRadarStore();

  const { setSelectedCluster, resetFilters } = useFilters();

  // Sync filters with radar state
  useFilterSync();

  // Initialize store with server-fetched data
  useEffect(() => {
    setTechnologies(initialTechnologies);
    setClusters(initialClusters);
    setIsLoading(initialLoading);
    setError(initialError);
  }, [initialTechnologies, initialClusters, initialLoading, initialError, setTechnologies, setClusters, setIsLoading, setError]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Navbar 
        activeView={activeView}
        onViewChange={setActiveView}
      />
      <Sidepanel
        clusters={clusters}
        technologies={technologies}
        activeView={activeView}
        activeTechnology={activeTechnology}
        activeCluster={activeCluster}
        onTechnologySelect={handleTechnologySelect}
        onClusterSelect={handleClusterSelect}
        onNavigateTechnology={handleNavigateTechnology}
        onNavigateCluster={handleNavigateCluster}
        onViewChange={setActiveView}
        nodePositioning={nodePositioning}
        universe="General"
      />
      {viewMode === "matrix" ? (
        <MatrixVisualization
          clusters={clusters}
          technologies={technologies}
          onTechnologySelect={handleTechnologySelect}
          onClusterSelect={handleClusterSelect}
          nodePositioning={nodePositioning}
          onNodePositioningChange={setNodePositioning}
          view={viewMode}
          onViewChange={setViewMode}
        />
      ) : (
        <RadarVisualization
          clusters={clusters}
          technologies={technologies}
          onTechnologySelect={handleTechnologySelect}
          onClusterSelect={handleClusterSelect}
          nodePositioning={nodePositioning}
          onNodePositioningChange={setNodePositioning}
          view={viewMode}
          onViewChange={setViewMode}
        />
      )}
    </div>
  );

  function handleTechnologySelect(tech: Trend) {
    setActiveTechnology(tech);
    setActiveView("detail");
  }

  function handleClusterSelect(cluster: Cluster | null) {
    if (cluster) {
      setActiveCluster(cluster);
      setActiveView("cluster-detail");
      setSelectedCluster(cluster.id);
    } else {
      setActiveCluster(undefined);
      setSelectedCluster(null);
      setActiveView("technologies");
    }
  }

  function handleNavigateTechnology(direction: "prev" | "next") {
    if (!activeTechnology) return;
    const currentIndex = technologies.findIndex(t => t.id === activeTechnology.id);
    const newIndex = direction === "next"
      ? (currentIndex + 1) % technologies.length
      : (currentIndex - 1 + technologies.length) % technologies.length;
    setActiveTechnology(technologies[newIndex]);
  }

  function handleNavigateCluster(direction: "prev" | "next") {
    if (!activeCluster) return;
    const currentIndex = clusters.findIndex(c => c.id === activeCluster.id);
    const newIndex = direction === "next"
      ? (currentIndex + 1) % clusters.length
      : (currentIndex - 1 + clusters.length) % clusters.length;
    setActiveCluster(clusters[newIndex]);
  }
}