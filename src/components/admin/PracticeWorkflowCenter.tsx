import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Building2,
  CalendarClock,
  FileInput,
  Landmark,
  Loader2,
  Plus,
  ReceiptText,
  RefreshCw,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  ClientInvoice,
  ClientFirmConnection,
  ClientTaxPayment,
  InstitutionDocumentRequest,
  OrganizerItem,
  TaxEngagement,
  TaxFirm,
  taxcenda,
} from "@/integrations/supabase/taxcenda";

type ClientRecord = {
  id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  tax_year: number | null;
};

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
const statusClass = (status: string) =>
  ["paid", "completed", "retrieved"].includes(status)
    ? "bg-success/10 text-success"
    : ["overdue", "failed"].includes(status)
      ? "bg-destructive/10 text-destructive"
      : "bg-warning/10 text-warning";

const PracticeWorkflowCenter = ({ clients }: { clients: ClientRecord[] }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clientId, setClientId] = useState("");
  const [engagement, setEngagement] = useState<TaxEngagement | null>(null);
  const [organizer, setOrganizer] = useState<OrganizerItem[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [payments, setPayments] = useState<ClientTaxPayment[]>([]);
  const [retrievals, setRetrievals] = useState<InstitutionDocumentRequest[]>(
    [],
  );
  const [firms, setFirms] = useState<TaxFirm[]>([]);
  const [firmConnections, setFirmConnections] = useState<
    ClientFirmConnection[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [task, setTask] = useState({
    title: "",
    description: "",
    category: "general",
    itemType: "document",
    dueDate: "",
    required: true,
  });
  const [invoice, setInvoice] = useState({
    description: "Tax preparation services",
    amount: "",
    dueDate: "",
  });
  const [payment, setPayment] = useState({
    authorityType: "federal",
    authorityName: "Internal Revenue Service",
    paymentType: "balance_due",
    amount: "",
    dueDate: "",
    taxPeriod: "",
  });
  const [retrieval, setRetrieval] = useState({
    institutionName: "",
    formType: "W-2",
  });
  const [firm, setFirm] = useState({ name: "", email: "", phone: "" });
  const [selectedFirmId, setSelectedFirmId] = useState("");

  const selectedClient = clients.find((item) => item.id === clientId) ?? null;

  const load = useCallback(async () => {
    if (!selectedClient?.user_id) {
      setEngagement(null);
      setOrganizer([]);
      setInvoices([]);
      setPayments([]);
      setRetrievals([]);
      setFirmConnections([]);
      return;
    }
    setLoading(true);
    const { data: rows, error } = await taxcenda
      .from("tax_engagements")
      .select("*")
      .eq("user_id", selectedClient.user_id)
      .order("tax_year", { ascending: false })
      .limit(1);
    if (error) {
      toast({
        title: "Unable to load client workflow",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    const current = rows?.[0] ?? null;
    setEngagement(current);
    const [
      organizerResult,
      invoiceResult,
      paymentResult,
      retrievalResult,
      firmResult,
      connectionResult,
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
        .eq("user_id", selectedClient.user_id)
        .order("created_at", { ascending: false }),
      current
        ? taxcenda
            .from("tax_payments")
            .select("*")
            .eq("engagement_id", current.id)
            .order("due_date", { ascending: true })
        : Promise.resolve({ data: [] }),
      current
        ? taxcenda
            .from("institution_document_requests")
            .select("*")
            .eq("engagement_id", current.id)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      taxcenda.from("tax_firms").select("*").order("name"),
      current
        ? taxcenda
            .from("client_firm_connections")
            .select("*")
            .eq("entity_id", current.entity_id)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);
    setOrganizer(organizerResult.data ?? []);
    setInvoices(invoiceResult.data ?? []);
    setPayments(paymentResult.data ?? []);
    setRetrievals(retrievalResult.data ?? []);
    setFirms(firmResult.data ?? []);
    setFirmConnections(connectionResult.data ?? []);
    setLoading(false);
  }, [selectedClient?.user_id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const record = async (
    eventType: string,
    title: string,
    detail: string,
    resourceType: string,
    resourceId: string,
  ) => {
    if (!selectedClient?.user_id || !engagement) return;
    await taxcenda.rpc("record_client_activity", {
      p_user_id: selectedClient.user_id,
      p_engagement_id: engagement.id,
      p_event_type: eventType,
      p_title: title,
      p_detail: detail,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
    });
  };

  const createTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedClient?.user_id || !engagement) return;
    setSaving(true);
    const { data, error } = await taxcenda
      .from("organizer_items")
      .insert({
        engagement_id: engagement.id,
        user_id: selectedClient.user_id,
        title: task.title.trim(),
        description: task.description.trim() || null,
        category: task.category,
        item_type: task.itemType,
        required: task.required,
        due_date: task.dueDate || null,
        remind_at: task.dueDate
          ? new Date(
              new Date(`${task.dueDate}T09:00:00Z`).getTime() -
                7 * 24 * 60 * 60 * 1000,
            ).toISOString()
          : null,
        assigned_by: user?.id,
      })
      .select("*")
      .single();
    if (error)
      toast({
        title: "Request was not created",
        description: error.message,
        variant: "destructive",
      });
    else {
      await record(
        "organizer_requested",
        "New organizer request",
        task.title,
        "organizer_item",
        data.id,
      );
      toast({ title: "Organizer request added" });
      setTask({
        title: "",
        description: "",
        category: "general",
        itemType: "document",
        dueDate: "",
        required: true,
      });
    }
    setSaving(false);
    await load();
  };

  const createInvoice = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedClient?.user_id) return;
    setSaving(true);
    const amountCents = Math.round(Number(invoice.amount) * 100);
    const invoiceNumber = `INV-${engagement?.tax_year || new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const { data, error } = await taxcenda
      .from("invoices")
      .insert({
        user_id: selectedClient.user_id,
        engagement_id: engagement?.id ?? null,
        invoice_number: invoiceNumber,
        description: invoice.description.trim(),
        amount_cents: amountCents,
        status: "sent",
        due_date: invoice.dueDate || null,
        issued_at: new Date().toISOString(),
        created_by: user?.id,
      })
      .select("*")
      .single();
    if (error)
      toast({
        title: "Invoice was not created",
        description: error.message,
        variant: "destructive",
      });
    else {
      await record(
        "invoice_issued",
        `Invoice ${invoiceNumber} issued`,
        `${invoice.description} — ${money(amountCents)}`,
        "invoice",
        data.id,
      );
      toast({ title: "Invoice issued" });
      setInvoice({
        description: "Tax preparation services",
        amount: "",
        dueDate: "",
      });
    }
    setSaving(false);
    await load();
  };

  const createTaxPayment = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedClient?.user_id || !engagement) return;
    setSaving(true);
    const amountCents = Math.round(Number(payment.amount) * 100);
    const { data, error } = await taxcenda
      .from("tax_payments")
      .insert({
        engagement_id: engagement.id,
        user_id: selectedClient.user_id,
        authority_type: payment.authorityType,
        authority_name: payment.authorityName.trim(),
        payment_type: payment.paymentType,
        tax_period: payment.taxPeriod || String(engagement.tax_year),
        amount_cents: amountCents,
        due_date: payment.dueDate,
        status: "unpaid",
        created_by: user?.id,
      })
      .select("*")
      .single();
    if (error)
      toast({
        title: "Tax payment was not created",
        description: error.message,
        variant: "destructive",
      });
    else {
      await record(
        "tax_payment_requested",
        `${payment.authorityName} payment due`,
        `${money(amountCents)} due ${payment.dueDate}`,
        "tax_payment",
        data.id,
      );
      toast({ title: "Tax payment added" });
      setPayment({
        authorityType: "federal",
        authorityName: "Internal Revenue Service",
        paymentType: "balance_due",
        amount: "",
        dueDate: "",
        taxPeriod: "",
      });
    }
    setSaving(false);
    await load();
  };

  const createRetrieval = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedClient?.user_id || !engagement) return;
    setSaving(true);
    const { data, error } = await taxcenda
      .from("institution_document_requests")
      .insert({
        engagement_id: engagement.id,
        user_id: selectedClient.user_id,
        institution_name: retrieval.institutionName.trim(),
        form_type: retrieval.formType,
        status: "not_connected",
      })
      .select("*")
      .single();
    if (error)
      toast({
        title: "Retrieval request was not created",
        description: error.message,
        variant: "destructive",
      });
    else {
      await record(
        "institution_document_requested",
        `${retrieval.formType} retrieval requested`,
        retrieval.institutionName,
        "institution_document_request",
        data.id,
      );
      toast({
        title: "Retrieval request queued",
        description:
          "It will remain provider-gated until a supported connection is authorized.",
      });
      setRetrieval({ institutionName: "", formType: "W-2" });
    }
    setSaving(false);
    await load();
  };

  const createFirm = async (event: FormEvent) => {
    event.preventDefault();
    if (!firm.name.trim()) return;
    setSaving(true);
    const { data, error } = await taxcenda
      .from("tax_firms")
      .insert({
        name: firm.name.trim(),
        email: firm.email.trim().toLowerCase() || null,
        phone: firm.phone.trim() || null,
      })
      .select("*")
      .single();
    if (error) {
      toast({
        title: "Firm was not created",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSelectedFirmId(data.id);
      setFirm({ name: "", email: "", phone: "" });
      toast({ title: "Tax firm added" });
    }
    setSaving(false);
    await load();
  };

  const connectFirm = async () => {
    if (!engagement || !selectedClient?.user_id || !selectedFirmId) return;
    setSaving(true);
    const { data, error } = await taxcenda
      .from("client_firm_connections")
      .upsert(
        {
          entity_id: engagement.entity_id,
          owner_user_id: selectedClient.user_id,
          firm_id: selectedFirmId,
          status: "active",
          connected_at: new Date().toISOString(),
          revoked_at: null,
        },
        { onConflict: "entity_id,firm_id" },
      )
      .select("*")
      .single();
    if (error) {
      toast({
        title: "Firm was not connected",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await record(
        "firm_connected",
        "Tax firm access connected",
        firms.find((item) => item.id === selectedFirmId)?.name || "Tax firm",
        "client_firm_connection",
        data.id,
      );
      toast({ title: "Firm connected to the client workspace" });
    }
    setSaving(false);
    await load();
  };

  const verifyTaxPayment = async (item: ClientTaxPayment) => {
    if (!user) return;
    setSaving(true);
    const { error } = await taxcenda
      .from("tax_payments")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        professional_cleared_at: new Date().toISOString(),
        professional_cleared_by: user.id,
      })
      .eq("id", item.id);
    if (error) {
      toast({
        title: "Payment could not be verified",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await record(
        "tax_payment_verified",
        `${item.authority_name} payment verified`,
        money(item.amount_cents),
        "tax_payment",
        item.id,
      );
      toast({ title: "Tax payment verified" });
    }
    setSaving(false);
    await load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">
            Client workflow operations
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage organizers, invoices, tax payments and institution retrieval
            requests.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={!selectedClient}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      <Card>
        <CardContent className="p-5">
          <Label>Client</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="mt-1.5 max-w-lg">
              <SelectValue placeholder="Select a client" />
            </SelectTrigger>
            <SelectContent>
              {clients
                .filter((item) => item.user_id)
                .map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.full_name || item.email || "Client"}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {selectedClient && !engagement && !loading && (
            <p className="mt-3 text-sm text-warning">
              This client needs a tax-year workspace before organizer and
              tax-payment requests can be created.
            </p>
          )}
        </CardContent>
      </Card>
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : selectedClient ? (
        <Tabs defaultValue="organizer" className="space-y-4">
          <TabsList className="h-auto flex-wrap justify-start">
            <TabsTrigger value="organizer">Organizer</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Tax payments</TabsTrigger>
            <TabsTrigger value="retrieval">Retrieval</TabsTrigger>
            <TabsTrigger value="firm-access">Firm access</TabsTrigger>
          </TabsList>
          <TabsContent
            value="organizer"
            className="grid gap-5 xl:grid-cols-[360px_1fr]"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileInput className="h-5 w-5" />
                  Add request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={createTask}>
                  <div>
                    <Label>Request</Label>
                    <Input
                      required
                      className="mt-1.5"
                      value={task.title}
                      onChange={(e) =>
                        setTask({ ...task, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Instructions</Label>
                    <Textarea
                      className="mt-1.5"
                      value={task.description}
                      onChange={(e) =>
                        setTask({ ...task, description: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={task.itemType}
                        onValueChange={(value) =>
                          setTask({ ...task, itemType: value })
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="document">Document</SelectItem>
                          <SelectItem value="question">Question</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                          <SelectItem value="signature">Signature</SelectItem>
                          <SelectItem value="payment">Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Due</Label>
                      <Input
                        type="date"
                        className="mt-1.5"
                        value={task.dueDate}
                        onChange={(e) =>
                          setTask({ ...task, dueDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={saving || !engagement}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add request
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="space-y-3">
              {organizer.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.category} · {item.due_date || "No due date"}
                      </p>
                    </div>
                    <Badge className={statusClass(item.status)}>
                      {item.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent
            value="invoices"
            className="grid gap-5 xl:grid-cols-[360px_1fr]"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ReceiptText className="h-5 w-5" />
                  Issue invoice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={createInvoice}>
                  <div>
                    <Label>Description</Label>
                    <Input
                      required
                      className="mt-1.5"
                      value={invoice.description}
                      onChange={(e) =>
                        setInvoice({ ...invoice, description: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Amount (USD)</Label>
                    <Input
                      required
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="mt-1.5"
                      value={invoice.amount}
                      onChange={(e) =>
                        setInvoice({ ...invoice, amount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Due date</Label>
                    <Input
                      type="date"
                      className="mt-1.5"
                      value={invoice.dueDate}
                      onChange={(e) =>
                        setInvoice({ ...invoice, dueDate: e.target.value })
                      }
                    />
                  </div>
                  <Button type="submit" disabled={saving}>
                    <Plus className="mr-2 h-4 w-4" />
                    Issue invoice
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="space-y-3">
              {invoices.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{item.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {money(item.amount_cents)}
                      </p>
                      <Badge className={statusClass(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent
            value="payments"
            className="grid gap-5 xl:grid-cols-[360px_1fr]"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Landmark className="h-5 w-5" />
                  Add tax payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={createTaxPayment}>
                  <div>
                    <Label>Authority</Label>
                    <Input
                      required
                      className="mt-1.5"
                      value={payment.authorityName}
                      onChange={(e) =>
                        setPayment({
                          ...payment,
                          authorityName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Authority type</Label>
                      <Select
                        value={payment.authorityType}
                        onValueChange={(value) =>
                          setPayment({ ...payment, authorityType: value })
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="federal">Federal</SelectItem>
                          <SelectItem value="state">State</SelectItem>
                          <SelectItem value="local">Local</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Payment type</Label>
                      <Select
                        value={payment.paymentType}
                        onValueChange={(value) =>
                          setPayment({ ...payment, paymentType: value })
                        }
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="balance_due">
                            Balance due
                          </SelectItem>
                          <SelectItem value="estimated">Estimated</SelectItem>
                          <SelectItem value="extension">Extension</SelectItem>
                          <SelectItem value="amended">Amended</SelectItem>
                          <SelectItem value="penalty">Penalty</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Amount (USD)</Label>
                    <Input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-1.5"
                      value={payment.amount}
                      onChange={(e) =>
                        setPayment({ ...payment, amount: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Due date</Label>
                    <Input
                      required
                      type="date"
                      className="mt-1.5"
                      value={payment.dueDate}
                      onChange={(e) =>
                        setPayment({ ...payment, dueDate: e.target.value })
                      }
                    />
                  </div>
                  <Button type="submit" disabled={saving || !engagement}>
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Add payment
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="space-y-3">
              {payments.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{item.authority_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Due {item.due_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {money(item.amount_cents)}
                      </p>
                      <Badge className={statusClass(item.status)}>
                        {item.status}
                      </Badge>
                      {item.client_marked_paid_at &&
                        !item.professional_cleared_at && (
                          <Button
                            size="sm"
                            className="mt-2"
                            onClick={() => verifyTaxPayment(item)}
                            disabled={saving}
                          >
                            Verify payment
                          </Button>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent
            value="retrieval"
            className="grid gap-5 xl:grid-cols-[360px_1fr]"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5" />
                  Request retrieval
                </CardTitle>
                <CardDescription>
                  Creates a provider-gated request; it never asks the client for
                  bank credentials inside TaxCenda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={createRetrieval}>
                  <div>
                    <Label>Institution or employer</Label>
                    <Input
                      required
                      className="mt-1.5"
                      value={retrieval.institutionName}
                      onChange={(e) =>
                        setRetrieval({
                          ...retrieval,
                          institutionName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Form</Label>
                    <Select
                      value={retrieval.formType}
                      onValueChange={(value) =>
                        setRetrieval({ ...retrieval, formType: value })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="W-2">W-2</SelectItem>
                        <SelectItem value="1099">1099</SelectItem>
                        <SelectItem value="1098">1098</SelectItem>
                        <SelectItem value="brokerage statement">
                          Brokerage statement
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={saving || !engagement}>
                    <Plus className="mr-2 h-4 w-4" />
                    Queue request
                  </Button>
                </form>
              </CardContent>
            </Card>
            <div className="space-y-3">
              {retrievals.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{item.institution_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.form_type}
                      </p>
                    </div>
                    <Badge className={statusClass(item.status)}>
                      {item.status.replace(/_/g, " ")}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent
            value="firm-access"
            className="grid gap-5 xl:grid-cols-[360px_1fr]"
          >
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5" /> Add practice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={createFirm}>
                    <div>
                      <Label>Practice name</Label>
                      <Input
                        required
                        className="mt-1.5"
                        value={firm.name}
                        onChange={(event) =>
                          setFirm({ ...firm, name: event.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        className="mt-1.5"
                        value={firm.email}
                        onChange={(event) =>
                          setFirm({ ...firm, email: event.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        className="mt-1.5"
                        value={firm.phone}
                        onChange={(event) =>
                          setFirm({ ...firm, phone: event.target.value })
                        }
                      />
                    </div>
                    <Button type="submit" disabled={saving}>
                      <Plus className="mr-2 h-4 w-4" /> Add practice
                    </Button>
                  </form>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Connect client</CardTitle>
                  <CardDescription>
                    The client retains ownership and can revoke this connection.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={selectedFirmId}
                    onValueChange={setSelectedFirmId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tax firm" />
                    </SelectTrigger>
                    <SelectContent>
                      {firms.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    onClick={connectFirm}
                    disabled={saving || !selectedFirmId || !engagement}
                  >
                    Connect firm
                  </Button>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-3">
              {firmConnections.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    No firm connections for this client.
                  </CardContent>
                </Card>
              ) : (
                firmConnections.map((connection) => (
                  <Card key={connection.id}>
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="font-medium">
                          {firms.find((item) => item.id === connection.firm_id)
                            ?.name || "Tax firm"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Connected{" "}
                          {connection.connected_at
                            ? new Date(
                                connection.connected_at,
                              ).toLocaleDateString()
                            : "pending"}
                        </p>
                      </div>
                      <Badge className={statusClass(connection.status)}>
                        {connection.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center text-muted-foreground">
            <Users className="mb-3 h-10 w-10 opacity-40" />
            <p>Select a client to manage their workflow.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PracticeWorkflowCenter;
