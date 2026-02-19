import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "es";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navbar
  "nav.services": { en: "Services", es: "Servicios" },
  "nav.whyUs": { en: "Why Us", es: "¿Por Qué Nosotros?" },
  "nav.process": { en: "Process", es: "Proceso" },
  "nav.contact": { en: "Contact", es: "Contacto" },
  "nav.blog": { en: "Blog", es: "Blog" },
  "nav.signIn": { en: "Sign In", es: "Iniciar Sesión" },
  "nav.getStarted": { en: "Get Started", es: "Comenzar" },

  // Hero
  "hero.badge": { en: "IRS Authorised Enrolled Agents", es: "Agentes Inscritos Autorizados por el IRS" },
  "hero.title1": { en: "Making Tax", es: "Haciendo Impuestos" },
  "hero.title2": { en: "Less Taxing.", es: "Menos Agotadores." },
  "hero.subtitle": {
    en: "We represent you before the IRS, file all federal and state forms, and maximize your refund — for individuals and businesses alike.",
    es: "Lo representamos ante el IRS, presentamos todos los formularios federales y estatales, y maximizamos su reembolso — tanto para individuos como para empresas.",
  },
  "hero.highlight1": { en: "IRS Enrolled Agents", es: "Agentes Inscritos del IRS" },
  "hero.highlight2": { en: "Individual & Business Returns", es: "Declaraciones Individuales y Empresariales" },
  "hero.highlight3": { en: "US Expat Tax Filing", es: "Declaraciones para Expatriados" },
  "hero.cta": { en: "Start Filing Today", es: "Comience a Declarar Hoy" },
  "hero.cta2": { en: "Our Services", es: "Nuestros Servicios" },

  // Services
  "services.label": { en: "What We Offer", es: "Lo Que Ofrecemos" },
  "services.title": { en: "Comprehensive Tax Services", es: "Servicios Fiscales Integrales" },
  "services.subtitle": {
    en: "From individual returns to complex business filings and US expat taxes, our IRS Enrolled Agents handle it all.",
    es: "Desde declaraciones individuales hasta presentaciones empresariales complejas e impuestos de expatriados, nuestros Agentes Inscritos del IRS lo manejan todo.",
  },

  "services.individual.title": { en: "Individual Tax Returns", es: "Declaraciones de Impuestos Individuales" },
  "services.individual.desc": { en: "Form 1040, 1040-SR for seniors, all schedules (A, B, C, D, E, SE) and supporting documents filed accurately.", es: "Formulario 1040, 1040-SR para adultos mayores, todos los anexos (A, B, C, D, E, SE) y documentos de soporte presentados con precisión." },

  "services.expat.title": { en: "US Expat & FBAR Filing", es: "Declaración de Expatriados y FBAR" },
  "services.expat.desc": { en: "Form 1040-NR, FBAR (FinCEN 114), FATCA (Form 8938), and Foreign Tax Credits for US citizens living abroad.", es: "Formulario 1040-NR, FBAR (FinCEN 114), FATCA (Formulario 8938), y Créditos Fiscales Extranjeros para ciudadanos estadounidenses en el exterior." },

  "services.business.title": { en: "Business Tax Filing", es: "Declaraciones de Impuestos Empresariales" },
  "services.business.desc": { en: "1120, 1120-S, 1065, and Schedule C filings for all business structures including LLCs, S-Corps, and partnerships.", es: "Formularios 1120, 1120-S, 1065 y Anexo C para todas las estructuras empresariales, incluyendo LLC, S-Corps y sociedades." },

  "services.irs.title": { en: "IRS Representation", es: "Representación ante el IRS" },
  "services.irs.desc": { en: "As Enrolled Agents, we represent you in audits, appeals, collections, and offer in compromise before the IRS.", es: "Como Agentes Inscritos, lo representamos en auditorías, apelaciones, cobros y ofertas de compromiso ante el IRS." },

  "services.planning.title": { en: "Tax Planning & Strategy", es: "Planificación y Estrategia Fiscal" },
  "services.planning.desc": { en: "Proactive strategies to minimize tax liability with estimated payments, retirement planning, and entity structuring.", es: "Estrategias proactivas para minimizar la carga fiscal con pagos estimados, planificación de jubilación y estructuración de entidades." },

  "services.payroll.title": { en: "Payroll & Bookkeeping", es: "Nómina y Contabilidad" },
  "services.payroll.desc": { en: "Complete payroll processing, W-2/1099 preparation, quarterly filings, and year-round bookkeeping services.", es: "Procesamiento completo de nóminas, preparación de W-2/1099, presentaciones trimestrales y servicios de contabilidad durante todo el año." },

  "services.amendments.title": { en: "Amendments & Back Filing", es: "Enmiendas y Declaraciones Atrasadas" },
  "services.amendments.desc": { en: "Form 1040-X amendments, unfiled returns for prior years, and IRS penalty abatement requests.", es: "Enmiendas del Formulario 1040-X, declaraciones no presentadas de años anteriores y solicitudes de reducción de penalidades del IRS." },

  "services.estate.title": { en: "Estate & Gift Tax", es: "Impuesto sobre Herencias y Donaciones" },
  "services.estate.desc": { en: "Form 706 estate tax returns, Form 709 gift tax returns, and trust income tax filings (Form 1041).", es: "Declaraciones de impuesto sobre herencias (Formulario 706), impuesto sobre donaciones (Formulario 709) y declaraciones de fideicomisos (Formulario 1041)." },

  // Why Us
  "whyUs.label": { en: "Why TaxLounge", es: "¿Por Qué TaxLounge?" },
  "whyUs.title": { en: "Trusted by Thousands", es: "La Confianza de Miles" },
  "whyUs.r1.title": { en: "IRS Enrolled Agents", es: "Agentes Inscritos del IRS" },
  "whyUs.r1.desc": { en: "Federally licensed tax practitioners with unlimited rights to represent taxpayers before the IRS.", es: "Profesionales fiscales con licencia federal y derechos ilimitados para representar contribuyentes ante el IRS." },
  "whyUs.r2.title": { en: "20+ Years Experience", es: "20+ Años de Experiencia" },
  "whyUs.r2.desc": { en: "Decades of expertise navigating complex tax situations for individuals and businesses.", es: "Décadas de experiencia manejando situaciones fiscales complejas para individuos y empresas." },
  "whyUs.r3.title": { en: "Secure & Compliant", es: "Seguro y Conforme" },
  "whyUs.r3.desc": { en: "Bank-level encryption protects your financial data. Full IRS e-file authorization.", es: "Cifrado de nivel bancario protege sus datos financieros. Autorización completa para e-file del IRS." },
  "whyUs.r4.title": { en: "Year-Round Support", es: "Soporte Todo el Año" },
  "whyUs.r4.desc": { en: "We're available beyond tax season — whenever you need guidance, we're here.", es: "Estamos disponibles más allá de la temporada de impuestos — cuando necesite orientación, aquí estamos." },
  "whyUs.s1": { en: "Returns Filed", es: "Declaraciones Presentadas" },
  "whyUs.s2": { en: "Client Retention", es: "Retención de Clientes" },
  "whyUs.s3": { en: "Refunds Secured", es: "Reembolsos Asegurados" },
  "whyUs.s4": { en: "Years Experience", es: "Años de Experiencia" },

  // Process
  "process.label": { en: "How It Works", es: "Cómo Funciona" },
  "process.title": { en: "Simple 4-Step Process", es: "Proceso Simple de 4 Pasos" },
  "process.s1.title": { en: "Create Your Account", es: "Cree Su Cuenta" },
  "process.s1.desc": { en: "Sign up in minutes and get matched with your dedicated Enrolled Agent.", es: "Regístrese en minutos y conecte con su Agente Inscrito dedicado." },
  "process.s2.title": { en: "Upload Documents", es: "Suba Documentos" },
  "process.s2.desc": { en: "Securely submit your income, expenses, and tax documents through our portal.", es: "Envíe de forma segura sus ingresos, gastos y documentos fiscales a través de nuestro portal." },
  "process.s3.title": { en: "Review & E-Sign", es: "Revise y Firme" },
  "process.s3.desc": { en: "Review your prepared return, approve it with an electronic signature.", es: "Revise su declaración preparada, apruébela con una firma electrónica." },
  "process.s4.title": { en: "Filed & Delivered", es: "Presentado y Entregado" },
  "process.s4.desc": { en: "We e-file with the IRS and deliver your copies — track everything from your dashboard.", es: "Presentamos electrónicamente ante el IRS y entregamos sus copias — siga todo desde su panel." },

  // CTA
  "cta.title1": { en: "Ready to File with", es: "¿Listo para Declarar con" },
  "cta.title2": { en: "Confidence?", es: "Confianza?" },
  "cta.subtitle": {
    en: "Join thousands of clients who trust TaxLounge's IRS Enrolled Agents with their taxes. Get started in minutes.",
    es: "Únase a miles de clientes que confían en los Agentes Inscritos de TaxLounge para sus impuestos. Comience en minutos.",
  },
  "cta.button": { en: "Create Free Account", es: "Crear Cuenta Gratis" },

  // Blog
  "blog.label": { en: "Tax Insights", es: "Perspectivas Fiscales" },
  "blog.title": { en: "Latest from Our Blog", es: "Lo Último de Nuestro Blog" },
  "blog.readMore": { en: "Read More", es: "Leer Más" },
  "blog.viewAll": { en: "View All Articles", es: "Ver Todos los Artículos" },
  "blog.pageTitle": { en: "Tax Insights & Guides", es: "Perspectivas y Guías Fiscales" },
  "blog.pageSubtitle": { en: "Expert tax advice from our IRS Enrolled Agents to help you stay informed and save money.", es: "Asesoría fiscal experta de nuestros Agentes Inscritos del IRS para mantenerlo informado y ahorrar dinero." },
  "blog.backHome": { en: "Back to Home", es: "Volver al Inicio" },
  "blog.backBlog": { en: "Back to Blog", es: "Volver al Blog" },

  // Contact
  "contact.label": { en: "Get In Touch", es: "Contáctenos" },
  "contact.title": { en: "Let's Start a Conversation", es: "Iniciemos una Conversación" },
  "contact.subtitle": { en: "Have a question about your taxes? Our Enrolled Agents are ready to help. Send us a message and we'll respond within 24 hours.", es: "¿Tiene una pregunta sobre sus impuestos? Nuestros Agentes Inscritos están listos para ayudar. Envíenos un mensaje y responderemos dentro de 24 horas." },
  "contact.name": { en: "Full Name", es: "Nombre Completo" },
  "contact.namePh": { en: "John Doe", es: "Juan Pérez" },
  "contact.email": { en: "Email", es: "Correo Electrónico" },
  "contact.emailPh": { en: "john@example.com", es: "juan@ejemplo.com" },
  "contact.phone": { en: "Phone (optional)", es: "Teléfono (opcional)" },
  "contact.phonePh": { en: "(555) 123-4567", es: "(555) 123-4567" },
  "contact.subject": { en: "Subject", es: "Asunto" },
  "contact.subjectPh": { en: "Tax filing question", es: "Pregunta sobre declaración" },
  "contact.message": { en: "Message", es: "Mensaje" },
  "contact.messagePh": { en: "Tell us about your tax situation...", es: "Cuéntenos sobre su situación fiscal..." },
  "contact.send": { en: "Send Message", es: "Enviar Mensaje" },
  "contact.sending": { en: "Sending...", es: "Enviando..." },
  "contact.successTitle": { en: "Message Sent!", es: "¡Mensaje Enviado!" },
  "contact.successDesc": { en: "We'll get back to you within 24 hours.", es: "Le responderemos dentro de 24 horas." },
  "contact.errorTitle": { en: "Missing Fields", es: "Campos Faltantes" },
  "contact.errorDesc": { en: "Please fill in all required fields.", es: "Por favor complete todos los campos requeridos." },
  "contact.address": { en: "123 Financial District, Miami, FL 33131", es: "123 Distrito Financiero, Miami, FL 33131" },
  "contact.hours": { en: "Mon-Fri 9AM-6PM EST", es: "Lun-Vie 9AM-6PM EST" },

  // Footer
  "footer.copy": { en: "IRS Authorised Enrolled Agents. Making Tax Less Taxing.", es: "Agentes Inscritos Autorizados por el IRS. Haciendo Impuestos Menos Agotadores." },
  "footer.privacy": { en: "Privacy Policy", es: "Política de Privacidad" },
  "footer.terms": { en: "Terms of Service", es: "Términos de Servicio" },
  "footer.sitemap": { en: "Sitemap", es: "Mapa del Sitio" },
  "footer.servicesTitle": { en: "Services", es: "Servicios" },
  "footer.companyTitle": { en: "Company", es: "Empresa" },
  "footer.contactTitle": { en: "Contact Us", es: "Contáctenos" },

  // Forms section
  "forms.label": { en: "Tax Forms We Handle", es: "Formularios Fiscales que Manejamos" },
  "forms.title": { en: "Every Form, Every Situation", es: "Cada Formulario, Cada Situación" },
  "forms.subtitle": {
    en: "Whether you're a W-2 employee, self-employed, or a US citizen abroad — we file it all.",
    es: "Ya sea que sea empleado W-2, trabajador independiente o ciudadano estadounidense en el extranjero — presentamos todo.",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key: string) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("taxlounge-lang");
    return (saved === "es" ? "es" : "en") as Language;
  });

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("taxlounge-lang", newLang);
  };

  const t = (key: string): string => {
    return translations[key]?.[lang] || translations[key]?.["en"] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
