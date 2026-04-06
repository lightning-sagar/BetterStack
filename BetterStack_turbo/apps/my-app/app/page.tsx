import { BackgroundDecor } from "./components/landing/BackgroundDecor";
import { CTASection } from "./components/landing/CTASection";
import { DashboardPreview } from "./components/landing/DashboardPreview";
import { FeaturesSection } from "./components/landing/FeaturesSection";
import { Footer } from "./components/landing/Footer";
import { HeroSection } from "./components/landing/HeroSection";
import { Navbar } from "./components/landing/Navbar";
import { PageShell } from "./components/landing/PageShell";

export default function Home() {
  return (
    <PageShell>
      <BackgroundDecor />
      <Navbar />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
        <HeroSection />
        <DashboardPreview />
        <FeaturesSection />
        <CTASection />
      </div>
      <Footer />
    </PageShell>
  );
}
