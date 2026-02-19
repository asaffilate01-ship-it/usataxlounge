import { motion } from "framer-motion";
import { FileText, Globe, Building2, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const categories = [
  {
    icon: FileText,
    titleKey: "forms.cat1.title",
    descKey: "forms.cat1.desc",
    forms: ["1040", "1040-SR", "1040-NR", "1040-X", "Sch A–E", "Sch SE"],
  },
  {
    icon: Globe,
    titleKey: "forms.cat2.title",
    descKey: "forms.cat2.desc",
    forms: ["FBAR", "FATCA (8938)", "2555", "1116", "8865", "5471"],
  },
  {
    icon: Building2,
    titleKey: "forms.cat3.title",
    descKey: "forms.cat3.desc",
    forms: ["1120", "1120-S", "1065", "1041", "706 / 709", "990"],
  },
];

const TaxFormsSection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold tracking-wider uppercase text-accent">
            {t("forms.label")}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-3">
            {t("forms.title")}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            {t("forms.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {categories.map((cat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card shadow-elegant p-7 hover:shadow-accent hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent transition-colors duration-300">
                <cat.icon className="h-7 w-7 text-accent group-hover:text-accent-foreground transition-colors" />
              </div>
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {t(cat.titleKey)}
              </h3>
              <p className="text-muted-foreground text-sm mb-5 leading-relaxed">
                {t(cat.descKey)}
              </p>
              <div className="flex flex-wrap gap-2">
                {cat.forms.map((form) => (
                  <span
                    key={form}
                    className="text-xs font-mono font-semibold text-accent bg-accent/8 border border-accent/15 px-2.5 py-1 rounded-lg"
                  >
                    {form}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Expat callout banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
                {t("forms.expat.title")}
              </h3>
              <p className="text-white/70 mb-6 leading-relaxed max-w-lg">
                {t("forms.expat.desc")}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {["FBAR", "FATCA", "Form 2555", "Form 1116"].map((f) => (
                  <div key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                    <span className="text-sm text-white/85 font-medium">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center md:text-right shrink-0">
              <div className="text-5xl md:text-6xl font-display font-bold text-accent mb-1">24+</div>
              <p className="text-white/60 text-sm">{t("forms.expat.count")}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TaxFormsSection;
