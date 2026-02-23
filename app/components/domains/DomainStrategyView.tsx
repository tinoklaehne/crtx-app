"use client";

import { useState, useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  Cell,
} from "recharts";
import type { DomainStrategyData, StrategyTheme, StrategyQuestion, StrategyProblem } from "@/app/types/strategy";
import { cn } from "@/lib/utils";

// Color maps (aligned with MVP)
const PRIORITY_COLORS: Record<string, string> = { P0: "#ef4444", P1: "#f59e0b", P2: "#6b7280" };
const PRIORITY_BG: Record<string, string> = {
  P0: "rgba(239,68,68,0.15)",
  P1: "rgba(245,158,11,0.15)",
  P2: "rgba(107,114,128,0.15)",
};
const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f59e0b",
  Medium: "#3b82f6",
  Low: "#6b7280",
};
const PAIN_COLORS: Record<string, string> = {
  cost: "#ef4444",
  reliability: "#8b5cf6",
  workload: "#f59e0b",
  delay: "#3b82f6",
  compliance: "#10b981",
};
const READINESS_LABELS: Record<string, string> = {
  idea: "Idea",
  shaped: "Shaped",
  ready: "Ready",
  in_progress: "In Progress",
};
const FREQ_ORDER: Record<string, number> = { "event-driven": 1, monthly: 2, weekly: 3, daily: 4 };
const SEV_ORDER: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex-1 min-w-[140px] rounded-xl border border-border bg-card p-5">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-3xl font-extrabold leading-none" style={{ color: accent ?? "var(--foreground)" }}>
        {value}
      </div>
      {sub && <div className="mt-1.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function PriorityBadge({ p }: { p: string }) {
  const bg = PRIORITY_BG[p] ?? "rgba(107,114,128,0.15)";
  const color = PRIORITY_COLORS[p] ?? "#6b7280";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
      style={{ background: bg, color }}
    >
      {p}
    </span>
  );
}

function SeverityBadge({ s }: { s: string }) {
  const bg = `${SEVERITY_COLORS[s] ?? "#6b7280"}26`;
  const color = SEVERITY_COLORS[s] ?? "#6b7280";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ background: bg, color }}
    >
      {s}
    </span>
  );
}

function PainBadge({ p }: { p: string }) {
  const color = PAIN_COLORS[p] ?? "#6b7280";
  const bg = `${color}22`;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ background: bg, color }}
    >
      {p}
    </span>
  );
}

function TimeBadge({ t }: { t: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}
    >
      {t}
    </span>
  );
}

// ─── Overview ─────────────────────────────────────────────────

function ThemeCard({
  theme,
  linkedQuestions,
  linkedProblems,
  isExpanded,
  onToggle,
}: {
  theme: StrategyTheme;
  linkedQuestions: StrategyQuestion[];
  linkedProblems: StrategyProblem[];
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-border bg-card transition-all">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center gap-3 p-4 text-left hover:bg-muted/30"
      >
        <span
          className="text-muted-foreground text-[13px] transition-transform"
          style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
        >
          ▶
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-bold text-foreground">{theme.name}</span>
            <PriorityBadge p={theme.priority} />
            <TimeBadge t={theme.time_horizon} />
            {theme.value_levers.map((v) => (
              <span
                key={v}
                className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {v}
              </span>
            ))}
          </div>
          <div className="mt-1.5 text-[13px] text-muted-foreground">{theme.one_liner}</div>
        </div>
        <div className="flex shrink-0 gap-4 text-xs text-muted-foreground">
          <span>{linkedQuestions.length} Q</span>
          <span>{linkedProblems.length} P</span>
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-6 pb-5">
          <div className="grid grid-cols-1 gap-4 py-4 text-[13px] md:grid-cols-2">
            <div>
              <div className="mb-1 font-semibold text-muted-foreground">Strategic Intent</div>
              <div className="text-muted-foreground/90">{theme.strategic_intent}</div>
            </div>
            <div>
              <div className="mb-1 font-semibold text-muted-foreground">Scope Boundary</div>
              <div className="text-muted-foreground/90">{theme.scope_boundary}</div>
            </div>
          </div>

          {linkedQuestions.length > 0 && (
            <div className="mt-2">
              <div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Strategic Questions ({linkedQuestions.length})
              </div>
              {linkedQuestions.map((q) => (
                <div
                  key={q.id}
                  className="mb-2 rounded-lg border-l-4 bg-muted/30 p-3"
                  style={{
                    borderLeftColor: q.urgency === "High" ? "#f59e0b" : "#3b82f6",
                  }}
                >
                  <div className="text-[13px] font-semibold text-foreground">{q.question}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}
                    >
                      {q.question_type}
                    </span>
                    <span
                      className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                      style={{
                        background: q.urgency === "High" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)",
                        color: q.urgency === "High" ? "#f59e0b" : "#3b82f6",
                      }}
                    >
                      Urgency: {q.urgency}
                    </span>
                    <span
                      className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground"
                      style={{ background: "rgba(107,114,128,0.15)" }}
                    >
                      Confidence: {q.confidence}/5
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {linkedProblems.length > 0 && (
            <div className="mt-4">
              <div className="mb-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Problems ({linkedProblems.length})
              </div>
              {linkedProblems.map((p) => (
                <div
                  key={p.id}
                  className="mb-2 flex items-start gap-3 rounded-lg bg-muted/30 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-foreground">{p.summary}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{p.impact_estimate}</div>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <SeverityBadge s={p.severity} />
                    <PainBadge p={p.pain_type} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OverviewView({ data }: { data: DomainStrategyData }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(data.themes[0]?.id ? [data.themes[0].id] : []));
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const p0 = data.themes.filter((t) => t.priority === "P0");
  const p1 = data.themes.filter((t) => t.priority === "P1");
  const p2 = data.themes.filter((t) => t.priority === "P2");
  const groups = [
    { label: "Critical Priority", themes: p0, color: "#ef4444" },
    { label: "High Priority", themes: p1, color: "#f59e0b" },
    { label: "Watch", themes: p2, color: "#6b7280" },
  ].filter((g) => g.themes.length > 0);

  return (
    <div>
      <div className="mb-6 flex gap-3">
        <StatCard
          label="Themes"
          value={data.themes.length}
          sub={`${p0.length} critical priority`}
          accent="#fafafa"
        />
        <StatCard
          label="Open Questions"
          value={data.questions.filter((q) => q.answer_status === "Open").length}
          sub={`${data.questions.filter((q) => q.urgency === "High").length} high urgency`}
          accent="#f59e0b"
        />
        <StatCard
          label="Problems"
          value={data.problems.length}
          sub={`${data.problems.filter((p) => p.severity === "Critical").length} critical severity`}
          accent="#ef4444"
        />
        <StatCard
          label="Readiness"
          value={`${data.problems.filter((p) => p.readiness === "shaped").length}/${data.problems.length}`}
          sub="shaped or beyond"
          accent="#10b981"
        />
      </div>

      {groups.map((group) => (
        <div key={group.label} className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <div
              className="h-4 w-0.5 rounded"
              style={{ background: group.color }}
            />
            <span className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </span>
          </div>
          {group.themes.map((t) => (
            <ThemeCard
              key={t.id}
              theme={t}
              linkedQuestions={data.questions.filter((q) => t.questionIds.includes(q.id))}
              linkedProblems={data.problems.filter((p) => t.problemIds.includes(p.id))}
              isExpanded={expanded.has(t.id)}
              onToggle={() => toggle(t.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Problem Radar ─────────────────────────────────────────────

function ProblemRadarView({ data }: { data: DomainStrategyData }) {
  const scatterData = useMemo(
    () =>
      data.problems.map((p) => ({
        x: SEV_ORDER[p.severity] ?? 1,
        y: FREQ_ORDER[p.frequency] ?? 1,
        z: 200,
        name: p.summary,
        severity: p.severity,
        frequency: p.frequency,
        pain_type: p.pain_type,
        impact: p.impact_estimate,
        fill: PAIN_COLORS[p.pain_type] ?? "#6b7280",
        id: p.id,
      })),
    [data.problems]
  );

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof scatterData[0] }> }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="max-w-[320px] rounded-xl border border-border bg-card p-4 shadow-lg">
        <div className="mb-2 text-[13px] font-bold text-foreground">{d.name}</div>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <SeverityBadge s={d.severity} />
          <PainBadge p={d.pain_type} />
          <span
            className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground"
            style={{ background: "rgba(107,114,128,0.15)" }}
          >
            {d.frequency}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">{d.impact}</div>
      </div>
    );
  };

  const painTypes = useMemo(() => [...new Set(data.problems.map((p) => p.pain_type))], [data.problems]);
  const sortedProblems = useMemo(
    () => [...data.problems].sort((a, b) => (SEV_ORDER[b.severity] ?? 0) - (SEV_ORDER[a.severity] ?? 0)),
    [data.problems]
  );

  return (
    <div>
      <div className="mb-6 flex gap-3">
        <StatCard label="Critical" value={data.problems.filter((p) => p.severity === "Critical").length} accent="#ef4444" />
        <StatCard label="High" value={data.problems.filter((p) => p.severity === "High").length} accent="#f59e0b" />
        <StatCard label="Medium" value={data.problems.filter((p) => p.severity === "Medium").length} accent="#3b82f6" />
        <StatCard
          label="Shaped"
          value={data.problems.filter((p) => p.readiness === "shaped").length}
          sub="ready for action"
          accent="#10b981"
        />
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[15px] font-bold text-foreground">Problem Landscape</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Severity × Frequency — colored by pain type
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {painTypes.map((pt) => (
              <div key={pt} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: PAIN_COLORS[pt] ?? "#6b7280" }}
                />
                <span className="text-[11px] text-muted-foreground">{pt}</span>
              </div>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={340}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[0.5, 4.5]}
              ticks={[1, 2, 3, 4]}
              tickFormatter={(v) => ["", "Low", "Medium", "High", "Critical"][v]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0.5, 4.5]}
              ticks={[1, 2, 3, 4]}
              tickFormatter={(v) => ["", "Event", "Monthly", "Weekly", "Daily"][v]}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <ZAxis type="number" dataKey="z" range={[180, 400]} />
            <RTooltip content={<CustomTooltip />} />
            <Scatter data={scatterData}>
              {scatterData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} fillOpacity={0.8} stroke={entry.fill} strokeWidth={2} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">All Problems</div>
      {sortedProblems.map((p) => {
        const theme = data.themes.find((t) => t.id === p.themeId);
        return (
          <div
            key={p.id}
            className="mb-2 flex items-center gap-4 rounded-xl border border-border bg-card p-4"
          >
            <div
              className="h-9 w-1 shrink-0 rounded"
              style={{ background: SEVERITY_COLORS[p.severity] ?? "#6b7280" }}
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">{p.summary}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{p.who_feels_pain}</div>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
              <SeverityBadge s={p.severity} />
              <PainBadge p={p.pain_type} />
              <span
                className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground"
                style={{ background: "rgba(107,114,128,0.15)" }}
              >
                {p.frequency}
              </span>
              <span
                className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                style={{
                  background: p.readiness === "shaped" ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.1)",
                  color: p.readiness === "shaped" ? "#10b981" : "#71717a",
                }}
              >
                {READINESS_LABELS[p.readiness] ?? p.readiness}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Question Board ───────────────────────────────────────────

const QUESTION_COLUMNS = [
  { key: "Open", label: "Open", color: "#3b82f6" },
  { key: "In Progress", label: "In Progress", color: "#f59e0b" },
  { key: "Answered", label: "Answered", color: "#10b981" },
] as const;

function QuestionBoardView({ data }: { data: DomainStrategyData }) {
  const getByStatus = (status: string) => data.questions.filter((q) => q.answer_status === status);

  return (
    <div>
      <div className="mb-6 flex gap-3">
        <StatCard label="Total Questions" value={data.questions.length} accent="#fafafa" />
        <StatCard
          label="High Urgency"
          value={data.questions.filter((q) => q.urgency === "High").length}
          accent="#f59e0b"
        />
        <StatCard
          label="Avg Confidence"
          value={
            data.questions.length
              ? (data.questions.reduce((a, q) => a + q.confidence, 0) / data.questions.length).toFixed(1) + "/5"
              : "0/5"
          }
          accent="#818cf8"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {QUESTION_COLUMNS.map((col) => {
          const qs = getByStatus(col.key);
          return (
            <div key={col.key}>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />
                <span className="text-[13px] font-bold text-muted-foreground">{col.label}</span>
                <span className="ml-1 text-xs font-semibold text-muted-foreground/80">{qs.length}</span>
              </div>
              <div className="min-h-[200px]">
                {qs.map((q) => {
                  const theme = data.themes.find((t) => t.id === q.themeId);
                  const linkedP = data.problems.filter((p) => q.problemIds.includes(p.id));
                  return (
                    <div
                      key={q.id}
                      className="mb-2.5 rounded-xl border border-border bg-card p-4"
                      style={{ borderLeftWidth: 3, borderLeftColor: col.color }}
                    >
                      <div className="mb-2.5 text-[13px] font-semibold leading-snug text-foreground">
                        {q.question}
                      </div>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <span
                          className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{ background: "rgba(99,102,241,0.12)", color: "#818cf8" }}
                        >
                          {q.question_type}
                        </span>
                        <span
                          className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{
                            background: q.urgency === "High" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.15)",
                            color: q.urgency === "High" ? "#f59e0b" : "#3b82f6",
                          }}
                        >
                          {q.urgency}
                        </span>
                      </div>
                      {theme && (
                        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: PRIORITY_COLORS[theme.priority] ?? "#6b7280" }}
                          />
                          {theme.name}
                        </div>
                      )}
                      {linkedP.length > 0 && (
                        <div className="mt-1.5 text-[11px] text-muted-foreground">
                          {linkedP.length} linked problem{linkedP.length !== 1 ? "s" : ""}
                        </div>
                      )}
                      <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2">
                        <span className="text-[11px] text-muted-foreground">Confidence</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={cn("h-1 w-3.5 rounded-sm", i <= q.confidence ? "bg-indigo-500" : "bg-muted")}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {qs.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-card py-8 text-center text-[13px] text-muted-foreground">
                    No questions
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────

type StrategySubView = "overview" | "problems" | "questions";

export function DomainStrategyView({ strategy }: { strategy: DomainStrategyData }) {
  const [subView, setSubView] = useState<StrategySubView>("overview");

  const pill = (active: boolean) =>
    cn(
      "rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-all",
      active
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div>
      <div className="mb-6 inline-flex gap-1 rounded-lg bg-muted p-1">
        {(
          [
            { key: "overview" as const, label: "Overview" },
            { key: "problems" as const, label: "Problems" },
            { key: "questions" as const, label: "Questions" },
          ] as const
        ).map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setSubView(v.key)}
            className={pill(subView === v.key)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {subView === "overview" && <OverviewView data={strategy} />}
      {subView === "problems" && <ProblemRadarView data={strategy} />}
      {subView === "questions" && <QuestionBoardView data={strategy} />}
    </div>
  );
}
