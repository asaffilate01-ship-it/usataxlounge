import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ServicesSection from "@/components/landing/ServicesSection";
import TaxFormsSection from "@/components/landing/TaxFormsSection";
import WhyUsSection from "@/components/landing/WhyUsSection";
import ProcessSection from "@/components/landing/ProcessSection";
import BlogSection from "@/components/landing/BlogSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <TaxFormsSection />
      <WhyUsSection />
      <ProcessSection />
      <BlogSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
