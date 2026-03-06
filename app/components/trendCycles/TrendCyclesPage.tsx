"use client";

import { useEffect, useMemo, useState } from "react";
import { Navbar } from "@/app/components/layout/Navbar";
import { ResizablePanel } from "@/app/components/ui/resizable-panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Trend } from "@/app/types/trends";
import type { User } from "@/app/types/users";
import type { TrendCycle, TrendCycleItem, TrendScoringMetric } from "@/app/types/trendCycles";
import type { TrendAssessment } from "@/app/types/trendCycles";
import type { Radar } from "@/app/types/radars";
import { TechnologyDetailModal } from "@/app/components/domains/TechnologyDetailModal";

function pct(n: number): string {
  if (!Number.isFinite(n)) return "0%";
  return `${Math.round(n * 100)}%`;
}

export function TrendCyclesPage({
  initialCycles,
  allTrends,
  allUsers,
  allMetrics,
  allRadars,
}: {
  initialCycles: TrendCycle[];
  allTrends: Trend[];
  allUsers: User[];
  allMetrics: TrendScoringMetric[];
  allRadars: Radar[];
}) {
  const [cycles, setCycles] = useState<TrendCycle[]>(initialCycles);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(
    initialCycles[0]?.id ?? null
  );
  const [items, setItems] = useState<TrendCycleItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<TrendAssessment[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [activeTrendId, setActiveTrendId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");

  const trendsById = useMemo(() => new Map(allTrends.map((t) => [t.id, t])), [allTrends]);
  const usersById = useMemo(() => new Map(allUsers.map((u) => [u.id, u])), [allUsers]);
  const metricsById = useMemo(() => new Map(allMetrics.map((m) => [m.id, m])), [allMetrics]);
  const radarsById = useMemo(() => new Map(allRadars.map((r) => [r.id, r])), [allRadars]);

  const selectedCycle = useMemo(
    () => cycles.find((c) => c.id === selectedCycleId) ?? null,
    [cycles, selectedCycleId]
  );

  useEffect(() => {
    if (!selectedCycle) {
      setStartDateInput("");
      setEndDateInput("");
      return;
    }
    setStartDateInput(selectedCycle.startDate?.slice(0, 10) ?? "");
    setEndDateInput(selectedCycle.endDate?.slice(0, 10) ?? "");
  }, [selectedCycle]);

  const visibleCycles = useMemo(() => {
    const list = cycles.slice();
    if (!showOnlyActive) return list;
    return list.filter((c) => c.status !== "Archived");
  }, [cycles, showOnlyActive]);

  useEffect(() => {
    if (!selectedCycleId) return;
    let cancelled = false;
    async function loadItems() {
      setItemsLoading(true);
      setItemsError(null);
      try {
        const res = await fetch(`/api/trend-cycles/${selectedCycleId}/items`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error((data && data.error) || `Failed to load items (${res.status})`);
        }
        if (!cancelled) setItems((data?.items ?? []) as TrendCycleItem[]);
      } catch (e: any) {
        if (!cancelled) setItemsError(e?.message ?? "Failed to load items");
      } finally {
        if (!cancelled) setItemsLoading(false);
      }
    }
    loadItems();
    return () => {
      cancelled = true;
    };
  }, [selectedCycleId]);

  useEffect(() => {
    if (!selectedCycleId) return;
    let cancelled = false;
    async function loadAssessments() {
      setAssessmentsLoading(true);
      try {
        const res = await fetch(`/api/trend-cycles/${selectedCycleId}/assessments`, {
          credentials: "include",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          if (!cancelled) setAssessments([]);
          return;
        }
        if (!cancelled) setAssessments((data?.assessments ?? []) as TrendAssessment[]);
      } catch {
        if (!cancelled) setAssessments([]);
      } finally {
        if (!cancelled) setAssessmentsLoading(false);
      }
    }
    loadAssessments();
    return () => {
      cancelled = true;
    };
  }, [selectedCycleId]);

  const expectedAssessmentsPerExpert = useMemo(() => {
    const metricCount = selectedCycle?.metricIds?.length ?? 0;
    return items.length * metricCount;
  }, [items.length, selectedCycle?.metricIds]);

  const requiredMetricIds = useMemo(
    () => new Set(selectedCycle?.metricIds ?? []),
    [selectedCycle?.metricIds]
  );

  const completionByExpert = useMemo(() => {
    const expertIds = selectedCycle?.expertUserIds ?? [];
    const expected = expectedAssessmentsPerExpert;
    if (!expected || !expertIds.length) {
      return new Map<string, { completed: number; expected: number }>(
        expertIds.map((id) => [id, { completed: 0, expected }])
      );
    }
    const seen = new Set<string>();
    const counts = new Map<string, number>();
    for (const a of assessments) {
      if (!requiredMetricIds.has(a.metricId)) continue;
      const key = `${a.expertUserId}:${a.trendId}:${a.metricId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      counts.set(a.expertUserId, (counts.get(a.expertUserId) ?? 0) + 1);
    }
    return new Map(
      expertIds.map((id) => [id, { completed: counts.get(id) ?? 0, expected }])
    );
  }, [assessments, expectedAssessmentsPerExpert, requiredMetricIds, selectedCycle?.expertUserIds]);

  const statsByTrend = useMemo(() => {
    // Per-trend: coverage and a simple overall average (across metrics + experts)
    const map = new Map<
      string,
      { completed: number; expected: number; avgScore?: number }
    >();
    const expertCount = selectedCycle?.expertUserIds.length ?? 0;
    const metricCount = selectedCycle?.metricIds.length ?? 0;
    const expected = expertCount * metricCount;
    const sums = new Map<string, { sum: number; n: number; completed: number }>();
    const seen = new Set<string>();
    for (const a of assessments) {
      if (!requiredMetricIds.has(a.metricId)) continue;
      const key = `${a.expertUserId}:${a.trendId}:${a.metricId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const entry = sums.get(a.trendId) ?? { sum: 0, n: 0, completed: 0 };
      entry.completed += 1;
      if (typeof a.score === "number") {
        entry.sum += a.score;
        entry.n += 1;
      }
      sums.set(a.trendId, entry);
    }
    for (const it of items) {
      const entry = sums.get(it.trendId) ?? { sum: 0, n: 0, completed: 0 };
      map.set(it.trendId, {
        completed: entry.completed,
        expected,
        avgScore: entry.n ? entry.sum / entry.n : undefined,
      });
    }
    return map;
  }, [assessments, items, requiredMetricIds, selectedCycle?.expertUserIds.length, selectedCycle?.metricIds.length]);

  const activeTrend = useMemo(
    () => (activeTrendId ? trendsById.get(activeTrendId) ?? null : null),
    [activeTrendId, trendsById]
  );

  async function refreshCycles() {
    const res = await fetch("/api/trend-cycles", { credentials: "include" });
    const data = await res.json().catch(() => null);
    if (res.ok) setCycles((data?.cycles ?? []) as TrendCycle[]);
  }

  async function createCycle(input: {
    name: string;
    code?: string;
    expertUserIds: string[];
    metricIds: string[];
    description?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const res = await fetch("/api/trend-cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.error) || "Failed to create cycle");
    const cycle = data?.cycle as TrendCycle | undefined;
    if (cycle) {
      setCycles((prev) => [cycle, ...prev]);
      setSelectedCycleId(cycle.id);
    } else {
      await refreshCycles();
    }
  }

  async function updateCycleDates(partial: { startDate?: string; endDate?: string }) {
    if (!selectedCycleId) return;
    const res = await fetch(`/api/trend-cycles/${selectedCycleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(partial),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.cycle) {
      setCycles((prev) => prev.map((c) => (c.id === selectedCycleId ? (data.cycle as TrendCycle) : c)));
    }
  }

  async function addTrend(trendId: string) {
    if (!selectedCycleId) return;
    const res = await fetch(`/api/trend-cycles/${selectedCycleId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ trendId }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.error) || "Failed to add trend");
    const item = data?.item as TrendCycleItem | undefined;
    if (item) setItems((prev) => [...prev, item]);
  }

  async function updateItem(itemId: string, updates: Partial<Pick<TrendCycleItem, "stage" | "notes">>) {
    if (!selectedCycleId) return;
    const res = await fetch(`/api/trend-cycles/${selectedCycleId}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ itemId, ...updates }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.error) || "Failed to update item");
    const updated = data?.item as TrendCycleItem | undefined;
    if (updated) setItems((prev) => prev.map((it) => (it.id === itemId ? updated : it)));
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Navbar />

      <ResizablePanel defaultWidth={320} minWidth={280} maxWidth={520} className="border-r bg-card">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Trend Cycles</h2>
              <p className="text-xs text-muted-foreground">
                Manage long lists, invite experts, and shortlist based on scores.
              </p>
            </div>

            <NewCycleDialog allUsers={allUsers} allMetrics={allMetrics} onCreate={createCycle} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Active only</span>
              <Switch checked={showOnlyActive} onCheckedChange={setShowOnlyActive} />
            </div>
            <Button variant="outline" size="sm" onClick={refreshCycles}>
              Refresh
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-160px)]">
          <div>
            {visibleCycles.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No trend cycles yet.</div>
            ) : (
              visibleCycles.map((cycle, idx) => {
                const active = cycle.id === selectedCycleId;
                return (
                  <div
                    key={cycle.id}
                    onClick={() => setSelectedCycleId(cycle.id)}
                    className={[
                      "px-4 py-3 cursor-pointer transition-colors",
                      idx < visibleCycles.length - 1 ? "border-b border-border" : "",
                      active ? "bg-secondary" : "hover:bg-secondary/50",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{cycle.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {cycle.status} · {cycle.expertUserIds.length} experts · {cycle.metricIds.length} metrics
                        </div>
                      </div>
                      {cycle.status === "Scoring" ? (
                        <Badge variant="secondary">Scoring</Badge>
                      ) : cycle.status === "Draft" ? (
                        <Badge variant="outline">Draft</Badge>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </ResizablePanel>

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {!selectedCycle ? (
            <div className="max-w-2xl mx-auto py-12 text-center text-muted-foreground">
              Select a cycle on the left to view details.
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold">{selectedCycle.name}</h1>
                  <div className="text-sm text-muted-foreground mt-1">
                    Status: <span className="font-medium text-foreground">{selectedCycle.status}</span>
                    {selectedCycle.description ? ` · ${selectedCycle.description}` : ""}
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">Start date</span>
                      <Input
                        type="date"
                        className="h-8 w-36"
                        value={startDateInput}
                        onChange={(e) => setStartDateInput(e.target.value)}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (!value || value === selectedCycle.startDate?.slice(0, 10)) return;
                          updateCycleDates({ startDate: value }).catch(() => {});
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">End date</span>
                      <Input
                        type="date"
                        className="h-8 w-36"
                        value={endDateInput}
                        onChange={(e) => setEndDateInput(e.target.value)}
                        onBlur={(e) => {
                          const value = e.target.value;
                          if (!value || value === selectedCycle.endDate?.slice(0, 10)) return;
                          updateCycleDates({ endDate: value }).catch(() => {});
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(selectedCycle.metricIds ?? []).map((id) => (
                      <Badge key={id} variant="secondary">
                        {metricsById.get(id)?.name ?? "Metric"}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(selectedCycle.radarIds ?? []).map((id) => (
                      <Badge key={id} variant="outline">
                        {radarsById.get(id)?.name ?? "Radar"}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AttachRadarDialog
                    cycle={selectedCycle}
                    allRadars={allRadars}
                    onUpdate={async (radarIds) => {
                      if (!selectedCycleId) return;
                      const res = await fetch(`/api/trend-cycles/${selectedCycleId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ radarIds }),
                      });
                      const data = await res.json().catch(() => null);
                      if (res.ok && data?.cycle) {
                        setCycles((prev) => prev.map((c) => (c.id === selectedCycleId ? (data.cycle as TrendCycle) : c)));
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 border rounded-lg overflow-hidden">
                  <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Long list</div>
                      <div className="text-xs text-muted-foreground">
                        {items.length} items
                        {selectedCycle.metricIds.length > 0
                          ? ` · ${expectedAssessmentsPerExpert} assessments per expert`
                          : ""}
                      </div>
                    </div>
                    {itemsLoading ? (
                      <span className="text-xs text-muted-foreground">Loading…</span>
                    ) : itemsError ? (
                      <span className="text-xs text-destructive">{itemsError}</span>
                    ) : assessmentsLoading ? (
                      <span className="text-xs text-muted-foreground">Updating progress…</span>
                    ) : null}
                    <AddTrendDialog
                      disabled={!selectedCycleId}
                      allTrends={allTrends}
                      existingTrendIds={new Set(items.map((it) => it.trendId))}
                      onAdd={addTrend}
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-3 text-left text-xs font-semibold">TREND</th>
                          <th className="p-3 text-left text-xs font-semibold w-40">COVERAGE</th>
                          <th className="p-3 text-left text-xs font-semibold w-32">AVG</th>
                          <th className="p-3 text-left text-xs font-semibold w-48">STAGE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">
                              No trends added yet. Use “Add trend” to build your long list.
                            </td>
                          </tr>
                        ) : (
                          items.map((it) => {
                            const trend = trendsById.get(it.trendId);
                            const s = statsByTrend.get(it.trendId);
                            const coverage =
                              s && s.expected > 0 ? `${s.completed}/${s.expected}` : "—";
                            return (
                              <tr
                                key={it.id}
                                className="border-b last:border-b-0 hover:bg-muted/40 cursor-pointer"
                                onClick={() => {
                                  if (trend) {
                                    setActiveTrendId(trend.id);
                                    setDetailOpen(true);
                                  }
                                }}
                              >
                                <td className="p-3">
                                  <div className="font-medium text-sm line-clamp-2">
                                    {trend?.name ?? it.trendId}
                                  </div>
                                  {trend?.domain ? (
                                    <div className="text-xs text-muted-foreground mt-0.5">{trend.domain}</div>
                                  ) : null}
                                </td>
                                <td className="p-3">
                                  <Badge variant="outline">{coverage}</Badge>
                                </td>
                                <td className="p-3">
                                  {s?.avgScore !== undefined ? (
                                    <Badge variant="secondary">{s.avgScore.toFixed(2)}</Badge>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">—</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <Select
                                    value={it.stage}
                                    onValueChange={(v) => updateItem(it.id, { stage: v as any })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Long List">Long List</SelectItem>
                                      <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                                      <SelectItem value="Excluded">Excluded</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="p-4 border-b bg-muted/30 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">Panel</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedCycle.expertUserIds.length} experts invited
                      </div>
                    </div>
                    <ManagePanelDialog
                      cycle={selectedCycle}
                      allUsers={allUsers}
                      onUpdate={async (expertUserIds) => {
                        if (!selectedCycleId) return;
                        const res = await fetch(`/api/trend-cycles/${selectedCycleId}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ expertUserIds }),
                        });
                        const data = await res.json().catch(() => null);
                        if (res.ok && data?.cycle) {
                          setCycles((prev) =>
                            prev.map((c) => (c.id === selectedCycleId ? (data.cycle as TrendCycle) : c))
                          );
                        }
                      }}
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    {selectedCycle.expertUserIds.length === 0 ? (
                      <div className="text-sm text-muted-foreground">
                        No experts selected yet. Add experts when creating the cycle or by editing it later.
                      </div>
                    ) : (
                      selectedCycle.expertUserIds.map((id) => (
                        <div key={id} className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{usersById.get(id)?.name ?? id}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {usersById.get(id)?.email ?? ""}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {(() => {
                              const p = completionByExpert.get(id);
                              if (!p || !p.expected) return "—";
                              return pct(p.completed / p.expected);
                            })()}
                          </Badge>
                        </div>
                      ))
                    )}
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      Progress is computed from submitted assessments (wired up in the Trend Scoring mini-app).
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTrend && (
        <TechnologyDetailModal
          technology={activeTrend}
          cluster={undefined}
          clusters={[]}
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          signals={[]}
        />
      )}
    </div>
  );
}

function NewCycleDialog({
  allUsers,
  allMetrics,
  onCreate,
}: {
  allUsers: User[];
  allMetrics: TrendScoringMetric[];
  onCreate: (input: {
    name: string;
    code?: string;
    expertUserIds: string[];
    metricIds: string[];
    description?: string;
    startDate?: string;
    endDate?: string;
  }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [expertQuery, setExpertQuery] = useState("");
  const [metricQuery, setMetricQuery] = useState("");
  const [selectedExperts, setSelectedExperts] = useState<Set<string>>(new Set());
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(new Set(allMetrics.filter((m) => m.isDefault).map((m) => m.id)));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredExperts = useMemo(() => {
    const q = expertQuery.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) => (u.name + " " + u.email).toLowerCase().includes(q));
  }, [allUsers, expertQuery]);

  const filteredMetrics = useMemo(() => {
    const q = metricQuery.trim().toLowerCase();
    if (!q) return allMetrics;
    return allMetrics.filter((m) => (m.name + " " + (m.description ?? "")).toLowerCase().includes(q));
  }, [allMetrics, metricQuery]);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await onCreate({
        name,
        code: code.trim() ? code.trim() : undefined,
        description: description.trim() ? description.trim() : undefined,
        expertUserIds: Array.from(selectedExperts),
        metricIds: Array.from(selectedMetrics),
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setOpen(false);
      setName("");
      setCode("");
      setDescription("");
      setExpertQuery("");
      setMetricQuery("");
      setSelectedExperts(new Set());
      setSelectedMetrics(new Set(allMetrics.filter((m) => m.isDefault).map((m) => m.id)));
      setStartDate("");
      setEndDate("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to create cycle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ New cycle</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create trend cycle</DialogTitle>
          <DialogDescription>
            Set up a new scoring round: select a panel of experts and the metrics they will score.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">Name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q2 2026 Tech Cycle" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Code (optional)</div>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. Q2-2026" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Description (optional)</div>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Visible to experts" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Start date (optional)</div>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">End date (optional)</div>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Experts</div>
                <Badge variant="secondary">{selectedExperts.size}</Badge>
              </div>
              <Input value={expertQuery} onChange={(e) => setExpertQuery(e.target.value)} placeholder="Search experts…" />
              <div className="mt-2 max-h-44 overflow-auto space-y-1">
                {filteredExperts.map((u) => {
                  const checked = selectedExperts.has(u.id);
                  return (
                    <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedExperts((prev) => {
                            const next = new Set(prev);
                            if (next.has(u.id)) next.delete(u.id);
                            else next.add(u.id);
                            return next;
                          });
                        }}
                      />
                      <span className="truncate">{u.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Metrics</div>
                <Badge variant="secondary">{selectedMetrics.size}</Badge>
              </div>
              <Input value={metricQuery} onChange={(e) => setMetricQuery(e.target.value)} placeholder="Search metrics…" />
              <div className="mt-2 max-h-44 overflow-auto space-y-1">
                {filteredMetrics.map((m) => {
                  const checked = selectedMetrics.has(m.id);
                  return (
                    <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setSelectedMetrics((prev) => {
                            const next = new Set(prev);
                            if (next.has(m.id)) next.delete(m.id);
                            else next.add(m.id);
                            return next;
                          });
                        }}
                      />
                      <span className="truncate">{m.name}</span>
                      {m.isDefault ? <Badge variant="outline">Default</Badge> : null}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || !name.trim()}>
            {saving ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddTrendDialog({
  disabled,
  allTrends,
  existingTrendIds,
  onAdd,
}: {
  disabled: boolean;
  allTrends: Trend[];
  existingTrendIds: Set<string>;
  onAdd: (trendId: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = allTrends.filter((t) => !existingTrendIds.has(t.id));
    if (!q) return base.slice(0, 100);
    return base
      .filter((t) => t.name.toLowerCase().includes(q) || (t.domain ?? "").toLowerCase().includes(q))
      .slice(0, 100);
  }, [allTrends, existingTrendIds, query]);

  async function add(trendId: string) {
    setAdding(trendId);
    setError(null);
    try {
      await onAdd(trendId);
      setOpen(false);
      setQuery("");
    } catch (e: any) {
      setError(e?.message ?? "Failed to add trend");
    } finally {
      setAdding(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>+ Add trend</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add trend to long list</DialogTitle>
          <DialogDescription>Search the trends database and add items to this cycle.</DialogDescription>
        </DialogHeader>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search trends…" />
        <div className="max-h-80 overflow-auto border rounded-md">
          {candidates.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No matching trends.</div>
          ) : (
            candidates.map((t) => (
              <button
                key={t.id}
                className="w-full text-left px-4 py-3 hover:bg-muted/60 border-b last:border-b-0"
                onClick={() => add(t.id)}
                disabled={adding !== null}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{t.name}</div>
                    {t.domain ? (
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">{t.domain}</div>
                    ) : null}
                  </div>
                  <Badge variant="outline">{adding === t.id ? "Adding…" : "Add"}</Badge>
                </div>
              </button>
            ))
          )}
        </div>
        {error ? <div className="text-sm text-destructive">{error}</div> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ManagePanelDialog({
  cycle,
  allUsers,
  onUpdate,
}: {
  cycle: TrendCycle;
  allUsers: User[];
  onUpdate: (expertUserIds: string[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(cycle.expertUserIds ?? []));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(new Set(cycle.expertUserIds ?? []));
  }, [cycle.id, cycle.expertUserIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((u) => (u.name + " " + u.email).toLowerCase().includes(q));
  }, [allUsers, query]);

  async function save() {
    setSaving(true);
    try {
      await onUpdate(Array.from(selected));
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Manage panel</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage experts</DialogTitle>
          <DialogDescription>
            Add or remove experts invited to score this cycle.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search experts…"
        />
        <div className="max-h-80 overflow-auto border rounded-md p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">No matching experts.</div>
          ) : (
            filtered.map((u) => {
              const checked = selected.has(u.id);
              return (
                <label key={u.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(u.id)) next.delete(u.id);
                        else next.add(u.id);
                        return next;
                      });
                    }}
                  />
                  <span className="truncate">{u.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                </label>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AttachRadarDialog({
  cycle,
  allRadars,
  onUpdate,
}: {
  cycle: TrendCycle;
  allRadars: Radar[];
  onUpdate: (radarIds: string[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(cycle.radarIds ?? []));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(new Set(cycle.radarIds ?? []));
  }, [cycle.id, cycle.radarIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allRadars.slice(0, 200);
    return allRadars.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 200);
  }, [allRadars, query]);

  async function save() {
    setSaving(true);
    try {
      await onUpdate(Array.from(selected));
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Link radars</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Link radars to cycle</DialogTitle>
          <DialogDescription>
            A cycle can feed multiple radars. Linking helps trace where radar items were sourced from.
          </DialogDescription>
        </DialogHeader>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search radars…" />
        <div className="max-h-80 overflow-auto border rounded-md p-3 space-y-2">
          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">No matching radars.</div>
          ) : (
            filtered.map((r) => {
              const checked = selected.has(r.id);
              return (
                <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(r.id)) next.delete(r.id);
                        else next.add(r.id);
                        return next;
                      });
                    }}
                  />
                  <span className="truncate">{r.name}</span>
                  {r.type ? <Badge variant="outline">{r.type}</Badge> : null}
                </label>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

