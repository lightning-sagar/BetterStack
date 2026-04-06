"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { navItems } from "./data";
import { useAuthStore } from "../../store/auth-store";

export function Navbar() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  async function handleLogout() {
    await logout();
    router.replace("/sign");
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-surface-low/95 backdrop-blur-md">
      <div className="flex h-16 w-full items-center justify-between px-6 sm:px-8 lg:px-12">
        <div className="text-2xl font-display font-extrabold tracking-tight text-primary">WebMonitor</div>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          {navItems.map((item) => (
            <a
              key={item}
              className={`transition-colors ${
                item === "Dashboard" ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
              }`}
              href="#"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {token ? (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-md bg-surface-high px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-highest"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : (
            <>
              <Link href="/sign" className="hidden text-sm text-on-surface-variant transition-colors hover:text-on-surface sm:inline">
                Sign In
              </Link>
              <Link
                href="/sign"
                className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-[#071018] transition-colors hover:bg-primary-container"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
