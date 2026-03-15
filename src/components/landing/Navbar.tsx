import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-card/95 backdrop-blur-xl border-b border-border shadow-elegant"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo size="lg" />

          <div className="hidden md:flex items-center gap-8">
            {[
              { href: "#services", label: t("nav.services") },
              { href: "#pricing", label: t("nav.pricing") },
              { href: "#why-us", label: t("nav.whyUs") },
              { href: "#process", label: t("nav.process") },
              { href: "#contact", label: t("nav.contact") },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  scrolled
                    ? "text-muted-foreground hover:text-foreground"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/blog"
              className={`text-sm font-medium transition-colors ${
                scrolled
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {t("nav.blog")}
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle scrolled={scrolled} />
            <Button
              variant="outline"
              asChild
              className={`transition-all ${
                scrolled
                  ? "border-primary/30 hover:border-primary"
                  : "border-white/40 text-white bg-white/10 hover:bg-white/20"
              }`}
            >
              <Link to="/auth">{t("nav.signIn")}</Link>
            </Button>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-brand-green-dark shadow-accent">
              <Link to="/auth?tab=signup">{t("nav.getStarted")}</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageToggle scrolled={scrolled} />
            <button
              className={`${scrolled ? "text-foreground" : "text-white"}`}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className={`md:hidden py-4 border-t ${scrolled ? "border-border" : "border-white/10"}`}>
            <div className="flex flex-col gap-3">
              <a href="#services" className="text-sm font-medium text-muted-foreground py-2">{t("nav.services")}</a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground py-2">{t("nav.pricing")}</a>
              <a href="#why-us" className="text-sm font-medium text-muted-foreground py-2">{t("nav.whyUs")}</a>
              <a href="#process" className="text-sm font-medium text-muted-foreground py-2">{t("nav.process")}</a>
              <Link to="/blog" className="text-sm font-medium text-muted-foreground py-2">{t("nav.blog")}</Link>
              <a href="#contact" className="text-sm font-medium text-muted-foreground py-2">{t("nav.contact")}</a>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" asChild className="flex-1 border-primary/30">
                  <Link to="/auth">{t("nav.signIn")}</Link>
                </Button>
                <Button asChild className="flex-1 bg-accent text-accent-foreground hover:bg-brand-green-dark">
                  <Link to="/auth?tab=signup">{t("nav.getStarted")}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
