"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export const BRL_DATA = {
  CONCEPT: [
    {
      level: 1,
      title: "Potential Business Insight",
      description: "Initial phase with undefined business idea, market impact, and competition."
    },
    {
      level: 2,
      title: "Concept Hypothesis",
      description: "Early vision and hypothesis of the business concept."
    },
    {
      level: 3,
      title: "Model Description",
      description: "Outline of a sustainable business model for long-term success."
    }
  ],
  PROTOTYPE: [
    {
      level: 4,
      title: "Preliminary Financial Validation",
      description: "Initial calculations show potential for economic viability."
    },
    {
      level: 5,
      title: "Assumptions Testing",
      description: "Testing critical assumptions of the business model."
    },
    {
      level: 6,
      title: "Customer Validation",
      description: "Business model tested and validated with customers."
    }
  ],
  BUSINESS: [
    {
      level: 7,
      title: "Initial Market Acceptance",
      description: "Initial sales confirm the business model's viability."
    },
    {
      level: 8,
      title: "Sustainable Model Proof",
      description: "Sales and metrics confirm the model's market sustainability."
    },
    {
      level: 9,
      title: "Proven Business Model",
      description: "Business model meets or exceeds profit, scalability, and impact expectations."
    }
  ]
};

interface BRLTooltipProps {
  currentLevel: number;
  color?: string;
  compact?: boolean;
  reasoning?: string;
}

export function BRLTooltip({ 
  currentLevel, 
  color = "#00ff80", 
  compact = false,
  reasoning
}: BRLTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getCurrentLevelInfo = () => {
    for (const [, levels] of Object.entries(BRL_DATA)) {
      const level = levels.find(l => l.level === currentLevel);
      if (level) return level;
    }
    return null;
  };

  const currentLevelInfo = getCurrentLevelInfo();

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <div className="flex gap-[2px]">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 ${
                i < currentLevel ? "" : "bg-primary/20"
              }`}
              style={{
                backgroundColor: i < currentLevel ? color : undefined
              }}
              role="progressbar"
              aria-valuenow={i + 1}
              aria-valuemin={1}
              aria-valuemax={9}
            />
          ))}
        </div>
        {currentLevelInfo && (
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
                  Level {currentLevel}: {currentLevelInfo.title}
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
            Business Readiness Level (BRL)
          </DialogTitle>
          <p className="text-muted-foreground mb-6">
            Inspired by the standardized metric created by KTH Innovation, the innovation arm of the Swedish Royal Institute of Technology, BRL refers to the business maturity, validating the current business model and potential.
          </p>
          <ScrollArea className="h-[400px] pr-4">
            {Object.entries(BRL_DATA).map(([category, levels]) => (
              <div key={category} className="mb-8">
                <h4 className="text-sm font-semibold mb-4" style={{ color }}>
                  {category}
                </h4>
                {levels.map((level) => (
                  <div key={level.level} className="relative pl-6 mb-6">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-border">
                      {level.level === currentLevel && (
                        <div
                          className="absolute left-[-2px] top-0 w-1 h-full"
                          style={{ backgroundColor: color }}
                        />
                      )}
                    </div>
                    <h5 className={`text-base font-semibold mb-2 ${
                      level.level === currentLevel ? "" : "text-foreground"
                    }`} style={level.level === currentLevel ? { color } : undefined}>
                      BRL {level.level}: {level.title}
                    </h5>
                    <p className={`text-sm ${
                      level.level === currentLevel ? "text-foreground" : "text-muted-foreground"
                    }`}>
                      {level.description}
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