export function CTASection() {
  return (
    <section className="mt-12 rounded-4xl bg-linear-to-r from-[#123228] via-surface-high to-[#1c2b39] px-6 py-12 text-center sm:px-10 sm:py-14">
      <h3 className="mx-auto max-w-3xl font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.04em] text-on-surface sm:text-6xl">
        Stop Guessing.
        <br />
        Start Monitoring.
      </h3>
      <p className="mx-auto mt-6 max-w-2xl text-xl leading-9 text-on-surface-variant">
        Join 15,000+ developers who trust WebMonitor to keep their digital storefronts open 24/7.
      </p>

      <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href="#"
          className="inline-flex min-w-52 items-center justify-center rounded-lg bg-primary px-8 py-4 text-xl font-bold text-[#071018] transition-colors hover:bg-primary-container"
        >
          Get Started Now
        </a>
        <a
          href="#"
          className="inline-flex min-w-52 items-center justify-center rounded-lg bg-surface-high/80 px-8 py-4 text-xl font-semibold text-on-surface transition-colors hover:bg-surface-highest"
        >
          Talk to Sales
        </a>
      </div>

      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant">
        No credit card required • 14-day pro trial
      </p>
    </section>
  );
}
