import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const CTASection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-6 md:py-10 relative overflow-hidden">
      {/* Always dark background regardless of theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,78%,10%)] via-[hsl(220,72%,18%)] to-[hsl(220,55%,28%)]" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            {t("cta.title1")}{" "}
            <span className="text-gradient-accent">{t("cta.title2")}</span>
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            {t("cta.subtitle")}
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <Button
              size="lg"
              asChild
              className="bg-accent text-accent-foreground hover:bg-brand-green-dark shadow-accent text-base px-8"
            >
              <Link to="/auth?tab=signup">
                {t("cta.button")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-8 justify-center text-white/60">
            <a href="#contact" className="flex items-center gap-2 hover:text-accent transition-colors">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{t("footer.enquiryLink")}</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
