"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/app/components/layout/Navbar";
import { RadarsSidepanel } from "@/app/components/radar/RadarsSidepanel";
import { CreateRadarModal } from "@/app/components/radar/CreateRadarModal";
import { RadarPage } from "@/app/[radarId]/RadarPage";
import type { Radar } from "@/app/types/radars";
import type { RadarDetail, RadarTrendOption } from "@/app/radars/page";

interface RadarsPageProps {
  initialRadars: Radar[];
  radarDetails: Record<string, RadarDetail>;
  trendOptions: RadarTrendOption[];
}

export function RadarsPage({
  initialRadars,
  radarDetails,
  trendOptions,
}: RadarsPageProps) {
  const router = useRouter();
  const [radars] = useState<Radar[]>(initialRadars);
  const [activeView, setActiveView] = useState<"home" | "clusters" | "technologies" | "detail" | "cluster-detail">("home");
  const [createOpen, setCreateOpen] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const selectedRadarId = searchParams?.get("radar") ?? null;

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile", { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (!cancelled && res.ok && data?.user?.id) {
          setCurrentUserId(data.user.id as string);
        }
      } catch {
        // ignore
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleRadars = useMemo(
    () => {
      const userId = currentUserId;
      const withVisibility = radars.filter((radar) => {
        const isDraft = (radar.status || "").trim().toLowerCase() === "draft";
        const isOwner =
          !!userId && Array.isArray(radar.ownerIds)
            ? radar.ownerIds.includes(userId)
            : false;
        if (isDraft) {
          return isOwner;
        }
        return true;
      });
      return withVisibility.slice().sort((a, b) => {
        const aDraft =
          (a.status || "").trim().toLowerCase() === "draft" &&
          (!!currentUserId && a.ownerIds?.includes(currentUserId));
        const bDraft =
          (b.status || "").trim().toLowerCase() === "draft" &&
          (!!currentUserId && b.ownerIds?.includes(currentUserId));
        if (aDraft !== bDraft) {
          return bDraft ? 1 : -1; // drafts (for this user) first
        }
        return a.name.localeCompare(b.name);
      });
    },
    [radars, currentUserId]
  );

  const selectedDetail = useMemo(
    () => (selectedRadarId ? radarDetails[selectedRadarId] : null),
    [selectedRadarId, radarDetails]
  );

  if (selectedDetail) {
    return (
      <RadarPage
        radarId={selectedDetail.radar.id}
        initialRadar={selectedDetail.radar}
        initialRadars={visibleRadars}
        initialTechnologies={selectedDetail.technologies}
        initialClusters={selectedDetail.clusters}
        isLoading={false}
        error={null}
        trendOptions={trendOptions}
      />
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Navbar activeView={activeView} onViewChange={setActiveView} />
      <RadarsSidepanel
        radars={visibleRadars}
        onCreateRadarClick={() => setCreateOpen(true)}
        createMessage={createMessage}
      />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="max-w-md text-center text-muted-foreground mx-auto mt-20">
            <p className="text-lg">Select a trend radar from the list to explore.</p>
          </div>
        </div>
      </div>
      <CreateRadarModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        trendOptions={trendOptions}
        onSubmit={async ({ name, description, trendIds }) => {
          const res = await fetch("/api/radars/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description, trendIds }),
          });
          if (!res.ok) {
            setCreateMessage("Failed to create radar draft.");
            return false;
          }
          setCreateMessage("Radar draft created successfully.");
          router.refresh();
          return true;
        }}
      />
    </div>
  );
}
