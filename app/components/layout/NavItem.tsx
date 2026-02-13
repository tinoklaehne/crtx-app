"use client";

import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
  label: string;
}

export function NavItem({ icon: Icon, isActive, onClick, label }: NavItemProps) {
  return (
    <Button
      onClick={onClick}
      variant="ghost"
      className={`w-12 h-12 flex items-center justify-center transition-colors ${
        isActive 
          ? "bg-black dark:bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-transparent"
      }`}
      aria-label={label}
    >
      <Icon className="h-5 w-5" />
    </Button>
  );
}