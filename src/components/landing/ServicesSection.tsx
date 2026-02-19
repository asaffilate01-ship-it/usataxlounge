import { motion } from "framer-motion";
import {
  FileText,
  Building2,
  ShieldCheck,
  Scale,
  Calculator,
  Users,
  Globe,
  FileEdit,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ServicesSection = () => {
  const { t } = useLanguage();

  const services = [
    { icon: FileText, titleKey: "services.individual.title", descKey: "services.individual.desc" },
    { icon: Globe, titleKey: "services.expat.title", descKey: "services.expat.desc" },
    { icon: Building2, titleKey: "services.business.title", descKey: "services.business.desc" },
    { icon: ShieldCheck, titleKey: "services.irs.title", descKey: "services.irs.desc" },
    { icon: Scale, titleKey: "services.planning.title", descKey: "services.planning.desc" },
    { icon: Calculator, titleKey: "services.payroll.title", descKey: "services.payroll.desc" },
    { icon: FileEdit, titleKey: "services.amendments.title", descKey: "services.amendments.desc" },
    { icon: Users, titleKey: "services.estate.title", descKey: "services.estate.desc" },
  ];

  return (
    <section id="services" className="py-14 md:py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <span className="text-sm font-semibold tracking-wider uppercase text-accent">
            {t("services.label")}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-3">
            {t("services.title")}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            {t("services.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="group p-6 rounded-2xl border border-border bg-card shadow-elegant hover:shadow-accent hover:-translate-y-1 transition-all duration-300 hover:border-accent/30"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300">
                <service.icon className="h-6 w-6 text-accent group-hover:text-accent-foreground transition-colors" />
              </div>
              <h3 className="font-display text-lg font-semibold text-card-foreground mb-2">
                {t(service.titleKey)}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t(service.descKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
