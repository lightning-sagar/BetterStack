import { FeatureCard } from "./FeatureCard";
import { features } from "./data";

export function FeaturesSection() {
  return (
    <section className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
      {features.map((feature) => (
        <FeatureCard key={feature.title} feature={feature} />
      ))}
    </section>
  );
}
