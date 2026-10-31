import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import heroBg from "@/assets/hero-bg.jpg";
import heroPortrait from "@/assets/hero-portrait.jpg";

const HeroSection = () => {
  const { t } = useLanguage();
  const reduceMotion = useReducedMotion();

  const highlights = [
    t("hero.highlight1"),
    t("hero.highlight2"),
    t("hero.highlight3"),
  ];

  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,78%,8%)] via-[hsl(220,72%,14%)] to-[hsl(152,40%,18%)] opacity-92" />
      {/* Decorative glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10 pt-28 md:pt-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — Text */}
          <div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 mb-6"
            >
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">
                {t("hero.badge")}
              </span>
            </motion.div>

            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white leading-tight mb-6"
            >
              {t("hero.title1")}{" "}
              <span className="text-gradient-accent">{t("hero.title2")}</span>
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-white/75 mb-8 max-w-xl font-sans leading-relaxed"
            >
              {t("hero.subtitle")}
            </motion.p>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-5 mb-10"
            >
              {highlights.map((item) => (
                <div key={item} className="flex items-center gap-2 text-white/85">
                  <CheckCircle2 className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{item}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-4"
            >
              <Button
                size="lg"
                asChild
                className="bg-accent text-accent-foreground hover:bg-brand-green-dark shadow-accent text-base px-8 h-12"
              >
                <Link to="/auth?tab=signup">
                  {t("hero.cta")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-accent/40 text-accent hover:bg-accent/10 hover:text-accent text-base px-8 h-12"
              >
                <a href="#services">{t("hero.cta2")}</a>
              </Button>
            </motion.div>
          </div>

          {/* Right — Image */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-accent/10 rounded-3xl blur-2xl" />
              <img
                src={heroPortrait}
                alt="Tax consultant meeting with client"
                className="relative rounded-2xl shadow-2xl border border-white/10 w-full object-cover max-h-[550px]"
              />
              {/* Source-backed assurances instead of unverified marketing statistics. */}
              <div className="absolute -bottom-5 -left-3 rounded-xl border border-border bg-card/95 px-5 py-4 shadow-elegant backdrop-blur-md sm:-left-6">
                <p className="text-sm font-semibold text-foreground">{t("hero.proof1.title")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("hero.proof1.desc")}</p>
              </div>
              <div className="absolute -top-4 -right-2 rounded-xl border border-border bg-card/95 px-5 py-4 shadow-elegant backdrop-blur-md sm:-right-6">
                <p className="text-sm font-semibold text-foreground">{t("hero.proof2.title")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("hero.proof2.desc")}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
