"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, X } from "lucide-react";
import Image from "next/image";
import { TRLTooltip } from "../../ui/trl-tooltip";
import { BRLTooltip } from "../../ui/brl-tooltip";
import { TrendHorizonTooltip } from "../../ui/trend-horizon-tooltip";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import type { Cluster, Trend } from "@/app/types";

interface TechnologyDetailSectionProps {
  technology: Trend;
  clusters: Cluster[];
  cluster?: Cluster;
  onNavigate: (direction: "prev" | "next") => void;
  onViewChange: (view: "technologies") => void;
}

export function TechnologyDetailSection({
  technology,
  clusters,
  cluster,
  onNavigate,
  onViewChange,
}: TechnologyDetailSectionProps) {
  const [expandedSections, setExpandedSections] = useState<{
    horizon: boolean;
    trl: boolean;
    brl: boolean;
  }>({
    horizon: false,
    trl: false,
    brl: false,
  });

  const toggleSection = (section: 'horizon' | 'trl' | 'brl') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Check if reasoning data exists
  const hasHorizonReasoning = technology.trendHorizonReasoning && technology.trendHorizonReasoning.trim().length > 0;
  const hasTrlReasoning = technology.trlReasoning && technology.trlReasoning.trim().length > 0;
  const hasBrlReasoning = technology.brlReasoning && technology.brlReasoning.trim().length > 0;

  return (
    <div className="relative p-6 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onViewChange("technologies")}
        >
          <X className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("prev")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("next")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {cluster && (
          <div className="space-y-1">
            <div 
              className="text-sm font-medium uppercase tracking-wider"
              style={{ color: cluster.colorCode }}
            >
              {cluster.name}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              {technology.domain}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold">{technology.name}</h2>
        </div>

        {technology.imageUrl && (
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <Image
              src={technology.imageUrl}
              alt={technology.name}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="pb-6 -mx-6 px-6 border-b">
          <p className="text-muted-foreground">{technology.description}</p>
          {technology.aliases && technology.aliases.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {technology.aliases.map((alias, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
                  style={{ 
                    backgroundColor: `${cluster?.colorCode}15`,
                    color: cluster?.colorCode 
                  }}
                >
                  {alias}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div 
              className={`flex items-center justify-between ${hasHorizonReasoning ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={hasHorizonReasoning ? () => toggleSection('horizon') : undefined}
            >
              <label className="text-sm font-medium">Trend Horizon</label>
              {hasHorizonReasoning && (
                expandedSections.horizon ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )
              )}
            </div>
            <div className="mt-2">
              <TrendHorizonTooltip 
                currentHorizon={technology.trendHorizon}
                color={cluster?.colorCode}
                compact
              />
            </div>
            {expandedSections.horizon && hasHorizonReasoning && (
              <div className="mt-3 p-3 bg-secondary/30 rounded-md">
                <p className="text-sm text-muted-foreground">
                  {technology.trendHorizonReasoning}
                </p>
              </div>
            )}
          </div>

          <Separator className="-mx-6 w-[calc(100%+3rem)]" />

          <div>
            <div 
              className={`flex items-center justify-between ${hasTrlReasoning ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={hasTrlReasoning ? () => toggleSection('trl') : undefined}
            >
              <label className="text-sm font-medium">Technology Readiness Level</label>
              {hasTrlReasoning && (
                expandedSections.trl ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )
              )}
            </div>
            <div className="mt-2">
              <TRLTooltip 
                currentLevel={technology.technologyReadinessLevel} 
                color={cluster?.colorCode}
                compact
              />
            </div>
            {expandedSections.trl && hasTrlReasoning && (
              <div className="mt-3 p-3 bg-secondary/30 rounded-md">
                <p className="text-sm text-muted-foreground">
                  {technology.trlReasoning}
                </p>
              </div>
            )}
          </div>

          <Separator className="-mx-6 w-[calc(100%+3rem)]" />

          <div>
            <div 
              className={`flex items-center justify-between ${hasBrlReasoning ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={hasBrlReasoning ? () => toggleSection('brl') : undefined}
            >
              <label className="text-sm font-medium">Business Readiness Level</label>
              {hasBrlReasoning && (
                expandedSections.brl ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )
              )}
            </div>
            <div className="mt-2">
              <BRLTooltip 
                currentLevel={technology.businessReadinessLevel}
                color={cluster?.colorCode}
                compact
              />
            </div>
            {expandedSections.brl && hasBrlReasoning && (
              <div className="mt-3 p-3 bg-secondary/30 rounded-md">
                <p className="text-sm text-muted-foreground">
                  {technology.brlReasoning}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}