"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { Info } from "lucide-react";
import { Navbar } from "@/app/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DomainDashboard } from "./domains/DomainDashboard";
import { DomainContentList } from "./domains/DomainContentList";
import { DomainTrendsView } from "./domains/DomainTrendsView";
import { DomainsSidepanel } from "./domains/DomainsSidepanel";
import type { BusinessDomain } from "@/app/types/businessDomains";
import type { DomainTabContent, DomainTab } from "@/app/types/domainContent";
import type { Trend } from "@/app/types/trends";
import type { Cluster } from "@/app/types/clusters";

interface DomainDetailPageProps {
  domain: BusinessDomain;
  content: DomainTabContent;
  trends?: Trend[];
  clusters?: Cluster[];
  allDomains?: BusinessDomain[];
  /** Map of record id → name for Arena filter labels (from full Domains table) */
  arenaNames?: Record<string, string>;
}

function formatKeywords(keywords: BusinessDomain["keywords"]): string {
  if (!keywords) return "";
  if (Array.isArray(keywords)) return keywords.filter(Boolean).join(", ");
  return String(keywords).trim();
}

export function DomainDetailPage({ domain, content, trends = [], clusters = [], allDomains = [], arenaNames = {} }: DomainDetailPageProps) {
  const [activeTab, setActiveTab] = useState<DomainTab>("now");

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
          {/* Domain Header */}
          <div className="mb-8">
            <div className="flex items-start gap-4 mb-4">
              {(domain.iconAi ?? domain.iconUrl) && (
                <Image
                  src={domain.iconAi ?? domain.iconUrl!}
                  alt=""
                  width={48}
                  height={48}
                  className="w-12 h-12 flex-shrink-0 object-contain"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-4xl font-bold">{domain.name}</h1>
                  {domain.status && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        domain.status.toLowerCase() === 'hot'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {domain.status}
                    </span>
                  )}
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
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DomainTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="now">Now</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
                <TabsTrigger value="next">Next</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

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
        </div>
      </div>
    </div>
  );
}
