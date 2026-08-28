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
    <section id="process" className="py-6 md:py-10 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6 md:mb-10"
        >
          <span className="text-sm font-semibold tracking-wider uppercase text-accent">
            {t("process.label")}
          </span>
          <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mt-3">
            {t("process.title")}
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-accent/20 via-accent/40 to-accent/20" />
          
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="relative mx-auto w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-5 border-2 border-accent/20">
                <step.icon className="h-7 w-7 text-accent" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg">
                  {step.step}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {t(step.titleKey)}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">{t(step.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
