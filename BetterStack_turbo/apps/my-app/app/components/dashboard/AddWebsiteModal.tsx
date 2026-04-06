"use client";

import { useEffect, useState } from "react";
import { X, PlusCircle, Clock4, Link2, BadgeCheck } from "lucide-react";

type AddWebsiteModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (url: string) => Promise<void>;
  isSubmitting: boolean;
};

export function AddWebsiteModal({ open, onClose, onSubmit, isSubmitting }: AddWebsiteModalProps) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!open) {
      setUrl("");
    }
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (open) {
      window.addEventListener("keydown", onKeyDown);
    }

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl bg-surface-low p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-high hover:text-on-surface"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">WebMonitor</p>
          <h3 className="mt-2 font-display text-3xl font-semibold text-on-surface">Add Monitor</h3>
          <p className="mt-2 text-sm leading-7 text-on-surface-variant">
            Configure a new sentinel for your digital infrastructure.
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSubmit(url);
          }}
        >
          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              Website URL
            </label>
            <div className="flex h-12 items-center gap-2 rounded-md bg-surface-high px-3">
              <Link2 className="h-4 w-4 text-on-surface-variant" />
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                className="w-full bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant"
                placeholder="https://example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              Friendly Name
            </label>
            <input
              className="h-12 w-full rounded-md bg-surface-high px-4 text-sm text-on-surface placeholder:text-on-surface-variant"
              placeholder="e.g., My Blog"
            />
          </div>

          <div className="rounded-xl bg-surface-high p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">Monitoring Interval</p>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-on-surface">
                <Clock4 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Every 3 minutes</span>
              </div>
              <BadgeCheck className="h-4 w-4 text-primary" />
            </div>
          </div>

          <div className="rounded-2xl bg-linear-to-r from-secondary/18 to-primary/8 p-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-secondary">
            Hyper-vigilance active: sub-second latency detection enabled
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-[#071018] transition-colors hover:bg-primary-container disabled:cursor-not-allowed disabled:opacity-70"
            >
              <PlusCircle className="h-4 w-4" />
              {isSubmitting ? "Adding..." : "Start Monitoring"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-12 items-center justify-center rounded-md bg-surface-high px-5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-highest"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
