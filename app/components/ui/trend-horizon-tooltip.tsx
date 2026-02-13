"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TrendHorizon } from "@/app/types";

export const HORIZON_DATA = {
  NEAR_TERM: [
    {
      horizon: "0-2",
      title: "Immediate Impact",
      description: "Technologies that are already being implemented or will be within the next 2 years. These have clear use cases and are ready for adoption."
    },
    {
      horizon: "2-5",
      title: "Short-term Evolution",
      description: "Technologies that are in advanced development and will likely see significant adoption within 2-5 years. Business cases are clear but implementation may need refinement."
    }
  ],
  MID_TERM: [
    {
      horizon: "5-10",
      title: "Medium-term Development",
      description: "Technologies that show promise but require further development or market maturity. Expected to become relevant within 5-10 years."
    },
    {
      horizon: "10-15",
      title: "Extended Timeline",
      description: "Technologies that are still in early stages but show significant potential. Major impact expected within 10-15 years as technical and market barriers are overcome."
    }
  ],
  LONG_TERM: [
    {
      horizon: "15+",
      title: "Future Vision",
      description: "Emerging technologies with transformative potential but requiring significant development. Timeline extends beyond 15 years with high uncertainty but high potential impact."
    }
  ]
};

interface TrendHorizonTooltipProps {
  currentHorizon: TrendHorizon;
  color?: string;
  compact?: boolean;
  reasoning?: string;
}

export function TrendHorizonTooltip({ 
  currentHorizon, 
  color = "#00ff80", 
  compact = false,
  reasoning
}: TrendHorizonTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getCurrentHorizonInfo = () => {
    for (const [, horizons] of Object.entries(HORIZON_DATA)) {
      const horizon = horizons.find(h => h.horizon === currentHorizon);
      if (horizon) return horizon;
    }
    return null;
  };

  const currentHorizonInfo = getCurrentHorizonInfo();
  const horizonValue = {
    "0-2": 5,
    "2-5": 4,
    "5-10": 3,
    "10-15": 2,
    "15+": 1
  }[currentHorizon] || 3;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <div className="flex gap-[2px]">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 ${
                i < horizonValue ? "" : "bg-primary/20"
              }`}
              style={{
                backgroundColor: i < horizonValue ? color : undefined
              }}
              role="progressbar"
              aria-valuenow={i + 1}
              aria-valuemin={1}
              aria-valuemax={5}
            />
          ))}
        </div>
        {currentHorizonInfo && (
          <div className="mt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "w-full text-left flex items-center justify-between",
                reasoning && "cursor-pointer hover:opacity-80"
              )}
              disabled={!reasoning}
            >
              <div>
                <span className="text-sm font-medium" style={{ color }}>
                  {currentHorizonInfo.horizon} years
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  {currentHorizonInfo.title}
                </span>
              </div>
              {reasoning && (
                <div className="flex items-center">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              )}
            </button>
            {isExpanded && reasoning && (
              <div className="mt-2 text-sm text-muted-foreground">
                {reasoning}
              </div>
            )}
          </div>
        )}
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="flex-shrink-0"
        onClick={() => setIsOpen(true)}
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogTitle className="text-xl mb-4" style={{ color }}>
            Trend Horizon
          </DialogTitle>
          <p className="text-muted-foreground mb-6">
            The Trend Horizon indicates the expected timeline for significant market impact and widespread adoption of a technology or trend. This helps organizations plan their innovation and investment strategies across different time horizons.
          </p>
          <ScrollArea className="h-[400px] pr-4">
            {Object.entries(HORIZON_DATA).map(([category, horizons]) => (
              <div key={category} className="mb-8">
                <h4 className="text-sm font-semibold mb-4" style={{ color }}>
                  {category.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
                </h4>
                {horizons.map((horizon) => (
                  <div key={horizon.horizon} className="relative pl-6 mb-6">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-border">
                      {horizon.horizon === currentHorizon && (
                        <div
                          className="absolute left-[-2px] top-0 w-1 h-full"
                          style={{ backgroundColor: color }}
                        />
                      )}
                    </div>
                    <h5 className={`text-base font-semibold mb-2 ${
                      horizon.horizon === currentHorizon ? "" : "text-foreground"
                    }`} style={horizon.horizon === currentHorizon ? { color } : undefined}>
                      {horizon.horizon} years: {horizon.title}
                    </h5>
                    <p className={`text-sm ${
                      horizon.horizon === currentHorizon ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {horizon.description}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}