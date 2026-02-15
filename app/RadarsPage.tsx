"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/app/components/layout/Navbar";
import { RadarsSidepanel } from "@/app/components/radar/RadarsSidepanel";
import { RadarPage } from "@/app/[radarId]/RadarPage";
import type { Radar } from "@/app/types/radars";
import type { RadarDetail } from "@/app/radars/page";

interface RadarsPageProps {
  initialRadars: Radar[];
  radarDetails: Record<string, RadarDetail>;
  /** When true (e.g. on Vercel), clicking a radar navigates to /radars/[radarId] for on-demand load. When false, uses ?radar=id with preloaded data. */
  linkToDetailRoute?: boolean;
}

export function RadarsPage({
  initialRadars,
  radarDetails,
  linkToDetailRoute = false,
}: RadarsPageProps) {
  const [radars] = useState<Radar[]>(initialRadars);
  const [activeView, setActiveView] = useState<"home" | "clusters" | "technologies" | "detail" | "cluster-detail">("home");
  const searchParams = useSearchParams();
  const selectedRadarId = searchParams?.get("radar") ?? null;

  const selectedDetail = useMemo(
    () => (selectedRadarId ? radarDetails[selectedRadarId] : null),
    [selectedRadarId, radarDetails]
  );

  // When ?radar=id is in the URL and we have preloaded data, show full radar view (static export).
  if (selectedDetail) {
    return (
      <RadarPage
        radarId={selectedDetail.radar.id}
        initialRadar={selectedDetail.radar}
        initialRadars={radars}
        initialTechnologies={selectedDetail.technologies}
        initialClusters={selectedDetail.clusters}
        isLoading={false}
        error={null}
      />
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Navbar activeView={activeView} onViewChange={setActiveView} />
      <RadarsSidepanel radars={radars} linkToDetailRoute={linkToDetailRoute} />
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        <div className="max-w-md text-center text-muted-foreground">
          <p className="text-lg">Select a trend radar from the list to explore.</p>
        </div>
      </div>
    </div>
  );
}
