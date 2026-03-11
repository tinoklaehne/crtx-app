"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Info, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getReadinessLevel } from "./utils";
import type { Cluster, Trend, Domain } from "@/app/types";
import { generateClusterPalette } from "@/app/components/radar/utils/calculations";
import type { NodePositioning } from "@/app/types";

interface TechnologiesSectionProps {
  clusters: Cluster[];
  technologies: Trend[];
  filteredTechnologies: Trend[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onTechnologySelect: (tech: Trend) => void;
  onClusterSelect: (cluster: Cluster | null) => void;
  nodePositioning: NodePositioning;
  radarName?: string;
  radarStatus?: string;
  onEditRadar?: () => void;
  radarDescription?: string;
  radarOwners?: { name: string; email?: string }[];
  showTitle?: boolean;
  clusterType?: "parent" | "taxonomy" | "domain";
}

export function TechnologiesSection({
  clusters,
  technologies,
  filteredTechnologies,
  searchQuery,
  onSearchChange,
  onTechnologySelect,
  onClusterSelect,
  nodePositioning,
  radarName,
  radarStatus,
  onEditRadar,
  radarDescription,
  radarOwners,
  clusterType = "parent",
  showTitle = true,
}: TechnologiesSectionProps) {
  const handleClusterClick = useCallback((cluster: Cluster) => {
    onClusterSelect(cluster);
  }, [onClusterSelect]);

  const [infoOpen, setInfoOpen] = useState(false);

  // Group technologies by cluster/domain depending on clustering mode.
  // For domain clustering we group by tech.domain values and synthesize Cluster objects
  // so the list matches the radar visualization's domain-based grouping.
  const groupedTechnologies = filteredTechnologies.reduce(
    (acc, tech) => {
      let clusterIdKey: string;
      let clusterObj: Cluster | undefined;

      // Domain clustering: group by domain field, not by parent cluster IDs.
      const useDomain = clusterType === "domain";

      if (useDomain) {
        const domain = (tech.domain || "Technology") as Domain;
        clusterIdKey = `domain:${domain}`;
        if (!acc.has(clusterIdKey)) {
          clusterObj = {
            id: domain,
            name: domain,
            description: `All ${domain} trends`,
            imageUrl: "",
            image: [],
            colorCode: "",
            domain,
            universe: tech.universe || "General",
            trends: [],
            technologies: [],
          } as Cluster;
          acc.set(clusterIdKey, { cluster: clusterObj, technologies: [] });
        }
      } else {
        // Parent / taxonomy clustering: try clusterId, then taxonomyId; fallback to "Unclustered".
        // Try to find cluster by clusterId first
        clusterObj = clusters.find((c) => c.id === tech.clusterId);

        // If not found, try taxonomyId
        if (!clusterObj && tech.taxonomyId) {
          clusterObj = clusters.find((c) => c.id === tech.taxonomyId);
        }

        // If still not found, create or use "Unclustered" group
        if (!clusterObj) {
          const unclusteredId = "unclustered";
          clusterIdKey = unclusteredId;
          if (!acc.has(unclusteredId)) {
            acc.set(unclusteredId, {
              cluster: {
                id: unclusteredId,
                name: "Unclustered",
                description: "Trends without cluster assignment",
                imageUrl: "",
                image: [],
                colorCode: "#888888",
                domain: (tech.domain || "Technology") as Domain,
                universe: tech.universe || "General",
                trends: [],
                technologies: [],
              } as Cluster,
              technologies: [],
            });
          }
        } else {
          clusterIdKey = clusterObj.id;
          if (!acc.has(clusterIdKey)) {
            acc.set(clusterIdKey, { cluster: clusterObj, technologies: [] });
          }
        }
      }

      if (!clusterIdKey) {
        // Safety: shouldn't happen, but avoid runtime errors.
        clusterIdKey = "unclustered-fallback";
        if (!acc.has(clusterIdKey)) {
          acc.set(clusterIdKey, {
            cluster: {
              id: clusterIdKey,
              name: "Unclustered",
              description: "Trends without cluster assignment",
              imageUrl: "",
              image: [],
              colorCode: "#888888",
              domain: (tech.domain || "Technology") as Domain,
              universe: tech.universe || "General",
              trends: [],
              technologies: [],
            } as Cluster,
            technologies: [],
          });
        }
      }

      acc.get(clusterIdKey)!.technologies.push(tech);
      return acc;
    },
    new Map<string, { cluster: Cluster; technologies: Trend[] }>()
  );

  // Prepare a deterministic color palette so the list matches the radar/matrix
  const groupsArray = Array.from(groupedTechnologies.values()).sort((a, b) =>
    a.cluster.name.localeCompare(b.cluster.name)
  );

  const palette = generateClusterPalette(
    groupsArray.map(({ cluster }) =>
      clusterType === "domain" ? String(cluster.domain) : cluster.id
    )
  );

  // Calculate global index
  let globalIndex = 1;

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background">
        {showTitle && (
          <div className="px-6 h-[72px] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-2xl font-extrabold truncate">
                {radarName || "Trends"}
              </h2>
              {(radarStatus || "").trim().toLowerCase() === "draft" && (
                <Badge variant="secondary">Draft</Badge>
              )}
              {(radarDescription || (radarOwners && radarOwners.length > 0)) && (
                <button
                  type="button"
                  aria-label="Show radar details"
                  className="ml-1 p-1 rounded-full hover:bg-muted text-muted-foreground flex-shrink-0"
                  onClick={() => setInfoOpen(true)}
                >
                  <Info className="h-4 w-4" />
                </button>
              )}
            </div>
            {onEditRadar && (
              <Button size="sm" variant="outline" onClick={onEditRadar}>
                Edit
              </Button>
            )}
          </div>
        )}

        <div className="px-6 pt-3">
          <div className="relative">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 border-0 bg-transparent focus-visible:ring-0 focus-visible:outline-none h-8"
            />
          </div>
          <Separator className="-mx-6 w-[calc(100%+3rem)] mt-3" />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 pt-3">
        {groupsArray.map(({ cluster, technologies: clusterTechs }) => {
          const key = clusterType === "domain" ? String(cluster.domain) : cluster.id;
          const color =
            palette[key] ||
            (cluster.colorCode && cluster.colorCode.trim()) ||
            "#888888";

          return (
            <div key={cluster.id} className="space-y-2 mb-4">
              <h3 
                className={`text-sm font-medium cursor-pointer hover:opacity-80 transition-opacity`}
                onClick={() => handleClusterClick(cluster)}
                style={{ color }}
              >
                {cluster.name}
              </h3>
              <div className="-mx-6">
                {clusterTechs
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((tech) => {
                    const index = globalIndex++;
                    return (
                      <div
                        key={tech.id}
                        className="group relative py-2 hover:bg-secondary/50 cursor-pointer"
                        onClick={() => onTechnologySelect(tech)}
                      >
                        <div className="flex items-center justify-between px-6">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span 
                              className="text-sm w-7 tabular-nums flex-shrink-0"
                              style={{ color }}
                            >
                              {index.toString().padStart(2, '0')}
                            </span>
                            <h4 className="font-medium truncate max-w-[420px]">
                              {tech.name}
                            </h4>
                          </div>
                          <div className="text-sm text-muted-foreground flex-shrink-0 ml-2">
                            {getReadinessLevel(tech, nodePositioning)}
                          </div>
                        </div>
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    );
                  })}
              </div>
              <Separator className="-mx-6 w-[calc(100%+3rem)] mt-4" />
            </div>
          );
        })}

        {groupedTechnologies.size === 0 && (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">
              {searchQuery ? "No matching trends found" : "No trends available"}
            </p>
          </div>
        )}
      </div>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{radarName || "Radar details"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {radarDescription && (
              <p className="text-foreground whitespace-pre-line">
                {radarDescription}
              </p>
            )}
            {radarOwners && radarOwners.length > 0 && (
              <div>
                <p className="font-semibold mb-1">Owner{radarOwners.length > 1 ? "s" : ""}</p>
                <ul className="space-y-0.5">
                  {radarOwners.map((owner, idx) => (
                    <li key={`${owner.name}-${owner.email}-${idx}`}>
                      {owner.name}
                      {owner.email ? ` – ${owner.email}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}