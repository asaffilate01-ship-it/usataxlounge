import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  FolderOpen,
  DollarSign,
  MessageSquare,
  Download,
  PenLine,
  LogOut,
  Plus,
  Settings,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Paperclip,
  File,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useIncomeExpenses } from "@/hooks/useIncomeExpenses";
import { useFilings } from "@/hooks/useFilings";
import { usePresence } from "@/hooks/usePresence";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import NotificationDropdown from "@/components/client/NotificationDropdown";
import ProfileSettings from "@/components/client/ProfileSettings";
import ExportButtons from "@/components/client/ExportButtons";
import OnboardingQuestionnaire from "@/components/client/OnboardingQuestionnaire";
import { useMessages } from "@/hooks/useMessages";
import { supabase } from "@/integrations/supabase/client";
import DocumentsSection from "@/components/admin/DocumentsSection";
import ClientESignSection from "@/components/client/ClientESignSection";
import MFASettings from "@/components/client/MFASettings";
import ReceiptScanner from "@/components/client/ReceiptScanner";
import DashboardCharts from "@/components/client/DashboardCharts";
import { useInactivityTimeout } from "@/hooks/useInactivityTimeout";
import MFASettings from "@/components/client/MFASettings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const statusIcon = (status: string) => {
  switch (status) {
    case "filed":
    case "accepted": return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "in_review":
    case "submitted":
    case "pending": return <Clock className="h-4 w-4 text-warning" />;
    default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const MessageTicks = ({ status }: { status: "sending" | "sent" | "delivered" | "read" }) => {
  if (status === "sending") {
    return <Clock className="h-3 w-3 text-muted-foreground/40 shrink-0" />;
  }
  const tickClass = status === "read" ? "text-accent" : "text-muted-foreground/60";
  if (status === "sent") {
    return (
      <svg viewBox="0 0 16 11" className={`h-3.5 w-4 ${tickClass} shrink-0`}>
        <path fill="currentColor" d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178L6.044 6.36 3.614 3.98a.457.457 0 0 0-.686 0 .48.48 0 0 0 0 .673l2.74 2.682a.474.474 0 0 0 .686-.017L11.128 1.31a.48.48 0 0 0-.057-.657Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 11" className={`h-3.5 w-4 ${tickClass} shrink-0`}>
      <path fill="currentColor" d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178L6.044 6.36 3.614 3.98a.457.457 0 0 0-.686 0 .48.48 0 0 0 0 .673l2.74 2.682a.474.474 0 0 0 .686-.017L11.128 1.31a.48.48 0 0 0-.057-.657Z" />
      <path fill="currentColor" d="M14.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178L9.044 6.36l-.429-.42-.686.673.429.42a.474.474 0 0 0 .686-.017L14.128 1.31a.48.48 0 0 0-.057-.657Z" />
    </svg>
  );
};

const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessages, setSendingMessages] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { items: incomeExpenses, loading: ieLoading, addItem, deleteItem } = useIncomeExpenses();
  const { filings, loading: filingsLoading } = useFilings();
  const { isOnline: checkOnline, fetchPresence } = usePresence();

  // Onboarding check
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("user_id", user.id)
        .single();
      setOnboardingDone(data?.onboarding_completed ?? false);
    };
    checkOnboarding();
  }, [user]);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: "income" as "income" | "expense", category: "", description: "", amount: "" });

  // Real-time messaging
  const [adminId, setAdminId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const findAdmin = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1);
      if (data && data.length > 0) {
        setAdminId(data[0].user_id);
        fetchPresence([data[0].user_id]);
      }
    };
    findAdmin();
  }, []);

  const { messages, loading: messagesLoading, sendMessage, markConversationRead } = useMessages(adminId || undefined);
  const unreadMessageCount = messages.filter((m) => !m.read && m.sender_id !== user?.id).length;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (adminId && activeTab === "messages") {
      markConversationRead(adminId);
    }
  }, [messages, activeTab]);

  const handleAddEntry = async () => {
    if (!newEntry.category || !newEntry.amount) return;
    await addItem({
      type: newEntry.type,
      category: newEntry.category,
      description: newEntry.description,
      amount: parseFloat(newEntry.amount),
    });
    setNewEntry({ type: "income", category: "", description: "", amount: "" });
    setAddDialogOpen(false);
  };

  const handleSendMessage = async (receiverId: string, content: string, attachment?: { url: string; name: string; type: string }) => {
    const tempId = `sending-${Date.now()}`;
    setSendingMessages((prev) => new Set(prev).add(tempId));
    const error = await sendMessage(receiverId, content, attachment);
    setSendingMessages((prev) => {
      const next = new Set(prev);
      next.delete(tempId);
      return next;
    });
    return error;
  };

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/");
  }, [signOut, navigate]);

  // 15-minute inactivity timeout (IRS Pub 4557)
  useInactivityTimeout(handleSignOut, !!user);

  // Show onboarding if not completed
  if (onboardingDone === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!onboardingDone) {
    return <OnboardingQuestionnaire onComplete={() => setOnboardingDone(true)} />;
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "income", label: "Income & Expenses", icon: DollarSign },
    { id: "documents", label: "Documents", icon: FolderOpen },
    { id: "filings", label: "My Filings", icon: FileText },
    { id: "sign", label: "E-Sign & Approve", icon: PenLine },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: unreadMessageCount > 0 ? unreadMessageCount : undefined },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const totalIncome = incomeExpenses.filter(i => i.type === "income").reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = incomeExpenses.filter(i => i.type === "expense").reduce((s, i) => s + Number(i.amount), 0);

  const incomeExpenseColumns = [
    { key: "category", label: "Category" },
    { key: "type", label: "Type" },
    { key: "description", label: "Description" },
    { key: "amount", label: "Amount" },
    { key: "created_at", label: "Date" },
  ];

  const filingColumns = [
    { key: "form_type", label: "Form" },
    { key: "tax_year", label: "Year" },
    { key: "status", label: "Status" },
    { key: "submitted_at", label: "Filed Date" },
    { key: "irs_confirmation", label: "IRS Confirmation" },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-white/10">
        <Logo size="md" />
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === item.id
                ? "bg-white/15 text-white shadow-sm"
                : "text-white/60 hover:bg-white/8 hover:text-white/90"
            }`}
          >
            <span className="flex items-center gap-3">
              <item.icon className="h-4 w-4" />
              {item.label}
            </span>
            {item.badge && (
              <span className="bg-accent text-accent-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-semibold text-xs">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name || "Client"}</p>
            <p className="text-xs text-white/50">Client Portal</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white/90 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
          <aside className="relative w-64 h-full flex flex-col" style={{ background: "var(--gradient-hero)" }}>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 text-white/60 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"} transition-all duration-300 flex-col shrink-0`}
        style={{ background: "var(--gradient-hero)" }}>
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
              <Menu className="h-5 w-5" />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:block text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-5 w-5 transition-transform ${sidebarOpen ? "rotate-90" : "-rotate-90"}`} />
            </button>
            <h1 className="font-display text-lg font-semibold text-foreground">
              {navItems.find(n => n.id === activeTab)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationDropdown />
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="p-5 rounded-2xl border border-border bg-card shadow-elegant">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">${totalIncome.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{incomeExpenses.filter(i => i.type === "income").length} entries</p>
                </div>
                <div className="p-5 rounded-2xl border border-border bg-card shadow-elegant">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">${totalExpenses.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{incomeExpenses.filter(i => i.type === "expense").length} entries</p>
                </div>
                <div className="p-5 rounded-2xl border border-border bg-card shadow-elegant">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Net Taxable</p>
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                  <p className="text-2xl font-display font-bold text-gradient-accent">${(totalIncome - totalExpenses).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Current tax year</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card shadow-elegant p-5">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Filings</h3>
                {filingsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-accent" />
                  </div>
                ) : filings.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No filings yet. Your tax filings will appear here.</p>
                ) : (
                  <div className="space-y-3">
                    {filings.slice(0, 5).map((f) => (
                      <div key={f.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          {statusIcon(f.status || "draft")}
                          <div>
                            <p className="font-medium text-sm text-foreground">{f.form_type} — {f.tax_year}</p>
                            <p className="text-xs text-muted-foreground">{f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : "Pending"}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={
                          f.status === "filed" || f.status === "accepted" ? "bg-success/10 text-success border-success/20" :
                          f.status === "in_review" || f.status === "submitted" ? "bg-warning/10 text-warning border-warning/20" : ""
                        }>
                          {f.status || "draft"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Charts */}
              <DashboardCharts incomeExpenses={incomeExpenses} filings={filings} />
            </div>
          )}

          {/* Income & Expenses */}
          {activeTab === "income" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-display text-xl font-bold text-foreground">Income & Expenses</h2>
                <div className="flex gap-2 flex-wrap">
                  <ReceiptScanner onExtracted={(data) => {
                    addItem(data);
                  }} />
                  <ExportButtons data={incomeExpenses} filename="income-expenses" columns={incomeExpenseColumns} />
                  <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-accent text-accent-foreground hover:bg-brand-green-dark">
                        <Plus className="h-4 w-4 mr-2" /> Add Entry
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Income/Expense Entry</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-2">
                        <div>
                          <Label>Type</Label>
                          <Select value={newEntry.type} onValueChange={(v) => setNewEntry({ ...newEntry, type: v as "income" | "expense" })}>
                            <SelectTrigger className="mt-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Input className="mt-1.5" placeholder="e.g. W-2 Wages, Home Office" value={newEntry.category} onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value })} />
                        </div>
                        <div>
                          <Label>Description (optional)</Label>
                          <Input className="mt-1.5" placeholder="e.g. Acme Corp" value={newEntry.description} onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })} />
                        </div>
                        <div>
                          <Label>Amount ($)</Label>
                          <Input className="mt-1.5" type="number" min="0" step="0.01" placeholder="0.00" value={newEntry.amount} onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })} />
                        </div>
                        <Button onClick={handleAddEntry} className="w-full bg-accent text-accent-foreground hover:bg-brand-green-dark">
                          Add Entry
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {ieLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : incomeExpenses.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-display text-lg">No entries yet</p>
                  <p className="text-sm mt-1">Click "Add Entry" to start tracking your income and expenses.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card shadow-elegant overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Category</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Type</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Description</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Amount</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeExpenses.map((item) => (
                        <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3 text-sm font-medium text-foreground">{item.category}</td>
                          <td className="px-5 py-3">
                            <Badge variant="secondary" className={item.type === "income" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>
                              {item.type === "income" ? "Income" : "Expense"}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{item.description || "—"}</td>
                          <td className="px-5 py-3 text-sm font-semibold text-foreground text-right">
                            ${Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteItem(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {incomeExpenses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border border-success/20 bg-success/5">
                    <p className="text-xs text-muted-foreground">Total Income</p>
                    <p className="text-lg font-semibold text-success">${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                    <p className="text-xs text-muted-foreground">Total Expenses</p>
                    <p className="text-lg font-semibold text-destructive">${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-4 rounded-xl border border-accent/20 bg-accent/5">
                    <p className="text-xs text-muted-foreground">Net</p>
                    <p className="text-lg font-semibold text-foreground">${(totalIncome - totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents */}
          {activeTab === "documents" && <DocumentsSection />}

          {/* Filings */}
          {activeTab === "filings" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-display text-xl font-bold text-foreground">My Filings</h2>
                {filings.length > 0 && (
                  <ExportButtons data={filings} filename="my-filings" columns={filingColumns} />
                )}
              </div>
              {filingsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-accent" />
                </div>
              ) : filings.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-display text-lg">No filings yet</p>
                  <p className="text-sm mt-1">Your tax filings will appear here once submitted.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filings.map((f) => (
                    <div key={f.id} className="p-5 rounded-2xl border border-border bg-card shadow-elegant flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{f.form_type} — Tax Year {f.tax_year}</p>
                          <p className="text-sm text-muted-foreground">
                            {f.submitted_at ? `Filed: ${new Date(f.submitted_at).toLocaleDateString()}` : "Pending"}
                            {f.irs_confirmation ? ` • IRS: ${f.irs_confirmation}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className={
                          f.status === "filed" || f.status === "accepted" ? "bg-success/10 text-success border-success/20" :
                          f.status === "rejected" ? "bg-destructive/10 text-destructive border-destructive/20" :
                          f.status === "in_review" || f.status === "submitted" ? "bg-warning/10 text-warning border-warning/20" : ""
                        }>
                          {statusIcon(f.status || "draft")}
                          <span className="ml-1">{f.status || "draft"}</span>
                        </Badge>
                        {f.file_url && (
                          <Button variant="outline" size="sm" onClick={() => window.open(f.file_url!, "_blank")}>
                            <Download className="h-4 w-4 mr-1" /> Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* E-Sign */}
          {activeTab === "sign" && <ClientESignSection userId={user?.id} />}

          {/* Messages */}
          {activeTab === "messages" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl font-bold text-foreground">Messages</h2>
                {adminId && (
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${checkOnline(adminId) ? "bg-success animate-pulse" : "bg-muted-foreground/40"}`} />
                    <span className="text-xs text-muted-foreground">{checkOnline(adminId) ? "Online" : "Offline"}</span>
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-card shadow-elegant flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
                <div className="flex-1 p-5 overflow-auto space-y-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-accent" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="font-display text-lg">No messages yet</p>
                      <p className="text-sm mt-1">Send a message to your tax agent.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === user?.id;
                      const timeAgo = formatTimeAgo(msg.created_at);
                      const status: "sending" | "sent" | "delivered" | "read" = msg.read ? "read" : "delivered";
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl ${isMe ? "bg-accent/10 text-foreground" : "bg-muted text-foreground"}`}>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">{isMe ? "You" : "Tax Agent"}</p>
                            {msg.attachment_url && (
                              <div className="mb-2">
                                {msg.attachment_type?.startsWith("image/") ? (
                                  <img src={msg.attachment_url} alt={msg.attachment_name || "attachment"} className="rounded-lg max-w-full max-h-48 object-cover cursor-pointer" onClick={() => window.open(msg.attachment_url!, "_blank")} />
                                ) : (
                                  <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background/50 hover:bg-muted/50 transition-colors">
                                    <File className="h-4 w-4 text-accent shrink-0" />
                                    <span className="text-xs text-foreground truncate">{msg.attachment_name || "File"}</span>
                                    <Download className="h-3 w-3 text-muted-foreground shrink-0" />
                                  </a>
                                )}
                              </div>
                            )}
                            {msg.content && !msg.content.startsWith("📎 ") && <p className="text-sm">{msg.content}</p>}
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-[10px] text-muted-foreground/60">{timeAgo}</span>
                              {isMe && <MessageTicks status={status} />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="border-t border-border p-3 sm:p-4 flex gap-2 sm:gap-3">
                  <label className="cursor-pointer flex items-center">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !adminId || !user) return;
                        const filePath = `${user.id}/${Date.now()}_${file.name}`;
                        const { data, error } = await supabase.storage.from("message-attachments").upload(filePath, file);
                        if (error) {
                          toast({ title: "Upload Error", description: error.message, variant: "destructive" });
                          return;
                        }
                        const { data: urlData } = supabase.storage.from("message-attachments").getPublicUrl(data.path);
                        handleSendMessage(adminId, newMessage, { url: urlData.publicUrl, name: file.name, type: file.type });
                        setNewMessage("");
                        e.target.value = "";
                      }}
                    />
                    <div className="h-10 w-10 rounded-md border border-input bg-background flex items-center justify-center hover:bg-muted transition-colors">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </label>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && adminId) {
                        e.preventDefault();
                        handleSendMessage(adminId, newMessage);
                        setNewMessage("");
                      }
                    }}
                  />
                  <Button
                    className="bg-accent text-accent-foreground hover:bg-brand-green-dark"
                    disabled={!adminId || !newMessage.trim()}
                    onClick={() => {
                      if (adminId) {
                        handleSendMessage(adminId, newMessage);
                        setNewMessage("");
                      }
                    }}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-xl font-bold text-foreground">Settings</h2>
              <ProfileSettings />
              <MFASettings />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
