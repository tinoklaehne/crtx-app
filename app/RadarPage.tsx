"use client";

import { useState, useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Navbar } from "./components/layout/Navbar";
import { Sidepanel } from "./components/layout/Sidepanel";
import { MatrixVisualization } from "./components/matrix/MatrixVisualization";
import { RadarVisualization } from "./components/radar/RadarVisualization";
import { useFilters } from "./contexts/FilterContext";
import { getClusters, getTechnologies } from "@/lib/airtable/general";
import type { Cluster } from "./types/clusters";
import type { Trend } from "./types/trends";
import type { NodePositioning } from "./types";

export function RadarPage() {
  const [activeView, setActiveView] = useState<"home" | "clusters" | "technologies" | "detail" | "cluster-detail">("technologies");
  const [activeTechnology, setActiveTechnology] = useState<Trend | undefined>();
  const [activeCluster, setActiveCluster] = useState<Cluster | undefined>();
  const [nodePositioning, setNodePositioning] = useState<NodePositioning>("trl");
  const [viewMode, setViewMode] = useState<"radar" | "matrix">("radar");
  const [technologies, setTechnologies] = useState<Trend[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setSelectedCluster, resetFilters } = useFilters();

  // Rest of the code remains the same...
}