"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DomainTab, DomainTabContent } from "@/app/types/domainContent";
import { DomainContentList } from "./DomainContentList";

interface DomainTabViewProps {
  content: DomainTabContent;
}

export function DomainTabView({ content }: DomainTabViewProps) {
  const [activeTab, setActiveTab] = useState<DomainTab>("now");

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DomainTab)} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="now">Now</TabsTrigger>
        <TabsTrigger value="new">New</TabsTrigger>
        <TabsTrigger value="next">Next</TabsTrigger>
      </TabsList>
      
      <TabsContent value="now" className="mt-6">
        <DomainContentList items={content.now} />
      </TabsContent>
      
      <TabsContent value="new" className="mt-6">
        <DomainContentList items={content.new} />
      </TabsContent>
      
      <TabsContent value="next" className="mt-6">
        <DomainContentList items={content.next} />
      </TabsContent>
    </Tabs>
  );
}
