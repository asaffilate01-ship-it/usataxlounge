import { useLanguage } from "@/contexts/LanguageContext";

import dHeroEn from "@/assets/shots/desktop-hero-en.jpg";
import dHeroEs from "@/assets/shots/desktop-hero-es.jpg";
import dServicesEn from "@/assets/shots/desktop-services-en.jpg";
import dServicesEs from "@/assets/shots/desktop-services-es.jpg";
import dPricingEn from "@/assets/shots/desktop-pricing-en.jpg";
import dPricingEs from "@/assets/shots/desktop-pricing-es.jpg";
import mHeroEn from "@/assets/shots/mobile-hero-en.jpg";
import mHeroEs from "@/assets/shots/mobile-hero-es.jpg";
import mAuthEn from "@/assets/shots/mobile-auth-en.jpg";
import mAuthEs from "@/assets/shots/mobile-auth-es.jpg";

const desktopShots = [
  { key: "promo.shot.hero", en: dHeroEn, es: dHeroEs },
  { key: "promo.shot.services", en: dServicesEn, es: dServicesEs },
  { key: "promo.shot.pricing", en: dPricingEn, es: dPricingEs },
];

const mobileShots = [
  { key: "promo.shot.mobileHero", en: mHeroEn, es: mHeroEs },
  { key: "promo.shot.mobileAuth", en: mAuthEn, es: mAuthEs },
];

const ScreenshotShowcase = () => {
  const { t, lang } = useLanguage();

  return (
    <section id="screens" className="py-20 md:py-28 bg-muted/40">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-accent mb-3">
            {t("promo.screens.label")}
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {t("promo.screens.title")}
          </h2>
          <p className="text-muted-foreground">{t("promo.screens.subtitle")}</p>
        </div>

        {/* Web */}
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {desktopShots.map((shot) => (
            <figure key={shot.key} className="group">
              <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden transition-transform duration-300 group-hover:-translate-y-1">
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border bg-muted/60">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-primary/30" />
                  <span className="h-2.5 w-2.5 rounded-full bg-accent/60" />
                  <span className="ml-3 text-[10px] font-medium text-muted-foreground">
                    {t("promo.screens.web")}
                  </span>
                </div>
                <img
                  src={lang === "es" ? shot.es : shot.en}
                  alt={t(shot.key)}
                  loading="lazy"
                  className="w-full h-auto"
                />
              </div>
              <figcaption className="mt-3 text-sm font-semibold text-foreground text-center">
                {t(shot.key)}
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Mobile */}
        <div className="mt-14 flex flex-wrap justify-center gap-8 md:gap-12">
          {mobileShots.map((shot) => (
            <figure key={shot.key} className="w-[220px] md:w-[250px]">
              <div className="rounded-[2.2rem] border-[6px] border-primary/90 bg-primary/90 shadow-2xl overflow-hidden">
                <div className="relative bg-card">
                  <span className="absolute top-1.5 left-1/2 -translate-x-1/2 h-1.5 w-16 rounded-full bg-primary/60 z-10" />
                  <img
                    src={lang === "es" ? shot.es : shot.en}
                    alt={t(shot.key)}
                    loading="lazy"
                    className="w-full h-auto rounded-[1.7rem]"
                  />
                </div>
              </div>
              <figcaption className="mt-3 text-sm font-semibold text-foreground text-center">
                {t(shot.key)}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScreenshotShowcase;
