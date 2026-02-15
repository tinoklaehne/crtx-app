"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/layout/Navbar";
import { ActorsSidepanel } from "@/app/components/directory/ActorsSidepanel";
import { Button } from "@/components/ui/button";
import type { Actor } from "@/app/types/actors";

interface DirectoryListPageProps {
  initialActors: Actor[];
  loadError?: boolean;
}

export function DirectoryListPage({ initialActors, loadError }: DirectoryListPageProps) {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Navbar />
      <ActorsSidepanel actors={initialActors} />
      <div className="flex-1 overflow-auto flex items-center justify-center p-6">
        {loadError ? (
          <div className="max-w-sm text-center space-y-4">
            <p className="text-muted-foreground">
              The directory could not be loaded. This can happen when the request times out.
            </p>
            <Button
              variant="outline"
              onClick={() => router.refresh()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Select an actor from the list to view their profile.
          </p>
        )}
      </div>
    </div>
  );
}
