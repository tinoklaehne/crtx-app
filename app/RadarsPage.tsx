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
}

export function RadarsPage({
  initialRadars,
  radarDetails,
}: RadarsPageProps) {
  const [radars] = useState<Radar[]>(initialRadars);
  const [activeView, setActiveView] = useState<"home" | "clusters" | "technologies" | "detail" | "cluster-detail">("home");
  const searchParams = useSearchParams();
  const selectedRadarId = searchParams?.get("radar") ?? null;

  const selectedDetail = useMemo(
    () => (selectedRadarId ? radarDetails[selectedRadarId] : null),
    [selectedRadarId, radarDetails]
  );

  // When ?radar=id is in the URL, show full radar view using preloaded data (no searchParams on server = static export ok)
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
      <RadarsSidepanel radars={radars} />
      <div className="flex-1 overflow-auto p-6 flex items-center justify-center">
        <div className="max-w-md text-center text-muted-foreground">
          <p className="text-lg">Select a trend radar from the list to explore.</p>
        </div>
      </div>
    </div>
  );
}
