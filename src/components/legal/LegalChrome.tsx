import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import CookieSettingsLink from "@/components/CookieSettingsLink";
import { useLanguage } from "@/contexts/LanguageContext";
import { hasPreviewAccess } from "@/lib/previewAccess";

/**
 * Legal pages are publicly reachable, but the full marketing chrome belongs to
 * the gated site. Visitors without preview access get a minimal public shell.
 */
export const LegalHeader = () => {
  if (hasPreviewAccess()) return <Navbar />;
  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <Logo size="xl" to="/" />
      </div>
    </header>
  );
};

export const LegalFooter = () => {
  const { lang } = useLanguage();
  const isEs = lang === "es";

  if (hasPreviewAccess()) return <Footer />;

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-8 flex flex-col gap-3 items-center text-center">
        <nav className="flex flex-wrap justify-center gap-4 text-sm">
          <Link to="/privacy" className="text-muted-foreground hover:text-accent">
            {isEs ? "Privacidad" : "Privacy"}
          </Link>
          <Link to="/terms" className="text-muted-foreground hover:text-accent">
            {isEs ? "Términos" : "Terms"}
          </Link>
          <Link to="/cookies" className="text-muted-foreground hover:text-accent">
            {isEs ? "Cookies" : "Cookies"}
          </Link>
          <CookieSettingsLink className="text-muted-foreground hover:text-accent" />
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} TaxCenda —{" "}
          {isEs
            ? "TaxCenda es un nombre comercial de iTechLounge LLC."
            : "TaxCenda is a trading name of iTechLounge LLC."}
        </p>
      </div>
    </footer>
  );
};
