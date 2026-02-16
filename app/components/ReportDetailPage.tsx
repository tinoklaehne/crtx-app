"use client";

import { Suspense } from "react";
import { Navbar } from "@/app/components/layout/Navbar";
import { LibrarySidepanel } from "@/app/components/library/LibrarySidepanel";
import { Button } from "@/components/ui/button";
import { Download, FileText, MessageSquare } from "lucide-react";
import { MarkdownContent } from "@/app/components/ui/markdown-content";
import type { Report } from "@/app/types/reports";

interface ReportDetailPageProps {
  report: Report;
  /** Map of domain record id → name (for Sub-Area labels) */
  domainNames?: Record<string, string>;
  /** All reports for the sidepanel */
  allReports?: Report[];
}

function formatList(value: string | string[] | undefined): string {
  if (!value) return "";
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return String(value);
}

export function ReportDetailPage({ report, domainNames = {}, allReports = [] }: ReportDetailPageProps) {
  const handleDownloadFile = () => {
    if (report.fileUrl) {
      window.open(report.fileUrl, '_blank');
    }
  };

  const handleReportTranscript = () => {
    // TODO: Implement report transcript functionality
    console.log('Report Transcript clicked for:', report.id);
  };

  const handleChatWithReport = () => {
    // TODO: Implement chat with report functionality
    console.log('Chat with Report clicked for:', report.id);
  };

  const keyInsights = report.keyInsights 
    ? (Array.isArray(report.keyInsights) ? report.keyInsights : [report.keyInsights])
    : [];

  return (
    <div className="flex h-screen overflow-hidden">
      <Navbar />
      <Suspense fallback={<div className="flex-1 p-4">Loading...</div>}>
        <LibrarySidepanel
          reports={allReports}
          domainNames={domainNames}
          currentReportId={report.id}
        />
      </Suspense>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">{report.name}</h1>
              {report.source && (
                <p className="text-lg text-muted-foreground">{report.source}</p>
              )}
            </div>

            {/* Action Buttons Section */}
            <div className="flex gap-3 mb-8 pb-6 border-b">
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
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Report Transcript
              </Button>
              <Button
                variant="outline"
                onClick={handleChatWithReport}
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Chat with Report
              </Button>
            </div>

            {/* Executive Summary Section */}
            {report.summary && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Executive Summary</h2>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <MarkdownContent content={report.summary} />
                </div>
              </div>
            )}

            {/* Key Insights Section */}
            {keyInsights.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Key Insights</h2>
                <ol className="list-decimal list-inside space-y-2">
                  {keyInsights.map((insight, index) => (
                    <li key={index} className="text-base">
                      {typeof insight === 'string' ? insight : String(insight)}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Keywords Section */}
            {report.keywords && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Keywords</h2>
                <p className="text-base">{formatList(report.keywords)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
