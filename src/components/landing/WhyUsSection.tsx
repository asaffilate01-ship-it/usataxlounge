import { motion } from "framer-motion";
import { Shield, Clock, Lock, Award } from "lucide-react";

const reasons = [
  {
    icon: Shield,
    title: "IRS Enrolled Agents",
    description: "Federally licensed tax practitioners with unlimited rights to represent taxpayers before the IRS.",
  },
  {
    icon: Award,
    title: "20+ Years Experience",
    description: "Decades of expertise navigating complex tax situations for individuals and businesses.",
  },
  {
    icon: Lock,
    title: "Secure & Compliant",
    description: "Bank-level encryption protects your financial data. Full IRS e-file authorization.",
  },
  {
    icon: Clock,
    title: "Year-Round Support",
    description: "We're available beyond tax season — whenever you need guidance, we're here.",
  },
];

const stats = [
  { value: "5,000+", label: "Returns Filed" },
  { value: "98%", label: "Client Retention" },
  { value: "$12M+", label: "Refunds Secured" },
  { value: "20+", label: "Years Experience" },
];

const WhyUsSection = () => {
  return (
    <section id="why-us" className="py-24 bg-secondary/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold tracking-wider uppercase text-accent">
            Why TaxLounge
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-3">
            Trusted by Thousands
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6"
            >
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <reason.icon className="h-7 w-7 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {reason.title}
              </h3>
              <p className="text-muted-foreground text-sm">{reason.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-6 rounded-xl bg-card border border-border shadow-elegant"
            >
              <div className="text-3xl md:text-4xl font-display font-bold text-gradient-gold mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyUsSection;
