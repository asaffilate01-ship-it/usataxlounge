import { motion } from "framer-motion";
import { UserPlus, Upload, FileCheck, Download } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create Your Account",
    description: "Sign up in minutes and get matched with your dedicated Enrolled Agent.",
  },
  {
    icon: Upload,
    step: "02",
    title: "Upload Documents",
    description: "Securely submit your income, expenses, and tax documents through our portal.",
  },
  {
    icon: FileCheck,
    step: "03",
    title: "Review & E-Sign",
    description: "Review your prepared return, approve it with an electronic signature.",
  },
  {
    icon: Download,
    step: "04",
    title: "Filed & Delivered",
    description: "We e-file with the IRS and deliver your copies — track everything from your dashboard.",
  },
];

const ProcessSection = () => {
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
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-3">
            Simple 4-Step Process
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative"
            >
              <div className="text-6xl font-display font-bold text-accent/10 mb-2">
                {step.step}
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                <step.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;
