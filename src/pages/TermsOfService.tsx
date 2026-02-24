import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const TermsOfService = () => {
  const { lang } = useLanguage();
  const isEs = lang === "es";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
          {isEs ? "Términos de Servicio" : "Terms of Service"}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {isEs ? "Última actualización: 24 de febrero de 2026" : "Last updated: February 24, 2026"}
        </p>

        <div className="prose prose-sm max-w-none text-foreground space-y-8">

          {/* 1. Acceptance */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "1. Aceptación de Términos" : "1. Acceptance of Terms"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Al acceder y utilizar los servicios de TaxLounge (operado por TaxLounge UK, taxlounge.co.uk), usted acepta estar sujeto a estos Términos de Servicio, nuestra Política de Privacidad y nuestra Política de Cookies. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios."
                : "By accessing and using TaxLounge services (operated by TaxLounge UK, taxlounge.co.uk), you agree to be bound by these Terms of Service, our Privacy Policy, and our Cookie Policy. If you do not agree with any part of these terms, you should not use our services."}
            </p>
          </section>

          {/* 2. Description of Services */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "2. Descripción de Servicios" : "2. Description of Services"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "TaxLounge proporciona servicios de preparación y presentación de impuestos de EE.UU., representación ante el IRS, planificación fiscal, contabilidad y servicios relacionados a través de Agentes Inscritos con licencia federal. Nuestros servicios están disponibles para individuos, empresas y ciudadanos estadounidenses que viven en el extranjero, incluidos los residentes del Reino Unido."
                : "TaxLounge provides US tax preparation and filing services, IRS representation, tax planning, bookkeeping, and related services through federally-licensed Enrolled Agents. Our services are available for individuals, businesses, and US citizens living abroad, including UK residents."}
            </p>
          </section>

          {/* 3. User Responsibilities */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "3. Responsabilidades del Usuario" : "3. User Responsibilities"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Usted es responsable de: proporcionar información precisa y completa para la preparación de impuestos; revisar y aprobar su declaración antes de la presentación; mantener la confidencialidad de sus credenciales (incluyendo MFA); y notificarnos oportunamente de cualquier cambio en su situación fiscal."
                : "You are responsible for: providing accurate and complete information for tax preparation; reviewing and approving your tax return before filing; maintaining the confidentiality of your account credentials (including MFA); and notifying us promptly of any changes to your tax situation."}
            </p>
          </section>

          {/* 4. Fees and Payments */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "4. Tarifas y Pagos" : "4. Fees and Payments"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Las tarifas se basan en la complejidad de su declaración y se comunicarán antes de comenzar. El pago se debe al momento de la finalización del servicio. Los precios se muestran en USD. Para clientes del Reino Unido, los pagos se procesan al tipo de cambio vigente. Nos reservamos el derecho de ajustar los precios con previo aviso."
                : "Fees are based on the complexity of your tax return and will be communicated before work begins. Payment is due upon service completion. Prices are displayed in USD. For UK-based clients, payments are processed at the prevailing exchange rate. We reserve the right to adjust pricing with prior notice."}
            </p>
          </section>

          {/* 5. UK Consumer Rights */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "5. Derechos del Consumidor del Reino Unido" : "5. UK Consumer Rights"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Si usted es un consumidor con sede en el Reino Unido, tiene derechos legales bajo la Ley de Derechos del Consumidor de 2015. Nuestros servicios deben prestarse con un cuidado y habilidad razonables. Nada en estos términos afecta sus derechos legales como consumidor. Tiene derecho a un período de reflexión de 14 días desde la aceptación de estos términos para servicios que aún no hayan comenzado."
                : "If you are a UK-based consumer, you have statutory rights under the Consumer Rights Act 2015. Our services must be provided with reasonable care and skill. Nothing in these terms affects your statutory consumer rights. You are entitled to a 14-day cooling-off period from acceptance of these terms for services that have not yet commenced."}
            </p>
          </section>

          {/* 6. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "6. Limitación de Responsabilidad" : "6. Limitation of Liability"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "TaxLounge no será responsable por daños indirectos, incidentales o consecuentes que surjan de nuestros servicios. Nuestra responsabilidad total se limita a las tarifas pagadas por el servicio específico en cuestión. No somos responsables de penalidades del IRS resultantes de información inexacta proporcionada por el cliente. Nada en estos términos excluye o limita nuestra responsabilidad por negligencia que cause muerte o lesiones personales, fraude, o cualquier otra responsabilidad que no pueda ser excluida por ley."
                : "TaxLounge shall not be liable for indirect, incidental, or consequential damages arising from our services. Our total liability is limited to the fees paid for the specific service in question. We are not responsible for IRS penalties resulting from inaccurate information provided by the client. Nothing in these terms excludes or limits our liability for negligence causing death or personal injury, fraud, or any other liability that cannot be excluded by law."}
            </p>
          </section>

          {/* 7. IRS Circular 230 */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "7. Circular 230 del IRS" : "7. IRS Circular 230 Disclosure"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "De acuerdo con la Circular 230 del IRS, cualquier asesoramiento fiscal contenido en esta comunicación no está destinado a ser utilizado, y no puede ser utilizado, con el propósito de evitar penalidades bajo el Código de Rentas Internas."
                : "In accordance with IRS Circular 230, any tax advice contained in this communication is not intended to be used, and cannot be used, for the purpose of avoiding penalties under the Internal Revenue Code."}
            </p>
          </section>

          {/* 8. Data Protection */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "8. Protección de Datos" : "8. Data Protection"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Procesamos sus datos personales de acuerdo con nuestra Política de Privacidad y en cumplimiento con el RGPD del Reino Unido, la Ley de Protección de Datos de 2018, la CCPA, y todas las leyes de privacidad aplicables. Al utilizar nuestros servicios, usted reconoce que sus datos pueden ser transferidos entre el Reino Unido y los Estados Unidos bajo los mecanismos descritos en nuestra Política de Privacidad."
                : "We process your personal data in accordance with our Privacy Policy and in compliance with the UK GDPR, Data Protection Act 2018, CCPA, and all applicable privacy laws. By using our services, you acknowledge that your data may be transferred between the UK and the United States under the safeguards described in our Privacy Policy."}
            </p>
          </section>

          {/* 9. Governing Law */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "9. Ley Aplicable y Jurisdicción" : "9. Governing Law & Jurisdiction"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Para clientes con sede en el Reino Unido: estos términos se rigen por las leyes de Inglaterra y Gales. Las disputas estarán sujetas a la jurisdicción exclusiva de los tribunales de Inglaterra y Gales. Para clientes con sede en los Estados Unidos: estos términos se rigen por las leyes del Estado de Florida y las leyes federales aplicables. Las disputas se resolverán en los tribunales del Condado de Miami-Dade, Florida."
                : "For UK-based clients: these terms are governed by the laws of England and Wales. Disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales. For US-based clients: these terms are governed by the laws of the State of Florida and applicable federal laws. Disputes shall be resolved in the courts of Miami-Dade County, Florida."}
            </p>
          </section>

          {/* 10. Dispute Resolution */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "10. Resolución de Disputas" : "10. Dispute Resolution"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Nos comprometemos a resolver las disputas de manera amistosa. Si tiene alguna queja, contáctenos primero a través del formulario de consulta en nuestra página web. Si no podemos resolver su queja, los clientes del Reino Unido pueden utilizar un servicio de resolución alternativa de disputas (ADR). Los clientes de EE.UU. pueden buscar mediación antes de iniciar procedimientos legales."
                : "We are committed to resolving disputes amicably. If you have a complaint, please contact us first via the enquiry form on our website. If we cannot resolve your complaint, UK clients may use an alternative dispute resolution (ADR) service. US clients may seek mediation before commencing legal proceedings."}
            </p>
          </section>

          {/* 11. Termination */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "11. Terminación" : "11. Termination"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Cualquiera de las partes puede terminar la relación de servicio con aviso por escrito razonable. La terminación no afecta las obligaciones ya contraídas. Retendremos sus datos según lo requieran las obligaciones legales de retención descritas en nuestra Política de Privacidad."
                : "Either party may terminate the service relationship with reasonable written notice. Termination does not affect obligations already incurred. We will retain your data as required by the legal retention obligations outlined in our Privacy Policy."}
            </p>
          </section>

          {/* 12. Contact */}
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {isEs ? "12. Contacto" : "12. Contact"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {isEs
                ? "Para preguntas sobre estos términos, utilice el formulario de consulta en nuestra página web o contáctenos al (305) 555-0190."
                : "For questions about these terms, please use the enquiry form on our website or contact us at (305) 555-0190."}
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
