import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Cookie, X } from "lucide-react";

const CookieConsent = () => {
  const { lang } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("taxlounge-cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("taxlounge-cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("taxlounge-cookie-consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-fade-in">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card border border-border rounded-2xl shadow-elegant p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Cookie className="h-6 w-6 text-accent shrink-0 hidden sm:block" />
          <div className="flex-1 text-sm text-muted-foreground leading-relaxed">
            {lang === "es" ? (
              <>
                Utilizamos cookies esenciales para el funcionamiento del sitio y cookies analíticas para mejorar su experiencia. Al continuar navegando, acepta nuestro uso de cookies. Lea nuestra{" "}
                <Link to="/privacy" className="text-accent underline hover:text-accent/80">Política de Privacidad</Link>.
              </>
            ) : (
              <>
                We use essential cookies for site functionality and analytics cookies to improve your experience. By continuing to browse, you accept our use of cookies. Read our{" "}
                <Link to="/privacy" className="text-accent underline hover:text-accent/80">Privacy Policy</Link>.
              </>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button onClick={decline} variant="outline" size="sm" className="flex-1 sm:flex-none text-xs">
              {lang === "es" ? "Rechazar" : "Decline"}
            </Button>
            <Button onClick={accept} size="sm" className="flex-1 sm:flex-none bg-accent text-accent-foreground hover:bg-brand-green-dark text-xs">
              {lang === "es" ? "Aceptar" : "Accept"}
            </Button>
          </div>
          <button onClick={decline} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground sm:hidden">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
