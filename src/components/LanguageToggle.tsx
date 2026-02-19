import { useLanguage } from "@/contexts/LanguageContext";

const LanguageToggle = () => {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border bg-card hover:bg-muted transition-colors text-foreground"
      title={lang === "en" ? "Cambiar a Español" : "Switch to English"}
    >
      <span className="text-base leading-none">{lang === "en" ? "🇺🇸" : "🇪🇸"}</span>
      <span>{lang === "en" ? "EN" : "ES"}</span>
    </button>
  );
};

export default LanguageToggle;
