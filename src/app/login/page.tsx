"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function changeMode(next: AuthMode) {
    if (busy) return;
    setMode(next);
    setError("");
    setSuccess("");
    setPassword("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setSuccess("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("Enter your email address and password.");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { error: signupError, data } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`,
          },
        });
        if (signupError) throw signupError;
        setPassword("");
        if (data.session) {
          // Use a fresh browser request so the Next.js Proxy reads the
          // newly issued Supabase auth cookies on the first navigation.
          window.location.replace("/");
          return;
        }
        setSuccess("Check your email for the confirmation link. After confirming, return here to sign in.");
      } else {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (loginError) throw loginError;
        if (!data.session) {
          throw new Error("Sign-in did not return an active session. Please try again.");
        }
        // Avoid competing router.replace() and router.refresh() calls.
        // Full navigation sends the current cookies with the dashboard request.
        window.location.replace("/");
        return;
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090909] px-4 py-10 font-sans text-neutral-100">
      <div className="w-full max-w-[450px]">
        <div className="mb-9 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-950">
            <Activity size={26} aria-hidden="true" />
          </div>
          <div>
            <p className="text-xl font-bold tracking-tight">DashTracker</p>
            <p className="text-[11px] tracking-[0.19em] text-neutral-500">PERSONAL LIFE OS</p>
          </div>
        </div>

        <section className="rounded-3xl border border-white/10 bg-[#171717] p-6 shadow-2xl shadow-black/20 sm:p-8" aria-label="DashTracker authentication">
          <div className="mb-7">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
              <LockKeyhole size={19} aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
            <p className="mt-2 text-sm leading-6 text-neutral-400">
              {mode === "login" ? "Sign in to your personal workspace." : "Start organizing your day with DashTracker."}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-[#0c0c0c] p-1" aria-label="Authentication mode">
            {(["login", "signup"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mode === option}
                disabled={busy}
                onClick={() => changeMode(option)}
                className={`min-h-10 rounded-lg text-sm font-medium transition disabled:opacity-60 ${mode === option ? "bg-neutral-100 text-neutral-950" : "text-neutral-400 hover:text-white"}`}
              >
                {option === "login" ? "Sign in" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block text-xs font-medium text-neutral-300">
              Email address
              <span className="relative mt-2 block">
                <Mail size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="min-h-12 w-full rounded-xl border border-white/15 bg-[#0c0c0c] pl-10 pr-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-neutral-400 focus-visible:ring-2 focus-visible:ring-white/10"
                />
              </span>
            </label>

            <label className="block text-xs font-medium text-neutral-300">
              Password
              <span className="relative mt-2 block">
                <LockKeyhole size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  name="password"
                  minLength={mode === "signup" ? 8 : undefined}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"}
                  className="min-h-12 w-full rounded-xl border border-white/15 bg-[#0c0c0c] pl-10 pr-12 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-neutral-400 focus-visible:ring-2 focus-visible:ring-white/10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            {error && (
              <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-200">
                {error}
              </p>
            )}
            {success && (
              <div role="status" className="flex gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm leading-6 text-neutral-200">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-neutral-100 px-4 text-sm font-semibold text-neutral-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
              {!busy && <ArrowRight size={17} aria-hidden="true" />}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-neutral-500">
            {mode === "login" ? "New to DashTracker? " : "Already have an account? "}
            <button
              type="button"
              disabled={busy}
              onClick={() => changeMode(mode === "login" ? "signup" : "login")}
              className="font-semibold text-neutral-200 underline underline-offset-4 hover:text-white disabled:opacity-60"
            >
              {mode === "login" ? "Create an account" : "Sign in instead"}
            </button>
          </p>
        </section>

        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <ShieldCheck size={16} aria-hidden="true" />
            Secure authentication powered by Supabase
          </div>
          <Link href="/" className="text-xs text-neutral-400 underline underline-offset-4 hover:text-white">
            Back to DashTracker
          </Link>
        </div>
      </div>
    </main>
  );
}
