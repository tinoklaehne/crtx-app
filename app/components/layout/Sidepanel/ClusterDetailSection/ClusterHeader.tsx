"use client";

import type { Cluster } from "@/app/types/clusters";

interface ClusterHeaderProps {
  cluster: Cluster;
}

export function ClusterHeader({ cluster }: ClusterHeaderProps) {
  return (
    <div className="space-y-1 min-w-0">
      <div className="text-sm text-muted-foreground uppercase tracking-wider truncate">
        {cluster.domain}
      </div>
      <h2 className="text-2xl font-semibold truncate" style={{ color: cluster.colorCode }}>
        {cluster.name}
      </h2>
    </div>
  );
}