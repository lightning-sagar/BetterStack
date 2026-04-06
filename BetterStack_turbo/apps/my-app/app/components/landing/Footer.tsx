export function Footer({ className = "" }: { className?: string }) {
  return (
    <footer className={`mt-8 w-full flex-col gap-5 border-t border-white/5 py-8 sm:flex sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div>
        <p className="font-display text-2xl font-extrabold text-primary">WebMonitor</p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-on-surface-variant">
          © 2024 Obsidian Pulse WebMonitor. All rights reserved.
        </p>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant">
        <a href="#" className="transition-colors hover:text-on-surface">
          Privacy Policy
        </a>
        <a href="#" className="transition-colors hover:text-on-surface">
          Terms of Service
        </a>
        <a href="#" className="transition-colors hover:text-on-surface">
          Status Page
        </a>
        <a href="#" className="transition-colors hover:text-on-surface">
          Contact
        </a>
      </div>
    </footer>
  );
}
