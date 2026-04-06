import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return <main className="relative overflow-x-hidden">{children}</main>;
}
