"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/app/components/layout/Navbar";
import { TrendsSidepanel } from "@/app/components/trends/TrendsSidepanel";
import type { Trend } from "@/app/types/trends";

interface TrendsListPageProps {
  initialTrends: Trend[];
  loadError?: boolean;
}

export function TrendsListPage({ initialTrends, loadError }: TrendsListPageProps) {
  const [trends] = useState<Trend[]>(initialTrends);
  const [subscribedTrendIds, setSubscribedTrendIds] = useState<string[]>([]);
  const [showSubscribedOnly, setShowSubscribedOnly] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/user/subscribed-trends");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setSubscribedTrendIds(data.trendIds ?? []);
      } catch (e) {
        console.error("Failed to load subscribed trends", e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Navbar />
      <TrendsSidepanel
        trends={trends}
        showSubscribedOnly={showSubscribedOnly}
        onShowSubscribedOnlyChange={setShowSubscribedOnly}
        subscribedTrendIds={subscribedTrendIds}
      />
      <div className="flex-1 overflow-auto p-6">
        {loadError ? (
          <div className="text-center py-12 text-muted-foreground">
            Failed to load trends.
          </div>
        ) : (
          <div className="max-w-2xl mx-auto py-12 text-center text-muted-foreground">
            <p className="text-lg">Select a trend from the list to view details.</p>
          </div>
        )}
      </div>
    </div>
  );
}
