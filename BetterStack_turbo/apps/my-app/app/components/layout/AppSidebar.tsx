"use client";

import { Bell, Globe, LayoutGrid, LogOut, Plus, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SidebarKey = "overview" | "monitors" | "incidents" | "settings";

type SidebarNavItem = {
  key: SidebarKey;
  icon: LucideIcon;
  label: string;
  href: string;
};

const sidebarNavItems: SidebarNavItem[] = [
  { key: "overview", icon: LayoutGrid, label: "Overview", href: "/dashboard" },
  { key: "monitors", icon: Globe, label: "Monitors", href: "/dashboard" },
  { key: "incidents", icon: Bell, label: "Incidents", href: "/incidents" },
  { key: "settings", icon: Settings, label: "Settings", href: "/settings" },
];

export function AppSidebar({
  active,
  onNavigate,
  onAddMonitor,
  onLogout,
}: {
  active: SidebarKey;
  onNavigate: (href: string) => void;
  onAddMonitor: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col justify-between border-r border-surface-high/20 bg-surface-low px-4 py-8 lg:flex">
      <div>
        <div className="px-4">
          <h1 className="font-display text-xl font-black tracking-tight text-primary">WebMonitor</h1>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant/60">Vigilant Lens v1.0</p>
        </div>

        <nav className="mt-10 space-y-2">
          {sidebarNavItems.map(({ key, icon: Icon, label, href }) => {
            const isActive = key === active;

            return (
              <button
                key={label}
                type="button"
                onClick={() => onNavigate(href)}
                className={`flex w-full items-center gap-4 rounded-lg px-4 py-3 text-sm transition-all duration-300 ${
                  isActive
                    ? "border-r-2 border-primary bg-surface-high font-bold text-primary"
                    : "text-on-surface-variant/70 hover:bg-surface-high hover:text-on-surface"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-inter text-sm font-medium">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={onAddMonitor}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-bold text-[#083744] transition-all hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Add Monitor
        </button>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-surface-high px-4 py-3 text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-surface"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
