"use client";

import { useEffect, useState } from "react";
import { User as UserIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { User } from "@/app/types/users";

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserProfileModal({ open, onOpenChange }: UserProfileModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function fetchUser() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/user/profile");
        let data: any = null;
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("application/json")) {
          try {
            data = await res.json();
          } catch (jsonError) {
            // If JSON parsing fails, we'll fall back below without throwing
            console.warn("Could not parse /api/user/profile JSON response", jsonError);
          }
        }

        // Preferred: real user from API
        if (res.ok && data && data.user) {
          if (!cancelled) {
            setUser(data.user);
          }
          return;
        }

        // Fallbacks: API returned non-OK or malformed JSON
        if (!cancelled) {
          if (data && data.user) {
            setUser(data.user);
          } else {
            // Final fallback: hardcoded mock profile
            setUser({
              id: "mock-user",
              name: "Tino Klaehne",
              email: "",
              organisation: "",
              businessUnit: "",
              domainsAccess: true,
              directoryAccess: true,
              radarsAccess: true,
              libraryAccess: true,
              subscribedDomainIds: [],
              subscribedReportIds: [],
            });
          }
          setError(
            "Using fallback profile. Airtable connection may be unavailable."
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          // On any error, ensure we still show a fallback profile
          setUser({
            id: "mock-user",
            name: "Tino Klaehne",
            email: "",
            organisation: "",
            businessUnit: "",
            domainsAccess: true,
            directoryAccess: true,
            radarsAccess: true,
            libraryAccess: true,
            subscribedDomainIds: [],
            subscribedReportIds: [],
          });
          setError(
            "Using fallback profile. Airtable connection may be unavailable."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchUser();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleChange =
    (field: keyof Pick<User, "name" | "email" | "organisation" | "businessUnit">) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!user) return;
      setUser({ ...user, [field]: e.target.value });
    };

  async function handleSave() {
    if (!user) return;
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          organisation: user.organisation,
          businessUnit: user.businessUnit,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to save profile");
      }
      const data = await res.json();
      setUser(data.user);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      setError("Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            User Profile
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : user ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Name
              </label>
              <Input value={user.name} onChange={handleChange("name")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Email
              </label>
              <Input value={user.email} onChange={handleChange("email")} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Organisation
              </label>
              <Input
                value={user.organisation ?? ""}
                onChange={handleChange("organisation")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Business Unit
              </label>
              <Input
                value={user.businessUnit ?? ""}
                onChange={handleChange("businessUnit")}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No profile data available.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

