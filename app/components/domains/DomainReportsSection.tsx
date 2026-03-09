"use client";

import { useState } from "react";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, MessageSquare, FileText as FileTextIcon, BarChart3, PieChart, ExternalLink } from "lucide-react";
import { MarkdownContent } from "@/app/components/ui/markdown-content";
import type { Report } from "@/app/types/reports";
import type { Chart } from "@/app/types/charts";
import type { Analysis } from "@/app/types/analyses";

interface DomainReportsSectionProps {
  reports: Report[];
  charts?: Chart[];
  analyses?: Analysis[];
  domainNames?: Record<string, string>;
}

type ReportTab = "reports" | "charts" | "analyses";

function formatList(value: string | string[] | undefined): string {
  if (!value) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return String(value);
}

function formatDate(value: string | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString();
}

function toDisplayText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object" && "value" in value) {
    const inner = (value as { value?: unknown }).value;
    if (typeof inner === "string") return inner;
    if (typeof inner === "number" || typeof inner === "boolean") return String(inner);
  }
  return "";
}

function ReportDetailModal({
  report,
  domainNames = {},
  isOpen,
  onClose,
}: {
  report: Report | null;
  domainNames?: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  if (!report) return null;

  const handleDownloadFile = () => {
    if (report.fileUrl) {
      window.open(report.fileUrl, '_blank');
    }
  };

  const handleReportTranscript = () => {
    setIsTranscriptOpen(true);
  };

  const handleChatWithReport = () => {
    // TODO: Implement chat with report functionality
    console.log('Chat with Report clicked for:', report.id);
  };

  const keyInsights = report.keyInsights 
    ? (Array.isArray(report.keyInsights) ? report.keyInsights : [report.keyInsights])
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pr-12">
          <div className="flex items-center gap-4">
            {report.sourceLogo && (
              <Image
                src={report.sourceLogo}
                alt={report.source || report.name}
                width={48}
                height={48}
                className="w-12 h-12 object-contain flex-shrink-0"
              />
            )}
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">{report.name}</DialogTitle>
              {report.source && (
                <p className="text-base text-muted-foreground mt-1">{report.source}</p>
              )}
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex gap-3 pb-4 border-b">
              <Button
                variant="outline"
                onClick={handleDownloadFile}
                disabled={!report.fileUrl}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download File
              </Button>
              <Button
                variant="outline"
                onClick={handleReportTranscript}
                disabled={!report.transcript}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Report Transcript
              </Button>
              <Button
                variant="outline"
                disabled
                className="flex items-center gap-2 cursor-not-allowed opacity-60"
              >
                <MessageSquare className="h-4 w-4" />
                Chat with Report (coming soon)
              </Button>
            </div>

            {/* Year and Domain Tags */}
            {(report.year || (report.subAreaIds ?? []).length > 0) && (
              <div className="flex flex-wrap gap-2">
                {report.year && (
                  <Badge variant="default" className="bg-primary text-primary-foreground">
                    {String(report.year)}
                  </Badge>
                )}
                {(report.subAreaIds ?? [])
                  .map(id => domainNames[id])
                  .filter(Boolean)
                  .map((domainName, index) => (
                    <Badge key={index} variant="secondary">
                      {domainName}
                    </Badge>
                  ))}
              </div>
            )}

            {/* Executive Summary */}
            {report.summary && (
              <div>
                <h2 className="text-xl font-bold mb-3">Executive Summary</h2>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <MarkdownContent content={report.summary} />
                </div>
              </div>
            )}

            {/* Key Insights */}
            {keyInsights.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">Key Insights</h2>
                <ol className="list-decimal list-inside space-y-2">
                  {keyInsights.map((insight, index) => (
                    <li key={index} className="text-sm">
                      {typeof insight === 'string' ? insight : String(insight)}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Keywords */}
            {report.keywords && (
              <div>
                <h2 className="text-xl font-bold mb-3">Keywords</h2>
                <p className="text-sm">{formatList(report.keywords)}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>

      {/* Transcript Modal */}
      <Dialog open={isTranscriptOpen} onOpenChange={setIsTranscriptOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Report Transcript</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {report.transcript ? (
                <MarkdownContent content={report.transcript} />
              ) : (
                <p className="text-muted-foreground">No transcript available.</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function ChartPreviewModal({
  chart,
  domainNames = {},
  isOpen,
  onClose,
}: {
  chart: Chart | null;
  domainNames?: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!chart) return null;

  const createdLabel = formatDate(chart.createdAt);
  const linkedDomains = (chart.domainIds ?? [])
    .map((id) => toDisplayText(domainNames[id]) || toDisplayText(id))
    .filter(Boolean);
  const chartTitle = toDisplayText(chart.title) || "Untitled chart";
  const chartSummary = toDisplayText(chart.aiSummary);
  const chartTextArea = toDisplayText(chart.textArea);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto pr-14">
        <DialogHeader className="pr-16">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-2xl font-bold">{chartTitle}</DialogTitle>
            <Button
              variant="outline"
              onClick={() => chart.sourceUrl && window.open(chart.sourceUrl, "_blank", "noopener,noreferrer")}
              disabled={!chart.sourceUrl}
              className="shrink-0 mr-4"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Go to Source
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-5 pr-1">
          <div>
            <h3 className="text-lg font-semibold mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {createdLabel && (
                <Badge variant="default" className="bg-primary text-primary-foreground">
                  {createdLabel}
                </Badge>
              )}
              {linkedDomains.map((domain, index) => (
                <Badge key={`${domain}-${index}`} variant="secondary">
                  {domain}
                </Badge>
              ))}
              {chartTextArea && (
                <Badge variant="outline">{chartTextArea}</Badge>
              )}
            </div>
          </div>

          <div className="border rounded-lg bg-muted/30 p-3">
            {chart.imageUrl ? (
              <Image
                src={chart.imageUrl}
                alt={chartTitle || "Chart preview"}
                width={1400}
                height={900}
                className="w-full h-auto object-contain rounded-md"
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                No chart preview image available.
              </div>
            )}
          </div>

          <div className="pb-2">
            <h3 className="text-lg font-semibold mb-2">AI Summary</h3>
            {chartSummary ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{chartSummary}</p>
            ) : (
              <p className="text-sm text-muted-foreground">No AI summary available.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function DomainReportsSection({ reports, charts = [], analyses = [], domainNames = {} }: DomainReportsSectionProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>(
    reports.length > 0 ? "reports" : charts.length > 0 ? "charts" : "analyses"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState<Chart | null>(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (report.source && report.source.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleChartClick = (chart: Chart) => {
    setSelectedChart(chart);
    setIsChartModalOpen(true);
  };

  if (reports.length === 0 && charts.length === 0 && analyses.length === 0) {
    return null; // Don't show section if no reports
  }

  return (
    <div className="mt-12 border-t pt-8">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportTab)}>
        <div className="flex items-center justify-between mb-6">
          <TabsList>
            <TabsTrigger value="reports" className="gap-2">
              <FileTextIcon className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="charts" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="analyses" className="gap-2">
              <PieChart className="h-4 w-4" />
              Analyses
            </TabsTrigger>
          </TabsList>
          {activeTab === "reports" && (
            <div className="flex items-center gap-3">
              <Input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48"
              />
              <Button variant="outline" size="sm">
                + Add
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.location.href = '/library'}>
                Report Library
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="reports" className="mt-0">
          <div className="overflow-x-auto pb-4 -mx-6 px-6">
            <div className="flex gap-4 min-w-max">
              {filteredReports.length === 0 ? (
                <div className="w-full text-center py-12 text-muted-foreground">
                  <p>No reports found matching your search.</p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => handleReportClick(report)}
                    className="flex-shrink-0 w-64 bg-card border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {report.sourceLogo ? (
                        <Image
                          src={report.sourceLogo}
                          alt={report.source || report.name}
                          width={200}
                          height={200}
                          className="w-full h-full object-contain p-4"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl text-muted-foreground">
                            {report.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{report.name}</h3>
                    {report.source && (
                      <p className="text-xs text-muted-foreground">{report.source}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="mt-0">
          <div className="overflow-x-auto pb-4 -mx-6 px-6">
            <div className="flex gap-4 min-w-max">
              {charts.length === 0 ? (
                <div className="w-full text-center py-12 text-muted-foreground">
                  <p>No charts available for this domain yet.</p>
                </div>
              ) : (
                charts.map((chart) => (
                  <div
                    key={chart.id}
                    onClick={() => handleChartClick(chart)}
                    className="flex-shrink-0 w-80 bg-card border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {chart.imageUrl ? (
                        <Image
                          src={chart.imageUrl}
                          alt={toDisplayText(chart.title) || "Chart preview"}
                          width={520}
                          height={300}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                          No preview
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                      {toDisplayText(chart.title) || "Untitled chart"}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {formatDate(chart.createdAt) && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          {formatDate(chart.createdAt)}
                        </Badge>
                      )}
                      {toDisplayText(chart.textArea) && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {toDisplayText(chart.textArea)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analyses" className="mt-0">
          <div className="space-y-3">
            {analyses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No analyses available for this domain yet.</p>
              </div>
            ) : (
              analyses.map((analysis) => {
                const hasSource = Boolean(analysis.sourceUrl);
                return (
                  <button
                    key={analysis.id}
                    type="button"
                    disabled={!hasSource}
                    onClick={() => {
                      if (!analysis.sourceUrl) return;
                      window.open(analysis.sourceUrl, "_blank", "noopener,noreferrer");
                    }}
                    className={`w-full text-left p-4 border rounded-lg transition-colors ${
                      hasSource
                        ? "bg-card hover:bg-muted/40 cursor-pointer"
                        : "bg-muted/30 text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    <h3 className="font-semibold text-sm mb-1">
                      {toDisplayText(analysis.title) || "Untitled analysis"}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {toDisplayText(analysis.shortDescription) || "No short description available."}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ReportDetailModal
        report={selectedReport}
        domainNames={domainNames}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <ChartPreviewModal
        chart={selectedChart}
        domainNames={domainNames}
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
      />
    </div>
  );
}
