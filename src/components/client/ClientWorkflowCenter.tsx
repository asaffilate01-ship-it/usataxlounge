import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileInput,
  Landmark,
  Laptop,
  Loader2,
  MailPlus,
  MessageSquare,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ActivityEvent,
  ClientFirmConnection,
  ClientInvoice,
  ClientTaxPayment,
  DeviceSession,
  HouseholdAccess,
  InstitutionDocumentRequest,
  OrganizerItem,
  TaxFirm,
  TaxEngagement,
  taxcenda,
} from "@/integrations/supabase/taxcenda";

const formatMoney = (cents: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);

const statusClass = (status: string) => {
  if (
    ["completed", "submitted", "paid", "retrieved", "active"].includes(status)
  )
    return "bg-success/10 text-success border-success/20";
  if (["overdue", "failed", "revoked", "expired"].includes(status))
    return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-warning/10 text-warning border-warning/20";
};

const dateLabel = (value?: string | null) =>
  value
    ? new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString()
    : "No date set";

type WorkflowMessageContext = { type: string; id: string; subject: string };

const ClientWorkflowCenter = ({
  canMessage,
  onSendContextMessage,
}: {
  canMessage: boolean;
  onSendContextMessage: (
    content: string,
    context: WorkflowMessageContext,
  ) => Promise<unknown>;
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [engagement, setEngagement] = useState<TaxEngagement | null>(null);
  const [organizer, setOrganizer] = useState<OrganizerItem[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [payments, setPayments] = useState<ClientTaxPayment[]>([]);
  const [sharing, setSharing] = useState<HouseholdAccess[]>([]);
  const [firmConnections, setFirmConnections] = useState<
    ClientFirmConnection[]
  >([]);
  const [firms, setFirms] = useState<TaxFirm[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [retrievals, setRetrievals] = useState<InstitutionDocumentRequest[]>(
    [],
  );
  const [invite, setInvite] = useState({
    email: "",
    relationship: "spouse",
    accessLevel: "collaborate",
  });
  const [messageContext, setMessageContext] =
    useState<WorkflowMessageContext | null>(null);
  const [messageText, setMessageText] = useState("");

  const registerDevice = useCallback(async () => {
    if (!user) return;
    const storageKey = "taxcenda_device_key";
    let deviceKey = localStorage.getItem(storageKey);
    if (!deviceKey) {
      deviceKey = crypto.randomUUID();
      localStorage.setItem(storageKey, deviceKey);
    }
    const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    const browser = /Edg/i.test(navigator.userAgent)
      ? "Edge"
      : /Firefox/i.test(navigator.userAgent)
        ? "Firefox"
        : /Safari/i.test(navigator.userAgent) &&
            !/Chrome/i.test(navigator.userAgent)
          ? "Safari"
          : "Chrome";
    const { data, error } = await taxcenda.rpc("register_device_session", {
      p_device_key: deviceKey,
      p_device_label: mobile ? "Mobile device" : "Web browser",
      p_platform: navigator.platform || (mobile ? "Mobile" : "Web"),
      p_browser: browser,
    });
    if (error) throw error;
    if (data?.[0]?.is_revoked) {
      await supabase.auth.signOut();
      throw new Error(
        "This device session was revoked. Sign in again from a trusted device.",
      );
    }
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      await registerDevice();
    } catch (error) {
      toast({
        title: "Device session unavailable",
        description: (error as Error).message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    const sharingResult = await taxcenda
      .from("household_access")
      .select("*")
      .order("created_at", { ascending: false });
    const shareRows = sharingResult.data ?? [];
    setSharing(shareRows);

    let { data: engagementRows, error: engagementError } = await taxcenda
      .from("tax_engagements")
      .select("*")
      .eq("user_id", user.id)
      .order("tax_year", { ascending: false })
      .limit(1);
    if (!engagementRows?.length) {
      const delegatedEntityIds = shareRows
        .filter(
          (item) =>
            item.delegate_user_id === user.id && item.status === "active",
        )
        .map((item) => item.entity_id);
      if (delegatedEntityIds.length) {
        const delegated = await taxcenda
          .from("tax_engagements")
          .select("*")
          .in("entity_id", delegatedEntityIds)
          .order("tax_year", { ascending: false })
          .limit(1);
        engagementRows = delegated.data;
        engagementError = delegated.error;
      }
    }
    if (engagementError) {
      toast({
        title: "Unable to load client workflow",
        description: engagementError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    const current = engagementRows?.[0] ?? null;
    const workspaceOwnerId = current?.user_id ?? user.id;
    setEngagement(current);
    const [
      organizerResult,
      invoiceResult,
      paymentResult,
      firmConnectionResult,
      activityResult,
      devicesResult,
      retrievalResult,
    ] = await Promise.all([
      current
        ? taxcenda
            .from("organizer_items")
            .select("*")
            .eq("engagement_id", current.id)
            .order("due_date", { ascending: true })
        : Promise.resolve({ data: [] }),
      taxcenda
        .from("invoices")
        .select("*")
        .eq("user_id", workspaceOwnerId)
        .order("created_at", { ascending: false }),
      current
        ? taxcenda
            .from("tax_payments")
            .select("*")
            .eq("engagement_id", current.id)
            .order("due_date", { ascending: true })
        : Promise.resolve({ data: [] }),
      current?.user_id === user.id
        ? taxcenda
            .from("client_firm_connections")
            .select("*")
            .eq("owner_user_id", user.id)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      taxcenda
        .from("activity_events")
        .select("*")
        .eq("user_id", workspaceOwnerId)
        .order("created_at", { ascending: false })
        .limit(100),
      taxcenda
        .from("device_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("last_seen_at", { ascending: false }),
      current
        ? taxcenda
            .from("institution_document_requests")
            .select("*")
            .eq("engagement_id", current.id)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);
    setOrganizer(organizerResult.data ?? []);
    setInvoices(invoiceResult.data ?? []);
    setPayments(paymentResult.data ?? []);
    setFirmConnections(firmConnectionResult.data ?? []);
    const activeFirmIds = (firmConnectionResult.data ?? [])
      .filter((item) => item.status === "active")
      .map((item) => item.firm_id);
    if (activeFirmIds.length) {
      const { data: firmRows } = await taxcenda
        .from("tax_firms")
        .select("*")
        .in("id", activeFirmIds);
      setFirms(firmRows ?? []);
    } else {
      setFirms([]);
    }
    setActivity(activityResult.data ?? []);
    setDevices(devicesResult.data ?? []);
    setRetrievals(retrievalResult.data ?? []);
    setLoading(false);
  }, [registerDevice, toast, user]);

  useEffect(() => {
    load();
  }, [load]);

  const completion = useMemo(() => {
    const required = organizer.filter((item) => item.required);
    if (!required.length) return 0;
    return Math.round(
      (required.filter((item) =>
        ["submitted", "completed", "waived"].includes(item.status),
      ).length /
        required.length) *
        100,
    );
  }, [organizer]);

  const completeItem = async (item: OrganizerItem) => {
    setBusyId(item.id);
    const { error } = await taxcenda.rpc("complete_organizer_item", {
      p_item_id: item.id,
      p_note: "Submitted from the client organizer",
    });
    if (error)
      toast({
        title: "Item was not submitted",
        description: error.message,
        variant: "destructive",
      });
    else {
      await taxcenda.rpc("record_client_activity", {
        p_user_id: item.user_id,
        p_engagement_id: item.engagement_id,
        p_event_type: "organizer_submitted",
        p_title: `${item.title} submitted`,
        p_resource_type: "organizer_item",
        p_resource_id: item.id,
      });
      toast({ title: "Sent for professional review" });
    }
    setBusyId(null);
    await load();
  };

  const payInvoice = async (invoice: ClientInvoice) => {
    setBusyId(invoice.id);
    const { data, error } = await supabase.functions.invoke(
      "create-invoice-payment",
      { body: { invoiceId: invoice.id } },
    );
    if (error || !data?.url) {
      toast({
        title: "Payment could not be started",
        description:
          data?.error ||
          error?.message ||
          "The payment provider is not configured.",
        variant: "destructive",
      });
      setBusyId(null);
      return;
    }
    window.location.assign(data.url);
  };

  const markPaymentPaid = async (payment: ClientTaxPayment) => {
    setBusyId(payment.id);
    const { error } = await taxcenda.rpc("mark_tax_payment_paid", {
      p_payment_id: payment.id,
    });
    if (error)
      toast({
        title: "Payment status was not changed",
        description: error.message,
        variant: "destructive",
      });
    else {
      await taxcenda.rpc("record_client_activity", {
        p_user_id: user!.id,
        p_engagement_id: payment.engagement_id,
        p_event_type: "tax_payment_client_confirmed",
        p_title: `${payment.authority_name} payment reported paid`,
        p_resource_type: "tax_payment",
        p_resource_id: payment.id,
      });
      toast({
        title: "Payment sent for verification",
        description: "Your tax professional can verify the confirmation.",
      });
    }
    setBusyId(null);
    await load();
  };

  const createInvite = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !engagement || !invite.email.trim()) return;
    setBusyId("invite");
    const { data: createdInvite, error } = await taxcenda
      .from("household_access")
      .insert({
        entity_id: engagement.entity_id,
        owner_user_id: user.id,
        invited_email: invite.email.trim().toLowerCase(),
        relationship: invite.relationship,
        access_level: invite.accessLevel,
      })
      .select("*")
      .single();
    if (error)
      toast({
        title: "Invitation was not created",
        description: error.message,
        variant: "destructive",
      });
    else {
      const { error: deliveryError } = await supabase.functions.invoke(
        "send-household-invite",
        { body: { inviteId: createdInvite.id } },
      );
      await taxcenda.rpc("record_client_activity", {
        p_user_id: user.id,
        p_engagement_id: engagement.id,
        p_event_type: "household_invited",
        p_title: "Household access invited",
        p_detail: `${createdInvite.relationship} access invited`,
        p_resource_type: "household_access",
        p_resource_id: createdInvite.id,
      });
      toast({
        title: deliveryError ? "Invitation created" : "Secure invitation sent",
        description: deliveryError
          ? "Email delivery is not configured; the recipient can still accept after signing in with this email address."
          : "The recipient can accept after signing in with this email address.",
      });
      setInvite({
        email: "",
        relationship: "spouse",
        accessLevel: "collaborate",
      });
    }
    setBusyId(null);
    await load();
  };

  const acceptInvite = async (id: string) => {
    setBusyId(id);
    const { error } = await taxcenda.rpc("accept_household_invite", {
      p_invite_id: id,
    });
    if (error)
      toast({
        title: "Invitation was not accepted",
        description: error.message,
        variant: "destructive",
      });
    else toast({ title: "Access accepted" });
    setBusyId(null);
    await load();
  };

  const revokeAccess = async (item: HouseholdAccess) => {
    setBusyId(item.id);
    const { error } = await taxcenda
      .from("household_access")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", item.id);
    if (error)
      toast({
        title: "Access was not revoked",
        description: error.message,
        variant: "destructive",
      });
    else toast({ title: "Access revoked" });
    setBusyId(null);
    await load();
  };

  const revokeFirmConnection = async (id: string) => {
    setBusyId(id);
    const { error } = await taxcenda.rpc("revoke_firm_connection", {
      p_connection_id: id,
    });
    if (error) {
      toast({
        title: "Firm access was not revoked",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Firm access revoked" });
    }
    setBusyId(null);
    await load();
  };

  const revokeDevice = async (id: string) => {
    setBusyId(id);
    const { error } = await taxcenda.rpc("revoke_device_session", {
      p_session_id: id,
    });
    if (error)
      toast({
        title: "Device was not revoked",
        description: error.message,
        variant: "destructive",
      });
    else toast({ title: "Device session revoked" });
    setBusyId(null);
    await load();
  };

  const sendContextMessage = async () => {
    if (!messageContext || !messageText.trim()) return;
    setBusyId("context-message");
    const error = await onSendContextMessage(
      messageText.trim(),
      messageContext,
    );
    if (error) {
      toast({
        title: "Message was not sent",
        description: (error as { message?: string }).message || "Try again.",
        variant: "destructive",
      });
    } else {
      toast({ title: "Message sent with this item attached as context" });
      setMessageText("");
      setMessageContext(null);
    }
    setBusyId(null);
  };

  const contextButton = (context: WorkflowMessageContext) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={!canMessage}
      onClick={() => setMessageContext(context)}
    >
      <MessageSquare className="mr-2 h-4 w-4" /> Ask a question
    </Button>
  );

  const ownedShares = sharing.filter((item) => item.owner_user_id === user?.id);
  const incomingShares = sharing.filter(
    (item) => item.owner_user_id !== user?.id,
  );

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  if (!engagement)
    return (
      <div className="space-y-4">
        {incomingShares
          .filter((item) => item.status === "pending")
          .map((item) => (
            <Card key={item.id} className="border-accent/30">
              <CardHeader>
                <CardTitle>Tax workspace invitation</CardTitle>
                <CardDescription>
                  You were invited as a {item.relationship} with{" "}
                  {item.access_level} access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => acceptInvite(item.id)}
                  disabled={busyId === item.id}
                >
                  Accept secure access
                </Button>
              </CardContent>
            </Card>
          ))}
        <Card>
          <CardHeader>
            <CardTitle>Workflow centre</CardTitle>
            <CardDescription>
              Create your tax-year workspace or accept an invitation above.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  const outstandingInvoices = invoices.filter(
    (item) => !["paid", "void", "refunded"].includes(item.status),
  );
  const duePayments = payments.filter(
    (item) => !["paid", "cancelled"].includes(item.status),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Client workflow centre
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything requested, due, shared and paid for tax year{" "}
            {engagement.tax_year}.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Organizer complete
              </span>
              <FileInput className="h-4 w-4 text-accent" />
            </div>
            <p className="mt-2 text-2xl font-bold">{completion}%</p>
            <Progress value={completion} className="mt-3 h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Invoices due
              </span>
              <ReceiptText className="h-4 w-4 text-warning" />
            </div>
            <p className="mt-2 text-2xl font-bold">
              {outstandingInvoices.length}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatMoney(
                outstandingInvoices.reduce(
                  (sum, item) => sum + item.amount_cents,
                  0,
                ),
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Tax payments due
              </span>
              <Landmark className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-2 text-2xl font-bold">{duePayments.length}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Federal, state and local
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="organizer" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="organizer">Organizer</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Tax payments</TabsTrigger>
          <TabsTrigger value="retrieval">Document retrieval</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="organizer" className="space-y-3">
          {organizer.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Your tax professional has not requested anything yet.
              </CardContent>
            </Card>
          ) : (
            organizer.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {["submitted", "completed", "waived"].includes(
                        item.status,
                      ) ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Clock3 className="h-5 w-5 text-warning" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">
                          {item.title}
                        </p>
                        {item.required && (
                          <Badge variant="outline">Required</Badge>
                        )}
                        <Badge className={statusClass(item.status)}>
                          {item.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        Due {dateLabel(item.due_date)} ·{" "}
                        {item.category.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                  {!["submitted", "completed", "waived"].includes(
                    item.status,
                  ) && (
                    <div className="flex flex-wrap gap-2">
                      {contextButton({
                        type: "organizer_item",
                        id: item.id,
                        subject: item.title,
                      })}
                      <Button
                        size="sm"
                        onClick={() => completeItem(item)}
                        disabled={busyId === item.id}
                      >
                        {busyId === item.id && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Submit for review
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-3">
          {invoices.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No invoices have been issued.
              </CardContent>
            </Card>
          ) : (
            invoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">
                        Invoice {invoice.invoice_number}
                      </p>
                      <Badge className={statusClass(invoice.status)}>
                        {invoice.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {invoice.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Due {dateLabel(invoice.due_date)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xl font-bold">
                      {formatMoney(invoice.amount_cents, invoice.currency)}
                    </p>
                    {!["paid", "void", "refunded"].includes(invoice.status) && (
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => payInvoice(invoice)}
                        disabled={busyId === invoice.id}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay by card or ACH
                      </Button>
                    )}
                    {contextButton({
                      type: "invoice",
                      id: invoice.id,
                      subject: `Invoice ${invoice.invoice_number}`,
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-3">
          <p className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs text-muted-foreground">
            TaxCenda never moves tax money until an approved payment provider is
            configured. You can use the official authority method and record the
            confirmation here.
          </p>
          {payments.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No tax-payment vouchers have been issued.
              </CardContent>
            </Card>
          ) : (
            payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{payment.authority_name}</p>
                      <Badge variant="outline">{payment.authority_type}</Badge>
                      <Badge className={statusClass(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {payment.payment_type.replace(/_/g, " ")} ·{" "}
                      {payment.tax_period}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Due {dateLabel(payment.due_date)}
                      {payment.confirmation_number
                        ? ` · Confirmation ${payment.confirmation_number}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xl font-bold">
                      {formatMoney(payment.amount_cents)}
                    </p>
                    {!["paid", "cancelled"].includes(payment.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => markPaymentPaid(payment)}
                        disabled={busyId === payment.id}
                      >
                        I paid this externally
                      </Button>
                    )}
                    {contextButton({
                      type: "tax_payment",
                      id: payment.id,
                      subject: `${payment.authority_name} payment`,
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="retrieval" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-accent" />
                Institution document retrieval
              </CardTitle>
              <CardDescription>
                Automatic W-2, 1099 and 1098 retrieval is provider-gated.
                TaxCenda stores only provider references—not financial
                credentials.
              </CardDescription>
            </CardHeader>
          </Card>
          {retrievals.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No institution retrieval requests yet.
              </CardContent>
            </Card>
          ) : (
            retrievals.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-medium">{item.institution_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.form_type}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Badge className={statusClass(item.status)}>
                      {item.status.replace(/_/g, " ")}
                    </Badge>
                    {contextButton({
                      type: "institution_document_request",
                      id: item.id,
                      subject: `${item.form_type} retrieval from ${item.institution_name}`,
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sharing" className="space-y-5">
          {engagement.user_id === user?.id && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5 text-accent" />
                    Tax firm access
                  </CardTitle>
                  <CardDescription>
                    Your records remain in your workspace when you change firms.
                    A connected firm can access them only while this connection
                    is active.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {firmConnections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No tax firm has been connected to this workspace.
                    </p>
                  ) : (
                    firmConnections.map((connection) => {
                      const firm = firms.find(
                        (item) => item.id === connection.firm_id,
                      );
                      return (
                        <div
                          key={connection.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"
                        >
                          <div>
                            <p className="font-medium">
                              {firm?.name || "Tax firm"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {firm?.email ||
                                "Firm contact available through secure messages"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={statusClass(connection.status)}>
                              {connection.status}
                            </Badge>
                            {connection.status === "active" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  revokeFirmConnection(connection.id)
                                }
                                disabled={busyId === connection.id}
                              >
                                Revoke
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-accent" />
                    Household and delegated access
                  </CardTitle>
                  <CardDescription>
                    Invite a spouse, partner or trusted helper. You remain the
                    record owner and can revoke access.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={createInvite}
                    className="grid gap-4 md:grid-cols-[1fr_180px_180px_auto]"
                  >
                    <div>
                      <Label>Email</Label>
                      <Input
                        className="mt-1.5"
                        type="email"
                        required
                        value={invite.email}
                        onChange={(event) =>
                          setInvite({ ...invite, email: event.target.value })
                        }
                        placeholder="person@example.com"
                      />
                    </div>
                    <div>
                      <Label>Relationship</Label>
                      <Select
                        value={invite.relationship}
                        onValueChange={(value) =>
                          setInvite({ ...invite, relationship: value })
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="partner">Partner</SelectItem>
                          <SelectItem value="dependent">Dependent</SelectItem>
                          <SelectItem value="assistant">Assistant</SelectItem>
                          <SelectItem value="advisor">Advisor</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Access</Label>
                      <Select
                        value={invite.accessLevel}
                        onValueChange={(value) =>
                          setInvite({ ...invite, accessLevel: value })
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="upload">
                            View and upload
                          </SelectItem>
                          <SelectItem value="collaborate">
                            Collaborate
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="submit"
                      className="self-end"
                      disabled={busyId === "invite"}
                    >
                      <MailPlus className="mr-2 h-4 w-4" />
                      Invite
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </>
          )}
          {incomingShares
            .filter((item) => item.status === "pending")
            .map((item) => (
              <Card key={item.id} className="border-accent/30">
                <CardContent className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="font-medium">Invitation to collaborate</p>
                    <p className="text-sm text-muted-foreground">
                      {item.relationship} · {item.access_level} access
                    </p>
                  </div>
                  <Button
                    onClick={() => acceptInvite(item.id)}
                    disabled={busyId === item.id}
                  >
                    Accept
                  </Button>
                </CardContent>
              </Card>
            ))}
          {ownedShares.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-medium">{item.invited_email}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.relationship} · {item.access_level}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusClass(item.status)}>
                    {item.status}
                  </Badge>
                  {!["revoked", "expired"].includes(item.status) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => revokeAccess(item)}
                      disabled={busyId === item.id}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="activity" className="space-y-3">
          {activity.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Activity will appear as your engagement progresses.
              </CardContent>
            </Card>
          ) : (
            activity.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex gap-3 p-4">
                  <Activity className="mt-0.5 h-4 w-4 text-accent" />
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    {item.detail && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.detail}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-accent" />
                Device activity
              </CardTitle>
              <CardDescription>
                Review devices that accessed your account and revoke anything
                you do not recognize.
              </CardDescription>
            </CardHeader>
          </Card>
          {devices.map((device) => (
            <Card key={device.id}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  {/mobile/i.test(device.device_label) ? (
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Laptop className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">{device.device_label}</p>
                    <p className="text-sm text-muted-foreground">
                      {device.browser || "Browser"} ·{" "}
                      {device.platform || "Unknown platform"} · Last seen{" "}
                      {new Date(device.last_seen_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {device.revoked_at ? (
                  <Badge variant="outline">Revoked</Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeDevice(device.id)}
                    disabled={busyId === device.id}
                  >
                    Revoke
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
      <Dialog
        open={!!messageContext}
        onOpenChange={(open) => !open && setMessageContext(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask about {messageContext?.subject}</DialogTitle>
            <DialogDescription>
              This conversation will stay linked to the selected workflow item.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={messageText}
            onChange={(event) => setMessageText(event.target.value)}
            placeholder="Type your question…"
            rows={5}
          />
          <DialogFooter>
            <Button
              onClick={sendContextMessage}
              disabled={!messageText.trim() || busyId === "context-message"}
            >
              {busyId === "context-message" && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send securely
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientWorkflowCenter;
