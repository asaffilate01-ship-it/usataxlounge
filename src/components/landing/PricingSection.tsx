import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const PricingSection = () => {
  const { t } = useLanguage();

  const plans = [
    {
      nameKey: "pricing.individual.name",
      priceKey: "pricing.individual.price",
      descKey: "pricing.individual.desc",
      featuresKeys: [
        "pricing.individual.f1",
        "pricing.individual.f2",
        "pricing.individual.f3",
        "pricing.individual.f4",
        "pricing.individual.f5",
      ],
      popular: false,
    },
    {
      nameKey: "pricing.business.name",
      priceKey: "pricing.business.price",
      descKey: "pricing.business.desc",
      featuresKeys: [
        "pricing.business.f1",
        "pricing.business.f2",
        "pricing.business.f3",
        "pricing.business.f4",
        "pricing.business.f5",
        "pricing.business.f6",
      ],
      popular: true,
    },
    {
      nameKey: "pricing.expat.name",
      priceKey: "pricing.expat.price",
      descKey: "pricing.expat.desc",
      featuresKeys: [
        "pricing.expat.f1",
        "pricing.expat.f2",
        "pricing.expat.f3",
        "pricing.expat.f4",
        "pricing.expat.f5",
        "pricing.expat.f6",
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-14 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <span className="text-sm font-semibold tracking-wider uppercase text-accent">
            {t("pricing.label")}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-3">
            {t("pricing.title")}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            {t("pricing.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl border p-7 flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "border-accent bg-card shadow-accent scale-[1.02]"
                  : "border-border bg-card shadow-elegant"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-accent text-accent-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-accent">
                    <Star className="h-3 w-3 fill-current" />
                    {t("pricing.popular")}
                  </span>
                </div>
              )}

              <h3 className="font-display text-xl font-bold text-foreground mb-1">
                {t(plan.nameKey)}
              </h3>
              <p className="text-sm text-muted-foreground mb-5">
                {t(plan.descKey)}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-display font-bold text-foreground">
                  {t(plan.priceKey)}
                </span>
                <span className="text-muted-foreground text-sm ml-1">/ {t("pricing.perReturn")}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.featuresKeys.map((fk) => (
                  <li key={fk} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{t(fk)}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={`w-full h-11 ${
                  plan.popular
                    ? "bg-accent text-accent-foreground hover:bg-brand-green-dark shadow-accent"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                <Link to="/auth?tab=signup">
                  {t("pricing.cta")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mt-8"
        >
          {t("pricing.note")}
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
