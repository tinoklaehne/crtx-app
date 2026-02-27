"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "./Logo";
import { NavItem } from "./NavItem";
import { Radar, Grid3x3, Users, BookOpen, User as UserIcon, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserProfileModal } from "@/app/components/user/UserProfileModal";
import type { User } from "@/app/types/users";

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
  const [user, setUser] = useState<User | null>(null);
  
  // Light "heartbeat" to update Last Login based on existing session.
  // Throttled via sessionStorage to at most once per browser session / 24h window.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const STORAGE_KEY = "crtx-last-login-ping";
    const lastPing = window.sessionStorage.getItem(STORAGE_KEY);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (lastPing) {
      const last = Number(lastPing);
      if (!Number.isNaN(last) && now - last < oneDayMs) {
        return;
      }
    }

    // Fire and forget; ignore failures and 401s (not logged in).
    fetch("/api/auth/ping", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch(() => {
      // Nothing to do – this is best-effort logging.
    });

    window.sessionStorage.setItem(STORAGE_KEY, String(now));
  }, []);

  // Load user profile once to determine app access rights.
  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      try {
        const res = await fetch("/api/user/profile", { credentials: "include" });
        const contentType = res.headers.get("content-type") ?? "";
        let data: any = null;
        if (contentType.includes("application/json")) {
          data = await res.json().catch(() => null);
        }
        if (!cancelled && res.ok && data && data.user) {
          setUser(data.user as User);
        }
      } catch {
        // If profile fails, we leave user as null and show all apps.
      }
    }
    loadUser();
    return () => {
      cancelled = true;
    };
  }, []);
  
  const activeMiniApp =
    pathname?.startsWith("/domains")
      ? "domains"
      : pathname?.startsWith("/directory")
        ? "directory"
        : pathname?.startsWith("/library")
          ? "library"
          : pathname?.startsWith("/trends")
            ? "trends"
            : pathname === "/radars" || pathname === "/radars/"
              ? "radars"
              : null;

  const canSeeDomains = !user || user.domainsAccess;
  const canSeeTrends = !user || user.trendsAccess;
  const canSeeRadars = !user || user.radarsAccess;
  const canSeeDirectory = !user || user.directoryAccess;
  const canSeeLibrary = !user || user.libraryAccess;

  return (
    <>
      <nav className="w-20 h-screen bg-background border-r flex flex-col">
        <Logo />
        
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          {canSeeDomains && (
            <NavItem
              icon={Grid3x3}
              isActive={activeMiniApp === "domains"}
              onClick={() => router.push("/domains")}
              label="Domains"
            />
          )}
          {canSeeTrends && (
            <NavItem
              icon={TrendingUp}
              isActive={activeMiniApp === "trends"}
              onClick={() => router.push("/trends")}
              label="Trends"
            />
          )}
          {canSeeRadars && (
            <NavItem
              icon={Radar}
              isActive={activeMiniApp === "radars"}
              onClick={() => router.push("/radars")}
              label="Trend Radars"
            />
          )}
          {canSeeDirectory && (
            <NavItem
              icon={Users}
              isActive={activeMiniApp === "directory"}
              onClick={() => router.push("/directory")}
              label="Directory"
            />
          )}
          {canSeeLibrary && (
            <NavItem
              icon={BookOpen}
              isActive={activeMiniApp === "library"}
              onClick={() => router.push("/library")}
              label="Library"
            />
          )}
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
