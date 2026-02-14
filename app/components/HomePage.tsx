"use client";

import { Navbar } from "@/app/components/layout/Navbar";

export function HomePage() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <div className="py-12">
            <h1 className="text-4xl font-bold mb-4">Intelligence Data Portal</h1>
            <p className="text-muted-foreground text-lg">
              Explore domains, news data, profiles, and trend radars.
            </p>
            <p className="text-muted-foreground mt-4">
              Select a feature from the left sidebar to get started.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
