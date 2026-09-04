import { Link } from "react-router-dom";
import {
  Building2,
  Check,
  CreditCard,
  FileSignature,
  FolderLock,
  LayoutDashboard,
  ListChecks,
  MessagesSquare,
  ScanLine,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import mobileShotEn from "@/assets/shots/mobile-hero-en.jpg";
import mobileShotEs from "@/assets/shots/mobile-hero-es.jpg";

const features = [
  { icon: LayoutDashboard, key: "f1" },
  { icon: FolderLock, key: "f2" },
  { icon: ScanLine, key: "f3" },
  { icon: FileSignature, key: "f4" },
  { icon: MessagesSquare, key: "f5" },
  { icon: ListChecks, key: "f6" },
  { icon: ShieldCheck, key: "f7" },
  { icon: Building2, key: "f8" },
  { icon: CreditCard, key: "f9" },
];

const PlatformSection = () => {
  const { t, lang } = useLanguage();

  return (
    <>
      <section id="platform" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              {t("promo.features.label")}
            </p>
            <h2 className="text-2xl font-bold text-foreground md:text-4xl">
              {t("promo.features.title")}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {t("promo.features.subtitle")}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, key }) => (
              <article
                key={key}
                className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 hover:shadow-xl"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-bold text-foreground">
                  {t(`promo.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`promo.${key}.desc`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="mobile-app" className="py-16 md:py-24">
        <div className="container mx-auto grid items-center gap-12 px-4 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-accent">
              {t("promo.app.label")}
            </p>
            <h2 className="text-2xl font-bold text-foreground md:text-4xl">
              {t("promo.app.title")}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {t("promo.app.subtitle")}
            </p>
            <ul className="mt-7 space-y-3">
              {["b1", "b2", "b3", "b4"].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="text-sm text-foreground">
                    {t(`promo.app.${item}`)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                <Smartphone className="h-4 w-4 text-accent" aria-hidden />
                iOS · Android · PWA
              </span>
              <Button asChild>
                <Link to="/auth?tab=signup">
                  {lang === "es" ? "Crear cuenta" : "Create account"}
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-[250px] rounded-[2.5rem] border-[8px] border-primary bg-primary shadow-2xl">
              <img
                src={lang === "es" ? mobileShotEs : mobileShotEn}
                alt={t("promo.shot.mobileHero")}
                loading="lazy"
                className="w-full rounded-[1.9rem]"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PlatformSection;
