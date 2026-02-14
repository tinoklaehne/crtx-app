"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, ChevronRight } from "lucide-react";
import type { DomainContentItem } from "@/app/types/domainContent";

interface DomainDashboardProps {
  items: DomainContentItem[];
}

interface TimeSeriesData {
  period: string;
  count: number;
}

interface SignalTypeShare {
  name: string;
  value: number;
  color: string;
}

type DateRange = "all" | "24h" | "7d" | "30d" | "90d" | "12m" | "quarter";
type TimeUnit = "year" | "quarter" | "month" | "week";

const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe',
  '#00c49f', '#ffbb28', '#ff8042', '#a4de6c', '#d0ed57'
];

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  all: "All",
  "24h": "Last 24 Hours",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  "12m": "Last 12 Months",
  quarter: "Quarter to Date",
};

const TIME_UNIT_LABELS: Record<TimeUnit, string> = {
  year: "Year",
  quarter: "Quarter",
  month: "Month",
  week: "Week",
};

export function DomainDashboard({ items }: DomainDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [timeUnit, setTimeUnit] = useState<TimeUnit>("year");

  // Filter items based on date range
  const filteredItems = useMemo(() => {
    if (dateRange === "all") return items;

    const now = new Date();
    const startDate = new Date();

    switch (dateRange) {
      case "24h":
        startDate.setHours(now.getHours() - 24);
        break;
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "12m":
        startDate.setMonth(now.getMonth() - 12);
        break;
      case "quarter":
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate.setMonth(currentQuarter * 3, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    return items.filter(item => {
      if (!item.date) return false;
      try {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= now;
      } catch {
        return false;
      }
    });
  }, [items, dateRange]);

  // Calculate signals over time grouped by selected unit
  const timeSeriesData = useMemo(() => {
    const periodCounts: Record<string, number> = {};
    
    filteredItems.forEach(item => {
      if (item.date) {
        try {
          const date = new Date(item.date);
          let period: string;

          switch (timeUnit) {
            case "year":
              period = date.getFullYear().toString();
              break;
            case "quarter":
              const quarter = Math.floor(date.getMonth() / 3) + 1;
              period = `Q${quarter} ${date.getFullYear()}`;
              break;
            case "month":
              const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              period = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
              break;
            case "week":
              // Get week number and year
              const weekStart = new Date(date);
              weekStart.setDate(date.getDate() - date.getDay());
              const weekNum = Math.ceil((date.getDate() - weekStart.getDate() + 1) / 7);
              period = `W${weekNum} ${date.getFullYear()}`;
              break;
            default:
              period = date.getFullYear().toString();
          }

          periodCounts[period] = (periodCounts[period] || 0) + 1;
        } catch (e) {
          // Skip invalid dates
        }
      }
    });

    // Sort periods
    const sortedPeriods = Object.keys(periodCounts).sort((a, b) => {
      // For years, simple numeric sort
      if (timeUnit === "year") {
        return parseInt(a) - parseInt(b);
      }
      // For other formats, try to extract year and compare
      const yearA = parseInt(a.match(/\d{4}/)?.[0] || "0");
      const yearB = parseInt(b.match(/\d{4}/)?.[0] || "0");
      if (yearA !== yearB) return yearA - yearB;
      
      // If same year, compare by period identifier
      if (timeUnit === "quarter") {
        const qA = parseInt(a.match(/Q(\d)/)?.[1] || "0");
        const qB = parseInt(b.match(/Q(\d)/)?.[1] || "0");
        return qA - qB;
      }
      if (timeUnit === "month") {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthA = monthNames.indexOf(a.split(" ")[0]);
        const monthB = monthNames.indexOf(b.split(" ")[0]);
        return monthA - monthB;
      }
      if (timeUnit === "week") {
        const wA = parseInt(a.match(/W(\d+)/)?.[1] || "0");
        const wB = parseInt(b.match(/W(\d+)/)?.[1] || "0");
        return wA - wB;
      }
      return a.localeCompare(b);
    });

    return sortedPeriods.map(period => ({
      period,
      count: periodCounts[period]
    }));
  }, [filteredItems, timeUnit]);

  // Calculate share of signal types
  const signalTypeShare = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    
    filteredItems.forEach(item => {
      const type = item.signalType || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return Object.entries(typeCounts)
      .map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value); // Sort by count descending
  }, [filteredItems]);

  // Calculate total signals
  const totalSignals = filteredItems.length;

  // Calculate signals this month
  const signalsThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return filteredItems.filter(item => {
      if (!item.date) return false;
      try {
        const date = new Date(item.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      } catch {
        return false;
      }
    }).length;
  }, [filteredItems]);

  const chartConfig = {
    count: {
      label: "Signals",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Big Numbers */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSignals.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Signals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{signalsThisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">This Month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Momentum Chart - Signals over time */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>MOMENTUM</CardTitle>
                <CardDescription>Signals over time</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {/* Date Range and Unit Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Date Range</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.entries(DATE_RANGE_LABELS).map(([value, label]) => (
                      <DropdownMenuItem
                        key={value}
                        onClick={() => setDateRange(value as DateRange)}
                        className="cursor-pointer"
                      >
                        {dateRange === value ? (
                          <span className="mr-2">✓</span>
                        ) : (
                          <span className="mr-2 w-4"></span>
                        )}
                        {label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <span>Unit</span>
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        {Object.entries(TIME_UNIT_LABELS).map(([value, label]) => (
                          <DropdownMenuItem
                            key={value}
                            onClick={() => setTimeUnit(value as TimeUnit)}
                            className="cursor-pointer"
                          >
                            {timeUnit === value ? (
                              <span className="mr-2">✓</span>
                            ) : (
                              <span className="mr-2 w-4"></span>
                            )}
                            {label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {timeSeriesData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
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
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No time series data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signal Share Chart - Donut chart */}
        <Card>
          <CardHeader>
            <CardTitle>SIGNAL SHARE</CardTitle>
            <CardDescription>Share of signal types</CardDescription>
          </CardHeader>
          <CardContent>
            {signalTypeShare.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={signalTypeShare}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {signalTypeShare.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0];
                          const total = signalTypeShare.reduce((sum, item) => sum + item.value, 0);
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
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No signal type data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
