import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const TermsOfService = () => {
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-8">
          {lang === "es" ? "Términos de Servicio" : "Terms of Service"}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {lang === "es" ? "Última actualización: 19 de febrero de 2026" : "Last updated: February 19, 2026"}
        </p>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "1. Aceptación de Términos" : "1. Acceptance of Terms"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "Al acceder y utilizar los servicios de TaxLounge, usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios."
                : "By accessing and using TaxLounge services, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you should not use our services."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "2. Descripción de Servicios" : "2. Description of Services"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "TaxLounge proporciona servicios de preparación y presentación de impuestos, representación ante el IRS, planificación fiscal, contabilidad y servicios relacionados a través de Agentes Inscritos con licencia federal. Nuestros servicios están disponibles para individuos, empresas y ciudadanos estadounidenses que viven en el extranjero."
                : "TaxLounge provides tax preparation and filing services, IRS representation, tax planning, bookkeeping, and related services through federally-licensed Enrolled Agents. Our services are available for individuals, businesses, and US citizens living abroad."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "3. Responsabilidades del Usuario" : "3. User Responsibilities"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "Usted es responsable de: proporcionar información precisa y completa para la preparación de impuestos, revisar y aprobar su declaración de impuestos antes de la presentación, mantener la confidencialidad de las credenciales de su cuenta, y notificarnos oportunamente de cualquier cambio en su situación fiscal."
                : "You are responsible for: providing accurate and complete information for tax preparation, reviewing and approving your tax return before filing, maintaining the confidentiality of your account credentials, and notifying us promptly of any changes to your tax situation."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "4. Tarifas y Pagos" : "4. Fees and Payments"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "Las tarifas por nuestros servicios se basan en la complejidad de su declaración de impuestos y se comunicarán antes de comenzar el trabajo. El pago se debe al momento de la finalización del servicio. Nos reservamos el derecho de ajustar los precios con previo aviso."
                : "Fees for our services are based on the complexity of your tax return and will be communicated before work begins. Payment is due upon service completion. We reserve the right to adjust pricing with prior notice."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "5. Limitación de Responsabilidad" : "5. Limitation of Liability"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "TaxLounge no será responsable por daños indirectos, incidentales o consecuentes que surjan de nuestros servicios. Nuestra responsabilidad total se limita a las tarifas pagadas por el servicio específico en cuestión. No somos responsables de penalidades del IRS resultantes de información inexacta proporcionada por el cliente."
                : "TaxLounge shall not be liable for indirect, incidental, or consequential damages arising from our services. Our total liability is limited to the fees paid for the specific service in question. We are not responsible for IRS penalties resulting from inaccurate information provided by the client."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "6. Circular 230 del IRS" : "6. IRS Circular 230 Disclosure"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "De acuerdo con la Circular 230 del IRS, cualquier asesoramiento fiscal contenido en esta comunicación no está destinado a ser utilizado, y no puede ser utilizado, con el propósito de evitar penalidades bajo el Código de Rentas Internas."
                : "In accordance with IRS Circular 230, any tax advice contained in this communication is not intended to be used, and cannot be used, for the purpose of avoiding penalties under the Internal Revenue Code."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "7. Ley Aplicable" : "7. Governing Law"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "Estos términos se rigen por las leyes del Estado de Florida y las leyes federales aplicables de los Estados Unidos. Cualquier disputa se resolverá en los tribunales del Condado de Miami-Dade, Florida."
                : "These terms are governed by the laws of the State of Florida and applicable federal laws of the United States. Any disputes shall be resolved in the courts of Miami-Dade County, Florida."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "8. Contacto" : "8. Contact"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "Para preguntas sobre estos términos, contáctenos en: info@taxlounge.com o (305) 555-0190."
                : "For questions about these terms, contact us at: info@taxlounge.com or (305) 555-0190."}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
