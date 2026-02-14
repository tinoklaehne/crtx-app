"use client";

import { useRouter, usePathname } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizablePanel } from "../ui/resizable-panel";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import type { BusinessDomain } from "@/app/types/businessDomains";

interface DomainsSidepanelProps {
  domains: BusinessDomain[];
  currentDomainId?: string;
}

export function DomainsSidepanel({ domains, currentDomainId }: DomainsSidepanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDomains = useMemo(() => {
    if (!searchQuery.trim()) return domains;
    const query = searchQuery.toLowerCase();
    return domains.filter(domain =>
      domain.name.toLowerCase().includes(query)
    );
  }, [domains, searchQuery]);

  const handleDomainClick = (domainId: string) => {
    router.push(`/domains/${domainId}`);
  };

  return (
    <ResizablePanel defaultWidth={320} minWidth={280} maxWidth={480} className="border-r bg-card">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Domains</h2>
        <Input
          placeholder="Search domains..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>
      <ScrollArea className="h-[calc(100vh-120px)]">
        <div>
          {filteredDomains.map((domain, index) => {
            const isActive = domain.id === currentDomainId;
            return (
              <div
                key={domain.id}
                onClick={() => handleDomainClick(domain.id)}
                className={`
                  px-4 py-3 cursor-pointer transition-colors
                  ${index < filteredDomains.length - 1 ? 'border-b border-border' : ''}
                  ${isActive 
                    ? 'bg-secondary' 
                    : 'hover:bg-secondary/50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  {domain.iconUrl && (
                    <img 
                      src={domain.iconUrl} 
                      alt={domain.name}
                      className="w-6 h-6 flex-shrink-0"
                    />
                  )}
                  <div className="font-medium text-sm flex-1">{domain.name}</div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </ResizablePanel>
  );
}
