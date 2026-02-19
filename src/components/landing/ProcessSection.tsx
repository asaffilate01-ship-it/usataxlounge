import { motion } from "framer-motion";
import { UserPlus, Upload, FileCheck, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ProcessSection = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: UserPlus, step: "01", titleKey: "process.s1.title", descKey: "process.s1.desc" },
    { icon: Upload, step: "02", titleKey: "process.s2.title", descKey: "process.s2.desc" },
    { icon: FileCheck, step: "03", titleKey: "process.s3.title", descKey: "process.s3.desc" },
    { icon: Download, step: "04", titleKey: "process.s4.title", descKey: "process.s4.desc" },
  ];

  return (
    <section id="process" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold tracking-wider uppercase text-accent">
            {t("process.label")}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-3">
            {t("process.title")}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              <div className="text-6xl font-display font-bold text-accent/10 mb-2">
                {step.step}
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <step.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {t(step.titleKey)}
              </h3>
              <p className="text-muted-foreground text-sm">{t(step.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
