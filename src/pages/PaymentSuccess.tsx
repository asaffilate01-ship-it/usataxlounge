import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

type State = "loading" | "paid" | "pending" | "failed" | "cancelled";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "true";
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<State>(cancelled ? "cancelled" : sessionId ? "loading" : "failed");
  const [details, setDetails] = useState<{ plan?: string | null; amount?: number | null; currency?: string | null }>({});

  useEffect(() => {
    if (cancelled || !sessionId) return;
    let active = true;
    (async () => {
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { sessionId },
      });
      if (!active) return;
      if (error || !data) {
        setState("failed");
        return;
      }
      setDetails({ plan: data.plan, amount: data.amount, currency: data.currency });
      setState(data.paid ? "paid" : data.status === "pending" ? "pending" : "failed");
    })();
    return () => {
      active = false;
    };
  }, [cancelled, sessionId]);

  const amountLabel =
    details.amount != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: (details.currency || "usd").toUpperCase(),
        }).format(details.amount / 100)
      : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <Logo size="md" />

        {state === "loading" && (
          <>
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-accent animate-spin" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Confirming your payment…</h1>
            <p className="text-muted-foreground">We're verifying the transaction with our payment provider.</p>
          </>
        )}

        {state === "cancelled" && (
          <>
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-warning" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Payment Cancelled</h1>
            <p className="text-muted-foreground">
              No worries — your payment was not processed. You can try again whenever you're ready.
            </p>
          </>
        )}

        {state === "paid" && (
          <>
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Payment Successful</h1>
            <p className="text-muted-foreground">
              Thank you{amountLabel ? ` — we've received ${amountLabel}` : ""}
              {details.plan ? ` for the ${details.plan} plan` : ""}. Your engagement is confirmed and your preparer will be
              in touch shortly.
            </p>
          </>
        )}

        {state === "pending" && (
          <>
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 text-warning animate-spin" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Payment Processing</h1>
            <p className="text-muted-foreground">
              Your payment hasn't cleared yet. We'll email you as soon as it settles — no action needed.
            </p>
          </>
        )}

        {state === "failed" && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">We couldn't confirm this payment</h1>
            <p className="text-muted-foreground">
              If you were charged, nothing is lost — contact us and we'll reconcile it straight away.
            </p>
          </>
        )}

        <div className="flex flex-col gap-3 pt-4">
          <Button asChild className="bg-accent text-accent-foreground hover:bg-brand-green-dark">
            <Link to="/client">
              Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
