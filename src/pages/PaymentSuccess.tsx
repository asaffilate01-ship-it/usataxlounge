import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/Logo";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "true";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <Logo size="md" />

        {cancelled ? (
          <>
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
              <XCircle className="h-8 w-8 text-warning" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Payment Cancelled</h1>
            <p className="text-muted-foreground">
              No worries — your payment was not processed. You can try again whenever you're ready.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Payment Successful!</h1>
            <p className="text-muted-foreground">
              Thank you for your payment. Your tax return engagement has been confirmed. We'll be in touch shortly to begin the process.
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
