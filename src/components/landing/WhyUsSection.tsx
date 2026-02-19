import { motion } from "framer-motion";
import { Shield, Clock, Lock, Award } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCountUp } from "@/hooks/useCountUp";
import aboutTeamImg from "@/assets/about-team.jpg";

const AnimatedStat = ({ end, prefix, suffix, labelKey }: { end: number; prefix?: string; suffix?: string; labelKey: string }) => {
  const { t } = useLanguage();
  const { ref, display } = useCountUp({ end, prefix, suffix });

  return (
    <div ref={ref} className="text-center p-5 md:p-6 rounded-2xl bg-card border border-border shadow-elegant">
      <div className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-accent mb-1">
        {display}
      </div>
      <div className="text-xs sm:text-sm text-muted-foreground">{t(labelKey)}</div>
    </div>
  );
};

const WhyUsSection = () => {
  const { t } = useLanguage();

  const reasons = [
    { icon: Shield, titleKey: "whyUs.r1.title", descKey: "whyUs.r1.desc" },
    { icon: Award, titleKey: "whyUs.r2.title", descKey: "whyUs.r2.desc" },
    { icon: Lock, titleKey: "whyUs.r3.title", descKey: "whyUs.r3.desc" },
    { icon: Clock, titleKey: "whyUs.r4.title", descKey: "whyUs.r4.desc" },
  ];

  const stats = [
    { end: 1000, suffix: "s+", labelKey: "whyUs.s1" },
    { end: 98, suffix: "%", labelKey: "whyUs.s2" },
    { end: 5, prefix: "$", suffix: "M+", labelKey: "whyUs.s3" },
    { end: 20, suffix: "+", labelKey: "whyUs.s4" },
  ];

  return (
    <section id="why-us" className="py-14 md:py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-10 md:mb-14">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-sm font-semibold tracking-wider uppercase text-accent">
              {t("whyUs.label")}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-display font-bold text-foreground mt-3 mb-6 md:mb-8">
              {t("whyUs.title")}
            </h2>
            <div className="space-y-5">
              {reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <reason.icon className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-base md:text-lg font-semibold text-foreground mb-1">
                      {t(reason.titleKey)}
                    </h3>
                    <p className="text-muted-foreground text-sm">{t(reason.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <img
              src={aboutTeamImg}
              alt="TaxLounge Team of Enrolled Agents"
              className="rounded-2xl shadow-elegant w-full object-cover h-64 md:h-96"
              loading="lazy"
            />
            <div className="absolute -bottom-5 -left-3 md:-bottom-6 md:-left-6 bg-card border border-border rounded-2xl shadow-elegant p-4 md:p-5">
              <p className="text-2xl md:text-3xl font-display font-bold text-accent">1,000s+</p>
              <p className="text-xs md:text-sm text-muted-foreground">{t("whyUs.s1")}</p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <AnimatedStat {...stat} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
