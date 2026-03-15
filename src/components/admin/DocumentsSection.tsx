import { useState, useEffect } from "react";
import { FileText, Search, Filter, Printer, Download, Send, Trash2, Upload, Eye, Camera, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DocumentsSection = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setDocuments(data);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    // If it's an image, offer AI extraction
    if (file.type.startsWith("image/")) {
      setScanOpen(true);
      setScanning(true);
      setScanResult(null);

      try {
        // First upload the file to storage
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(uploadData.path);
        const fileUrl = urlData.publicUrl;

        // Then try AI extraction
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = (reader.result as string).split(",")[1];
          try {
            const { data, error } = await supabase.functions.invoke("extract-receipt", {
              body: { imageBase64: base64, mimeType: file.type },
            });
            if (error) throw error;
            setScanResult({ ...data, fileUrl, filePath: uploadData.path });
          } catch (err: any) {
            // AI extraction failed but file is still uploaded
            setScanResult({ error: "Could not extract data. File has been saved.", fileUrl, filePath: uploadData.path });
          }
          setScanning(false);
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        toast({ title: "Upload Error", description: err.message, variant: "destructive" });
        setScanning(false);
        setScanOpen(false);
      }
    } else {
      // Upload file to storage then save document record
      setUploading(true);
      try {
        const filePath = `${user.id}/${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(uploadData.path);

        await supabase.from("documents").insert({
          user_id: user.id,
          title: file.name,
          type: "document",
          category: "uploaded",
          status: "saved",
          file_url: urlData.publicUrl,
        });

        fetchDocuments();
        toast({ title: "Document Uploaded", description: file.name });
      } catch (err: any) {
        toast({ title: "Upload Error", description: err.message, variant: "destructive" });
      }
      setUploading(false);
    }
    e.target.value = "";
  };

  const handleSaveExtracted = async () => {
    if (!scanResult) return;
    const user = (await supabase.auth.getUser()).data.user;

    // Save as income_expense entry if we have amount
    if (scanResult.amount) {
      await supabase.from("income_expenses").insert({
        user_id: user?.id || "",
        type: scanResult.type || "expense",
        category: scanResult.category || "Uncategorized",
        description: scanResult.description || "",
        amount: scanResult.amount || 0,
      });
    }

    // Save as document with file URL
    const { error } = await supabase.from("documents").insert({
      user_id: user?.id || "",
      title: `Receipt: ${scanResult.description || "Scanned"}`,
      type: "receipt",
      category: scanResult.category || "expense",
      status: "saved",
      metadata: scanResult,
      file_url: scanResult.fileUrl || null,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Receipt Saved", description: scanResult.amount ? `${scanResult.category}: $${scanResult.amount}` : "Document saved" });
      setScanOpen(false);
      setScanResult(null);
      fetchDocuments();
    }
  };

  const handlePrint = (doc: any) => {
    if (doc.file_url) {
      const w = window.open(doc.file_url, "_blank");
      if (w) setTimeout(() => w.print(), 1000);
      return;
    }
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`<html><head><title>${doc.title}</title><style>body{font-family:sans-serif;padding:40px;max-width:800px;margin:0 auto}</style></head><body><h1>${doc.title}</h1><p>Type: ${doc.type}</p><p>Category: ${doc.category || "—"}</p><p>Status: ${doc.status}</p><p>Created: ${new Date(doc.created_at).toLocaleDateString()}</p>${doc.content ? `<pre>${doc.content}</pre>` : ""}</body></html>`);
      w.document.close();
      w.print();
    }
  };

  const handleDownload = (doc: any) => {
    if (doc.file_url) {
      const a = document.createElement("a");
      a.href = doc.file_url;
      a.download = doc.title;
      a.target = "_blank";
      a.click();
      return;
    }
    const content = `${doc.title}\nType: ${doc.type}\nCategory: ${doc.category || ""}\nStatus: ${doc.status}\nCreated: ${new Date(doc.created_at).toLocaleDateString()}\n\n${doc.content || ""}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmail = (doc: any) => {
    const subject = encodeURIComponent(doc.title);
    const body = encodeURIComponent(`${doc.title}\n\n${doc.file_url ? `File: ${doc.file_url}` : doc.content || "See attached document."}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleDelete = async (id: string) => {
    // Find the doc to delete from storage too
    const doc = documents.find(d => d.id === id);
    if (doc?.file_url) {
      // Try to extract storage path from URL and delete from storage
      try {
        const url = new URL(doc.file_url);
        const pathMatch = url.pathname.match(/\/object\/public\/documents\/(.*)/);
        if (pathMatch) {
          await supabase.storage.from("documents").remove([decodeURIComponent(pathMatch[1])]);
        }
      } catch {
        // Ignore storage deletion errors
      }
    }
    await supabase.from("documents").delete().eq("id", id);
    fetchDocuments();
    toast({ title: "Document Deleted" });
  };

  const filtered = documents.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "all" || d.type === filterType;
    return matchSearch && matchType;
  });

  const statusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-success/10 text-success";
      case "rejected": return "bg-destructive/10 text-destructive";
      case "pending_review": return "bg-warning/10 text-warning";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleApproval = async (docId: string, newStatus: "approved" | "rejected") => {
    const { error } = await supabase.from("documents").update({ status: newStatus }).eq("id", docId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Document ${newStatus}` });
      fetchDocuments();
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "receipt": return "bg-warning/10 text-warning";
      case "contract": return "bg-accent/10 text-accent";
      case "tax_return": return "bg-primary/10 text-primary";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-display text-xl font-bold text-foreground">Documents</h2>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xlsx,.csv,.txt" onChange={handleFileUpload} />
            <Button asChild className="bg-accent text-accent-foreground hover:bg-brand-green-dark" disabled={uploading}>
              <span>{uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />} Upload</span>
            </Button>
          </label>
          <label className="cursor-pointer">
            <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
            <Button asChild variant="outline">
              <span><Camera className="h-4 w-4 mr-2" /> Scan Receipt</span>
            </Button>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search documents..." className="pl-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="receipt">Receipts</SelectItem>
            <SelectItem value="contract">Contracts</SelectItem>
            <SelectItem value="tax_return">Tax Returns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-display text-lg">No documents yet</p>
          <p className="text-sm mt-1">Upload documents or scan receipts to get started.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-elegant overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Document</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Date</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-foreground">{doc.title}</p>
                    <p className="text-xs text-muted-foreground">{doc.status} {doc.file_url ? "• Stored" : ""}</p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={typeColor(doc.type)}>{doc.type}</Badge>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{doc.category || "—"}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewDoc(doc)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePrint(doc)}><Printer className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc)}><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEmail(doc)}><Send className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(doc.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewDoc?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Type:</span> <span className="text-foreground">{previewDoc?.type}</span></div>
              <div><span className="text-muted-foreground">Category:</span> <span className="text-foreground">{previewDoc?.category || "—"}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className="text-foreground">{previewDoc?.status}</span></div>
              <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{previewDoc ? new Date(previewDoc.created_at).toLocaleDateString() : ""}</span></div>
            </div>
            {previewDoc?.file_url && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                {previewDoc.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={previewDoc.file_url} alt={previewDoc.title} className="max-w-full rounded-lg" />
                ) : previewDoc.file_url.match(/\.pdf$/i) ? (
                  <iframe src={previewDoc.file_url} className="w-full h-96 rounded-lg" title={previewDoc.title} />
                ) : (
                  <a href={previewDoc.file_url} target="_blank" rel="noopener noreferrer" className="text-accent underline text-sm">
                    Open file in new tab
                  </a>
                )}
              </div>
            )}
            {previewDoc?.content && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm whitespace-pre-wrap">{previewDoc.content}</div>
            )}
            {previewDoc?.metadata && Object.keys(previewDoc.metadata).length > 0 && (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Extracted Data</p>
                <pre className="text-xs text-foreground overflow-auto">{JSON.stringify(previewDoc.metadata, null, 2)}</pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Scan Result Dialog */}
      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receipt Scan Result</DialogTitle>
          </DialogHeader>
          {scanning ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
              <p className="text-muted-foreground">Extracting data from receipt...</p>
            </div>
          ) : scanResult ? (
            <div className="space-y-4">
              {scanResult.error && !scanResult.amount ? (
                <p className="text-muted-foreground text-sm">{scanResult.error}</p>
              ) : scanResult.amount ? (
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Type:</span> <span className="text-foreground capitalize">{scanResult.type}</span></div>
                    <div><span className="text-muted-foreground">Amount:</span> <span className="text-foreground font-semibold">${scanResult.amount}</span></div>
                    <div><span className="text-muted-foreground">Category:</span> <span className="text-foreground">{scanResult.category}</span></div>
                    <div><span className="text-muted-foreground">Date:</span> <span className="text-foreground">{scanResult.date || "Not detected"}</span></div>
                  </div>
                  <div><span className="text-muted-foreground text-sm">Description:</span> <span className="text-foreground text-sm">{scanResult.description}</span></div>
                  {scanResult.items && scanResult.items.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Items:</p>
                      {scanResult.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between text-xs text-foreground">
                          <span>{item.name}</span>
                          <span>${item.amount}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
              <div className="flex gap-2">
                <Button onClick={handleSaveExtracted} className="flex-1 bg-accent text-accent-foreground hover:bg-brand-green-dark">
                  Save to System
                </Button>
                <Button variant="outline" onClick={() => { setScanOpen(false); setScanResult(null); }}>
                  Discard
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentsSection;
