"use client";

import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import { NavItem } from "./NavItem";

interface NavbarProps {
  activeView: string;
  onViewChange: (view: "home" | "clusters" | "technologies" | "detail" | "cluster-detail") => void;
  radarName?: string;
}

export function Navbar({ 
  activeView, 
  onViewChange,
  radarName,
}: NavbarProps) {
  return (
    <nav className="w-20 h-screen bg-background border-r flex flex-col">
      <Logo />
      <div className="flex-1" />
      <div className="flex flex-col items-center gap-2 py-6">
        <ThemeToggle />
      </div>
    </nav>
  );
}