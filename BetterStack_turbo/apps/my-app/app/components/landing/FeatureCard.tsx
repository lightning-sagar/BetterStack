import { Globe, Orbit } from "lucide-react";
import type { Feature } from "./data";

export function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;
  const isPerformance = feature.title === "Performance Tracking";
  const isGlobalNetwork = feature.title === "Global Network";

  return (
    <article
      className={`rounded-[1.4rem] p-5 sm:p-6 ${
        isPerformance
          ? "relative overflow-hidden bg-linear-to-br from-[#182433] via-[#1b2536] to-[#202a3b] ring-1 ring-primary/30 shadow-[0_0_0_1px_rgba(129,236,255,0.12),0_20px_50px_rgba(10,25,38,0.4)]"
          : "bg-linear-to-br from-surface-low to-surface-high"
      } ${feature.className}`}
    >
      {isPerformance ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-secondary via-primary to-primary-container" />
      ) : null}

      {isGlobalNetwork ? (
        <div className="flex h-full flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-md">
            <Icon className="h-6 w-6 text-primary" />
            <h2 className="mt-5 max-w-sm font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-on-surface sm:text-[1.85rem]">
              {feature.title}
            </h2>
            <p className="mt-3 max-w-sm text-base leading-7 text-on-surface-variant">{feature.body}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
              <span className="rounded-full bg-surface-high px-2.5 py-1">NA</span>
              <span className="rounded-full bg-surface-high px-2.5 py-1">EU</span>
              <span className="rounded-full bg-surface-high px-2.5 py-1">APAC</span>
            </div>
          </div>

          <div className="flex w-full items-center justify-center lg:w-48 lg:shrink-0">
            <div className="relative mx-auto h-28 w-28">
              <span className="absolute inset-0 rounded-full border border-primary/30" />
              <span className="absolute inset-2 rounded-full border border-secondary/30" />
              <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary pulse-ring" />
              <span className="absolute left-3 top-6 h-2 w-2 rounded-full bg-secondary/90" />
              <span className="absolute right-2 top-9 h-2 w-2 rounded-full bg-primary-container/90" />
              <span className="absolute bottom-6 left-8 h-2 w-2 rounded-full bg-secondary/90" />
              <span className="absolute bottom-4 right-6 h-2 w-2 rounded-full bg-primary/90" />
              <Orbit className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 text-primary/45" />
              <Globe className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-primary" />
            </div>
          </div>
        </div>
      ) : (
        <>
          <Icon className="h-6 w-6 text-primary" />
          <h2
            className={`mt-5 max-w-sm font-display font-semibold leading-tight tracking-[-0.03em] text-on-surface ${
              isPerformance ? "text-[1.95rem]" : "text-[2.15rem]"
            }`}
          >
            {feature.title}
          </h2>
          <p className={`mt-3 max-w-sm leading-7 text-on-surface-variant ${isPerformance ? "text-base" : "text-lg"}`}>
            {feature.body}
          </p>

          {feature.title === "Precision Uptime Monitoring" ? (
            <div className="chart-loop mt-6 grid grid-cols-5 items-end gap-2">
              {[40, 52, 42, 56, 64].map((h, idx) => (
                <div
                  key={`${h}-${idx}`}
                  className="bar-loop rounded-sm bg-secondary/25"
                  style={{
                    height: `${h}px`,
                    ["--bar-delay" as string]: `${idx * 210}ms`,
                    ["--bar-speed" as string]: `${2.2 + idx * 0.08}s`,
                  }}
                />
              ))}
            </div>
          ) : null}

          {isPerformance ? (
            <div className="mt-5 rounded-xl bg-surface-low/70 p-3">
              <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant">
                <span>Live Performance</span>
                <span className="text-secondary">TTFB Stable</span>
              </div>
              <div className="mt-2.5 grid grid-cols-10 items-end gap-1">
                {[20, 36, 24, 42, 30, 46, 28, 40, 25, 38].map((h, idx) => (
                  <span
                    key={`perf-${h}-${idx}`}
                    className="bar-loop rounded-sm bg-linear-to-t from-secondary/35 to-secondary/80"
                    style={{
                      height: `${h}px`,
                      ["--bar-delay" as string]: `${idx * 110}ms`,
                      ["--bar-speed" as string]: `${1.8 + idx * 0.05}s`,
                    }}
                  />
                ))}
              </div>
              <div className="mt-2.5 flex items-center justify-between rounded-lg bg-surface-high px-3 py-1.5 text-sm">
                <p className="text-on-surface-variant">Load Window</p>
                <p className="font-semibold text-secondary">1.2s avg</p>
              </div>
            </div>
          ) : null}
        </>
      )}
    </article>
  );
}
