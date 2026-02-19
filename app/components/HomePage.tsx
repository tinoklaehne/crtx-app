"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DomainContentList } from "@/app/components/domains/DomainContentList";
import type { DomainContentItem } from "@/app/types/domainContent";
import type { Report } from "@/app/types/reports";
import type { Trend } from "@/app/types/trends";

// Helper to safely convert Airtable values to strings (handles specialValue objects)
function safeString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && 'specialValue' in value) {
    return String((value as { specialValue: unknown }).specialValue);
  }
  return String(value);
}

export function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"my-domains" | "my-reports" | "my-trends">(
    "my-domains"
  );
  const [items, setItems] = useState<DomainContentItem[]>([]);
  const [domainNames, setDomainNames] = useState<Record<string, string>>({});
  const [reports, setReports] = useState<Report[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadMyDomainSignals() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/user/my-domains-signals");
        let data: any = null;
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          try {
            data = await res.json();
          } catch (jsonError) {
            // If JSON parsing fails, we'll fall back below without throwing
            console.warn("Could not parse /api/user/my-domains-signals JSON response", jsonError);
          }
        }
        if (!res.ok) {
          // If API returns error but also provides data, use it
          if (data && data.items) {
            if (!cancelled) {
              setItems(data.items ?? []);
              setDomainNames(data.domainNames ?? {});
            }
          } else if (!cancelled) {
            // Graceful fallback: empty state with error message
            setItems([]);
            setDomainNames({});
            setError(
              (data && data.error) ||
                `Could not load My Domains signals (status ${res.status}).`
            );
          }
        } else if (data) {
          if (!cancelled) {
            setItems(data.items ?? []);
            setDomainNames(data.domainNames ?? {});
            // Show warning if there was an error but data was returned
            if (data.error) {
              setError("Some data may be incomplete. Airtable connection may be unavailable.");
            }
          }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          // Set empty state on error so UI still works
          setItems([]);
          setDomainNames({});
          setError("Could not load My Domains signals. Please check your Airtable connection.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadMyDomainSignals();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadMyReports() {
      try {
        setReportsLoading(true);
        setReportsError(null);
        const res = await fetch("/api/user/my-reports");
        let data: any = null;
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          try {
            data = await res.json();
          } catch (jsonError) {
            console.warn("Could not parse /api/user/my-reports JSON response", jsonError);
          }
        }
        if (!res.ok) {
          if (data && data.reports) {
            if (!cancelled) {
              setReports(data.reports ?? []);
            }
          } else if (!cancelled) {
            setReports([]);
            setReportsError(
              (data && data.error) ||
                `Could not load My Reports (status ${res.status}).`
            );
          }
        } else if (data) {
          if (!cancelled) {
            setReports(data.reports ?? []);
            if (data.error) {
              setReportsError("Some data may be incomplete. Airtable connection may be unavailable.");
            }
          }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setReports([]);
          setReportsError("Could not load My Reports. Please check your Airtable connection.");
        }
      } finally {
        if (!cancelled) {
          setReportsLoading(false);
        }
      }
    }
    loadMyReports();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadMyTrends() {
      try {
        setTrendsLoading(true);
        setTrendsError(null);
        const res = await fetch("/api/user/my-trends");
        const contentType = res.headers.get("content-type") ?? "";
        let data: { trends?: Trend[]; error?: string } | null = null;
        if (contentType.includes("application/json")) {
          try {
            data = await res.json();
          } catch (jsonError) {
            console.warn("Could not parse /api/user/my-trends JSON response", jsonError);
          }
        }
        if (!res.ok) {
          if (!cancelled) {
            setTrends([]);
            setTrendsError(
              (data?.error) || `Could not load My Trends (status ${res.status}).`
            );
          }
        } else if (data) {
          if (!cancelled) {
            setTrends(data.trends ?? []);
            if (data.error) {
              setTrendsError("Some data may be incomplete. Airtable connection may be unavailable.");
            }
          }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setTrends([]);
          setTrendsError("Could not load My Trends. Please check your Airtable connection.");
        }
      } finally {
        if (!cancelled) {
          setTrendsLoading(false);
        }
      }
    }
    loadMyTrends();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="py-8">
            <h1 className="text-4xl font-bold mb-3">Welcome back!</h1>
            <p className="text-muted-foreground text-lg mb-6">
              Explore domains, news data, profiles, and trend radars.
            </p>

            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "my-domains" | "my-reports" | "my-trends")
              }
              className="w-full"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="my-domains">My Domains</TabsTrigger>
                <TabsTrigger value="my-reports">My Reports</TabsTrigger>
                <TabsTrigger value="my-trends">My Trends</TabsTrigger>
              </TabsList>

              <TabsContent value="my-domains" className="m-0">
                {loading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading latest signals from your subscribed domains...
                  </p>
                ) : error ? (
                  <p className="text-sm text-destructive">{error}</p>
                ) : items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You have no signals in your subscribed domains yet. Subscribe
                    to domains to see personalized signals here.
                  </p>
                ) : (
                  <DomainContentList
                    items={items}
                    itemsPerPage={10}
                    domainNames={domainNames}
                  />
                )}
              </TabsContent>

              <TabsContent value="my-reports" className="m-0">
                {reportsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading your bookmarked reports...
                  </p>
                ) : reportsError ? (
                  <p className="text-sm text-destructive">{reportsError}</p>
                ) : reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You have no bookmarked reports yet. Bookmark reports to see them here.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        onClick={() => router.push(`/library/${report.id}`)}
                        className="bg-card border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {report.sourceLogo ? (
                            <Image
                              src={report.sourceLogo}
                              alt={report.source || report.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-contain flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <span className="text-lg text-muted-foreground">
                                {report.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-1 line-clamp-2">{report.name}</h3>
                            {report.source && (
                              <p className="text-xs text-muted-foreground">{safeString(report.source)}</p>
                            )}
                            {report.year && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {safeString(report.year)}
                              </p>
                            )}
                          </div>
                        </div>
                        {report.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-3 mt-2">
                            {safeString(report.summary)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="my-trends" className="m-0">
                {trendsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading your bookmarked trends...
                  </p>
                ) : trendsError ? (
                  <p className="text-sm text-destructive">{trendsError}</p>
                ) : trends.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You have no bookmarked trends yet. Bookmark trends in the Trends app to see them here.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trends.map((trend) => (
                      <div
                        key={trend.id}
                        onClick={() => router.push(`/trends/${trend.id}`)}
                        className="bg-card border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          {(trend.iconUrl ?? trend.imageUrl) ? (
                            <Image
                              src={trend.iconUrl ?? trend.imageUrl}
                              alt=""
                              width={40}
                              height={40}
                              className="w-10 h-10 flex-shrink-0 object-contain invert dark:invert-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium text-muted-foreground">
                                {trend.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-0.5 line-clamp-2">{trend.name}</h3>
                            {trend.domain && (
                              <p className="text-xs text-muted-foreground">{trend.domain}</p>
                            )}
                          </div>
                        </div>
                        {trend.aliases && trend.aliases.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {trend.aliases.slice(0, 5).map((alias, i) => (
                              <Badge key={i} variant="secondary" className="text-xs font-normal">
                                {alias}
                              </Badge>
                            ))}
                            {trend.aliases.length > 5 && (
                              <Badge variant="secondary" className="text-xs font-normal">
                                +{trend.aliases.length - 5}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
