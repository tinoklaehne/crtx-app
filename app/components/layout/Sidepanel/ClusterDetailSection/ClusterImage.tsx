"use client";

import Image from "next/image";
import type { Cluster } from "@/app/types/clusters";

interface ClusterImageProps {
  cluster: Cluster;
}

export function ClusterImage({ cluster }: ClusterImageProps) {
  if (!cluster.imageUrl) return null;

  return (
    <div className="relative aspect-video rounded-lg overflow-hidden">
      <Image
        src={cluster.imageUrl}
        alt={cluster.name}
        fill
        className="object-cover"
      />
    </div>
  );
}