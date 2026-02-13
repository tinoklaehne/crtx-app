"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/layout/Navbar";
import { Sidepanel } from "@/app/components/layout/Sidepanel";
import type { Radar } from "@/app/types/radars";
import type { Cluster } from "@/app/types/clusters";
import type { Trend } from "@/app/types/trends";

interface RadarsPageProps {
  initialRadars: Radar[];
  initialClusters: Cluster[];
  initialTrends: Trend[];
}

export function RadarsPage({ initialRadars, initialClusters, initialTrends }: RadarsPageProps) {
  const router = useRouter();
  const [radars] = useState<Radar[]>(initialRadars);
  const [clusters] = useState<Cluster[]>(initialClusters);
  const [trends] = useState<Trend[]>(initialTrends);
  const [activeView, setActiveView] = useState<"home" | "clusters" | "technologies" | "detail" | "cluster-detail">("home");

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Navbar 
        activeView={activeView}
        onViewChange={setActiveView}
      />
      <Sidepanel
        clusters={clusters}
        technologies={trends}
        activeView={activeView}
        onViewChange={setActiveView}
        nodePositioning="trl"
        onTechnologySelect={() => {}}
        onClusterSelect={() => {}}
        onNavigateTechnology={() => {}}
        onNavigateCluster={() => {}}
        universe="General"
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {radars.map((radar) => (
              <div
                key={radar.id}
                className="group relative rounded-lg border p-6 hover:bg-secondary/50 cursor-pointer transition-colors"
                onClick={() => router.push(`/${radar.id}`)}
              >
                <div className="mb-2">
                  <h2 className="text-xl font-semibold">{radar.name}</h2>
                </div>
                <p className="text-muted-foreground line-clamp-3 mb-4">{radar.description}</p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {radar.trends.length} {radar.trends.length === 1 ? 'trend' : 'trends'}
                  </span>
                  <span>
                    Last updated: {new Date(radar.lastModified).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}