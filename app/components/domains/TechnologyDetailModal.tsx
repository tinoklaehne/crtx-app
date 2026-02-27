"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { HelpCircle } from "lucide-react";
import { TRLTooltip } from "@/app/components/ui/trl-tooltip";
import { BRLTooltip } from "@/app/components/ui/brl-tooltip";
import { TrendHorizonTooltip } from "@/app/components/ui/trend-horizon-tooltip";
import type { Trend, Cluster } from "@/app/types";

interface TechnologyDetailModalProps {
  technology: Trend | null;
  cluster?: Cluster;
  clusters: Cluster[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (direction: "prev" | "next") => void;
  signals?: Array<{
    id: string;
    headline: string;
    date?: string;
    url?: string;
  }>;
}

export function TechnologyDetailModal({
  technology,
  cluster,
  clusters,
  isOpen,
  onClose,
  onNavigate,
  signals = [],
}: TechnologyDetailModalProps) {
  const [expandedSections, setExpandedSections] = useState<{
    horizon: boolean;
    trl: boolean;
    brl: boolean;
  }>({
    horizon: false,
    trl: false,
    brl: false,
  });

  if (!technology) return null;

  const toggleSection = (section: 'horizon' | 'trl' | 'brl') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const clusterColor = cluster?.colorCode || "#00ff80";
  
  // Check if reasoning data exists
  const hasHorizonReasoning = technology.trendHorizonReasoning && technology.trendHorizonReasoning.trim().length > 0;
  const hasTrlReasoning = technology.trlReasoning && technology.trlReasoning.trim().length > 0;
  const hasBrlReasoning = technology.brlReasoning && technology.brlReasoning.trim().length > 0;
  
  // Get horizon label
  const horizonLabels: Record<string, string> = {
    "0-2": "0-2 years Immediate Impact",
    "2-5": "2-5 years Short-term Evolution",
    "5-10": "5-10 years Medium-term Development",
    "10-15": "10-15 years Extended Timeline",
    "15+": "15+ years Future Vision",
  };

  const horizonLabel = horizonLabels[technology.trendHorizon] || `${technology.trendHorizon} years`;

  // Calculate progress percentages
  const trlProgress = (technology.technologyReadinessLevel / 9) * 100;
  const brlProgress = (technology.businessReadinessLevel / 9) * 100;
  
  // Trend Horizon progress (inverse - closer horizons = higher progress)
  const horizonProgressMap: Record<string, number> = {
    "0-2": 100,
    "2-5": 80,
    "5-10": 60,
    "10-15": 40,
    "15+": 20,
  };
  const horizonProgress = horizonProgressMap[technology.trendHorizon] || 50;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-background/95 backdrop-blur-sm border-2 [&>button]:hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{technology.name}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              {onNavigate && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onNavigate("prev")}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onNavigate("next")}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            {/* Single close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 px-6 py-6">
            <div className="space-y-6">
              {/* Category and Title */}
              <div className="space-y-2">
                {cluster && (
                  <div
                    className="text-sm font-semibold uppercase tracking-wider"
                    style={{ color: clusterColor }}
                  >
                    {cluster.name}
                  </div>
                )}
                <div className="text-xs text-muted-foreground uppercase tracking-wider">
                  {technology.domain}
                </div>
                <h2 className="text-3xl font-bold leading-tight">
                  {technology.name}
                </h2>
              </div>

              {/* Description */}
              {technology.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {technology.description}
                </p>
              )}

              {/* Tags/Aliases */}
              {technology.aliases && technology.aliases.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {technology.aliases.map((alias, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: clusterColor,
                        color: clusterColor,
                      }}
                    >
                      {alias}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Metrics Section - Two Column Layout */}
              <div className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-0">
                    {/* Trend Horizon */}
                    <div className="space-y-2 pb-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Trend Horizon</label>
                        <div className="flex items-center gap-2">
                          {hasHorizonReasoning && (
                            <button
                              onClick={() => toggleSection('horizon')}
                              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
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
                              currentHorizon={technology.trendHorizon}
                              color={clusterColor}
                              compact={true}
                              reasoning={technology.trendHorizonReasoning}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {/* Segmented progress bar for Trend Horizon (5 segments) */}
                        <div className="flex gap-[2px]">
                          {[...Array(5)].map((_, i) => {
                            const horizonValue = {
                              "0-2": 5,
                              "2-5": 4,
                              "5-10": 3,
                              "10-15": 2,
                              "15+": 1
                            }[technology.trendHorizon] || 3;
                            return (
                              <div
                                key={i}
                                className="h-2 flex-1"
                                style={{
                                  backgroundColor: i < horizonValue ? clusterColor : 'rgba(128, 128, 128, 0.2)',
                                }}
                              />
                            );
                          })}
                        </div>
                        <p className="text-sm">
                          <span style={{ color: clusterColor }}>{technology.trendHorizon} years</span>
                          {" "}
                          <span className="text-muted-foreground">
                            {horizonLabel.split(' ').slice(1).join(' ')}
                          </span>
                        </p>
                      </div>
                      {expandedSections.horizon && hasHorizonReasoning && (
                        <div className="mt-3 p-3 bg-secondary/30 rounded-md">
                          <p className="text-sm text-muted-foreground">
                            {technology.trendHorizonReasoning}
                          </p>
                        </div>
                      )}
                    </div>

                    <Separator className="my-4" />

                    {/* Technology Readiness Level */}
                    <div className="space-y-2 pb-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Technology Readiness Level</label>
                        <div className="flex items-center gap-2">
                          {hasTrlReasoning && (
                            <button
                              onClick={() => toggleSection('trl')}
                              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
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
                              currentLevel={technology.technologyReadinessLevel}
                              color={clusterColor}
                              compact={true}
                              reasoning={technology.trlReasoning}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {/* Segmented progress bar for TRL (9 segments) */}
                        <div className="flex gap-[2px]">
                          {[...Array(9)].map((_, i) => (
                            <div
                              key={i}
                              className="h-2 flex-1"
                              style={{
                                backgroundColor: i < technology.technologyReadinessLevel ? clusterColor : 'rgba(128, 128, 128, 0.2)',
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-sm">
                          <span style={{ color: clusterColor }}>
                            Level {technology.technologyReadinessLevel}: {
                              technology.technologyReadinessLevel >= 8 
                                ? "Ready for Implementation"
                                : technology.technologyReadinessLevel >= 7
                                ? "Prototype Demonstration"
                                : technology.technologyReadinessLevel >= 6
                                ? "Prototype Testing"
                                : technology.technologyReadinessLevel >= 4
                                ? "Lab Environment"
                                : "Proof-of-concept"
                            }
                          </span>
                        </p>
                      </div>
                      {expandedSections.trl && hasTrlReasoning && (
                        <div className="mt-3 p-3 bg-secondary/30 rounded-md">
                          <p className="text-sm text-muted-foreground">
                            {technology.trlReasoning}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-0">
                    {/* Strategic Action */}
                    <div className="space-y-2 pb-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Strategic Action</label>
                        <div className="flex items-center gap-2">
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: clusterColor,
                            color: clusterColor,
                          }}
                        >
                          Act
                        </Badge>
                        <span className="text-sm text-muted-foreground">Score: 7</span>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Business Readiness Level */}
                    <div className="space-y-2 pb-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Business Readiness Level</label>
                        <div className="flex items-center gap-2">
                          {hasBrlReasoning && (
                            <button
                              onClick={() => toggleSection('brl')}
                              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
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
                              currentLevel={technology.businessReadinessLevel}
                              color={clusterColor}
                              compact={true}
                              reasoning={technology.brlReasoning}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {/* Segmented progress bar for BRL (9 segments) */}
                        <div className="flex gap-[2px]">
                          {[...Array(9)].map((_, i) => (
                            <div
                              key={i}
                              className="h-2 flex-1"
                              style={{
                                backgroundColor: i < technology.businessReadinessLevel ? clusterColor : 'rgba(128, 128, 128, 0.2)',
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-sm">
                          <span style={{ color: clusterColor }}>
                            Level {technology.businessReadinessLevel}: {
                              technology.businessReadinessLevel >= 8 
                                ? "Market Ready"
                                : technology.businessReadinessLevel >= 7
                                ? "Initial Market Acceptance"
                                : technology.businessReadinessLevel >= 6
                                ? "Customer Validation"
                                : technology.businessReadinessLevel >= 5
                                ? "Assumptions Testing"
                                : technology.businessReadinessLevel >= 4
                                ? "Business Case"
                                : "Concept Validation"
                            }
                          </span>
                        </p>
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

              {/* Signals Section */}
              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Signals</h3>
                  <span className="text-sm text-muted-foreground">
                    Total Signals: {signals.length}
                  </span>
                </div>
                {signals.length > 0 ? (
                  <div className="space-y-3">
                    {signals.map((signal) => (
                      <div
                        key={signal.id}
                        className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (signal.url) {
                            window.open(signal.url, '_blank', 'noopener,noreferrer');
                          }
                        }}
                      >
                        {signal.date && (
                          <div
                            className="text-sm font-medium flex-shrink-0"
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
                  <p className="text-sm text-muted-foreground py-4">
                    No signals available for this trend.
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
