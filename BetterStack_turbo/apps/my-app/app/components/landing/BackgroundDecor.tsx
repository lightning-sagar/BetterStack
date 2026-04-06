export function BackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-x-0 top-0 h-144 bg-[radial-gradient(circle_at_50%_8%,rgba(120,236,255,0.17),transparent_62%)]" />
      <div className="absolute -left-48 top-64 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-40 top-232 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
    </div>
  );
}
