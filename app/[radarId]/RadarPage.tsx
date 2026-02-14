"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Navbar } from "../components/layout/Navbar";
import { RadarsSidepanel } from "../components/radar/RadarsSidepanel";
import { Sidepanel } from "../components/layout/Sidepanel";
import { RadarVisualization } from "../components/radar/RadarVisualization";
import { MatrixVisualization } from "../components/matrix/MatrixVisualization";
import { TrendsKanbanView } from "../components/domains/TrendsKanbanView";
import { useRadarStore } from "@/app/store/radarStore";
import { useFilters } from "@/app/contexts/FilterContext";
import type { Cluster } from "@/app/types/clusters";
import type { Trend } from "@/app/types/trends";
import type { Radar } from "@/app/types/radars";
import type { NodePositioning } from "@/app/types";

interface RadarPageProps {
  radarId?: string;
  initialRadar?: Radar | null;
  initialRadars?: Radar[];
  initialTechnologies: Trend[];
  initialClusters: Cluster[];
  isLoading: boolean;
  error: string | null;
}

export function RadarPage({ 
  radarId, 
  initialRadar, 
  initialRadars = [], 
  initialTechnologies, 
  initialClusters, 
  isLoading: initialLoading, 
  error: initialError 
}: RadarPageProps) {
  const [nodePositioning, setNodePositioning] = useState<NodePositioning>("trl");
  const [viewMode, setViewMode] = useState<"radar" | "matrix" | "kanban">("radar");
  const [clusterType, setClusterType] = useState<"parent" | "taxonomy" | "domain">("parent");
  const [radar, setRadar] = useState<Radar | null>(initialRadar || null);
  const [radars] = useState<Radar[]>(initialRadars);

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
    setTechnologies,
    setClusters,
    setIsLoading,
    setError,
  } = useRadarStore();

  const { setSelectedCluster } = useFilters();

  // Initialize store with server-fetched data
  useEffect(() => {
    setTechnologies(initialTechnologies);
    setClusters(initialClusters);
    setIsLoading(initialLoading);
    setError(initialError);
    
    if (initialRadar) {
      setRadar(initialRadar);
      setClusterType(initialRadar.cluster.toLowerCase() as "parent" | "taxonomy" | "domain");
    }
  }, [initialTechnologies, initialClusters, initialLoading, initialError, initialRadar, setTechnologies, setClusters, setIsLoading, setError]);

  const handleClusterTypeChange = async (type: "parent" | "taxonomy" | "domain") => {
    setClusterType(type);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          radarId: radarId,
          clusterType: type
        }),
      });

      if (!response.ok) {
        // For static export, API calls will fail, so we'll show a message
        if (response.status === 404) {
          setError('Cluster type switching is not available in static export. Please rebuild the site to see different cluster types.');
          return;
        }
        throw new Error('Failed to refetch data');
      }

      const data = await response.json();
      
      // Update the store with new data
      setTechnologies(data.technologies);
      setClusters(data.clusters);
      setError(null);
      
      console.log(`Successfully refetched data for cluster type: ${type}`);
      console.log(`Found ${data.technologies.length} technologies and ${data.clusters.length} clusters`);
      
    } catch (error) {
      console.error('Error refetching data:', error);
      setError('Failed to load data for the selected clustering method. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <Button
            className="mt-4 w-full"
            onClick={() => window.location.href = "/radars"}
          >
            Return to Radars
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Navbar 
        activeView={activeView}
        onViewChange={setActiveView}
        radarName={radar?.name}
      />
      <RadarsSidepanel radars={radars} currentRadarId={radarId} />
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
        radarName={radar?.name}
        universe={radar?.type === "Travel" ? "Travel" : "General"}
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
          onKanbanView={() => <TrendsKanbanView trends={technologies} onTrendSelect={handleTechnologySelect} />}
        />
      ) : (
        <RadarVisualization
          clusters={clusters}
          technologies={technologies}
          onTechnologySelect={handleTechnologySelect}
          onClusterSelect={handleClusterSelect}
          nodePositioning={nodePositioning}
          onNodePositioningChange={setNodePositioning}
          clusterType={clusterType}
          onClusterTypeChange={handleClusterTypeChange}
          view={viewMode}
          onViewChange={setViewMode}
          onKanbanView={() => <TrendsKanbanView trends={technologies} onTrendSelect={handleTechnologySelect} />}
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
      setActiveView("technologies");
      setSelectedCluster(null);
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