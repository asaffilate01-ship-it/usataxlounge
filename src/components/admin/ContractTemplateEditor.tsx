import { useState, useEffect } from "react";
import { Plus, FileText, Eye, Printer, Download, Send, Search, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_ENGAGEMENT_LETTER = `ENGAGEMENT LETTER FOR TAX PREPARATION SERVICES

Date: {{date}}

To: {{client_name}}
Address: {{client_address}}
Email: {{client_email}}
Phone: {{client_phone}}

Dear {{client_name}},

Thank you for choosing TaxLounge for your tax preparation needs. This letter confirms the terms of our engagement to prepare your {{tax_year}} federal and state income tax returns.

SCOPE OF SERVICES:
We will prepare your Form {{form_type}} for the tax year {{tax_year}} based on the information you provide. Our services include:
- Preparation and filing of your federal tax return
- Preparation and filing of applicable state tax returns
- E-filing with the IRS upon your authorization
- Review of prior year returns for accuracy

CLIENT RESPONSIBILITIES:
You agree to provide all information and documents necessary for the preparation of your tax returns, including but not limited to W-2s, 1099s, receipts, and other relevant documentation.

FEES:
Our fee for the preparation of your {{tax_year}} tax returns will be based on the complexity of your return and the forms required. We will discuss fees with you before beginning work.

Filing Status: {{filing_status}}
SSN (Last 4): •••-••-{{ssn_last4}}

CIRCULAR 230 DISCLOSURE:
To ensure compliance with requirements imposed by the IRS, we inform you that any U.S. federal tax advice contained in this communication is not intended or written to be used, and cannot be used, for the purpose of avoiding penalties under the Internal Revenue Code.

Please sign below to authorize us to proceed with the preparation of your tax returns.

Authorized by: ___________________________
Name: {{client_name}}
Date: {{signature_date}}

TaxLounge — IRS Enrolled Agents
info@taxlounge.com | (305) 555-0190`;

const TEMPLATE_FIELDS = [
  { key: "client_name", label: "Client Name", source: "full_name" },
  { key: "client_address", label: "Client Address", source: "address" },
  { key: "client_email", label: "Client Email", source: "email" },
  { key: "client_phone", label: "Client Phone", source: "phone" },
  { key: "tax_year", label: "Tax Year", source: "tax_year" },
  { key: "filing_status", label: "Filing Status", source: "filing_status" },
  { key: "ssn_last4", label: "SSN Last 4", source: "ssn_last4" },
  { key: "form_type", label: "Form Type", source: "form_type" },
  { key: "date", label: "Date", source: "auto" },
  { key: "signature_date", label: "Signature Date", source: "auto" },
];

interface ContractTemplateEditorProps {
  clients: any[];
}

const ContractTemplateEditor = ({ clients }: ContractTemplateEditorProps) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [newTemplate, setNewTemplate] = useState({ name: "", description: "", content: DEFAULT_ENGAGEMENT_LETTER });
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from("contract_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setTemplates(data);
  };

  const handleCreate = async () => {
    if (!newTemplate.name.trim() || !newTemplate.content.trim()) return;
    const user = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from("contract_templates").insert({
      name: newTemplate.name.trim(),
      description: newTemplate.description.trim() || null,
      content: newTemplate.content,
      fields: TEMPLATE_FIELDS,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Template Created" });
      setNewTemplate({ name: "", description: "", content: DEFAULT_ENGAGEMENT_LETTER });
      setCreateOpen(false);
      fetchTemplates();
    }
  };

  const fillTemplate = (content: string, client: any) => {
    const filingStatusMap: Record<string, string> = {
      single: "Single",
      married_joint: "Married Filing Jointly",
      married_separate: "Married Filing Separately",
      head_of_household: "Head of Household",
      qualifying_widow: "Qualifying Widow(er)",
    };
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    return content
      .replace(/\{\{client_name\}\}/g, client?.full_name || "___________")
      .replace(/\{\{client_address\}\}/g, client?.address || "___________")
      .replace(/\{\{client_email\}\}/g, client?.email || "___________")
      .replace(/\{\{client_phone\}\}/g, client?.phone || "___________")
      .replace(/\{\{tax_year\}\}/g, String(client?.tax_year || new Date().getFullYear()))
      .replace(/\{\{filing_status\}\}/g, filingStatusMap[client?.filing_status] || "___________")
      .replace(/\{\{ssn_last4\}\}/g, client?.ssn_last4 || "____")
      .replace(/\{\{form_type\}\}/g, "1040")
      .replace(/\{\{date\}\}/g, today)
      .replace(/\{\{signature_date\}\}/g, today);
  };

  const handlePreview = (template: any, client?: any) => {
    const c = client || selectedClient || clients[0];
    setPreviewContent(fillTemplate(template.content, c));
    setPreviewOpen(true);
  };

  const handlePrint = () => {
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`<html><head><title>Contract</title><style>body{font-family:serif;white-space:pre-wrap;padding:40px;line-height:1.8;max-width:800px;margin:0 auto}</style></head><body>${previewContent}</body></html>`);
      w.document.close();
      w.print();
    }
  };

  const handleDownload = () => {
    const blob = new Blob([previewContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contract.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    const subject = encodeURIComponent("Tax Preparation Engagement Letter — TaxLounge");
    const body = encodeURIComponent(previewContent);
    window.open(`mailto:${selectedClient?.email || ""}?subject=${subject}&body=${body}`);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("contract_templates").delete().eq("id", id);
    fetchTemplates();
    toast({ title: "Template Deleted" });
  };

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">Contract Templates</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-brand-green-dark">
              <Plus className="h-4 w-4 mr-2" /> New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Contract Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Template Name</Label>
                <Input className="mt-1.5" placeholder="Engagement Letter 2024" value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Input className="mt-1.5" placeholder="Standard engagement letter for individual returns" value={newTemplate.description} onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })} />
              </div>
              <div>
                <Label>Template Content</Label>
                <p className="text-xs text-muted-foreground mb-1.5">Use {"{{field_name}}"} for auto-fill fields: {TEMPLATE_FIELDS.map(f => `{{${f.key}}}`).join(", ")}</p>
                <Textarea className="mt-1 font-mono text-xs" rows={20} value={newTemplate.content} onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })} />
              </div>
              <Button onClick={handleCreate} className="w-full bg-accent text-accent-foreground hover:bg-brand-green-dark">
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search templates..." className="pl-10" />
        </div>
        <div className="relative max-w-xs">
          <select
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground"
            value={selectedClient?.id || ""}
            onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
          >
            <option value="">Select client for preview...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.full_name || c.email || "Unnamed"}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-display text-lg">No templates yet</p>
          <p className="text-sm mt-1">Create your first contract template to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((template) => (
            <div key={template.id} className="p-5 rounded-2xl border border-border bg-card shadow-elegant flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{template.name}</p>
                  <p className="text-sm text-muted-foreground">{template.description || "No description"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handlePreview(template)}>
                  <Eye className="h-4 w-4 mr-1" /> Preview
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(template.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contract Preview</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
            <Button size="sm" variant="outline" onClick={handleEmail}>
              <Send className="h-4 w-4 mr-1" /> Email
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-background p-6 font-mono text-xs whitespace-pre-wrap leading-relaxed">
            {previewContent}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractTemplateEditor;
