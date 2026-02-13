"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "write" | "preview")}>
      <TabsList className="mb-2">
        <TabsTrigger value="write">Write</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="write" className="mt-0">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[200px] font-mono"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Supports Markdown: **bold**, *italic*, # headers, - bullets, --- horizontal rules
        </p>
      </TabsContent>
      <TabsContent value="preview" className="mt-0">
        <div className="min-h-[200px] p-4 border rounded-md prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{value || "*No content*"}</ReactMarkdown>
        </div>
      </TabsContent>
    </Tabs>
  );
}