import { useLanguage } from "@/contexts/LanguageContext";
import { LegalHeader, LegalFooter } from "@/components/legal/LegalChrome";

const PrivacyPolicy = () => {
  const { lang } = useLanguage();
  const isEs = lang === "es";

  return (
    <div className="min-h-screen bg-background">
      <LegalHeader />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          {isEs ? "Política de Privacidad" : "Privacy Policy"}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {isEs ? "Última actualización: 24 de febrero de 2026" : "Last updated: February 24, 2026"}
        </p>

        <div className="prose prose-sm max-w-none text-foreground space-y-8">

          {/* 1. Data Controller */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "1. Responsable del Tratamiento de Datos" : "1. Data Controller"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "TaxCenda es el responsable del tratamiento de sus datos personales. TaxCenda opera como un servicio de preparación de impuestos con licencia federal de EE.UU., con sede virtual en Miami, Florida, EE.UU., y está asociado con TaxCenda UK (taxlounge.co.uk). Para consultas sobre privacidad, contacte con nosotros en la sección de contacto de nuestra página web."
                : "TaxCenda is the data controller for your personal data. TaxCenda operates as a US federally-licensed tax preparation service with a virtual office in Miami, Florida, USA, and is associated with TaxCenda UK (taxlounge.co.uk). For privacy enquiries, please contact us via the enquiry form on our website."}
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "2. Información que Recopilamos" : "2. Information We Collect"}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {isEs
                ? "Recopilamos las siguientes categorías de datos personales:"
                : "We collect the following categories of personal data:"}
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 text-sm">
              <li>{isEs ? "Datos de identidad: nombre completo, fecha de nacimiento, número de Seguro Social (últimos 4 dígitos)" : "Identity data: full name, date of birth, Social Security Number (last 4 digits)"}</li>
              <li>{isEs ? "Datos de contacto: dirección de correo electrónico, número de teléfono, dirección postal" : "Contact data: email address, phone number, postal address"}</li>
              <li>{isEs ? "Datos financieros: información de ingresos, gastos, documentos fiscales" : "Financial data: income information, expenses, tax documents"}</li>
              <li>{isEs ? "Datos técnicos: dirección IP, tipo de navegador, datos de cookies (ver sección de Cookies)" : "Technical data: IP address, browser type, cookie data (see Cookie section)"}</li>
              <li>{isEs ? "Datos de comunicación: mensajes enviados a través de nuestro portal" : "Communication data: messages sent via our portal"}</li>
            </ul>
          </section>

          {/* 3. Lawful Basis for Processing (UK GDPR) */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "3. Base Legal para el Tratamiento (RGPD del Reino Unido)" : "3. Lawful Basis for Processing (UK GDPR)"}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {isEs
                ? "Procesamos sus datos personales bajo las siguientes bases legales del RGPD del Reino Unido y la Ley de Protección de Datos de 2018:"
                : "We process your personal data under the following lawful bases under the UK GDPR and Data Protection Act 2018:"}
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 text-sm">
              <li><strong>{isEs ? "Ejecución de un contrato" : "Performance of a contract"}</strong> — {isEs ? "para preparar y presentar sus declaraciones de impuestos" : "to prepare and file your tax returns"}</li>
              <li><strong>{isEs ? "Obligación legal" : "Legal obligation"}</strong> — {isEs ? "para cumplir con las leyes fiscales y de privacidad aplicables" : "to comply with applicable tax and privacy laws"}</li>
              <li><strong>{isEs ? "Interés legítimo" : "Legitimate interest"}</strong> — {isEs ? "para mejorar nuestros servicios, prevenir fraude y administrar nuestro negocio" : "to improve our services, prevent fraud, and administer our business"}</li>
              <li><strong>{isEs ? "Consentimiento" : "Consent"}</strong> — {isEs ? "para cookies analíticas y comunicaciones de marketing (puede retirarlo en cualquier momento)" : "for analytics cookies and marketing communications (you may withdraw at any time)"}</li>
            </ul>
          </section>

          {/* 4. How We Use Your Information */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "4. Cómo Usamos Su Información" : "4. How We Use Your Information"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Utilizamos su información personal para: preparar y presentar sus declaraciones de impuestos ante el IRS y las autoridades fiscales correspondientes; comunicarnos con usted sobre su cuenta y servicios; proporcionar representación ante el IRS; cumplir con requisitos legales y regulatorios del Reino Unido y EE.UU.; y mejorar nuestros servicios y seguridad."
                : "We use your personal information to: prepare and file your tax returns with the IRS and relevant tax authorities; communicate with you about your account and services; provide IRS representation; comply with UK and US legal and regulatory requirements; and improve our services and security."}
            </p>
          </section>

          {/* 5. International Data Transfers */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "5. Transferencias Internacionales de Datos" : "5. International Data Transfers"}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {isEs
                ? "Sus datos personales pueden ser transferidos entre el Reino Unido y los Estados Unidos. Protegemos estas transferencias mediante:"
                : "Your personal data may be transferred between the United Kingdom and the United States. We safeguard these transfers through:"}
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 text-sm">
              <li><strong>{isEs ? "Puente de Datos UK-US" : "UK-US Data Bridge"}</strong> — {isEs ? "la Extensión del Marco de Privacidad de Datos de la UE-EE.UU. al Reino Unido, vigente desde octubre de 2023, que permite transferencias conformes" : "the UK Extension to the EU-US Data Privacy Framework, effective since October 2023, which allows compliant transfers"}</li>
              <li><strong>{isEs ? "Cláusulas Contractuales Estándar" : "Standard Contractual Clauses (SCCs)"}</strong> — {isEs ? "como mecanismo de respaldo cuando sea necesario" : "as a fallback mechanism where required"}</li>
              <li><strong>{isEs ? "Evaluación de Riesgo de Transferencia" : "Transfer Risk Assessment"}</strong> — {isEs ? "realizamos evaluaciones periódicas conforme a la guía de la ICO" : "we conduct periodic assessments in line with ICO guidance"}</li>
            </ul>
          </section>

          {/* 6. Data Protection & Security */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "6. Protección y Seguridad de Datos" : "6. Data Protection & Security"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Usamos conexiones cifradas, almacenamiento privado con control de acceso, autenticación multifactor obligatoria (MFA/TOTP), registros de auditoría y otras salvaguardas basadas en riesgos. El estado del proveedor de e-file y los canales de transmisión se informan cuando están configurados para un encargo."
                : "We use encrypted connections, private access-controlled storage, mandatory multi-factor authentication (MFA/TOTP), audit logging, and other risk-based safeguards. E-file provider status and transmission channels are disclosed when configured for an engagement."}
            </p>
          </section>

          {/* 7. Information Sharing */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "7. Compartir Información" : "7. Information Sharing"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "No vendemos ni alquilamos su información personal para fines de marketing. Solo la compartimos con autoridades fiscales cuando usted lo autoriza o la ley lo exige; con proveedores que nos ayudan a operar bajo obligaciones contractuales; y cuando sea necesario para cumplir la ley."
                : "We do not sell or rent your personal information for marketing. We share it only with tax authorities when you authorize us or the law requires it, with service providers operating under contractual safeguards, and where otherwise required by law."}
            </p>
          </section>

          {/* 8. Data Retention */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "8. Retención de Datos" : "8. Data Retention"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Conservamos los registros según las leyes aplicables, las obligaciones profesionales y los términos de su encargo. Los datos no esenciales se eliminan cuando dejan de ser necesarios. Puede solicitar nuestro calendario de conservación o la eliminación de datos elegibles en cualquier momento."
                : "We retain records according to applicable law, professional obligations and your engagement terms. Non-essential data is deleted when no longer needed. You may request our retention schedule or deletion of eligible data at any time."}
            </p>
          </section>

          {/* 9. Your Rights — UK GDPR */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "9. Sus Derechos — RGPD del Reino Unido" : "9. Your Rights — UK GDPR"}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {isEs
                ? "Bajo el RGPD del Reino Unido y la Ley de Protección de Datos de 2018, usted tiene los siguientes derechos:"
                : "Under the UK GDPR and Data Protection Act 2018, you have the following rights:"}
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 text-sm">
              <li><strong>{isEs ? "Derecho de acceso" : "Right of access"}</strong> — {isEs ? "solicitar una copia de sus datos personales" : "request a copy of your personal data"}</li>
              <li><strong>{isEs ? "Derecho de rectificación" : "Right to rectification"}</strong> — {isEs ? "corregir datos inexactos o incompletos" : "correct inaccurate or incomplete data"}</li>
              <li><strong>{isEs ? "Derecho de supresión" : "Right to erasure"}</strong> — {isEs ? "solicitar la eliminación de sus datos (sujeto a obligaciones legales de retención)" : "request deletion of your data (subject to legal retention obligations)"}</li>
              <li><strong>{isEs ? "Derecho a restringir el tratamiento" : "Right to restrict processing"}</strong> — {isEs ? "limitar cómo usamos sus datos" : "limit how we use your data"}</li>
              <li><strong>{isEs ? "Derecho a la portabilidad" : "Right to data portability"}</strong> — {isEs ? "recibir sus datos en un formato estructurado y legible por máquina" : "receive your data in a structured, machine-readable format"}</li>
              <li><strong>{isEs ? "Derecho de oposición" : "Right to object"}</strong> — {isEs ? "oponerse al tratamiento basado en interés legítimo" : "object to processing based on legitimate interest"}</li>
              <li><strong>{isEs ? "Derecho a retirar el consentimiento" : "Right to withdraw consent"}</strong> — {isEs ? "retirar su consentimiento en cualquier momento sin afectar la legalidad del tratamiento anterior" : "withdraw consent at any time without affecting the lawfulness of prior processing"}</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3 text-sm">
              {isEs
                ? "Para ejercer cualquiera de estos derechos, contáctenos a través del formulario de consulta en nuestra página web. Responderemos dentro de 30 días."
                : "To exercise any of these rights, contact us via the enquiry form on our website. We will respond within 30 days."}
            </p>
          </section>

          {/* 10. Your Rights — US (CCPA & State Privacy Laws) */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "10. Sus Derechos — EE.UU. (CCPA y Leyes Estatales)" : "10. Your Rights — US (CCPA & State Privacy Laws)"}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {isEs
                ? "Dependiendo de su estado de residencia (California, Virginia, Colorado, Connecticut, Utah y otros), usted puede tener derecho a:"
                : "Depending on your state of residence (California, Virginia, Colorado, Connecticut, Utah, and others), you may have the right to:"}
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 text-sm">
              <li>{isEs ? "Acceder a la información personal que tenemos sobre usted" : "Access the personal information we hold about you"}</li>
              <li>{isEs ? "Solicitar la corrección de datos inexactos" : "Request correction of inaccurate data"}</li>
              <li>{isEs ? "Solicitar la eliminación de su información personal" : "Request deletion of your personal information"}</li>
              <li>{isEs ? "Optar por no participar en la venta de información personal (no vendemos su información)" : "Opt out of the sale of personal information (we do not sell your information)"}</li>
              <li>{isEs ? "No ser discriminado por ejercer sus derechos de privacidad" : "Not be discriminated against for exercising your privacy rights"}</li>
            </ul>
          </section>

          {/* 11. Cookies */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "11. Cookies y Tecnologías de Seguimiento" : "11. Cookies & Tracking Technologies"}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              {isEs
                ? "Utilizamos las siguientes categorías de cookies:"
                : "We use the following categories of cookies:"}
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1.5 text-sm">
              <li><strong>{isEs ? "Estrictamente necesarias" : "Strictly necessary"}</strong> — {isEs ? "requeridas para el funcionamiento del sitio (autenticación, seguridad). No requieren consentimiento." : "required for site operation (authentication, security). No consent required."}</li>
              <li><strong>{isEs ? "Analíticas" : "Analytics"}</strong> — {isEs ? "nos ayudan a entender cómo se usa el sitio. Solo se activan con su consentimiento explícito." : "help us understand how the site is used. Only activated with your explicit consent."}</li>
              <li><strong>{isEs ? "Funcionales" : "Functional"}</strong> — {isEs ? "recuerdan sus preferencias (idioma, tema). Solo se activan con su consentimiento." : "remember your preferences (language, theme). Only activated with your consent."}</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3 text-sm">
              {isEs
                ? "No utilizamos cookies publicitarias ni de seguimiento de terceros. Puede administrar sus preferencias de cookies a través de nuestro banner de cookies o la configuración de su navegador."
                : "We do not use advertising or third-party tracking cookies. You can manage your cookie preferences through our cookie banner or your browser settings."}
            </p>
          </section>

          {/* 12. ICO & Supervisory Authority */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "12. Derecho a Reclamar ante la Autoridad Supervisora" : "12. Right to Complain to Supervisory Authority"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Si considera que no hemos tratado sus datos personales de manera adecuada, tiene derecho a presentar una reclamación ante la Oficina del Comisionado de Información del Reino Unido (ICO):"
                : "If you believe we have not handled your personal data properly, you have the right to lodge a complaint with the UK Information Commissioner's Office (ICO):"}
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Information Commissioner's Office<br />
              Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF<br />
              {isEs ? "Teléfono" : "Phone"}: 0303 123 1113<br />
              {isEs ? "Sitio web" : "Website"}: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">ico.org.uk</a>
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3 text-sm">
              {isEs
                ? "Para residentes de EE.UU., puede presentar quejas ante la Comisión Federal de Comercio (FTC) en ftc.gov."
                : "For US residents, you may file complaints with the Federal Trade Commission (FTC) at ftc.gov."}
            </p>
          </section>

          {/* 13. Children's Privacy */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "13. Privacidad de Menores" : "13. Children's Privacy"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Nuestros servicios no están dirigidos a personas menores de 18 años. No recopilamos intencionalmente información personal de menores. Si descubrimos que hemos recopilado datos de un menor, los eliminaremos de inmediato."
                : "Our services are not directed to individuals under 18 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will delete it promptly."}
            </p>
          </section>

          {/* 14. Changes */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "14. Cambios a Esta Política" : "14. Changes to This Policy"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Podemos actualizar esta política periódicamente. Los cambios significativos se notificarán mediante un aviso en nuestro sitio web. La fecha de la última actualización se muestra en la parte superior de esta página."
                : "We may update this policy periodically. Significant changes will be notified via a notice on our website. The date of the last update is shown at the top of this page."}
            </p>
          </section>

          {/* 15. Contact */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "15. Contacto" : "15. Contact Us"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Si tiene preguntas sobre esta política de privacidad o desea ejercer sus derechos, utilice el formulario de consulta en nuestra página web."
                : "If you have questions about this privacy policy or wish to exercise your rights, please use the enquiry form on our website."}
            </p>
          </section>

        </div>
      </main>
      <LegalFooter />
    </div>
  );
};

export default PrivacyPolicy;
