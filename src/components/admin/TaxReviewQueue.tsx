import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, ClipboardCheck, Loader2, RefreshCw, CalendarClock, Search, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ClarificationQuestion, DuplicateCandidate, taxcenda, TaxEngagement, TaxEntity } from "@/integrations/supabase/taxcenda";
import { useAuth } from "@/contexts/AuthContext";
import { daysUntilDate, getBlockingCount, reviewQueueItems, reviewQueueSummary, type ReviewQueueFilter, type ReviewQueueItem } from "@/lib/reviewQueue";

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

const TaxReviewQueue = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReviewQueueFilter>("all");
  const [search, setSearch] = useState("");
  // Deadline comparisons are by calendar date, not a claimed statutory filing time.
  const today = new Date().toISOString().slice(0, 10);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [engagementsResult, entitiesResult, questionsResult, duplicatesResult] = await Promise.all([
      taxcenda.from("tax_engagements").select("*").order("updated_at", { ascending: false }),
      taxcenda.from("tax_entities").select("*").order("legal_name"),
      taxcenda.from("clarification_questions").select("*").in("status", ["open", "answered"]),
      taxcenda.from("duplicate_candidates").select("*").eq("status", "open"),
    ]);

    const error = engagementsResult.error || entitiesResult.error || questionsResult.error || duplicatesResult.error;
    if (error) {
      toast({ title: "Review queue could not be loaded", description: error.message, variant: "destructive" });
      setLoadError(error.message);
      setItems([]);
      setLoading(false);
      return;
    }

    const entities = new Map((entitiesResult.data ?? []).map((entity: TaxEntity) => [entity.id, entity]));
    const questionsByEngagement = new Map<string, { open: number; answers: number; blocking: number }>();
    for (const question of (questionsResult.data ?? []) as ClarificationQuestion[]) {
      const current = questionsByEngagement.get(question.engagement_id) ?? { open: 0, answers: 0, blocking: 0 };
      if (question.status === "open") current.open++;
      if (question.status === "answered") current.answers++;
      if (["high", "blocking"].includes(question.priority)) current.blocking++;
      questionsByEngagement.set(question.engagement_id, current);
    }
    const duplicatesByEngagement = new Map<string, number>();
    for (const candidate of (duplicatesResult.data ?? []) as DuplicateCandidate[]) {
      duplicatesByEngagement.set(candidate.engagement_id, (duplicatesByEngagement.get(candidate.engagement_id) ?? 0) + 1);
    }
    setItems((engagementsResult.data ?? []).map((engagement: TaxEngagement): ReviewQueueItem => {
      const counts = questionsByEngagement.get(engagement.id);
      return {
        engagement,
        entity: entities.get(engagement.entity_id) ?? null,
        openQuestions: counts?.open ?? 0,
        pendingAnswers: counts?.answers ?? 0,
        blockingQuestions: counts?.blocking ?? 0,
        openDuplicates: duplicatesByEngagement.get(engagement.id) ?? 0,
      };
    }));
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const totals = useMemo(() => reviewQueueSummary(items, today), [items, today]);
  const visibleItems = useMemo(() => reviewQueueItems(items, filter, search, today), [items, filter, search, today]);

  const advance = async (item: ReviewQueueItem) => {
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
    return <div className="flex justify-center py-24" aria-live="polite"><Loader2 aria-label="Loading professional review queue" className="h-8 w-8 animate-spin text-accent" /></div>;
  }

  if (loadError) {
    return (
      <Card className="border-destructive/40"><CardContent className="space-y-3 p-6">
        <h2 className="text-lg font-semibold text-foreground">Review queue unavailable</h2>
        <p role="alert" className="text-sm text-muted-foreground">{loadError}</p>
        <Button variant="outline" onClick={loadQueue}><RefreshCw className="mr-2 h-4 w-4" /> Retry</Button>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">Professional review queue</h2>
          <p className="mt-1 text-sm text-muted-foreground">AI assists with evidence and exceptions. Licensed staff control every accounting, tax and filing gate.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadQueue} disabled={advancing !== null}><RefreshCw className="mr-2 h-4 w-4" /> Refresh</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Active engagements</p><p className="mt-1 text-2xl font-bold text-foreground">{totals.active}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">With blocking issues</p><p className="mt-1 text-2xl font-bold text-warning">{totals.blocked}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Awaiting accountant review</p><p className="mt-1 text-2xl font-bold text-accent">{totals.review}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-xs text-muted-foreground">Past recorded due date</p><p className="mt-1 text-2xl font-bold text-foreground">{totals.overdue}</p></CardContent></Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={event => setSearch(event.target.value)} aria-label="Search taxpayer name, tax year or workflow status" placeholder="Search taxpayer, tax year or status…" className="pl-9" />
        </div>
        <Select value={filter} onValueChange={value => setFilter(value as ReviewQueueFilter)}>
          <SelectTrigger aria-label="Filter professional review queue" className="w-full sm:w-56"><SelectValue placeholder="Filter work" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All engagements</SelectItem>
            <SelectItem value="blocked">Blocking issues</SelectItem>
            <SelectItem value="review">Accountant review</SelectItem>
            <SelectItem value="due">Due in 7 days / overdue</SelectItem>
            <SelectItem value="provider">Provider / rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p aria-live="polite" className="text-xs text-muted-foreground">
        Showing {visibleItems.length} of {items.length} engagements · due dates are recorded case dates, not independently verified statutory deadlines
      </p>

      {items.length === 0 ? (
        <Card><CardContent className="p-12 text-center"><ClipboardCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" /><p className="font-medium text-foreground">No tax-year workspaces yet</p><p className="mt-1 text-sm text-muted-foreground">Client workspaces will appear here as they are created.</p></CardContent></Card>
      ) : visibleItems.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">No engagements match this search or filter.</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {visibleItems.map((item) => {
            const nextStatus = NEXT_STATUS[item.engagement.workflow_status];
            const blockers = getBlockingCount(item);
            const daysRemaining = daysUntilDate(item.engagement.due_date, today);
            const transmissionLocked = nextStatus === "transmitted";
            return (
              <Card key={item.engagement.id} className={blockers ? "border-warning/30" : "border-border"}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{item.entity?.legal_name ?? "Taxpayer"} · {item.engagement.tax_year}</CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">{item.engagement.current_step}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {daysRemaining !== null && item.engagement.workflow_status !== "completed" && daysRemaining < 0 && (
                        <Badge className="bg-destructive/10 text-destructive border-destructive/30">Past due date</Badge>
                      )}
                      <Badge variant="outline">{LABELS[item.engagement.workflow_status] ?? item.engagement.workflow_status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3"><Progress aria-label="Recorded engagement progress" value={item.engagement.progress} className="h-2" /><span className="w-10 text-right text-xs text-muted-foreground">{item.engagement.progress}%</span></div>
                  <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                    <span className="flex items-center gap-2"><CalendarClock aria-hidden="true" className="h-4 w-4" />
                      {item.engagement.due_date ? `Due ${item.engagement.due_date}` : "No due date recorded"}
                    </span>
                    <span className="flex items-center gap-2"><UserRound aria-hidden="true" className="h-4 w-4" />
                      Preparer: {item.engagement.assigned_preparer ? (item.engagement.assigned_preparer === user?.id ? "You" : "Assigned") : "Unassigned"}
                      {" · "} Reviewer: {item.engagement.assigned_reviewer ? (item.engagement.assigned_reviewer === user?.id ? "You" : "Assigned") : "Unassigned"}
                    </span>
                    <span>Updated {new Date(item.engagement.updated_at).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      {blockers > 0 ? (
                        <Badge className="bg-warning/10 text-warning"><AlertTriangle className="mr-1 h-3 w-3" /> {item.blockingQuestions} high/blocking questions · {item.openDuplicates} duplicates</Badge>
                      ) : (
                        <Badge variant="outline"><CheckCircle2 className="mr-1 h-3 w-3" /> No recorded filing-gate blockers</Badge>
                      )}
                    </div>
                    {item.openQuestions > 0 && <Badge variant="outline">{item.openQuestions} open client questions</Badge>}
                    {item.pendingAnswers > 0 && <Badge variant="outline">{item.pendingAnswers} answers awaiting professional review</Badge>}
                    {item.engagement.workflow_status === "transmitted" && (
                      <Badge variant="outline">Awaiting provider-verified acceptance or rejection</Badge>
                    )}
                    {transmissionLocked && (
                      <Badge variant="outline">E-file provider integration required</Badge>
                    )}
                    {nextStatus && !transmissionLocked && (
                      ["client_review", "signature_complete", "approved_to_file", "completed"].includes(nextStatus) ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" disabled={Boolean(blockers) || advancing === item.engagement.id}>
                              Review transition <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Move to {LABELS[nextStatus] ?? nextStatus}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Confirm that the evidence and professional review requirements for this step are satisfied.
                                This action does not transmit a return or prove IRS acceptance. Database workflow gates remain authoritative.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => advance(item)}>
                                Confirm review transition
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button size="sm" disabled={Boolean(blockers) || advancing === item.engagement.id}
                          onClick={() => advance(item)} className="bg-accent text-accent-foreground hover:bg-brand-green-dark">
                          {advancing === item.engagement.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Advance to {LABELS[nextStatus] ?? nextStatus}<ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      )
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
