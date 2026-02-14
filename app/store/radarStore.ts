"use client";

import { create } from 'zustand';
import type { Cluster, Trend } from '@/app/types';

interface RadarStateData {
  technologies: Trend[];
  clusters: Cluster[];
  isLoading: boolean;
  error: string | null;
  activeView: "home" | "clusters" | "technologies" | "detail" | "cluster-detail";
  activeTechnology?: Trend;
  activeCluster?: Cluster;
  nodePositioning: "trl" | "brl" | "horizon";
  viewMode: "radar" | "matrix" | "kanban";
}

interface RadarState extends RadarStateData {
  setTechnologies: (technologies: Trend[]) => void;
  setClusters: (clusters: Cluster[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveView: (view: RadarState["activeView"]) => void;
  setActiveTechnology: (tech?: Trend) => void;
  setActiveCluster: (cluster?: Cluster) => void;
  setNodePositioning: (positioning: RadarState["nodePositioning"]) => void;
  setViewMode: (mode: RadarState["viewMode"]) => void;
  reset: () => void;
}

const initialState: RadarStateData = {
  technologies: [],
  clusters: [],
  isLoading: true,
  error: null,
  activeView: "technologies",
  activeTechnology: undefined,
  activeCluster: undefined,
  nodePositioning: "trl",
  viewMode: "radar",
};

export const useRadarStore = create<RadarState>((set) => ({
  ...initialState,
  setTechnologies: (technologies) => set({ technologies }),
  setClusters: (clusters) => set({ clusters }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setActiveView: (activeView) => set({ activeView }),
  setActiveTechnology: (activeTechnology) => set({ activeTechnology }),
  setActiveCluster: (activeCluster) => set({ activeCluster }),
  setNodePositioning: (nodePositioning) => set({ nodePositioning }),
  setViewMode: (viewMode) => set({ viewMode }),
  reset: () => set(initialState),
}));