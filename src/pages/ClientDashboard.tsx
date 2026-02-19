import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Home,
  FileText,
  DollarSign,
  MessageSquare,
  Download,
  PenLine,
  LogOut,
  Upload,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const filings = [
  { id: 1, year: "2024", type: "Form 1040", status: "Filed", date: "Apr 10, 2025", refund: "$3,240" },
  { id: 2, year: "2023", type: "Form 1040", status: "Filed", date: "Mar 28, 2024", refund: "$2,890" },
  { id: 3, year: "2024", type: "Schedule C", status: "In Review", date: "Pending", refund: "—" },
];

const incomeExpenses = [
  { id: 1, category: "W-2 Wages", type: "Income", amount: "$85,000", source: "Acme Corp" },
  { id: 2, category: "1099-INT", type: "Income", amount: "$1,200", source: "Chase Bank" },
  { id: 3, category: "Home Office", type: "Expense", amount: "$4,800", source: "Deduction" },
  { id: 4, category: "Health Insurance", type: "Expense", amount: "$6,000", source: "Deduction" },
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0 overflow-hidden"} transition-all duration-300 border-r border-border bg-card flex flex-col`}>
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-7 w-7 text-accent" />
            <span className="font-display text-lg font-bold text-foreground">
              Tax<span className="text-accent">Lounge</span>
            </span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-5 w-5 transition-transform ${sidebarOpen ? "rotate-90" : "-rotate-90"}`} />
            </button>
            <h1 className="font-display text-xl font-semibold text-foreground">Client Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground mr-2 hidden sm:inline">{profile?.full_name}</span>
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
              {initials}
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl border border-border bg-card shadow-elegant">
                  <p className="text-sm text-muted-foreground mb-1">Tax Year 2024</p>
                  <p className="text-2xl font-display font-bold text-foreground">In Progress</p>
                  <Badge className="mt-2 bg-warning/10 text-warning border-warning/20">Under Review</Badge>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card shadow-elegant">
                  <p className="text-sm text-muted-foreground mb-1">Estimated Refund</p>
                  <p className="text-2xl font-display font-bold text-gradient-gold">$3,240</p>
                  <p className="text-xs text-muted-foreground mt-2">Based on current filings</p>
                </div>
                <div className="p-5 rounded-xl border border-border bg-card shadow-elegant">
                  <p className="text-sm text-muted-foreground mb-1">Documents</p>
                  <p className="text-2xl font-display font-bold text-foreground">6 Uploaded</p>
                  <p className="text-xs text-success mt-2">All documents received</p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card shadow-elegant p-5">
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
                <Button className="bg-accent text-accent-foreground hover:bg-gold-dark">
                  <Plus className="h-4 w-4 mr-2" /> Add Entry
                </Button>
              </div>
              <div className="rounded-xl border border-border bg-card shadow-elegant overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Category</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Type</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Source</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeExpenses.map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-foreground">{item.category}</td>
                        <td className="px-5 py-3">
                          <Badge variant="secondary" className={item.type === "Income" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>
                            {item.type}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{item.source}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-foreground text-right">{item.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Filings */}
          {activeTab === "filings" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-foreground">My Filings</h2>
              <div className="space-y-4">
                {filings.map((f) => (
                  <div key={f.id} className="p-5 rounded-xl border border-border bg-card shadow-elegant flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
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
              <div className="p-6 rounded-xl border border-border bg-card shadow-elegant">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                    <PenLine className="h-6 w-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg font-semibold text-foreground">Form 1040 — Tax Year 2024</h3>
                    <p className="text-muted-foreground text-sm mt-1">Your return is ready for review. Please review the details and sign to authorize filing.</p>
                    <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                      <p className="text-sm text-foreground"><strong>Filing Status:</strong> Single</p>
                      <p className="text-sm text-foreground mt-1"><strong>Adjusted Gross Income:</strong> $85,000</p>
                      <p className="text-sm text-foreground mt-1"><strong>Total Tax:</strong> $12,400</p>
                      <p className="text-sm text-foreground mt-1"><strong>Estimated Refund:</strong> <span className="text-success font-semibold">$3,240</span></p>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button className="bg-accent text-accent-foreground hover:bg-gold-dark shadow-gold" onClick={() => toast({ title: "Form Signed!", description: "Your 1040 has been approved and submitted for e-filing." })}>
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
              <div className="rounded-xl border border-border bg-card shadow-elegant flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
                <div className="flex-1 p-5 overflow-auto space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.from === "client" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-md px-4 py-3 rounded-xl ${msg.from === "client" ? "bg-accent/10 text-foreground" : "bg-muted text-foreground"}`}>
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
                  <Button className="bg-accent text-accent-foreground hover:bg-gold-dark" onClick={() => { setNewMessage(""); toast({ title: "Message sent" }); }}>
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
