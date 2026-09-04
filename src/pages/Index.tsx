import { useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import PlatformSection from "@/components/landing/PlatformSection";
import ScreenshotShowcase from "@/components/promo/ScreenshotShowcase";
import ServicesSection from "@/components/landing/ServicesSection";
import TaxFormsSection from "@/components/landing/TaxFormsSection";
import PricingSection from "@/components/landing/PricingSection";
import WhyUsSection from "@/components/landing/WhyUsSection";
import ProcessSection from "@/components/landing/ProcessSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import BlogSection from "@/components/landing/BlogSection";
import ContactSection from "@/components/landing/ContactSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import FloatingButtons from "@/components/FloatingButtons";

const Index = () => {
  useEffect(() => {
    document.title = "TaxCenda — Guided US Tax Filing & Secure Client Portal";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        "TaxCenda pairs IRS Enrolled Agents with a secure client portal for document collection, receipt scanning, messaging, e-signatures, payments and filing progress.",
      );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <PlatformSection />
      <ScreenshotShowcase />
      <ServicesSection />
      <TaxFormsSection />
      <PricingSection />
      <WhyUsSection />
      <ProcessSection />
      <TestimonialsSection />
      <FAQSection />
      <BlogSection />
      <ContactSection />
      <CTASection />
      <Footer />
      <FloatingButtons />
    </div>
  );
};

export default Index;
