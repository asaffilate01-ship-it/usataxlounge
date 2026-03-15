import { useState, useRef } from "react";
import { Camera, Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ReceiptScannerProps {
  onExtracted: (data: { type: "income" | "expense"; category: string; description: string; amount: number }) => void;
}

const ReceiptScanner = ({ onExtracted }: ReceiptScannerProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processFile = async (file: File) => {
    setLoading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setPreview(URL.createObjectURL(file));

      const { data, error } = await supabase.functions.invoke("extract-receipt", {
        body: { imageBase64: base64, mimeType: file.type },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      onExtracted({
        type: data.type === "income" ? "income" : "expense",
        category: data.category || "Other",
        description: data.description || "",
        amount: Math.abs(Number(data.amount) || 0),
      });

      toast({ title: "Receipt scanned", description: `Extracted: $${data.amount} — ${data.category}` });
      setOpen(false);
      setPreview(null);
    } catch (err: any) {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPreview(null); setLoading(false); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Camera className="h-4 w-4" /> Scan Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Receipt / Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Upload a photo of a receipt, bill, or invoice and we'll automatically extract the details.
          </p>

          {preview ? (
            <div className="relative">
              <img src={preview} alt="Receipt preview" className="rounded-lg max-h-64 mx-auto object-contain" />
              {!loading && (
                <button onClick={() => setPreview(null)} className="absolute top-2 right-2 bg-background/80 rounded-full p-1">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : null}

          {loading ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-sm text-muted-foreground">Extracting data with AI...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processFile(file);
                  e.target.value = "";
                }}
              />
              <Button onClick={() => fileRef.current?.click()} className="w-full gap-2 bg-accent text-accent-foreground hover:bg-brand-green-dark">
                <Upload className="h-4 w-4" /> Upload Receipt Photo
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.capture = "environment";
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) processFile(file);
                  };
                  input.click();
                }}
              >
                <Camera className="h-4 w-4" /> Take Photo
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptScanner;
