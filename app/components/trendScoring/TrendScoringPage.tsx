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
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import type { Trend } from "@/app/types/trends";
import type { TrendAssessment, TrendCycle, TrendCycleItem, TrendScoringMetric } from "@/app/types/trendCycles";

type MetricScoreDraft = { score?: number; comment?: string };

function latestBySubmittedAt(items: TrendAssessment[]): TrendAssessment[] {
  const map = new Map<string, TrendAssessment>();
  for (const a of items) {
    const key = `${a.trendId}:${a.metricId}`;
    const prev = map.get(key);
    if (!prev) {
      map.set(key, a);
      continue;
    }
    const prevT = prev.submittedAt ? Date.parse(prev.submittedAt) : 0;
    const nextT = a.submittedAt ? Date.parse(a.submittedAt) : 0;
    if (nextT >= prevT) map.set(key, a);
  }
  return Array.from(map.values());
}

export function TrendScoringPage({ allTrends }: { allTrends: Trend[] }) {
  const trendsById = useMemo(() => new Map(allTrends.map((t) => [t.id, t])), [allTrends]);

  const [cycles, setCycles] = useState<TrendCycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [cycleLoading, setCycleLoading] = useState(false);
  const [cycleError, setCycleError] = useState<string | null>(null);

  const [cycle, setCycle] = useState<TrendCycle | null>(null);
  const [items, setItems] = useState<TrendCycleItem[]>([]);
  const [metrics, setMetrics] = useState<TrendScoringMetric[]>([]);
  const [assessments, setAssessments] = useState<TrendAssessment[]>([]);

  const [activeTrendId, setActiveTrendId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadCycles() {
      try {
        const res = await fetch("/api/trend-scoring/cycles", { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error((data && data.error) || "Failed to load cycles");
        if (!cancelled) {
          const next = (data?.cycles ?? []) as TrendCycle[];
          setCycles(next);
          setSelectedCycleId((cur) => cur ?? next[0]?.id ?? null);
        }
      } catch (e: any) {
        if (!cancelled) setCycleError(e?.message ?? "Failed to load cycles");
      }
    }
    loadCycles();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedCycleId) return;
    let cancelled = false;
    async function loadCycle() {
      setCycleLoading(true);
      setCycleError(null);
      try {
        const res = await fetch(`/api/trend-scoring/cycles/${selectedCycleId}`, { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error((data && data.error) || `Failed to load cycle (${res.status})`);
        if (!cancelled) {
          setCycle((data?.cycle ?? null) as TrendCycle | null);
          setItems((data?.items ?? []) as TrendCycleItem[]);
          setMetrics((data?.metrics ?? []) as TrendScoringMetric[]);
          setAssessments(latestBySubmittedAt((data?.assessments ?? []) as TrendAssessment[]));
        }
      } catch (e: any) {
        if (!cancelled) setCycleError(e?.message ?? "Failed to load cycle");
      } finally {
        if (!cancelled) setCycleLoading(false);
      }
    }
    loadCycle();
    return () => {
      cancelled = true;
    };
  }, [selectedCycleId]);

  const requiredMetricIds = useMemo(() => new Set(cycle?.metricIds ?? []), [cycle?.metricIds]);

  const scoreMap = useMemo(() => {
    const map = new Map<string, Map<string, MetricScoreDraft>>();
    for (const a of assessments) {
      if (!map.has(a.trendId)) map.set(a.trendId, new Map());
      map.get(a.trendId)!.set(a.metricId, { score: a.score, comment: a.comment });
    }
    return map;
  }, [assessments]);

  const queue = useMemo(() => {
    return items.map((it) => {
      const trend = trendsById.get(it.trendId);
      const scores = scoreMap.get(it.trendId) ?? new Map();
      const requiredIds = Array.from(requiredMetricIds);
      const hasRequirements = requiredIds.length > 0;
      const completed = hasRequirements
        ? requiredIds.every((mid) => typeof scores.get(mid)?.score === "number")
        : false;
      const completedCount = hasRequirements
        ? requiredIds.filter((mid) => typeof scores.get(mid)?.score === "number").length
        : 0;
      const total = requiredIds.length;
      return {
        item: it,
        trend,
        completed,
        completedCount,
        total,
      };
    });
  }, [items, requiredMetricIds, scoreMap, trendsById]);

  const progress = useMemo(() => {
    const total = queue.length;
    const done = queue.filter((q) => q.completed).length;
    return { total, done };
  }, [queue]);

  function openTrend(trendId: string) {
    setActiveTrendId(trendId);
    setModalOpen(true);
  }

  const active = useMemo(() => {
    if (!activeTrendId) return null;
    const q = queue.find((x) => x.item.trendId === activeTrendId) ?? null;
    if (!q) return null;
    return q;
  }, [activeTrendId, queue]);

  async function saveScores(trendId: string, cycleItemId: string | undefined, metricScores: Array<{ metricId: string; score?: number; comment?: string }>) {
    if (!cycle) return;
    const res = await fetch("/api/trend-scoring/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        cycleId: cycle.id,
        cycleItemId,
        trendId,
        metricScores,
        status: "Submitted",
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.error) || "Failed to save scores");

    // Update local state (treat submitted as latest).
    const now = new Date().toISOString();
    setAssessments((prev) => {
      const newAssessments: TrendAssessment[] = metricScores.map((ms) => ({
        id: `local:${trendId}:${ms.metricId}:${now}`,
        cycleId: cycle.id,
        cycleItemId,
        trendId,
        expertUserId: "me",
        metricId: ms.metricId,
        score: ms.score,
        comment: ms.comment,
        status: "Submitted",
        submittedAt: now,
      }));
      return latestBySubmittedAt([...prev, ...newAssessments]);
    });
  }

  function nextUnfinished(afterTrendId: string): string | null {
    const idx = queue.findIndex((q) => q.item.trendId === afterTrendId);
    if (idx < 0) return null;
    for (let i = idx + 1; i < queue.length; i++) {
      if (!queue[i].completed) return queue[i].item.trendId;
    }
    for (let i = 0; i < idx; i++) {
      if (!queue[i].completed) return queue[i].item.trendId;
    }
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Navbar />

      <ResizablePanel defaultWidth={320} minWidth={280} maxWidth={520} className="border-r bg-card">
        <div className="p-4 border-b space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Trend Scoring</h2>
            <p className="text-xs text-muted-foreground">
              Score the trends you’ve been invited to assess.
            </p>
          </div>
          <div className="text-sm">
            {cycleLoading ? (
              <span className="text-muted-foreground">Loading…</span>
            ) : cycleError ? (
              <span className="text-destructive">{cycleError}</span>
            ) : cycle ? (
              <div className="space-y-1">
                <div className="font-medium">{cycle.name}</div>
                <div className="text-xs text-muted-foreground">
                  {progress.done}/{progress.total} completed
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">No active cycles.</span>
            )}
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-160px)]">
          <div>
            {cycles.map((c, idx) => {
              const active = c.id === selectedCycleId;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCycleId(c.id)}
                  className={[
                    "px-4 py-3 cursor-pointer transition-colors",
                    idx < cycles.length - 1 ? "border-b border-border" : "",
                    active ? "bg-secondary" : "hover:bg-secondary/50",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{c.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {c.metricIds.length} metrics · {c.expertUserIds.length} experts
                      </div>
                    </div>
                    <Badge variant="secondary">Scoring</Badge>
                  </div>
                </div>
              );
            })}
            {cycles.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                You’re not invited to any active scoring cycles.
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </ResizablePanel>

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {!cycle ? (
            <div className="max-w-2xl mx-auto py-12 text-center text-muted-foreground">
              Select a cycle on the left to start scoring.
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h1 className="text-2xl font-bold">{cycle.name}</h1>
                  <div className="text-sm text-muted-foreground mt-1">
                    {cycle.description ?? "Complete your assessments and use “Save & next” to move quickly."}
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const next = queue.find((q) => !q.completed)?.item.trendId ?? queue[0]?.item.trendId ?? null;
                    if (next) openTrend(next);
                  }}
                  disabled={queue.length === 0}
                >
                  Continue scoring
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left text-xs font-semibold">TREND</th>
                      <th className="p-3 text-left text-xs font-semibold w-40">STATUS</th>
                      <th className="p-3 text-right text-xs font-semibold w-28">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-sm text-muted-foreground">
                          This cycle has no trends assigned yet.
                        </td>
                      </tr>
                    ) : (
                      queue.map((q) => (
                        <tr key={q.item.id} className="border-b last:border-b-0">
                          <td className="p-3">
                            <div className="font-medium text-sm">{q.trend?.name ?? q.item.trendId}</div>
                            {q.trend?.domain ? (
                              <div className="text-xs text-muted-foreground mt-0.5">{q.trend.domain}</div>
                            ) : null}
                          </td>
                          <td className="p-3">
                            {q.total === 0 ? (
                              <Badge variant="outline">No metrics configured</Badge>
                            ) : q.completed ? (
                              <Badge variant="secondary">Completed</Badge>
                            ) : (
                              <Badge variant="outline">
                                {q.completedCount}/{q.total} scored
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <Button variant={q.completed ? "outline" : "default"} onClick={() => openTrend(q.item.trendId)}>
                              {q.completed ? "Review" : "Score"}
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <ScoringModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                cycle={cycle}
                item={active?.item ?? null}
                trend={active?.trend ?? null}
                metrics={metrics}
                requiredMetricIds={requiredMetricIds}
                initialScores={scoreMap.get(activeTrendId ?? "") ?? new Map()}
                onSave={async (metricScores) => {
                  if (!active) return;
                  await saveScores(active.item.trendId, active.item.id, metricScores);
                }}
                onSaveAndNext={async (metricScores) => {
                  if (!active) return;
                  await saveScores(active.item.trendId, active.item.id, metricScores);
                  const next = nextUnfinished(active.item.trendId);
                  if (next) setActiveTrendId(next);
                  else setModalOpen(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoringModal({
  open,
  onOpenChange,
  cycle,
  item,
  trend,
  metrics,
  requiredMetricIds,
  initialScores,
  onSave,
  onSaveAndNext,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycle: TrendCycle;
  item: TrendCycleItem | null;
  trend: Trend | null;
  metrics: TrendScoringMetric[];
  requiredMetricIds: Set<string>;
  initialScores: Map<string, MetricScoreDraft>;
  onSave: (metricScores: Array<{ metricId: string; score?: number; comment?: string }>) => Promise<void>;
  onSaveAndNext: (metricScores: Array<{ metricId: string; score?: number; comment?: string }>) => Promise<void>;
}) {
  const requiredMetrics = useMemo(() => metrics.filter((m) => requiredMetricIds.has(m.id)), [metrics, requiredMetricIds]);

  const [draft, setDraft] = useState<Map<string, MetricScoreDraft>>(new Map());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = new Map<string, MetricScoreDraft>();
    for (const m of requiredMetrics) {
      next.set(m.id, { ...initialScores.get(m.id) });
    }
    setDraft(next);
    setError(null);
  }, [item?.id, requiredMetrics, initialScores]);

  const title = trend?.name ?? (item ? item.trendId : "Trend");

  function toPayload(): Array<{ metricId: string; score?: number; comment?: string }> {
    return requiredMetrics.map((m) => ({
      metricId: m.id,
      score: draft.get(m.id)?.score,
      comment: draft.get(m.id)?.comment,
    }));
  }

  async function handleSave(nextAction: "save" | "saveNext") {
    setSaving(true);
    setError(null);
    try {
      const payload = toPayload();
      if (nextAction === "save") await onSave(payload);
      else await onSaveAndNext(payload);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {cycle.name} · {requiredMetrics.length} metrics
          </DialogDescription>
        </DialogHeader>

        {requiredMetrics.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            This cycle has no metrics configured yet. Ask the cycle owner to add metrics before scoring.
          </div>
        ) : (
          <div className="space-y-4">
            {trend?.description ? (
              <div className="text-sm text-muted-foreground leading-relaxed">{trend.description}</div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredMetrics.map((m) => {
                const min = m.minValue ?? 1;
                const max = m.maxValue ?? 5;
                const step = m.step ?? 1;
                const current = draft.get(m.id) ?? {};
                return (
                  <div key={m.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm">{m.name}</span>
                          <TooltipProvider delayDuration={200}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex text-muted-foreground hover:text-foreground cursor-help">
                                  <Info className="h-3.5 w-3.5 shrink-0" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-sm whitespace-pre-wrap">
                                {m.description || "No description available."}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {typeof current.score === "number" ? current.score : "—"}
                      </Badge>
                    </div>
                    <Input
                      type="number"
                      min={min}
                      max={max}
                      step={step}
                      value={typeof current.score === "number" ? String(current.score) : ""}
                      placeholder={`${min}–${max}`}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setDraft((prev) => {
                          const next = new Map(prev);
                          const entry = { ...(next.get(m.id) ?? {}) };
                          entry.score = raw.trim() ? Number(raw) : undefined;
                          next.set(m.id, entry);
                          return next;
                        });
                      }}
                    />
                    <Input
                      value={current.comment ?? ""}
                      placeholder="Optional comment…"
                      onChange={(e) => {
                        const raw = e.target.value;
                        setDraft((prev) => {
                          const next = new Map(prev);
                          const entry = { ...(next.get(m.id) ?? {}) };
                          entry.comment = raw;
                          next.set(m.id, entry);
                          return next;
                        });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Close
          </Button>
          <Button variant="outline" onClick={() => handleSave("save")} disabled={saving || requiredMetrics.length === 0}>
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button onClick={() => handleSave("saveNext")} disabled={saving || requiredMetrics.length === 0}>
            {saving ? "Saving…" : "Save & next"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

