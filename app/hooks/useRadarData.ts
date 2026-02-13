"use client";

import { useCallback } from 'react';
import { useRadarStore } from '@/app/store/radarStore';
import type { Cluster, Trend } from '@/app/types';

export function useRadarData() {
  const store = useRadarStore();

  const updateTechnologies = useCallback((technologies: Trend[]) => {
    if (Array.isArray(technologies)) {
      store.setTechnologies(technologies);
    } else {
      console.warn('Invalid technologies data:', technologies);
      store.setTechnologies([]);
    }
  }, [store]);

  const updateClusters = useCallback((clusters: Cluster[]) => {
    if (Array.isArray(clusters)) {
      store.setClusters(clusters);
    } else {
      console.warn('Invalid clusters data:', clusters);
      store.setClusters([]);
    }
  }, [store]);

  return {
    ...store,
    updateTechnologies,
    updateClusters,
  };
}