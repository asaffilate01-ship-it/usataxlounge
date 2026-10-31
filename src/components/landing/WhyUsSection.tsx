import { ShieldCheck, ListChecks, Files, BadgeCheck } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import aboutTeamImg from "@/assets/about-team.jpg";

const REASONS = [
  { icon: ListChecks, titleKey: "whyUs.r1.title", descKey: "whyUs.r1.desc" },
  { icon: Files, titleKey: "whyUs.r2.title", descKey: "whyUs.r2.desc" },
  { icon: ShieldCheck, titleKey: "whyUs.r3.title", descKey: "whyUs.r3.desc" },
  { icon: BadgeCheck, titleKey: "whyUs.r4.title", descKey: "whyUs.r4.desc" },
];

const WhyUsSection = () => {
  const { t } = useLanguage();

  return (
    <section id="why-us" aria-labelledby="why-taxcenda-title" className="bg-secondary/50 py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green-dark dark:text-accent">{t("whyUs.label")}</p>
            <h2 id="why-taxcenda-title" className="mt-4 font-display text-3xl font-bold leading-tight text-foreground md:text-4xl">{t("whyUs.title")}</h2>
            <div className="mt-8 space-y-6">
              {REASONS.map(({ icon: Icon, titleKey, descKey }) => (
                <div key={titleKey} className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10" aria-hidden="true">
                    <Icon className="h-5 w-5 text-brand-green-dark dark:text-accent" />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{t(titleKey)}</h3>
                    <p className="mt-1 max-w-lg text-sm leading-6 text-muted-foreground">{t(descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <figure className="overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
            <img src={aboutTeamImg} alt="Illustrative tax consultation setting" className="h-64 w-full object-cover md:h-80" loading="lazy" />
            <figcaption className="flex flex-col gap-2 border-t border-border px-6 py-5">
              <p className="font-display text-xl font-semibold text-foreground">{t("whyUs.visual.title")}</p>
              <p className="text-sm text-muted-foreground">{t("whyUs.visual.desc")}</p>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
