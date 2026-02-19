import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const TestimonialsSection = () => {
  const { t } = useLanguage();

  const testimonials = [
    { nameKey: "testimonial.1.name", roleKey: "testimonial.1.role", textKey: "testimonial.1.text", stars: 5 },
    { nameKey: "testimonial.2.name", roleKey: "testimonial.2.role", textKey: "testimonial.2.text", stars: 5 },
    { nameKey: "testimonial.3.name", roleKey: "testimonial.3.role", textKey: "testimonial.3.text", stars: 5 },
    { nameKey: "testimonial.4.name", roleKey: "testimonial.4.role", textKey: "testimonial.4.text", stars: 5 },
    { nameKey: "testimonial.5.name", roleKey: "testimonial.5.role", textKey: "testimonial.5.text", stars: 4 },
    { nameKey: "testimonial.6.name", roleKey: "testimonial.6.role", textKey: "testimonial.6.text", stars: 5 },
  ];

  return (
    <section className="py-10 md:py-14 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <span className="text-sm font-semibold tracking-wider uppercase text-accent">
            {t("testimonials.label")}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-3">
            {t("testimonials.title")}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            {t("testimonials.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative p-6 rounded-2xl border border-border bg-card shadow-elegant hover:shadow-accent transition-all duration-300 group"
            >
              <Quote className="absolute top-5 right-5 h-8 w-8 text-accent/10 group-hover:text-accent/20 transition-colors" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className={`h-4 w-4 ${s < item.stars ? "text-warning fill-warning" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 italic">
                "{t(item.textKey)}"
              </p>
              <div className="flex items-center gap-3 border-t border-border pt-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {t(item.nameKey).split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t(item.nameKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(item.roleKey)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
