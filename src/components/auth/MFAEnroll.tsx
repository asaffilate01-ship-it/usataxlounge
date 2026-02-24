import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import Logo from "@/components/Logo";
import { ShieldCheck, Copy, Check } from "lucide-react";

interface MFAEnrollProps {
  onEnrolled: () => void;
  onCancelled: () => void;
}

const MFAEnroll = ({ onEnrolled, onCancelled }: MFAEnrollProps) => {
  const [factorId, setFactorId] = useState("");
  const [qr, setQR] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    (async () => {
      // Remove ALL existing factors (verified or not) to avoid name conflicts
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp) {
        for (const f of factors.totp) {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "TXLGEUSA",
      });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }
      setFactorId(data.id);
      setQR(data.totp.qr_code);
      setSecret(data.totp.secret);
    })();
  }, []);

  const handleCopySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: verifyCode,
      });
      if (verify.error) throw verify.error;

      toast({ title: t("mfa.enabledTitle"), description: t("mfa.enabledDesc") });
      onEnrolled();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Logo size="md" />
        </div>

        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-7 w-7 text-accent" />
          <h1 className="font-display text-2xl font-bold text-foreground">
            {t("mfa.enrollTitle")}
          </h1>
        </div>
        <p className="text-muted-foreground mb-6">{t("mfa.enrollDesc")}</p>

        <div className="space-y-6">
          {/* Step 1: QR Code */}
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-sm font-medium text-foreground mb-4">{t("mfa.scanQR")}</p>
            {qr ? (
              <div
                className="mx-auto w-48 h-48 bg-white rounded-lg p-2 flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: qr }}
              />
            ) : (
              <div className="mx-auto w-48 h-48 bg-muted rounded-lg animate-pulse" />
            )}
          </div>

          {/* Manual entry */}
          {secret && (
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-2">{t("mfa.manualEntry")}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-background px-3 py-2 rounded border border-border break-all">
                  {secret}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopySecret}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Verify */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label htmlFor="verifyCode">{t("mfa.enterCode")}</Label>
              <Input
                id="verifyCode"
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

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onCancelled} className="flex-1">
                {t("mfa.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isLoading || verifyCode.length !== 6}
                className="flex-1 bg-accent text-accent-foreground hover:bg-brand-green-dark"
              >
                {isLoading ? t("mfa.verifying") : t("mfa.enable")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MFAEnroll;
