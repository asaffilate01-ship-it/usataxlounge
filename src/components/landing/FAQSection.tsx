import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQSection = () => {
  const { t } = useLanguage();

  const faqs = Array.from({ length: 8 }, (_, i) => ({
    questionKey: `faq.q${i + 1}`,
    answerKey: `faq.a${i + 1}`,
  }));

  return (
    <section id="faq" className="py-10 md:py-14 bg-secondary/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <span className="text-sm font-semibold tracking-wider uppercase text-accent">
            {t("faq.label")}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-3">
            {t("faq.title")}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            {t("faq.subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-border bg-card shadow-elegant px-6 data-[state=open]:border-accent/30"
              >
                <AccordionTrigger className="text-left font-display text-base font-semibold text-foreground hover:no-underline py-5">
                  {t(faq.questionKey)}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {t(faq.answerKey)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQSection;
