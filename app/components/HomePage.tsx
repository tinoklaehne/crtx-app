"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DomainContentList } from "@/app/components/domains/DomainContentList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import type { DomainContentItem } from "@/app/types/domainContent";
import type { Report } from "@/app/types/reports";
import type { Trend } from "@/app/types/trends";
import type { Actor } from "@/app/types/actors";
import type { PowerSearchGroupedResults, PowerSearchItem } from "@/app/types/search";

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

const MIN_SEARCH_QUERY_LENGTH = 2;
const BASE_GROUP_LIMIT = 10;
const GROUP_LOAD_STEP = 20;
type ExpandableGroupKey = "trends" | "reports";

function emptySearchResults(): PowerSearchGroupedResults {
  return {
    signals: [],
    domains: [],
    trends: [],
    reports: [],
    actors: [],
  };
}

export function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"my-domains" | "my-reports" | "my-trends" | "my-actors">(
    "my-domains"
  );
  const [items, setItems] = useState<DomainContentItem[]>([]);
  const [domainNames, setDomainNames] = useState<Record<string, string>>({});
  const [reports, setReports] = useState<Report[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [actorsLoading, setActorsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [trendsError, setTrendsError] = useState<string | null>(null);
  const [actorsError, setActorsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PowerSearchGroupedResults>(
    emptySearchResults()
  );
  const [groupLimits, setGroupLimits] = useState<Record<ExpandableGroupKey, number>>({
    trends: BASE_GROUP_LIMIT,
    reports: BASE_GROUP_LIMIT,
  });
  const [loadingMoreGroup, setLoadingMoreGroup] = useState<ExpandableGroupKey | null>(
    null
  );
  const [groupExhausted, setGroupExhausted] = useState<Record<ExpandableGroupKey, boolean>>({
    trends: false,
    reports: false,
  });

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
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 250);
    return () => {
      clearTimeout(timeout);
    };
  }, [searchQuery]);

  useEffect(() => {
    const query = debouncedQuery.trim();
    if (query.length < MIN_SEARCH_QUERY_LENGTH) {
      setSearchLoading(false);
      setSearchError(null);
      setSearchResults(emptySearchResults());
      setGroupLimits({ trends: BASE_GROUP_LIMIT, reports: BASE_GROUP_LIMIT });
      setGroupExhausted({ trends: false, reports: false });
      return;
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 10000);
    let cancelled = false;

    async function loadPowerSearch() {
      try {
        setSearchLoading(true);
        setSearchError(null);
        const res = await fetch(
          `/api/search/power?q=${encodeURIComponent(query)}&limit=${BASE_GROUP_LIMIT}`,
          { signal: controller.signal }
        );
        const contentType = res.headers.get("content-type") ?? "";
        let data: { results?: PowerSearchGroupedResults } | null = null;
        if (contentType.includes("application/json")) {
          data = await res.json().catch(() => null);
        }
        if (!res.ok) {
          if (!cancelled) {
            setSearchResults(emptySearchResults());
            setSearchError(`Could not search (status ${res.status}).`);
          }
          return;
        }
        if (!cancelled) {
          setSearchResults(data?.results ?? emptySearchResults());
          setGroupLimits({ trends: BASE_GROUP_LIMIT, reports: BASE_GROUP_LIMIT });
          setGroupExhausted({ trends: false, reports: false });
        }
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") {
          if (!cancelled && timedOut) {
            setSearchError("Search is taking too long. Please try another keyword.");
          }
          return;
        }
        console.error(err);
        if (!cancelled) {
          setSearchResults(emptySearchResults());
          setSearchError("Could not run search right now.");
        }
      } finally {
        clearTimeout(timeout);
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }

    loadPowerSearch();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [debouncedQuery]);

  const groupedResults: Array<{
    key: keyof PowerSearchGroupedResults;
    label: string;
    items: PowerSearchItem[];
  }> = [
    { label: "Signals", items: searchResults.signals, key: "signals" as const },
    { label: "Domains", items: searchResults.domains, key: "domains" as const },
    { label: "Trends", items: searchResults.trends, key: "trends" as const },
    { label: "Reports", items: searchResults.reports, key: "reports" as const },
    { label: "Actors", items: searchResults.actors, key: "actors" as const },
  ];

  const totalSearchResults = groupedResults.reduce(
    (sum, group) => sum + group.items.length,
    0
  );

  const showSearchPanel = debouncedQuery.trim().length >= MIN_SEARCH_QUERY_LENGTH;

  function handlePowerSearchSelect(item: PowerSearchItem) {
    if (item.external) {
      window.open(item.href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(item.href);
  }

  function submitPowerSearch() {
    const nextQuery = searchQuery.trim();
    setDebouncedQuery(nextQuery);
  }

  async function handleLoadMoreGroup(group: ExpandableGroupKey) {
    const query = debouncedQuery.trim();
    if (query.length < MIN_SEARCH_QUERY_LENGTH) return;
    if (loadingMoreGroup) return;

    const nextLimit = groupLimits[group] + GROUP_LOAD_STEP;
    setLoadingMoreGroup(group);
    try {
      const res = await fetch(
        `/api/search/power?q=${encodeURIComponent(query)}&scope=${group}&limit=${nextLimit}`
      );
      const data: { results?: PowerSearchGroupedResults } | null = await res
        .json()
        .catch(() => null);
      if (!res.ok || !data?.results) return;

      const nextItems = data.results[group] ?? [];
      setSearchResults((prev) => ({ ...prev, [group]: nextItems }));
      setGroupLimits((prev) => ({ ...prev, [group]: nextLimit }));
      setGroupExhausted((prev) => ({ ...prev, [group]: nextItems.length < nextLimit }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMoreGroup(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadMyActors() {
      try {
        setActorsLoading(true);
        setActorsError(null);
        const res = await fetch("/api/user/my-actors");
        const contentType = res.headers.get("content-type") ?? "";
        let data: { actors?: Actor[]; error?: string } | null = null;
        if (contentType.includes("application/json")) {
          try {
            data = await res.json();
          } catch (jsonError) {
            console.warn("Could not parse /api/user/my-actors JSON response", jsonError);
          }
        }
        if (!res.ok) {
          if (!cancelled) {
            setActors([]);
            setActorsError(
              data?.error || `Could not load My Actors (status ${res.status}).`
            );
          }
        } else if (data) {
          if (!cancelled) {
            setActors(data.actors ?? []);
            if (data.error) {
              setActorsError("Some data may be incomplete. Airtable connection may be unavailable.");
            }
          }
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setActors([]);
          setActorsError("Could not load My Actors. Please check your Airtable connection.");
        }
      } finally {
        if (!cancelled) {
          setActorsLoading(false);
        }
      }
    }
    loadMyActors();
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
            <div className="mb-8 rounded-xl border bg-card/60 p-4 md:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Search className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Power Search</p>
              </div>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitPowerSearch();
                }}
              >
                <Input
                  placeholder="Search signals, domains, trends, reports, actors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 text-base"
                />
                <Button type="submit" className="h-12 px-5">
                  {searchLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">Search</span>
                </Button>
              </form>
              <p className="text-xs text-muted-foreground mt-2">
                Live search updates while typing. Press Enter or Search to run immediately.
              </p>
              {showSearchPanel && (
                <div className="mt-3 border rounded-lg bg-card max-h-[420px] overflow-auto">
                  {searchLoading ? (
                    <p className="text-sm text-muted-foreground p-4">Searching across all content...</p>
                  ) : searchError ? (
                    <p className="text-sm text-destructive p-4">{searchError}</p>
                  ) : totalSearchResults === 0 ? (
                    <p className="text-sm text-muted-foreground p-4">No results found.</p>
                  ) : (
                    <div className="divide-y">
                      {groupedResults
                        .filter((group) => group.items.length > 0)
                        .map((group) => (
                          <div key={group.label} className="p-3">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                              {group.label} ({group.items.length})
                            </div>
                            <div className="space-y-1">
                              {group.items.map((item) => (
                                <button
                                  key={`${item.type}-${item.id}`}
                                  type="button"
                                  onClick={() => handlePowerSearchSelect(item)}
                                  className="w-full text-left p-2 rounded-md hover:bg-secondary/60 transition-colors"
                                >
                                  <div className="text-sm font-medium">{item.title}</div>
                                  {(item.subtitle || item.meta) && (
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                      {item.subtitle}
                                      {item.subtitle && item.meta ? " - " : ""}
                                      {item.meta}
                                    </div>
                                  )}
                                </button>
                              ))}
                            </div>
                            {(group.key === "trends" || group.key === "reports") &&
                              !groupExhausted[group.key as ExpandableGroupKey] && (
                                <div className="mt-2 flex justify-end">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleLoadMoreGroup(group.key as ExpandableGroupKey)
                                    }
                                    disabled={
                                      loadingMoreGroup ===
                                      (group.key as ExpandableGroupKey)
                                    }
                                  >
                                    {loadingMoreGroup ===
                                    (group.key as ExpandableGroupKey) ? (
                                      <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                                        Loading...
                                      </>
                                    ) : (
                                      `Search more ${group.label}`
                                    )}
                                  </Button>
                                </div>
                              )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Tabs
              value={activeTab}
              onValueChange={(value) =>
                setActiveTab(value as "my-domains" | "my-reports" | "my-trends" | "my-actors")
              }
              className="w-full"
            >
              <TabsList className="mb-4">
                <TabsTrigger value="my-domains">My Domains</TabsTrigger>
                <TabsTrigger value="my-reports">My Reports</TabsTrigger>
                <TabsTrigger value="my-trends">My Trends</TabsTrigger>
                <TabsTrigger value="my-actors">My Actors</TabsTrigger>
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

              <TabsContent value="my-actors" className="m-0">
                {actorsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Loading your subscribed actors...
                  </p>
                ) : actorsError ? (
                  <p className="text-sm text-destructive">{actorsError}</p>
                ) : actors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You have no subscribed actors yet. Subscribe to actors in the Directory to see them here.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {actors.map((actor) => (
                      <div
                        key={actor.id}
                        onClick={() => router.push(`/directory/${actor.id}`)}
                        className="bg-card border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {actor.logo ? (
                            <Image
                              src={actor.logo}
                              alt={actor.name}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-contain flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <span className="text-lg text-muted-foreground">
                                {actor.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm mb-1 line-clamp-2">{actor.name}</h3>
                            {actor.typeMain && (
                              <p className="text-xs text-muted-foreground">{actor.typeMain}</p>
                            )}
                            {actor.geography && (
                              <p className="text-xs text-muted-foreground mt-1">{actor.geography}</p>
                            )}
                          </div>
                        </div>
                        {actor.description && (
                          <p className="text-xs text-muted-foreground line-clamp-3 mt-2">
                            {actor.description}
                          </p>
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
