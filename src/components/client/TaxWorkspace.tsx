import { FormEvent, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  FileQuestion,
  Landmark,
  Loader2,
  Plus,
  ReceiptText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTaxWorkspace } from "@/hooks/useTaxWorkspace";

const WORKFLOW_LABELS: Record<string, string> = {
  collecting: "Collecting records",
  processing: "Processing evidence",
  client_questions: "Questions for you",
  bookkeeping_review: "Bookkeeping review",
  reconciled: "Books reconciled",
  tax_preparation: "Tax preparation",
  accountant_review: "Accountant review",
  client_review: "Your final review",
  signature_complete: "Signature complete",
  approved_to_file: "Approved to file",
  transmitted: "Submitted",
  accepted: "Accepted",
  rejected: "Correction required",
  completed: "Completed",
  amended: "Amendment in progress",
};

const TaxWorkspace = () => {
  const workspace = useTaxWorkspace();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [assetOpen, setAssetOpen] = useState(false);
  const [asset, setAsset] = useState({
    description: "",
    assetClass: "computer_equipment",
    placedInServiceDate: "",
    cost: "",
    businessUsePercentage: "100",
  });

  const openQuestions = workspace.questions.filter((question) => question.status === "open");
  const answeredQuestions = workspace.questions.filter((question) => question.status === "answered");
  const openDuplicates = workspace.duplicates.filter((candidate) => candidate.status === "open");
  const documentNames = useMemo(
    () => new Map(workspace.documents.map((document) => [document.id, document.title])),
    [workspace.documents],
  );

  const submitAsset = async (event: FormEvent) => {
    event.preventDefault();
    const saved = await workspace.addAsset({
      description: asset.description,
      assetClass: asset.assetClass,
      placedInServiceDate: asset.placedInServiceDate,
      cost: Number(asset.cost),
      businessUsePercentage: Number(asset.businessUsePercentage),
    });
    if (saved) {
      setAsset({ description: "", assetClass: "computer_equipment", placedInServiceDate: "", cost: "", businessUsePercentage: "100" });
      setAssetOpen(false);
    }
  };

  if (workspace.loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!workspace.engagement) {
    return (
      <div className="mx-auto max-w-3xl py-8 animate-fade-in">
        <Card className="overflow-hidden border-accent/20 shadow-elegant">
          <div className="gradient-hero px-6 py-8 text-white">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="font-display text-2xl font-bold">Create your TaxCenda workspace</h2>
            <p className="mt-2 max-w-xl text-sm text-white/70">
              Keep source records, questions, bookkeeping review, fixed assets, financial statements and filing approvals together for one tax year.
            </p>
          </div>
          <CardContent className="space-y-5 p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                [ReceiptText, "Collect", "Receipts, statements and manual entries"],
                [FileQuestion, "Confirm", "Duplicates and intelligent questions"],
                [ShieldCheck, "Approve", "Human-reviewed forms before filing"],
              ].map(([Icon, title, description]) => {
                const ItemIcon = Icon as typeof ReceiptText;
                return (
                  <div key={String(title)} className="rounded-xl border border-border bg-muted/20 p-4">
                    <ItemIcon className="mb-3 h-5 w-5 text-accent" />
                    <p className="text-sm font-semibold text-foreground">{String(title)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{String(description)}</p>
                  </div>
                );
              })}
            </div>
            <Button
              onClick={() => workspace.initializeWorkspace()}
              disabled={workspace.saving}
              className="w-full bg-accent text-accent-foreground hover:bg-brand-green-dark sm:w-auto"
            >
              {workspace.saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start current filing year
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const engagement = workspace.engagement;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-elegant sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-bold text-foreground">{workspace.entity?.legal_name}</h2>
            <Badge variant="outline">Tax year {engagement.tax_year}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{WORKFLOW_LABELS[engagement.workflow_status] || engagement.current_step}</p>
        </div>
        <div className="w-full sm:w-64">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>Engagement progress</span>
            <span>{engagement.progress}%</span>
          </div>
          <Progress value={engagement.progress} className="h-2" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [ReceiptText, "Source documents", workspace.documents.length, "Original evidence retained"],
          [FileQuestion, "Questions to answer", openQuestions.length, answeredQuestions.length ? `${answeredQuestions.length} awaiting review` : "Nothing awaiting review"],
          [AlertTriangle, "Duplicate checks", openDuplicates.length, "Exact and similar records"],
          [Building2, "Fixed assets", workspace.assets.length, "Book and tax treatment"],
        ].map(([Icon, label, value, note]) => {
          const ItemIcon = Icon as typeof ReceiptText;
          return (
            <Card key={String(label)}>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">{String(label)}</p>
                  <ItemIcon className="h-5 w-5 text-accent" />
                </div>
                <p className="font-display text-2xl font-bold text-foreground">{String(value)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{String(note)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(openQuestions.length > 0 || openDuplicates.length > 0) && (
        <section className="space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">Action centre</h3>
            <p className="text-sm text-muted-foreground">Your answers are retained with the supporting evidence and sent to your tax reviewer.</p>
          </div>

          {openQuestions.map((question) => (
            <Card key={question.id} className={question.priority === "blocking" ? "border-destructive/30" : "border-warning/30"}>
              <CardContent className="space-y-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline">{question.topic}</Badge>
                      <Badge className={question.priority === "blocking" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}>
                        {question.priority}
                      </Badge>
                    </div>
                    <p className="font-medium text-foreground">{question.question}</p>
                    {question.context && <p className="mt-1 text-sm text-muted-foreground">{question.context}</p>}
                    {question.impact && <p className="mt-2 text-xs text-muted-foreground">Why it matters: {question.impact}</p>}
                  </div>
                </div>
                <Textarea
                  value={answers[question.id] ?? ""}
                  onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                  placeholder="Type your answer, including the business purpose where relevant"
                  className="min-h-24"
                />
                <Button
                  size="sm"
                  disabled={workspace.saving || (answers[question.id]?.trim().length ?? 0) < 2}
                  onClick={async () => {
                    const saved = await workspace.answerQuestion(question.id, answers[question.id] ?? "");
                    if (saved) setAnswers((current) => ({ ...current, [question.id]: "" }));
                  }}
                  className="bg-accent text-accent-foreground hover:bg-brand-green-dark"
                >
                  Send answer
                </Button>
              </CardContent>
            </Card>
          ))}

          {openDuplicates.map((candidate) => (
            <Card key={candidate.id} className="border-warning/30">
              <CardContent className="space-y-4 p-5">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                  <div>
                    <p className="font-medium text-foreground">Possible duplicate documents</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {documentNames.get(candidate.primary_document_id) || "Earlier document"} and {documentNames.get(candidate.candidate_document_id) || "New document"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Match confidence: {Math.round(Number(candidate.score) * 100)}%</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="destructive" disabled={workspace.saving} onClick={() => workspace.resolveDuplicate(candidate.id, "confirmed_duplicate")}>Same document</Button>
                  <Button size="sm" variant="outline" disabled={workspace.saving} onClick={() => workspace.resolveDuplicate(candidate.id, "keep_both")}>Separate transactions — keep both</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">Fixed-asset register</h3>
            <p className="text-sm text-muted-foreground">TaxCenda collects the facts; the reviewer approves the tax method and depreciation.</p>
          </div>
          <Dialog open={assetOpen} onOpenChange={setAssetOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add asset</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add a fixed asset</DialogTitle></DialogHeader>
              <form className="space-y-4" onSubmit={submitAsset}>
                <div>
                  <Label htmlFor="asset-description">Description</Label>
                  <Input id="asset-description" className="mt-1.5" required value={asset.description} onChange={(event) => setAsset({ ...asset, description: event.target.value })} placeholder="e.g. MacBook Pro" />
                </div>
                <div>
                  <Label>Asset class</Label>
                  <Select value={asset.assetClass} onValueChange={(value) => setAsset({ ...asset, assetClass: value })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="computer_equipment">Computer equipment</SelectItem>
                      <SelectItem value="office_equipment">Office equipment</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="machinery">Machinery</SelectItem>
                      <SelectItem value="building_improvement">Building improvement</SelectItem>
                      <SelectItem value="software">Purchased software</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="asset-date">Placed in service</Label>
                    <Input id="asset-date" className="mt-1.5" type="date" required value={asset.placedInServiceDate} onChange={(event) => setAsset({ ...asset, placedInServiceDate: event.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="asset-cost">Cost ($)</Label>
                    <Input id="asset-cost" className="mt-1.5" type="number" min="0.01" step="0.01" required value={asset.cost} onChange={(event) => setAsset({ ...asset, cost: event.target.value })} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="asset-business-use">Business use (%)</Label>
                  <Input id="asset-business-use" className="mt-1.5" type="number" min="0" max="100" step="0.01" required value={asset.businessUsePercentage} onChange={(event) => setAsset({ ...asset, businessUsePercentage: event.target.value })} />
                </div>
                <Button type="submit" disabled={workspace.saving || !asset.description.trim() || !asset.placedInServiceDate || Number(asset.cost) <= 0} className="w-full bg-accent text-accent-foreground hover:bg-brand-green-dark">
                  {workspace.saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save for review
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {workspace.assets.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground"><Building2 className="mx-auto mb-3 h-10 w-10 opacity-30" /><p>No fixed assets recorded yet.</p></CardContent></Card>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-elegant">
            <table className="w-full min-w-[680px]">
              <thead><tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Asset</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">In service</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Cost</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">Business use</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground">Tax treatment</th>
              </tr></thead>
              <tbody>{workspace.assets.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3"><p className="text-sm font-medium text-foreground">{item.description}</p><p className="text-xs text-muted-foreground">{item.asset_class.replaceAll("_", " ")}</p></td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{new Date(`${item.placed_in_service_date}T00:00:00`).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right text-sm font-medium text-foreground">${Number(item.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-5 py-3 text-right text-sm text-muted-foreground">{Number(item.business_use_percentage)}%</td>
                  <td className="px-5 py-3"><Badge className={item.status === "approved" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>{item.status === "approved" ? item.tax_method || "Approved" : "Reviewer to confirm"}</Badge></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Outputs</h3>
          <p className="text-sm text-muted-foreground">Each output unlocks only after the evidence and review gates pass.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            [Landmark, "Bank reconciliation", "Available after bank feeds or statements are matched"],
            [CircleDollarSign, "Adjusted trial balance", "Generated from balanced journal entries"],
            [FileCheck2, "Financial statements", "Generated after bookkeeping review and reconciliation"],
            [ShieldCheck, "Tax forms & filing report", "Released after accountant and client approval"],
          ].map(([Icon, title, description]) => {
            const ItemIcon = Icon as typeof Landmark;
            return (
              <Card key={String(title)} className="bg-muted/10">
                <CardContent className="p-5">
                  <ItemIcon className="mb-3 h-5 w-5 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">{String(title)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{String(description)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {openQuestions.length === 0 && openDuplicates.length === 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success/5 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div><p className="text-sm font-medium text-foreground">No client actions are outstanding</p><p className="mt-1 text-xs text-muted-foreground">Your preparer may add new questions as evidence is reviewed.</p></div>
        </div>
      )}
    </div>
  );
};

export default TaxWorkspace;
