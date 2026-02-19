import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-28">
          <Logo size="lg" />

          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t("nav.services")}</a>
            <a href="#why-us" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t("nav.whyUs")}</a>
            <a href="#process" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t("nav.process")}</a>
            <Link to="/blog" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t("nav.blog")}</Link>
            <a href="#contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{t("nav.contact")}</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <Button variant="outline" asChild className="border-primary/30 hover:border-primary">
              <Link to="/auth">{t("nav.signIn")}</Link>
            </Button>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-brand-green-dark shadow-accent">
              <Link to="/auth?tab=signup">{t("nav.getStarted")}</Link>
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <LanguageToggle />
            <ThemeToggle />
            <button className="text-foreground" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-3">
              <a href="#services" className="text-sm font-medium text-muted-foreground py-2">{t("nav.services")}</a>
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
