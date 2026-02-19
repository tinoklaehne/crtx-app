"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import { NavItem } from "./NavItem";
import { Radar, Grid3x3, Users, BookOpen, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfileModal } from "@/app/components/user/UserProfileModal";

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
  const [profileOpen, setProfileOpen] = useState(false);
  
  const activeMiniApp =
    pathname?.startsWith("/domains")
      ? "domains"
      : pathname?.startsWith("/directory")
        ? "directory"
        : pathname?.startsWith("/library")
          ? "library"
          : pathname === "/radars" || pathname === "/radars/"
            ? "radars"
            : null;

  return (
    <>
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
        <NavItem
          icon={Users}
          isActive={activeMiniApp === 'directory'}
          onClick={() => router.push('/directory')}
          label="Directory"
        />
        <NavItem
          icon={BookOpen}
          isActive={activeMiniApp === 'library'}
          onClick={() => router.push('/library')}
          label="Library"
        />
        </div>
        
        <div className="flex flex-col items-center gap-2 py-6">
          <Button
            variant="ghost"
            className="w-12 h-12 flex items-center justify-center text-muted-foreground hover:text-foreground"
            aria-label="User profile"
            onClick={() => setProfileOpen(true)}
          >
            <UserIcon className="h-5 w-5" />
          </Button>
          <ThemeToggle />
        </div>
      </nav>
      <UserProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
