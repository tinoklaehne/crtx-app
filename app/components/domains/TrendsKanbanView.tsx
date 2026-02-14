"use client";

import type { Trend } from "@/app/types/trends";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

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
  // Group trends by horizon
  const trendsByHorizon = trends.reduce((acc, trend) => {
    const horizon = trend.trendHorizon || "2-5";
    if (!acc[horizon]) {
      acc[horizon] = [];
    }
    acc[horizon].push(trend);
    return acc;
  }, {} as Record<Trend['trendHorizon'], Trend[]>);

  return (
    <div className="p-6 pt-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {HORIZONS.map((horizon) => {
          const horizonTrends = trendsByHorizon[horizon.value] || [];
          
          return (
            <div key={horizon.value} className="flex flex-col">
              <div className="mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  TREND HORIZON
                </h3>
                <h4 className="text-lg font-bold">{horizon.label}</h4>
              </div>
              <div className="flex-1 space-y-4">
                {horizonTrends.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4">
                    No trends
                  </div>
                ) : (
                  horizonTrends.map((trend) => (
                    <Card
                      key={trend.id}
                      className="hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => onTrendSelect?.(trend)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <Badge variant="outline" className="text-xs font-semibold uppercase">
                              {trend.domain}
                            </Badge>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                          </div>
                          <h4 className="font-semibold text-sm leading-tight">
                            {trend.name}
                          </h4>
                          <div className="text-xs text-muted-foreground">
                            TRL: {trend.technologyReadinessLevel}
                          </div>
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
  );
}
