"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RadarTrendOption } from "@/app/radars/page";

interface CreateRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  trendOptions: RadarTrendOption[];
  mode?: "create" | "edit";
  initialValues?: {
    name?: string;
    description?: string;
    trendIds?: string[];
    status?: string;
  };
  allowStatusChange?: boolean;
  ownerOptions?: { id: string; name: string; email?: string }[];
  onSubmit: (payload: {
    name: string;
    description?: string;
    trendIds: string[];
    status?: string;
    ownerIds?: string[];
  }) => Promise<boolean>;
}

export function CreateRadarModal({
  isOpen,
  onClose,
  trendOptions,
  mode = "create",
  initialValues,
  allowStatusChange = false,
  ownerOptions = [],
  onSubmit,
}: CreateRadarModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrendIds, setSelectedTrendIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Draft");
  const [ownerIds, setOwnerIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setName(initialValues?.name ?? "");
    setDescription(initialValues?.description ?? "");
    setSelectedTrendIds(initialValues?.trendIds ?? []);
    setStatus(initialValues?.status ?? "Draft");
    setOwnerIds(
      initialValues && Array.isArray((initialValues as any).ownerIds)
        ? (initialValues as any).ownerIds
        : []
    );
    setSearchQuery("");
    setError(null);
    setIsSaving(false);
  }, [isOpen, initialValues]);

  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return trendOptions.filter((option) => {
      if (option.scale !== "Micro") return false;
      if (!query) return true;
      return (
        option.name.toLowerCase().includes(query) ||
        (option.meta ?? "").toLowerCase().includes(query)
      );
    });
  }, [trendOptions, searchQuery]);

  function toggleTrend(trendId: string) {
    setSelectedTrendIds((prev) =>
      prev.includes(trendId)
        ? prev.filter((id) => id !== trendId)
        : [...prev, trendId]
    );
  }

  function resetState() {
    setName("");
    setDescription("");
    setSearchQuery("");
    setSelectedTrendIds([]);
    setError(null);
    setIsSaving(false);
    setStatus("Draft");
    setOwnerIds([]);
  }

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Radar name is required.");
      return;
    }
    if (selectedTrendIds.length === 0) {
      setError("Select at least one macro or micro trend.");
      return;
    }
    setError(null);
    setIsSaving(true);
    const ok = await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      trendIds: selectedTrendIds,
      status: status?.trim() || undefined,
      ownerIds,
    });
    setIsSaving(false);
    if (!ok) {
      setError("Could not create radar. Please try again.");
      return;
    }
    resetState();
    onClose();
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) {
          resetState();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Draft Radar" : "Create Radar"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter radar name"
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="mt-1 min-h-[80px]"
            />
          </div>

          {allowStatusChange && (
            <div>
              <label className="text-sm font-medium">Status</label>
              <div className="mt-1 max-w-xs">
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {mode === "edit" && (
            <div>
              <label className="text-sm font-medium">Owners</label>
              <ScrollArea className="mt-1 h-40 border rounded-md">
                <div className="p-2 space-y-1">
                  {(!ownerOptions || ownerOptions.length === 0) && (
                    <p className="text-xs text-muted-foreground px-1 py-0.5">
                      No owners available.
                    </p>
                  )}
                  {ownerOptions?.map((owner) => {
                    const checked = ownerIds.includes(owner.id);
                    return (
                      <button
                        key={owner.id}
                        type="button"
                        onClick={() =>
                          setOwnerIds((prev) =>
                            prev.includes(owner.id)
                              ? prev.filter((id) => id !== owner.id)
                              : [...prev, owner.id]
                          )
                        }
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-secondary/50 flex items-center gap-2"
                      >
                        <Checkbox checked={checked} />
                        <div className="flex flex-col">
                          <span className="text-xs font-medium">{owner.name}</span>
                          {owner.email && (
                            <span className="text-[10px] text-muted-foreground">
                              {owner.email}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <label className="text-sm font-medium">
                Select Micro Trends ({selectedTrendIds.length} selected)
              </label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search micro trends..."
                className="w-full sm:w-72"
              />
            </div>
            <ScrollArea className="h-64 border rounded-md">
              <div className="p-2 space-y-1">
                {filteredOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">
                    No micro trends found.
                  </p>
                ) : (
                  filteredOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleTrend(option.id)}
                      className="w-full text-left px-2 py-2 rounded hover:bg-secondary/50 flex items-center gap-2"
                    >
                      <Checkbox checked={selectedTrendIds.includes(option.id)} />
                      <span className="text-sm">{option.name}</span>
                      {option.meta && (
                        <Badge variant="secondary" className="ml-auto text-[10px]">
                          {option.meta}
                        </Badge>
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetState();
                onClose();
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={isSaving}>
              {isSaving
                ? mode === "edit"
                  ? "Saving..."
                  : "Creating..."
                : mode === "edit"
                  ? "Save Changes"
                  : "Create Draft Radar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
