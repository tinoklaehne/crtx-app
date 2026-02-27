"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { Info, Target } from "lucide-react";
import { Navbar } from "@/app/components/layout/Navbar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DomainDashboard } from "./domains/DomainDashboard";
import { DomainContentList } from "./domains/DomainContentList";
import { DomainTrendsView } from "./domains/DomainTrendsView";
import { DomainReportsSection } from "./domains/DomainReportsSection";
import { DomainStrategyView } from "./domains/DomainStrategyView";
import { DomainsSidepanel } from "./domains/DomainsSidepanel";
import { Switch } from "@/components/ui/switch";
import type { BusinessDomain } from "@/app/types/businessDomains";
import type { DomainTabContent, DomainTab } from "@/app/types/domainContent";
import type { DomainStrategyData } from "@/app/types/strategy";
import type { Trend } from "@/app/types/trends";
import type { Cluster } from "@/app/types/clusters";
import type { Report } from "@/app/types/reports";

interface DomainDetailPageProps {
  domain: BusinessDomain;
  content: DomainTabContent;
  trends?: Trend[];
  clusters?: Cluster[];
  allDomains?: BusinessDomain[];
  /** Map of record id → name for Arena filter labels (from full Domains table) */
  arenaNames?: Record<string, string>;
  /** Reports linked to this domain */
  reports?: Report[];
  /** Strategy data (themes, questions, problems) for the Strategy tab */
  strategy?: DomainStrategyData;
}

function formatKeywords(keywords: BusinessDomain["keywords"]): string {
  if (!keywords) return "";
  if (Array.isArray(keywords)) return keywords.filter(Boolean).join(", ");
  return String(keywords).trim();
}

export function DomainDetailPage({ domain, content, trends = [], clusters = [], allDomains = [], arenaNames = {}, reports = [], strategy = { themes: [], questions: [], problems: [] } }: DomainDetailPageProps) {
  const [activeTab, setActiveTab] = useState<DomainTab>("now");
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const hasStrategicThemes = (strategy?.themes?.length ?? 0) > 0;

  useEffect(() => {
    let cancelled = false;
    async function loadSubscribed() {
      try {
        const res = await fetch("/api/user/subscribed-domains");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          const domainIds: string[] = data.domainIds ?? [];
          setIsSubscribed(domainIds.includes(domain.id));
        }
      } catch (error) {
        console.error("Failed to load subscribed domains", error);
      }
    }
    loadSubscribed();
    return () => {
      cancelled = true;
    };
  }, [domain.id]);

  async function handleSubscriptionToggle(checked: boolean) {
    if (subscribing) return;
    setSubscribing(true);
    const previous = isSubscribed;
    setIsSubscribed(checked);
    try {
      const res = await fetch("/api/user/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domainId: domain.id, subscribe: checked }),
      });
      if (!res.ok) {
        throw new Error("Failed to update subscription");
      }
      const data = await res.json();
      const domainIds: string[] = data.domainIds ?? [];
      setIsSubscribed(domainIds.includes(domain.id));
    } catch (error) {
      console.error(error);
      setIsSubscribed(previous ?? false);
    } finally {
      setSubscribing(false);
    }
  }

  const getActiveTabItems = () => {
    switch (activeTab) {
      case "now":
        return content.now;
      case "new":
        return content.new;
      case "next":
        return content.next;
      default:
        return content.now;
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Navbar />
      {/* Show DomainsSidepanel for all tabs */}
      {allDomains.length > 0 && (
        <Suspense fallback={<div className="w-64 border-r bg-card" />}>
          <DomainsSidepanel domains={allDomains} currentDomainId={domain.id} arenaNames={arenaNames} />
        </Suspense>
      )}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          {/* Sticky Header and Tabs */}
          <div className="sticky top-[-24px] z-50 bg-background pb-6 -mx-6 px-6 pt-[48px] border-b border-border/40 mb-8 shadow-sm">
            {/* Domain Header */}
            <div className="mb-6">
              <div className="flex items-start gap-4 mb-4">
                {(domain.iconAi ?? domain.iconUrl) && (
                  <Image
                    src={domain.iconAi ?? domain.iconUrl!}
                    alt=""
                    width={48}
                    height={48}
                    className="w-12 h-12 flex-shrink-0 object-contain invert dark:invert-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-4xl font-bold">{domain.name}</h1>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex cursor-help text-muted-foreground hover:text-foreground">
                              <Info className="h-5 w-5" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="max-w-sm p-4 space-y-2 text-left">
                            {domain.description && (
                              <div>
                                <div className="font-semibold text-foreground mb-1">Description</div>
                                <p className="text-sm text-muted-foreground">{domain.description}</p>
                              </div>
                            )}
                            {formatKeywords(domain.keywords) && (
                              <div>
                                <div className="font-semibold text-foreground mb-1">Keywords</div>
                                <p className="text-sm text-muted-foreground">{formatKeywords(domain.keywords)}</p>
                              </div>
                            )}
                            {!domain.description && !formatKeywords(domain.keywords) && (
                              <p className="text-sm text-muted-foreground">No description or keywords.</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium text-muted-foreground">Subscribed</span>
                      <Switch
                        checked={!!isSubscribed}
                        disabled={isSubscribed === null || subscribing}
                        onCheckedChange={handleSubscriptionToggle}
                        aria-label="Subscribe to domain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DomainTab)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="now">Now</TabsTrigger>
                  <TabsTrigger value="new">New</TabsTrigger>
                  <TabsTrigger value="next">Next</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Strategy section - only on Now tab and only if domain has strategic themes; above dashboard */}
          {activeTab === "now" && hasStrategicThemes && (
            <div className="mb-8 rounded-lg border-2 border-dashed border-border bg-muted/40 dark:bg-muted/20 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Strategic themes</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Themes, questions and problems linked to this domain
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setStrategyModalOpen(true)}
                  className="shrink-0"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Open Strategy
                </Button>
              </div>
              <Dialog open={strategyModalOpen} onOpenChange={setStrategyModalOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg border border-border p-6">
                  <DialogHeader className="pb-4 border-b border-border space-y-1">
                    <DialogDescription className="text-sm font-medium text-muted-foreground">
                      Strategic Themes
                    </DialogDescription>
                    <DialogTitle className="text-2xl font-semibold leading-tight tracking-tight">
                      {domain.name}
                    </DialogTitle>
                  </DialogHeader>
                  <DomainStrategyView strategy={strategy} />
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Dashboard - Only show for Now tab */}
          {activeTab === "now" && (
            <div className="mb-8">
              <DomainDashboard items={getActiveTabItems()} />
            </div>
          )}

          {/* Content based on active tab */}
          {activeTab === "now" && (
            <DomainContentList items={getActiveTabItems()} />
          )}
          
          {activeTab === "new" && trends.length > 0 && (
            <DomainTrendsView trends={trends} clusters={clusters} />
          )}
          
          {activeTab === "new" && trends.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No trends available for this domain.</p>
            </div>
          )}
          
          {activeTab === "next" && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Next section coming soon.</p>
            </div>
          )}

          {/* Reports Section - only on Now tab */}
          {activeTab === "now" && (
            <DomainReportsSection reports={reports} domainNames={arenaNames} />
          )}
        </div>
      </div>
    </div>
  );
}
