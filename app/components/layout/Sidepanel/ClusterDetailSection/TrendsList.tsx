"use client";

import type { Cluster, Trend } from "@/app/types";
import type { NodePositioning } from "@/app/types";
import { getReadinessLevel } from "../utils";

interface TrendsListProps {
  cluster: Cluster;
  trends: Trend[];
  nodePositioning: NodePositioning;
  onTrendSelect: (tech: Trend) => void;
}

export function TrendsList({ cluster, trends, nodePositioning, onTrendSelect }: TrendsListProps) {
  const sortedTrends = [...trends].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: cluster.colorCode }}>
          Trends
        </h3>
        <div className="text-sm text-muted-foreground">
          {trends.length} {trends.length === 1 ? 'trend' : 'trends'}
        </div>
      </div>
      <div className="-mx-6">
        {sortedTrends.map((trend, index) => (
          <div
            key={trend.id}
            className="group relative py-3 hover:bg-secondary/50 cursor-pointer"
            onClick={() => onTrendSelect(trend)}
          >
            <div className="flex items-center justify-between px-6">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  className="text-sm w-8 tabular-nums flex-shrink-0"
                  style={{ color: cluster.colorCode }}
                >
                  {(index + 1).toString().padStart(2, "0")}
                </span>
                <h4 className="font-medium truncate">{trend.name}</h4>
              </div>
              <div className="text-sm text-muted-foreground flex-shrink-0 ml-2">
                {getReadinessLevel(trend, nodePositioning)}
              </div>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: cluster.colorCode }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}