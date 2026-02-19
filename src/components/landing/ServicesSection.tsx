import { motion } from "framer-motion";
import {
  FileText,
  Building2,
  ShieldCheck,
  Scale,
  Calculator,
  Users,
} from "lucide-react";

const services = [
  {
    icon: FileText,
    title: "Individual Tax Returns",
    description: "Form 1040, schedules, and all supporting documents filed accurately and on time.",
  },
  {
    icon: Building2,
    title: "Business Tax Filing",
    description: "1120, 1120-S, 1065, and Schedule C filings for all business structures.",
  },
  {
    icon: ShieldCheck,
    title: "IRS Representation",
    description: "As Enrolled Agents, we represent you in audits, appeals, and collections before the IRS.",
  },
  {
    icon: Scale,
    title: "Tax Planning",
    description: "Proactive strategies to minimize tax liability for current and future years.",
  },
  {
    icon: Calculator,
    title: "Bookkeeping",
    description: "Accurate financial records year-round to make tax season stress-free.",
  },
  {
    icon: Users,
    title: "Payroll Services",
    description: "Complete payroll processing, W-2/1099 preparation, and quarterly filings.",
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold tracking-wider uppercase text-accent">
            What We Offer
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-3">
            Comprehensive Tax Services
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            From individual returns to complex business filings, our IRS Enrolled Agents handle it all.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-xl border border-border bg-card shadow-elegant hover:shadow-gold transition-all duration-300 hover:border-accent/30"
            >
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <service.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-display text-xl font-semibold text-card-foreground mb-2">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
