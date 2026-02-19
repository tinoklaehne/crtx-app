"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { TRLTooltip } from "@/app/components/ui/trl-tooltip";
import { BRLTooltip } from "@/app/components/ui/brl-tooltip";
import { TrendHorizonTooltip } from "@/app/components/ui/trend-horizon-tooltip";
import type { Trend } from "@/app/types/trends";
import type { Cluster } from "@/app/types/clusters";

interface TrendDetailPageProps {
  trend: Trend;
  cluster?: Cluster | null;
  signals?: Array<{ id: string; headline: string; date?: string; url?: string }>;
}

export function TrendDetailPage({
  trend,
  cluster,
  signals = [],
}: TrendDetailPageProps) {
  const [expandedSections, setExpandedSections] = useState({
    horizon: false,
    trl: false,
    brl: false,
  });
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/user/subscribed-trends");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setIsBookmarked((data.trendIds ?? []).includes(trend.id));
      } catch (e) {
        console.error("Failed to load subscribed trends", e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [trend.id]);

  const handleBookmarkChange = async (checked: boolean) => {
    setBookmarkLoading(true);
    try {
      const res = await fetch("/api/user/bookmark-trend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trendId: trend.id, bookmark: checked }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsBookmarked(checked);
      }
    } catch (e) {
      console.error("Failed to update bookmark", e);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const toggleSection = (section: "horizon" | "trl" | "brl") => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const clusterColor = cluster?.colorCode || "#00ff80";
  const hasHorizonReasoning =
    trend.trendHorizonReasoning && trend.trendHorizonReasoning.trim().length > 0;
  const hasTrlReasoning = trend.trlReasoning && trend.trlReasoning.trim().length > 0;
  const hasBrlReasoning = trend.brlReasoning && trend.brlReasoning.trim().length > 0;

  const horizonLabels: Record<string, string> = {
    "0-2": "0-2 years Immediate Impact",
    "2-5": "2-5 years Short-term Evolution",
    "5-10": "5-10 years Medium-term Development",
    "10-15": "10-15 years Extended Timeline",
    "15+": "15+ years Future Vision",
  };
  const horizonLabel = horizonLabels[trend.trendHorizon] || `${trend.trendHorizon} years`;

  const iconSrc = trend.iconUrl ?? trend.imageUrl;

  return (
    <div className="min-h-full bg-background text-foreground">
      {/* Header: no divider */}
      <div className="sticky top-0 z-10 flex items-center justify-end gap-3 bg-background px-6 py-4">
        <span className="text-sm font-medium text-muted-foreground">Bookmark</span>
        <Switch
          checked={isBookmarked}
          onCheckedChange={handleBookmarkChange}
          disabled={bookmarkLoading}
          aria-label="Bookmark trend"
        />
      </div>

      {/* Content */}
      <ScrollArea className="h-[calc(100vh-60px)]">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <div className="space-y-6">
            {/* Category, Icon and Title */}
            <div className="flex items-start gap-4">
              {iconSrc ? (
                <Image
                  src={iconSrc}
                  alt=""
                  width={48}
                  height={48}
                  className="w-12 h-12 flex-shrink-0 object-contain invert dark:invert-0"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-lg text-muted-foreground font-medium">
                    {trend.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="space-y-2 flex-1 min-w-0">
                {cluster && (
                  <div
                    className="text-sm font-semibold uppercase tracking-wider"
                    style={{ color: clusterColor }}
                  >
                    {cluster.name}
                  </div>
                )}
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  {trend.domain}
                </div>
                <h1 className="text-3xl font-bold leading-tight">{trend.name}</h1>
              </div>
            </div>

            {trend.description && (
              <p className="text-muted-foreground leading-relaxed">{trend.description}</p>
            )}

            {trend.aliases && trend.aliases.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {trend.aliases.map((alias, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: clusterColor, color: clusterColor }}
                  >
                    {alias}
                  </Badge>
                ))}
              </div>
            )}

            {/* Metrics - 4 cards in a 2x2 grid */}
            <div className="pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Trend Horizon */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Trend Horizon</CardTitle>
                    <div className="flex items-center gap-2">
                      {hasHorizonReasoning && (
                        <button
                          onClick={() => toggleSection("horizon")}
                          className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {expandedSections.horizon ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <div className="[&_div.flex-1]:hidden">
                        <TrendHorizonTooltip
                          currentHorizon={trend.trendHorizon}
                          color={clusterColor}
                          compact={true}
                          reasoning={trend.trendHorizonReasoning}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-[2px]">
                      {[...Array(5)].map((_, i) => {
                        const horizonValue =
                          { "0-2": 5, "2-5": 4, "5-10": 3, "10-15": 2, "15+": 1 }[
                            trend.trendHorizon
                          ] || 3;
                        return (
                          <div
                            key={i}
                            className="h-2 flex-1"
                            style={{
                              backgroundColor:
                                i < horizonValue ? clusterColor : "rgba(128, 128, 128, 0.2)",
                            }}
                          />
                        );
                      })}
                    </div>
                    <p className="text-sm">
                      <span style={{ color: clusterColor }}>{trend.trendHorizon} years</span>{" "}
                      <span className="text-muted-foreground">
                        {horizonLabel.split(" ").slice(1).join(" ")}
                      </span>
                    </p>
                    {expandedSections.horizon && hasHorizonReasoning && (
                      <div className="mt-3 rounded-md bg-secondary/30 p-3">
                        <p className="text-sm text-muted-foreground">
                          {trend.trendHorizonReasoning}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Strategic Action */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Strategic Action</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: clusterColor, color: clusterColor }}
                      >
                        Act
                      </Badge>
                      <span className="text-sm text-muted-foreground">Score: 7</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Technology Readiness Level */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Technology Readiness Level</CardTitle>
                    <div className="flex items-center gap-2">
                      {hasTrlReasoning && (
                        <button
                          onClick={() => toggleSection("trl")}
                          className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {expandedSections.trl ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <div className="[&_div.flex-1]:hidden">
                        <TRLTooltip
                          currentLevel={trend.technologyReadinessLevel}
                          color={clusterColor}
                          compact={true}
                          reasoning={trend.trlReasoning}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-[2px]">
                      {[...Array(9)].map((_, i) => (
                        <div
                          key={i}
                          className="h-2 flex-1"
                          style={{
                            backgroundColor:
                              i < trend.technologyReadinessLevel
                                ? clusterColor
                                : "rgba(128, 128, 128, 0.2)",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-sm">
                      <span style={{ color: clusterColor }}>
                        Level {trend.technologyReadinessLevel}:{" "}
                        {trend.technologyReadinessLevel >= 8
                          ? "Ready for Implementation"
                          : trend.technologyReadinessLevel >= 7
                            ? "Prototype Demonstration"
                            : trend.technologyReadinessLevel >= 6
                              ? "Prototype Testing"
                              : trend.technologyReadinessLevel >= 4
                                ? "Lab Environment"
                                : "Proof-of-concept"}
                      </span>
                    </p>
                    {expandedSections.trl && hasTrlReasoning && (
                      <div className="mt-3 rounded-md bg-secondary/30 p-3">
                        <p className="text-sm text-muted-foreground">{trend.trlReasoning}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Business Readiness Level */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Business Readiness Level</CardTitle>
                    <div className="flex items-center gap-2">
                      {hasBrlReasoning && (
                        <button
                          onClick={() => toggleSection("brl")}
                          className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {expandedSections.brl ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <div className="[&_div.flex-1]:hidden">
                        <BRLTooltip
                          currentLevel={trend.businessReadinessLevel}
                          color={clusterColor}
                          compact={true}
                          reasoning={trend.brlReasoning}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex gap-[2px]">
                      {[...Array(9)].map((_, i) => (
                        <div
                          key={i}
                          className="h-2 flex-1"
                          style={{
                            backgroundColor:
                              i < trend.businessReadinessLevel
                                ? clusterColor
                                : "rgba(128, 128, 128, 0.2)",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-sm">
                      <span style={{ color: clusterColor }}>
                        Level {trend.businessReadinessLevel}:{" "}
                        {trend.businessReadinessLevel >= 8
                          ? "Market Ready"
                          : trend.businessReadinessLevel >= 7
                            ? "Initial Market Acceptance"
                            : trend.businessReadinessLevel >= 6
                              ? "Customer Validation"
                              : trend.businessReadinessLevel >= 5
                                ? "Assumptions Testing"
                                : trend.businessReadinessLevel >= 4
                                  ? "Business Case"
                                  : "Concept Validation"}
                      </span>
                    </p>
                    {expandedSections.brl && hasBrlReasoning && (
                      <div className="mt-3 rounded-md bg-secondary/30 p-3">
                        <p className="text-sm text-muted-foreground">{trend.brlReasoning}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Signals */}
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Signals</h3>
                <span className="text-sm text-muted-foreground">Total Signals: {signals.length}</span>
              </div>
              {signals.length > 0 ? (
                <div className="space-y-3">
                  {signals.map((signal) => (
                    <div
                      key={signal.id}
                      className="flex cursor-pointer items-start gap-4 rounded-lg p-3 transition-colors hover:bg-secondary/50"
                      onClick={() => {
                        if (signal.url) window.open(signal.url, "_blank", "noopener,noreferrer");
                      }}
                    >
                      {signal.date && (
                        <div
                          className="flex-shrink-0 text-sm font-medium"
                          style={{ color: clusterColor }}
                        >
                          {signal.date}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm leading-relaxed">{signal.headline}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-sm text-muted-foreground">No signals available for this trend.</p>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
