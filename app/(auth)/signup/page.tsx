"use client";
import { createSupabaseBrowser } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleButton } from "@/components/auth/GoogleButton";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseBrowser();

  const pwChecks = {
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setDone(true);
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
            Start selling<br />
            in minutes.<br />
            <span className="text-[hsl(239,84%,67%)]">For free.</span>
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Create your storefront, upload your first product and share one link. That&apos;s it.
          </p>
          <div className="space-y-3">
            {["No credit card required", "Free plan available", "Setup in 5 minutes"].map((f) => (
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

          {done ? (
            <div className="text-center space-y-4 py-8">
              <div className="text-5xl">✉️</div>
              <h1 className="text-2xl font-bold">Check your inbox</h1>
              <p className="text-muted-foreground text-sm">
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-sm text-muted-foreground">No credit card required. Start selling today.</p>
              </div>

              <GoogleButton />

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-3">
                <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="flex gap-3 text-xs">
                    {[
                      { ok: pwChecks.length, label: "6+ chars" },
                      { ok: pwChecks.upper,  label: "Uppercase" },
                      { ok: pwChecks.number, label: "Number" },
                    ].map(({ ok, label }) => (
                      <span key={label} className={ok ? "text-green-600" : "text-muted-foreground"}>
                        {ok ? "✓" : "○"} {label}
                      </span>
                    ))}
                  </div>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account…" : "Create free account"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
