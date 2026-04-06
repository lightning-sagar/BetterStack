import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="pt-20 text-center sm:pt-24">
      <p className="text-xs font-semibold uppercase tracking-[0.36em] text-primary">Real-time infrastructure monitoring</p>
      <h1 className="mx-auto mt-7 max-w-4xl font-display text-5xl font-extrabold leading-[0.94] tracking-[-0.04em] text-on-surface sm:text-6xl lg:text-[5.2rem]">
        Your Websites,
        <br />
        Monitored
        <br />
        <span className="bg-linear-to-r from-primary via-primary-container to-secondary bg-clip-text text-transparent">
          Every 3 Minutes
        </span>
      </h1>
      <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-on-surface-variant">
        Experience the Vigilant Lens. A precision-engineered monitoring suite that detects downtime before your
        customers do. Precision data meets editorial design.
      </p>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href="#"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-8 py-4 text-base font-bold text-[#071018] transition-colors hover:bg-primary-container sm:w-auto"
        >
          Start Monitoring for Free
          <ArrowRight className="h-5 w-5" />
        </a>
        <a
          href="#"
          className="inline-flex w-full items-center justify-center rounded-lg bg-surface-high px-8 py-4 text-base font-semibold text-on-surface transition-colors hover:bg-surface-highest sm:w-auto"
        >
          View Live Demo
        </a>
      </div>
    </section>
  );
}
