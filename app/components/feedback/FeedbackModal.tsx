"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import type { FeedbackType } from "@/app/types/feedback";

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}

const FEEDBACK_TYPES: FeedbackType[] = ["Bug", "Idea"];

const AREAS = [
  "Radars",
  "Domains",
  "Trend Cycles",
  "Trends",
  "Welcome",
  "Directory",
  "Library",
  "Trend Scoring",
  "Other",
] as const;

const SEVERITIES = ["Low", "Medium", "High", "Critical"] as const;

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType>("Bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [area, setArea] = useState<typeof AREAS[number] | "">("");
  const [severity, setSeverity] = useState<typeof SEVERITIES[number] | "">("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [environment, setEnvironment] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetForm() {
    setType("Bug");
    setTitle("");
    setDescription("");
    setArea("");
    setSeverity("");
    setStepsToReproduce("");
    setEnvironment("");
    setScreenshotUrl("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please provide a title and description.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          area: area || undefined,
          severity: type === "Bug" && severity ? severity : undefined,
          stepsToReproduce: type === "Bug" && stepsToReproduce.trim() ? stepsToReproduce.trim() : undefined,
          environment: environment.trim() || undefined,
          screenshotUrl: screenshotUrl.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setError(data?.error || "Could not submit feedback. Please try again.");
        return;
      }

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted.",
      });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError("Could not submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) {
        resetForm();
      }
      onOpenChange(next);
    }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Feedback &amp; bug report</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="feedback-type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as FeedbackType)}>
                <SelectTrigger id="feedback-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="feedback-area">Area</Label>
              <Select value={area} onValueChange={(value) => setArea(value as typeof AREAS[number])}>
                <SelectTrigger id="feedback-area">
                  <SelectValue placeholder="Choose area (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="feedback-title">Title</Label>
            <Input
              id="feedback-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Short summary"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="feedback-description">Description</Label>
            <Textarea
              id="feedback-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === "Bug" ? "What happened? What did you expect to happen?" : "Describe your idea and why it would help."}
              rows={5}
            />
          </div>

          {type === "Bug" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="feedback-severity">Severity</Label>
                  <Select value={severity} onValueChange={(value) => setSeverity(value as typeof SEVERITIES[number])}>
                    <SelectTrigger id="feedback-severity">
                      <SelectValue placeholder="Select severity (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="feedback-environment">Environment</Label>
                  <Input
                    id="feedback-environment"
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    placeholder="e.g. Production, Chrome on macOS"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="feedback-steps">Steps to reproduce</Label>
                <Textarea
                  id="feedback-steps"
                  value={stepsToReproduce}
                  onChange={(e) => setStepsToReproduce(e.target.value)}
                  placeholder="List the steps so we can reproduce the issue (optional)."
                  rows={3}
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <Label htmlFor="feedback-screenshot">Screenshot URL</Label>
            <Input
              id="feedback-screenshot"
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
              placeholder="Link to a screenshot (optional)"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

