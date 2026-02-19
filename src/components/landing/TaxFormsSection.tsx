import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import expatImg from "@/assets/expat-services.jpg";

const formGroups = [
  {
    category: { en: "Individual Returns", es: "Declaraciones Individuales" },
    forms: [
      { form: "Form 1040", desc: { en: "US Individual Income Tax Return", es: "Declaración de Impuestos Individuales de EE.UU." } },
      { form: "Form 1040-SR", desc: { en: "US Tax Return for Seniors (65+)", es: "Declaración para Adultos Mayores (65+)" } },
      { form: "Form 1040-NR", desc: { en: "US Nonresident Alien Income Tax", es: "Impuestos para Extranjeros No Residentes" } },
      { form: "Form 1040-X", desc: { en: "Amended US Individual Tax Return", es: "Declaración Individual Enmendada" } },
      { form: "Schedule A", desc: { en: "Itemized Deductions", es: "Deducciones Detalladas" } },
      { form: "Schedule B", desc: { en: "Interest & Dividends", es: "Intereses y Dividendos" } },
      { form: "Schedule C", desc: { en: "Self-Employment / Sole Proprietor", es: "Trabajo Independiente / Propietario Único" } },
      { form: "Schedule D", desc: { en: "Capital Gains & Losses", es: "Ganancias y Pérdidas de Capital" } },
      { form: "Schedule E", desc: { en: "Rental, Royalty, Partnership Income", es: "Ingresos de Alquiler, Regalías, Sociedades" } },
      { form: "Schedule SE", desc: { en: "Self-Employment Tax", es: "Impuesto de Trabajo Independiente" } },
    ],
  },
  {
    category: { en: "US Expat & International", es: "Expatriados e Internacional" },
    forms: [
      { form: "FBAR (FinCEN 114)", desc: { en: "Foreign Bank Account Report", es: "Reporte de Cuentas Bancarias Extranjeras" } },
      { form: "Form 8938 (FATCA)", desc: { en: "Statement of Foreign Financial Assets", es: "Declaración de Activos Financieros Extranjeros" } },
      { form: "Form 2555", desc: { en: "Foreign Earned Income Exclusion", es: "Exclusión de Ingresos Obtenidos en el Extranjero" } },
      { form: "Form 1116", desc: { en: "Foreign Tax Credit", es: "Crédito Fiscal Extranjero" } },
      { form: "Form 8865", desc: { en: "Foreign Partnerships", es: "Sociedades Extranjeras" } },
      { form: "Form 5471", desc: { en: "Foreign Corporation Reporting", es: "Reporte de Corporaciones Extranjeras" } },
    ],
  },
  {
    category: { en: "Business & Other", es: "Empresas y Otros" },
    forms: [
      { form: "Form 1120", desc: { en: "US Corporation Income Tax", es: "Impuesto de Corporaciones de EE.UU." } },
      { form: "Form 1120-S", desc: { en: "S Corporation Tax Return", es: "Declaración de S Corporation" } },
      { form: "Form 1065", desc: { en: "Partnership Return", es: "Declaración de Sociedad" } },
      { form: "Form 1041", desc: { en: "Trust & Estate Income Tax", es: "Impuesto de Fideicomisos y Herencias" } },
      { form: "Form 706", desc: { en: "Estate Tax Return", es: "Declaración de Impuesto sobre Herencias" } },
      { form: "Form 709", desc: { en: "Gift Tax Return", es: "Declaración de Impuesto sobre Donaciones" } },
      { form: "Form 990", desc: { en: "Exempt Organization Return", es: "Declaración de Organización Exenta" } },
      { form: "W-2 / 1099 Prep", desc: { en: "Employee & Contractor Forms", es: "Formularios de Empleados y Contratistas" } },
    ],
  },
];

const TaxFormsSection = () => {
  const { lang, t } = useLanguage();

  return (
    <section className="py-24 bg-secondary/50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold tracking-wider uppercase text-accent">
            {t("forms.label")}
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-3">
            {t("forms.title")}
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            {t("forms.subtitle")}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {formGroups.map((group, gi) => (
            <motion.div
              key={gi}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: gi * 0.1 }}
              className="rounded-2xl border border-border bg-card shadow-elegant p-6"
            >
              <h3 className="font-display text-lg font-semibold text-foreground mb-4 pb-3 border-b border-border">
                {group.category[lang]}
              </h3>
              <div className="space-y-2.5">
                {group.forms.map((f) => (
                  <div key={f.form} className="flex items-start gap-3">
                    <span className="text-xs font-mono font-semibold text-accent bg-accent/10 px-2 py-1 rounded shrink-0 mt-0.5">
                      {f.form}
                    </span>
                    <span className="text-sm text-muted-foreground leading-snug">{f.desc[lang]}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-2xl overflow-hidden"
        >
          <img src={expatImg} alt="US Expat Tax Services" className="w-full h-64 object-cover" />
          <div className="absolute inset-0 gradient-hero opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center text-center p-8">
            <div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
                {lang === "en" ? "US Citizens Living Abroad?" : "¿Ciudadanos de EE.UU. Viviendo en el Extranjero?"}
              </h3>
              <p className="text-white/70 max-w-xl mx-auto">
                {lang === "en"
                  ? "We specialize in expat tax filing — FBAR, FATCA, Foreign Earned Income Exclusion, and Foreign Tax Credits. Stay compliant from anywhere in the world."
                  : "Nos especializamos en declaraciones de expatriados — FBAR, FATCA, Exclusión de Ingresos Extranjeros y Créditos Fiscales Extranjeros. Manténgase en cumplimiento desde cualquier lugar del mundo."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TaxFormsSection;
