import { useState, useEffect } from "react";
import { PenLine, CheckCircle2, Clock, FileText, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientESignSectionProps {
  userId?: string;
}

const ClientESignSection = ({ userId }: ClientESignSectionProps) => {
  const [signatures, setSignatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [typedName, setTypedName] = useState("");
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) fetchSignatures();
  }, [userId]);

  const fetchSignatures = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("signatures")
      .select("*")
      .eq("user_id", userId!)
      .order("created_at", { ascending: false });
    if (data) setSignatures(data);
    setLoading(false);
  };

  const handleSign = async (sig: any) => {
    if (!typedName.trim() || !consented) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("signatures")
      .update({
        typed_name: typedName.trim(),
        signed_at: new Date().toISOString(),
        ip_address: "client-side",
      })
      .eq("id", sig.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Signed Successfully!",
        description: "Your e-filing authorization has been recorded. Your return will be submitted to the IRS.",
      });

      // Send confirmation email to client
      if (sig.email) {
        supabase.functions.invoke("send-notification", {
          body: { type: "signature_completed", to: sig.email, clientName: typedName.trim() },
        }).catch(err => console.error("Email error:", err));
      }

      // Notify admin
      const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin").limit(1);
      if (adminRoles?.[0]) {
        const { data: adminProfile } = await supabase.from("profiles").select("*").eq("user_id", adminRoles[0].user_id).single();
        // We'd need admin email - for now notify via the system
        supabase.from("notifications").insert({
          user_id: adminRoles[0].user_id,
          title: "New Signature",
          message: `${typedName.trim()} has signed their e-filing authorization.`,
          type: "signature",
        }).then(() => {});
      }

      setSigningId(null);
      setTypedName("");
      setConsented(false);
      fetchSignatures();
    }
    setSubmitting(false);
  };

  const pending = signatures.filter((s) => !s.signed_at);
  const completed = signatures.filter((s) => s.signed_at);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="font-display text-xl font-bold text-foreground">E-Sign & Approve</h2>

      {signatures.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <PenLine className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-display text-lg">No signature requests</p>
          <p className="text-sm mt-1">When your tax return is ready, a signature request will appear here.</p>
        </div>
      ) : (
        <>
          {/* Pending signatures */}
          {pending.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Awaiting Your Signature</h3>
              {pending.map((sig) => (
                <div key={sig.id} className="p-6 rounded-2xl border border-warning/30 bg-card shadow-elegant">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                      <PenLine className="h-6 w-6 text-warning" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-warning/10 text-warning border-warning/20">
                          <Clock className="h-3 w-3 mr-1" /> Pending Signature
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Requested on {new Date(sig.created_at).toLocaleDateString()}
                      </p>

                      {signingId === sig.id ? (
                        <div className="mt-4 space-y-4">
                          {/* IRS Consent Text */}
                          <div className="rounded-xl border border-border bg-muted/30 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <ShieldCheck className="h-4 w-4 text-accent" />
                              <p className="text-xs font-semibold text-muted-foreground">IRS E-FILE AUTHORIZATION (Form 8879 Equivalent)</p>
                            </div>
                            <p className="text-sm text-foreground leading-relaxed">
                              {sig.consent_text || "I authorize TaxLounge to e-file my tax return with the IRS. I confirm that I have reviewed the return and that all information is accurate and complete."}
                            </p>
                          </div>

                          {/* Consent checkbox */}
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`consent-${sig.id}`}
                              checked={consented}
                              onCheckedChange={(v) => setConsented(!!v)}
                            />
                            <label htmlFor={`consent-${sig.id}`} className="text-sm text-foreground leading-snug cursor-pointer">
                              I have reviewed my tax return and authorize TaxLounge to electronically file it with the IRS on my behalf. I understand this constitutes my electronic signature under IRS guidelines.
                            </label>
                          </div>

                          {/* Typed name */}
                          <div>
                            <label className="text-sm font-medium text-foreground block mb-1.5">
                              Type your full legal name to sign
                            </label>
                            <Input
                              value={typedName}
                              onChange={(e) => setTypedName(e.target.value)}
                              placeholder="e.g. John A. Smith"
                              className="font-serif text-lg italic"
                            />
                            {typedName && (
                              <div className="mt-3 p-3 rounded-lg border border-accent/20 bg-accent/5 text-center">
                                <p className="text-xs text-muted-foreground mb-1">Signature Preview</p>
                                <p className="font-serif text-2xl italic text-foreground">{typedName}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-3">
                            <Button
                              onClick={() => handleSign(sig)}
                              disabled={!typedName.trim() || !consented || submitting}
                              className="bg-accent text-accent-foreground hover:bg-brand-green-dark shadow-accent"
                            >
                              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PenLine className="h-4 w-4 mr-2" />}
                              Sign & Authorize E-Filing
                            </Button>
                            <Button variant="outline" onClick={() => { setSigningId(null); setTypedName(""); setConsented(false); }}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          className="mt-4 bg-accent text-accent-foreground hover:bg-brand-green-dark"
                          onClick={() => setSigningId(sig.id)}
                        >
                          <PenLine className="h-4 w-4 mr-2" /> Review & Sign
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed signatures */}
          {completed.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completed</h3>
              {completed.map((sig) => (
                <div key={sig.id} className="p-5 rounded-2xl border border-success/20 bg-card shadow-elegant">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">E-Filing Authorization</p>
                        <p className="text-sm text-muted-foreground">
                          Signed as <span className="font-serif italic">{sig.typed_name}</span> on {new Date(sig.signed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-success/10 text-success border-success/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Signed
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClientESignSection;
