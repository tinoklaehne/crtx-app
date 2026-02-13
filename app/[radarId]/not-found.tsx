"use client";

import { useParams } from "next/navigation";
import { RadarNotFoundHandler } from "@/app/components/RadarNotFoundHandler";

export default function NotFound() {
  const params = useParams();
  const radarId = params?.radarId as string;

  if (!radarId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Invalid Radar ID</h2>
          <p className="text-muted-foreground">No radar ID provided.</p>
        </div>
      </div>
    );
  }

  return <RadarNotFoundHandler radarId={radarId} />;
}