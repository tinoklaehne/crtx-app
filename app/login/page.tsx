"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/app/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPath, setNextPath] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      setNextPath(url.searchParams.get("next"));
    } catch {
      // Ignore URL parsing errors and fall back to default redirect
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Invalid email or password");
        return;
      }
      const next = nextPath || "/";
      router.push(next);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md border rounded-lg bg-card shadow-sm p-8">
          <h1 className="text-2xl font-semibold mb-2">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your email and password to access your personalised CRTX workspace.
          </p>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Email
              </label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Password
              </label>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Login is only available for emails that already exist in the Airtable users table.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

