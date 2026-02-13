"use client";

import { Button } from "@/components/ui/button";
import { Cpu, Factory, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilters } from "@/app/contexts/FilterContext";
import { DOMAINS, DOMAIN_ICONS } from "@/app/types/domains";
import type { Domain } from "@/app/types/domains";

export type FilterCategory = Lowercase<Domain>;

interface FilterToggleProps {
  className?: string;
}

const getIcon = (domain: Domain) => {
  switch (DOMAIN_ICONS[domain]) {
    case "Cpu":
      return Cpu;
    case "Factory":
      return Factory;
    case "Users":
      return Users;
    default:
      return Cpu;
  }
};

export function FilterToggle({ className }: FilterToggleProps) {
  const { selectedFilters, handleFilterToggle } = useFilters();

  return (
    <div className={cn("flex flex-col w-full", className)}>
      <div className="flex w-full">
        {DOMAINS.map((domain) => {
          const Icon = getIcon(domain);
          const value = domain.toLowerCase() as FilterCategory;
          const isSelected = selectedFilters.includes(value);
          
          return (
            <Button
              key={domain}
              variant="ghost"
              size="sm"
              onClick={() => handleFilterToggle(value)}
              className={cn(
                "flex-1 transition-colors rounded-none border-0 relative px-0",
                isSelected ? "bg-transparent text-foreground font-medium" : "text-muted-foreground/50 hover:text-muted-foreground",
              )}
            >
              <div className="flex items-center justify-center w-full">
                <Icon className="w-4 h-4 mr-2" />
                {domain}
              </div>
              <div 
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-[1px] bg-border transition-opacity",
                  isSelected ? "opacity-100" : "opacity-0"
                )}
              />
            </Button>
          );
        })}
      </div>
      <div className="h-[1px] bg-border w-full" />
    </div>
  );
}