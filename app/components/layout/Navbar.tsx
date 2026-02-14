"use client";

import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import { NavItem } from "./NavItem";
import { Radar, Grid3x3 } from "lucide-react";

interface NavbarProps {
  activeView?: string;
  onViewChange?: (view: "home" | "clusters" | "technologies" | "detail" | "cluster-detail") => void;
  radarName?: string;
}

export function Navbar({ 
  activeView, 
  onViewChange,
  radarName,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Only highlight Radar nav on the radars list page, not on individual radar detail (/recXXX)
  const activeMiniApp =
    pathname?.startsWith("/domains")
      ? "domains"
      : pathname === "/radars" || pathname === "/radars/"
        ? "radars"
        : null;

  return (
    <nav className="w-20 h-screen bg-background border-r flex flex-col">
      <Logo />
      
      {/* Mini App Icons - Centered */}
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <NavItem
          icon={Grid3x3}
          isActive={activeMiniApp === 'domains'}
          onClick={() => router.push('/domains')}
          label="Domains"
        />
        <NavItem
          icon={Radar}
          isActive={activeMiniApp === 'radars'}
          onClick={() => router.push('/radars')}
          label="Trend Radars"
        />
        {/* More mini app icons will be added here */}
      </div>
      
      <div className="flex flex-col items-center gap-2 py-6">
        <ThemeToggle />
      </div>
    </nav>
  );
}
