import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, FileText, Loader2, PenLine, Search, ShieldAlert, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFilings } from "@/hooks/useFilings";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { filingTaxYear, taxcenda } from "@/integrations/supabase/taxcenda";
import { safeStorageFilename, sha256File, validateIntakeFile } from "@/lib/documentIntake";
import { getErrorMessage } from "@/lib/errors";
import { useToast } from "@/hooks/use-toast";

type Client = Tables<"clients">;
type Signature = Tables<"signatures">;

interface ESignatureSectionProps {
  clients: Client[];
}

const CONSENT_TEXT = "I confirm that I reviewed the final return package made available to me and authorize the Electronic Return Originator identified in the included IRS signature authorization to transmit the return described in that package. I understand that filing will occur only after final professional release.";

const ESignatureSection = ({ clients }: ESignatureSectionProps) => {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedFilingId, setSelectedFilingId] = useState("new");
  const [formType, setFormType] = useState("Form 1040");
  const [taxYear, setTaxYear] = useState(String(filingTaxYear()));
  const [finalPackage, setFinalPackage] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const { filings, refetch: refetchFilings } = useFilings();
  const { toast } = useToast();

  const selectedClient = clients.find((client) => client.id === selectedClientId) ?? null;
  const clientFilings = useMemo(
    () => filings.filter((filing) => filing.user_id === selectedClient?.user_id && !["submitted", "accepted"].includes(filing.status ?? "")),
    [filings, selectedClient?.user_id],
  );

  const fetchSignatures = async () => {
    const { data, error } = await supabase.from("signatures").select("*").order("created_at", { ascending: false });
    if (error) toast({ title: "Unable to load signature requests", description: error.message, variant: "destructive" });
    else setSignatures(data ?? []);
  };

  useEffect(() => {
    fetchSignatures();
  }, []);

  const resetRequest = () => {
    setSelectedClientId("");
    setSelectedFilingId("new");
    setFormType("Form 1040");
    setTaxYear(String(filingTaxYear()));
    setFinalPackage(null);
  };

  const handleSendForSignature = async () => {
    if (!selectedClient?.user_id) return;
    setSaving(true);
    let uploadedPath: string | null = null;
    let packageHash: string | null = null;

    try {
      let filing = selectedFilingId === "new" ? null : clientFilings.find((item) => item.id === selectedFilingId) ?? null;
      if (!filing?.file_url && !finalPackage) throw new Error("Upload the final return package, including the applicable IRS signature authorization.");

      const filingYear = filing?.tax_year ?? Number(taxYear);
      const { data: engagements, error: engagementError } = await taxcenda
        .from("tax_engagements")
        .select("*")
        .eq("user_id", selectedClient.user_id)
        .eq("tax_year", filingYear)
        .limit(1);
      if (engagementError) throw engagementError;
      const engagementId = engagements?.[0]?.id ?? null;
      if (!engagementId) throw new Error("Create the client's tax-year workspace before requesting filing authorization.");

      if (finalPackage) {
        validateIntakeFile(finalPackage);
        if (finalPackage.type !== "application/pdf") throw new Error("The final review and signature package must be a PDF.");
        packageHash = await sha256File(finalPackage);
        uploadedPath = `${selectedClient.user_id}/${taxYear}/filings/${crypto.randomUUID()}-${safeStorageFilename(finalPackage.name)}`;
        const { error: uploadError } = await supabase.storage.from("documents").upload(uploadedPath, finalPackage, { contentType: "application/pdf", upsert: false });
        if (uploadError) throw uploadError;
      }

      if (!filing) {
        const { data, error } = await supabase.from("filings").insert({
          user_id: selectedClient.user_id,
          engagement_id: engagementId,
          tax_year: Number(taxYear),
          form_type: formType.trim(),
          status: "pending_signature",
          file_url: uploadedPath,
        }).select("*").single();
        if (error) throw error;
        filing = data;
      } else {
        const { data, error } = await supabase.from("filings").update({
          status: "pending_signature",
          engagement_id: filing.engagement_id || engagementId,
          file_url: uploadedPath || filing.file_url,
        }).eq("id", filing.id).select("*").single();
        if (error) throw error;
        filing = data;
      }

      if (packageHash) {
        const { error: hashError } = await taxcenda.from("tax_engagements").update({ final_package_hash: packageHash }).eq("id", engagementId);
        if (hashError) throw hashError;
      }

      const { data: pendingRequests } = await supabase.from("signatures").select("id").eq("filing_id", filing.id).is("signed_at", null).limit(1);
      const signaturePayload = { consent_text: CONSENT_TEXT, email: selectedClient.email };
      const { error: signatureError } = pendingRequests?.[0]
        ? await supabase.from("signatures").update(signaturePayload).eq("id", pendingRequests[0].id)
        : await supabase.from("signatures").insert({ user_id: selectedClient.user_id, filing_id: filing.id, ...signaturePayload });
      if (signatureError) throw signatureError;

      if (selectedClient.email) {
        const { error: notificationError } = await supabase.functions.invoke("send-notification", {
          body: { type: "signature_request", to: selectedClient.email, clientName: selectedClient.full_name || "Client" },
        });
        if (notificationError) {
          toast({ title: "Request created; email needs attention", description: notificationError.message, variant: "destructive" });
        }
      }

      toast({ title: "Signature review requested", description: "The request is linked to the exact final PDF package. Transmission remains locked." });
      setSendOpen(false);
      resetRequest();
      await Promise.all([fetchSignatures(), refetchFilings()]);
    } catch (error) {
      if (uploadedPath) await supabase.storage.from("documents").remove([uploadedPath]);
      toast({ title: "Signature request was not created", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filteredSignatures = signatures.filter((signature) =>
    (signature.typed_name || signature.email || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Filing authorizations</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every signature request is tied to an immutable final return package for human review.</p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-brand-green-dark" onClick={() => setSendOpen(true)}>
          <PenLine className="mr-2 h-4 w-4" /> Request review and signature
        </Button>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/5 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <p className="text-sm text-foreground">A typed signature is recorded as portal evidence. The accountant must verify that the included authorization and identity-validation process meet the rules for the particular return before release.</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search authorizations…" className="pl-10" />
      </div>

      {filteredSignatures.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground"><PenLine className="mx-auto mb-4 h-12 w-12 opacity-30" /><p className="font-display text-lg">No authorization requests yet</p></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-elegant">
          <table className="w-full min-w-[620px]">
            <thead><tr className="border-b border-border bg-muted/50"><th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Client</th><th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Filing</th><th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th><th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Signed</th></tr></thead>
            <tbody>{filteredSignatures.map((signature) => (
              <tr key={signature.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3"><p className="text-sm font-medium text-foreground">{signature.typed_name || signature.email || "Pending"}</p><p className="text-xs text-muted-foreground">{signature.email}</p></td>
                <td className="px-5 py-3 text-sm text-muted-foreground"><span className="flex items-center gap-2"><FileText className="h-4 w-4" /> {filings.find((filing) => filing.id === signature.filing_id)?.form_type || "Return package"}</span></td>
                <td className="px-5 py-3">{signature.signed_at ? <Badge className="bg-success/10 text-success"><CheckCircle2 className="mr-1 h-3 w-3" /> Signed</Badge> : <Badge className="bg-warning/10 text-warning"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>}</td>
                <td className="px-5 py-3 text-sm text-muted-foreground">{signature.signed_at ? new Date(signature.signed_at).toLocaleString() : "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <Dialog open={sendOpen} onOpenChange={(value) => { setSendOpen(value); if (!value) resetRequest(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Request review and signature</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Client</Label>
              <Select value={selectedClientId} onValueChange={(value) => { setSelectedClientId(value); setSelectedFilingId("new"); }}>
                <SelectTrigger className="mt-1.5"><SelectValue placeholder="Choose a client" /></SelectTrigger>
                <SelectContent>{clients.filter((client) => client.user_id).map((client) => <SelectItem key={client.id} value={client.id}>{client.full_name || client.email || "Unnamed client"}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {selectedClient && (
              <>
                <div>
                  <Label>Filing</Label>
                  <Select value={selectedFilingId} onValueChange={setSelectedFilingId}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Create a new filing package</SelectItem>
                      {clientFilings.map((filing) => <SelectItem key={filing.id} value={filing.id}>{filing.form_type} — {filing.tax_year} ({filing.status})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {selectedFilingId === "new" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label htmlFor="signature-form">Form</Label><Input id="signature-form" className="mt-1.5" value={formType} onChange={(event) => setFormType(event.target.value)} /></div>
                    <div><Label htmlFor="signature-year">Tax year</Label><Input id="signature-year" className="mt-1.5" type="number" min="2000" max="2100" value={taxYear} onChange={(event) => setTaxYear(event.target.value)} /></div>
                  </div>
                )}

                <div>
                  <Label htmlFor="final-package">Final return and authorization package (PDF)</Label>
                  <Input id="final-package" className="mt-1.5" type="file" accept="application/pdf" onChange={(event) => setFinalPackage(event.target.files?.[0] ?? null)} />
                  <p className="mt-1.5 text-xs text-muted-foreground">Required for a new filing or whenever the final package changed. The client must review this exact file before signing.</p>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                  <p><strong>Client:</strong> {selectedClient.full_name || selectedClient.email}</p>
                  <p><strong>Package:</strong> {finalPackage?.name || (selectedFilingId !== "new" && clientFilings.find((item) => item.id === selectedFilingId)?.file_url ? "Existing final PDF" : "Not attached")}</p>
                  <p className="mt-2 text-xs text-muted-foreground">Signing records approval evidence. It does not transmit the return automatically.</p>
                </div>
              </>
            )}

            <Button onClick={handleSendForSignature} disabled={!selectedClient || saving || (selectedFilingId === "new" && !finalPackage)} className="w-full bg-accent text-accent-foreground hover:bg-brand-green-dark">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />} Send secure request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ESignatureSection;
