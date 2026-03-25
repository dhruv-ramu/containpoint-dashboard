"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeAppCallbackUrl } from "@/lib/safe-callback-url";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminBridge = searchParams.get("adminBridge");
  const callbackUrl = safeAppCallbackUrl(searchParams.get("callbackUrl"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bridgePending, setBridgePending] = useState(!!adminBridge);

  useEffect(() => {
    if (!adminBridge) return;
    let cancelled = false;
    (async () => {
      const res = await signIn("admin-bridge", {
        token: adminBridge,
        redirect: false,
      });
      if (cancelled) return;
      if (res?.error) {
        setError("Support sign-in link is invalid or expired. Sign in with your email and password.");
        setBridgePending(false);
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [adminBridge, router, callbackUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("An error occurred");
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
            SPCC Compliance System of Record
          </p>
        </div>
        <Card className="shadow-card">
          <CardHeader className="space-y-1">
            <CardTitle className="font-serif text-xl">Sign in</CardTitle>
            <CardDescription>
              {bridgePending
                ? "Completing sign-in from the internal admin console…"
                : "Enter your credentials to access your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bridgePending && !error && (
              <p className="text-sm text-[var(--muted)] mb-4">Redirecting to your workspace.</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={bridgePending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={bridgePending}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading || bridgePending}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-[var(--muted)]">
              Don&apos;t have an account?{" "}
              <Link href="/login/register" className="text-[var(--steel-blue)] hover:underline">
                Register
              </Link>
            </p>
            <p className="mt-6 pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--muted)]">
              <Link href="/terms" className="hover:underline">Terms of Service</Link>
              {" · "}
              <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bone)]">
        <div className="animate-pulse text-[var(--muted)]">Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
