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
import { Download, FileText, MessageSquare, FileText as FileTextIcon, BarChart3, PieChart } from "lucide-react";
import { MarkdownContent } from "@/app/components/ui/markdown-content";
import type { Report } from "@/app/types/reports";

interface DomainReportsSectionProps {
  reports: Report[];
  domainNames?: Record<string, string>;
}

type ReportTab = "reports" | "charts" | "analyses";

function formatList(value: string | string[] | undefined): string {
  if (!value) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return String(value);
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
        <DialogHeader>
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

export function DomainReportsSection({ reports, domainNames = {} }: DomainReportsSectionProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>("reports");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (report.source && report.source.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleReportClick = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  if (reports.length === 0) {
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
          <div className="text-center py-12 text-muted-foreground">
            <p>Charts section coming soon.</p>
          </div>
        </TabsContent>

        <TabsContent value="analyses" className="mt-0">
          <div className="text-center py-12 text-muted-foreground">
            <p>Analyses section coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>

      <ReportDetailModal
        report={selectedReport}
        domainNames={domainNames}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
