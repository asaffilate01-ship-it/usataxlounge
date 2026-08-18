import { useState, useEffect } from "react";
import { PenLine, CheckCircle2, Clock, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ESignatureSectionProps {
  clients: any[];
}

const ESignatureSection = ({ clients }: ESignatureSectionProps) => {
  const [signatures, setSignatures] = useState<any[]>([]);
  const [sendOpen, setSendOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSignatures();
  }, []);

  const fetchSignatures = async () => {
    const { data } = await supabase
      .from("signatures")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSignatures(data);
  };

  const handleSendForSignature = async () => {
    if (!selectedClient) return;
    const user = (await supabase.auth.getUser()).data.user;
    
    // Create a document for the signature
    const { data: doc, error: docError } = await supabase.from("documents").insert({
      user_id: selectedClient.user_id || user?.id || "",
      client_id: selectedClient.id,
      title: `Form 1040 — Tax Year ${selectedClient.tax_year || new Date().getFullYear()}`,
      type: "tax_return",
      category: "e-signature",
      status: "pending_signature",
      content: `Tax return preparation for ${selectedClient.full_name || "Client"}`,
    }).select().single();

    if (docError) {
      toast({ title: "Error", description: docError.message, variant: "destructive" });
      return;
    }

    // Create signature request
    const { error } = await supabase.from("signatures").insert({
      user_id: selectedClient.user_id || user?.id || "",
      filing_id: doc.id,
      document_id: doc.id,
      consent_text: "I authorize TaxNuvia to e-file my tax return with the IRS. I confirm that I have reviewed the return and that all information is accurate and complete.",
      email: selectedClient.email,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Signature Request Sent", description: `E-sign request sent for ${selectedClient.full_name}` });
      
      // Send email notification to client
      if (selectedClient.email) {
        supabase.functions.invoke("send-notification", {
          body: {
            type: "signature_request",
            to: selectedClient.email,
            clientName: selectedClient.full_name || "Client",
          },
        }).catch(err => console.error("Email notification error:", err));
      }

      setSendOpen(false);
      fetchSignatures();
    }
  };

  const filteredSignatures = signatures.filter(s =>
    (s.typed_name || s.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">E-Signatures</h2>
        <Button className="bg-accent text-accent-foreground hover:bg-brand-green-dark" onClick={() => setSendOpen(true)}>
          <PenLine className="h-4 w-4 mr-2" /> Request Signature
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search signatures..." className="pl-10" />
      </div>

      {filteredSignatures.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <PenLine className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-display text-lg">No signatures yet</p>
          <p className="text-sm mt-1">Send e-sign requests to clients for their tax returns.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Client</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Document</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Signed</th>
              </tr>
            </thead>
            <tbody>
              {filteredSignatures.map((sig) => (
                <tr key={sig.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-foreground">{sig.typed_name || sig.email || "Pending"}</p>
                    <p className="text-xs text-muted-foreground">{sig.email}</p>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Tax Return
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {sig.signed_at ? (
                      <Badge className="bg-success/10 text-success border-success/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Signed
                      </Badge>
                    ) : (
                      <Badge className="bg-warning/10 text-warning border-warning/20">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {sig.signed_at ? new Date(sig.signed_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Send for Signature Dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request E-Signature</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Select Client</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
                value={selectedClient?.id || ""}
                onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
              >
                <option value="">Choose a client...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.full_name || c.email || "Unnamed"}</option>
                ))}
              </select>
            </div>
            {selectedClient && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm space-y-1">
                <p><strong>Name:</strong> {selectedClient.full_name}</p>
                <p><strong>Email:</strong> {selectedClient.email}</p>
                <p><strong>Tax Year:</strong> {selectedClient.tax_year || new Date().getFullYear()}</p>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Client will receive a request to type their name and consent to e-file authorization (IRS Form 8879 equivalent).
                </p>
              </div>
            )}
            <Button onClick={handleSendForSignature} disabled={!selectedClient} className="w-full bg-accent text-accent-foreground hover:bg-brand-green-dark">
              Send E-Sign Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ESignatureSection;
