"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowRight, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Footer } from "../landing/Footer";
import { useAuthStore } from "../../store/auth-store";

function AuthFeedback() {
  const error = useAuthStore((state) => state.error);
  const message = useAuthStore((state) => state.message);

  if (!error && !message) {
    return null;
  }

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        error ? "border-error/20 bg-error/15 text-error" : "border-secondary/20 bg-secondary/15 text-secondary"
      }`}
    >
      {error || message}
    </div>
  );
}

function AuthToggle() {
  const mode = useAuthStore((state) => state.mode);
  const setMode = useAuthStore((state) => state.setMode);

  return (
    <div className="flex items-center justify-center gap-3 text-sm">
      <span className="text-on-surface-variant">{mode === "signup" ? "Already have an account?" : "Need an account?"}</span>
      <button
        type="button"
        className="font-semibold text-primary transition-colors hover:text-primary-container"
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
      >
        {mode === "signup" ? "Sign in" : "Create account"}
      </button>
    </div>
  );
}

function SignInCard() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const submitSignIn = useAuthStore((state) => state.submitSignIn);
  const [form, setForm] = useState({ email: "", password: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitSignIn(form);
  }

  return (
    <section className="rounded-[1.75rem] border border-white/7 bg-[linear-gradient(180deg,rgba(21,26,34,0.95)_0%,rgba(15,20,28,0.98)_100%)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Existing user</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-on-surface sm:text-4xl">Sign In</h2>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
            Secure Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="h-12 w-full rounded-xl border border-white/6 bg-surface-high px-4 text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:border-primary/45"
            placeholder="admin@domain.io"
            required
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              Secret Key
            </label>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">Reset Access</span>
          </div>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="h-12 w-full rounded-xl border border-white/6 bg-surface-high px-4 text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:border-primary/45"
            placeholder="........"
            required
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-on-surface-variant">
          <input type="checkbox" className="h-3.5 w-3.5 accent-primary" />
          Persistent Session
        </label>

        <button
          disabled={isLoading}
          className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold uppercase tracking-[0.16em] text-[#071018] transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
        >
          {isLoading ? "Authorizing..." : "Authorize Access"}
        </button>

        <div className="pt-2">
          <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
            Secure Authentication Via
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/6 bg-surface-high text-xs font-semibold text-on-surface"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              SSO Enterprise
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/6 bg-surface-high text-xs font-semibold text-on-surface"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Vault ID
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function SignUpCard() {
  const isLoading = useAuthStore((state) => state.isLoading);
  const submitSignUp = useAuthStore((state) => state.submitSignUp);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitSignUp(form);
  }

  return (
    <section className="rounded-[1.75rem] border border-white/7 bg-[linear-gradient(180deg,rgba(21,26,34,0.95)_0%,rgba(15,20,28,0.98)_100%)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.28)] sm:p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-secondary">New node</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-on-surface sm:text-4xl">Create Account</h2>
        </div>
        <div className="rounded-2xl border border-secondary/20 bg-secondary/10 p-3 text-secondary">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              First Name
            </label>
            <input
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              className="h-12 w-full rounded-xl border border-white/6 bg-surface-high px-4 text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:border-secondary/45"
              placeholder="John"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              Last Name
            </label>
            <input
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              className="h-12 w-full rounded-xl border border-white/6 bg-surface-high px-4 text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:border-secondary/45"
              placeholder="Doe"
              required
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
            Secure Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="h-12 w-full rounded-xl border border-white/6 bg-surface-high px-4 text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:border-secondary/45"
            placeholder="admin@domain.io"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
            Access Credentials
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            className="h-12 w-full rounded-xl border border-white/6 bg-surface-high px-4 text-sm text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:border-secondary/45"
            placeholder="Min 12 characters"
            minLength={12}
            required
          />
        </div>

        <label className="flex items-start gap-2 text-xs text-on-surface-variant">
          <input type="checkbox" className="mt-0.5 h-3.5 w-3.5 accent-primary" required />
          I accept the Vigilant Lens Protocol and data processing terms.
        </label>

        <button
          disabled={isLoading}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-secondary/35 bg-transparent text-sm font-semibold uppercase tracking-[0.16em] text-secondary transition-colors hover:bg-secondary/10 disabled:cursor-not-allowed disabled:opacity-70"
          type="submit"
        >
          {isLoading ? "Initializing..." : "Initialize Node"}
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
          System Health: <span className="text-secondary">Optimal</span>
        </p>
      </form>
    </section>
  );
}

export function AuthPortal() {
  const router = useRouter();
  const mode = useAuthStore((state) => state.mode);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (token) {
      router.replace("/dashboard");
    }
  }, [router, token]);

  return (
    <section className="relative mx-auto w-full max-w-6xl px-5 pb-10 pt-14 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-x-0 top-8 mx-auto h-96 w-[92%] bg-[radial-gradient(circle_at_30%_15%,rgba(129,236,255,0.14),transparent_45%),radial-gradient(circle_at_70%_20%,rgba(93,255,180,0.08),transparent_35%)]" />

      <div className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-primary">
            Vigilant Lens Authentication Portal
          </p>
          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[0.95] tracking-[-0.05em] text-on-surface sm:text-5xl lg:text-6xl">
            Secure access to your
            <span className="bg-linear-to-r from-primary via-primary-container to-secondary bg-clip-text text-transparent">
              {" "}monitoring command center
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base">
            Review uptime, investigate incidents, and manage monitors from one calmer, faster authentication flow.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {mode === "signup" ? <SignUpCard /> : <SignInCard />}

          <div className="overflow-hidden rounded-[1.75rem] border border-white/7 bg-[linear-gradient(180deg,rgba(18,24,33,0.88)_0%,rgba(14,18,26,0.96)_100%)]">
            <div className="border-b border-white/6 p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                <Activity className="h-3.5 w-3.5" />
                Live system posture
              </div>
              <h3 className="mt-5 font-display text-3xl font-semibold leading-tight text-on-surface sm:text-4xl">
                {mode === "signup" ? "Already have access?" : "Need a new node?"}
              </h3>
              <p className="mt-4 max-w-md text-sm leading-7 text-on-surface-variant">
                {mode === "signup"
                  ? "Switch to sign in to enter the dashboard and manage websites, ticks, and alerts."
                  : "Create a new account to start monitoring websites and collecting WebsiteTick history."}
              </p>
            </div>

            <div className="grid gap-4 p-6 sm:p-8">
              <div className="rounded-2xl border border-white/6 bg-surface-low/80 p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Auth Status</p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="font-display text-5xl font-black tracking-[-0.05em] text-on-surface">99.99%</span>
                  <span className="pb-2 text-base text-primary">Uptime</span>
                </div>
                <p className="mt-3 text-sm text-on-surface-variant">Authentication edge remains stable across monitored regions.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/6 bg-surface-low/70 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Active Regions</p>
                  <p className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] text-on-surface">12</p>
                </div>
                <div className="rounded-2xl border border-white/6 bg-surface-low/70 p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">Threat Shield</p>
                  <p className="mt-3 font-display text-4xl font-extrabold tracking-[-0.04em] text-secondary">Active</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/6 bg-surface-low/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-on-surface-variant">
                  {mode === "signup" ? "Existing operator" : "New operator"}
                </p>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">
                  {mode === "signup"
                    ? "Use your existing credentials to resume incident review and monitor management."
                    : "Create a workspace and begin collecting fresh website checks right away."}
                </p>
                <button
                  type="button"
                  onClick={() => useAuthStore.getState().setMode(mode === "signup" ? "signin" : "signup")}
                  className="mt-6 inline-flex items-center justify-center rounded-xl bg-surface-high px-5 py-3 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-highest"
                >
                  {mode === "signup" ? "Sign in instead" : "Create account instead"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <AuthFeedback />
        </div>

        <div className="mt-4 flex justify-center">
          <AuthToggle />
        </div>

        <Footer />
      </div>
    </section>
  );
}
