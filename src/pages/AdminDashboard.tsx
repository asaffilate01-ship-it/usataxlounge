import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Shield,
  Home,
  Users,
  FileText,
  MessageSquare,
  Send as SendIcon,
  LogOut,
  Search,
  Plus,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  Bell,
  Settings,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const clients = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "In Progress", forms: "1040", year: "2024" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Filed", forms: "1040, Sch C", year: "2024" },
  { id: 3, name: "Acme Corp", email: "acme@corp.com", status: "Pending Documents", forms: "1120-S", year: "2024" },
  { id: 4, name: "Bob Johnson", email: "bob@example.com", status: "Filed", forms: "1040", year: "2024" },
  { id: 5, name: "Alice Williams", email: "alice@example.com", status: "Under Review", forms: "1040, 1099", year: "2024" },
];

const submissions = [
  { id: 1, client: "Jane Smith", form: "1040", status: "Accepted", irsId: "IRS-2024-88712", date: "Apr 10, 2025" },
  { id: 2, client: "Bob Johnson", form: "1040", status: "Accepted", irsId: "IRS-2024-88345", date: "Apr 8, 2025" },
  { id: 3, client: "John Doe", form: "1040", status: "Pending", irsId: "—", date: "Submitted Apr 12" },
  { id: 4, client: "Acme Corp", form: "1120-S", status: "Rejected", irsId: "—", date: "Apr 5, 2025" },
];

const adminMessages = [
  { id: 1, client: "John Doe", text: "Should I upload my mortgage interest statement too?", time: "1h ago", unread: true },
  { id: 2, client: "Alice Williams", text: "When can I expect my return to be filed?", time: "3h ago", unread: true },
  { id: 3, client: "Acme Corp", text: "Here are the updated payroll records.", time: "Yesterday", unread: false },
];

const statusColor = (status: string) => {
  switch (status) {
    case "Filed":
    case "Accepted":
      return "bg-success/10 text-success border-success/20";
    case "In Progress":
    case "Pending":
    case "Under Review":
      return "bg-warning/10 text-warning border-warning/20";
    case "Pending Documents":
    case "Rejected":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "";
  }
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { id: "overview", label: "Dashboard", icon: Home },
    { id: "clients", label: "Clients", icon: Users },
    { id: "filings", label: "Filings & IRS", icon: FileText },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: 2 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const filteredClients = clients.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <p className="text-xs text-muted-foreground mt-1">Admin Portal</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
            <h1 className="font-display text-xl font-semibold text-foreground">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center">3</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-semibold text-sm">
              EA
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Clients", value: "142", sub: "+5 this month" },
                  { label: "Returns Filed", value: "98", sub: "Tax Year 2024" },
                  { label: "Pending Review", value: "12", sub: "Awaiting approval" },
                  { label: "IRS Submissions", value: "86", sub: "94% acceptance rate" },
                ].map((stat) => (
                  <div key={stat.label} className="p-5 rounded-xl border border-border bg-card shadow-elegant">
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="rounded-xl border border-border bg-card shadow-elegant p-5">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">Recent Submissions</h3>
                  <div className="space-y-3">
                    {submissions.slice(0, 3).map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.client} — {s.form}</p>
                          <p className="text-xs text-muted-foreground">{s.date}</p>
                        </div>
                        <Badge className={statusColor(s.status)}>{s.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card shadow-elegant p-5">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">New Messages</h3>
                  <div className="space-y-3">
                    {adminMessages.map((m) => (
                      <div key={m.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
                          {m.client.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{m.client}</p>
                            {m.unread && <span className="w-2 h-2 rounded-full bg-accent" />}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{m.text}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{m.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Clients */}
          {activeTab === "clients" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-foreground">Clients</h2>
                <Button className="bg-accent text-accent-foreground hover:bg-gold-dark">
                  <Plus className="h-4 w-4 mr-2" /> Add Client
                </Button>
              </div>
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clients..."
                  className="pl-10"
                />
              </div>
              <div className="rounded-xl border border-border bg-card shadow-elegant overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Client</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Forms</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Year</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Status</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </td>
                        <td className="px-5 py-3 text-sm text-foreground">{c.forms}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{c.year}</td>
                        <td className="px-5 py-3">
                          <Badge className={statusColor(c.status)}>{c.status}</Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => toast({ title: "Opening client details..." })}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Filings & IRS */}
          {activeTab === "filings" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-foreground">Filings & IRS Submissions</h2>
                <Button className="bg-accent text-accent-foreground hover:bg-gold-dark">
                  <Upload className="h-4 w-4 mr-2" /> Submit to IRS
                </Button>
              </div>
              <div className="rounded-xl border border-border bg-card shadow-elegant overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Client</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Form</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">IRS ID</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Date</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 text-sm font-medium text-foreground">{s.client}</td>
                        <td className="px-5 py-3 text-sm text-foreground">{s.form}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground font-mono">{s.irsId}</td>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{s.date}</td>
                        <td className="px-5 py-3">
                          <Badge className={statusColor(s.status)}>{s.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Messages */}
          {activeTab === "messages" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-foreground">Client Messages</h2>
              <div className="space-y-4">
                {adminMessages.map((m) => (
                  <div key={m.id} className="p-5 rounded-xl border border-border bg-card shadow-elegant">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                        {m.client.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">{m.client}</p>
                          {m.unread && <Badge className="bg-accent/10 text-accent text-xs">New</Badge>}
                          <span className="text-xs text-muted-foreground ml-auto">{m.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{m.text}</p>
                        <div className="flex gap-2 mt-3">
                          <Input
                            placeholder="Type a reply..."
                            className="flex-1"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                          />
                          <Button
                            size="sm"
                            className="bg-accent text-accent-foreground hover:bg-gold-dark"
                            onClick={() => { setReplyText(""); toast({ title: "Reply sent to " + m.client }); }}
                          >
                            <SendIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-2xl font-bold text-foreground">Settings</h2>
              <div className="rounded-xl border border-border bg-card shadow-elegant p-6 max-w-lg">
                <h3 className="font-display text-lg font-semibold text-foreground mb-4">IRS API Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">API Endpoint</label>
                    <Input defaultValue="https://api.irs.gov/v2/efile" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">EFIN</label>
                    <Input defaultValue="••••••" type="password" />
                  </div>
                  <Button className="bg-accent text-accent-foreground hover:bg-gold-dark">Save Configuration</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
