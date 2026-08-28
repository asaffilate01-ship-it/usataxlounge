import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useTaxWorkspace } from "@/hooks/useTaxWorkspace";
import type { NewFinancialEntry } from "@/hooks/useIncomeExpenses";
import { supabase } from "@/integrations/supabase/client";
import { taxcenda } from "@/integrations/supabase/taxcenda";
import { safeStorageFilename, sha256File, validateIntakeFile } from "@/lib/documentIntake";
import { getErrorMessage } from "@/lib/errors";
import { takeNativeDocumentPhoto } from "@/lib/native";
import { useToast } from "@/hooks/use-toast";

interface ReceiptScannerProps {
  onExtracted: (data: NewFinancialEntry) => Promise<boolean> | boolean;
}

type ExtractedReceipt = {
  type: "income" | "expense";
  documentType: string;
  entryKind: string;
  category: string;
  vendorName: string;
  description: string;
  amount: number;
  date: string;
  businessUsePercentage: number;
  confidence: number;
  items: Array<{ name: string; amount: number }>;
  needsConfirmation: string[];
};

const emptyResult = (): ExtractedReceipt => ({
  type: "expense",
  documentType: "receipt",
  entryKind: "operating_expense",
  category: "Uncategorized",
  vendorName: "",
  description: "",
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  businessUsePercentage: 100,
  confidence: 0,
  items: [],
  needsConfirmation: [],
});

const ReceiptScanner = ({ onExtracted }: ReceiptScannerProps) => {
  const [open, setOpen] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractedReceipt | null>(null);
  const [duplicateTitle, setDuplicateTitle] = useState<string | null>(null);
  const [keepBoth, setKeepBoth] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const workspace = useTaxWorkspace();
  const { toast } = useToast();

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setFileHash(null);
    setPreview(null);
    setResult(null);
    setDuplicateTitle(null);
    setKeepBoth(false);
    setExtracting(false);
    setSaving(false);
  };

  const processFile = async (selected: File) => {
    setExtracting(true);
    setResult(null);
    setDuplicateTitle(null);
    setKeepBoth(false);

    try {
      validateIntakeFile(selected);
      if (!selected.type.startsWith("image/")) throw new Error("Receipt extraction currently accepts image files. Upload PDFs in Documents.");
      if (!user) throw new Error("Sign in before uploading financial records.");

      const hash = await sha256File(selected);
      const { data: existing } = await taxcenda
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .eq("content_sha256", hash)
        .limit(1);

      if (preview) URL.revokeObjectURL(preview);
      setFile(selected);
      setFileHash(hash);
      setPreview(URL.createObjectURL(selected));
      setDuplicateTitle(existing?.[0]?.title ?? null);

      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = () => reject(new Error("The file could not be read."));
        reader.readAsDataURL(selected);
      });

      const { data, error } = await supabase.functions.invoke("extract-receipt", {
        body: { imageBase64: base64, mimeType: selected.type, fileName: selected.name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(String(data.error));

      const fallback = emptyResult();
      setResult({
        type: data?.type === "income" ? "income" : "expense",
        documentType: String(data?.documentType || fallback.documentType),
        entryKind: String(data?.entryKind || (data?.type === "income" ? "gross_income" : "operating_expense")),
        category: String(data?.category || fallback.category),
        vendorName: String(data?.vendorName || data?.description || ""),
        description: String(data?.description || ""),
        amount: Math.abs(Number(data?.amount) || 0),
        date: /^\d{4}-\d{2}-\d{2}$/.test(String(data?.date)) ? String(data.date) : fallback.date,
        businessUsePercentage: Math.min(100, Math.max(0, Number(data?.businessUsePercentage) || 100)),
        confidence: Math.min(1, Math.max(0, Number(data?.confidence) || 0)),
        items: Array.isArray(data?.items) ? data.items : [],
        needsConfirmation: Array.isArray(data?.needsConfirmation) ? data.needsConfirmation.map(String) : [],
      });
    } catch (error) {
      toast({ title: "Scan failed", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  const saveConfirmed = async () => {
    if (!file || !fileHash || !result || !user) return;
    if (!workspace.engagement || !workspace.entity) {
      toast({ title: "Create your tax workspace first", description: "Open Tax Workspace and start the current filing year before saving records.", variant: "destructive" });
      return;
    }
    if (duplicateTitle && !keepBoth) {
      toast({ title: "Confirm the duplicate decision", description: "Choose whether this is a separate transaction before saving.", variant: "destructive" });
      return;
    }
    if (!result.vendorName.trim() || !result.category.trim() || result.amount <= 0 || !result.date) {
      toast({ title: "Check the extracted details", description: "Vendor, category, date and a positive amount are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const storagePath = `${user.id}/${workspace.engagement.tax_year}/${crypto.randomUUID()}-${safeStorageFilename(file.name)}`;
    let savedDocumentId: string | null = null;

    try {
      const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: document, error: documentError } = await taxcenda
        .from("documents")
        .insert({
          user_id: user.id,
          entity_id: workspace.entity.id,
          engagement_id: workspace.engagement.id,
          title: `${result.documentType.replaceAll("_", " ")}: ${result.vendorName}`,
          type: result.documentType,
          category: result.category,
          file_url: storagePath,
          status: "client_confirmed",
          original_filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          content_sha256: fileHash,
          document_date: result.date,
          amount: result.amount,
          vendor_name: result.vendorName.trim(),
          extraction_status: "completed",
          extraction_confidence: result.confidence,
          duplicate_status: duplicateTitle ? "candidate" : "unchecked",
          metadata: {
            extracted: {
              ...result,
              clientConfirmedAt: new Date().toISOString(),
              duplicateOverride: duplicateTitle ? keepBoth : false,
            },
          },
        })
        .select("*")
        .single();
      if (documentError) throw documentError;
      savedDocumentId = document.id;

      const entrySaved = await Promise.resolve(onExtracted({
        type: result.type,
        category: result.category,
        description: result.description || result.vendorName,
        amount: result.amount,
        entryKind: result.entryKind,
        transactionDate: result.date,
        vendorName: result.vendorName,
        businessUsePercentage: result.businessUsePercentage,
        sourceDocumentId: document.id,
        documentUrl: storagePath,
        createdSource: "document_ai",
      }));
      if (!entrySaved) throw new Error("The financial entry could not be linked to the uploaded evidence.");

      toast({
        title: "Document and entry saved",
        description: duplicateTitle ? "Both records were retained and flagged for reviewer confirmation." : "The original evidence is linked to the financial entry.",
      });
      setOpen(false);
      reset();
      await workspace.refetch();
    } catch (error) {
      if (savedDocumentId) await taxcenda.from("documents").delete().eq("id", savedDocumentId);
      await supabase.storage.from("documents").remove([storagePath]);
      toast({ title: "Unable to save document", description: getErrorMessage(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2"><Camera className="h-4 w-4" /> Scan receipt</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Capture and confirm financial evidence</DialogTitle></DialogHeader>
        <div className="space-y-5 pt-2">
          <p className="text-sm text-muted-foreground">TaxCenda extracts a suggestion. Check every field before it is added to your records.</p>

          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="hidden"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) processFile(selected);
              event.target.value = "";
            }}
          />

          {!file && !extracting && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onClick={async () => {
                  try {
                    const nativeFile = await takeNativeDocumentPhoto();
                    if (nativeFile) await processFile(nativeFile);
                    else fileRef.current?.click();
                  } catch (error) {
                    toast({ title: "Camera unavailable", description: getErrorMessage(error), variant: "destructive" });
                  }
                }}
                className="gap-2 bg-accent text-accent-foreground hover:bg-brand-green-dark"
              ><Camera className="h-4 w-4" /> Take photo</Button>
              <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2"><Upload className="h-4 w-4" /> Choose image</Button>
            </div>
          )}

          {preview && (
            <div className="relative rounded-xl border border-border bg-muted/20 p-3">
              <img src={preview} alt="Document awaiting confirmation" className="mx-auto max-h-64 rounded-lg object-contain" />
              {!extracting && !saving && <button type="button" onClick={reset} className="absolute right-4 top-4 rounded-full bg-background/90 p-1.5 shadow"><X className="h-4 w-4" /></button>}
            </div>
          )}

          {extracting && (
            <div className="flex flex-col items-center gap-3 py-8"><Loader2 className="h-8 w-8 animate-spin text-accent" /><p className="text-sm text-muted-foreground">Reading the document and checking existing evidence…</p></div>
          )}

          {duplicateTitle && result && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
              <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" /><div><p className="text-sm font-semibold text-foreground">This exact file already exists</p><p className="mt-1 text-sm text-muted-foreground">Existing record: {duplicateTitle}</p></div></div>
              <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-foreground"><Checkbox checked={keepBoth} onCheckedChange={(value) => setKeepBoth(Boolean(value))} /><span>These are separate transactions. Keep both and send them to the reviewer.</span></label>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground"><span>Extraction confidence</span><span>{Math.round(result.confidence * 100)}% — client confirmation required</span></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Record type</Label><Select value={result.type} onValueChange={(value: "income" | "expense") => setResult({ ...result, type: value })}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent></Select></div>
                <div><Label>Accounting treatment</Label><Select value={result.entryKind} onValueChange={(value) => setResult({ ...result, entryKind: value })}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gross_income">Gross income</SelectItem><SelectItem value="sales">Sales revenue</SelectItem><SelectItem value="salary_wages">Salary / wages</SelectItem><SelectItem value="interest_income">Interest income</SelectItem><SelectItem value="rental_income">Rental income</SelectItem><SelectItem value="sundry_income">Sundry income</SelectItem><SelectItem value="operating_expense">Operating expense</SelectItem><SelectItem value="cost_of_goods">Cost of goods</SelectItem><SelectItem value="capital_asset">Capital asset</SelectItem><SelectItem value="owner_contribution">Owner contribution</SelectItem><SelectItem value="owner_draw">Owner draw</SelectItem><SelectItem value="loan_proceeds">Loan proceeds</SelectItem><SelectItem value="loan_repayment">Loan repayment</SelectItem><SelectItem value="other">Other / ask reviewer</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="scan-vendor">Vendor or payer</Label><Input id="scan-vendor" className="mt-1.5" value={result.vendorName} onChange={(event) => setResult({ ...result, vendorName: event.target.value })} /></div>
                <div><Label htmlFor="scan-category">Category</Label><Input id="scan-category" className="mt-1.5" value={result.category} onChange={(event) => setResult({ ...result, category: event.target.value })} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><Label htmlFor="scan-amount">Amount ($)</Label><Input id="scan-amount" className="mt-1.5" type="number" min="0.01" step="0.01" value={result.amount} onChange={(event) => setResult({ ...result, amount: Number(event.target.value) })} /></div>
                <div><Label htmlFor="scan-date">Document date</Label><Input id="scan-date" className="mt-1.5" type="date" value={result.date} onChange={(event) => setResult({ ...result, date: event.target.value })} /></div>
                <div><Label htmlFor="scan-use">Business use (%)</Label><Input id="scan-use" className="mt-1.5" type="number" min="0" max="100" step="0.01" value={result.businessUsePercentage} onChange={(event) => setResult({ ...result, businessUsePercentage: Number(event.target.value) })} /></div>
              </div>
              <div><Label htmlFor="scan-description">Description</Label><Input id="scan-description" className="mt-1.5" value={result.description} onChange={(event) => setResult({ ...result, description: event.target.value })} /></div>
              {result.needsConfirmation.length > 0 && <div className="rounded-xl border border-warning/20 bg-warning/5 p-3"><p className="text-xs font-semibold text-foreground">Please check</p><ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">{result.needsConfirmation.map((item) => <li key={item}>{item}</li>)}</ul></div>}
              <Button onClick={saveConfirmed} disabled={saving || (Boolean(duplicateTitle) && !keepBoth)} className="w-full bg-accent text-accent-foreground hover:bg-brand-green-dark">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />} Confirm and save evidence
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptScanner;
