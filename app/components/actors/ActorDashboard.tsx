"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DomainContentItem } from "@/app/types/domainContent";

interface ActorDashboardProps {
  actions: DomainContentItem[];
  /** Map of domain id → name for domain labels in charts */
  domainNames?: Record<string, string>;
}

interface TimeSeriesData {
  period: string;
  count: number;
}

interface DomainShare {
  name: string;
  value: number;
  color: string;
}

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe',
  '#00c49f', '#ffbb28', '#ff8042', '#a4de6c', '#d0ed57'
];

export function ActorDashboard({ actions, domainNames = {} }: ActorDashboardProps) {
  const [activeTab, setActiveTab] = useState<"portfolio" | "timeline">("portfolio");

  // Calculate total signals
  const totalSignals = actions.length;

  // Calculate total unique domains covered (excluding Unknown)
  const totalDomains = useMemo(() => {
    const uniqueDomainIds = new Set<string>();
    actions.forEach(action => {
      const domainId = action.metadata?.domainId;
      if (domainId && domainNames[domainId]) {
        uniqueDomainIds.add(domainId);
      }
    });
    return uniqueDomainIds.size;
  }, [actions, domainNames]);

  // Calculate share of signals across domains
  const domainShare = useMemo(() => {
    const domainCounts: Record<string, number> = {};
    
    actions.forEach(action => {
      const domainId = action.metadata?.domainId;
      if (domainId) {
        const domainName = domainNames[domainId] ?? domainId;
        domainCounts[domainName] = (domainCounts[domainName] || 0) + 1;
      } else {
        domainCounts['Unknown'] = (domainCounts['Unknown'] || 0) + 1;
      }
    });

    return Object.entries(domainCounts)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value); // Sort by count descending
  }, [actions, domainNames]);

  // Calculate signals over time (by quarter)
  const timeSeriesData = useMemo(() => {
    const periodCounts: Record<string, number> = {};
    
    actions.forEach(action => {
      if (action.date) {
        try {
          const date = new Date(action.date);
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          const year = date.getFullYear();
          // Format as "22/Q1" (last 2 digits of year)
          const yearShort = year.toString().slice(-2);
          const period = `${yearShort}/Q${quarter}`;
          periodCounts[period] = (periodCounts[period] || 0) + 1;
        } catch {
          // Skip invalid dates
        }
      }
    });

    // Sort periods chronologically
    const sortedPeriods = Object.keys(periodCounts).sort((a, b) => {
      const [yearA, qA] = a.split('/Q').map(v => parseInt(v));
      const [yearB, qB] = b.split('/Q').map(v => parseInt(v));
      // Handle 2-digit years (22, 23, etc.) vs 4-digit years
      const fullYearA = yearA < 100 ? 2000 + yearA : yearA;
      const fullYearB = yearB < 100 ? 2000 + yearB : yearB;
      if (fullYearA !== fullYearB) return fullYearA - fullYearB;
      return qA - qB;
    });

    return sortedPeriods.map(period => ({
      period,
      count: periodCounts[period]
    }));
  }, [actions]);

  const chartConfig = {
    count: {
      label: "Signals",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="border rounded-lg bg-card mt-8">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "portfolio" | "timeline")} className="w-full">
        <TabsList className="w-full justify-start rounded-t-lg rounded-b-none border-b bg-muted/50 h-auto p-0">
          <TabsTrigger value="portfolio" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            Innovation Portfolio
          </TabsTrigger>
          <TabsTrigger value="timeline" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Innovation Timeline
          </TabsTrigger>
        </TabsList>

        {/* Innovation Portfolio Tab */}
        <TabsContent value="portfolio" className="p-6 m-0">
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalSignals}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total Signals</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sub-Areas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalDomains}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total Sub-Areas</p>
                </CardContent>
              </Card>
            </div>

            {/* Innovation Portfolio - Doughnut Chart */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Innovation Portfolio</h3>
              {domainShare.length > 0 ? (
                <div className="space-y-4">
                  <ChartContainer config={chartConfig} className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={domainShare}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          innerRadius={50}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {domainShare.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0];
                              const total = domainShare.reduce((sum, item) => sum + item.value, 0);
                              const percent = ((data.value as number) / total * 100).toFixed(0);
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                  <div className="grid gap-2">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2 w-2 rounded-full"
                                        style={{ backgroundColor: data.payload.fill }}
                                      />
                                      <span className="text-sm font-medium">{data.name}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {data.value} ({percent}%)
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  {/* Legend below chart with proper spacing */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center px-4">
                    {domainShare.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm" style={{ color: entry.color }}>
                          {entry.name} {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No domain data available
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Innovation Timeline Tab */}
        <TabsContent value="timeline" className="p-6 m-0">
          <div>
            <h3 className="text-lg font-semibold mb-4">Innovation Timeline</h3>
            {timeSeriesData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="period" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Legend />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                No time series data available
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
