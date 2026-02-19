import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  FileText,
  DollarSign,
  MessageSquare,
  Download,
  PenLine,
  LogOut,
  Plus,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useIncomeExpenses } from "@/hooks/useIncomeExpenses";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
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

const filings = [
  { id: 1, year: "2024", type: "Form 1040", status: "Filed", date: "Apr 10, 2025", refund: "$3,240" },
  { id: 2, year: "2023", type: "Form 1040", status: "Filed", date: "Mar 28, 2024", refund: "$2,890" },
  { id: 3, year: "2024", type: "Schedule C", status: "In Review", date: "Pending", refund: "—" },
];

const messages = [
  { id: 1, from: "agent", name: "Sarah Mitchell, EA", text: "Hi! I've reviewed your W-2 and 1099. Everything looks great. I'll prepare your return by Friday.", time: "2h ago" },
  { id: 2, from: "client", name: "You", text: "Thanks Sarah! Should I upload my mortgage interest statement too?", time: "1h ago" },
  { id: 3, from: "agent", name: "Sarah Mitchell, EA", text: "Yes, please upload Form 1098. That'll help maximize your deductions.", time: "30m ago" },
];

const statusIcon = (status: string) => {
  switch (status) {
    case "Filed": return <CheckCircle2 className="h-4 w-4 text-success" />;
    case "In Review": return <Clock className="h-4 w-4 text-warning" />;
    default: return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
  }
};

const ClientDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { items: incomeExpenses, loading: ieLoading, addItem, deleteItem } = useIncomeExpenses();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: "income" as "income" | "expense", category: "", description: "", amount: "" });

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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "income", label: "Income & Expenses", icon: DollarSign },
    { id: "filings", label: "My Filings", icon: FileText },
    { id: "sign", label: "E-Sign & Approve", icon: PenLine },
    { id: "messages", label: "Messages", icon: MessageSquare },
  ];

  const totalIncome = incomeExpenses.filter(i => i.type === "income").reduce((s, i) => s + Number(i.amount), 0);
  const totalExpenses = incomeExpenses.filter(i => i.type === "expense").reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar - brand blue gradient */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0 overflow-hidden"} transition-all duration-300 flex flex-col`}
        style={{ background: "var(--gradient-hero)" }}>
        <div className="p-5 border-b border-white/10">
          <Logo size="md" />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/60 hover:bg-white/8 hover:text-white/90"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
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
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-5 w-5 transition-transform ${sidebarOpen ? "rotate-90" : "-rotate-90"}`} />
            </button>
            <h1 className="font-display text-xl font-semibold text-foreground">
              {navItems.find(n => n.id === activeTab)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-6 rounded-2xl border border-border bg-card shadow-elegant">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Income</p>
                    <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-success" />
                    </div>
                  </div>
                  <p className="text-3xl font-display font-bold text-foreground">${totalIncome.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{incomeExpenses.filter(i => i.type === "income").length} entries</p>
                </div>
                <div className="p-6 rounded-2xl border border-border bg-card shadow-elegant">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                  <p className="text-3xl font-display font-bold text-foreground">${totalExpenses.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{incomeExpenses.filter(i => i.type === "expense").length} entries</p>
                </div>
                <div className="p-6 rounded-2xl border border-border bg-card shadow-elegant">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Net Taxable</p>
                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-accent" />
                    </div>
                  </div>
                  <p className="text-3xl font-display font-bold text-gradient-accent">${(totalIncome - totalExpenses).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">Current tax year</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card shadow-elegant p-6">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Filings</h3>
                <div className="space-y-3">
                  {filings.map((f) => (
                    <div key={f.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        {statusIcon(f.status)}
                        <div>
                          <p className="font-medium text-sm text-foreground">{f.type} — {f.year}</p>
                          <p className="text-xs text-muted-foreground">{f.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={f.status === "Filed" ? "default" : "secondary"} className={f.status === "Filed" ? "bg-success/10 text-success border-success/20" : ""}>
                          {f.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{f.refund}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Income & Expenses */}
          {activeTab === "income" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-foreground">Income & Expenses</h2>
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
                <div className="rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
                  <table className="w-full">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* Filings */}
          {activeTab === "filings" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-foreground">My Filings</h2>
              <div className="space-y-4">
                {filings.map((f) => (
                  <div key={f.id} className="p-5 rounded-2xl border border-border bg-card shadow-elegant flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{f.type} — Tax Year {f.year}</p>
                        <p className="text-sm text-muted-foreground">Filed: {f.date} • Refund: {f.refund}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={f.status === "Filed" ? "default" : "secondary"} className={f.status === "Filed" ? "bg-success/10 text-success border-success/20" : ""}>
                        {statusIcon(f.status)}
                        <span className="ml-1">{f.status}</span>
                      </Badge>
                      {f.status === "Filed" && (
                        <Button variant="outline" size="sm" onClick={() => toast({ title: "Download started", description: `${f.type} ${f.year} downloading...` })}>
                          <Download className="h-4 w-4 mr-1" /> Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* E-Sign */}
          {activeTab === "sign" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-foreground">E-Sign & Approve</h2>
              <div className="p-6 rounded-2xl border border-border bg-card shadow-elegant">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    <PenLine className="h-6 w-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold text-foreground">Form 1040 — Tax Year 2024</h3>
                    <p className="text-muted-foreground text-sm mt-1">Your return is ready for review. Please review the details and sign to authorize filing.</p>
                    <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="text-sm text-foreground"><strong>Filing Status:</strong> Single</p>
                      <p className="text-sm text-foreground mt-1"><strong>Adjusted Gross Income:</strong> ${totalIncome.toLocaleString()}</p>
                      <p className="text-sm text-foreground mt-1"><strong>Total Deductions:</strong> ${totalExpenses.toLocaleString()}</p>
                      <p className="text-sm text-foreground mt-1"><strong>Net Taxable:</strong> <span className="text-accent font-semibold">${(totalIncome - totalExpenses).toLocaleString()}</span></p>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button className="bg-accent text-accent-foreground hover:bg-brand-green-dark shadow-accent" onClick={() => toast({ title: "Form Signed!", description: "Your 1040 has been approved and submitted for e-filing." })}>
                        <PenLine className="h-4 w-4 mr-2" /> E-Sign & Approve
                      </Button>
                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" /> Download PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          {activeTab === "messages" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-foreground">Messages</h2>
              <div className="rounded-2xl border border-border bg-card shadow-elegant flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
                <div className="flex-1 p-5 overflow-auto space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.from === "client" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-md px-4 py-3 rounded-2xl ${msg.from === "client" ? "bg-accent/10 text-foreground" : "bg-muted text-foreground"}`}>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">{msg.name} • {msg.time}</p>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-4 flex gap-3">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button className="bg-accent text-accent-foreground hover:bg-brand-green-dark" onClick={() => { setNewMessage(""); toast({ title: "Message sent" }); }}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ClientDashboard;
