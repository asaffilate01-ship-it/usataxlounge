import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const PrivacyPolicy = () => {
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-8">
          {lang === "es" ? "Política de Privacidad" : "Privacy Policy"}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {lang === "es" ? "Última actualización: 19 de febrero de 2026" : "Last updated: February 19, 2026"}
        </p>

        <div className="prose prose-sm max-w-none text-foreground space-y-6">
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "1. Información que Recopilamos" : "1. Information We Collect"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "Recopilamos información personal que usted nos proporciona directamente, incluyendo nombre, dirección de correo electrónico, número de teléfono, número de Seguro Social (últimos 4 dígitos), información financiera relacionada con la preparación de impuestos, y documentos que usted carga en nuestro portal seguro."
                : "We collect personal information that you provide directly to us, including name, email address, phone number, Social Security Number (last 4 digits), financial information related to tax preparation, and documents you upload to our secure portal."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "2. Cómo Usamos Su Información" : "2. How We Use Your Information"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "Utilizamos su información personal para: preparar y presentar sus declaraciones de impuestos, comunicarnos con usted sobre su cuenta, proporcionar representación ante el IRS, cumplir con requisitos legales y regulatorios, y mejorar nuestros servicios."
                : "We use your personal information to: prepare and file your tax returns, communicate with you about your account, provide IRS representation, comply with legal and regulatory requirements, and improve our services."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "3. Protección de Datos" : "3. Data Protection"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "Implementamos cifrado de nivel bancario de 256 bits y medidas de seguridad estándar de la industria para proteger su información personal. Estamos autorizados por el IRS como proveedores de e-file y cumplimos con todas las regulaciones federales y estatales aplicables."
                : "We implement bank-level 256-bit encryption and industry-standard security measures to protect your personal information. We are IRS-authorized e-file providers and comply with all applicable federal and state regulations."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "4. Compartir Información" : "4. Information Sharing"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "No vendemos, alquilamos ni compartimos su información personal con terceros para fines de marketing. Solo compartimos su información con: el IRS y las autoridades fiscales estatales según sea necesario para presentar sus declaraciones, proveedores de servicios que nos ayudan a operar nuestro negocio (sujeto a obligaciones de confidencialidad), y según lo requiera la ley."
                : "We do not sell, rent, or share your personal information with third parties for marketing purposes. We only share your information with: the IRS and state tax authorities as necessary to file your returns, service providers who help us operate our business (subject to confidentiality obligations), and as required by law."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "5. Retención de Datos" : "5. Data Retention"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "Retenemos los registros de declaraciones de impuestos y documentos de respaldo durante un mínimo de 7 años según lo requieren las regulaciones del IRS. Puede solicitar la eliminación de datos no esenciales en cualquier momento contactándonos."
                : "We retain tax return records and supporting documents for a minimum of 7 years as required by IRS regulations. You may request deletion of non-essential data at any time by contacting us."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "6. Sus Derechos (CCPA / Privacidad de EE.UU.)" : "6. Your Rights (CCPA / US Privacy)"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "Dependiendo de su estado de residencia, usted puede tener derecho a: acceder a la información personal que tenemos sobre usted, solicitar la corrección de datos inexactos, solicitar la eliminación de su información personal, optar por no participar en la venta de información personal (no vendemos su información), y no ser discriminado por ejercer sus derechos de privacidad."
                : "Depending on your state of residence, you may have the right to: access the personal information we hold about you, request correction of inaccurate data, request deletion of your personal information, opt out of the sale of personal information (we do not sell your information), and not be discriminated against for exercising your privacy rights."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "7. Cookies y Seguimiento" : "7. Cookies & Tracking"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "Utilizamos cookies esenciales para el funcionamiento del sitio y cookies analíticas para mejorar nuestros servicios. Puede controlar las preferencias de cookies a través de la configuración de su navegador. No utilizamos cookies para publicidad dirigida."
                : "We use essential cookies for site functionality and analytics cookies to improve our services. You can control cookie preferences through your browser settings. We do not use cookies for targeted advertising."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground">
              {lang === "es" ? "8. Contacto" : "8. Contact Us"}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {lang === "es"
                ? "Si tiene preguntas sobre esta política de privacidad o desea ejercer sus derechos, contáctenos en: info@taxlounge.com o (305) 555-0190."
                : "If you have questions about this privacy policy or wish to exercise your rights, contact us at: info@taxlounge.com or (305) 555-0190."}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
