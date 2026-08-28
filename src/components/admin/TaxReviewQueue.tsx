import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, ClipboardCheck, Loader2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ClarificationQuestion, DuplicateCandidate, taxcenda, TaxEngagement, TaxEntity } from "@/integrations/supabase/taxcenda";

const NEXT_STATUS: Record<string, string | undefined> = {
  collecting: "processing",
  processing: "client_questions",
  client_questions: "bookkeeping_review",
  bookkeeping_review: "reconciled",
  reconciled: "tax_preparation",
  tax_preparation: "accountant_review",
  accountant_review: "client_review",
  client_review: "signature_complete",
  signature_complete: "approved_to_file",
  approved_to_file: "transmitted",
  transmitted: "accepted",
  accepted: "completed",
  rejected: "approved_to_file",
};

const LABELS: Record<string, string> = {
  collecting: "Collecting records",
  processing: "Processing evidence",
  client_questions: "Client questions",
  bookkeeping_review: "Bookkeeping review",
  reconciled: "Reconciled",
  tax_preparation: "Tax preparation",
  accountant_review: "Accountant review",
  client_review: "Client review",
  signature_complete: "Signature complete",
  approved_to_file: "Approved to file",
  transmitted: "Transmitted",
  accepted: "Accepted",
  rejected: "Rejected",
  completed: "Completed",
  amended: "Amended",
};

type ReviewItem = {
  engagement: TaxEngagement;
  entity: TaxEntity | null;
  openQuestions: number;
  openDuplicates: number;
};

const TaxReviewQueue = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const [engagementsResult, entitiesResult, questionsResult, duplicatesResult] = await Promise.all([
      taxcenda.from("tax_engagements").select("*").order("updated_at", { ascending: false }),
      taxcenda.from("tax_entities").select("*").order("legal_name"),
      taxcenda.from("clarification_questions").select("*").in("status", ["open", "answered"]),
      taxcenda.from("duplicate_candidates").select("*").eq("status", "open"),
    ]);

    const error = engagementsResult.error || entitiesResult.error || questionsResult.error || duplicatesResult.error;
    if (error) {
      toast({ title: "Review queue could not be loaded", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const entities = new Map((entitiesResult.data ?? []).map((entity: TaxEntity) => [entity.id, entity]));
    const questions = questionsResult.data ?? [];
    const duplicates = duplicatesResult.data ?? [];

    setItems((engagementsResult.data ?? []).map((engagement: TaxEngagement) => ({
      engagement,
      entity: entities.get(engagement.entity_id) ?? null,
      openQuestions: questions.filter((question: ClarificationQuestion) =>
        question.engagement_id === engagement.id
        && (question.status === "open" || ["high", "blocking"].includes(question.priority)),
      ).length,
      openDuplicates: duplicates.filter((candidate: DuplicateCandidate) => candidate.engagement_id === engagement.id).length,
    })));
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const totals = useMemo(() => ({
    active: items.filter((item) => !["completed", "accepted"].includes(item.engagement.workflow_status)).length,
    blocked: items.filter((item) => item.openQuestions + item.openDuplicates > 0).length,
    review: items.filter((item) => item.engagement.workflow_status === "accountant_review").length,
  }), [items]);

  const advance = async (item: ReviewItem) => {
    const nextStatus = NEXT_STATUS[item.engagement.workflow_status];
    if (!nextStatus) return;
    if (nextStatus === "transmitted") {
      toast({
        title: "Transmission remains locked",
        description: "Connect an approved e-file provider and run final release checks before marking a return transmitted.",
        variant: "destructive",
      });
      return;
    }

    setAdvancing(item.engagement.id);
    const { error } = await taxcenda.rpc("advance_tax_engagement", {
      p_engagement_id: item.engagement.id,
      p_target_status: nextStatus,
      p_reason: `Advanced from the TaxCenda professional review queue to ${nextStatus}`,
    });
    setAdvancing(null);

    if (error) {
      toast({ title: "Workflow gate stopped this change", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: `Moved to ${LABELS[nextStatus] ?? nextStatus}` });
    await loadQueue();
  };

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Professional review queue</h2>
          <p className="mt-1 text-sm text-muted-foreground">AI assists with evidence and exceptions. Licensed staff control every accounting, tax and filing gate.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadQueue}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Active engagements</p><p className="mt-1 text-2xl font-bold text-foreground">{totals.active}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Blocked by questions</p><p className="mt-1 text-2xl font-bold text-warning">{totals.blocked}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Awaiting accountant review</p><p className="mt-1 text-2xl font-bold text-accent">{totals.review}</p></CardContent></Card>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" /><p className="font-medium text-foreground">No tax-year workspaces yet</p><p className="mt-1 text-sm text-muted-foreground">Client workspaces will appear here as they are created.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const nextStatus = NEXT_STATUS[item.engagement.workflow_status];
            const blockers = item.openQuestions + item.openDuplicates;
            const transmissionLocked = nextStatus === "transmitted";
            return (
              <Card key={item.engagement.id} className={blockers ? "border-warning/30" : "border-border"}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{item.entity?.legal_name ?? "Taxpayer"} · {item.engagement.tax_year}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">{item.engagement.current_step}</p>
                    </div>
                    <Badge variant="outline">{LABELS[item.engagement.workflow_status] ?? item.engagement.workflow_status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3"><Progress value={item.engagement.progress} className="h-2" /><span className="w-10 text-right text-xs text-muted-foreground">{item.engagement.progress}%</span></div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {blockers > 0 ? (
                        <Badge className="bg-warning/10 text-warning"><AlertTriangle className="mr-1 h-3 w-3" /> {item.openQuestions} questions · {item.openDuplicates} duplicates</Badge>
                      ) : (
                        <Badge className="bg-success/10 text-success"><CheckCircle2 className="mr-1 h-3 w-3" /> No open evidence blockers</Badge>
                      )}
                    </div>
                    {nextStatus && (
                      <Button
                        size="sm"
                        disabled={Boolean(blockers) || advancing === item.engagement.id}
                        onClick={() => advance(item)}
                        variant={transmissionLocked ? "outline" : "default"}
                        className={transmissionLocked ? "" : "bg-accent text-accent-foreground hover:bg-brand-green-dark"}
                      >
                        {advancing === item.engagement.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {transmissionLocked ? "Configure e-file provider" : `Advance to ${LABELS[nextStatus] ?? nextStatus}`}
                        {!transmissionLocked && <ChevronRight className="ml-1 h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TaxReviewQueue;
