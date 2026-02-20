import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  FileText,
  MessageSquare,
  Send as SendIcon,
  LogOut,
  Search,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  Bell,
  Settings,
  Upload,
  TrendingUp,
  Shield,
  Inbox,
  Eye,
  PenLine,
  FolderOpen,
  FileSignature,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import AddClientDialog from "@/components/admin/AddClientDialog";
import ClientDetailsSheet from "@/components/admin/ClientDetailsSheet";
import ContractTemplateEditor from "@/components/admin/ContractTemplateEditor";
import ESignatureSection from "@/components/admin/ESignatureSection";
import DocumentsSection from "@/components/admin/DocumentsSection";
import { useMessages } from "@/hooks/useMessages";

const formatTimeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const submissions = [
  { id: 1, client: "Jane Smith", form: "1040", status: "Accepted", irsId: "IRS-2024-88712", date: "Apr 10, 2025" },
  { id: 2, client: "Bob Johnson", form: "1040", status: "Accepted", irsId: "IRS-2024-88345", date: "Apr 8, 2025" },
  { id: 3, client: "John Doe", form: "1040", status: "Pending", irsId: "—", date: "Submitted Apr 12" },
  { id: 4, client: "Acme Corp", form: "1120-S", status: "Rejected", irsId: "—", date: "Apr 5, 2025" },
];

// Admin messages are now fetched from the database

const statusColor = (status: string) => {
  switch (status) {
    case "Filed":
    case "Accepted":
    case "active":
    case "completed":
      return "bg-success/10 text-success border-success/20";
    case "In Progress":
    case "Pending":
    case "Under Review":
    case "pending":
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
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Real-time messages (admin sees all)
  const { messages: allMessages, sendMessage, markConversationRead } = useMessages();
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get unique conversations grouped by sender
  useEffect(() => {
    const fetchProfiles = async () => {
      const userIds = [...new Set(allMessages.map(m => m.sender_id === user?.id ? m.receiver_id : m.sender_id))];
      if (userIds.length === 0) return;
      const { data } = await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(p => { map[p.user_id] = p.full_name || "Client"; });
        setProfilesMap(map);
      }
    };
    fetchProfiles();
  }, [allMessages, user]);

  // Group messages into conversations by other user
  const conversations = (() => {
    if (!user) return [];
    const convMap = new Map<string, { otherUserId: string; name: string; lastMessage: string; lastTime: string; unreadCount: number }>();
    allMessages.forEach(m => {
      const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      const existing = convMap.get(otherId);
      const isUnread = !m.read && m.receiver_id === user.id;
      if (!existing || new Date(m.created_at) > new Date(existing.lastTime)) {
        convMap.set(otherId, {
          otherUserId: otherId,
          name: profilesMap[otherId] || "Client",
          lastMessage: m.content,
          lastTime: m.created_at,
          unreadCount: (existing?.unreadCount || 0) + (isUnread ? 1 : 0),
        });
      } else if (isUnread) {
        existing.unreadCount++;
      }
    });
    return Array.from(convMap.values()).sort((a, b) => new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime());
  })();

  const [selectedConvUserId, setSelectedConvUserId] = useState<string | null>(null);
  const conversationMessages = selectedConvUserId
    ? allMessages.filter(m =>
        (m.sender_id === user?.id && m.receiver_id === selectedConvUserId) ||
        (m.sender_id === selectedConvUserId && m.receiver_id === user?.id)
      )
    : [];

  // Real client data from DB
  const [dbClients, setDbClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setDbClients(data);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "EA";

  const navItems = [
    { id: "overview", label: "Dashboard", icon: Home },
    { id: "clients", label: "Clients", icon: Users },
    { id: "filings", label: "Filings & IRS", icon: FileText },
    { id: "contracts", label: "Contracts", icon: FileSignature },
    { id: "esign", label: "E-Signatures", icon: PenLine },
    { id: "documents", label: "Documents", icon: FolderOpen },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: 2 },
    { id: "inquiries", label: "Inquiries", icon: Inbox },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  // Fetch contact messages
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setContactMessages(data);
    };
    fetchMessages();
  }, [activeTab]);

  const filteredClients = dbClients.filter(
    (c) => (c.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (c.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-64" : "w-0 overflow-hidden"} transition-all duration-300 flex flex-col shrink-0`}
        style={{ background: "var(--gradient-hero)" }}>
        <div className="p-5 border-b border-white/10">
          <Logo size="md" />
          <p className="text-xs text-white/50 mt-1 flex items-center gap-1">
            <Shield className="h-3 w-3" /> Admin Portal
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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
              <p className="text-sm font-medium text-white truncate">{profile?.full_name || "Admin"}</p>
              <p className="text-xs text-white/50">Enrolled Agent</p>
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
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-5 w-5 transition-transform ${sidebarOpen ? "rotate-90" : "-rotate-90"}`} />
            </button>
            <h1 className="font-display text-lg font-semibold text-foreground">
              {navItems.find(n => n.id === activeTab)?.label || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs w-4 h-4 rounded-full flex items-center justify-center">3</span>
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {/* Overview */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {[
                  { label: "Total Clients", value: String(dbClients.length), sub: "Active clients", icon: Users, color: "bg-primary/10 text-primary" },
                  { label: "Returns Filed", value: "98", sub: "Tax Year 2024", icon: FileText, color: "bg-success/10 text-success" },
                  { label: "Pending Review", value: "12", sub: "Awaiting approval", icon: Clock, color: "bg-warning/10 text-warning" },
                  { label: "IRS Submissions", value: "86", sub: "94% acceptance", icon: TrendingUp, color: "bg-accent/10 text-accent" },
                ].map((stat) => (
                  <div key={stat.label} className="p-5 rounded-2xl border border-border bg-card shadow-elegant">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-border bg-card shadow-elegant p-5">
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

                <div className="rounded-2xl border border-border bg-card shadow-elegant p-5">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-4">New Messages</h3>
                  <div className="space-y-3">
                    {conversations.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No messages yet.</p>
                    ) : conversations.slice(0, 3).map((conv) => (
                      <div key={conv.otherUserId} className="flex items-start gap-3 py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 rounded-lg px-2 -mx-2" onClick={() => { setSelectedConvUserId(conv.otherUserId); setActiveTab("messages"); }}>
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {conv.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{conv.name}</p>
                            {conv.unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-accent" />}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatTimeAgo(conv.lastTime)}</p>
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
                <h2 className="font-display text-xl font-bold text-foreground">Clients</h2>
                <AddClientDialog onClientAdded={fetchClients} />
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

              {filteredClients.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-display text-lg">No clients yet</p>
                  <p className="text-sm mt-1">Add your first client to get started.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Client</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Phone</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Year</th>
                        <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Status</th>
                        <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredClients.map((c) => (
                        <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => { setSelectedClient(c); setDetailsOpen(true); }}>
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-foreground">{c.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{c.email || "—"}</p>
                          </td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{c.phone || "—"}</td>
                          <td className="px-5 py-3 text-sm text-muted-foreground">{c.tax_year}</td>
                          <td className="px-5 py-3">
                            <Badge className={statusColor(c.status || "pending")}>{c.status || "pending"}</Badge>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedClient(c); setDetailsOpen(true); }}>
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <ClientDetailsSheet client={selectedClient} open={detailsOpen} onOpenChange={setDetailsOpen} />
            </div>
          )}

          {/* Filings & IRS */}
          {activeTab === "filings" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-foreground">Filings & IRS Submissions</h2>
                <Button className="bg-accent text-accent-foreground hover:bg-brand-green-dark">
                  <Upload className="h-4 w-4 mr-2" /> Submit to IRS
                </Button>
              </div>
              <div className="rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
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

          {/* Contracts */}
          {activeTab === "contracts" && (
            <ContractTemplateEditor clients={dbClients} />
          )}

          {/* E-Signatures */}
          {activeTab === "esign" && (
            <ESignatureSection clients={dbClients} />
          )}

          {/* Documents */}
          {activeTab === "documents" && (
            <DocumentsSection />
          )}

          {/* Messages */}
          {activeTab === "messages" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-xl font-bold text-foreground">Client Messages</h2>
              <div className="flex gap-6" style={{ height: "calc(100vh - 200px)" }}>
                {/* Conversation List */}
                <div className="w-72 shrink-0 rounded-2xl border border-border bg-card shadow-elegant overflow-auto">
                  <div className="p-3 border-b border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversations</p>
                  </div>
                  {conversations.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">No conversations</p>
                  ) : conversations.map((conv) => (
                    <button
                      key={conv.otherUserId}
                      onClick={() => { setSelectedConvUserId(conv.otherUserId); markConversationRead(conv.otherUserId); }}
                      className={`w-full text-left p-4 border-b border-border hover:bg-muted/30 transition-colors ${selectedConvUserId === conv.otherUserId ? "bg-muted/50" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {conv.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground truncate">{conv.name}</p>
                            {conv.unreadCount > 0 && (
                              <span className="bg-accent text-accent-foreground text-xs font-bold px-1.5 py-0.5 rounded-full">{conv.unreadCount}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                          <p className="text-[10px] text-muted-foreground/60">{formatTimeAgo(conv.lastTime)}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Chat Area */}
                <div className="flex-1 rounded-2xl border border-border bg-card shadow-elegant flex flex-col">
                  {!selectedConvUserId ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="font-display text-lg">Select a conversation</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 border-b border-border">
                        <p className="font-medium text-foreground">{profilesMap[selectedConvUserId] || "Client"}</p>
                      </div>
                      <div className="flex-1 p-5 overflow-auto space-y-4">
                        {conversationMessages.map((msg) => {
                          const isMe = msg.sender_id === user?.id;
                          return (
                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-md px-4 py-3 rounded-2xl ${isMe ? "bg-accent/10 text-foreground" : "bg-muted text-foreground"}`}>
                                <p className="text-xs font-semibold text-muted-foreground mb-1">{isMe ? "You" : profilesMap[msg.sender_id] || "Client"}</p>
                                <p className="text-sm">{msg.content}</p>
                                <span className="text-[10px] text-muted-foreground/60 block text-right mt-1">{formatTimeAgo(msg.created_at)}</span>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                      <div className="border-t border-border p-4 flex gap-3">
                        <Input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Type a reply..."
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey && selectedConvUserId) {
                              e.preventDefault();
                              sendMessage(selectedConvUserId, replyText);
                              setReplyText("");
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          className="bg-accent text-accent-foreground hover:bg-brand-green-dark"
                          disabled={!replyText.trim()}
                          onClick={() => {
                            if (selectedConvUserId) {
                              sendMessage(selectedConvUserId, replyText);
                              setReplyText("");
                            }
                          }}
                        >
                          <SendIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Inquiries - Contact Form Messages */}
          {activeTab === "inquiries" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-xl font-bold text-foreground">Contact Form Inquiries</h2>
              {contactMessages.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card shadow-elegant p-12 text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No inquiries yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contactMessages.map((msg) => (
                    <div key={msg.id} className={`p-5 rounded-2xl border bg-card shadow-elegant ${!msg.read ? "border-accent/30" : "border-border"}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-foreground">{msg.name}</p>
                            {!msg.read && <Badge className="bg-accent/10 text-accent text-xs">New</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{msg.email} {msg.phone && `· ${msg.phone}`}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">{msg.subject}</p>
                      <p className="text-sm text-muted-foreground">{msg.message}</p>
                      {!msg.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-3 text-accent"
                          onClick={async () => {
                            await supabase.from("contact_messages").update({ read: true }).eq("id", msg.id);
                            setContactMessages(prev => prev.map(m => m.id === msg.id ? { ...m, read: true } : m));
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" /> Mark Read
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="font-display text-xl font-bold text-foreground">Settings</h2>
              <div className="rounded-2xl border border-border bg-card shadow-elegant p-6 max-w-lg">
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
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">API Key</label>
                    <Input defaultValue="••••••••••••" type="password" />
                  </div>
                  <Button className="bg-accent text-accent-foreground hover:bg-brand-green-dark">Save Configuration</Button>
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
