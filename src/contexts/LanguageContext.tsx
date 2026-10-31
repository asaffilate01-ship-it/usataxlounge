import { createContext, useContext, useState, ReactNode } from "react";
import { promoTranslations } from "@/i18n/promo";

type Language = "en" | "es";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navbar
  "nav.services": { en: "Services", es: "Servicios" },
  "nav.pricing": { en: "Pricing", es: "Precios" },
  "nav.whyUs": { en: "Why Us", es: "¿Por Qué Nosotros?" },
  "nav.process": { en: "Process", es: "Proceso" },
  "nav.contact": { en: "Contact", es: "Contacto" },
  "nav.blog": { en: "Blog", es: "Blog" },
  "nav.signIn": { en: "Sign In", es: "Iniciar Sesión" },
  "nav.getStarted": { en: "Get Started", es: "Comenzar" },

  // Hero
  "hero.badge": { en: "US tax preparation with professional review", es: "Preparación de impuestos de EE. UU. con revisión profesional" },
  "hero.title1": { en: "Filed right.", es: "Declarado correctamente." },
  "hero.title2": { en: "Represented with confidence.", es: "Representado con confianza." },
  "hero.subtitle": { en: "Organise your US tax records, resolve questions and approve the final package with professional guidance—whether you live in the US or abroad.", es: "Organice sus documentos fiscales de EE. UU., resuelva preguntas y apruebe el paquete final con orientación profesional, viva en EE. UU. o en el extranjero." },
  "hero.highlight1": { en: "IRS Enrolled Agents", es: "Agentes Inscritos del IRS" },
  "hero.highlight2": { en: "Individual & Business Returns", es: "Declaraciones Individuales y Empresariales" },
  "hero.highlight3": { en: "US Expat Tax Filing", es: "Declaraciones para Expatriados" },
  "hero.cta": { en: "Start your tax workspace", es: "Abra su espacio fiscal" },
  "hero.cta2": { en: "Our Services", es: "Nuestros Servicios" },

  "hero.proof1.title": { en: "Evidence first", es: "Primero, los documentos" },
  "hero.proof1.desc": { en: "Source-linked financial records", es: "Registros vinculados a su origen" },
  "hero.proof2.title": { en: "Your approval matters", es: "Su aprobación cuenta" },
  "hero.proof2.desc": { en: "Review before any filing release", es: "Revisión antes de presentar" },
  "whyUs.visual.title": { en: "One place for the complete tax trail", es: "Un solo lugar para todo el proceso fiscal" },
  "whyUs.visual.desc": { en: "Documents · Questions · Review · Approval", es: "Documentos · Preguntas · Revisión · Aprobación" },

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
  "whyUs.label": { en: "Why TaxCenda", es: "¿Por Qué TaxCenda?" },
  "whyUs.title": { en: "A clear trail from evidence to approval", es: "Un proceso claro desde los documentos hasta la aprobación" },
  "whyUs.r1.title": { en: "Professional review", es: "Revisión profesional" },
  "whyUs.r1.desc": { en: "A preparer and reviewer workflow helps keep professional decisions separate from AI suggestions.", es: "Un proceso de preparador y revisor ayuda a mantener las decisiones profesionales separadas de las sugerencias de IA." },
  "whyUs.r2.title": { en: "Documents stay connected", es: "Documentos vinculados" },
  "whyUs.r2.desc": { en: "Receipts, statements and confirmed financial entries remain connected to their original evidence.", es: "Los recibos, extractos y asientos confirmados permanecen vinculados a sus documentos originales." },
  "whyUs.r3.title": { en: "Controlled workspace access", es: "Acceso controlado al espacio de trabajo" },
  "whyUs.r3.desc": { en: "Accounts, private document storage and role-based permissions help safeguard sensitive records.", es: "Las cuentas, el almacenamiento privado y los permisos por función ayudan a proteger los documentos confidenciales." },
  "whyUs.r4.title": { en: "Meaningful status updates", es: "Estados claros y verificables" },
  "whyUs.r4.desc": { en: "Preparation, client approval, transmission and acceptance are distinct steps. Acceptance requires verified provider evidence.", es: "La preparación, la aprobación del cliente, el envío y la aceptación son pasos distintos. La aceptación requiere confirmación del proveedor." },
  "whyUs.s1": { en: "Returns Filed", es: "Declaraciones Presentadas" },
  "whyUs.s2": { en: "Client Retention", es: "Retención de Clientes" },
  "whyUs.s3": { en: "In Tax Savings", es: "En Ahorros Fiscales" },
  "whyUs.s4": { en: "Years Experience", es: "Años de Experiencia" },
  "whyUs.global.title": { en: "US tax support at home and abroad", es: "Asistencia fiscal de EE. UU. dentro y fuera del país" },
  "whyUs.global.desc": { en: "TaxCenda is designed for US tax engagements involving residents and people living abroad. Services depend on the case and professional availability.", es: "TaxCenda está diseñado para casos fiscales de EE. UU. de residentes y personas en el extranjero. Los servicios dependen del caso y de la disponibilidad profesional." },

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
  "process.s4.desc": { en: "Your tax professional will confirm submission and acceptance when verified filing information is available.", es: "Su profesional fiscal confirmará el envío y la aceptación cuando exista información de presentación verificada." },

  // CTA
  "cta.title1": { en: "Ready to File with", es: "¿Listo para Declarar con" },
  "cta.title2": { en: "Confidence?", es: "Confianza?" },
  "cta.subtitle": { en: "Create an account to organise your source documents and start a reviewable tax-preparation workflow.", es: "Cree una cuenta para organizar sus documentos y comenzar un proceso de preparación fiscal con revisión." },
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
  "contact.subtitle": { en: "Tell us what you need help with. A team member can review your enquiry and explain the next steps.", es: "Cuéntenos en qué necesita ayuda. Nuestro equipo podrá revisar su consulta y explicarle los siguientes pasos." },
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
  "contact.successDesc": { en: "Your enquiry was received. We will respond when a team member is available.", es: "Hemos recibido su consulta. Responderemos cuando haya un miembro del equipo disponible." },
  "contact.errorTitle": { en: "Missing Fields", es: "Campos Faltantes" },
  "contact.errorDesc": { en: "Please fill in all required fields.", es: "Por favor complete todos los campos requeridos." },
  "contact.address": { en: "Remote consultations for US taxpayers", es: "Consultas a distancia para contribuyentes de EE. UU." },
  "contact.hours": { en: "Enquiries can be sent online at any time", es: "Puede enviar consultas en línea en cualquier momento" },

  // WhatsApp
  "whatsapp.label": { en: "Chat with Us", es: "Escríbenos" },

  // Footer
  "footer.copy": { en: "US taxes, clearly handled. Source-backed workspaces and professional review before filing.", es: "Impuestos de EE. UU. con claridad. Documentos vinculados y revisión profesional antes de presentar." },
  "footer.privacy": { en: "Privacy Policy", es: "Política de Privacidad" },
  "footer.terms": { en: "Terms of Service", es: "Términos de Servicio" },
  "footer.sitemap": { en: "Sitemap", es: "Mapa del Sitio" },
  "footer.servicesTitle": { en: "Services", es: "Servicios" },
  "footer.companyTitle": { en: "Company", es: "Empresa" },
  "footer.contactTitle": { en: "Contact Us", es: "Contáctenos" },
  "footer.enquiryLink": { en: "Send us an enquiry", es: "Envíenos una consulta" },
  "footer.ukLink": { en: "For UK tax & accounts, please visit taxlounge.co.uk", es: "Para impuestos y contabilidad del Reino Unido, visite taxlounge.co.uk" },
  "footer.svc1": { en: "Individual Tax Returns", es: "Declaraciones Individuales" },
  "footer.svc2": { en: "Expat & FBAR Filing", es: "Expatriados y FBAR" },
  "footer.svc3": { en: "Business Tax Filing", es: "Declaraciones Empresariales" },
  "footer.svc4": { en: "IRS Representation", es: "Representación ante el IRS" },
  "footer.svc5": { en: "Tax Planning", es: "Planificación Fiscal" },

  // Forms section
  "forms.label": { en: "Tax Forms We Handle", es: "Formularios Fiscales que Manejamos" },
  "forms.title": { en: "Every Form, Every Situation", es: "Cada Formulario, Cada Situación" },
  "forms.subtitle": {
    en: "Whether you're a W-2 employee, self-employed, or a US citizen abroad — we file it all.",
    es: "Ya sea que sea empleado W-2, trabajador independiente o ciudadano estadounidense en el extranjero — presentamos todo.",
  },
  "forms.cat1.title": { en: "Individual Returns", es: "Declaraciones Individuales" },
  "forms.cat1.desc": { en: "Complete individual tax preparation including all schedules and supporting documents for every filing status.", es: "Preparación fiscal individual completa incluyendo todos los anexos y documentos de soporte para cada estado civil." },
  "forms.cat2.title": { en: "US Expat & International", es: "Expatriados e Internacional" },
  "forms.cat2.desc": { en: "Specialized filings for US citizens abroad — foreign bank accounts, assets, income exclusions, and tax credits.", es: "Declaraciones especializadas para ciudadanos en el extranjero — cuentas bancarias, activos, exclusiones de ingresos y créditos fiscales." },
  "forms.cat3.title": { en: "Business & Estate", es: "Empresas y Herencias" },
  "forms.cat3.desc": { en: "Corporate, partnership, trust, estate, and nonprofit returns for all entity structures.", es: "Declaraciones corporativas, de sociedad, fideicomiso, herencia y organizaciones sin fines de lucro." },
  "forms.expat.title": { en: "US Citizens Living Abroad?", es: "¿Ciudadanos de EE.UU. en el Extranjero?" },
  "forms.expat.desc": { en: "We specialize in expat tax compliance — FBAR, FATCA, Foreign Earned Income Exclusion, and Foreign Tax Credits. Stay compliant from anywhere in the world.", es: "Nos especializamos en cumplimiento fiscal para expatriados — FBAR, FATCA, Exclusión de Ingresos Extranjeros y Créditos Fiscales Extranjeros. Manténgase en cumplimiento desde cualquier lugar." },
  "forms.expat.count": { en: "Forms Handled", es: "Formularios Manejados" },

  // Pricing
  "pricing.label": { en: "Transparent Pricing", es: "Precios Transparentes" },
  "pricing.title": { en: "Simple, Fair Pricing", es: "Precios Simples y Justos" },
  "pricing.subtitle": { en: "No hidden fees. Choose the plan that fits your tax situation and let our Enrolled Agents handle the rest.", es: "Sin cargos ocultos. Elija el plan que se ajuste a su situación fiscal y deje que nuestros Agentes Inscritos se encarguen del resto." },
  "pricing.popular": { en: "Most Popular", es: "Más Popular" },
  "pricing.perReturn": { en: "return", es: "declaración" },
  "pricing.cta": { en: "Get Started", es: "Comenzar" },
  "pricing.note": { en: "All plans include year-round support, secure document portal, and e-filing. Complex situations may require a custom quote.", es: "Todos los planes incluyen soporte durante todo el año, portal seguro de documentos y e-filing. Situaciones complejas pueden requerir cotización personalizada." },

  "pricing.individual.name": { en: "Individual", es: "Individual" },
  "pricing.individual.price": { en: "$199", es: "$199" },
  "pricing.individual.desc": { en: "For W-2 employees and simple returns", es: "Para empleados W-2 y declaraciones simples" },
  "pricing.individual.f1": { en: "Form 1040 preparation & e-filing", es: "Preparación y e-filing del Formulario 1040" },
  "pricing.individual.f2": { en: "All standard schedules (A, B, D)", es: "Todos los anexos estándar (A, B, D)" },
  "pricing.individual.f3": { en: "State return included", es: "Declaración estatal incluida" },
  "pricing.individual.f4": { en: "Deduction maximization review", es: "Revisión de maximización de deducciones" },
  "pricing.individual.f5": { en: "Secure document upload portal", es: "Portal seguro de carga de documentos" },

  "pricing.business.name": { en: "Business", es: "Empresarial" },
  "pricing.business.price": { en: "$499", es: "$499" },
  "pricing.business.desc": { en: "For LLCs, S-Corps, partnerships & self-employed", es: "Para LLC, S-Corps, sociedades y autónomos" },
  "pricing.business.f1": { en: "1120, 1120-S, 1065, or Schedule C", es: "1120, 1120-S, 1065 o Anexo C" },
  "pricing.business.f2": { en: "Payroll & W-2/1099 preparation", es: "Nómina y preparación de W-2/1099" },
  "pricing.business.f3": { en: "Quarterly estimated tax planning", es: "Planificación fiscal trimestral estimada" },
  "pricing.business.f4": { en: "Entity structuring advice", es: "Asesoramiento en estructura de entidades" },
  "pricing.business.f5": { en: "Year-round bookkeeping support", es: "Soporte de contabilidad todo el año" },
  "pricing.business.f6": { en: "Dedicated Enrolled Agent", es: "Agente Inscrito dedicado" },

  "pricing.expat.name": { en: "US Expat", es: "Expatriado" },
  "pricing.expat.price": { en: "$399", es: "$399" },
  "pricing.expat.desc": { en: "For US citizens & residents living abroad", es: "Para ciudadanos y residentes de EE.UU. en el extranjero" },
  "pricing.expat.f1": { en: "Form 1040 + foreign income schedules", es: "Formulario 1040 + anexos de ingresos extranjeros" },
  "pricing.expat.f2": { en: "FBAR (FinCEN 114) filing", es: "Presentación de FBAR (FinCEN 114)" },
  "pricing.expat.f3": { en: "FATCA (Form 8938) compliance", es: "Cumplimiento de FATCA (Formulario 8938)" },
  "pricing.expat.f4": { en: "Foreign Earned Income Exclusion", es: "Exclusión de Ingresos en el Extranjero" },
  "pricing.expat.f5": { en: "Foreign Tax Credit optimization", es: "Optimización de Créditos Fiscales Extranjeros" },
  "pricing.expat.f6": { en: "Treaty benefit analysis", es: "Análisis de beneficios de tratados" },

  // Source-backed TaxCenda portal capabilities
  "capabilities.label": { en: "Inside the client workspace", es: "Dentro del portal del cliente" },
  "capabilities.title": { en: "Tax records with a clear next step", es: "Documentos fiscales con un siguiente paso claro" },
  "capabilities.subtitle": { en: "Know what has been uploaded, what still needs an answer and what requires your approval.", es: "Sepa qué ha subido, qué preguntas quedan pendientes y qué necesita su aprobación." },
  "capabilities.documents.title": { en: "Bring evidence together", es: "Reúna sus documentos" },
  "capabilities.documents.desc": { en: "Upload original receipts and statements into a tax-year workspace. Review suggested entries before they are saved.", es: "Suba recibos y extractos originales a un espacio por año fiscal. Revise los asientos sugeridos antes de guardarlos." },
  "capabilities.questions.title": { en: "Resolve questions in context", es: "Resuelva preguntas con contexto" },
  "capabilities.questions.desc": { en: "Clarify missing information and potential duplicates without losing the link to the source record.", es: "Aclare la información faltante y los posibles duplicados sin perder el vínculo con el documento de origen." },
  "capabilities.approvals.title": { en: "Approve with confidence", es: "Apruebe con confianza" },
  "capabilities.approvals.desc": { en: "Track professional review and give explicit approval to the final package before any filing release.", es: "Siga la revisión profesional y apruebe expresamente el paquete final antes de autorizar su presentación." },

  // Auth
  "auth.welcomeBack": { en: "Welcome Back", es: "Bienvenido de Nuevo" },
  "auth.createAccount": { en: "Create Account", es: "Crear Cuenta" },
  "auth.signInSubtitle": { en: "Sign in to access your tax portal.", es: "Inicie sesión para acceder a su portal fiscal." },
  "auth.signUpSubtitle": { en: "Start filing your taxes with our expert agents.", es: "Comience a declarar sus impuestos con nuestros agentes expertos." },
  "auth.fullName": { en: "Full Name", es: "Nombre Completo" },
  "auth.email": { en: "Email", es: "Correo Electrónico" },
  "auth.password": { en: "Password", es: "Contraseña" },
  "auth.forgotPassword": { en: "Forgot Password?", es: "¿Olvidó su Contraseña?" },
  "auth.signIn": { en: "Sign In", es: "Iniciar Sesión" },
  "auth.signUp": { en: "Sign Up", es: "Registrarse" },
  "auth.pleaseWait": { en: "Please wait...", es: "Por favor espere..." },
  "auth.alreadyHaveAccount": { en: "Already have an account?", es: "¿Ya tiene una cuenta?" },
  "auth.noAccount": { en: "Don't have an account?", es: "¿No tiene una cuenta?" },
  "auth.back": { en: "Back", es: "Volver" },
  "auth.portalDesc": { en: "Secure portal for uploading documents, reviewing returns, and communicating with your IRS Enrolled Agent.", es: "Portal seguro para subir documentos, revisar declaraciones y comunicarse con su Agente Inscrito del IRS." },
  "auth.enterEmail": { en: "Enter Email", es: "Ingrese su Correo" },
  "auth.enterEmailDesc": { en: "Please enter your email address first.", es: "Por favor ingrese su correo electrónico primero." },
  "auth.checkEmail": { en: "Check Your Email", es: "Revise su Correo" },
  "auth.resetLinkSent": { en: "A password reset link has been sent to your email.", es: "Un enlace para restablecer su contraseña ha sido enviado a su correo." },
  "auth.accountCreated": { en: "Account Created", es: "Cuenta Creada" },
  "auth.verifyEmail": { en: "Please check your email to verify your account before signing in.", es: "Por favor revise su correo para verificar su cuenta antes de iniciar sesión." },
  "auth.emailNotVerified": { en: "Email Not Verified", es: "Correo No Verificado" },
  "auth.emailNotVerifiedDesc": { en: "Please check your inbox and verify your email before signing in.", es: "Por favor revise su bandeja de entrada y verifique su correo antes de iniciar sesión." },
  "auth.welcomeBackToast": { en: "Welcome Back", es: "Bienvenido de Nuevo" },
  "auth.redirecting": { en: "Redirecting to your dashboard...", es: "Redirigiendo a su panel..." },

  // Reset Password
  "reset.title": { en: "Set New Password", es: "Establecer Nueva Contraseña" },
  "reset.subtitle": { en: "Enter your new password below.", es: "Ingrese su nueva contraseña a continuación." },
  "reset.newPassword": { en: "New Password", es: "Nueva Contraseña" },
  "reset.confirmPassword": { en: "Confirm Password", es: "Confirmar Contraseña" },
  "reset.submit": { en: "Reset Password", es: "Restablecer Contraseña" },
  "reset.updating": { en: "Updating...", es: "Actualizando..." },
  "reset.success": { en: "Password Updated", es: "Contraseña Actualizada" },
  "reset.successDesc": { en: "Your password has been reset. Redirecting...", es: "Su contraseña ha sido restablecida. Redirigiendo..." },
  "reset.mismatch": { en: "Passwords do not match.", es: "Las contraseñas no coinciden." },
  "reset.tooShort": { en: "Password must be at least 6 characters.", es: "La contraseña debe tener al menos 6 caracteres." },
  "reset.invalidTitle": { en: "Invalid Reset Link", es: "Enlace de Restablecimiento Inválido" },
  "reset.invalidDesc": { en: "This link is invalid or has expired. Please request a new password reset.", es: "Este enlace es inválido o ha expirado. Por favor solicite un nuevo restablecimiento de contraseña." },
  "reset.backToSignIn": { en: "Back to Sign In", es: "Volver a Iniciar Sesión" },

  // 404
  "notFound.title": { en: "Page Not Found", es: "Página No Encontrada" },
  "notFound.desc": { en: "The page you're looking for doesn't exist or has been moved.", es: "La página que busca no existe o ha sido movida." },
  "notFound.goBack": { en: "Go Back", es: "Volver" },
  "notFound.home": { en: "Home", es: "Inicio" },

  // MFA
  "mfa.enrollTitle": { en: "Set Up Two-Factor Authentication", es: "Configurar Autenticación de Dos Factores" },
  "mfa.enrollDesc": { en: "Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) to secure your account.", es: "Escanee el código QR con su aplicación de autenticación (Google Authenticator, Authy, etc.) para proteger su cuenta." },
  "mfa.scanQR": { en: "Scan this QR code with your authenticator app", es: "Escanee este código QR con su app de autenticación" },
  "mfa.manualEntry": { en: "Can't scan? Enter this code manually:", es: "¿No puede escanear? Ingrese este código manualmente:" },
  "mfa.enterCode": { en: "Verification Code", es: "Código de Verificación" },
  "mfa.enable": { en: "Enable MFA", es: "Activar MFA" },
  "mfa.verify": { en: "Verify", es: "Verificar" },
  "mfa.verifying": { en: "Verifying...", es: "Verificando..." },
  "mfa.cancel": { en: "Cancel", es: "Cancelar" },
  "mfa.enabledTitle": { en: "MFA Enabled", es: "MFA Activado" },
  "mfa.enabledDesc": { en: "Two-factor authentication is now active on your account.", es: "La autenticación de dos factores está ahora activa en su cuenta." },
  "mfa.challengeTitle": { en: "Two-Factor Verification", es: "Verificación de Dos Factores" },
  "mfa.challengeDesc": { en: "Enter the 6-digit code from your authenticator app.", es: "Ingrese el código de 6 dígitos de su aplicación de autenticación." },
  "mfa.invalidCode": { en: "Invalid code. Please try again.", es: "Código inválido. Por favor intente de nuevo." },
  "mfa.signOutInstead": { en: "Sign out instead", es: "Cerrar sesión" },
  "mfa.resetSuccessTitle": { en: "MFA Reset", es: "MFA Reiniciado" },
  "mfa.resetSuccessDesc": { en: "Your authenticator has been removed. Please set up a new one.", es: "Su autenticador ha sido eliminado. Por favor configure uno nuevo." },

  // Settings
  "settings.title": { en: "Settings", es: "Configuración" },
  "settings.mfaTitle": { en: "Two-Factor Authentication", es: "Autenticación de Dos Factores" },
  "settings.mfaActive": { en: "Your account is protected with an authenticator app.", es: "Su cuenta está protegida con una aplicación de autenticación." },
  "settings.mfaInactive": { en: "Two-factor authentication is not enabled. Set it up to secure your account.", es: "La autenticación de dos factores no está activada. Configúrela para proteger su cuenta." },
  "settings.resetMFA": { en: "Reset MFA", es: "Reiniciar MFA" },
  "settings.enableMFA": { en: "Enable MFA", es: "Activar MFA" },
  "settings.resetConfirmTitle": { en: "Reset Two-Factor Authentication?", es: "¿Reiniciar Autenticación de Dos Factores?" },
  "settings.resetConfirmDesc": { en: "This will remove your current authenticator. You will need to set up a new one immediately.", es: "Esto eliminará su autenticador actual. Deberá configurar uno nuevo inmediatamente." },

  // FAQ
  "faq.label": { en: "Frequently Asked Questions", es: "Preguntas Frecuentes" },
  "faq.title": { en: "Got Questions? We Have Answers", es: "¿Tiene Preguntas? Tenemos Respuestas" },
  "faq.subtitle": { en: "Find answers to the most common tax questions from our clients.", es: "Encuentre respuestas a las preguntas fiscales más comunes de nuestros clientes." },

  "faq.q1": { en: "What is an IRS Enrolled Agent?", es: "¿Qué es un Agente Inscrito del IRS?" },
  "faq.a1": { en: "An Enrolled Agent (EA) is a federally-authorized tax practitioner who has technical expertise in taxation and is empowered by the U.S. Department of the Treasury to represent taxpayers before the IRS for audits, collections, and appeals.", es: "Un Agente Inscrito (EA) es un profesional fiscal autorizado federalmente con experiencia técnica en tributación, facultado por el Departamento del Tesoro de EE.UU. para representar contribuyentes ante el IRS en auditorías, cobros y apelaciones." },

  "faq.q2": { en: "What tax forms do you handle?", es: "¿Qué formularios fiscales manejan?" },
  "faq.a2": { en: "We handle all individual forms (1040, 1040-SR, 1040-NR), business returns (1120, 1120-S, 1065), schedules (A through SE), and international filings including FBAR (FinCEN 114), FATCA (Form 8938), and Form 2555 for foreign earned income exclusion.", es: "Manejamos todos los formularios individuales (1040, 1040-SR, 1040-NR), declaraciones empresariales (1120, 1120-S, 1065), anexos (A hasta SE), y declaraciones internacionales incluyendo FBAR (FinCEN 114), FATCA (Formulario 8938) y Formulario 2555 para exclusión de ingresos en el extranjero." },

  "faq.q3": { en: "Do you help US citizens living abroad?", es: "¿Ayudan a ciudadanos estadounidenses viviendo en el extranjero?" },
  "faq.a3": { en: "Yes! We specialize in expat tax filing. We handle FBAR, FATCA, Foreign Tax Credits (Form 1116), and the Foreign Earned Income Exclusion (Form 2555) for US citizens and residents living or working overseas.", es: "¡Sí! Nos especializamos en declaraciones de expatriados. Manejamos FBAR, FATCA, Créditos Fiscales Extranjeros (Formulario 1116) y la Exclusión de Ingresos en el Extranjero (Formulario 2555) para ciudadanos y residentes estadounidenses viviendo o trabajando en el exterior." },

  "faq.q4": { en: "How much does your service cost?", es: "¿Cuánto cuesta su servicio?" },
  "faq.a4": { en: "Our pricing depends on the complexity of your return. Simple W-2 returns start at $199, while business returns and complex filings are quoted based on your specific situation. Contact us for a free estimate.", es: "Nuestros precios dependen de la complejidad de su declaración. Las declaraciones simples W-2 comienzan en $199, mientras que las declaraciones empresariales y presentaciones complejas se cotizan según su situación específica. Contáctenos para un presupuesto gratuito." },

  "faq.q5": { en: "Is my financial data secure?", es: "¿Están seguros mis datos financieros?" },
  "faq.a5": { en: "We use encrypted connections, private document storage and mandatory multi-factor authentication. Access is limited to you and authorized tax staff. E-file provider details are shown when configured for your engagement.", es: "Usamos conexiones cifradas, almacenamiento privado de documentos y autenticación multifactor obligatoria. El acceso está limitado a usted y al personal fiscal autorizado. Los datos del proveedor de e-file se muestran cuando están configurados para su caso." },

  "faq.q6": { en: "Can you help with back taxes or unfiled returns?", es: "¿Pueden ayudar con impuestos atrasados o declaraciones no presentadas?" },
  "faq.a6": { en: "Yes, we help clients file returns for prior years, submit Form 1040-X amendments, and negotiate with the IRS on penalty abatement and installment agreements for outstanding tax liabilities.", es: "Sí, ayudamos a clientes a presentar declaraciones de años anteriores, enviar enmiendas del Formulario 1040-X y negociar con el IRS sobre reducción de penalidades y acuerdos de pago para obligaciones fiscales pendientes." },

  "faq.q7": { en: "What is the deadline for filing my taxes?", es: "¿Cuál es la fecha límite para declarar mis impuestos?" },
  "faq.a7": { en: "For most individual taxpayers, the deadline is April 15. US citizens abroad get an automatic extension to June 15. We can also file Form 4868 for a 6-month extension to October 15 if needed.", es: "Para la mayoría de contribuyentes individuales, la fecha límite es el 15 de abril. Los ciudadanos estadounidenses en el extranjero obtienen una extensión automática hasta el 15 de junio. También podemos presentar el Formulario 4868 para una extensión de 6 meses hasta el 15 de octubre si es necesario." },

  "faq.q8": { en: "How do I get started?", es: "¿Cómo empiezo?" },
  "faq.a8": { en: "Simply create a free account on our portal, upload your tax documents, and your assigned Enrolled Agent will review everything and prepare your return. You can e-sign and approve it right from your dashboard.", es: "Simplemente cree una cuenta gratuita en nuestro portal, suba sus documentos fiscales, y su Agente Inscrito asignado revisará todo y preparará su declaración. Puede firmar electrónicamente y aprobarla directamente desde su panel." },
};

Object.assign(translations, promoTranslations);

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
