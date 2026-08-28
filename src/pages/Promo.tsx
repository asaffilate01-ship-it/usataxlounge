import { useEffect } from "react";
import {
  ArrowRight,
  LayoutDashboard,
  FolderLock,
  ScanLine,
  FileSignature,
  MessagesSquare,
  ListChecks,
  ShieldCheck,
  Building2,
  CreditCard,
  Smartphone,
  Check,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";
import CookieSettingsLink from "@/components/CookieSettingsLink";

import PromoNav from "@/components/promo/PromoNav";
import AccessGate from "@/components/promo/AccessGate";
import ScreenshotShowcase from "@/components/promo/ScreenshotShowcase";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import heroShotEn from "@/assets/shots/desktop-hero-en.jpg";
import heroShotEs from "@/assets/shots/desktop-hero-es.jpg";
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

const stats = [
  { value: "5,000+", key: "promo.stats.returns" },
  { value: "$20M+", key: "promo.stats.saved" },
  { value: "98%", key: "promo.stats.retention" },
  { value: "24/7", key: "promo.stats.support" },
];

const faqs = ["1", "2", "3", "4", "5", "6"];

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

const Promo = () => {
  const { t, lang } = useLanguage();

  useEffect(() => {
    document.title = "TaxCenda — Guided US Tax Filing Platform | Private Preview";
    const desc = document.querySelector('meta[name="description"]');
    desc?.setAttribute(
      "content",
      "TaxCenda pairs IRS Enrolled Agents with a secure client portal: document vault, AI receipt scanning, e-signature, encrypted messaging and live filing status.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-0">
      <PromoNav />

      {/* Hero */}
      <section id="overview" className="relative overflow-hidden gradient-hero text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,hsl(var(--accent)/0.25),transparent_55%),radial-gradient(circle_at_85%_0%,hsl(var(--primary-glow,var(--accent))/0.18),transparent_50%)]" />
        <div className="container mx-auto px-4 relative z-10 pt-28 md:pt-40 pb-16 md:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {t("promo.badge")}
              </span>
              <h1 className="mt-6 text-3xl md:text-5xl font-bold leading-[1.08]">
                {t("promo.hero.title1")}
                <br />
                <span className="text-accent">{t("promo.hero.title2")}</span>
              </h1>
              <p className="mt-6 text-base md:text-lg text-white/80 max-w-xl">
                {t("promo.hero.subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => scrollTo("access")}
                  className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {t("promo.hero.cta")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => scrollTo("features")}
                  className="border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white"
                >
                  {t("promo.hero.cta2")}
                </Button>
              </div>
              <p className="mt-5 text-xs text-white/60">{t("promo.hero.note")}</p>
            </div>

            <div className="relative">
              <img
                src={lang === "es" ? heroShotEs : heroShotEn}
                alt={t("promo.shot.hero")}
                className="w-full rounded-2xl border border-white/15 shadow-2xl"
              />
              <img
                src={lang === "es" ? mobileShotEs : mobileShotEn}
                alt={t("promo.shot.mobileHero")}
                className="hidden sm:block absolute -bottom-10 -left-10 w-28 md:w-36 rounded-2xl border-4 border-primary shadow-2xl"
              />
            </div>
          </div>

          <dl className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div
                key={s.key}
                className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur px-5 py-6 text-center"
              >
                <dt className="sr-only">{t(s.key)}</dt>
                <dd>
                  <span className="block text-2xl md:text-3xl font-bold text-accent">{s.value}</span>
                  <span className="mt-1 block text-xs md:text-sm text-white/70">
                    {t(s.key)}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-accent mb-3">
              {t("promo.features.label")}
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
              {t("promo.features.title")}
            </h2>
            <p className="text-muted-foreground">{t("promo.features.subtitle")}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {features.map(({ icon: Icon, key }) => (
              <article
                key={key}
                className="group relative rounded-2xl border border-border bg-card p-6 md:p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-accent/40"
              >
                <span className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-accent to-primary opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-bold text-foreground">{t(`promo.${key}.title`)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`promo.${key}.desc`)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ScreenshotShowcase />

      {/* Mobile app */}
      <section id="app" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-xs font-bold tracking-[0.2em] uppercase text-accent mb-3">
                {t("promo.app.label")}
              </p>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                {t("promo.app.title")}
              </h2>
              <p className="text-muted-foreground mb-8">{t("promo.app.subtitle")}</p>
              <ul className="space-y-3">
                {["b1", "b2", "b3", "b4"].map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="text-sm text-foreground">{t(`promo.app.${b}`)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                <Smartphone className="h-4 w-4 text-accent" aria-hidden />
                iOS · Android · PWA
              </div>
            </div>

            <div className="order-1 lg:order-2 flex justify-center">
              <div className="w-[260px] rounded-[2.5rem] border-[8px] border-primary bg-primary shadow-2xl">
                <img
                  src={lang === "es" ? mobileShotEs : mobileShotEn}
                  alt={t("promo.shot.mobileHero")}
                  loading="lazy"
                  className="w-full rounded-[1.9rem]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-10 md:mb-14">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-accent mb-3">
              {t("promo.faq.label")}
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">{t("promo.faq.title")}</h2>
          </div>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((n) => (
              <AccordionItem
                key={n}
                value={n}
                className="rounded-2xl border border-border bg-card px-5 shadow-sm data-[state=open]:border-accent/40"
              >
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline">
                  {t(`promo.faq.q${n}`)}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {t(`promo.faq.a${n}`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Access */}
      <section id="access" className="py-20 md:py-28 gradient-hero text-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-4xl font-bold mb-4">{t("promo.cta.title")}</h2>
              <p className="text-white/80">{t("promo.cta.subtitle")}</p>
            </div>
            <div className="flex lg:justify-end">
              <AccessGate />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-10">
        <div className="container mx-auto px-4 flex flex-col items-center gap-4 text-center">
          <Logo size="xl" to="/" />
          <p className="text-sm text-muted-foreground">{t("promo.footer.legal")}</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {lang === "es" ? "Política de Privacidad" : "Privacy Policy"}
            </Link>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {lang === "es" ? "Términos de Servicio" : "Terms of Service"}
            </Link>
            <Link to="/cookies" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {lang === "es" ? "Política de Cookies" : "Cookie Policy"}
            </Link>
            <CookieSettingsLink />
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} iTechLounge LLC. All rights reserved.
          </p>

        </div>
      </footer>
    </div>
  );
};

export default Promo;
