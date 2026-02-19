import { useLanguage } from "@/contexts/LanguageContext";

interface LanguageToggleProps {
  scrolled?: boolean;
}

const LanguageToggle = ({ scrolled = true }: LanguageToggleProps) => {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
        scrolled
          ? "border border-border bg-card hover:bg-muted text-foreground"
          : "border border-white/30 bg-white/10 hover:bg-white/20 text-white"
      }`}
      title={lang === "en" ? "Cambiar a Español" : "Switch to English"}
    >
      <span className="text-base leading-none">{lang === "en" ? "🇺🇸" : "🇪🇸"}</span>
      <span>{lang === "en" ? "EN" : "ES"}</span>
    </button>
  );
};

export default LanguageToggle;
