import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/Logo";
import { useLanguage } from "@/contexts/LanguageContext";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("tab") === "signup");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (user && userRole) {
      navigate(userRole === "admin" ? "/admin" : "/client", { replace: true });
    }
  }, [user, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: t("auth.accountCreated"), description: t("auth.verifyEmail") });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message === "Email not confirmed") {
            toast({ title: t("auth.emailNotVerified"), description: t("auth.emailNotVerifiedDesc"), variant: "destructive" });
          } else {
            throw error;
          }
        } else {
          toast({ title: t("auth.welcomeBackToast"), description: t("auth.redirecting") });
        }
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <div className="max-w-md">
          <div className="mb-10">
            <Logo size="lg" />
          </div>
          <h2 className="font-display text-4xl font-bold text-white mb-4">
            {t("hero.title1")}{" "}
            <span className="text-gradient-accent">{t("hero.title2")}</span>
          </h2>
          <p className="text-white/60 text-lg">
            {t("auth.portalDesc")}
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        <Button variant="ghost" size="sm" asChild className="absolute top-4 left-4 text-muted-foreground">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" /> {t("auth.back")}</Link>
        </Button>
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            {isSignUp ? t("auth.createAccount") : t("auth.welcomeBack")}
          </h1>
          <p className="text-muted-foreground mb-8">
            {isSignUp ? t("auth.signUpSubtitle") : t("auth.signInSubtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <Label htmlFor="name">{t("auth.fullName")}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="mt-1.5"
                  required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">{t("auth.password")}</Label>
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

            {!isSignUp && (
              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    toast({ title: t("auth.enterEmail"), description: t("auth.enterEmailDesc"), variant: "destructive" });
                    return;
                  }
                  try {
                    const { error } = await supabase.auth.resetPasswordForEmail(email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    if (error) throw error;
                    toast({ title: t("auth.checkEmail"), description: t("auth.resetLinkSent") });
                  } catch (error: any) {
                    toast({ title: "Error", description: error.message, variant: "destructive" });
                  }
                }}
                className="text-sm text-accent hover:text-brand-green-dark transition-colors text-right w-full"
              >
                {t("auth.forgotPassword")}
              </button>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent text-accent-foreground hover:bg-brand-green-dark shadow-accent"
            >
              {isLoading ? t("auth.pleaseWait") : isSignUp ? t("auth.createAccount") : t("auth.signIn")}
            </Button>
          </form>

          <div className="mt-4 flex items-center gap-2 justify-center">
            <span className="text-sm text-muted-foreground">
              {isSignUp ? t("auth.alreadyHaveAccount") : t("auth.noAccount")}
            </span>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-medium text-accent hover:text-brand-green-dark transition-colors"
            >
              {isSignUp ? t("auth.signIn") : t("auth.signUp")}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Auth;
