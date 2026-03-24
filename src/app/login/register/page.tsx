"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
  });
  const [error, setError] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError({});
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? { form: "Registration failed" });
        setLoading(false);
        return;
      }
      router.push("/login?registered=true");
      router.refresh();
    } catch {
      setError({ form: "An error occurred" });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bone)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-2xl font-semibold text-[var(--foreground)] tracking-tight">
            ContainPoint
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Create your organization
          </p>
        </div>
        <Card className="shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="font-serif text-xl">Register</CardTitle>
            <CardDescription>Create an account and organization to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error.form && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error.form}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="organizationName">Organization name</Label>
                <Input
                  id="organizationName"
                  value={form.organizationName}
                  onChange={(e) => setForm((p) => ({ ...p, organizationName: e.target.value }))}
                  placeholder="Acme Corp"
                  required
                />
                {error.organizationName && (
                  <p className="text-xs text-red-600">{error.organizationName}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Jane Smith"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="you@company.com"
                  required
                />
                {error.email && <p className="text-xs text-red-600">{error.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
                {error.password && <p className="text-xs text-red-600">{error.password}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-[var(--muted)]">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--steel-blue)] hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
