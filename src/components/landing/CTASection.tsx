import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section id="contact" className="py-24 gradient-hero">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold text-primary-foreground mb-6">
            Ready to File with{" "}
            <span className="text-gradient-accent">Confidence?</span>
          </h2>
          <p className="text-primary-foreground/70 mb-8 text-lg">
            Join thousands of clients who trust TaxLounge's IRS Enrolled Agents
            with their taxes. Get started in minutes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <Button
              size="lg"
              asChild
              className="bg-accent text-accent-foreground hover:bg-brand-green-dark shadow-accent text-base px-8"
            >
              <Link to="/auth?tab=signup">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-8 justify-center text-primary-foreground/60">
            <a href="tel:+1234567890" className="flex items-center gap-2 hover:text-accent transition-colors">
              <Phone className="h-4 w-4" />
              <span className="text-sm">(123) 456-7890</span>
            </a>
            <a href="mailto:info@taxlounge.com" className="flex items-center gap-2 hover:text-accent transition-colors">
              <Mail className="h-4 w-4" />
              <span className="text-sm">info@taxlounge.com</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
