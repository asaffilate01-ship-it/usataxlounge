import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { checkAccessCode, grantPreviewAccess } from "@/lib/previewAccess";

interface AccessGateProps {
  redirectTo?: string;
  compact?: boolean;
}

const AccessGate = ({ redirectTo = "/home", compact = false }: AccessGateProps) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkAccessCode(code)) {
      grantPreviewAccess();
      navigate(redirectTo);
    } else {
      setError(true);
    }
  };

  return (
    <div
      className={`w-full max-w-md rounded-2xl border border-border bg-card/95 backdrop-blur p-6 md:p-8 shadow-xl ${
        compact ? "" : "mx-auto"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Lock className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-bold text-foreground">{t("promo.gate.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("promo.footer.legal")}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-5">{t("promo.gate.desc")}</p>
      <form onSubmit={submit} className="space-y-3">
        <label htmlFor="access-code" className="sr-only">
          {t("promo.gate.placeholder")}
        </label>
        <Input
          id="access-code"
          type="password"
          autoComplete="off"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(false);
          }}
          placeholder={t("promo.gate.placeholder")}
          aria-invalid={error}
          className="h-12"
        />
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {t("promo.gate.error")}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full gap-2">
          {t("promo.gate.submit")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </form>
    </div>
  );
};

export default AccessGate;
