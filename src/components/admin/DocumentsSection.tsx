import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Filter,
  Loader2,
  MessageSquare,
  Search,
  Upload,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useSignedUrl } from "@/hooks/useSignedUrl";
import { useToast } from "@/hooks/use-toast";
import {
  DocumentAnnotation,
  IntakeDocument,
  taxcenda,
} from "@/integrations/supabase/taxcenda";
import { supabase } from "@/integrations/supabase/client";
import {
  safeStorageFilename,
  sha256File,
  validateIntakeFile,
} from "@/lib/documentIntake";
import { getErrorMessage } from "@/lib/errors";
import { getSignedUrl } from "@/lib/storage";

const statusColor = (status: string | null) => {
  if (["approved", "client_confirmed"].includes(status ?? ""))
    return "bg-success/10 text-success";
  if (status === "rejected") return "bg-destructive/10 text-destructive";
  if (["received", "pending_review"].includes(status ?? ""))
    return "bg-warning/10 text-warning";
  return "bg-muted text-muted-foreground";
};

const typeColor = (type: string) => {
  if (type === "receipt") return "bg-warning/10 text-warning";
  if (type === "tax_return") return "bg-primary/10 text-primary";
  if (type === "bank_statement") return "bg-accent/10 text-accent";
  return "bg-muted text-muted-foreground";
};

const documentType = (file: File) => {
  const name = file.name.toLowerCase();
  if (/bank|statement|\.ofx$|\.qfx$|\.qbo$/.test(name)) return "bank_statement";
  if (file.type.startsWith("image/")) return "source_image";
  return "document";
};

const DocumentsSection = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const [documents, setDocuments] = useState<IntakeDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [previewDoc, setPreviewDoc] = useState<IntakeDocument | null>(null);
  const [annotations, setAnnotations] = useState<DocumentAnnotation[]>([]);
  const [annotationText, setAnnotationText] = useState("");
  const [savingAnnotation, setSavingAnnotation] = useState(false);
  const [uploading, setUploading] = useState(false);
  const previewUrl = useSignedUrl("documents", previewDoc?.file_url);
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  const fetchDocuments = useCallback(async () => {
    const { data, error } = await taxcenda
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error)
      toast({
        title: "Unable to load documents",
        description: error.message,
        variant: "destructive",
      });
    else setDocuments(data ?? []);
  }, [toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const fetchAnnotations = useCallback(
    async (documentId: string) => {
      const { data, error } = await taxcenda
        .from("document_annotations")
        .select("*")
        .eq("document_id", documentId)
        .order("created_at", { ascending: true });
      if (error)
        toast({
          title: "Annotations could not be loaded",
          description: error.message,
          variant: "destructive",
        });
      else setAnnotations(data ?? []);
    },
    [toast],
  );

  useEffect(() => {
    if (previewDoc) fetchAnnotations(previewDoc.id);
    else setAnnotations([]);
  }, [fetchAnnotations, previewDoc]);

  const addAnnotation = async () => {
    if (!previewDoc || !annotationText.trim()) return;
    setSavingAnnotation(true);
    const { data: authData } = await supabase.auth.getUser();
    const { error } = await taxcenda.from("document_annotations").insert({
      document_id: previewDoc.id,
      user_id: authData.user?.id || "",
      annotation_type: "note",
      content: annotationText.trim(),
    });
    if (error)
      toast({
        title: "Annotation was not saved",
        description: error.message,
        variant: "destructive",
      });
    else {
      setAnnotationText("");
      await fetchAnnotations(previewDoc.id);
      toast({ title: "Document note added" });
    }
    setSavingAnnotation(false);
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    let storagePath: string | null = null;

    try {
      validateIntakeFile(file);
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error("Sign in before uploading documents.");

      const contentHash = await sha256File(file);
      const { data: existing } = await taxcenda
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .eq("content_sha256", contentHash)
        .limit(1);
      if (existing?.[0])
        throw new Error(
          `This exact file is already stored as “${existing[0].title}”.`,
        );

      const { data: engagements, error: engagementError } = await taxcenda
        .from("tax_engagements")
        .select("*")
        .eq("user_id", user.id)
        .order("tax_year", { ascending: false })
        .limit(1);
      if (engagementError) throw engagementError;
      const engagement = engagements?.[0];
      if (!engagement)
        throw new Error(
          "Create your tax-year workspace before uploading source records.",
        );

      const { data: entities, error: entityError } = await taxcenda
        .from("tax_entities")
        .select("*")
        .eq("id", engagement.entity_id)
        .limit(1);
      if (entityError) throw entityError;
      const entity = entities?.[0];
      if (!entity)
        throw new Error(
          "The tax entity for this workspace could not be found.",
        );

      storagePath = `${user.id}/${engagement.tax_year}/${crypto.randomUUID()}-${safeStorageFilename(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, {
          contentType: file.type || undefined,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const type = documentType(file);
      const { error: documentError } = await taxcenda.from("documents").insert({
        user_id: user.id,
        entity_id: entity.id,
        engagement_id: engagement.id,
        title: file.name,
        type,
        category: type === "bank_statement" ? "banking" : "uploaded",
        status: "received",
        file_url: storagePath,
        original_filename: file.name,
        mime_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        content_sha256: contentHash,
        extraction_status: "not_started",
        duplicate_status: "unchecked",
        metadata: {
          uploadedFrom: "document_vault",
          uploadedAt: new Date().toISOString(),
        },
      });
      if (documentError) throw documentError;

      toast({
        title: "Document uploaded",
        description:
          "The original file and provenance are preserved for review.",
      });
      await fetchDocuments();
    } catch (error) {
      if (storagePath)
        await supabase.storage.from("documents").remove([storagePath]);
      toast({
        title: "Upload failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (document: IntakeDocument) => {
    if (!document.file_url) return;
    const signedUrl = await getSignedUrl("documents", document.file_url);
    if (!signedUrl) {
      toast({ title: "Unable to download file", variant: "destructive" });
      return;
    }
    const anchor = window.document.createElement("a");
    anchor.href = signedUrl;
    anchor.download = document.original_filename || document.title;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.click();
  };

  const handleApproval = async (
    documentId: string,
    status: "approved" | "rejected",
  ) => {
    const { error } = await taxcenda
      .from("documents")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", documentId);
    if (error)
      toast({
        title: "Document status was not changed",
        description: error.message,
        variant: "destructive",
      });
    else {
      toast({ title: `Document ${status}` });
      logAction(`document_${status}`, "documents", documentId);
      await fetchDocuments();
    }
  };

  const filtered = useMemo(
    () =>
      documents.filter((document) => {
        const matchesSearch = document.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesType =
          filterType === "all" || document.type === filterType;
        return matchesSearch && matchesType;
      }),
    [documents, filterType, searchQuery],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Document vault
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Original files are stored privately with a content fingerprint and
            tax-year provenance.
          </p>
        </div>
        {!isAdmin && (
          <label className="cursor-pointer">
            <input
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,application/pdf,text/csv,text/plain,.docx,.xlsx,.ofx,.qfx,.qbo"
              onChange={handleFileUpload}
            />
            <Button
              asChild
              disabled={uploading}
              className="bg-accent text-accent-foreground hover:bg-brand-green-dark"
            >
              <span>
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}{" "}
                Upload source file
              </span>
            </Button>
          </label>
        )}
      </div>

      {!isAdmin && (
        <p className="rounded-xl border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
          For automatic receipt extraction, use{" "}
          <strong>Income &amp; Expenses → Scan receipt</strong>. Images uploaded
          here remain source evidence and are not posted automatically.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative min-w-[220px] max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search documents…"
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-44">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="source_image">Source images</SelectItem>
            <SelectItem value="receipt">Receipts</SelectItem>
            <SelectItem value="bank_statement">Bank statements</SelectItem>
            <SelectItem value="tax_return">Tax returns</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <FileText className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p className="font-display text-lg">No documents yet</p>
          <p className="mt-1 text-sm">
            Upload statements, invoices, receipts, payroll files or prior-year
            records.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-elegant">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Document
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Type
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">
                  Date
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((document) => (
                <tr
                  key={document.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-foreground">
                      {document.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {document.size_bytes
                        ? `${(Number(document.size_bytes) / 1024 / 1024).toFixed(2)} MB`
                        : "Stored record"}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={typeColor(document.type)}>
                      {document.type.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={statusColor(document.status)}>
                      {document.status || "received"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">
                    {new Date(document.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      {isAdmin && document.status !== "approved" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-success"
                          onClick={() =>
                            handleApproval(document.id, "approved")
                          }
                          title="Approve"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin && document.status !== "rejected" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() =>
                            handleApproval(document.id, "rejected")
                          }
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPreviewDoc(document)}
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDownload(document)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={Boolean(previewDoc)}
        onOpenChange={(open) => {
          if (!open) {
            setPreviewDoc(null);
            setAnnotationText("");
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewDoc?.title}</DialogTitle>
          </DialogHeader>
          {previewDoc?.file_url &&
            (previewUrl ? (
              previewDoc.mime_type?.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt={previewDoc.title}
                  className="max-h-[55vh] w-full rounded-lg object-contain"
                />
              ) : previewDoc.mime_type === "application/pdf" ? (
                <iframe
                  src={previewUrl}
                  className="h-[55vh] w-full rounded-lg"
                  title={previewDoc.title}
                />
              ) : (
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent underline"
                >
                  Open the secure file in a new tab
                </a>
              )
            ) : (
              <div className="h-40 animate-pulse rounded-lg bg-muted" />
            ))}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              <Label>Document notes and questions</Label>
            </div>
            {annotations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No annotations yet.
              </p>
            ) : (
              <div className="max-h-40 space-y-2 overflow-y-auto">
                {annotations.map((annotation) => (
                  <div
                    key={annotation.id}
                    className="rounded-lg bg-muted/50 p-3"
                  >
                    <p className="text-sm text-foreground">
                      {annotation.content}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {annotation.annotation_type} ·{" "}
                      {new Date(annotation.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <Textarea
              value={annotationText}
              onChange={(event) => setAnnotationText(event.target.value)}
              placeholder="Add a note or question about this document…"
            />
            <Button
              size="sm"
              onClick={addAnnotation}
              disabled={!annotationText.trim() || savingAnnotation}
            >
              {savingAnnotation && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add note
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentsSection;
