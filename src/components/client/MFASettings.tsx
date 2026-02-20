import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { ShieldCheck, ShieldOff, Loader2, RefreshCw } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import MFAEnroll from "@/components/auth/MFAEnroll";

const MFASettings = () => {
  const { mfaStatus, refreshMFAStatus } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isResetting, setIsResetting] = useState(false);
  const [showEnroll, setShowEnroll] = useState(false);

  const handleUnenroll = async () => {
    setIsResetting(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];
      if (totpFactor) {
        const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
        if (error) throw error;
      }
      toast({ title: t("mfa.resetSuccessTitle"), description: t("mfa.resetSuccessDesc") });
      await refreshMFAStatus();
      setShowEnroll(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

  if (showEnroll) {
    return (
      <div className="max-w-md mx-auto">
        <MFAEnroll
          onEnrolled={() => {
            setShowEnroll(false);
            refreshMFAStatus();
          }}
          onCancelled={() => setShowEnroll(false)}
        />
      </div>
    );
  }

  const isActive = mfaStatus === "verified" || mfaStatus === "enrolled";

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="font-display text-xl font-bold text-foreground">{t("settings.title")}</h2>

      <div className="rounded-2xl border border-border bg-card shadow-elegant p-6 max-w-lg">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isActive ? "bg-success/10" : "bg-destructive/10"}`}>
            {isActive ? (
              <ShieldCheck className="h-6 w-6 text-success" />
            ) : (
              <ShieldOff className="h-6 w-6 text-destructive" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-display text-lg font-semibold text-foreground">{t("settings.mfaTitle")}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isActive ? t("settings.mfaActive") : t("settings.mfaInactive")}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          {isActive ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2" disabled={isResetting}>
                  {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {t("settings.resetMFA")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("settings.resetConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("settings.resetConfirmDesc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("mfa.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleUnenroll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t("settings.resetMFA")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button onClick={() => setShowEnroll(true)} className="bg-accent text-accent-foreground hover:bg-brand-green-dark gap-2">
              <ShieldCheck className="h-4 w-4" />
              {t("settings.enableMFA")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MFASettings;
