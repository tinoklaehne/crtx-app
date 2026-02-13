"use client";

import { MarkdownContent } from "../../ui/markdown-content";

export function HomeSection() {
  const title = "Trend Radars";
  const description = "Explore emerging technologies and innovations across different domains. This interactive radar helps you visualize and track technological trends, their maturity, and business impact.";

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-3xl font-bold">{title}</h1>
      <MarkdownContent content={description} className="text-muted-foreground" />
    </div>
  );
}