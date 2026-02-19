"use client";

import { useState } from "react";
import Image from "next/image";
import { Info, Database, DollarSign, FileText, Sparkles, Leaf } from "lucide-react";
import type { Actor } from "@/app/types/actors";
import type { DomainContentItem } from "@/app/types/domainContent";
import { MarkdownContent } from "@/app/components/ui/markdown-content";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainContentList } from "@/app/components/domains/DomainContentList";
import { ActorDashboard } from "@/app/components/actors/ActorDashboard";

type ActorTab = "general" | "esg" | "financial" | "social" | "patent" | "datasets";

interface ActorDetailPageProps {
  actor: Actor;
  actions?: DomainContentItem[];
  domainNames?: Record<string, string>;
}

function formatList(value: string | string[] | undefined): string {
  if (!value) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return String(value);
}

export function ActorDetailPage({ actor, actions = [], domainNames = {} }: ActorDetailPageProps) {
  const [activeTab, setActiveTab] = useState<ActorTab>("general");

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          {actor.logo && (
            <Image
              src={actor.logo}
              alt={actor.name}
              width={48}
              height={48}
              className="w-12 h-12 object-contain flex-shrink-0"
            />
          )}
          <h1 className="text-2xl font-semibold">{actor.name}</h1>
        </div>

        {/* Tabs Container */}
        <div className="border rounded-lg bg-card">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActorTab)} className="w-full">
            <TabsList className="w-full justify-start rounded-t-lg rounded-b-none border-b bg-muted/50 h-auto p-0">
              <TabsTrigger value="general" className="gap-2">
                <Info className="h-4 w-4" />
                General Info
              </TabsTrigger>
              <TabsTrigger value="esg" className="gap-2">
                <Leaf className="h-4 w-4" />
                ESG
              </TabsTrigger>
              <TabsTrigger value="financial" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Financial
              </TabsTrigger>
              <TabsTrigger value="social" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Social
              </TabsTrigger>
              <TabsTrigger value="patent" className="gap-2">
                <FileText className="h-4 w-4" />
                Patent
              </TabsTrigger>
              <TabsTrigger value="datasets" className="gap-2">
                <Database className="h-4 w-4" />
                Data Sets
              </TabsTrigger>
            </TabsList>

            {/* General Info Tab */}
            <TabsContent value="general" className="p-6 m-0">
              <div className="space-y-6">
                {/* Key Facts - Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {actor.geography && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Geography:</span>
                        <p className="text-sm mt-1">{actor.geography}</p>
                      </div>
                    )}
                    {actor.hqCity && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">HQ City:</span>
                        <p className="text-sm mt-1">{actor.hqCity}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {actor.website && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Website:</span>
                        <p className="text-sm mt-1">
                          <a
                            href={actor.website.startsWith("http") ? actor.website : `https://${actor.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {actor.website}
                          </a>
                        </p>
                      </div>
                    )}
                    {actor.typeMain && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Business:</span>
                        <p className="text-sm mt-1">{actor.typeMain}</p>
                      </div>
                    )}
                    {actor.yearFounded && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Year Founded:</span>
                        <p className="text-sm mt-1">{String(actor.yearFounded)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* ABOUT Section */}
                {actor.description && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">ABOUT</h3>
                    <div className="text-sm text-muted-foreground">
                      <MarkdownContent content={actor.description} />
                    </div>
                  </div>
                )}

                {/* KEYWORDS Section */}
                {actor.keywords && formatList(actor.keywords) && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">KEYWORDS</h3>
                    <p className="text-sm text-muted-foreground">{formatList(actor.keywords)}</p>
                  </div>
                )}

                {/* COMPETITORS Section */}
                {actor.competitors && formatList(actor.competitors) && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2">COMPETITORS</h3>
                    <p className="text-sm text-muted-foreground">{formatList(actor.competitors)}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ESG Tab */}
            <TabsContent value="esg" className="p-6 m-0">
              <p className="text-sm text-muted-foreground">ESG data will be displayed here.</p>
            </TabsContent>

            {/* Financial Tab */}
            <TabsContent value="financial" className="p-6 m-0">
              <p className="text-sm text-muted-foreground">Financial data will be displayed here.</p>
            </TabsContent>

            {/* Social Tab */}
            <TabsContent value="social" className="p-6 m-0">
              <p className="text-sm text-muted-foreground">Social data will be displayed here.</p>
            </TabsContent>

            {/* Patent Tab */}
            <TabsContent value="patent" className="p-6 m-0">
              <p className="text-sm text-muted-foreground">Patent data will be displayed here.</p>
            </TabsContent>

            {/* Data Sets Tab */}
            <TabsContent value="datasets" className="p-6 m-0">
              <p className="text-sm text-muted-foreground">Data sets will be displayed here.</p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Innovation Portfolio / Timeline and Latest Signals – only on General Info */}
        {activeTab === "general" && (
          <>
            {/* Stats and Charts Section */}
            {actions.length > 0 && (
              <ActorDashboard actions={actions} domainNames={domainNames} />
            )}

            {/* Latest Signals Section */}
            <div className="mt-8">
              {actions.length > 0 ? (
                <DomainContentList items={actions} itemsPerPage={10} domainNames={domainNames} />
              ) : (
                <div className="border rounded-lg bg-card p-8 text-center text-muted-foreground">
                  <p>No signals available for this actor.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
