import { openCookieSettings } from "@/lib/cookieConsent";
import { useLanguage } from "@/contexts/LanguageContext";

const CookieSettingsLink = ({ className = "" }: { className?: string }) => {
  const { lang } = useLanguage();
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className={`text-xs text-muted-foreground hover:text-foreground transition-colors ${className}`}
    >
      {lang === "es" ? "Configurar cookies" : "Cookie Settings"}
    </button>
  );
};

export default CookieSettingsLink;
