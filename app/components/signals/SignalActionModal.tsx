"use client";

import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface SignalActionModalData {
  title: string;
  summary?: string;
  date?: string;
  source?: string;
  signalType?: string;
  area?: string;
  actors?: string[];
  url?: string;
}

interface SignalActionModalProps {
  signal: SignalActionModalData | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatDate(value?: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function SignalActionModal({ signal, isOpen, onClose }: SignalActionModalProps) {
  const formattedDate = formatDate(signal?.date);

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-3xl overflow-y-auto max-h-[88vh] pr-14">
        <DialogHeader className="pr-14">
          <DialogTitle className="text-2xl leading-tight">{signal?.title ?? "Signal"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {signal?.signalType && <Badge variant="outline">{signal.signalType}</Badge>}
              {signal?.area && <Badge variant="secondary">{signal.area}</Badge>}
              {(signal?.actors ?? []).slice(0, 3).map((actor) => (
                <Badge key={actor} variant="secondary">
                  {actor}
                </Badge>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              className="mr-2"
              disabled={!signal?.url}
              onClick={() => {
                if (!signal?.url) return;
                let nextUrl = signal.url;
                if (!nextUrl.startsWith("http://") && !nextUrl.startsWith("https://")) {
                  nextUrl = `https://${nextUrl}`;
                }
                window.open(nextUrl, "_blank", "noopener,noreferrer");
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Go to Source
            </Button>
          </div>

          {signal?.summary && (
            <div className="rounded-md border bg-secondary/20 p-4">
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{signal.summary}</p>
            </div>
          )}

          <div className="space-y-2 text-sm">
            {signal?.source && (
              <div className="flex items-center justify-between gap-4 border-b pb-2">
                <span className="text-muted-foreground">Source</span>
                <span className="text-right">{signal.source}</span>
              </div>
            )}
            {formattedDate && (
              <div className="flex items-center justify-between gap-4 border-b pb-2">
                <span className="text-muted-foreground">Date</span>
                <span className="text-right">{formattedDate}</span>
              </div>
            )}
            {signal?.area && (
              <div className="flex items-center justify-between gap-4 border-b pb-2">
                <span className="text-muted-foreground">Area</span>
                <span className="text-right">{signal.area}</span>
              </div>
            )}
            {(signal?.actors ?? []).length > 0 && (
              <div className="flex items-start justify-between gap-4 border-b pb-2">
                <span className="text-muted-foreground">Actors</span>
                <span className="text-right">
                  {signal?.actors?.join(", ")}
                </span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
