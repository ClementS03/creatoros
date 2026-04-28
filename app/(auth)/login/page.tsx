"use client";
import { createSupabaseBrowser } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleButton } from "@/components/auth/GoogleButton";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicSent, setMagicSent] = useState(false);
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [accountDeleted, setAccountDeleted] = useState(false);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("deleted") === "true") {
      setAccountDeleted(true);
      window.history.replaceState({}, "", "/login");
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    window.location.href = "/dashboard";
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setMagicSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[hsl(224,71%,4%)] p-12 text-white">
        <Link href="/" className="font-bold text-xl tracking-tight">
          Creator<span className="text-[hsl(239,84%,67%)]">OS</span>
        </Link>
        <div className="space-y-6">
          <h2 className="text-4xl font-extrabold leading-tight">
            Your storefront.<br />
            Your income.<br />
            <span className="text-[hsl(239,84%,67%)]">Your rules.</span>
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Sell digital products and keep everything you earn. No per-sale fees on Pro.
          </p>
          <div className="space-y-3">
            {["Instant Stripe payouts", "Secure file delivery", "0% fees on Pro"].map((f) => (
              <div key={f} className="flex items-center gap-2 text-white/70 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(239,84%,67%)]" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-xs">© 2026 CreatorOS</p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6">
          <Link href="/" className="lg:hidden font-bold text-xl tracking-tight">
            Creator<span className="text-primary">OS</span>
          </Link>

          {accountDeleted && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 px-4 py-3 text-sm text-green-800 dark:text-green-300">
              <p className="font-semibold">Account deleted</p>
              <p className="text-green-700 dark:text-green-400 mt-0.5 text-xs">Your account has been permanently deleted.</p>
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Sign in to your CreatorOS account</p>
          </div>

          <GoogleButton />

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-lg border p-1 gap-1">
            {(["password", "magic"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setMagicSent(false); setError(null); }}
                className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {m === "password" ? "Password" : "Magic link"}
              </button>
            ))}
          </div>

          {mode === "password" ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          ) : magicSent ? (
            <div className="text-center space-y-2 py-4">
              <div className="text-3xl">✉️</div>
              <p className="font-medium text-sm">Check your inbox</p>
              <p className="text-xs text-muted-foreground">Magic link sent to <strong>{email}</strong></p>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send magic link"}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/signup" className="text-primary hover:underline font-medium">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
