import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { openCookieSettings } from "@/lib/cookieConsent";

const CookiePolicy = () => {
  const { lang } = useLanguage();
  const isEs = lang === "es";

  const rows = [
    {
      name: isEs ? "Estrictamente necesarias" : "Strictly necessary",
      purpose: isEs
        ? "Sesión de autenticación, protección CSRF, consentimiento de cookies, acceso al portal."
        : "Authentication session, CSRF protection, cookie consent record, portal access.",
      retention: isEs ? "Sesión – 12 meses" : "Session – 12 months",
    },
    {
      name: isEs ? "Funcionales" : "Functional",
      purpose: isEs
        ? "Recuerdan preferencias como idioma, tema y elementos descartados."
        : "Remember preferences such as language, theme and dismissed items.",
      retention: isEs ? "12 meses" : "12 months",
    },
    {
      name: isEs ? "Analíticas" : "Analytics",
      purpose: isEs
        ? "Estadísticas agregadas de uso para mejorar el servicio. Solo con su consentimiento."
        : "Aggregated usage statistics to improve the service. Only set with your consent.",
      retention: isEs ? "Hasta 24 meses" : "Up to 24 months",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Logo size="xl" to="/" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-14 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
          {isEs ? "Política de Cookies" : "Cookie Policy"}
        </h1>
        <p className="text-sm text-muted-foreground mb-10">
          {isEs ? "Última actualización: agosto de 2026" : "Last updated: August 2026"}
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">
              {isEs ? "1. Qué son las cookies" : "1. What cookies are"}
            </h2>
            <p>
              {isEs
                ? "Las cookies y tecnologías similares (localStorage, sessionStorage) son pequeños archivos que se guardan en su dispositivo cuando visita nuestro sitio. Las utilizamos para mantener su sesión iniciada, recordar sus preferencias y, con su permiso, medir el uso del sitio."
                : "Cookies and similar technologies (localStorage, sessionStorage) are small files stored on your device when you visit our site. We use them to keep you signed in, remember your preferences and, with your permission, measure how the site is used."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-3">
              {isEs ? "2. Categorías que utilizamos" : "2. Categories we use"}
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">{isEs ? "Categoría" : "Category"}</th>
                    <th className="px-4 py-3 font-medium">{isEs ? "Finalidad" : "Purpose"}</th>
                    <th className="px-4 py-3 font-medium">{isEs ? "Duración" : "Retention"}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.name} className="border-t border-border align-top">
                      <td className="px-4 py-3 text-foreground">{r.name}</td>
                      <td className="px-4 py-3">{r.purpose}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{r.retention}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">
              {isEs ? "3. Su consentimiento" : "3. Your consent"}
            </h2>
            <p>
              {isEs
                ? "Las cookies analíticas y funcionales solo se activan si usted las acepta (RGPD del Reino Unido, PECR y CCPA). Puede cambiar o retirar su consentimiento en cualquier momento; al rechazar una categoría, eliminamos los datos asociados de su navegador."
                : "Analytics and functional cookies are only activated if you accept them (UK GDPR, PECR and CCPA). You can change or withdraw your consent at any time; when you decline a category we clear the associated data from your browser."}
            </p>
            <Button onClick={openCookieSettings} variant="outline" size="sm" className="mt-4">
              {isEs ? "Configurar cookies" : "Manage cookie settings"}
            </Button>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">
              {isEs ? "4. Control desde el navegador" : "4. Browser controls"}
            </h2>
            <p>
              {isEs
                ? "También puede bloquear o eliminar cookies desde la configuración de su navegador. Tenga en cuenta que bloquear las cookies estrictamente necesarias impedirá el acceso al portal seguro."
                : "You can also block or delete cookies from your browser settings. Note that blocking strictly necessary cookies will prevent access to the secure portal."}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">
              {isEs ? "5. Contacto" : "5. Contact"}
            </h2>
            <p>
              {isEs
                ? "Para consultas sobre esta política, utilice el formulario de contacto del sitio. TaxNuvia es un nombre comercial de iTechLounge LLC."
                : "For questions about this policy, please use the contact form on our site. TaxNuvia is a trading name of iTechLounge LLC."}
            </p>
            <p className="mt-4 flex gap-4">
              <Link to="/privacy" className="text-accent hover:underline">
                {isEs ? "Política de Privacidad" : "Privacy Policy"}
              </Link>
              <Link to="/terms" className="text-accent hover:underline">
                {isEs ? "Términos de Servicio" : "Terms of Service"}
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CookiePolicy;
