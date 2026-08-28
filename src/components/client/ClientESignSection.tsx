import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, ExternalLink, FileText, Loader2, PenLine, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { openSigned } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

interface ClientESignSectionProps {
  userId?: string;
}

type Signature = Tables<"signatures">;
type Filing = Tables<"filings">;

const ClientESignSection = ({ userId }: ClientESignSectionProps) => {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [typedName, setTypedName] = useState("");
  const [consented, setConsented] = useState(false);
  const [packageOpened, setPackageOpened] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const filingsById = useMemo(() => new Map(filings.map((filing) => [filing.id, filing])), [filings]);

  const fetchSignatures = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [signatureResult, filingResult] = await Promise.all([
      supabase.from("signatures").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("filings").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    if (signatureResult.error || filingResult.error) {
      toast({ title: "Unable to load filing authorizations", description: (signatureResult.error || filingResult.error)?.message, variant: "destructive" });
    }
    setSignatures(signatureResult.data ?? []);
    setFilings(filingResult.data ?? []);
    setLoading(false);
  }, [toast, userId]);

  useEffect(() => {
    fetchSignatures();
  }, [fetchSignatures]);

  const reviewPackage = async (filing: Filing | undefined) => {
    if (!filing?.file_url) {
      toast({ title: "Final package unavailable", description: "Ask your tax professional to attach the final return and authorization package.", variant: "destructive" });
      return;
    }
    const opened = await openSigned("documents", filing.file_url);
    if (!opened) {
      toast({ title: "Unable to open final package", variant: "destructive" });
      return;
    }
    setPackageOpened(true);
  };

  const handleSign = async (signature: Signature) => {
    if (!typedName.trim() || !consented || !packageOpened) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("sign-filing-authorization", {
      body: { signatureId: signature.id, typedName: typedName.trim(), consented: true },
    });

    if (error || data?.error) {
      toast({ title: "Authorization was not recorded", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({
        title: "Authorization recorded",
        description: "Your accountant must complete final release checks before anything is transmitted.",
      });
      setSigningId(null);
      setTypedName("");
      setConsented(false);
      setPackageOpened(false);
      await fetchSignatures();
    }
    setSubmitting(false);
  };

  const pending = signatures.filter((signature) => !signature.signed_at);
  const completed = signatures.filter((signature) => signature.signed_at);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Review, sign and approve</h2>
        <p className="mt-1 text-sm text-muted-foreground">Review the exact final package before providing filing authorization.</p>
      </div>

      {signatures.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground"><PenLine className="mx-auto mb-4 h-12 w-12 opacity-30" /><p className="font-display text-lg">No signature requests</p><p className="mt-1 text-sm">A secure request will appear when your final return package is ready.</p></div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Awaiting your review</h3>
              {pending.map((signature) => {
                const filing = filingsById.get(signature.filing_id);
                return (
                  <div key={signature.id} className="rounded-2xl border border-warning/30 bg-card p-6 shadow-elegant">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10"><PenLine className="h-6 w-6 text-warning" /></div>
                      <div className="min-w-0 flex-1">
                        <Badge className="bg-warning/10 text-warning"><Clock className="mr-1 h-3 w-3" /> Pending review and signature</Badge>
                        <p className="mt-3 font-medium text-foreground">{filing?.form_type || "Tax return"} — tax year {filing?.tax_year || "—"}</p>
                        <p className="mt-1 text-sm text-muted-foreground">Requested {new Date(signature.created_at).toLocaleDateString()}</p>

                        {signingId === signature.id ? (
                          <div className="mt-5 space-y-4">
                            <div className="rounded-xl border border-border bg-muted/20 p-4">
                              <div className="mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-accent" /><p className="text-sm font-semibold text-foreground">Step 1 — Review the final package</p></div>
                              <Button variant="outline" onClick={() => reviewPackage(filing)}><ExternalLink className="mr-2 h-4 w-4" /> Open final return and authorization PDF</Button>
                              {packageOpened && <p className="mt-2 flex items-center gap-1.5 text-xs text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Package opened for review</p>}
                            </div>

                            <div className="rounded-xl border border-border bg-muted/20 p-4">
                              <div className="mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /><p className="text-sm font-semibold text-foreground">Step 2 — Filing authorization</p></div>
                              <p className="text-sm leading-relaxed text-foreground">{signature.consent_text}</p>
                            </div>

                            <label className="flex cursor-pointer items-start gap-3">
                              <Checkbox checked={consented} onCheckedChange={(value) => setConsented(Boolean(value))} />
                              <span className="text-sm leading-snug text-foreground">I reviewed the final PDF, confirm the information is true, correct and complete to the best of my knowledge, and provide the authorization stated above.</span>
                            </label>

                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-foreground">Type your full legal name</label>
                              <Input value={typedName} onChange={(event) => setTypedName(event.target.value)} placeholder="Full legal name" className="font-serif text-lg italic" />
                            </div>

                            <div className="flex flex-wrap gap-3">
                              <Button onClick={() => handleSign(signature)} disabled={!typedName.trim() || !consented || !packageOpened || submitting} className="bg-accent text-accent-foreground hover:bg-brand-green-dark">
                                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PenLine className="mr-2 h-4 w-4" />} Sign authorization
                              </Button>
                              <Button variant="outline" onClick={() => { setSigningId(null); setTypedName(""); setConsented(false); setPackageOpened(false); }}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <Button className="mt-4 bg-accent text-accent-foreground hover:bg-brand-green-dark" onClick={() => { setSigningId(signature.id); setPackageOpened(false); setConsented(false); setTypedName(""); }}><PenLine className="mr-2 h-4 w-4" /> Review final package</Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Completed</h3>
              {completed.map((signature) => {
                const filing = filingsById.get(signature.filing_id);
                return (
                  <div key={signature.id} className="flex flex-col gap-3 rounded-2xl border border-success/20 bg-card p-5 shadow-elegant sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div><div><p className="font-medium text-foreground">{filing?.form_type || "Filing authorization"} — {filing?.tax_year}</p><p className="text-sm text-muted-foreground">Signed as <span className="font-serif italic">{signature.typed_name}</span> on {new Date(signature.signed_at!).toLocaleString()}</p></div></div>
                    <Badge className="bg-success/10 text-success"><CheckCircle2 className="mr-1 h-3 w-3" /> Signed — awaiting final release</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClientESignSection;
