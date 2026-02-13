"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export const TRL_DATA = {
  CONCEPT: [
    {
      level: 1,
      title: "Initial Scientific Research",
      description: "Initial scientific observations are rendered into research and development."
    },
    {
      level: 2,
      title: "Technology Concept",
      description: "Research is scrutinized and correlations to practical applications are applied to initial scientific observations. No experimental proof of concept is available yet."
    },
    {
      level: 3,
      title: "Proof-of-concept",
      description: "Research is considered viable and ready for further development after experimental analysis of the technology concept."
    }
  ],
  PROTOTYPE: [
    {
      level: 4,
      title: "Lab Environment",
      description: "Experimental analyses are no longer required as multiple component pieces are tested and validated altogether in a lab environment."
    },
    {
      level: 5,
      title: "Field Validation",
      description: "Validation is conducted in relevant environments, where simulations are carried out as close to realistic circumstances."
    },
    {
      level: 6,
      title: "Prototype Testing",
      description: "Prototype is fully functional and ready for testing in industrially relevant environment."
    }
  ],
  PRODUCT: [
    {
      level: 7,
      title: "Prototype Demonstration",
      description: "Prototype is fully demonstrated in operational environment."
    },
    {
      level: 8,
      title: "Ready for Implementation",
      description: "Technology is developed and qualified. It is readily available for implementation but the market is not entirely familiar with the technology."
    },
    {
      level: 9,
      title: "Fully Operative",
      description: "Technology is operative and demonstrates considerable market competition among manufacturing industries."
    }
  ]
};

interface TRLTooltipProps {
  currentLevel: number;
  color?: string;
  compact?: boolean;
  reasoning?: string;
}

export function TRLTooltip({ 
  currentLevel, 
  color = "#00ff80", 
  compact = false,
  reasoning
}: TRLTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getCurrentLevelInfo = () => {
    for (const [, levels] of Object.entries(TRL_DATA)) {
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
            Technology Readiness Level (TRL)
          </DialogTitle>
          <p className="text-muted-foreground mb-6">
            A measurement system developed by NASA, Technology Readiness Level (TRL) ranges from 1 to 9 to describe the maturity level of a particular technology.
          </p>
          <ScrollArea className="h-[400px] pr-4">
            {Object.entries(TRL_DATA).map(([category, levels]) => (
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
                      TRL {level.level}: {level.title}
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