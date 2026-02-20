import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") {
      setIsRecovery(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: t("reset.mismatch"), variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: t("reset.tooShort"), variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: t("reset.success"), description: t("reset.successDesc") });
      setTimeout(() => navigate("/auth"), 2000);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="w-full max-w-md text-center">
          <Logo size="md" />
          <h1 className="font-display text-2xl font-bold text-foreground mt-8 mb-4">{t("reset.invalidTitle")}</h1>
          <p className="text-muted-foreground mb-6">{t("reset.invalidDesc")}</p>
          <Button asChild>
            <Link to="/auth">{t("reset.backToSignIn")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8 relative">
      <Button variant="ghost" size="sm" asChild className="absolute top-4 left-4 text-muted-foreground">
        <Link to="/auth"><ArrowLeft className="h-4 w-4 mr-2" /> {t("auth.back")}</Link>
      </Button>
      <div className="w-full max-w-md">
        <div className="mb-8">
          <Logo size="md" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">{t("reset.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("reset.subtitle")}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">{t("reset.newPassword")}</Label>
            <div className="relative mt-1.5">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirmPassword">{t("reset.confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="mt-1.5"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-accent text-accent-foreground hover:bg-brand-green-dark shadow-accent"
          >
            {isLoading ? t("reset.updating") : t("reset.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
