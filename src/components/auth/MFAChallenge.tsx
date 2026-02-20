import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Logo from "@/components/Logo";
import { ShieldCheck, LogOut } from "lucide-react";

interface MFAChallengeProps {
  onVerified: () => void;
  onSignOut: () => void;
}

const MFAChallenge = ({ onVerified, onSignOut }: MFAChallengeProps) => {
  const [verifyCode, setVerifyCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];

      if (!totpFactor) {
        setError("No TOTP factor found.");
        setIsLoading(false);
        return;
      }

      const challenge = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.data.id,
        code: verifyCode,
      });
      if (verify.error) throw verify.error;

      onVerified();
    } catch (err: any) {
      setError(err.message || t("mfa.invalidCode"));
      setVerifyCode("");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Logo size="md" />
        </div>

        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-7 w-7 text-accent" />
          <h1 className="font-display text-2xl font-bold text-foreground">
            {t("mfa.challengeTitle")}
          </h1>
        </div>
        <p className="text-muted-foreground mb-8">{t("mfa.challengeDesc")}</p>

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <Label htmlFor="mfaCode">{t("mfa.enterCode")}</Label>
            <Input
              id="mfaCode"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="mt-1.5 text-center text-2xl tracking-[0.5em] font-mono"
              maxLength={6}
              required
              autoFocus
              autoComplete="one-time-code"
              inputMode="numeric"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading || verifyCode.length !== 6}
            className="w-full bg-accent text-accent-foreground hover:bg-brand-green-dark"
          >
            {isLoading ? t("mfa.verifying") : t("mfa.verify")}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onSignOut}
            className="w-full text-muted-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" /> {t("mfa.signOutInstead")}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default MFAChallenge;
