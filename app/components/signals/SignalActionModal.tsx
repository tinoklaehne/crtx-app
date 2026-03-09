"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface SignalActionModalData {
  id: string;
  title: string;
  summary?: string;
  date?: string;
  source?: string;
  signalType?: string;
  area?: string;
  actorIds?: string[];
  actors?: string[];
  url?: string;
}

interface SignalActionModalProps {
  signal: SignalActionModalData | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (next: { signalType: string; actorIds: string[]; actorNames: string[] }) => void;
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

interface ActorOption {
  id: string;
  name: string;
}

export function SignalActionModal({
  signal,
  isOpen,
  onClose,
  onSaved,
}: SignalActionModalProps) {
  const formattedDate = formatDate(signal?.date);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [signalTypeDraft, setSignalTypeDraft] = useState("");
  const [actorIdsDraft, setActorIdsDraft] = useState<string[]>([]);
  const [actorSearch, setActorSearch] = useState("");
  const [actorOptions, setActorOptions] = useState<ActorOption[]>([]);
  const [signalTypeOptions, setSignalTypeOptions] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen || !signal) return;
    setIsEditing(false);
    setEditError(null);
    setSignalTypeDraft(signal.signalType ?? "");
    setActorIdsDraft(signal.actorIds ?? []);
    setActorSearch("");
    if (signal.signalType?.trim()) {
      setSignalTypeOptions((prev) =>
        prev.includes(signal.signalType as string) ? prev : [...prev, signal.signalType as string]
      );
    }
  }, [isOpen, signal]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    async function loadEditorOptions() {
      try {
        const res = await fetch("/api/user/action-edit");
        if (!res.ok) return;
        const data: { actors?: ActorOption[]; signalTypes?: string[] } = await res
          .json()
          .catch(() => ({}));
        if (!cancelled) {
          setActorOptions(Array.isArray(data.actors) ? data.actors : []);
          setSignalTypeOptions(Array.isArray(data.signalTypes) ? data.signalTypes : []);
        }
      } catch (error) {
        console.error(error);
      }
    }
    loadEditorOptions();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const actorNameById = useMemo(
    () => Object.fromEntries(actorOptions.map((actor) => [actor.id, actor.name])),
    [actorOptions]
  );

  const selectedActorNames = useMemo(() => {
    return actorIdsDraft.map((id) => actorNameById[id] ?? id);
  }, [actorIdsDraft, actorNameById]);

  const filteredActors = useMemo(() => {
    const query = actorSearch.trim().toLowerCase();
    if (!query) return actorOptions;
    return actorOptions.filter((actor) => actor.name.toLowerCase().includes(query));
  }, [actorOptions, actorSearch]);

  function toggleActor(actorId: string) {
    setActorIdsDraft((prev) =>
      prev.includes(actorId) ? prev.filter((id) => id !== actorId) : [...prev, actorId]
    );
  }

  async function saveEdits() {
    if (!signal?.id) return;
    if (!signalTypeDraft.trim()) {
      setEditError("Signal type cannot be empty.");
      return;
    }
    setIsSaving(true);
    setEditError(null);
    try {
      const res = await fetch("/api/user/action-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId: signal.id,
          signalType: signalTypeDraft.trim(),
          actorIds: actorIdsDraft,
        }),
      });
      if (!res.ok) {
        setEditError("Could not save changes.");
        return;
      }
      onSaved?.({
        signalType: signalTypeDraft.trim(),
        actorIds: actorIdsDraft,
        actorNames: selectedActorNames,
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      setEditError("Could not save changes.");
    } finally {
      setIsSaving(false);
    }
  }

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
              disabled={!signal?.url || isEditing}
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
            {!isEditing && (
              <Button type="button" variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
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

          {isEditing && (
            <div className="rounded-md border p-4 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Signal Type</label>
                <Select value={signalTypeDraft} onValueChange={setSignalTypeDraft}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select signal type" />
                  </SelectTrigger>
                  <SelectContent>
                    {signalTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Related Actors</label>
                <Input
                  value={actorSearch}
                  onChange={(e) => setActorSearch(e.target.value)}
                  placeholder="Search actors..."
                  className="mb-2"
                />
                <div className="max-h-44 overflow-auto border rounded-md">
                  {filteredActors.map((actor) => {
                    const selected = actorIdsDraft.includes(actor.id);
                    return (
                      <button
                        key={actor.id}
                        type="button"
                        onClick={() => toggleActor(actor.id)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/40 flex items-center justify-between"
                      >
                        <span>{actor.name}</span>
                        {selected && <Check className="h-4 w-4" />}
                      </button>
                    );
                  })}
                  {filteredActors.length === 0 && (
                    <p className="text-sm text-muted-foreground px-3 py-2">
                      No actors found.
                    </p>
                  )}
                </div>
              </div>

              {editError && <p className="text-sm text-destructive">{editError}</p>}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditError(null);
                  }}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={saveEdits} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
