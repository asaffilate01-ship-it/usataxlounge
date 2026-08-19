import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Cookie, X, Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  CookiePreferences,
  defaultPreferences,
  getConsent,
  saveConsent,
  COOKIE_SETTINGS_EVENT,
} from "@/lib/cookieConsent";

const CookieConsent = () => {
  const { lang } = useLanguage();
  const isEs = lang === "es";
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const consent = getConsent();
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Allow footers / policy pages to reopen the preference centre
  useEffect(() => {
    const reopen = () => {
      setPreferences(getConsent() ?? defaultPreferences);
      setShowSettings(true);
      setVisible(true);
    };
    window.addEventListener(COOKIE_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, reopen);
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    saveConsent(prefs);
    setVisible(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    savePreferences({ essential: true, analytics: true, functional: true });
  };

  const acceptSelected = () => {
    savePreferences(preferences);
  };

  const declineAll = () => {
    savePreferences(defaultPreferences);
  };

  if (!visible) return null;


  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 animate-fade-in">
      <div className="container mx-auto max-w-4xl">
        <div className="bg-card border border-border rounded-2xl shadow-elegant p-5 md:p-6 space-y-4">
          {/* Header row */}
          <div className="flex items-start gap-3">
            <Cookie className="h-6 w-6 text-accent shrink-0 mt-0.5 hidden sm:block" />
            <div className="flex-1 text-sm text-muted-foreground leading-relaxed">
              {isEs ? (
                <>
                  Utilizamos cookies para el funcionamiento del sitio. Las cookies analíticas y funcionales solo se activan con su consentimiento explícito (conforme al RGPD del Reino Unido y la CCPA). Lea nuestra{" "}
                  <Link to="/privacy" className="text-accent underline hover:text-accent/80">Política de Privacidad</Link>.
                </>
              ) : (
                <>
                  We use cookies for site operation. Analytics and functional cookies are only activated with your explicit consent (in compliance with UK GDPR and CCPA). Read our{" "}
                  <Link to="/privacy" className="text-accent underline hover:text-accent/80">Privacy Policy</Link>.
                </>
              )}
            </div>
            <button onClick={declineAll} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
              {/* Essential */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isEs ? "Estrictamente necesarias" : "Strictly Necessary"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isEs ? "Requeridas para autenticación y seguridad. No se pueden desactivar." : "Required for authentication and security. Cannot be disabled."}
                  </p>
                </div>
                <Switch checked={true} disabled className="opacity-60" />
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isEs ? "Analíticas" : "Analytics"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isEs ? "Nos ayudan a entender cómo se usa el sitio." : "Help us understand how the site is used."}
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(val) => setPreferences((p) => ({ ...p, analytics: val }))}
                />
              </div>

              {/* Functional */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isEs ? "Funcionales" : "Functional"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isEs ? "Recuerdan sus preferencias (idioma, tema)." : "Remember your preferences (language, theme)."}
                  </p>
                </div>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={(val) => setPreferences((p) => ({ ...p, functional: val }))}
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5"
            >
              <Settings className="h-3.5 w-3.5" />
              {isEs ? "Configurar cookies" : "Cookie Settings"}
            </Button>
            <Button onClick={declineAll} variant="outline" size="sm" className="text-xs">
              {isEs ? "Rechazar todo" : "Reject All"}
            </Button>
            {showSettings ? (
              <Button onClick={acceptSelected} size="sm" className="bg-accent text-accent-foreground hover:bg-brand-green-dark text-xs">
                {isEs ? "Guardar preferencias" : "Save Preferences"}
              </Button>
            ) : (
              <Button onClick={acceptAll} size="sm" className="bg-accent text-accent-foreground hover:bg-brand-green-dark text-xs">
                {isEs ? "Aceptar todo" : "Accept All"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
