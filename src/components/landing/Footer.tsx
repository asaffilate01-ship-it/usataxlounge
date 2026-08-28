import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";
import CookieSettingsLink from "@/components/CookieSettingsLink";
import { Facebook, Twitter, Youtube, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const { t, lang } = useLanguage();


  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/taxlounge", label: "Facebook" },
    { icon: Twitter, href: "https://x.com/taxlounge", label: "Twitter" },
    { icon: Youtube, href: "https://www.youtube.com/@taxlounge", label: "YouTube" },
    { icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15z"/>
      </svg>
    ), href: "https://www.tiktok.com/@taxlounge", label: "TikTok" },
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 py-10">
          {/* Brand */}
          <div className="space-y-5">
            <Logo size="xl" to="/home" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("footer.copy")}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider mb-4">{t("footer.servicesTitle")}</h4>
            <ul className="space-y-2.5">
              {["footer.svc1", "footer.svc2", "footer.svc3", "footer.svc4", "footer.svc5"].map((key) => (
                <li key={key}>
                  <a href="#services" className="text-sm text-muted-foreground hover:text-accent transition-colors">{t(key)}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider mb-4">{t("footer.companyTitle")}</h4>
            <ul className="space-y-2.5">
              <li><a href="#why-us" className="text-sm text-muted-foreground hover:text-accent transition-colors">{t("nav.whyUs")}</a></li>
              <li><a href="#process" className="text-sm text-muted-foreground hover:text-accent transition-colors">{t("nav.process")}</a></li>
              <li><Link to="/blog" className="text-sm text-muted-foreground hover:text-accent transition-colors">{t("nav.blog")}</Link></li>
              <li><a href="#contact" className="text-sm text-muted-foreground hover:text-accent transition-colors">{t("nav.contact")}</a></li>
              <li>
                <a href="https://taxlounge.co.uk" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-accent transition-colors">
                  {t("footer.ukLink").split("taxlounge.co.uk")[0]}taxlounge.co.uk
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground uppercase tracking-wider mb-4">{t("footer.contactTitle")}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <a href="#contact" className="text-sm text-muted-foreground hover:text-accent transition-colors">{t("footer.enquiryLink")}</a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span className="text-sm text-muted-foreground">{t("contact.address")}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border py-4">


          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} TaxCenda. All rights reserved. TaxCenda is a trading name of iTechLounge LLC.
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("footer.privacy")}</Link>
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("footer.terms")}</Link>
              <Link to="/cookies" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{lang === "es" ? "Política de Cookies" : "Cookie Policy"}</Link>
              <CookieSettingsLink />
              <a href="/sitemap.xml" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t("footer.sitemap")}</a>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
