"use client";

import React, { useState } from "react";
import type { Trend } from "@/app/types/trends";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Domain } from "@/app/types/domains";
import { DOMAIN_ORDER } from "@/app/components/layout/Sidepanel/utils";

interface TrendsKanbanViewProps {
  trends: Trend[];
  onTrendSelect?: (trend: Trend) => void;
}

const HORIZONS: Array<{ value: Trend['trendHorizon']; label: string }> = [
  { value: "0-2", label: "0-2 years" },
  { value: "2-5", label: "2-5 years" },
  { value: "5-10", label: "5-10 years" },
  { value: "10-15", label: "10-15 years" },
  { value: "15+", label: "15+ years" },
];

export function TrendsKanbanView({ trends, onTrendSelect }: TrendsKanbanViewProps) {
  const [selectedDomain, setSelectedDomain] = useState<Domain | "all">("all");

  // Group trends by horizon with optional domain filter
  const trendsByHorizon = trends.reduce((acc, trend) => {
    if (selectedDomain !== "all" && trend.domain !== selectedDomain) {
      return acc;
    }
    const horizon = trend.trendHorizon || "2-5";
    if (!acc[horizon]) {
      acc[horizon] = [];
    }
    acc[horizon].push(trend);
    return acc;
  }, {} as Record<Trend['trendHorizon'], Trend[]>);

  return (
    <div className="h-full px-6 pt-4 pb-6">
      <div className="sticky top-4 z-0 flex justify-end mb-3">
        <Select
          value={selectedDomain}
          onValueChange={(value) => setSelectedDomain(value as Domain | "all")}
        >
          <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur">
            <SelectValue placeholder="All domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All domains</SelectItem>
            {DOMAIN_ORDER.map((domain) => (
              <SelectItem key={domain} value={domain}>
                {domain}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {HORIZONS.map((horizon) => {
          const horizonTrends = trendsByHorizon[horizon.value] || [];
          
          return (
            <div key={horizon.value} className="flex flex-col">
              <div className="mb-3">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Trend horizon
                </h3>
                <h4 className="text-sm font-medium text-foreground">
                  {horizon.label}
                </h4>
              </div>
              <div className="flex-1 space-y-3">
                {horizonTrends.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-2">
                    No trends
                  </div>
                ) : (
                  horizonTrends.map((trend) => (
                    <Card
                      key={trend.id}
                      className="hover:shadow-md transition-shadow cursor-pointer group border-border/60 bg-card/80"
                      onClick={() => onTrendSelect?.(trend)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full tracking-wide"
                          >
                            {trend.domain}
                          </Badge>
                          <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                        </div>
                        <h4 className="font-medium text-sm leading-snug line-clamp-3">
                          {trend.name}
                        </h4>
                        <div className="text-[11px] text-muted-foreground">
                          TRL {trend.technologyReadinessLevel}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
