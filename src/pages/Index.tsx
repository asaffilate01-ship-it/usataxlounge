import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ServicesSection from "@/components/landing/ServicesSection";
import TaxFormsSection from "@/components/landing/TaxFormsSection";
import PricingSection from "@/components/landing/PricingSection";
import WhyUsSection from "@/components/landing/WhyUsSection";
import ProcessSection from "@/components/landing/ProcessSection";
import WorkspaceCapabilitiesSection from "@/components/landing/WorkspaceCapabilitiesSection";
import FAQSection from "@/components/landing/FAQSection";
import BlogSection from "@/components/landing/BlogSection";
import ContactSection from "@/components/landing/ContactSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import ScreenshotShowcase from "@/components/promo/ScreenshotShowcase";
import FloatingButtons from "@/components/FloatingButtons";

const Index = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-background focus:px-4 focus:py-3 focus:text-foreground focus:shadow-elegant">{t("nav.skip")}</a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
      <HeroSection />
      <ServicesSection />
      <ScreenshotShowcase />
      <TaxFormsSection />
      <PricingSection />
      <WhyUsSection />
      <ProcessSection />
      <WorkspaceCapabilitiesSection />
      <FAQSection />
      <BlogSection />
      <ContactSection />
      <CTASection />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default Index;
