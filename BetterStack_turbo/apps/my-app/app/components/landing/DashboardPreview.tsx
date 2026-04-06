import { Globe, Search, Trash2 } from "lucide-react";

const bars = [78, 76, 82, 78, 80, 79, 81, 75, 70, 74, 73, 76, 77, 70, 71];

const regions = [
  { name: "US-East", status: "Operational", latency: "603ms" },
  { name: "Frankfurt", status: "Stable", latency: "641ms" },
  { name: "Singapore", status: "Optimal", latency: "588ms" },
];

export function DashboardPreview() {
  return (
    <section className="relative mt-14 overflow-hidden rounded-[2rem] border border-white/6 bg-surface-base shadow-[0_38px_110px_rgba(0,0,0,0.62)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(92,233,255,0.08),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(74,255,160,0.07),transparent_28%)]" />

      <div className="relative flex h-16 items-center gap-2.5 border-b border-white/5 bg-[#1d222c] px-4 sm:h-20 sm:px-6">
        <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
        <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
        <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        <div className="ml-2 flex-1 rounded-lg bg-[#11151d] px-4 py-2 text-left text-xs text-[#b1bdd3] shadow-inner shadow-black/30 sm:ml-4 sm:text-sm">
          app.webmonitor.io/dashboard/main-cluster
        </div>
      </div>

      <div className="relative bg-[linear-gradient(135deg,#0c1d2d_0%,#0a1824_48%,#0d141f_100%)] p-3 sm:p-5 lg:p-7">
        <div className="overflow-hidden rounded-[1.6rem] border border-white/5 bg-[#0d1118] shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_28px_80px_rgba(0,0,0,0.4)]">
          <div className="lg:hidden">
            <div className="space-y-4 p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-2xl font-black tracking-[-0.05em] text-[#74eaff] sm:text-3xl">www.google.com</p>
                  <div className="mt-1 flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#82f59d]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#45ef77] shadow-[0_0_10px_rgba(69,239,119,0.75)]" />
                    Operational
                  </div>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#803739] bg-[#271718] px-3 py-2 text-xs font-semibold text-[#ff8b8b]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>

              <div className="rounded-[1.35rem] border border-white/5 bg-[linear-gradient(90deg,rgba(17,23,32,0.98)_0%,rgba(14,25,29,0.95)_100%)] p-5">
                <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-[#8590a5]">Health Score</p>
                <div className="mt-4 flex items-end gap-2">
                  <span className="font-display text-5xl font-black leading-none tracking-[-0.06em] text-white">100%</span>
                  <span className="pb-1 text-xl text-[#66dcff]">Uptime</span>
                </div>
                <div className="mt-6 flex h-28 items-end gap-1.5">
                  {bars.slice(0, 10).map((height, index) => (
                    <div
                      key={height + index}
                      className="flex-1 rounded-t-md bg-[linear-gradient(180deg,rgba(68,132,86,0.95),rgba(36,84,54,0.95))]"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.2rem] border border-white/5 bg-[#1a202a] p-5">
                  <p className="text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-[#8590a5]">Avg Response</p>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="font-display text-5xl font-extrabold leading-none tracking-[-0.05em] text-white">603</span>
                    <span className="pb-1 text-xl font-semibold text-[#63dcff]">ms</span>
                  </div>
                </div>

                <div className="rounded-[1.2rem] border border-white/5 bg-[#1a202a] p-5">
                  <p className="text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-[#8590a5]">Global Availability</p>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="font-display text-5xl font-extrabold leading-none tracking-[-0.05em] text-white">12</span>
                    <span className="pb-1 text-xl font-semibold text-[#63dcff]">Nodes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:grid lg:grid-cols-[210px_minmax(0,1fr)]">
            <aside className="flex flex-col bg-[#0f141b] px-4 py-6">
              <div>
                <h3 className="font-display text-[1.8rem] font-extrabold tracking-[-0.04em] text-[#6ee7ff]">WebMonitor</h3>
                <p className="mt-1 text-[0.62rem] uppercase tracking-[0.28em] text-[#7e889a]">Vigilant Lens v1.0</p>
              </div>

              <nav className="mt-10 space-y-2 text-sm">
                <div className="rounded-xl px-3 py-3 text-[#818ca1]">Overview</div>
                <div className="rounded-xl border border-[#78e8ff]/45 bg-[#1d2430] px-3 py-3 font-semibold text-[#86ecff] shadow-[0_0_0_1px_rgba(120,232,255,0.06)]">
                  Monitors
                </div>
                <div className="rounded-xl px-3 py-3 text-[#818ca1]">Incidents</div>
                <div className="rounded-xl px-3 py-3 text-[#818ca1]">Settings</div>
              </nav>
            </aside>

            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-[2rem] font-black tracking-[-0.05em] text-[#74eaff]">www.google.com</p>
                  <div className="mt-1 flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#7d8798]">
                    <span className="inline-flex items-center gap-1.5 text-[#82f59d]">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#45ef77] shadow-[0_0_10px_rgba(69,239,119,0.75)]" />
                      Operational
                    </span>
                    <span>Owner: LightningSagar</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-xl bg-[#1d222c] px-4 py-3 text-sm text-[#78849a]">
                    <Search className="h-4 w-4" />
                    Quick Search...
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#8a393c] bg-[#291618] px-4 py-3 text-sm font-semibold text-[#ff8181]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_280px]">
                <div className="rounded-[1.45rem] border border-white/5 bg-[linear-gradient(90deg,rgba(18,24,33,0.98)_0%,rgba(15,25,29,0.95)_100%)] p-7">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#8793a6]">Health Score (Last 30D)</p>
                  <div className="mt-5 flex items-end gap-3">
                    <span className="font-display text-[4.6rem] font-black leading-none tracking-[-0.07em] text-white">100%</span>
                    <span className="pb-2 text-[2rem] text-[#63dcff]">Uptime</span>
                  </div>

                  <div className="mt-8 flex h-40 items-end gap-1.5">
                    {bars.map((height, index) => (
                      <div
                        key={height + index}
                        className="flex-1 rounded-t-md bg-[linear-gradient(180deg,rgba(68,132,86,0.95),rgba(36,84,54,0.95))]"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="rounded-[1.35rem] border border-white/5 bg-[#1b202b] p-6">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#8793a6]">Avg Response</p>
                    <div className="mt-6 flex items-end gap-2">
                      <span className="font-display text-6xl font-extrabold leading-none tracking-[-0.06em] text-white">603</span>
                      <span className="pb-2 text-2xl font-semibold text-[#61deff]">ms</span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#63ef95]">69% faster than last week</p>
                  </div>

                  <div className="rounded-[1.35rem] border border-white/5 bg-[#1b202b] p-6">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[#8793a6]">Global Availability</p>
                    <div className="mt-6 flex items-end gap-2">
                      <span className="font-display text-6xl font-extrabold leading-none tracking-[-0.06em] text-white">12</span>
                      <span className="pb-2 text-2xl font-semibold text-[#61deff]">Nodes</span>
                    </div>
                    <p className="mt-3 text-sm text-[#95a2b8]">Active monitoring regions</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[1.35rem] border border-white/5 bg-[#111821] p-4">
                <div className="grid grid-cols-[1.2fr_0.8fr_0.7fr] gap-3 border-b border-white/5 px-2 pb-3 text-[0.64rem] font-semibold uppercase tracking-[0.22em] text-[#707d91]">
                  <span>Region</span>
                  <span>Status</span>
                  <span>Latency</span>
                </div>

                <div className="mt-2 space-y-2">
                  {regions.map((region) => (
                    <div key={region.name} className="grid grid-cols-[1.2fr_0.8fr_0.7fr] items-center gap-3 rounded-2xl px-2 py-3">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#17212d] text-[#7de7ff]">
                          <Globe className="h-4 w-4" />
                        </span>
                        <span className="text-sm font-semibold text-white">{region.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-[#78f49e]">{region.status}</span>
                      <span className="text-sm text-[#93a0b6]">{region.latency}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
